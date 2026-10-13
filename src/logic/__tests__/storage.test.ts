import { describe, expect, it } from 'vitest'
import {
  SCHEMA_VERSION,
  importFromText,
  serialize,
  toBuildFile,
  validateBuildFile,
} from '../storage'
import { DEFAULT_BUILD_STATE, TOTAL_POINTS } from '../../data/skills'

const baseBuild = DEFAULT_BUILD_STATE()

function validFile(overrides: Record<string, unknown> = {}) {
  return {
    version: SCHEMA_VERSION,
    totalPoints: TOTAL_POINTS,
    sequential: true,
    purchased: [...baseBuild.purchased],
    ...overrides,
  }
}

describe('serialize / validateBuildFile', () => {
  it('faz round-trip preservando as patentes', () => {
    const text = serialize(baseBuild)
    const { state } = importFromText(text)
    expect(new Set(state.purchased)).toEqual(new Set(baseBuild.purchased))
    expect(state.totalPoints).toBe(TOTAL_POINTS)
    expect(state.sequential).toBe(true)
  })

  it('toBuildFile ordena e adiciona a versao', () => {
    const file = toBuildFile(baseBuild)
    expect(file.version).toBe(SCHEMA_VERSION)
    expect([...file.purchased]).toEqual([...file.purchased].sort())
  })

  it('rejeita conteudo que nao e objeto', () => {
    expect(() => validateBuildFile(42)).toThrow(/objeto JSON/)
    expect(() => validateBuildFile(null)).toThrow()
  })

  it('rejeita version ausente', () => {
    const file = validFile()
    delete (file as { version?: number }).version
    expect(() => validateBuildFile(file)).toThrow(/version/)
  })

  it('rejeita totalPoints invalido', () => {
    expect(() => validateBuildFile(validFile({ totalPoints: -5 }))).toThrow(/totalPoints/)
  })

  it('rejeita configuracao acima do orcamento', () => {
    expect(() =>
      validateBuildFile(
        validFile({ totalPoints: 1000, purchased: ['assassino:novato', 'assassino:aprendiz'] }),
      ),
    ).toThrow(/excedem o orçamento/)
  })

  it('ignora chaves desconhecidas com aviso', () => {
    const result = validateBuildFile(
      validFile({ purchased: ['assassino:novato', 'inventado:patente'] }),
    )
    expect(result.state.purchased).toEqual(['assassino:novato'])
    expect(result.warnings.length).toBe(1)
  })

  it('rejeita lacuna quando sequential = true', () => {
    expect(() =>
      validateBuildFile(
        validFile({ purchased: ['curandeiro:aprendiz'] }),
      ),
    ).toThrow(/sequencial inválida/)
  })

  it('aceita lacuna quando sequential = false', () => {
    const result = validateBuildFile(
      validFile({ sequential: false, purchased: ['curandeiro:aprendiz'] }),
    )
    expect(result.state.purchased).toEqual(['curandeiro:aprendiz'])
  })

  it('remove duplicatas', () => {
    const result = validateBuildFile(
      validFile({ purchased: ['assassino:novato', 'assassino:novato'] }),
    )
    expect(result.state.purchased).toEqual(['assassino:novato'])
  })
})

describe('importFromText', () => {
  it('lanca erro amigavel para JSON invalido', () => {
    expect(() => importFromText('{ nao e json')).toThrow(/JSON/)
  })
})
