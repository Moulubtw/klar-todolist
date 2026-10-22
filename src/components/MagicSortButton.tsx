import { useEffect, useState } from 'react'
import { Loader2, Wand2 } from 'lucide-react'
import { GeminiError, prioritizeTasksWithAI } from '../lib/gemini'
import { useSettingsStore } from '../store/useSettingsStore'
import { useTaskStore } from '../store/useTaskStore'
import { useToastStore } from '../store/useToastStore'

interface Props {
  onNeedKey: () => void
}

export function MagicSortButton({ onNeedKey }: Props) {
  const apiKey = useSettingsStore((s) => s.apiKey)
  const canPrioritize = useSettingsStore((s) => s.canPrioritize)
  const prioritizeCooldownMs = useSettingsStore((s) => s.prioritizeCooldownMs)
  const markPrioritized = useSettingsStore((s) => s.markPrioritized)
  const tasks = useTaskStore((s) => s.tasks)
  const applyPrioritization = useTaskStore((s) => s.applyPrioritization)
  const isPrioritizing = useTaskStore((s) => s.isPrioritizing)
  const setIsPrioritizing = useTaskStore((s) => s.setIsPrioritizing)
  const push = useToastStore((s) => s.push)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    const tick = () => setCooldown(prioritizeCooldownMs())
    tick()
    const id = window.setInterval(tick, 500)
    return () => window.clearInterval(id)
  }, [prioritizeCooldownMs])

  async function handleClick() {
    if (!apiKey) {
      push('Добавьте GEMINI_API_KEY в настройках', 'error')
      onNeedKey()
      return
    }
    if (!canPrioritize()) {
      push(
        `Подождите ${Math.ceil(prioritizeCooldownMs() / 1000)} с перед следующим запросом`,
        'info',
      )
      return
    }

    const active = tasks.filter((t) => !t.isCompleted)
    if (active.length === 0) {
      push('Нет активных задач для сортировки', 'info')
      return
    }

    setIsPrioritizing(true)
    try {
      const results = await prioritizeTasksWithAI(apiKey, active)
      applyPrioritization(results)
      markPrioritized()
      push('Список перестроен по AI-приоритету', 'success')
    } catch (error) {
      push(
        error instanceof GeminiError
          ? error.message
          : 'AI-приоритезация недоступна',
        'error',
      )
      if (error instanceof GeminiError && error.code === 'NO_KEY') onNeedKey()
    } finally {
      setIsPrioritizing(false)
    }
  }

  const disabled = isPrioritizing || cooldown > 0

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled && isPrioritizing}
      className="inline-flex items-center gap-2 rounded-xl bg-sea px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sea-deep disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPrioritizing ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Wand2 size={16} />
      )}
      {isPrioritizing
        ? 'Разбираю…'
        : cooldown > 0
          ? `Подождите ${Math.ceil(cooldown / 1000)}с`
          : 'Разобрать с AI'}
    </button>
  )
}
