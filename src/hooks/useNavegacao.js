import { useCallback, useState } from 'react'

/**
 * Navegação em pilha, imitando o comportamento do Android: cada tela empilha
 * sobre a anterior e o botão "voltar" da barra do sistema desempilha.
 */
const TELA_INICIAL = { nome: 'camera', parametro: null }

const useNavegacao = () => {
  const [pilha, setPilha] = useState([TELA_INICIAL])

  const abrir = useCallback((nome, parametro = null) => {
    setPilha((atual) => [...atual, { nome, parametro }])
  }, [])

  const voltar = useCallback(() => {
    setPilha((atual) => (atual.length > 1 ? atual.slice(0, -1) : atual))
  }, [])

  const inicio = useCallback(() => setPilha([TELA_INICIAL]), [])

  const substituir = useCallback((nome, parametro = null) => {
    setPilha((atual) => [...atual.slice(0, -1), { nome, parametro }])
  }, [])

  return {
    tela: pilha[pilha.length - 1],
    profundidade: pilha.length,
    abrir,
    voltar,
    inicio,
    substituir,
  }
}

export default useNavegacao
