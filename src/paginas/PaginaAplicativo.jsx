import { useCallback, useState } from 'react'

import BarraSistema from '../components/dispositivo/BarraSistema'
import BarraStatus from '../components/dispositivo/BarraStatus'
import TelaAjustes from '../components/paineis/TelaAjustes'
import TelaAlbum from '../components/notas/TelaAlbum'
import TelaAlbuns from '../components/albuns/TelaAlbuns'
import TelaBusca from '../components/paineis/TelaBusca'
import TelaCamera from '../components/camera/TelaCamera'
import TelaCentral from '../components/paineis/TelaCentral'
import TelaGaleria from '../components/paineis/TelaGaleria'
import TelaHistorico from '../components/paineis/TelaHistorico'
import TelaLixeira from '../components/paineis/TelaLixeira'
import TelaNota from '../components/notas/TelaNota'
import Aviso from '../components/ui/Aviso'
import { AJUSTES_INICIAIS } from '../data/biblioteca-inicial'
import useBiblioteca from '../hooks/useBiblioteca'
import useLocalStorage from '../hooks/useLocalStorage'
import useNavegacao from '../hooks/useNavegacao'
import useRelogio from '../hooks/useRelogio'
import useWebcam from '../hooks/useWebcam'

const NOMES_DE_TELA = {
  camera: 'Câmera · modo StudyCam AI',
  galeria: 'Galeria',
  albuns: 'Álbuns',
  album: 'Anotações da matéria',
  nota: 'Anotação',
  busca: 'Busca',
  central: 'Central de conteúdo',
  historico: 'Histórico e estatísticas',
  lixeira: 'Lixeira',
  ajustes: 'Ajustes',
}

/**
 * Página do protótipo (rota #/app): monta o "aparelho" (barra de status, corpo
 * e barra do sistema) e distribui, por props, os dados e as ações que cada tela
 * filha precisa. É aberta pelos botões da landing page.
 */
const PaginaAplicativo = () => {
  const biblioteca = useBiblioteca()
  const navegacao = useNavegacao()
  const hora = useRelogio()
  const [ajustes, setAjustes] = useLocalStorage('studycam:ajustes', AJUSTES_INICIAIS)
  const [aviso, setAviso] = useState('')
  const { videoRef, conectarVideo, status: statusWebcam } = useWebcam(ajustes.usarWebcam)

  const definirAjuste = useCallback(
    (chave, valor) => setAjustes((atual) => ({ ...atual, [chave]: valor })),
    [setAjustes],
  )

  const avisar = useCallback((mensagem) => setAviso(mensagem), [])
  const fecharAviso = useCallback(() => setAviso(''), [])

  const { tela } = navegacao

  const renderizarTela = () => {
    switch (tela.nome) {
      case 'galeria':
        return (
          <TelaGaleria
            biblioteca={biblioteca}
            aoVoltar={navegacao.voltar}
            aoAbrir={navegacao.abrir}
            aoAvisar={avisar}
          />
        )
      case 'albuns':
        return (
          <TelaAlbuns
            biblioteca={biblioteca}
            aoVoltar={navegacao.voltar}
            aoAbrir={navegacao.abrir}
            aoAvisar={avisar}
          />
        )
      case 'album':
        return (
          <TelaAlbum
            biblioteca={biblioteca}
            albumId={tela.parametro}
            aoVoltar={navegacao.voltar}
            aoAbrir={navegacao.abrir}
            aoAvisar={avisar}
          />
        )
      case 'nota':
        return (
          <TelaNota
            key={tela.parametro}
            biblioteca={biblioteca}
            notaId={tela.parametro}
            ajustes={ajustes}
            aoVoltar={navegacao.voltar}
            aoAvisar={avisar}
          />
        )
      case 'busca':
        return <TelaBusca biblioteca={biblioteca} aoVoltar={navegacao.voltar} aoAbrir={navegacao.abrir} />
      case 'central':
        return (
          <TelaCentral
            biblioteca={biblioteca}
            aoVoltar={navegacao.voltar}
            aoAbrir={navegacao.abrir}
            aoAvisar={avisar}
          />
        )
      case 'historico':
        return <TelaHistorico biblioteca={biblioteca} aoVoltar={navegacao.voltar} />
      case 'lixeira':
        return (
          <TelaLixeira
            biblioteca={biblioteca}
            aoVoltar={navegacao.voltar}
            aoAbrir={navegacao.abrir}
            aoAvisar={avisar}
          />
        )
      case 'ajustes':
        return (
          <TelaAjustes
            ajustes={ajustes}
            definirAjuste={definirAjuste}
            biblioteca={biblioteca}
            aoVoltar={navegacao.voltar}
            aoAvisar={avisar}
          />
        )
      default:
        return (
          <TelaCamera
            ajustes={ajustes}
            definirAjuste={definirAjuste}
            albuns={biblioteca.albuns}
            contarNotas={biblioteca.contarNotas}
            adicionarNota={biblioteca.adicionarNota}
            atualizarNota={biblioteca.atualizarNota}
            videoRef={videoRef}
            conectarVideo={conectarVideo}
            statusWebcam={statusWebcam}
            aoAbrir={navegacao.abrir}
            aoAvisar={avisar}
          />
        )
    }
  }

  return (
    <div className="palco">
      <a className="palco__voltar" href="#/">
        <span aria-hidden="true">&larr;</span> Voltar para o site
      </a>

      <aside className="palco__contexto">
        <p className="palco__marca">StudyCam AI</p>
        <h1 className="palco__titulo">O modo Estudo da câmera JOVI</h1>
        <p className="palco__texto">
          Protótipo navegável da solução criada para o Challenge 2026 (FIAP × JOVI): a câmera
          reconhece quadros, slides e cadernos, sugere a matéria e organiza tudo em álbuns de estudo.
        </p>
        <dl className="palco__dados">
          <div>
            <dt>Tela atual</dt>
            <dd>{NOMES_DE_TELA[tela.nome] || 'Câmera'}</dd>
          </div>
          <div>
            <dt>Anotações salvas</dt>
            <dd>{biblioteca.totalNotas}</dd>
          </div>
          <div>
            <dt>Matérias</dt>
            <dd>{biblioteca.albuns.length}</dd>
          </div>
        </dl>
        <p className="palco__nota">
          Use o aparelho ao lado como no celular: o botão branco captura, o ícone de galeria abre as
          fotos guardadas (segure para revelar os álbuns) e a seta da barra inferior volta. O visor
          pede a câmera do seu dispositivo ao abrir esta página; se você negar, ele continua na cena
          simulada.
        </p>
      </aside>

      <div className="dispositivo">
        <div className="dispositivo__tela">
          <BarraStatus hora={hora} />
          <main className="dispositivo__corpo">{renderizarTela()}</main>
          <BarraSistema
            aoVoltar={navegacao.voltar}
            aoInicio={navegacao.inicio}
            aoRecentes={() => avisar('Aplicativos recentes: função do sistema Android')}
          />
          <Aviso mensagem={aviso} aoFechar={fecharAviso} />
        </div>
      </div>
    </div>
  )
}

export default PaginaAplicativo
