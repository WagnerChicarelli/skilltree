import { X } from 'lucide-react'
import { TIERS, lineById, makePurchaseKey, tierById } from '../data/skills'
import { getClassDescription, getTierEffect } from '../data/classDescriptions'
import {
  canBuy,
  canSell,
  lineConsumed,
  lineLevelName,
  type ProgressConfig,
} from '../logic/progression'

interface DetailPanelProps {
  lineId: string
  selectedTierId: string | null
  config: ProgressConfig
  purchased: Set<string>
  onBuy: (lineId: string, tierId: string) => boolean
  onSell: (lineId: string, tierId: string) => boolean
  onClose: () => void
}

export function DetailPanel({
  lineId,
  selectedTierId,
  config,
  purchased,
  onBuy,
  onSell,
  onClose,
}: DetailPanelProps) {
  const line = lineById(lineId)
  if (!line) return null

  const description = getClassDescription(lineId)
  const consumed = lineConsumed(config, purchased, lineId)
  const level = lineLevelName(config, purchased, lineId)

  const selectedTierName = selectedTierId ? tierById(selectedTierId)?.name : undefined
  const selectedEffect = selectedTierId ? getTierEffect(lineId, selectedTierId) : undefined

  return (
    <aside className="detail" aria-label={`Detalhes de ${line.name}`}>
      <div className="detail__head">
        <div>
          <p className="detail__eyebrow">Linha / Classe</p>
          <h2>{line.name}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar detalhes">
          <X size={18} />
        </button>
      </div>

      {description?.general && (
        <p className="detail__general">{description.general}</p>
      )}

      <dl className="detail__summary">
        <div>
          <dt>Nível atual</dt>
          <dd>{level}</dd>
        </div>
        <div>
          <dt>Pontos nesta linha</dt>
          <dd>{consumed.toLocaleString('pt-BR')}</dd>
        </div>
      </dl>

      {selectedTierName && selectedEffect && (
        <div className="detail__selected" aria-live="polite">
          <p className="detail__selected-label">Efeito de {selectedTierName}</p>
          <p className="detail__selected-text">{selectedEffect}</p>
        </div>
      )}

      <h3 className="detail__section-title">Efeitos por patente</h3>

      <ul className="tier-list">
        {TIERS.map((tier) => {
          const key = makePurchaseKey(lineId, tier.id)
          const isOwned = purchased.has(key)
          const buyCheck = canBuy(config, purchased, lineId, tier.id)
          const sellCheck = canSell(config, purchased, lineId, tier.id)
          const isSelected = selectedTierId === tier.id
          const effect = getTierEffect(lineId, tier.id)

          let statusText: string
          let tone: string
          if (isOwned) {
            statusText = 'Adquirida'
            tone = 'owned'
          } else if (buyCheck.ok) {
            statusText = 'Disponível'
            tone = 'available'
          } else {
            statusText = buyCheck.reason
            tone = buyCheck.reason.startsWith('Pontos insuficientes') ? 'warn' : 'locked'
          }

          return (
            <li
              key={tier.id}
              className={`tier-row${isOwned ? ' is-owned' : ''}${isSelected ? ' is-selected' : ''}`}
            >
              <div className="tier-row__main">
                <div className="tier-row__info">
                  <span className="tier-row__name">{tier.name}</span>
                  <span className="tier-row__cost">{tier.cost.toLocaleString('pt-BR')} pts</span>
                  <span className={`tier-row__status tier-row__status--${tone}`}>{statusText}</span>
                </div>
                {isOwned ? (
                  <button
                    type="button"
                    className="btn btn--small btn--danger"
                    disabled={!sellCheck.ok}
                    title={sellCheck.ok ? 'Remover patente' : sellCheck.reason}
                    onClick={() => onSell(lineId, tier.id)}
                  >
                    Remover
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn--small btn--primary"
                    disabled={!buyCheck.ok}
                    title={buyCheck.ok ? 'Adquirir patente' : buyCheck.reason}
                    onClick={() => onBuy(lineId, tier.id)}
                  >
                    Adquirir
                  </button>
                )}
              </div>
              {effect && <p className="tier-row__effect">{effect}</p>}
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
