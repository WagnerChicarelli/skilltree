import type { BuildFile, BuildState } from '../types'
import {
  DEFAULT_BUILD_STATE,
  LINES,
  TIERS,
  VALID_KEYS,
  parsePurchaseKey,
} from '../data/skills'

export const STORAGE_KEY = 'arvore-de-skills/build'
export const SCHEMA_VERSION = 1

interface ValidationResult {
  state: BuildState
  warnings: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function tierCost(tierId: string): number | undefined {
  return TIERS.find((tier) => tier.id === tierId)?.cost
}

/** Soma consumida por uma lista de chaves (ignorando invalidas). */
function consumedOf(keys: string[]): number {
  let total = 0
  for (const key of keys) {
    const parsed = parsePurchaseKey(key)
    if (!parsed) continue
    const cost = tierCost(parsed.tierId)
    if (typeof cost === 'number') total += cost
  }
  return total
}

/**
 * Valida e normaliza um objeto vindo de importacao/armazenamento.
 * Lanca `Error` com mensagem amigavel quando a estrutura for invalida.
 */
export function validateBuildFile(input: unknown): ValidationResult {
  if (!isRecord(input)) {
    throw new Error('Arquivo inválido: o conteúdo não é um objeto JSON.')
  }

  const warnings: string[] = []

  if (typeof input.version !== 'number' || !Number.isFinite(input.version)) {
    throw new Error('Arquivo inválido: campo "version" ausente ou inválido.')
  }
  if (input.version > SCHEMA_VERSION) {
    warnings.push(
      `O arquivo usa a versão ${input.version}, mais nova que a suportada (${SCHEMA_VERSION}). Alguns dados podem ser ignorados.`,
    )
  }

  const totalPoints = input.totalPoints
  if (typeof totalPoints !== 'number' || !Number.isFinite(totalPoints) || totalPoints <= 0) {
    throw new Error('Arquivo inválido: campo "totalPoints" deve ser um número maior que zero.')
  }

  if (typeof input.sequential !== 'boolean') {
    throw new Error('Arquivo inválido: campo "sequential" deve ser booleano.')
  }
  const sequential = input.sequential

  if (!Array.isArray(input.purchased)) {
    throw new Error('Arquivo inválido: campo "purchased" deve ser uma lista.')
  }

  const seen = new Set<string>()
  const purchased: string[] = []
  for (const raw of input.purchased) {
    if (typeof raw !== 'string') {
      warnings.push('Uma entrada não textual em "purchased" foi ignorada.')
      continue
    }
    if (!VALID_KEYS.has(raw)) {
      warnings.push(`Entrada desconhecida ignorada: "${raw}".`)
      continue
    }
    if (seen.has(raw)) continue
    seen.add(raw)
    purchased.push(raw)
  }

  const consumed = consumedOf(purchased)
  if (consumed > totalPoints) {
    throw new Error(
      `Configuração inconsistente: os pontos consumidos (${consumed.toLocaleString('pt-BR')}) excedem o orçamento (${totalPoints.toLocaleString('pt-BR')}).`,
    )
  }

  if (sequential) {
    const gap = findSequentialGap(purchased)
    if (gap) {
      throw new Error(
        `Configuração sequencial inválida: "${gap.lineName}" possui ${gap.tierName} sem a patente anterior.`,
      )
    }
  }

  return {
    state: { totalPoints, sequential, purchased },
    warnings,
  }
}

/** Detecta lacunas quando o modo sequencial esta ativo. */
function findSequentialGap(
  purchased: string[],
): { lineName: string; tierName: string } | null {
  const byLine = new Map<string, Set<string>>()
  for (const key of purchased) {
    const parsed = parsePurchaseKey(key)
    if (!parsed) continue
    if (!byLine.has(parsed.lineId)) byLine.set(parsed.lineId, new Set())
    byLine.get(parsed.lineId)!.add(parsed.tierId)
  }

  for (const [lineId, tierIds] of byLine) {
    for (const tier of TIERS) {
      if (!tierIds.has(tier.id)) continue
      const previous = TIERS.filter((t) => t.order < tier.order)
      for (const prev of previous) {
        if (!tierIds.has(prev.id)) {
          const lineName = LINES.find((l) => l.id === lineId)?.name ?? lineId
          return { lineName, tierName: tier.name }
        }
      }
    }
  }
  return null
}

export function toBuildFile(state: BuildState): BuildFile {
  return {
    version: SCHEMA_VERSION,
    totalPoints: state.totalPoints,
    sequential: state.sequential,
    purchased: [...state.purchased].sort(),
  }
}

export function serialize(state: BuildState): string {
  return JSON.stringify(toBuildFile(state), null, 2)
}

/** Converte texto JSON em estado validado. Lanca Error em caso de falha. */
export function importFromText(text: string): ValidationResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Arquivo inválido: não foi possível interpretar o JSON.')
  }
  return validateBuildFile(parsed)
}

// ---------------------------------------------------------------------------
// Persistencia local (localStorage do navegador do usuario)
// ---------------------------------------------------------------------------

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage
  } catch {
    return null
  }
}

export function saveToStorage(state: BuildState): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, serialize(state))
    return true
  } catch {
    return false
  }
}

export function loadFromStorage(): BuildState | null {
  const storage = getStorage()
  if (!storage) return null
  let raw: string | null = null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    return validateBuildFile(JSON.parse(raw)).state
  } catch {
    return null
  }
}

export function clearStorage(): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // ignora falhas de armazenamento
  }
}

export { DEFAULT_BUILD_STATE }
