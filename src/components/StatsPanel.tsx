import type { BuildStats } from '../types'

interface StatsPanelProps {
  stats: BuildStats
  totalPoints: number
}

export function StatsPanel({ stats, totalPoints }: StatsPanelProps) {
  const usedPct = totalPoints > 0 ? Math.min(100, (stats.consumed / totalPoints) * 100) : 0
  const over = stats.remaining < 0

  return (
    <section className="stats" aria-label="Resumo de pontos">
      <div className="stats__items">
        <Stat label="Pontos orçados" value={totalPoints.toLocaleString('pt-BR')} />
        <Stat label="Pontos usados" value={stats.consumed.toLocaleString('pt-BR')} />
        <Stat
          label="Saldo restante"
          value={stats.remaining.toLocaleString('pt-BR')}
          tone={over ? 'danger' : stats.remaining === 0 ? 'gold' : 'emerald'}
        />
        <Stat label="Nível global" value={stats.globalLevel.toString()} tone="gold" />
        <Stat label="Linhas ativas" value={stats.activeLines.toString()} />
      </div>
      <div className="stats__bar" aria-hidden="true">
        <div
          className={`stats__bar-fill${over ? ' is-over' : ''}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
    </section>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'emerald' | 'gold' | 'danger'
}) {
  return (
    <div className={`stat${tone ? ` stat--${tone}` : ''}`}>
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  )
}
