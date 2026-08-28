const CHAVE_AJUSTES = 'studycam:ajustes'
const CHAVE_CAMERA_PEDIDA = 'studycam:camera-pedida'

/**
 * A câmera real do dispositivo passou a ser pedida ao entrar no protótipo, sem
 * precisar abrir Ajustes: `AJUSTES_INICIAIS.usarWebcam` já vem ligado. Quem usou
 * o protótipo antes dessa mudança tem `usarWebcam: false` guardado no
 * localStorage, então ligamos o interruptor uma única vez por navegador — depois
 * disso vale a escolha feita em Ajustes.
 *
 * Roda no arranque (src/main.jsx), antes da primeira renderização; a permissão
 * em si só é solicitada quando a tela da câmera aparece (src/hooks/useWebcam.js).
 */
export const ligarCameraNaEntrada = () => {
  try {
    if (window.localStorage.getItem(CHAVE_CAMERA_PEDIDA)) return
    window.localStorage.setItem(CHAVE_CAMERA_PEDIDA, 'true')

    // Sem ajustes salvos é o primeiro acesso: AJUSTES_INICIAIS já resolve.
    const salvo = window.localStorage.getItem(CHAVE_AJUSTES)
    if (!salvo) return

    const ajustes = JSON.parse(salvo)
    window.localStorage.setItem(
      CHAVE_AJUSTES,
      JSON.stringify({ ...ajustes, usarWebcam: true }),
    )
  } catch {
    // localStorage indisponível (aba anônima) ou ajustes corrompidos: nada a
    // fazer, o protótipo segue com os ajustes iniciais.
  }
}

export default ligarCameraNaEntrada
