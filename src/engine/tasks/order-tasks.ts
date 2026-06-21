import type { Task } from '@/lib/store'
import type { ExecutionAdaptation } from '@/core/contracts/adaptation/execution'

const TYPE_TIER: Record<Task['type'], number> = {
  'deep': 0,
  'shallow': 1,
  'admin': 2,
  'movement': 3,
  'wind-down': 4,
}

// Tier maps per pacing recommendation
const COMPRESS_TIERS: Record<Task['type'], number> = {
  'movement': 0,
  'wind-down': 0,
  'shallow': 1,
  'admin': 1,
  'deep': 2,
}

const PROTECT_TIERS: Record<Task['type'], number> = {
  'deep': 0,
  'shallow': 1,
  'movement': 2,
  'admin': 2,
  'wind-down': 2,
}

const CHALLENGE_TIERS: Record<Task['type'], number> = {
  'deep': 0,
  'shallow': 1,
  'admin': 2,
  'movement': 2,
  'wind-down': 2,
}

export function orderTasks(
  incompleteTasks: Task[],
  execution: ExecutionAdaptation,
): string[] {
  const pacing = execution.pacingRecommendation

  if (pacing === 'MAINTAIN_RHYTHM') {
    return incompleteTasks.map((t) => t.id)
  }

  const tierMap =
    pacing === 'COMPRESS_SCOPE' || pacing === 'REDUCE_LOAD'
      ? COMPRESS_TIERS
      : pacing === 'PROTECT_CONTINUITY'
        ? PROTECT_TIERS
        : CHALLENGE_TIERS // INCREASE_CHALLENGE

  return incompleteTasks
    .map((t, originalIndex) => ({ t, originalIndex, tier: tierMap[t.type] ?? 99 }))
    .sort((a, b) => a.tier - b.tier || a.originalIndex - b.originalIndex)
    .map(({ t }) => t.id)
}
