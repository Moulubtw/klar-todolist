import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '../lib/id'
import type {
  PriorityLevel,
  Subtask,
  Task,
  ViewMode,
} from '../types/task'

interface TaskState {
  tasks: Task[]
  viewMode: ViewMode
  isPrioritizing: boolean
  analyzingIds: string[]
  setViewMode: (mode: ViewMode) => void
  setIsPrioritizing: (value: boolean) => void
  setAnalyzing: (id: string, value: boolean) => void
  addTask: (input: {
    title: string
    priority?: PriorityLevel
    dueDate?: string
    tags?: string[]
    estimatedMinutes?: number
    quadrant?: Task['quadrant']
    aiScore?: number
    aiReasoning?: string
  }) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleComplete: (id: string) => void
  applyPrioritization: (
    results: {
      id: string
      priority: PriorityLevel
      quadrant: Task['quadrant']
      estimatedMinutes: number
      aiScore: number
      aiReasoning: string
    }[],
  ) => void
  setSubtasks: (id: string, subtasks: Subtask[]) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  sortedActiveTasks: () => Task[]
  completedTasks: () => Task[]
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      viewMode: 'list',
      isPrioritizing: false,
      analyzingIds: [],

      setViewMode: (viewMode) => set({ viewMode }),
      setIsPrioritizing: (isPrioritizing) => set({ isPrioritizing }),
      setAnalyzing: (id, value) =>
        set((state) => ({
          analyzingIds: value
            ? [...new Set([...state.analyzingIds, id])]
            : state.analyzingIds.filter((x) => x !== id),
        })),

      addTask: (input) => {
        const task: Task = {
          id: createId(),
          title: input.title.trim(),
          createdAt: new Date().toISOString(),
          dueDate: input.dueDate,
          isCompleted: false,
          priority: input.priority ?? 'MEDIUM',
          quadrant: input.quadrant,
          estimatedMinutes: input.estimatedMinutes,
          tags: input.tags ?? [],
          subtasks: [],
          aiScore: input.aiScore,
          aiReasoning: input.aiReasoning,
        }
        set((state) => ({ tasks: [task, ...state.tasks] }))
        return task
      },

      updateTask: (id, patch) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      toggleComplete: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, isCompleted: !t.isCompleted } : t,
          ),
        })),

      applyPrioritization: (results) =>
        set((state) => ({
          tasks: state.tasks.map((task) => {
            const match = results.find((r) => r.id === task.id)
            if (!match) return task
            return {
              ...task,
              priority: match.priority,
              quadrant: match.quadrant,
              estimatedMinutes: match.estimatedMinutes,
              aiScore: match.aiScore,
              aiReasoning: match.aiReasoning,
            }
          }),
        })),

      setSubtasks: (id, subtasks) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, subtasks } : t)),
        })),

      toggleSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id !== taskId
              ? t
              : {
                  ...t,
                  subtasks: t.subtasks.map((s) =>
                    s.id === subtaskId
                      ? { ...s, isCompleted: !s.isCompleted }
                      : s,
                  ),
                },
          ),
        })),

      sortedActiveTasks: () =>
        get()
          .tasks.filter((t) => !t.isCompleted)
          .slice()
          .sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1)),

      completedTasks: () => get().tasks.filter((t) => t.isCompleted),
    }),
    {
      name: 'klar-tasks',
      partialize: (state) => ({
        tasks: state.tasks,
        viewMode: state.viewMode,
      }),
    },
  ),
)
