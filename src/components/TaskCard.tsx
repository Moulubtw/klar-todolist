'use client'

import { useState } from 'react'
import {
  Check,
  ChevronDown,
  Lightbulb,
  ListTree,
  Loader2,
  Trash2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import type { Task } from '@/types/task'
import { formatMinutes, priorityStyles } from '@/lib/priority'
import { api, ApiError } from '@/lib/api-client'
import {
  deleteTaskApi,
  patchTask,
  useTaskStore,
} from '@/store/useTaskStore'
import { useToastStore } from '@/store/useToastStore'

interface Props {
  task: Task
  shimmer?: boolean
  onNeedKey: () => void
}

export function TaskCard({ task, shimmer, onNeedKey }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [decomposing, setDecomposing] = useState(false)
  const analyzingIds = useTaskStore((s) => s.analyzingIds)
  const upsertTask = useTaskStore((s) => s.upsertTask)
  const push = useToastStore((s) => s.push)
  const analyzing = analyzingIds.includes(task.id)
  const timeLabel = formatMinutes(task.estimatedMinutes)
  const priority = priorityStyles[task.priority]

  async function handleDecompose() {
    setDecomposing(true)
    try {
      const data = await api<{ task: Task }>('/api/ai/decompose', {
        method: 'POST',
        body: JSON.stringify({ taskId: task.id }),
      })
      upsertTask(data.task)
      setExpanded(true)
      push('Подзадачи готовы', 'success')
    } catch (error) {
      push(
        error instanceof ApiError ? error.message : 'Не удалось разбить задачу',
        'error',
      )
      if (error instanceof ApiError && error.code === 'NO_KEY') onNeedKey()
    } finally {
      setDecomposing(false)
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={clsx(
        'group relative overflow-hidden rounded-2xl border border-ink/8 bg-white/75 p-4 shadow-sm backdrop-blur-sm transition hover:border-sea/25 hover:shadow-md',
        shimmer && 'shimmer',
        task.isCompleted && 'opacity-60',
      )}
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => void patchTask(task.id, { isCompleted: !task.isCompleted })}
          className={clsx(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition',
            task.isCompleted
              ? 'border-sea bg-sea text-white'
              : 'border-ink/25 hover:border-sea',
          )}
          aria-label={task.isCompleted ? 'Вернуть в активные' : 'Выполнить'}
        >
          {task.isCompleted ? <Check size={14} strokeWidth={3} /> : null}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3
              className={clsx(
                'text-[15px] font-semibold leading-snug text-ink',
                task.isCompleted && 'line-through',
              )}
            >
              {task.title}
            </h3>
            <div className="flex items-center gap-1.5">
              {analyzing ? (
                <Loader2 size={14} className="animate-spin text-sea" />
              ) : null}
              <span
                className={clsx(
                  'rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide',
                  priority.className,
                )}
              >
                {priority.label}
              </span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-soft/80">
            {timeLabel ? (
              <span className="rounded-md bg-mist px-2 py-0.5 font-medium">
                ⏱ {timeLabel}
              </span>
            ) : null}
            {task.dueDate ? (
              <span className="rounded-md bg-mist px-2 py-0.5 font-medium">
                до {new Date(task.dueDate).toLocaleDateString('ru-RU')}
              </span>
            ) : null}
            {typeof task.aiScore === 'number' ? (
              <span className="rounded-md bg-sea/10 px-2 py-0.5 font-semibold text-sea-deep">
                score {task.aiScore}
              </span>
            ) : null}
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-ink/5 px-2 py-0.5 font-medium"
              >
                #{tag}
              </span>
            ))}
            {task.aiReasoning ? (
              <span
                className="inline-flex items-center gap-1 text-sea"
                title={task.aiReasoning}
              >
                <Lightbulb size={13} />
                <span className="max-w-[14rem] truncate">{task.aiReasoning}</span>
              </span>
            ) : null}
          </div>

          {task.subtasks.length > 0 ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-ink"
              >
                <ChevronDown
                  size={14}
                  className={clsx('transition', expanded && 'rotate-180')}
                />
                Подзадачи ({task.subtasks.filter((s) => s.isCompleted).length}/
                {task.subtasks.length})
              </button>
              {expanded ? (
                <ul className="mt-2 space-y-1.5">
                  {task.subtasks.map((sub) => (
                    <li key={sub.id}>
                      <button
                        type="button"
                        onClick={() =>
                          void patchTask(task.id, {
                            subtasks: task.subtasks.map((s) =>
                              s.id === sub.id
                                ? { ...s, isCompleted: !s.isCompleted }
                                : s,
                            ),
                          })
                        }
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-mist"
                      >
                        <span
                          className={clsx(
                            'flex h-4 w-4 items-center justify-center rounded border',
                            sub.isCompleted
                              ? 'border-sea bg-sea text-white'
                              : 'border-ink/25',
                          )}
                        >
                          {sub.isCompleted ? (
                            <Check size={10} strokeWidth={3} />
                          ) : null}
                        </span>
                        <span
                          className={clsx(
                            sub.isCompleted && 'line-through opacity-60',
                          )}
                        >
                          {sub.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {!task.isCompleted ? (
            <div className="mt-3 flex flex-wrap gap-2 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
              <button
                type="button"
                onClick={handleDecompose}
                disabled={decomposing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:border-sea/30 hover:text-sea disabled:opacity-50"
              >
                {decomposing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <ListTree size={13} />
                )}
                Разбить на шаги
              </button>
              <button
                type="button"
                onClick={() => void deleteTaskApi(task.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-coral/80 hover:bg-coral/10"
              >
                <Trash2 size={13} />
                Удалить
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void deleteTaskApi(task.id)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-coral/70 hover:text-coral"
            >
              <Trash2 size={13} />
              Удалить
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}
