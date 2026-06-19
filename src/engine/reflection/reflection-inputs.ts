import type { DayData, CheckIn, Task } from '@/lib/store'

// Internal to the reflection engine — not exported from contracts/
export type ReflectionInputBundle = {
  checkIn: Omit<CheckIn, 'date'>
  completedTasks: Task[]
  plannedCount: number
  historyDays: number
}

export function buildReflectionInputBundle(
  data: Omit<CheckIn, 'date'>,
  tasks: Task[],
  history: DayData[],
): ReflectionInputBundle {
  return {
    checkIn: data,
    completedTasks: tasks.filter((t) => t.done),
    plannedCount: tasks.length,
    historyDays: history.length,
  }
}
