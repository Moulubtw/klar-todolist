'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { LayoutGrid, List, LogOut, Settings2 } from 'lucide-react'
import clsx from 'clsx'
import { EisenhowerBoard } from '@/components/EisenhowerBoard'
import { MagicSortButton } from '@/components/MagicSortButton'
import { SettingsModal } from '@/components/SettingsModal'
import { SmartInput } from '@/components/SmartInput'
import { TaskCard } from '@/components/TaskCard'
import { ToastStack } from '@/components/ToastStack'
import { useAuthStore } from '@/store/useAuthStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useToastStore } from '@/store/useToastStore'
import { useRouter } from 'next/navigation'

export function TodoApp() {
  const router = useRouter()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aiAutoFill, setAiAutoFill] = useState(true)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const viewMode = useTaskStore((s) => s.viewMode)
  const setViewMode = useTaskStore((s) => s.setViewMode)
  const isPrioritizing = useTaskStore((s) => s.isPrioritizing)
  const tasks = useTaskStore((s) => s.tasks)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const loading = useTaskStore((s) => s.loading)
  const push = useToastStore((s) => s.push)

  useEffect(() => {
    void fetchTasks().catch(() => push('Не удалось загрузить задачи', 'error'))
  }, [fetchTasks, push])

  const active = useMemo(
    () =>
      tasks
        .filter((t) => !t.isCompleted)
        .slice()
        .sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1)),
    [tasks],
  )
  const completed = useMemo(
    () => tasks.filter((t) => t.isCompleted),
    [tasks],
  )

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6 lg:max-w-5xl">
      <header className="mb-10 animate-fade-up">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-5xl font-extrabold tracking-tight text-ink sm:text-6xl">
              Klar
            </p>
            <p className="mt-2 max-w-md text-base text-ink-soft/85 sm:text-lg">
              Smart ToDoList — AI решает, за что взяться прямо сейчас.
            </p>
            {user ? (
              <p className="mt-2 text-sm text-ink-soft/70">{user.email}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className={clsx(
                'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition',
                user?.hasGeminiKey
                  ? 'border-ink/10 bg-white/70 text-ink-soft hover:border-sea/30'
                  : 'border-amber/30 bg-amber/10 text-amber',
              )}
            >
              <Settings2 size={16} />
              {user?.hasGeminiKey ? 'API' : 'Ключ API'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft/70 hover:text-ink"
            >
              <LogOut size={14} />
              Выйти
            </button>
          </div>
        </div>

        <SmartInput
          onNeedKey={() => setSettingsOpen(true)}
          aiAutoFill={aiAutoFill}
          setAiAutoFill={setAiAutoFill}
        />
      </header>

      <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MagicSortButton onNeedKey={() => setSettingsOpen(true)} />
          <div className="inline-flex rounded-xl border border-ink/10 bg-white/70 p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition',
                viewMode === 'list'
                  ? 'bg-ink text-white'
                  : 'text-ink-soft hover:bg-mist',
              )}
            >
              <List size={14} />
              Список
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition',
                viewMode === 'matrix'
                  ? 'bg-ink text-white'
                  : 'text-ink-soft hover:bg-mist',
              )}
            >
              <LayoutGrid size={14} />
              Эйзенхауэр
            </button>
          </div>
        </div>
        <p className="text-sm font-medium text-ink-soft/70">
          {loading ? 'Загрузка…' : null}
          {!loading ? (
            <>
              {active.length} активных
              {completed.length ? ` · ${completed.length} готово` : ''}
            </>
          ) : null}
        </p>
      </section>

      {active.length === 0 && completed.length === 0 && !loading ? (
        <div className="animate-fade-up rounded-2xl border border-dashed border-ink/15 bg-white/40 px-6 py-16 text-center">
          <p className="font-display text-2xl font-bold text-ink">Пока тихо</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft/75">
            Добавьте первую задачу — с AI Auto-fill Klar сам оценит приоритет,
            дедлайн и время.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {active.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                shimmer={isPrioritizing}
                onNeedKey={() => setSettingsOpen(true)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EisenhowerBoard
          tasks={active}
          shimmer={isPrioritizing}
          onNeedKey={() => setSettingsOpen(true)}
        />
      )}

      {completed.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-bold text-ink-soft/70">
            Выполнено
          </h2>
          <div className="space-y-3">
            {completed.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onNeedKey={() => setSettingsOpen(true)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <ToastStack />
    </div>
  )
}
