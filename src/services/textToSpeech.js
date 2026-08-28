/* ============================================================================
 * Leitura em voz alta das anotações (acessibilidade do StudyCam AI)
 * ----------------------------------------------------------------------------
 * A síntese usa o Google Cloud Text-to-Speech com a chave `VITE_GOOGLE_TTS_KEY`
 * (arquivo `.env` da raiz). Se a requisição não puder ser concluída, a leitura
 * continua pela síntese nativa do navegador (`window.speechSynthesis`), de forma
 * que o recurso nunca fica indisponível para o usuário.
 * ==========================================================================*/

/** Chave lida do `.env` (o Vite expõe apenas variáveis com prefixo VITE_). */
export const CHAVE_TTS = import.meta.env.VITE_GOOGLE_TTS_KEY ?? ''

/** Indica se a síntese em nuvem pode ser usada. */
export const TTS_ATIVO = CHAVE_TTS.length > 0

const ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize'

/** Limite de caracteres por requisição aceito pelo serviço. */
const LIMITE = 4800

/** Vozes oferecidas na tela de Ajustes. */
export const VOZES = [
  { id: 'pt-BR-Neural2-A', rotulo: 'Ana (pt-BR, neural)' },
  { id: 'pt-BR-Neural2-B', rotulo: 'Bruno (pt-BR, neural)' },
  { id: 'pt-BR-Wavenet-C', rotulo: 'Clara (pt-BR, WaveNet)' },
]

/** Áudio em reprodução, guardado para que `parar()` possa interrompê-lo. */
let audioAtual = null

/** Caminho alternativo: síntese nativa do navegador, sem chave. */
const falarNoNavegador = (texto, velocidade, aoTerminar) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { ok: false, mensagem: 'Este navegador não tem suporte a síntese de voz.' }
  }
  window.speechSynthesis.cancel()
  const fala = new SpeechSynthesisUtterance(texto)
  fala.lang = 'pt-BR'
  fala.rate = velocidade
  fala.onend = aoTerminar
  fala.onerror = aoTerminar
  window.speechSynthesis.speak(fala)
  return { ok: true, mensagem: 'Lendo a anotação com a voz do navegador' }
}

/**
 * Lê um texto em voz alta.
 * @param {string} texto conteúdo da anotação
 * @param {{voz?:string, velocidade?:number, aoTerminar?:function}} opcoes `aoTerminar` é
 *   chamado quando a leitura acaba (ou é interrompida), para a tela voltar ao botão de ouvir
 * @returns {Promise<{ok:boolean, mensagem:string}>}
 */
export const falar = async (
  texto,
  { voz = VOZES[0].id, velocidade = 1, aoTerminar = () => {} } = {},
) => {
  const conteudo = (texto || '').trim().slice(0, LIMITE)
  if (!conteudo) return { ok: false, mensagem: 'Esta anotação não tem texto para ler.' }

  parar()

  if (!TTS_ATIVO) return falarNoNavegador(conteudo, velocidade, aoTerminar)

  try {
    const resposta = await fetch(`${ENDPOINT}?key=${encodeURIComponent(CHAVE_TTS)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: conteudo },
        voice: { languageCode: 'pt-BR', name: voz },
        audioConfig: { audioEncoding: 'MP3', speakingRate: velocidade },
      }),
    })

    if (!resposta.ok) throw new Error(`O serviço de voz respondeu ${resposta.status}.`)

    const { audioContent } = await resposta.json()
    if (!audioContent) throw new Error('O serviço de voz não devolveu áudio.')

    audioAtual = new Audio(`data:audio/mp3;base64,${audioContent}`)
    audioAtual.onended = () => {
      audioAtual = null
      aoTerminar()
    }
    audioAtual.onerror = aoTerminar
    await audioAtual.play()
    return { ok: true, mensagem: 'Lendo a anotação em voz alta' }
  } catch {
    // A chave pode não ter o Text-to-Speech habilitado: cai para a voz nativa.
    return falarNoNavegador(conteudo, velocidade, aoTerminar)
  }
}

/** Interrompe a leitura em andamento (em nuvem ou nativa). */
export const parar = () => {
  let interrompeu = false

  if (audioAtual) {
    audioAtual.pause()
    audioAtual.currentTime = 0
    audioAtual = null
    interrompeu = true
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    if (window.speechSynthesis.speaking) interrompeu = true
    window.speechSynthesis.cancel()
  }

  return interrompeu
}

/** Indica se o recurso pode ser oferecido ao usuário. */
export const disponivel = () =>
  TTS_ATIVO || (typeof window !== 'undefined' && 'speechSynthesis' in window)

export default { TTS_ATIVO, falar, parar, disponivel, VOZES }
