import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { analyzeNewTaskWithAI, GeminiError } from '../lib/gemini'
import { useSettingsStore } from '../store/useSettingsStore'
import { useTaskStore } from '../store/useTaskStore'
import { useToastStore } from '../store/useToastStore'

interface Props {
  onNeedKey: () => void
}

export function SmartInput({ onNeedKey }: Props) {
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const aiAutoFill = useSettingsStore((s) => s.aiAutoFill)
  const setAiAutoFill = useSettingsStore((s) => s.setAiAutoFill)
  const apiKey = useSettingsStore((s) => s.apiKey)
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const setAnalyzing = useTaskStore((s) => s.setAnalyzing)
  const push = useToastStore((s) => s.push)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = title.trim()
    if (!value || busy) return

    if (aiAutoFill && !apiKey) {
      push('Сначала добавьте GEMINI_API_KEY', 'error')
      onNeedKey()
      return
    }

    setTitle('')
    const task = addTask({ title: value })

    if (!aiAutoFill) return

    setBusy(true)
    setAnalyzing(task.id, true)
    try {
      const analysis = await analyzeNewTaskWithAI(apiKey, value)
      updateTask(task.id, {
        priority: analysis.priority,
        quadrant: analysis.quadrant,
        estimatedMinutes: analysis.estimatedMinutes,
        dueDate: analysis.dueDate,
        tags: analysis.tags,
        aiScore: analysis.aiScore,
        aiReasoning: analysis.aiReasoning,
      })
    } catch (error) {
      const message =
        error instanceof GeminiError
          ? error.message
          : 'AI-анализ не удался — задача сохранена без обогащения'
      push(message, 'error')
      if (error instanceof GeminiError && error.code === 'NO_KEY') onNeedKey()
    } finally {
      setAnalyzing(task.id, false)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <label className="inline-flex cursor-pointer items-center gap-2 select-none">
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
