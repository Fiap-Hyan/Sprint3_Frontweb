import { useMemo, useState } from 'react'

import CabecalhoTela from '../ui/CabecalhoTela'
import Dialogo from '../ui/Dialogo'
import Interruptor from '../ui/Interruptor'
import DICAS from '../../data/dicas'
import { PROPORCOES, TEMPORIZADORES } from '../../data/modos'
import { INTEGRACAO_ATIVA } from '../../services/api'
import { VOZES, disponivel as vozDisponivel } from '../../services/textToSpeech'
import { sortear } from '../../utils/aleatorio'

/** Ajustes da câmera, da IA, de privacidade e status das integrações. */
const TelaAjustes = ({ ajustes, definirAjuste, biblioteca, aoVoltar, aoAvisar }) => {
  const [confirmando, setConfirmando] = useState(false)
  const dica = useMemo(() => sortear(DICAS), [])

  return (
    <section className="tela tela--conteudo">
      <CabecalhoTela titulo="Ajustes" aoVoltar={aoVoltar} />

      <div className="tela__rolagem">
        <p className="dica-do-dia">{dica}</p>

        <div className="secao-titulo">
          <h2>Câmera</h2>
        </div>

        <div className="grupo-ajuste">
          <p className="grupo-ajuste__rotulo">Proporção da foto</p>
          <div className="segmentado">
            {PROPORCOES.map((proporcao) => (
              <button
                key={proporcao}
                type="button"
                className={ajustes.proporcao === proporcao ? 'is-ativo' : ''}
                onClick={() => definirAjuste('proporcao', proporcao)}
              >
                {proporcao}
              </button>
            ))}
          </div>
        </div>

        <div className="grupo-ajuste">
          <p className="grupo-ajuste__rotulo">Temporizador</p>
          <div className="segmentado">
            {TEMPORIZADORES.map((segundos) => (
              <button
                key={segundos}
                type="button"
                className={ajustes.temporizador === segundos ? 'is-ativo' : ''}
                onClick={() => definirAjuste('temporizador', segundos)}
              >
                {segundos === 0 ? 'Desl.' : `${segundos}s`}
              </button>
            ))}
          </div>
        </div>

        <Interruptor
          id="ajuste-flash"
          rotulo="Flash"
          descricao="Ilumina quadros e slides com pouca luz"
          ligado={ajustes.flash === 'on'}
          aoAlternar={(valor) => definirAjuste('flash', valor ? 'on' : 'off')}
        />

        <Interruptor
          id="ajuste-moldura"
          rotulo="Detecção de documento"
          descricao="Mostra a moldura automática no visor"
          ligado={ajustes.molduraDocumento}
          aoAlternar={(valor) => definirAjuste('molduraDocumento', valor)}
        />

        <Interruptor
          id="ajuste-webcam"
          rotulo="Usar a câmera do dispositivo"
          descricao="Substitui o visor simulado pela imagem real (a permissão é pedida ao abrir o protótipo)"
          ligado={ajustes.usarWebcam}
          aoAlternar={(valor) => {
            definirAjuste('usarWebcam', valor)
            aoAvisar(valor ? 'Solicitando acesso à câmera…' : 'Visor simulado restaurado')
          }}
        />

        <div className="secao-titulo">
          <h2>Inteligência artificial</h2>
        </div>

        <Interruptor
          id="ajuste-ia"
          rotulo="Assistente StudyCam AI"
          descricao="Sugere a matéria da captura e calcula a confiança do reconhecimento"
          ligado={ajustes.iaAtiva}
          aoAlternar={(valor) => definirAjuste('iaAtiva', valor)}
        />

        <Interruptor
          id="ajuste-resumo"
          rotulo="Resumo automático"
          descricao="Resume a anotação com o Gemini assim que ela é aberta"
          ligado={ajustes.resumoAutomatico}
          aoAlternar={(valor) => definirAjuste('resumoAutomatico', valor)}
        />

        <Interruptor
          id="ajuste-tts"
          rotulo="Leitura em voz alta"
          descricao={`Vozes disponíveis: ${VOZES.map((voz) => voz.rotulo.split(' ')[0]).join(', ')}`}
          ligado={ajustes.leituraEmVozAlta}
          desabilitado={!vozDisponivel()}
          aoAlternar={(valor) => definirAjuste('leituraEmVozAlta', valor)}
        />

        <div className="secao-titulo">
          <h2>Privacidade</h2>
        </div>

        <Interruptor
          id="ajuste-local"
          rotulo="Salvar localização da captura"
          descricao="Guarda onde a anotação foi feita"
          ligado={ajustes.salvarLocalizacao}
          aoAlternar={(valor) => definirAjuste('salvarLocalizacao', valor)}
        />

        <Interruptor
          id="ajuste-privado"
          rotulo="Ocultar álbuns privados"
          descricao="Álbuns marcados como privados não aparecem na busca"
          ligado={ajustes.albunsPrivados}
          aoAlternar={(valor) => definirAjuste('albunsPrivados', valor)}
        />

        <div className="secao-titulo">
          <h2>Integrações</h2>
        </div>

        <p className="texto-apoio">
          OCR da captura, resumo e classificação por IA: Google Gemini
          {INTEGRACAO_ATIVA ? ' (conectado)' : ' (indisponível)'}.
        </p>
        <p className="texto-apoio">
          Leitura em voz alta: Google Cloud Text-to-Speech
          {vozDisponivel() ? ' (conectado)' : ' (indisponível)'}.
        </p>

        <div className="secao-titulo">
          <h2>Dados do aplicativo</h2>
        </div>
        <p className="texto-apoio">
          {biblioteca.totalNotas} anotações e {biblioteca.albuns.length} matérias salvas no
          localStorage deste navegador.
        </p>
        <button type="button" className="botao-secundario is-largo" onClick={() => setConfirmando(true)}>
          Restaurar conteúdo de exemplo
        </button>

        <p className="rodape-app">StudyCam AI · Challenge 2026 FIAP × JOVI · versão 1.0</p>
      </div>

      {confirmando && (
        <Dialogo
          titulo="Restaurar conteúdo de exemplo"
          descricao="Suas alterações locais (álbuns, anotações e histórico) serão substituídas pelo conteúdo inicial."
          aoCancelar={() => setConfirmando(false)}
          aoConfirmar={() => {
            biblioteca.restaurarPadrao()
            setConfirmando(false)
            aoAvisar('Conteúdo de exemplo restaurado')
          }}
          rotuloConfirmar="Restaurar"
          perigo
        />
      )}
    </section>
  )
}

export default TelaAjustes
