import { Droplet, Heart, Minus, Plus, Wind, type LucideIcon } from 'lucide-react'
import type { StatusPoints } from '../types'
import {
  lifeTotal,
  manaTotal,
  statusPointsAvailable,
  statusPointsInvested,
  staminaTotal,
  type StatusActionAttr,
} from '../logic/progression'
import { STATUS_BASE, STATUS_PER_POINT } from '../data/skills'

interface StatusNodeProps {
  globalLevel: number
  statusPoints: StatusPoints | undefined
  onAdd: (attr: StatusActionAttr) => void
  onRemove: (attr: StatusActionAttr) => void
}

interface AttrDef {
  key: StatusActionAttr
  label: string
  icon: LucideIcon
  tone: string
  total: (statusPoints: StatusPoints | undefined) => number
}

const ATTRS: AttrDef[] = [
  { key: 'life', label: 'Vida', icon: Heart, tone: 'life', total: lifeTotal },
  { key: 'mana', label: 'Mana', icon: Droplet, tone: 'mana', total: manaTotal },
  { key: 'stamina', label: 'Stamina', icon: Wind, tone: 'stamina', total: staminaTotal },
]

export function StatusNode({ globalLevel, statusPoints, onAdd, onRemove }: StatusNodeProps) {
  const available = statusPointsAvailable(globalLevel, statusPoints)
  const invested = statusPointsInvested(statusPoints)

  return (
    <section className="status-node" aria-label="Status Node">
      <header className="status-node__head">
        <p className="status-node__eyebrow">Distribuição de atributos</p>
        <h2>Status Node</h2>
        <p className="status-node__hint">
          Cada patente adquirida concede 1 ponto de atributo. Nível global atual:{' '}
          <strong>{globalLevel}</strong>.
        </p>
      </header>

      <div className="status-summary">
        <div className="status-summary__pool">
          <span className="status-summary__value">{available}</span>
          <span className="status-summary__label">Pontos disponíveis</span>
        </div>
        <div className="status-summary__pool status-summary__pool--muted">
          <span className="status-summary__value">{invested}</span>
          <span className="status-summary__label">Pontos investidos</span>
        </div>
      </div>

      <div className="status-grid" aria-label="Atributos">
        {ATTRS.map((attr) => {
          const Icon = attr.icon
          const allocated = statusPoints ? statusPoints[attr.key] : 0
          const total = attr.total(statusPoints)
          const canAdd = available > 0
          const canRemove = allocated > 0
          return (
            <article key={attr.key} className={`status-card status-card--${attr.tone}`}>
              <header className="status-card__head">
                <span className="status-card__icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <h3>{attr.label}</h3>
              </header>

              <div className="status-card__total">
                <span className="status-card__total-value">{total}</span>
                <span className="status-card__total-label">pontos totais</span>
              </div>

              <div className="status-card__stepper">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onRemove(attr.key)}
                  disabled={!canRemove}
                  aria-label={`Remover ponto de ${attr.label}`}
                >
                  <Minus size={16} aria-hidden="true" />
                </button>
                <span className="status-card__allocated">{allocated}</span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onAdd(attr.key)}
                  disabled={!canAdd}
                  aria-label={`Adicionar ponto em ${attr.label}`}
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              </div>

              <p className="status-card__formula">
                Base {STATUS_BASE} + {allocated} × {STATUS_PER_POINT}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
