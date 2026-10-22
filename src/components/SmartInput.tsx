'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { api, ApiError } from '@/lib/api-client'
import { useAuthStore } from '@/store/useAuthStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useToastStore } from '@/store/useToastStore'
import type { Task } from '@/types/task'

interface Props {
  onNeedKey: () => void
  aiAutoFill: boolean
  setAiAutoFill: (v: boolean) => void
}

export function SmartInput({ onNeedKey, aiAutoFill, setAiAutoFill }: Props) {
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const hasGeminiKey = useAuthStore((s) => s.user?.hasGeminiKey)
  const upsertTask = useTaskStore((s) => s.upsertTask)
  const setAnalyzing = useTaskStore((s) => s.setAnalyzing)
  const push = useToastStore((s) => s.push)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = title.trim()
    if (!value || busy) return

    if (aiAutoFill && !hasGeminiKey) {
      push('Сначала сохраните GEMINI_API_KEY в настройках', 'error')
      onNeedKey()
      return
    }

    setTitle('')
    setBusy(true)

    try {
      if (aiAutoFill) {
        const tempId = `temp-${crypto.randomUUID()}`
        setAnalyzing(tempId, true)
        const data = await api<{
          task: Task
          analyzed: boolean
          warning?: string
        }>('/api/ai/analyze', {
          method: 'POST',
          body: JSON.stringify({ title: value }),
        })
        setAnalyzing(tempId, false)
        upsertTask(data.task)
        if (data.warning) push(data.warning, 'info')
        if (data.warning?.includes('Ключ')) onNeedKey()
      } else {
        const data = await api<{ task: Task }>('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({ title: value }),
        })
        upsertTask(data.task)
      }
    } catch (error) {
      push(error instanceof ApiError ? error.message : 'Не удалось создать задачу', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer select-none items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={aiAutoFill}
            onClick={() => setAiAutoFill(!aiAutoFill)}
            className={clsx(
              'relative h-6 w-11 rounded-full transition-colors',
              aiAutoFill ? 'bg-sea' : 'bg-ink/20',
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                aiAutoFill && 'translate-x-5',
              )}
            />
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
            <Sparkles size={15} className="text-sea" />
            AI Auto-fill
          </span>
        </label>
      </div>

      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Например: «Подготовить квартальный отчет к пятнице»'
          className="min-w-0 flex-1 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3.5 text-[15px] shadow-sm outline-none ring-sea/25 backdrop-blur placeholder:text-ink-soft/45 focus:ring-2"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={!title.trim() || busy}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-ink px-5 py-3.5 text-sm font-bold text-white transition hover:bg-ink-soft disabled:opacity-40"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          Добавить
        </button>
      </div>
    </form>
  )
}
