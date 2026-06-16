import type { UserState } from '@/core/contracts/state/user-state'
import type { SequencingDecision } from '@/core/contracts/tasks/sequencing'
import type { EligibilityAssessment, InterventionCandidate } from '../types/internal'
import { assessGates } from './evidence-gates'

// ---------------------------------------------------------------------------
// Stage 2 — Produce EligibilityAssessment[] from candidates
// ---------------------------------------------------------------------------

export function assessEligibility(
  candidates: InterventionCandidate[],
  state: UserState,
  sequencing: SequencingDecision,
): EligibilityAssessment[] {
  return candidates.map(candidate => {
    const { eligible, maxLevel, gates, reason } = assessGates(candidate, state, sequencing)
    return {
      candidateType: candidate.type,
      ...gates,
      eligible,
      maxAllowedLevel: maxLevel,
      reason,
    }
  })
}

export function filterEligible(
  candidates: InterventionCandidate[],
  assessments: EligibilityAssessment[],
): InterventionCandidate[] {
  return candidates.filter(c =>
    assessments.find(a => a.candidateType === c.type)?.eligible ?? false,
  )
}
