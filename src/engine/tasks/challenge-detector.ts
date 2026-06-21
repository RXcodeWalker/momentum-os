import type { Task } from '@/lib/store'
import type { ExecutionAdaptation } from '@/core/contracts/adaptation/execution'

export type ChallengeDetectionResult = {
  stretchTaskId: string | null
  stretchPrompt: string | null
}

const MEANINGFULNESS: Record<Task['type'], number> = {
  deep: 1.0,
  shallow: 0.6,
  admin: 0.3,
  movement: 0.2,
  'wind-down': 0.1,
}

function stretchScore(task: Task): number {
  const meaningfulness = MEANINGFULNESS[task.type] ?? 0.3
  const emotionalResistance = Math.min((task.rescheduled ?? 0) / 4, 1.0)
  const cognitiveLoad = Math.min(task.estMin / 90, 1.0)
  const momentumContribution =
    task.type === 'deep' ? Math.min(task.estMin / 60, 1.0) : 0.2

  return (
    meaningfulness * 0.40 +
    emotionalResistance * 0.30 +
    cognitiveLoad * 0.20 +
    momentumContribution * 0.10
  )
}

export function detectChallenge(
  visibleTasks: Task[],
  execution: ExecutionAdaptation,
): ChallengeDetectionResult {
  const { recommendedChallengeLevel, recoveryWeighting } = execution

  if (recommendedChallengeLevel <= 70) {
    return { stretchTaskId: null, stretchPrompt: null }
  }

  const candidates = visibleTasks.filter((t) => !t.done).filter((t) => {
    if (recoveryWeighting > 0.60) {
      const highCogLoad = t.estMin > 45
      const highResistance = (t.rescheduled ?? 0) >= 2
      return !highCogLoad && !highResistance
    }
    if (recoveryWeighting > 0.40) {
      const highCogLoad = t.estMin > 63
      const highResistance = (t.rescheduled ?? 0) >= 3
      return !highCogLoad && !highResistance
    }
    return true
  })

  if (candidates.length === 0) {
    return { stretchTaskId: null, stretchPrompt: null }
  }

  let best = candidates[0]
  let bestScore = stretchScore(candidates[0])
  for (let i = 1; i < candidates.length; i++) {
    const s = stretchScore(candidates[i])
    if (s > bestScore) {
      bestScore = s
      best = candidates[i]
    }
  }

  if (bestScore < 0.40) {
    return { stretchTaskId: null, stretchPrompt: null }
  }

  const prompt =
    recommendedChallengeLevel >= 85
      ? 'Challenge window is open. Own this one fully.'
      : 'This is your growth task today. Push into it.'

  return { stretchTaskId: best.id, stretchPrompt: prompt }
}
