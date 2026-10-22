import { useEffect, useState } from 'react'
import { ExternalLink, KeyRound, X } from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'
import { useToastStore } from '../store/useToastStore'

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: Props) {
  const apiKey = useSettingsStore((s) => s.apiKey)
  const setApiKey = useSettingsStore((s) => s.setApiKey)
  const push = useToastStore((s) => s.push)
  const [draft, setDraft] = useState(apiKey)

  useEffect(() => {
    if (open) setDraft(apiKey)
  }, [open, apiKey])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-fade-up w-full max-w-md rounded-2xl border border-white/60 bg-fog p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2
              id="settings-title"
              className="font-display text-xl font-bold tracking-tight text-ink"
            >
              Настройки API
            </h2>
            <p className="mt-1 text-sm text-ink-soft/80">
              Ключ хранится только в вашем браузере (localStorage).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-soft hover:bg-mist"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
          <KeyRound size={16} className="text-sea" />
          GEMINI_API_KEY
        </label>
        <input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="AIza..."
          className="mb-3 w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none ring-sea/30 focus:ring-2"
          autoComplete="off"
        />

        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-sea hover:text-sea-deep"
        >
          Получить ключ в Google AI Studio
          <ExternalLink size={14} />
        </a>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-mist"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => {
              setApiKey(draft)
              push('Ключ сохранён', 'success')
              onClose()
            }}
            className="rounded-xl bg-sea px-4 py-2 text-sm font-semibold text-white hover:bg-sea-deep"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}
