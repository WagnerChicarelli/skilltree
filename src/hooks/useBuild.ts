import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BuildState, BuildStats } from '../types'
import { DEFAULT_BUILD_STATE, LINES, TIERS, makePurchaseKey } from '../data/skills'
import {
  DEFAULT_CONFIG,
  canBuy,
  canSell,
  computeStats,
  type ProgressConfig,
} from '../logic/progression'
import { loadFromStorage, saveToStorage } from '../logic/storage'

export interface Notice {
  type: 'error' | 'success' | 'warning'
  text: string
}

export function useBuild() {
  const [state, setState] = useState<BuildState>(() => loadFromStorage() ?? DEFAULT_BUILD_STATE())

  const purchased = useMemo(() => new Set(state.purchased), [state.purchased])

  const config: ProgressConfig = useMemo(
    () => ({
      tiers: TIERS,
      lines: LINES,
      totalPoints: state.totalPoints,
      sequential: state.sequential,
    }),
    [state.totalPoints, state.sequential],
  )

  const stats: BuildStats = useMemo(() => computeStats(config, purchased), [config, purchased])

  const [notice, setNotice] = useState<Notice | null>(null)
  const noticeTimer = useRef<number | null>(null)

  const notify = useCallback((next: Notice | null) => {
    setNotice(next)
    if (noticeTimer.current !== null) {
      window.clearTimeout(noticeTimer.current)
      noticeTimer.current = null
    }
    if (next) {
      noticeTimer.current = window.setTimeout(() => setNotice(null), 4200)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current)
    }
  }, [])

  useEffect(() => {
    saveToStorage(state)
  }, [state])

  const buy = useCallback(
    (lineId: string, tierId: string): boolean => {
      const check = canBuy(config, purchased, lineId, tierId)
      if (!check.ok) {
        notify({ type: 'error', text: check.reason })
        return false
      }
      const key = makePurchaseKey(lineId, tierId)
      setState((prev) => ({ ...prev, purchased: [...prev.purchased, key] }))
      notify({ type: 'success', text: 'Patente adquirida.' })
      return true
    },
    [config, purchased, notify],
  )

  const sell = useCallback(
    (lineId: string, tierId: string): boolean => {
      const check = canSell(config, purchased, lineId, tierId)
      if (!check.ok) {
        notify({ type: 'error', text: check.reason })
        return false
      }
      const key = makePurchaseKey(lineId, tierId)
      setState((prev) => ({
        ...prev,
        purchased: prev.purchased.filter((item) => item !== key),
      }))
      notify({ type: 'success', text: 'Patente removida.' })
      return true
    },
    [config, purchased, notify],
  )

  const reset = useCallback(() => {
    setState((prev) => ({ ...prev, purchased: [] }))
    notify({ type: 'success', text: 'Configuração reiniciada.' })
  }, [notify])

  const replace = useCallback((next: BuildState) => {
    setState(next)
  }, [])

  const setConfig = useCallback(
    (patch: Partial<Pick<BuildState, 'totalPoints' | 'sequential'>>) => {
      setState((prev) => {
        const merged = { ...prev, ...patch }
        if (merged.totalPoints < 0) merged.totalPoints = 0
        return merged
      })
    },
    [],
  )

  return {
    state,
    config,
    purchased,
    stats,
    buy,
    sell,
    reset,
    replace,
    setConfig,
    notice,
    clearNotice: () => notify(null),
    notify,
    defaultConfig: DEFAULT_CONFIG,
  }
}
