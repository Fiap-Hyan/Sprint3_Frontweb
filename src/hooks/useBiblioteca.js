import { useCallback, useMemo } from 'react'

import { ALBUNS_INICIAIS, NOTAS_INICIAIS } from '../data/biblioteca-inicial'
import { LISTA_CORES } from '../data/cores'
import { diasDesde, percentual } from '../utils/formato'
import { gerarId, sortear } from '../utils/aleatorio'
import useLocalStorage from './useLocalStorage'

const RETENCAO_LIXEIRA = 30

/**
 * Hook customizado com toda a regra de negócio da biblioteca de anotações:
 * álbuns (matérias), anotações, lixeira, histórico e estatísticas.
 * A parte visual só recebe dados prontos e funções por props.
 */
const useBiblioteca = () => {
  const [albuns, setAlbuns] = useLocalStorage('studycam:albuns', ALBUNS_INICIAIS)
  const [notas, setNotas] = useLocalStorage('studycam:notas', NOTAS_INICIAIS)
  const [historico, setHistorico] = useLocalStorage('studycam:historico', [])

  const registrar = useCallback(
    (acao, titulo, detalhe = '') => {
      setHistorico((atual) =>
        [
          { id: gerarId('ev'), acao, titulo, detalhe, data: new Date().toISOString() },
          ...atual,
        ].slice(0, 60),
      )
    },
    [setHistorico],
  )

  // ---------------------------------------------------------------- derivados
  const albunsOrdenados = useMemo(() => [...albuns].sort((a, b) => a.ordem - b.ordem), [albuns])

  const notasAtivas = useMemo(() => notas.filter((nota) => !nota.excluidaEm), [notas])

  const notasNaLixeira = useMemo(
    () =>
      notas
        .filter((nota) => nota.excluidaEm)
        .sort((a, b) => new Date(b.excluidaEm) - new Date(a.excluidaEm)),
    [notas],
  )

  const totalNotas = notasAtivas.length

  const ultimaAtualizacao = useMemo(() => {
    if (!notasAtivas.length) return null
    return notasAtivas.reduce(
      (maisRecente, nota) => (nota.criadoEm > maisRecente ? nota.criadoEm : maisRecente),
      notasAtivas[0].criadoEm,
    )
  }, [notasAtivas])

  const contarNotas = useCallback(
    (albumId) => notasAtivas.filter((nota) => nota.albumId === albumId).length,
    [notasAtivas],
  )

  const notasDoAlbum = useCallback(
    (albumId) =>
      notasAtivas
        .filter((nota) => nota.albumId === albumId)
        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)),
    [notasAtivas],
  )

  const notasRecentes = useCallback(
    (quantidade = 6) =>
      [...notasAtivas]
        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
        .slice(0, quantidade),
    [notasAtivas],
  )

  const buscar = useCallback(
    (termo) => {
      const texto = termo.trim().toLowerCase()
      if (!texto) return []
      return notasAtivas.filter((nota) => {
        const album = albuns.find((item) => item.id === nota.albumId)
        const alvo = [nota.titulo, nota.tipo, album ? album.nome : ''].join(' ').toLowerCase()
        return alvo.includes(texto)
      })
    },
    [albuns, notasAtivas],
  )

  /** Estatísticas por matéria e por período - usadas na tela de histórico. */
  const estatisticas = useMemo(() => {
    const porMateria = albunsOrdenados.map((album) => {
      const quantidade = notasAtivas.filter((nota) => nota.albumId === album.id).length
      return { ...album, quantidade, participacao: percentual(quantidade, totalNotas) }
    })

    const naSemana = notasAtivas.filter((nota) => diasDesde(nota.criadoEm) < 7).length
    const noMes = notasAtivas.filter((nota) => diasDesde(nota.criadoEm) < 30).length
    const confiancas = notasAtivas.map((nota) => nota.confiancaIA || 0)
    const confiancaMedia = confiancas.length
      ? Math.round(confiancas.reduce((soma, valor) => soma + valor, 0) / confiancas.length)
      : 0

    return {
      porMateria,
      naSemana,
      noMes,
      confiancaMedia,
      confiancaMaxima: confiancas.length ? Math.max(...confiancas) : 0,
      confiancaMinima: confiancas.length ? Math.min(...confiancas) : 0,
      mediaPorMateria: albunsOrdenados.length
        ? Math.round((totalNotas / albunsOrdenados.length) * 10) / 10
        : 0,
    }
  }, [albunsOrdenados, notasAtivas, totalNotas])

  // ------------------------------------------------------------------- notas
  const adicionarNota = useCallback(
    (dados) => {
      const nova = {
        id: gerarId('nota'),
        titulo: 'Nova anotação',
        albumId: null,
        tipo: 'quadro',
        criadoEm: new Date().toISOString(),
        imagem: null,
        confiancaIA: 0,
        favorita: false,
        privada: false,
        resumo: null,
        palavrasChave: [],
        pontosChave: [],
        quiz: [],
        texto: null,
        excluidaEm: null,
        ...dados,
      }
      setNotas((atual) => [nova, ...atual])
      registrar('criou', nova.titulo, 'nova captura adicionada')
      return nova
    },
    [registrar, setNotas],
  )

  const atualizarNota = useCallback(
    (id, campos, descricao = 'anotação editada') => {
      let titulo = ''
      setNotas((atual) =>
        atual.map((nota) => {
          if (nota.id !== id) return nota
          titulo = campos.titulo || nota.titulo
          return { ...nota, ...campos }
        }),
      )
      registrar('editou', titulo, descricao)
    },
    [registrar, setNotas],
  )

  const excluirNota = useCallback(
    (id) => {
      let titulo = ''
      setNotas((atual) =>
        atual.map((nota) => {
          if (nota.id !== id) return nota
          titulo = nota.titulo
          return { ...nota, excluidaEm: new Date().toISOString() }
        }),
      )
      registrar('removeu', titulo, 'movida para a lixeira')
    },
    [registrar, setNotas],
  )

  const restaurarNota = useCallback(
    (id) => {
      let titulo = ''
      setNotas((atual) =>
        atual.map((nota) => {
          if (nota.id !== id) return nota
          titulo = nota.titulo
          return { ...nota, excluidaEm: null }
        }),
      )
      registrar('restaurou', titulo, 'recuperada da lixeira')
    },
    [registrar, setNotas],
  )

  const excluirDefinitivo = useCallback(
    (id) => {
      let titulo = ''
      setNotas((atual) =>
        atual.filter((nota) => {
          if (nota.id === id) titulo = nota.titulo
          return nota.id !== id
        }),
      )
      registrar('removeu', titulo, 'excluída definitivamente')
    },
    [registrar, setNotas],
  )

  const esvaziarLixeira = useCallback(() => {
    setNotas((atual) => atual.filter((nota) => !nota.excluidaEm))
    registrar('removeu', 'Lixeira', 'lixeira esvaziada')
  }, [registrar, setNotas])

  // ------------------------------------------------------------------ álbuns
  const criarAlbum = useCallback(
    (nome, cor) => {
      const novo = {
        id: gerarId('alb'),
        nome: nome.trim() || 'Nova matéria',
        cor: cor || sortear(LISTA_CORES),
        ordem: albuns.length,
        criadoEm: new Date().toISOString(),
      }
      setAlbuns((atual) => [...atual, novo])
      registrar('album', novo.nome, 'matéria criada')
      return novo
    },
    [albuns.length, registrar, setAlbuns],
  )

  const renomearAlbum = useCallback(
    (id, nome) => {
      setAlbuns((atual) =>
        atual.map((album) =>
          album.id === id ? { ...album, nome: nome.trim() || album.nome } : album,
        ),
      )
      registrar('album', nome, 'matéria renomeada')
    },
    [registrar, setAlbuns],
  )

  const alterarCorAlbum = useCallback(
    (id, cor) => {
      let nome = ''
      setAlbuns((atual) =>
        atual.map((album) => {
          if (album.id !== id) return album
          nome = album.nome
          return { ...album, cor }
        }),
      )
      registrar('album', nome, 'cor alterada')
    },
    [registrar, setAlbuns],
  )

  const excluirAlbum = useCallback(
    (id) => {
      let nome = ''
      setAlbuns((atual) =>
        atual.filter((album) => {
          if (album.id === id) nome = album.nome
          return album.id !== id
        }),
      )
      const agora = new Date().toISOString()
      setNotas((atual) =>
        atual.map((nota) =>
          nota.albumId === id ? { ...nota, excluidaEm: nota.excluidaEm || agora } : nota,
        ),
      )
      registrar('album', nome, 'matéria excluída (anotações foram para a lixeira)')
    },
    [registrar, setAlbuns, setNotas],
  )

  /** Reordena manualmente as matérias (requisito "organização livre"). */
  const moverAlbum = useCallback(
    (id, direcao) => {
      setAlbuns((atual) => {
        const lista = [...atual].sort((a, b) => a.ordem - b.ordem)
        const indice = lista.findIndex((album) => album.id === id)
        const destino = indice + direcao
        if (indice < 0 || destino < 0 || destino >= lista.length) return atual
        const copia = [...lista]
        const [movido] = copia.splice(indice, 1)
        copia.splice(destino, 0, movido)
        return copia.map((album, posicao) => ({ ...album, ordem: posicao }))
      })
    },
    [setAlbuns],
  )

  const restaurarPadrao = useCallback(() => {
    setAlbuns(ALBUNS_INICIAIS)
    setNotas(NOTAS_INICIAIS)
    setHistorico([])
  }, [setAlbuns, setHistorico, setNotas])

  return {
    albuns: albunsOrdenados,
    notas: notasAtivas,
    notasNaLixeira,
    historico,
    totalNotas,
    ultimaAtualizacao,
    estatisticas,
    retencaoLixeira: RETENCAO_LIXEIRA,
    contarNotas,
    notasDoAlbum,
    notasRecentes,
    buscar,
    adicionarNota,
    atualizarNota,
    excluirNota,
    restaurarNota,
    excluirDefinitivo,
    esvaziarLixeira,
    criarAlbum,
    renomearAlbum,
    alterarCorAlbum,
    excluirAlbum,
    moverAlbum,
    restaurarPadrao,
  }
}

export default useBiblioteca
