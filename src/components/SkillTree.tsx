import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { TIERS, makePurchaseKey } from '../data/skills'
import {
  canBuy,
  highestPurchasedTier,
  lineConsumed,
  type ProgressConfig,
} from '../logic/progression'

export type FilterMode = 'all' | 'purchased' | 'available' | 'locked'

type NodeState = 'purchased' | 'available' | 'unaffordable' | 'locked'

interface SkillTreeProps {
  config: ProgressConfig
  purchased: Set<string>
  selectedLineId: string | null
  selectedTierId: string | null
  query: string
  filter: FilterMode
  onSelectNode: (lineId: string, tierId: string | null) => void
}

const COL_W = 124
const NODE_W = 104
const NODE_H = 50
const ROW_H = 80
const MARGIN_X = 60
const MARGIN_TOP = 158
const ROOT_Y = 54
const BOTTOM_PAD = 56
const MIN_SCALE = 0.25
const MAX_SCALE = 2.4

interface View {
  x: number
  y: number
  k: number
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export function SkillTree({
  config,
  purchased,
  selectedLineId,
  selectedTierId,
  query,
  filter,
  onSelectNode,
}: SkillTreeProps) {
  const lines = config.lines
  const width = MARGIN_X * 2 + COL_W * lines.length
  const [expanded, setExpanded] = useState(false)
  const rows = expanded ? TIERS.length : 1
  const height = MARGIN_TOP + ROW_H * (rows - 1) + NODE_H + BOTTOM_PAD

  const containerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 0.8 })
  const [size, setSize] = useState({ w: 0, h: 0 })
  const dragRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)

  const cx = useCallback((index: number) => MARGIN_X + COL_W * index + COL_W / 2, [])
  const cy = useCallback((order: number) => MARGIN_TOP + ROW_H * order, [])

  const fit = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    setSize({ w: rect.width, h: rect.height })
    const k = clamp(Math.min(rect.width / width, rect.height / height) * 0.96, MIN_SCALE, 1)
    setView({
      k,
      x: (rect.width - width * k) / 2,
      // Ancora a arvore mais para o topo (em vez de centralizar na vertical),
      // deixando o no raiz "Arvore de Skills" mais alto na tela.
      y: Math.max(16, (rect.height - height * k) / 3),
    })
  }, [width, height])

  useLayoutEffect(() => {
    fit()
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => fit())
    observer.observe(el)
    return () => observer.disconnect()
  }, [fit])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = event.clientX - rect.left
      const my = event.clientY - rect.top
      setView((prev) => {
        const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
        const k = clamp(prev.k * factor, MIN_SCALE, MAX_SCALE)
        const scale = k / prev.k
        return { k, x: mx - scale * (mx - prev.x), y: my - scale * (my - prev.y) }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const zoomBy = (factor: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const mx = rect.width / 2
    const my = rect.height / 2
    setView((prev) => {
      const k = clamp(prev.k * factor, MIN_SCALE, MAX_SCALE)
      const scale = k / prev.k
      return { k, x: mx - scale * (mx - prev.x), y: my - scale * (my - prev.y) }
    })
  }

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    const target = event.target as Element
    // Nao captura o ponteiro sobre um no ou no raiz: senao o clique seria
    // redirecionado para o <svg> e a selecao/toggle nunca dispararia.
    if (target.closest('.skill-node, .root-node')) return
    dragRef.current = { x: event.clientX, y: event.clientY, vx: view.x, vy: view.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag) return
    setView((prev) => ({
      ...prev,
      x: drag.vx + (event.clientX - drag.x),
      y: drag.vy + (event.clientY - drag.y),
    }))
  }
  const endDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (dragRef.current) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        // ignora
      }
    }
    dragRef.current = null
  }

  const normalizedQuery = query.trim().toLowerCase()

  const nodeState = useCallback(
    (lineId: string, tierId: string): NodeState => {
      if (purchased.has(makePurchaseKey(lineId, tierId))) return 'purchased'
      const check = canBuy(config, purchased, lineId, tierId)
      if (check.ok) return 'available'
      if (check.reason.startsWith('Pontos insuficientes')) return 'unaffordable'
      return 'locked'
    },
    [config, purchased],
  )

  const isDimmed = useCallback(
    (lineName: string, tierName: string, status: NodeState) => {
      if (normalizedQuery) {
        const matches =
          lineName.toLowerCase().includes(normalizedQuery) ||
          tierName.toLowerCase().includes(normalizedQuery)
        if (!matches) return true
      }
      if (filter === 'all') return false
      if (filter === 'purchased') return status !== 'purchased'
      if (filter === 'available') return status !== 'available'
      if (filter === 'locked') return status !== 'locked' && status !== 'unaffordable'
      return false
    },
    [normalizedQuery, filter],
  )

  const isSummaryDimmed = useCallback(
    (lineName: string, consumed: number, hasAvailable: boolean, hasLocked: boolean) => {
      if (normalizedQuery && !lineName.toLowerCase().includes(normalizedQuery)) return true
      if (filter === 'all') return false
      if (filter === 'purchased') return consumed === 0
      if (filter === 'available') return !hasAvailable
      if (filter === 'locked') return !hasLocked
      return false
    },
    [normalizedQuery, filter],
  )

  const rootR = 44

  return (
    <div className="tree-canvas" ref={containerRef}>
      <div className="tree-controls" role="group" aria-label="Controles de visualização">
        <button
          type="button"
          className="icon-btn text tree-toggle"
          onClick={() => setExpanded((prev) => !prev)}
          aria-pressed={expanded}
          aria-label={expanded ? 'Recolher árvore' : 'Árvore Detalhes: expandir todas as skills'}
          title={expanded ? 'Recolher todas as linhas' : 'Árvore Detalhes: expandir todas as linhas'}
        >
          {expanded ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}
          <span className="tree-toggle__label">{expanded ? 'Recolher' : 'Árvore Detalhes'}</span>
        </button>
        <button type="button" className="icon-btn" onClick={() => zoomBy(1.2)} aria-label="Ampliar">
          +
        </button>
        <button type="button" className="icon-btn" onClick={() => zoomBy(1 / 1.2)} aria-label="Reduzir">
          −
        </button>
        <button type="button" className="icon-btn text" onClick={fit} aria-label="Reenquadrar">
          Ajustar
        </button>
      </div>

      <svg
        className="tree-svg"
        viewBox={`0 0 ${size.w || width} ${size.h || height}`}
        preserveAspectRatio="none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="tree"
        aria-label="Árvore de skills"
      >
        <g transform={`translate(${view.x}, ${view.y}) scale(${view.k})`}>
          <defs>
            <radialGradient id="rootGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e6c869" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#c9a24b" stopOpacity="0.15" />
            </radialGradient>
          </defs>

          {/* Conexões do tronco central para cada linha */}
          {lines.map((line, index) => (
            <path
              key={`root-${line.id}`}
              className="tree-link tree-link--root"
              d={`M ${width / 2} ${ROOT_Y + rootR} C ${width / 2} ${ROOT_Y + 40}, ${cx(index)} ${cy(0) - 60}, ${cx(index)} ${cy(0) - NODE_H / 2}`}
            />
          ))}

          {/* Conexões entre patentes de uma mesma linha (apenas expandida) */}
          {expanded &&
            lines.map((line, index) =>
              TIERS.slice(0, -1).map((tier, tierIndex) => {
                const next = TIERS[tierIndex + 1]
                const fromY = cy(tier.order) + NODE_H / 2
                const toY = cy(next.order) - NODE_H / 2
                const active =
                  purchased.has(makePurchaseKey(line.id, tier.id)) &&
                  purchased.has(makePurchaseKey(line.id, next.id))
                const open = purchased.has(makePurchaseKey(line.id, tier.id))
                return (
                  <path
                    key={`link-${line.id}-${tier.id}`}
                    className={`tree-link ${active ? 'is-active' : open ? 'is-open' : ''}`}
                    d={`M ${cx(index)} ${fromY} L ${cx(index)} ${toY}`}
                  />
                )
              }),
            )}

          {/* Nó raiz: também alterna entre recolher e mostrar todas as linhas */}
          <g
            className={`root-node is-interactive${expanded ? ' is-expanded' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={expanded}
            aria-label={expanded ? 'Recolher todas as skills' : 'Mostrar todas as skills'}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setExpanded((prev) => !prev)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setExpanded((prev) => !prev)
              }
            }}
          >
            <circle cx={width / 2} cy={ROOT_Y} r={rootR + 6} className="root-node__halo" />
            <circle cx={width / 2} cy={ROOT_Y} r={rootR} fill="url(#rootGlow)" className="root-node__core" />
            <text x={width / 2} y={ROOT_Y - 6} className="root-node__title">ÁRVORE</text>
            <text x={width / 2} y={ROOT_Y + 15} className="root-node__sub">DE SKILLS</text>
          </g>

          {lines.map((line, index) => {
            const words = line.name.split(' ')
            return (
              <text
                key={`label-${line.id}`}
                x={cx(index)}
                y={cy(0) - NODE_H / 2 - 14 - (words.length - 1) * 13}
                textAnchor="middle"
                className="line-label"
              >
                {words.map((word, wordIndex) => (
                  <tspan key={wordIndex} x={cx(index)} dy={wordIndex === 0 ? 0 : 13}>
                    {word}
                  </tspan>
                ))}
              </text>
            )
          })}

          {expanded
            ? lines.map((line, index) =>
                TIERS.map((tier) => {
                  const status = nodeState(line.id, tier.id)
                  const dimmed = isDimmed(line.name, tier.name, status)
                  const isSelected =
                    selectedLineId === line.id && selectedTierId === tier.id
                  const isLineSelected = selectedLineId === line.id
                  const x = cx(index) - NODE_W / 2
                  const y = cy(tier.order) - NODE_H / 2
                  return (
                    <g
                      key={makePurchaseKey(line.id, tier.id)}
                      className={`skill-node skill-node--${status}${isSelected ? ' is-selected' : ''}${isLineSelected ? ' is-line-selected' : ''}${dimmed ? ' is-dimmed' : ''}`}
                      transform={`translate(${x}, ${y})`}
                      role="treeitem"
                      tabIndex={0}
                      aria-label={`${line.name} - ${tier.name}, ${tier.cost} pontos, ${labelForStatus(status)}`}
                      aria-selected={isSelected}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => onSelectNode(line.id, tier.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onSelectNode(line.id, tier.id)
                        }
                      }}
                    >
                      <rect width={NODE_W} height={NODE_H} rx={10} className="skill-node__frame" />
                      <rect x={3} y={3} width={NODE_W - 6} height={NODE_H - 6} rx={8} className="skill-node__inner" />
                      <text x={NODE_W / 2} y={20} textAnchor="middle" className="skill-node__name">
                        {tier.name}
                      </text>
                      <text x={NODE_W / 2} y={37} textAnchor="middle" className="skill-node__cost">
                        {tier.cost.toLocaleString('pt-BR')}
                      </text>
                    </g>
                  )
                }),
              )
            : lines.map((line, index) => {
                const consumed = lineConsumed(config, purchased, line.id)
                const highest = highestPurchasedTier(config, purchased, line.id)
                const levelName = highest?.name ?? 'Nenhum'
                let hasAvailable = false
                let hasLocked = false
                for (const tier of TIERS) {
                  if (purchased.has(makePurchaseKey(line.id, tier.id))) continue
                  if (canBuy(config, purchased, line.id, tier.id).ok) hasAvailable = true
                  else hasLocked = true
                }
                const dimmed = isSummaryDimmed(line.name, consumed, hasAvailable, hasLocked)
                const isLineSelected = selectedLineId === line.id
                const status = consumed > 0 ? 'purchased' : hasAvailable ? 'available' : 'locked'
                const x = cx(index) - NODE_W / 2
                const y = cy(0) - NODE_H / 2
                return (
                  <g
                    key={`summary-${line.id}`}
                    className={`skill-node skill-node--summary skill-node--${status}${isLineSelected ? ' is-selected is-line-selected' : ''}${dimmed ? ' is-dimmed' : ''}`}
                    transform={`translate(${x}, ${y})`}
                    role="treeitem"
                    tabIndex={0}
                    aria-label={`${line.name}, nível ${levelName}, ${consumed} pontos`}
                    aria-selected={isLineSelected}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => onSelectNode(line.id, highest?.id ?? null)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onSelectNode(line.id, highest?.id ?? null)
                      }
                    }}
                  >
                    <rect width={NODE_W} height={NODE_H} rx={10} className="skill-node__frame" />
                    <rect x={3} y={3} width={NODE_W - 6} height={NODE_H - 6} rx={8} className="skill-node__inner" />
                    <text x={NODE_W / 2} y={20} textAnchor="middle" className="skill-node__name">
                      {levelName}
                    </text>
                    <text x={NODE_W / 2} y={37} textAnchor="middle" className="skill-node__cost">
                      {consumed > 0 ? `${consumed.toLocaleString('pt-BR')} pts` : '—'}
                    </text>
                  </g>
                )
              })}
        </g>
      </svg>
    </div>
  )
}

function labelForStatus(status: NodeState): string {
  switch (status) {
    case 'purchased':
      return 'adquirida'
    case 'available':
      return 'disponível'
    case 'unaffordable':
      return 'sem pontos suficientes'
    case 'locked':
      return 'bloqueada'
  }
}
