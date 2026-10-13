import { LINES, TIERS, lineById } from './skills'

/**
 * Descricoes das classes e dos efeitos por patente.
 *
 * Fonte: `atributos_classes.txt` (documento original do projeto).
 * Texto preservado integralmente, incluindo percentuais, valores,
 * observacoes entre parenteses e requisitos de equipamento.
 *
 * FONTE UNICA de dados: nao duplicar estas descricoes em componentes.
 * Cada classe possui sua propria entrada, associada por `lineId` estavel.
 */

export interface ClassTierDescription {
  /** Identificador da patente (novato, aprendiz, adepto, especialista, mestre). */
  tierId: string
  /** Descricao completa do efeito, exatamente como na fonte. */
  effect: string
}

export interface ClassDescription {
  /** Identificador estavel da classe/linha (igual ao `LineDef.id`). */
  lineId: string
  /** Nome da classe. */
  name: string
  /** Descricao geral da classe, quando disponivel na fonte. */
  general: string
  /** Efeitos por patente, em ordem de progressao. */
  tiers: ClassTierDescription[]
}

/** Efeitos genericos compartilhados por classes de arma de uma/duas maos. */
function weaponTiers(): ClassTierDescription[] {
  return [
    {
      tierId: 'novato',
      effect:
        '+40% de dano com a arma da classe (vale a maior skill da família). Equipamento desgasta 6% menos.',
    },
    {
      tierId: 'aprendiz',
      effect:
        '-10% de dano mitigado (seu dano ignora 10% da defesa/mitigação do alvo) / Equipamento desgasta 12% menos.',
    },
    {
      tierId: 'adepto',
      effect: '+120% de dano com a arma da classe / Equipamento desgasta 18% menos.',
    },
    {
      tierId: 'especialista',
      effect: '+160% de dano com a arma da classe / Equipamento desgasta 24% menos.',
    },
    {
      tierId: 'mestre',
      effect: '+200% de dano (x3), mínimo / Equipamento desgasta 30% menos.',
    },
  ]
}

/** Efeitos compartilhados por classes de armadura. */
function armorTiers(): ClassTierDescription[] {
  return [
    {
      tierId: 'novato',
      effect:
        '-10% de dano recebido vestindo o equipamento da classe (mínimo de 5 peças). Armaduras desgastam 6% menos.',
    },
    { tierId: 'aprendiz', effect: '-20% de dano recebido / Armaduras desgastam 12% menos.' },
    { tierId: 'adepto', effect: '-31% de dano recebido / Armaduras desgastam 18% menos.' },
    {
      tierId: 'especialista',
      effect: '-40% de dano recebido / Armaduras desgastam 24% menos.',
    },
    {
      tierId: 'mestre',
      effect: '-50% de dano recebido (máximo) / Armaduras desgastam 30% menos.',
    },
  ]
}

export const CLASS_DESCRIPTIONS: ClassDescription[] = [
  {
    lineId: 'assassino',
    name: 'Assassino',
    general: 'Adagas e furtividade.',
    tiers: weaponTiers(),
  },
  {
    lineId: 'batedor',
    name: 'Batedor',
    general: 'Espadas curtas (família das espadas de uma mão).',
    tiers: weaponTiers(),
  },
  {
    lineId: 'cavaleiro',
    name: 'Cavaleiro',
    general: 'Espadas, espadas curtas, sabres e katanas de uma mão.',
    tiers: weaponTiers(),
  },
  {
    lineId: 'precursor',
    name: 'Precursor',
    general: 'Sabres e cimitarras (família das espadas de uma mão).',
    tiers: weaponTiers(),
  },
  {
    lineId: 'espiao',
    name: 'Espião',
    general: 'Katanas, tantos e wakizashis (família das espadas de uma mão).',
    tiers: weaponTiers(),
  },
  {
    lineId: 'bandido',
    name: 'Bandido',
    general: 'Maças, clavas e martelos de uma mão.',
    tiers: weaponTiers(),
  },
  {
    lineId: 'berserker',
    name: 'Berserker',
    general: 'Machados de uma mão.',
    tiers: weaponTiers(),
  },
  {
    lineId: 'brutamontes',
    name: 'Brutamontes',
    general: 'Martelos de uma mão (família das maças).',
    tiers: weaponTiers(),
  },
  {
    lineId: 'espadachim',
    name: 'Espadachim',
    general: 'Espadas de duas mãos e nodachi.',
    tiers: weaponTiers(),
  },
  {
    lineId: 'lamina',
    name: 'Lâmina',
    general: 'Katanas gigantes e nodachis.',
    tiers: weaponTiers(),
  },
  {
    lineId: 'lenhador-de-guerra',
    name: 'Lenhador de Guerra',
    general: 'Machados de batalha e alabardas de duas mãos.',
    tiers: weaponTiers(),
  },
  {
    lineId: 'destruidor',
    name: 'Destruidor',
    general: 'Martelos de guerra de duas mãos.',
    tiers: weaponTiers(),
  },
  {
    lineId: 'monge',
    name: 'Monge',
    general: 'Bastões de combate e luta desarmada.',
    tiers: weaponTiers(),
  },
  {
    lineId: 'lanceiro',
    name: 'Lanceiro',
    general: 'Lanças, piques e tridentes.',
    tiers: weaponTiers(),
  },
  {
    lineId: 'guarda',
    name: 'Guarda',
    general: 'Alabardas e glaives.',
    tiers: weaponTiers(),
  },
  {
    lineId: 'arqueiro',
    name: 'Arqueiro',
    general: 'Arcos e bestas.',
    tiers: [
      {
        tierId: 'novato',
        effect:
          '+40% de dano com arcos e bestas. Ao mirar, segurar o comando de bloqueio ativa a função de zoom. Equipamentos desgastam 6% menos.',
      },
      {
        tierId: 'aprendiz',
        effect: '-10% de dano, puxa o arco 15% mais rápido / Equipamentos desgastam 12% menos.',
      },
      {
        tierId: 'adepto',
        effect: '+120% de dano, puxa o arco 30% mais rápido / Equipamentos desgastam 18% menos.',
      },
      {
        tierId: 'especialista',
        effect: '+160% de dano / Equipamentos desgastam 24% menos.',
      },
      {
        tierId: 'mestre',
        effect: '+200% de dano (x3), mínimo / Equipamentos desgastam 30% menos.',
      },
    ],
  },
  {
    lineId: 'soldado',
    name: 'Soldado',
    general: 'Usa Armadura Leve.',
    tiers: armorTiers(),
  },
  {
    lineId: 'cavaleiro-pesado',
    name: 'Cavaleiro Pesado',
    general: 'Usa Armadura Pesada.',
    tiers: armorTiers(),
  },
  {
    lineId: 'escudeiro',
    name: 'Escudeiro',
    general: 'Especialista em Combate com Escudo.',
    tiers: [
      {
        tierId: 'novato',
        effect:
          '-10% de dano recebido com escudo na mão. Armaduras e escudos desgastam 6% menos.',
      },
      {
        tierId: 'aprendiz',
        effect: '-20% de dano recebido / Equipamentos desgastam 12% menos.',
      },
      {
        tierId: 'adepto',
        effect: '-31% de dano recebido / Equipamentos desgastam 18% menos.',
      },
      {
        tierId: 'especialista',
        effect: '-40% de dano recebido / Equipamentos desgastam 24% menos.',
      },
      {
        tierId: 'mestre',
        effect: '-50% de dano recebido (máximo) / Equipamentos desgastam 30% menos.',
      },
    ],
  },
  {
    lineId: 'conjurador',
    name: 'Conjurador',
    general: 'Pratica magia da Escola de Conjuração.',
    tiers: [
      {
        tierId: 'novato',
        effect: '+1 nível global (ponto de atributo). Pratica magia da Escola de Conjuração.',
      },
      {
        tierId: 'aprendiz',
        effect:
          '+1 nível global (ponto de atributo). Maestria em Conjuração — feitiços de Conjuração custam 35% menos.',
      },
      {
        tierId: 'adepto',
        effect:
          '+1 nível global (ponto de atributo). Atromancia — invocações duram o dobro do tempo.',
      },
      {
        tierId: 'especialista',
        effect:
          '+1 nível global (ponto de atributo). Marcha dos Mortos — capacidade de invocar mais aliados simultaneamente.',
      },
      {
        tierId: 'mestre',
        effect:
          '+1 nível global (ponto de atributo). Fusão Psíquica — permite invocar criaturas a uma distância muito maior.',
      },
    ],
  },
  {
    lineId: 'curandeiro',
    name: 'Curandeiro',
    general: 'Pratica magia da Escola de Restauração.',
    tiers: [
      {
        tierId: 'novato',
        effect: '+1 nível global (ponto de atributo). Pratica magia da Escola de Restauração.',
      },
      {
        tierId: 'aprendiz',
        effect:
          '+1 nível global (ponto de atributo). Maestria em Restauração — feitiços de Restauração custam 35% menos.',
      },
      {
        tierId: 'adepto',
        effect:
          '+1 nível global (ponto de atributo). Libera magias de suporte e cura de nível intermediário.',
      },
      {
        tierId: 'especialista',
        effect:
          '+1 nível global (ponto de atributo). Libera magias avançadas de suporte, regeneração e barreiras protetivas.',
      },
      {
        tierId: 'mestre',
        effect:
          '+1 nível global (ponto de atributo). Libera feitiços de cura supremos e salvamento em área.',
      },
    ],
  },
  {
    lineId: 'mistico',
    name: 'Místico',
    general: 'Pratica magia da Escola de Alteração.',
    tiers: [
      {
        tierId: 'novato',
        effect: '+1 nível global (ponto de atributo). Pratica magia da Escola de Alteração.',
      },
      {
        tierId: 'aprendiz',
        effect:
          '+1 nível global (ponto de atributo). Maestria em Alteração — feitiços de Alteração custam 35% menos.',
      },
      {
        tierId: 'adepto',
        effect:
          '+1 nível global (ponto de atributo). Magia Intuitiva — feitiços utilitários requerem menos custos ou condições.',
      },
      {
        tierId: 'especialista',
        effect:
          '+1 nível global (ponto de atributo). Libera bônus avançados de utilidade, como pele de ferro e resistências passivas.',
      },
      {
        tierId: 'mestre',
        effect:
          '+1 nível global (ponto de atributo). Libera feitiços utilitários supremos de manipulação física e do ambiente.',
      },
    ],
  },
  {
    lineId: 'ilusionista',
    name: 'Ilusionista',
    general: 'Pratica magia da Escola de Ilusão.',
    tiers: [
      {
        tierId: 'novato',
        effect: '+1 nível global (ponto de atributo). Pratica magia da Escola de Ilusão.',
      },
      {
        tierId: 'aprendiz',
        effect:
          '+1 nível global (ponto de atributo). Maestria em Ilusão — feitiços de Ilusão custam 35% menos.',
      },
      {
        tierId: 'adepto',
        effect:
          '+1 nível global (ponto de atributo). Libera feitiços intermediários de controle mental (fúria, medo, acalmar).',
      },
      {
        tierId: 'especialista',
        effect:
          '+1 nível global (ponto de atributo). Libera feitiços advanced de controle e manipulação de múltiplos alvos.',
      },
      {
        tierId: 'mestre',
        effect:
          '+1 nível global (ponto de atributo). Tempestade Silenciosa — seus feitiços não emitem som e não alertam inimigos (bônus furtivo absoluto).',
      },
    ],
  },
  {
    lineId: 'feiticeiro',
    name: 'Feiticeiro',
    general: 'Pratica magia da Escola de Destruição.',
    tiers: [
      {
        tierId: 'novato',
        effect:
          '+40% de dano com magia de dano (toda escola de Destruição, cajados e pergaminhos).',
      },
      {
        tierId: 'aprendiz',
        effect:
          '-10% de dano com magia (ignora 10% da resistência do alvo) / Maestria em Destruição — feitiços de Destruição custam 35% menos.',
      },
      { tierId: 'adepto', effect: '+120% de dano com magia de Destruição.' },
      {
        tierId: 'especialista',
        effect:
          '+160% de dano com magia / Força da Natureza — feitiços elementais específicos custam ainda menos.',
      },
      { tierId: 'mestre', effect: '+200% de dano com magia (x3, máximo).' },
    ],
  },
]

/** Indice por `lineId` para acesso rapido. */
export const CLASS_DESCRIPTION_BY_LINE: Record<string, ClassDescription> = Object.fromEntries(
  CLASS_DESCRIPTIONS.map((entry) => [entry.lineId, entry]),
)

export function getClassDescription(lineId: string): ClassDescription | undefined {
  return CLASS_DESCRIPTION_BY_LINE[lineId]
}

export function getTierEffect(lineId: string, tierId: string): string | undefined {
  return getClassDescription(lineId)?.tiers.find((tier) => tier.tierId === tierId)?.effect
}

export interface CoverageReport {
  /** Linhas existentes no sistema sem descricao no arquivo. */
  missingInDescriptions: string[]
  /** Classes descritas no arquivo que nao existem no sistema (por lineId). */
  unknownLineIds: string[]
  /** LineIds duplicados na fonte convertida. */
  duplicateLineIds: string[]
  /** Combinacoes lineId:tierId sem descricao (inclui patentes ausentes). */
  tiersWithoutDescription: string[]
  /** tierIds usados que nao existem na definicao de patentes. */
  unknownTierIds: string[]
}

/**
 * Valida a cobertura entre as descricoes convertidas e a arvore atual.
 * Usado por testes para garantir que nenhuma classe/nivel ficou de fora.
 */
export function validateCoverage(): CoverageReport {
  const knownLineIds = new Set(LINES.map((line) => line.id))
  const knownTierIds = new Set(TIERS.map((tier) => tier.id))

  const seen = new Set<string>()
  const duplicateLineIds: string[] = []
  const unknownLineIds: string[] = []
  const unknownTierIds: string[] = []
  const tiersWithoutDescription: string[] = []

  for (const entry of CLASS_DESCRIPTIONS) {
    if (seen.has(entry.lineId)) duplicateLineIds.push(entry.lineId)
    seen.add(entry.lineId)

    if (!knownLineIds.has(entry.lineId)) unknownLineIds.push(entry.lineId)

    const describedTiers = new Set(entry.tiers.map((tier) => tier.tierId))
    for (const tier of entry.tiers) {
      if (!knownTierIds.has(tier.tierId)) unknownTierIds.push(`${entry.lineId}:${tier.tierId}`)
    }
    for (const tier of TIERS) {
      if (!describedTiers.has(tier.id)) {
        tiersWithoutDescription.push(`${entry.lineId}:${tier.id}`)
      }
    }
  }

  const missingInDescriptions = LINES.filter((line) => !seen.has(line.id)).map((line) => line.id)

  return {
    missingInDescriptions,
    unknownLineIds,
    duplicateLineIds,
    tiersWithoutDescription,
    unknownTierIds,
  }
}

/** Garante que todo lineId descrito tem um nome consistente com a arvore. */
export function assertNamesMatch(): string[] {
  const mismatches: string[] = []
  for (const entry of CLASS_DESCRIPTIONS) {
    const line = lineById(entry.lineId)
    if (line && line.name !== entry.name) {
      mismatches.push(`${entry.lineId}: "${entry.name}" != "${line.name}"`)
    }
  }
  return mismatches
}
