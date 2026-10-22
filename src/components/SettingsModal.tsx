'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, KeyRound, X } from 'lucide-react'
import { api, ApiError } from '@/lib/api-client'
import { useAuthStore } from '@/store/useAuthStore'
import { useToastStore } from '@/store/useToastStore'

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: Props) {
  const setUser = useAuthStore((s) => s.setUser)
  const user = useAuthStore((s) => s.user)
  const push = useToastStore((s) => s.push)
  const [draft, setDraft] = useState('')
  const [masked, setMasked] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setDraft('')
    void (async () => {
      try {
        const data = await api<{ hasKey: boolean; masked: string | null }>(
          '/api/settings/gemini-key',
        )
        setMasked(data.masked)
      } catch {
        setMasked(null)
      }
    })()
  }, [open])

  if (!open) return null

  async function save() {
    setBusy(true)
    try {
      const data = await api<{ hasKey: boolean; masked: string | null }>(
        '/api/settings/gemini-key',
        { method: 'PUT', body: JSON.stringify({ apiKey: draft }) },
      )
      setMasked(data.masked)
      setDraft('')
      if (user) setUser({ ...user, hasGeminiKey: true })
      push('Ключ сохранён в базе данных', 'success')
      onClose()
    } catch (error) {
      push(error instanceof ApiError ? error.message : 'Не удалось сохранить', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function removeKey() {
    setBusy(true)
    try {
      await api('/api/settings/gemini-key', { method: 'DELETE' })
      setMasked(null)
      if (user) setUser({ ...user, hasGeminiKey: false })
      push('Ключ удалён', 'success')
    } catch (error) {
      push(error instanceof ApiError ? error.message : 'Ошибка удаления', 'error')
    } finally {
      setBusy(false)
    }
  }

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
              Gemini API
            </h2>
            <p className="mt-1 text-sm text-ink-soft/80">
              Ключ шифруется и хранится в Neon для вашего аккаунта. В браузер
              не попадает.
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

        {masked ? (
          <p className="mb-3 rounded-xl bg-mist px-3 py-2 text-sm text-ink-soft">
            Текущий ключ: <span className="font-mono font-semibold text-ink">{masked}</span>
          </p>
        ) : null}

        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
          <KeyRound size={16} className="text-sea" />
          {masked ? 'Заменить ключ' : 'GEMINI_API_KEY'}
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

        <div className="flex flex-wrap justify-end gap-2">
          {masked ? (
            <button
              type="button"
              onClick={removeKey}
              disabled={busy}
              className="mr-auto rounded-xl px-4 py-2 text-sm font-semibold text-coral hover:bg-coral/10 disabled:opacity-50"
            >
              Удалить
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-mist"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy || draft.trim().length < 10}
            className="rounded-xl bg-sea px-4 py-2 text-sm font-semibold text-white hover:bg-sea-deep disabled:opacity-40"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}
