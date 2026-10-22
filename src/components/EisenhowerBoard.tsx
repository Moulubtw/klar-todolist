'use client'

import type { EisenhowerQuadrant, Task } from '@/types/task'
import { quadrantMeta } from '@/lib/priority'
import { TaskCard } from './TaskCard'

const ORDER: EisenhowerQuadrant[] = [
  'DO_FIRST',
  'SCHEDULE',
  'DELEGATE',
  'DELETE',
]

interface Props {
  tasks: Task[]
  shimmer?: boolean
  onNeedKey: () => void
}

export function EisenhowerBoard({ tasks, shimmer, onNeedKey }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ORDER.map((quadrant) => {
        const meta = quadrantMeta[quadrant]
        const columnTasks = tasks.filter((t) => t.quadrant === quadrant)
        return (
          <section
            key={quadrant}
            className={`rounded-2xl border p-4 ${meta.accent}`}
          >
            <header className="mb-3">
              <h3 className="font-display text-lg font-bold text-ink">
                {meta.title}
              </h3>
              <p className="text-xs font-medium text-ink-soft/70">
                {meta.subtitle}
              </p>
            </header>
            <div className="space-y-3">
              {columnTasks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink/15 px-3 py-6 text-center text-sm text-ink-soft/50">
                  Пусто
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    shimmer={shimmer}
                    onNeedKey={onNeedKey}
                  />
                ))
              )}
            </div>
          </section>
        )
      })}
      {tasks.some((t) => !t.quadrant) ? (
        <section className="rounded-2xl border border-ink/10 bg-white/50 p-4 md:col-span-2">
          <header className="mb-3">
            <h3 className="font-display text-lg font-bold text-ink">
              Без квадранта
            </h3>
            <p className="text-xs font-medium text-ink-soft/70">
              Запустите «Разобрать с AI», чтобы распределить
            </p>
          </header>
          <div className="space-y-3">
            {tasks
              .filter((t) => !t.quadrant)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  shimmer={shimmer}
                  onNeedKey={onNeedKey}
                />
              ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
