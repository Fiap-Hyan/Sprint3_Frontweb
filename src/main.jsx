import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { lerRota } from './hooks/useRota'
import './index.css'

// Marca a página antes da primeira renderização para que o CSS correto já
// esteja valendo na primeira pintura (evita o "pisca" de estilo trocado).
document.documentElement.setAttribute('data-pagina', lerRota())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
