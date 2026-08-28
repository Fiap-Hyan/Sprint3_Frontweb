import { useEffect, useState } from 'react'

/**
 * Roteamento das duas partes do projeto usando apenas o `hash` da URL:
 *
 * - `#/app`  → protótipo navegável do aplicativo (PaginaAplicativo)
 * - qualquer outro valor → landing page (PaginaSite)
 *
 * O hash foi escolhido no lugar do History API para que a aplicação continue
 * funcionando em hospedagem estática (sem regra de reescrita no servidor) e
 * para que os links internos da landing (`#solucao`, `#equipe`...) sigam
 * rolando a página normalmente — só o prefixo `#/` identifica uma rota.
 */
export const lerRota = () => (window.location.hash.startsWith('#/app') ? 'app' : 'site')

export const ROTA_APP = '#/app'
export const ROTA_SITE = '#/'

const useRota = () => {
  const [rota, setRota] = useState(lerRota)

  useEffect(() => {
    const aoMudarHash = () => setRota(lerRota())

    window.addEventListener('hashchange', aoMudarHash)
    return () => window.removeEventListener('hashchange', aoMudarHash)
  }, [])

  return rota
}

export default useRota
