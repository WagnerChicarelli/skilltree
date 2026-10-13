import { Download, RotateCcw, Search, Upload } from 'lucide-react'

interface ToolbarProps {
  query: string
  onQueryChange: (value: string) => void
  onExport: () => void
  onImportClick: () => void
  onResetClick: () => void
}

export function Toolbar({
  query,
  onQueryChange,
  onExport,
  onImportClick,
  onResetClick,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__crest" aria-hidden="true">�o�</span>
        <div>
          <h1>�?rvore de Skills</h1>
          <p>Gestǜo individual de pontos por linha e patente</p>
        </div>
      </div>

      <div className="toolbar__actions">
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar linha ou patente..."
            aria-label="Buscar linha ou patente"
          />
        </label>

        <div className="toolbar__buttons">
          <button type="button" className="btn" onClick={onImportClick} title="Importar JSON">
            <Upload size={16} aria-hidden="true" />
            <span>Importar</span>
          </button>
          <button type="button" className="btn" onClick={onExport} title="Exportar JSON">
            <Download size={16} aria-hidden="true" />
            <span>Exportar</span>
          </button>
          <button type="button" className="btn btn--danger" onClick={onResetClick} title="Reiniciar">
            <RotateCcw size={16} aria-hidden="true" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>
    </header>
  )
}
