import type { UserState } from '@/core/contracts/state/user-state'
import type { SignalSnapshot } from '@/core/contracts/signals/signal-snapshot'
import type { SequencingDecision } from '@/core/contracts/tasks/sequencing'
import type { InterventionAuditRecord } from '@/core/contracts/interventions/audit'
import type { ReentryProtocol } from '@/core/contracts/reentry/protocol'
import type { EligibilityAssessment, SuppressionVerdict, InterventionCandidate } from '../types/internal'
import { applyHardRules } from './hard-rules'
import { applySoftRules } from './soft-rules'

// ---------------------------------------------------------------------------
// Stage 4 — Combine hard + soft suppression verdicts
// ---------------------------------------------------------------------------

export type CombinedSuppression = {
  candidate: InterventionCandidate
  hardVerdict: SuppressionVerdict
  softVerdict: SuppressionVerdict
  hardSuppressed: boolean
}

export function evaluateSuppression(
  candidates: InterventionCandidate[],
  assessments: EligibilityAssessment[],
  state: UserState,
  snapshot: SignalSnapshot,
  sequencing: SequencingDecision,
  recent: InterventionAuditRecord[],
  reentry: ReentryProtocol | undefined,
): CombinedSuppression[] {
  const hardVerdicts = applyHardRules(candidates, state, recent, reentry)
  const surviving = candidates.filter(
    c => !hardVerdicts.find(v => v.type === c.type)?.suppressed,
  )
  const softVerdicts = applySoftRules(surviving, assessments, state, snapshot, sequencing, recent)

  return candidates.map(candidate => {
    const hard = hardVerdicts.find(v => v.type === candidate.type)!
    const soft = softVerdicts.find(v => v.type === candidate.type) ?? {
      type: candidate.type,
      suppressed: false,
      rule: '',
      hard: false,
    }
    return {
      candidate,
      hardVerdict: hard,
      softVerdict: soft,
      hardSuppressed: hard.suppressed,
    }
  })
}

export function filterSuppressed(combined: CombinedSuppression[]): CombinedSuppression[] {
  return combined.filter(c => !c.hardSuppressed)
}
