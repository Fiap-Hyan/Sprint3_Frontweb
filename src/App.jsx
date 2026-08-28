import { useEffect } from 'react'

import PaginaAplicativo from './paginas/PaginaAplicativo'
import PaginaSite from './paginas/PaginaSite'
import useRota from './hooks/useRota'

const TITULOS = {
  site: 'StudyCam AI · JOVI Eng. Software Challenge',
  app: 'StudyCam AI | Câmera JOVI',
}

/**
 * Raiz do projeto: escolhe, pela rota, entre a landing page (`#/`) e o
 * protótipo do aplicativo (`#/app`). O atributo `data-pagina` no <html> é o que
 * separa os dois conjuntos de estilos — a landing rola a página e tem tema
 * claro/escuro, o aplicativo ocupa a tela inteira com fundo escuro fixo.
 */
const App = () => {
  const rota = useRota()

  useEffect(() => {
    document.documentElement.setAttribute('data-pagina', rota)
    document.title = TITULOS[rota]

    if (rota === 'app') {
      window.scrollTo(0, 0)
    }
  }, [rota])

  return rota === 'app' ? <PaginaAplicativo /> : <PaginaSite />
}

export default App
