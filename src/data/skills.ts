import type { BuildState, LineDef, TierDef, TreeData } from '../types'

/**
 * Dados convertidos de "ARVORE DE SKILLS.xlsx" (aba "Divisao de Pontos").
 *
 * IMPORTANTE: nao altere os `id` existentes. Para adicionar/editar dados,
 * veja a secao "Atualizando os dados" do README.
 */

/** Patentes (colunas B..F da planilha) com custos fixos. */
export const TIERS: TierDef[] = [
  { id: 'novato', name: 'Novato', cost: 1000, order: 0 },
  { id: 'aprendiz', name: 'Aprendiz', cost: 1500, order: 1 },
  { id: 'adepto', name: 'Adepto', cost: 2000, order: 2 },
  { id: 'especialista', name: 'Especialista', cost: 2500, order: 3 },
  { id: 'mestre', name: 'Mestre', cost: 3500, order: 4 },
]

/** Linhas/classes (coluna A, linhas 8..31). Ordem preservada da planilha. */
export const LINES: LineDef[] = [
  { id: 'assassino', name: 'Assassino' },
  { id: 'batedor', name: 'Batedor' },
  { id: 'cavaleiro', name: 'Cavaleiro' },
  { id: 'precursor', name: 'Precursor' },
  { id: 'espiao', name: 'Espião' },
  { id: 'bandido', name: 'Bandido' },
  { id: 'berserker', name: 'Berserker' },
  { id: 'brutamontes', name: 'Brutamontes' },
  { id: 'arqueiro', name: 'Arqueiro' },
  { id: 'espadachim', name: 'Espadachim' },
  { id: 'lamina', name: 'Lâmina' },
  { id: 'lenhador-de-guerra', name: 'Lenhador de Guerra' },
  { id: 'destruidor', name: 'Destruidor' },
  { id: 'monge', name: 'Monge' },
  { id: 'lanceiro', name: 'Lanceiro' },
  { id: 'guarda', name: 'Guarda' },
  { id: 'soldado', name: 'Soldado' },
  { id: 'cavaleiro-pesado', name: 'Cavaleiro Pesado' },
  { id: 'escudeiro', name: 'Escudeiro' },
  { id: 'conjurador', name: 'Conjurador' },
  { id: 'mistico', name: 'Místico' },
  { id: 'feiticeiro', name: 'Feiticeiro' },
  { id: 'ilusionista', name: 'Ilusionista' },
  { id: 'curandeiro', name: 'Curandeiro' },
]

/** Orcamento total de pontos ("PONTOS TOTAIS ORCADOS" - celula A5). */
export const TOTAL_POINTS = 31500

/**
 * Exemplo da planilha de origem (apenas referencia/testes):
 * 6 linhas com Novato; Conjurador e Feiticeiro completos (5 patentes);
 * Mistico e Ilusionista com Novato; Curandeiro com Novato+Aprendiz.
 * Total consumido = 31500 | Nivel global = 20.
 */
export const SPREADSHEET_EXAMPLE_PURCHASED: string[] = [
  'assassino:novato',
  'precursor:novato',
  'espiao:novato',
  'espadachim:novato',
  'monge:novato',
  'lanceiro:novato',
  'conjurador:novato',
  'conjurador:aprendiz',
  'conjurador:adepto',
  'conjurador:especialista',
  'conjurador:mestre',
  'feiticeiro:novato',
  'feiticeiro:aprendiz',
  'feiticeiro:adepto',
  'feiticeiro:especialista',
  'feiticeiro:mestre',
  'mistico:novato',
  'ilusionista:novato',
  'curandeiro:novato',
  'curandeiro:aprendiz',
]

/**
 * Estado inicial da aplicacao: arvore limpa, sem nenhuma patente adquirida.
 * O usuario monta a configuracao do zero. O exemplo da planilha permanece
 * disponivel em `SPREADSHEET_EXAMPLE_PURCHASED`.
 */
export const DEFAULT_PURCHASED: string[] = []

export const TREE: TreeData = {
  totalPoints: TOTAL_POINTS,
  sequential: true,
  tiers: TIERS,
  lines: LINES,
}

export function makePurchaseKey(lineId: string, tierId: string): string {
  return `${lineId}:${tierId}`
}

export function parsePurchaseKey(key: string): { lineId: string; tierId: string } | null {
  const index = key.indexOf(':')
  if (index <= 0 || index === key.length - 1) return null
  return { lineId: key.slice(0, index), tierId: key.slice(index + 1) }
}

/** Todas as chaves validas (`lineId:tierId`) segundo os dados atuais. */
export const VALID_KEYS: Set<string> = new Set(
  LINES.flatMap((line) => TIERS.map((tier) => makePurchaseKey(line.id, tier.id))),
)

export const STATUS_BASE = 100
export const STATUS_PER_POINT = 25

export function DEFAULT_BUILD_STATE(): BuildState {
  return {
    totalPoints: TOTAL_POINTS,
    sequential: true,
    purchased: [...DEFAULT_PURCHASED],
    statusPoints: { life: 0, mana: 0, stamina: 0 },
  }
}

export function tierById(id: string): TierDef | undefined {
  return TIERS.find((tier) => tier.id === id)
}

export function lineById(id: string): LineDef | undefined {
  return LINES.find((line) => line.id === id)
}
