'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api-client'
import type { Subtask, Task, ViewMode } from '@/types/task'

interface TaskState {
  tasks: Task[]
  viewMode: ViewMode
  isPrioritizing: boolean
  analyzingIds: string[]
  loading: boolean
  setViewMode: (mode: ViewMode) => void
  setIsPrioritizing: (value: boolean) => void
  setAnalyzing: (id: string, value: boolean) => void
  setTasks: (tasks: Task[]) => void
  fetchTasks: () => Promise<void>
  upsertTask: (task: Task) => void
  removeTask: (id: string) => void
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      viewMode: 'list',
      isPrioritizing: false,
      analyzingIds: [],
      loading: false,

      setViewMode: (viewMode) => set({ viewMode }),
      setIsPrioritizing: (isPrioritizing) => set({ isPrioritizing }),
      setAnalyzing: (id, value) =>
        set((state) => ({
          analyzingIds: value
            ? [...new Set([...state.analyzingIds, id])]
            : state.analyzingIds.filter((x) => x !== id),
        })),
      setTasks: (tasks) => set({ tasks }),
      upsertTask: (task) =>
        set((state) => {
          const idx = state.tasks.findIndex((t) => t.id === task.id)
          if (idx === -1) return { tasks: [task, ...state.tasks] }
          const next = state.tasks.slice()
          next[idx] = task
          return { tasks: next }
        }),
      removeTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

      fetchTasks: async () => {
        set({ loading: true })
        try {
          const data = await api<{ tasks: Task[] }>('/api/tasks')
          set({ tasks: data.tasks, loading: false })
        } catch {
          set({ loading: false })
          throw new Error('Не удалось загрузить задачи')
        }
      },
    }),
    {
      name: 'klar-ui',
      partialize: (state) => ({ viewMode: state.viewMode }),
    },
  ),
)

export async function patchTask(
  id: string,
  patch: Partial<Task> & { subtasks?: Subtask[] },
): Promise<Task> {
  const data = await api<{ task: Task }>(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  useTaskStore.getState().upsertTask(data.task)
  return data.task
}

export async function deleteTaskApi(id: string): Promise<void> {
  await api(`/api/tasks/${id}`, { method: 'DELETE' })
  useTaskStore.getState().removeTask(id)
}
