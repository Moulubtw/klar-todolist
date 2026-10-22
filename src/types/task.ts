export interface Subtask {
  id: string
  title: string
  isCompleted: boolean
}

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type EisenhowerQuadrant = 'DO_FIRST' | 'SCHEDULE' | 'DELEGATE' | 'DELETE'
export type ViewMode = 'list' | 'matrix'

export interface Task {
  id: string
  title: string
  description?: string | null
  createdAt: string
  dueDate?: string | null
  isCompleted: boolean
  priority: PriorityLevel
  quadrant?: EisenhowerQuadrant | null
  estimatedMinutes?: number | null
  tags: string[]
  subtasks: Subtask[]
  aiScore?: number | null
  aiReasoning?: string | null
}

export interface PrioritizationResult {
  id: string
  priority: PriorityLevel
  quadrant: EisenhowerQuadrant
  estimatedMinutes: number
  aiScore: number
  aiReasoning: string
}

export interface TaskAnalysisResult {
  priority: PriorityLevel
  quadrant: EisenhowerQuadrant
  estimatedMinutes: number
  dueDate?: string
  tags: string[]
  aiScore: number
  aiReasoning: string
}
