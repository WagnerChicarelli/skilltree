import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import { StatsPanel } from './components/StatsPanel'
import { Toolbar } from './components/Toolbar'
import { SkillTree, type FilterMode } from './components/SkillTree'
import { DetailPanel } from './components/DetailPanel'
import { ConfirmDialog } from './components/ConfirmDialog'
import { useBuild } from './hooks/useBuild'
import { importFromText, serialize } from './logic/storage'

export default function App() {
  const {
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
    clearNotice,
    notify,
  } = useBuild()

  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [confirmReset, setConfirmReset] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelectNode = useCallback((lineId: string, tierId: string | null) => {
    setSelectedLineId(lineId)
    setSelectedTierId(tierId)
  }, [])

  const handleExport = useCallback(() => {
    try {
      const blob = new Blob([serialize(state)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'arvore-de-skills.json'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      notify({ type: 'success', text: 'Configuração exportada.' })
    } catch {
      notify({ type: 'error', text: 'Não foi possível exportar a configuração.' })
    }
  }, [state, notify])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      try {
        const text = await file.text()
        const { state: next, warnings } = importFromText(text)
        replace(next)
        setSelectedLineId(null)
        setSelectedTierId(null)
        if (warnings.length > 0) {
          notify({ type: 'warning', text: warnings.join(' ') })
        } else {
          notify({ type: 'success', text: 'Configuração importada com sucesso.' })
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Falha ao importar o arquivo.'
        notify({ type: 'error', text: message })
      }
    },
    [replace, notify],
  )

  const handleConfirmReset = useCallback(() => {
    reset()
    setConfirmReset(false)
    setSelectedLineId(null)
    setSelectedTierId(null)
  }, [reset])

  return (
    <div className="app">
      <Toolbar
        query={query}
        onQueryChange={setQuery}
        filter={filter}
        onFilterChange={setFilter}
        totalPoints={state.totalPoints}
        sequential={state.sequential}
        onConfigChange={setConfig}
        onExport={handleExport}
        onImportClick={handleImportClick}
        onResetClick={() => setConfirmReset(true)}
      />

      <StatsPanel stats={stats} totalPoints={state.totalPoints} />

      <main className="workspace">
        <SkillTree
          config={config}
          purchased={purchased}
          selectedLineId={selectedLineId}
          selectedTierId={selectedTierId}
          query={query}
          filter={filter}
          onSelectNode={handleSelectNode}
        />
        {selectedLineId && (
          <DetailPanel
            lineId={selectedLineId}
            selectedTierId={selectedTierId}
            config={config}
            purchased={purchased}
            onBuy={buy}
            onSell={sell}
            onClose={() => {
              setSelectedLineId(null)
              setSelectedTierId(null)
            }}
          />
        )}
      </main>

      <footer className="app__footer">
        <p>
          Progresso salvo automaticamente <strong>apenas neste navegador</strong> (localStorage).
          Nada é enviado para a nuvem.
        </p>
      </footer>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="visually-hidden"
        onChange={handleFileChange}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reiniciar configuração"
        message="Isso removerá todas as patentes adquiridas. Esta ação não pode ser desfeita."
        confirmLabel="Reiniciar"
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmReset(false)}
      />

      {notice && (
        <div className={`toast toast--${notice.type}`} role="status">
          <span>{notice.text}</span>
          <button type="button" className="icon-btn" onClick={clearNotice} aria-label="Fechar aviso">
            ×
          </button>
        </div>
      )}
    </div>
  )
}
