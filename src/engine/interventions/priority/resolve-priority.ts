import type { ActiveInterventionType } from '@/core/contracts/interventions/types'
import type { PriorityResolution, InterventionCandidate } from '../types/internal'
import type { CombinedSuppression } from '../suppression/evaluate-suppression'
import { tierOf } from './priority-tiers'

// ---------------------------------------------------------------------------
// Stage 5 — Select single winner from highest priority tier
// ---------------------------------------------------------------------------

export function resolvePriority(
  surviving: CombinedSuppression[],
): PriorityResolution {
  if (surviving.length === 0) {
    return { winner: undefined, winnerTier: 99, suppressed: [] }
  }

  // Sort by tier (ascending = higher priority), then by signal duration (descending)
  const sorted = [...surviving].sort((a, b) => {
    const tierDiff = tierOf(a.candidate.type) - tierOf(b.candidate.type)
    if (tierDiff !== 0) return tierDiff
    // Same tier: prefer longer signal duration (more sustained evidence)
    return b.candidate.minSignalDuration - a.candidate.minSignalDuration
  })

  const winner = sorted[0].candidate.type
  const winnerTier = tierOf(winner)

  const suppressed = sorted.slice(1).map(s => ({
    type: s.candidate.type,
    reason: `lower priority tier (T${tierOf(s.candidate.type)}) than winner T${winnerTier}`,
  }))

  return { winner, winnerTier, suppressed }
}
