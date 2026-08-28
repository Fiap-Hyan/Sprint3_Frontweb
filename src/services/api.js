/* ============================================================================
 * Integrações de IA do StudyCam AI — Google Gemini
 * ----------------------------------------------------------------------------
 * Este arquivo concentra TODAS as chamadas de API do projeto: OCR da captura,
 * resumo da anotação e classificação da matéria. A chave é lida de
 * `VITE_GOOGLE_API_KEY` (arquivo `.env` da raiz).
 *
 * Todas as funções devolvem `{ ok: true, ... }` em caso de sucesso ou
 * `{ ok: false, mensagem }` quando a chamada falha, para que a interface nunca
 * quebre por causa da rede.
 * ==========================================================================*/

/** Chave lida do `.env` (o Vite expõe apenas variáveis com prefixo VITE_). */
export const CHAVE_API = import.meta.env.VITE_GOOGLE_API_KEY ?? ''

/** Indica se as chamadas de IA podem ser feitas. */
export const INTEGRACAO_ATIVA = CHAVE_API.length > 0

const MODELO = 'gemini-3.5-flash-lite'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`

/** Separa o cabeçalho de uma data URL (`data:image/png;base64,…`). */
const separarDataUrl = (dataUrl) => {
  const partes = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '')
  return partes ? { mimeType: partes[1], data: partes[2] } : null
}

/** Converte a resposta do modelo em objeto, tolerando cercas de código. */
const lerJson = (texto) => {
  const limpo = texto
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim()
  return JSON.parse(limpo)
}

/** Mantém um número dentro da faixa de confiança usada nas telas (0 a 100). */
const confiancaValida = (valor) => {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return 0
  return Math.max(0, Math.min(100, Math.round(numero)))
}

/**
 * Estados em que o Gemini costuma se recuperar sozinho: fila cheia (429) e
 * sobrecarga do modelo (5xx). Nesses casos a chamada é repetida antes de
 * desistir, para o usuário não ver um erro por causa de um pico de demanda.
 */
const STATUS_TEMPORARIOS = [429, 500, 502, 503, 504]
const TENTATIVAS = 3

const esperar = (milissegundos) =>
  new Promise((resolve) => {
    setTimeout(resolve, milissegundos)
  })

/**
 * Chamada ao endpoint `generateContent` do Gemini, com novas tentativas
 * quando o serviço responde que está sobrecarregado.
 * @param {Array<object>} partes conteúdo enviado ao modelo (texto e/ou imagem)
 * @param {{instrucao?:string, esquema?:object}} opcoes
 * @returns {Promise<string>} texto devolvido pelo modelo
 */
const chamarGemini = async (partes, { instrucao, esquema } = {}) => {
  const corpo = JSON.stringify({
    contents: [{ role: 'user', parts: partes }],
    ...(instrucao ? { systemInstruction: { parts: [{ text: instrucao }] } } : {}),
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      ...(esquema ? { responseSchema: esquema } : {}),
    },
  })

  let ultimoErro = new Error('O Gemini não respondeu.')

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa += 1) {
    let resposta = null

    try {
      resposta = await fetch(`${ENDPOINT}?key=${encodeURIComponent(CHAVE_API)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: corpo,
      })
    } catch {
      ultimoErro = new Error('Não foi possível falar com o Gemini. Verifique a conexão.')
    }

    if (resposta && resposta.ok) {
      const dados = await resposta.json()
      const texto = (dados?.candidates?.[0]?.content?.parts || [])
        .map((parte) => parte.text || '')
        .join('')
        .trim()

      if (texto) return texto
      ultimoErro = new Error('O modelo não devolveu conteúdo.')
    } else if (resposta) {
      const detalhe = await resposta.json().catch(() => null)
      ultimoErro = new Error(detalhe?.error?.message || `O Gemini respondeu ${resposta.status}.`)
      // Erro de chave, de cota ou de pedido inválido não melhora se repetir.
      if (!STATUS_TEMPORARIOS.includes(resposta.status)) throw ultimoErro
    }

    if (tentativa < TENTATIVAS) await esperar(700 * tentativa)
  }

  throw ultimoErro
}

/** Resposta padrão quando a chamada não pôde ser concluída. */
const falha = (erro, padrao) => ({ ok: false, mensagem: erro?.message || padrao })

/**
 * OCR da captura: extrai o texto do quadro/slide fotografado.
 * @param {string} imagemBase64 imagem da captura (data URL)
 * @returns {Promise<{ok:boolean, texto?:string, confianca?:number, mensagem?:string}>}
 */
export const reconhecerTexto = async (imagemBase64) => {
  if (!INTEGRACAO_ATIVA) return { ok: false, mensagem: 'Chave de IA não configurada.' }

  const imagem = separarDataUrl(imagemBase64)
  if (!imagem) return { ok: false, mensagem: 'Esta anotação não tem imagem para reconhecer.' }

  try {
    const resposta = await chamarGemini(
      [
        { text: 'Transcreva o conteúdo desta foto de quadro, slide ou caderno.' },
        { inline_data: { mime_type: imagem.mimeType, data: imagem.data } },
      ],
      {
        instrucao:
          'Você faz OCR de fotos de aula. Devolva o texto exatamente como aparece na imagem, ' +
          'preservando a ordem das linhas e sem comentários. Em "confianca", informe de 0 a 100 ' +
          'o quanto o texto está legível.',
        esquema: {
          type: 'object',
          properties: {
            texto: { type: 'string' },
            confianca: { type: 'number' },
          },
          required: ['texto', 'confianca'],
        },
      },
    )

    const dados = lerJson(resposta)
    return {
      ok: true,
      texto: String(dados.texto || '').trim(),
      confianca: confiancaValida(dados.confianca),
    }
  } catch (erro) {
    return falha(erro, 'Não foi possível reconhecer o texto da imagem.')
  }
}

/** Deixa a lista de perguntas no formato usado pela tela (opções + índice certo). */
const quizValido = (perguntas) => {
  if (!Array.isArray(perguntas)) return []
  return perguntas
    .map((item) => {
      const opcoes = Array.isArray(item?.opcoes) ? item.opcoes.map(String) : []
      const correta = Number(item?.correta)
      return {
        pergunta: String(item?.pergunta || '').trim(),
        opcoes,
        correta: Number.isInteger(correta) ? Math.max(0, Math.min(opcoes.length - 1, correta)) : 0,
      }
    })
    .filter((item) => item.pergunta && item.opcoes.length >= 2)
}

/** Limpa uma lista de textos curtos (palavras-chave e pontos-chave). */
const listaDeTextos = (valor, limite) =>
  (Array.isArray(valor) ? valor : [])
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, limite)

/** Formato pedido ao modelo quando o usuário manda gerar o quiz. */
const ESQUEMA_QUIZ = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      pergunta: { type: 'string' },
      opcoes: { type: 'array', items: { type: 'string' } },
      correta: { type: 'integer' },
    },
    required: ['pergunta', 'opcoes', 'correta'],
  },
}

/** Instrução comum às 3 perguntas do quiz (2 de múltipla escolha + 1 para julgar). */
const INSTRUCAO_QUIZ =
  'Devolva "quiz" com exatamente 3 perguntas sobre o conteúdo — as duas primeiras de ' +
  'múltipla escolha com 4 alternativas, e a terceira uma afirmação para julgar, com as ' +
  'opções exatamente ["Correto", "Incorreto"]. Em "correta", informe o índice (começando ' +
  'em 0) da alternativa certa.'

/**
 * Análise da anotação, exibida na tela de leitura: assunto identificado,
 * palavras-chave, resumo e pontos-chave. O quiz não vem junto: ele é gerado
 * depois, quando o usuário pede, por `gerarQuiz`.
 * @param {{titulo:string, texto:string|null, imagem:string|null}} nota
 * @returns {Promise<{ok:boolean, titulo?:string, palavrasChave?:string[], resumo?:string,
 *   pontosChave?:string[], mensagem?:string}>}
 */
export const gerarResumo = async (nota) => {
  if (!INTEGRACAO_ATIVA) return { ok: false, mensagem: 'Chave de IA não configurada.' }

  const imagem = separarDataUrl(nota?.imagem)
  const conteudo = (nota?.texto || '').trim()
  const tema = (nota?.titulo || '').trim()

  if (!conteudo && !imagem && !tema) {
    return { ok: false, mensagem: 'Esta anotação ainda não tem conteúdo para analisar.' }
  }

  try {
    const cabecalho = `Título da anotação: ${tema || 'sem título'}.`
    let corpo = `${cabecalho}\n\nUse o tema do título como conteúdo da aula.`
    if (conteudo) corpo = `${cabecalho}\n\nConteúdo:\n${conteudo}`
    else if (imagem) corpo = `${cabecalho}\n\nUse a imagem em anexo como conteúdo.`

    const partes = [{ text: corpo }]
    if (!conteudo && imagem) {
      partes.push({ inline_data: { mime_type: imagem.mimeType, data: imagem.data } })
    }

    const resposta = await chamarGemini(partes, {
      instrucao:
        'Você analisa anotações de estudo e responde em português do Brasil. Devolva: ' +
        '"titulo" com o assunto identificado (no máximo 6 palavras, sem ponto final); ' +
        '"palavrasChave" com 3 a 5 termos de uma ou duas palavras; ' +
        '"resumo" com 4 a 6 frases corridas, em um único parágrafo; e ' +
        '"pontosChave" com 5 frases curtas.',
      esquema: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          palavrasChave: { type: 'array', items: { type: 'string' } },
          resumo: { type: 'string' },
          pontosChave: { type: 'array', items: { type: 'string' } },
        },
        required: ['titulo', 'palavrasChave', 'resumo', 'pontosChave'],
      },
    })

    const dados = lerJson(resposta)
    return {
      ok: true,
      titulo: String(dados.titulo || tema).trim(),
      palavrasChave: listaDeTextos(dados.palavrasChave, 6),
      resumo: String(dados.resumo || '').trim(),
      pontosChave: listaDeTextos(dados.pontosChave, 6),
    }
  } catch (erro) {
    return falha(erro, 'Não foi possível analisar a anotação agora.')
  }
}

/**
 * Quiz da anotação, gerado só quando o usuário toca em "Gere um quiz!".
 * @param {{titulo:string, resumo:string|null, texto:string|null}} nota
 * @returns {Promise<{ok:boolean, quiz?:Array<{pergunta:string, opcoes:string[],
 *   correta:number}>, mensagem?:string}>}
 */
export const gerarQuiz = async (nota) => {
  if (!INTEGRACAO_ATIVA) return { ok: false, mensagem: 'Chave de IA não configurada.' }

  const conteudo = [nota?.resumo, nota?.texto]
    .map((parte) => (parte || '').trim())
    .filter(Boolean)
    .join('\n\n')
  const tema = (nota?.titulo || '').trim()

  if (!conteudo && !tema) {
    return { ok: false, mensagem: 'Esta anotação ainda não tem conteúdo para o quiz.' }
  }

  try {
    const cabecalho = `Título da anotação: ${tema || 'sem título'}.`
    const resposta = await chamarGemini(
      [
        {
          text: conteudo
            ? `${cabecalho}\n\nConteúdo:\n${conteudo}`
            : `${cabecalho}\n\nUse o tema do título como conteúdo da aula.`,
        },
      ],
      {
        instrucao: `Você cria quizzes de estudo em português do Brasil. ${INSTRUCAO_QUIZ}`,
        esquema: {
          type: 'object',
          properties: { quiz: ESQUEMA_QUIZ },
          required: ['quiz'],
        },
      },
    )

    const quiz = quizValido(lerJson(resposta).quiz)
    if (!quiz.length) return { ok: false, mensagem: 'O modelo não devolveu perguntas.' }

    return { ok: true, quiz }
  } catch (erro) {
    return falha(erro, 'Não foi possível gerar o quiz agora.')
  }
}

/**
 * Classificação da captura em uma matéria já existente.
 * @param {string|null} texto conteúdo reconhecido na captura
 * @param {Array<{id:string, nome:string}>} albuns matérias disponíveis
 * @returns {Promise<{ok:boolean, albumId?:string, confianca?:number, mensagem?:string}>}
 */
export const sugerirMateria = async (texto, albuns) => {
  if (!INTEGRACAO_ATIVA) return { ok: false, mensagem: 'Chave de IA não configurada.' }

  const conteudo = (texto || '').trim()
  if (!conteudo) return { ok: false, mensagem: 'Sem texto reconhecido para classificar.' }
  if (!albuns?.length) return { ok: false, mensagem: 'Nenhuma matéria cadastrada.' }

  try {
    const lista = albuns.map((album) => `${album.id} = ${album.nome}`).join('\n')
    const resposta = await chamarGemini(
      [{ text: `Matérias disponíveis:\n${lista}\n\nConteúdo da captura:\n${conteudo}` }],
      {
        instrucao:
          'Escolha a matéria mais provável para o conteúdo. Responda com o "albumId" exatamente ' +
          'como aparece na lista e com a "confianca" de 0 a 100.',
        esquema: {
          type: 'object',
          properties: {
            albumId: { type: 'string' },
            confianca: { type: 'number' },
          },
          required: ['albumId', 'confianca'],
        },
      },
    )

    const dados = lerJson(resposta)
    const escolhido = albuns.find((album) => album.id === dados.albumId)
    if (!escolhido) return { ok: false, mensagem: 'O modelo não reconheceu nenhuma matéria.' }

    return { ok: true, albumId: escolhido.id, confianca: confiancaValida(dados.confianca) }
  } catch (erro) {
    return falha(erro, 'Não foi possível sugerir a matéria.')
  }
}

export default { INTEGRACAO_ATIVA, reconhecerTexto, gerarResumo, gerarQuiz, sugerirMateria }
