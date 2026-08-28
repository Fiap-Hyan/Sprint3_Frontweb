import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { lerRota } from './hooks/useRota'
import { ligarCameraNaEntrada } from './utils/ajustes-salvos'
import './index.css'

// Marca a página antes da primeira renderização para que o CSS correto já
// esteja valendo na primeira pintura (evita o "pisca" de estilo trocado).
document.documentElement.setAttribute('data-pagina', lerRota())

// O protótipo é uma câmera: quem já tinha ajustes salvos também entra com o
// visor real ligado, sem precisar passar por Ajustes.
ligarCameraNaEntrada()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
