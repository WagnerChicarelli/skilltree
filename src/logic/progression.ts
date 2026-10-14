import type { ActionCheck, BuildStats, StatusPoints, TierDef } from '../types'
import { makePurchaseKey, parsePurchaseKey, STATUS_BASE, STATUS_PER_POINT, TREE } from '../data/skills'

export interface ProgressConfig {
  tiers: TierDef[]
  lines: { id: string; name: string }[]
  totalPoints: number
  sequential: boolean
}

export const DEFAULT_CONFIG: ProgressConfig = {
  tiers: TREE.tiers,
  lines: TREE.lines,
  totalPoints: TREE.totalPoints,
  sequential: TREE.sequential,
}

function tierByIdIn(config: ProgressConfig, tierId: string): TierDef | undefined {
  return config.tiers.find((tier) => tier.id === tierId)
}

export function isPurchased(
  purchased: Set<string>,
  lineId: string,
  tierId: string,
): boolean {
  return purchased.has(makePurchaseKey(lineId, tierId))
}

/** Pontos consumidos por uma linha (coluna H da planilha). */
export function lineConsumed(
  config: ProgressConfig,
  purchased: Set<string>,
  lineId: string,
): number {
  return config.tiers.reduce((sum, tier) => {
    return isPurchased(purchased, lineId, tier.id) ? sum + tier.cost : sum
  }, 0)
}

/** Patente mais alta adquirida numa linha (coluna G da planilha). */
export function highestPurchasedTier(
  config: ProgressConfig,
  purchased: Set<string>,
  lineId: string,
): TierDef | null {
  let highest: TierDef | null = null
  for (const tier of config.tiers) {
    if (isPurchased(purchased, lineId, tier.id)) {
      if (!highest || tier.order > highest.order) highest = tier
    }
  }
  return highest
}

/** Nome do "NIVEL ATUAL" da linha ou "Nenhum". */
export function lineLevelName(
  config: ProgressConfig,
  purchased: Set<string>,
  lineId: string,
): string {
  return highestPurchasedTier(config, purchased, lineId)?.name ?? 'Nenhum'
}

export function totalConsumed(config: ProgressConfig, purchased: Set<string>): number {
  let total = 0
  for (const key of purchased) {
    const parsed = parsePurchaseKey(key)
    if (!parsed) continue
    const tier = tierByIdIn(config, parsed.tierId)
    if (tier) total += tier.cost
  }
  return total
}

/** Quantidade de patentes adquiridas (coluna G5 - COUNTIF). */
export function globalLevel(purchased: Set<string>): number {
  return purchased.size
}

export function activeLines(purchased: Set<string>): number {
  const ids = new Set<string>()
  for (const key of purchased) {
    const parsed = parsePurchaseKey(key)
    if (parsed) ids.add(parsed.lineId)
  }
  return ids.size
}

export function computeStats(
  config: ProgressConfig,
  purchased: Set<string>,
): BuildStats {
  const consumed = totalConsumed(config, purchased)
  return {
    consumed,
    remaining: config.totalPoints - consumed,
    globalLevel: globalLevel(purchased),
    activeLines: activeLines(purchased),
  }
}

/**
 * Verifica se e possivel adquirir uma patente.
 * Regras:
 *  - nao pode comprar o que ja tem;
 *  - modo sequencial: exige todas as patentes anteriores na mesma linha;
 *  - nao pode ultrapassar o orcamento total.
 */
export function canBuy(
  config: ProgressConfig,
  purchased: Set<string>,
  lineId: string,
  tierId: string,
): ActionCheck {
  const tier = tierByIdIn(config, tierId)
  if (!tier) return { ok: false, reason: 'Patente inexistente.' }

  if (isPurchased(purchased, lineId, tierId)) {
    return { ok: false, reason: 'Esta patente já foi adquirida.' }
  }

  if (config.sequential) {
    const previous = config.tiers
      .filter((t) => t.order < tier.order)
      .sort((a, b) => a.order - b.order)
    for (const t of previous) {
      if (!isPurchased(purchased, lineId, t.id)) {
        return { ok: false, reason: `Requer ${t.name} nesta linha.` }
      }
    }
  }

  const consumed = totalConsumed(config, purchased)
  if (consumed + tier.cost > config.totalPoints) {
    const deficit = consumed + tier.cost - config.totalPoints
    return {
      ok: false,
      reason: `Pontos insuficientes: faltam ${deficit.toLocaleString('pt-BR')}.`,
    }
  }

  return { ok: true }
}

/**
 * Verifica se e possivel remover uma patente.
 * Modo sequencial: nao remove uma patente que sustenta uma patente superior.
 */
export function canSell(
  config: ProgressConfig,
  purchased: Set<string>,
  lineId: string,
  tierId: string,
): ActionCheck {
  const tier = tierByIdIn(config, tierId)
  if (!tier) return { ok: false, reason: 'Patente inexistente.' }

  if (!isPurchased(purchased, lineId, tierId)) {
    return { ok: false, reason: 'Esta patente não está adquirida.' }
  }

  if (config.sequential) {
    const higher = config.tiers
      .filter((t) => t.order > tier.order)
      .sort((a, b) => a.order - b.order)
    for (const t of higher) {
      if (isPurchased(purchased, lineId, t.id)) {
        return { ok: false, reason: `Remova primeiro ${t.name} nesta linha.` }
      }
    }
  }

  return { ok: true }
}
export function getStatusPoints(statusPoints: StatusPoints | undefined): StatusPoints {
  return statusPoints ?? { life: 0, mana: 0, stamina: 0 }
}
export function statusPointsInvested(statusPoints: StatusPoints | undefined): number {
  const sp = getStatusPoints(statusPoints)
  return sp.life + sp.mana + sp.stamina
}
export function statusPointsAvailable(globalLevel: number, statusPoints: StatusPoints | undefined): number {
  const invested = statusPointsInvested(statusPoints)
  const available = globalLevel - invested
  return available < 0 ? 0 : available
}
export function lifeTotal(statusPoints: StatusPoints | undefined): number {
  const sp = getStatusPoints(statusPoints)
  return STATUS_BASE + sp.life * STATUS_PER_POINT
}
export function manaTotal(statusPoints: StatusPoints | undefined): number {
  const sp = getStatusPoints(statusPoints)
  return STATUS_BASE + sp.mana * STATUS_PER_POINT
}
export function staminaTotal(statusPoints: StatusPoints | undefined): number {
  const sp = getStatusPoints(statusPoints)
  return STATUS_BASE + sp.stamina * STATUS_PER_POINT
}
export type StatusActionAttr = "life" | "mana" | "stamina"
export function canAddStatusPoint(globalLevel: number, statusPoints: StatusPoints | undefined, _attr: StatusActionAttr): ActionCheck {
  const available = statusPointsAvailable(globalLevel, statusPoints)
  if (available <= 0) return { ok: false, reason: "Sem pontos disponíveis." }
  return { ok: true }
}
export function canRemoveStatusPoint(statusPoints: StatusPoints | undefined, attr: StatusActionAttr): ActionCheck {
  const sp = getStatusPoints(statusPoints)
  if (attr === "life") { if (sp.life <= 0) return { ok: false, reason: "Não há pontos para remover." } }
  if (attr === "mana") { if (sp.mana <= 0) return { ok: false, reason: "Não há pontos para remover." } }
  if (attr === "stamina") { if (sp.stamina <= 0) return { ok: false, reason: "Não há pontos para remover." } }
  return { ok: true }
}