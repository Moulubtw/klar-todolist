'use client'

import { Loader2, Wand2 } from 'lucide-react'
import { api, ApiError } from '@/lib/api-client'
import { useAuthStore } from '@/store/useAuthStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useToastStore } from '@/store/useToastStore'
import type { Task } from '@/types/task'

interface Props {
  onNeedKey: () => void
}

export function MagicSortButton({ onNeedKey }: Props) {
  const hasGeminiKey = useAuthStore((s) => s.user?.hasGeminiKey)
  const tasks = useTaskStore((s) => s.tasks)
  const setTasks = useTaskStore((s) => s.setTasks)
  const isPrioritizing = useTaskStore((s) => s.isPrioritizing)
  const setIsPrioritizing = useTaskStore((s) => s.setIsPrioritizing)
  const push = useToastStore((s) => s.push)

  async function handleClick() {
    if (!hasGeminiKey) {
      push('Добавьте GEMINI_API_KEY в настройках', 'error')
      onNeedKey()
      return
    }

    const active = tasks.filter((t) => !t.isCompleted)
    if (active.length === 0) {
      push('Нет активных задач для сортировки', 'info')
      return
    }

    setIsPrioritizing(true)
    try {
      const data = await api<{ tasks: Task[] }>('/api/ai/prioritize', {
        method: 'POST',
      })
      setTasks(data.tasks)
      push('Список перестроен по AI-приоритету', 'success')
    } catch (error) {
      push(
        error instanceof ApiError ? error.message : 'AI-приоритезация недоступна',
        'error',
      )
      if (error instanceof ApiError && error.code === 'NO_KEY') onNeedKey()
    } finally {
      setIsPrioritizing(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPrioritizing}
      className="inline-flex items-center gap-2 rounded-xl bg-sea px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sea-deep disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPrioritizing ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Wand2 size={16} />
      )}
      {isPrioritizing ? 'Разбираю…' : 'Разобрать с AI'}
    </button>
  )
}
