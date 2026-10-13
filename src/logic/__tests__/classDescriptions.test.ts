import { describe, expect, it } from 'vitest'
import { LINES, TIERS } from '../../data/skills'
import {
  CLASS_DESCRIPTIONS,
  assertNamesMatch,
  getTierEffect,
  validateCoverage,
} from '../../data/classDescriptions'

describe('classDescriptions - cobertura', () => {
  it('possui uma descricao para cada linha/classes do sistema', () => {
    expect(CLASS_DESCRIPTIONS).toHaveLength(LINES.length)
  })

  it('nao tem identificadores duplicados e usa lineIds validos', () => {
    const report = validateCoverage()
    expect(report.duplicateLineIds).toEqual([])
    expect(report.unknownLineIds).toEqual([])
  })

  it('nao deixa classes do sistema sem descricao', () => {
    expect(validateCoverage().missingInDescriptions).toEqual([])
  })

  it('descreve as 5 patentes de cada classe, sem tier invalido', () => {
    const report = validateCoverage()
    expect(report.tiersWithoutDescription).toEqual([])
    expect(report.unknownTierIds).toEqual([])
    expect(TIERS).toHaveLength(5)
  })

  it('mantem os nomes iguais aos da arvore', () => {
    expect(assertNamesMatch()).toEqual([])
  })

  it('tem descricao geral em todas as classes', () => {
    for (const entry of CLASS_DESCRIPTIONS) {
      expect(entry.general.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('classDescriptions - valores preservados', () => {
  it('ASSASSINO mestre mantem x3 minimo e 30%', () => {
    expect(getTierEffect('assassino', 'mestre')).toBe(
      '+200% de dano (x3), mínimo / Equipamento desgasta 30% menos.',
    )
  })

  it('ARQUEIRO mantem a velocidade de puxada (15%/30%)', () => {
    expect(getTierEffect('arqueiro', 'aprendiz')).toContain('15% mais rápido')
    expect(getTierEffect('arqueiro', 'adepto')).toContain('30% mais rápido')
  })

  it('SOLDADO e CAVALEIRO PESADO mantem a curva de reducao', () => {
    expect(getTierEffect('soldado', 'adepto')).toContain('-31% de dano recebido')
    expect(getTierEffect('soldado', 'mestre')).toContain('-50% de dano recebido (máximo)')
    expect(getTierEffect('cavaleiro-pesado', 'novato')).toContain('mínimo de 5 peças')
  })

  it('ESCUDEIRO novato exige escudo na mao', () => {
    expect(getTierEffect('escudeiro', 'novato')).toContain('com escudo na mão')
  })

  it('magias mantem o custo 35% e +1 nivel global', () => {
    for (const lineId of ['conjurador', 'curandeiro', 'mistico', 'ilusionista']) {
      expect(getTierEffect(lineId, 'novato')).toContain('+1 nível global')
      expect(getTierEffect(lineId, 'aprendiz')).toContain('35% menos')
    }
  })

  it('ILUSIONISTA preserva o termo da fonte ("advanced")', () => {
    expect(getTierEffect('ilusionista', 'especialista')).toContain('advanced')
  })

  it('FEITICEIRO usa os percentuais de dano mágico', () => {
    expect(getTierEffect('feiticeiro', 'novato')).toContain('+40% de dano com magia')
    expect(getTierEffect('feiticeiro', 'adepto')).toBe('+120% de dano com magia de Destruição.')
    expect(getTierEffect('feiticeiro', 'mestre')).toBe('+200% de dano com magia (x3, máximo).')
  })
})
