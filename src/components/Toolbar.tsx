import { useState } from 'react'
import {
  Download,
  Filter,
  RotateCcw,
  Search,
  Settings,
  Upload,
} from 'lucide-react'
import type { FilterMode } from './SkillTree'

interface ToolbarProps {
  query: string
  onQueryChange: (value: string) => void
  filter: FilterMode
  onFilterChange: (value: FilterMode) => void
  totalPoints: number
  sequential: boolean
  onConfigChange: (patch: { totalPoints?: number; sequential?: boolean }) => void
  onExport: () => void
  onImportClick: () => void
  onResetClick: () => void
}

const FILTERS: { value: FilterMode; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'purchased', label: 'Adquiridas' },
  { value: 'available', label: 'Disponíveis' },
  { value: 'locked', label: 'Bloqueadas' },
]

export function Toolbar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  totalPoints,
  sequential,
  onConfigChange,
  onExport,
  onImportClick,
  onResetClick,
}: ToolbarProps) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__crest" aria-hidden="true">✦</span>
        <div>
          <h1>Árvore de Skills</h1>
          <p>Gestão individual de pontos por linha e patente</p>
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

        <label className="filter">
          <Filter size={16} aria-hidden="true" />
          <select
            value={filter}
            onChange={(event) => onFilterChange(event.target.value as FilterMode)}
            aria-label="Filtrar por situação"
          >
            {FILTERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
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
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setShowSettings((prev) => !prev)}
            aria-expanded={showSettings}
            title="Configurações"
          >
            <Settings size={16} aria-hidden="true" />
            <span>Config.</span>
          </button>
          <button type="button" className="btn btn--danger" onClick={onResetClick} title="Reiniciar">
            <RotateCcw size={16} aria-hidden="true" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="settings-popover" role="dialog" aria-label="Configurações">
          <label className="settings-field">
            <span>Pontos totais orçados</span>
            <input
              type="number"
              min={0}
              step={100}
              value={totalPoints}
              onChange={(event) => {
                const next = Number(event.target.value)
                onConfigChange({ totalPoints: Number.isFinite(next) ? next : 0 })
              }}
            />
          </label>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={sequential}
              onChange={(event) => onConfigChange({ sequential: event.target.checked })}
            />
            <span>Exigir patentes em sequência</span>
          </label>
          <p className="settings-hint">
            O padrão da planilha é 31.500 pontos, com compra sequencial (Novato → Mestre).
          </p>
        </div>
      )}
    </header>
  )
}
