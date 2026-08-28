import usePressaoLonga from '../../hooks/usePressaoLonga'
import { IconeGaleria, IconeMaleta, IconeMarcador } from '../ui/Icones'

/**
 * Linha inferior da câmera: atalho da galeria (tocar abre a galeria, segurar
 * revela o acesso aos álbuns), obturador e atalho da central de conteúdo.
 */
const BarraCaptura = ({
  atalhoAberto,
  aoSegurarGaleria,
  aoAbrirGaleria,
  aoAbrirAlbuns,
  aoAbrirCentral,
  aoCapturar,
  ocupado,
}) => {
  const gestosDaGaleria = usePressaoLonga(aoSegurarGaleria, aoAbrirGaleria)

  return (
    <div className="barra-captura">
      <div className="barra-captura__lateral">
        {atalhoAberto && (
          <button
            type="button"
            className="botao-atalho botao-atalho--flutuante"
            onClick={aoAbrirAlbuns}
            aria-label="Abrir álbuns"
            title="Álbuns"
          >
            <IconeMarcador tamanho={26} corFita="#1B1B1D" />
          </button>
        )}
        <button
          type="button"
          className={`botao-atalho ${atalhoAberto ? 'is-ativo' : ''}`}
          aria-expanded={atalhoAberto}
          aria-label="Galeria (segure para abrir os álbuns)"
          title="Galeria — segure para abrir os álbuns"
          {...gestosDaGaleria}
        >
          <IconeGaleria tamanho={26} />
        </button>
      </div>

      <button
        type="button"
        className={`obturador ${ocupado ? 'is-ocupado' : ''}`}
        onClick={aoCapturar}
        aria-label="Capturar anotação"
        title="Capturar"
      >
        <span className="obturador__miolo" />
      </button>

      <div className="barra-captura__lateral">
        <button
          type="button"
          className="botao-atalho"
          onClick={aoAbrirCentral}
          aria-label="Central de conteúdo"
          title="Central de conteúdo"
        >
          <IconeMaleta tamanho={26} />
        </button>
      </div>
    </div>
  )
}

export default BarraCaptura
