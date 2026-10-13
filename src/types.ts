/**
 * Tipos centrais da aplicacao.
 *
 * Modelo derivado da planilha "ARVORE DE SKILLS.xlsx" (aba "Divisao de Pontos"):
 *  - 1 orcamento total de pontos (31500);
 *  - 5 patentes com custos fixos;
 *  - 24 linhas/classes, cada uma podendo comprar as 5 patentes (sequencialmente).
 */

export type TierId = string

export interface TierDef {
  /** Identificador estavel da patente (nao mudar). */
  id: TierId
  name: string
  cost: number
  /** Ordem de progressao (0 = primeira patente). */
  order: number
}

export interface LineDef {
  /** Identificador estavel da linha/classes (nao mudar). */
  id: string
  name: string
}

export interface TreeData {
  totalPoints: number
  sequential: boolean
  tiers: TierDef[]
  lines: LineDef[]
}

/** Chave estavel de uma patente adquirida: `lineId:tierId`. */
export type PurchaseKey = string

export interface BuildState {
  totalPoints: number
  sequential: boolean
  /** Lista de chaves adquiridas (`lineId:tierId`). */
  purchased: PurchaseKey[]
}

export interface BuildStats {
  consumed: number
  remaining: number
  globalLevel: number
  activeLines: number
}

/** Resultado de uma tentativa de compra/remocao. */
export type ActionCheck = { ok: true } | { ok: false; reason: string }

/** Estrutura persistida/exportada em JSON. */
export interface BuildFile {
  version: number
  totalPoints: number
  sequential: boolean
  purchased: PurchaseKey[]
}
