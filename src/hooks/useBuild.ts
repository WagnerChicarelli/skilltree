import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BuildState, BuildStats } from '../types'
import { DEFAULT_BUILD_STATE, LINES, TIERS, makePurchaseKey } from '../data/skills'
import {
  canAddStatusPoint,
  canBuy,
  canRemoveStatusPoint,
  canSell,
  computeStats,
  getStatusPoints,
  statusPointsAvailable,
  statusPointsInvested,
  type ProgressConfig,
  type StatusActionAttr,
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

  const statusPoints = getStatusPoints(state.statusPoints)
  const statusInvested = statusPointsInvested(state.statusPoints)
  const statusAvailable = statusPointsAvailable(stats.globalLevel, state.statusPoints)

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

  const addStatusPoint = useCallback(
    (attr: StatusActionAttr): boolean => {
      const check = canAddStatusPoint(stats.globalLevel, state.statusPoints, attr)
      if (!check.ok) {
        notify({ type: 'error', text: check.reason })
        return false
      }
      setState((prev) => {
        const sp = getStatusPoints(prev.statusPoints)
        return { ...prev, statusPoints: { ...sp, [attr]: sp[attr] + 1 } }
      })
      return true
    },
    [stats.globalLevel, state.statusPoints, notify],
  )

  const removeStatusPoint = useCallback(
    (attr: StatusActionAttr): boolean => {
      const check = canRemoveStatusPoint(state.statusPoints, attr)
      if (!check.ok) {
        notify({ type: 'error', text: check.reason })
        return false
      }
      setState((prev) => {
        const sp = getStatusPoints(prev.statusPoints)
        return { ...prev, statusPoints: { ...sp, [attr]: sp[attr] - 1 } }
      })
      return true
    },
    [state.statusPoints, notify],
  )

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      purchased: [],
      statusPoints: { life: 0, mana: 0, stamina: 0 },
    }))
    notify({ type: 'success', text: 'Configuração reiniciada.' })
  }, [notify])

  const replace = useCallback((next: BuildState) => {
    setState(next)
  }, [])

  return {
    state,
    config,
    purchased,
    stats,
    statusPoints,
    statusInvested,
    statusAvailable,
    buy,
    sell,
    addStatusPoint,
    removeStatusPoint,
    reset,
    replace,
    notice,
    clearNotice: () => notify(null),
    notify,
  }
}
