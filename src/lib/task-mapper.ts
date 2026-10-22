import type { Task as DbTask } from '@prisma/client'
import type { PriorityLevel, Subtask, Task } from '@/types/task'

export function mapTask(row: DbTask): Task {
  const subtasks = (row.subtasks as Subtask[] | null) ?? []
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    isCompleted: row.isCompleted,
    priority: row.priority as PriorityLevel,
    quadrant: row.quadrant as Task['quadrant'],
    estimatedMinutes: row.estimatedMinutes,
    tags: row.tags,
    subtasks,
    aiScore: row.aiScore,
    aiReasoning: row.aiReasoning,
  }
}
