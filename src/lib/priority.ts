import type { EisenhowerQuadrant, PriorityLevel } from '@/types/task'

export const priorityStyles: Record<
  PriorityLevel,
  { label: string; className: string }
> = {
  CRITICAL: {
    label: 'Critical',
    className: 'bg-coral/15 text-coral border-coral/25',
  },
  HIGH: {
    label: 'High',
    className: 'bg-amber/15 text-amber border-amber/25',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-sky/15 text-sky border-sky/25',
  },
  LOW: {
    label: 'Low',
    className: 'bg-slate/15 text-slate border-slate/25',
  },
}

export const quadrantMeta: Record<
  EisenhowerQuadrant,
  { title: string; subtitle: string; accent: string }
> = {
  DO_FIRST: {
    title: 'Сделать',
    subtitle: 'Важно и срочно',
    accent: 'border-coral/40 bg-coral/5',
  },
  SCHEDULE: {
    title: 'Запланировать',
    subtitle: 'Важно, не срочно',
    accent: 'border-sea/40 bg-sea/5',
  },
  DELEGATE: {
    title: 'Делегировать',
    subtitle: 'Срочно, не важно',
    accent: 'border-amber/40 bg-amber/5',
  },
  DELETE: {
    title: 'Убрать',
    subtitle: 'Не важно и не срочно',
    accent: 'border-slate/30 bg-slate/5',
  },
}

export function formatMinutes(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null
  if (minutes < 60) return `~${minutes} мин`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `~${h} ч ${m} мин` : `~${h} ч`
}
