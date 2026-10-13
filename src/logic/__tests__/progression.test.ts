import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONFIG,
  canBuy,
  canSell,
  computeStats,
  lineConsumed,
  lineLevelName,
  type ProgressConfig,
} from '../progression'
import { SPREADSHEET_EXAMPLE_PURCHASED, makePurchaseKey } from '../../data/skills'

const config = DEFAULT_CONFIG
const defaultSet = new Set(SPREADSHEET_EXAMPLE_PURCHASED)

const sequentialConfig: ProgressConfig = {
  tiers: [
    { id: 'novato', name: 'Novato', cost: 1000, order: 0 },
    { id: 'aprendiz', name: 'Aprendiz', cost: 1500, order: 1 },
  ],
  lines: [{ id: 'cavaleiro', name: 'Cavaleiro' }],
  totalPoints: 10000,
  sequential: true,
}

const freeConfig: ProgressConfig = { ...sequentialConfig, sequential: false }

describe('computeStats (fiel a planilha)', () => {
  it('reproduz os totais da planilha de exemplo', () => {
    const stats = computeStats(config, defaultSet)
    expect(stats.consumed).toBe(31500)
    expect(stats.remaining).toBe(0)
    expect(stats.globalLevel).toBe(20)
    expect(stats.activeLines).toBe(11)
  })
})

describe('lineConsumed / lineLevelName', () => {
  it('calcula pontos por linha', () => {
    expect(lineConsumed(config, defaultSet, 'conjurador')).toBe(10500)
    expect(lineConsumed(config, defaultSet, 'curandeiro')).toBe(2500)
    expect(lineConsumed(config, defaultSet, 'cavaleiro')).toBe(0)
  })

  it('identifica o nivel atual da linha', () => {
    expect(lineLevelName(config, defaultSet, 'conjurador')).toBe('Mestre')
    expect(lineLevelName(config, defaultSet, 'curandeiro')).toBe('Aprendiz')
    expect(lineLevelName(config, defaultSet, 'cavaleiro')).toBe('Nenhum')
  })
})

describe('canBuy', () => {
  it('bloqueia patente superior sem a anterior (sequencial)', () => {
    const empty = new Set<string>()
    const check = canBuy(sequentialConfig, empty, 'cavaleiro', 'aprendiz')
    expect(check.ok).toBe(false)
    if (!check.ok) expect(check.reason).toContain('Novato')
  })

  it('permite a primeira patente quando ha pontos', () => {
    const empty = new Set<string>()
    expect(canBuy(sequentialConfig, empty, 'cavaleiro', 'novato').ok).toBe(true)
  })

  it('bloqueia compra acima do orcamento', () => {
    const check = canBuy(config, defaultSet, 'cavaleiro', 'novato')
    expect(check.ok).toBe(false)
    if (!check.ok) expect(check.reason).toContain('Pontos insuficientes')
  })

  it('impede comprar algo ja adquirido', () => {
    const check = canBuy(config, defaultSet, 'conjurador', 'mestre')
    expect(check.ok).toBe(false)
  })

  it('permite qualquer ordem quando sequential = false', () => {
    const empty = new Set<string>()
    expect(canBuy(freeConfig, empty, 'cavaleiro', 'aprendiz').ok).toBe(true)
  })
})

describe('canSell', () => {
  it('nao remove patente que sustenta uma superior', () => {
    const check = canSell(config, defaultSet, 'conjurador', 'novato')
    expect(check.ok).toBe(false)
    if (!check.ok) expect(check.reason).toContain('Aprendiz')
  })

  it('remove a patente mais alta normalmente', () => {
    expect(canSell(config, defaultSet, 'conjurador', 'mestre').ok).toBe(true)
  })

  it('nao remove o que nao foi adquirido', () => {
    expect(canSell(config, defaultSet, 'cavaleiro', 'novato').ok).toBe(false)
  })
})

describe('fluxo compra + venda', () => {
  it('mantem coherencia apos comprar e remover', () => {
    const build = new Set<string>()
    expect(canBuy(sequentialConfig, build, 'cavaleiro', 'novato').ok).toBe(true)
    build.add(makePurchaseKey('cavaleiro', 'novato'))
    expect(computeStats(sequentialConfig, build).consumed).toBe(1000)

    expect(canBuy(sequentialConfig, build, 'cavaleiro', 'aprendiz').ok).toBe(true)
    build.add(makePurchaseKey('cavaleiro', 'aprendiz'))
    expect(computeStats(sequentialConfig, build).consumed).toBe(2500)
    expect(lineLevelName(sequentialConfig, build, 'cavaleiro')).toBe('Aprendiz')

    expect(canSell(sequentialConfig, build, 'cavaleiro', 'novato').ok).toBe(false)
    expect(canSell(sequentialConfig, build, 'cavaleiro', 'aprendiz').ok).toBe(true)
    build.delete(makePurchaseKey('cavaleiro', 'aprendiz'))
    expect(lineLevelName(sequentialConfig, build, 'cavaleiro')).toBe('Novato')
  })
})
