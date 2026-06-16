import type { UserState } from '@/core/contracts/state/user-state'
import type { SignalSnapshot } from '@/core/contracts/signals/signal-snapshot'
import type { SequencingDecision } from '@/core/contracts/tasks/sequencing'
import type { InterventionAuditRecord } from '@/core/contracts/interventions/audit'
import type { InterventionLevel } from '@/core/contracts/interventions/types'
import type { EligibilityAssessment, SuppressionVerdict, InterventionCandidate } from '../types/internal'
import { sequencingIsSaturated } from '../shared/sequencing-saturation'

// ---------------------------------------------------------------------------
// Soft suppression rules — downgrade level or merge to level-0 rather than eliminate
// ---------------------------------------------------------------------------

function lowConfidenceDowngrade(
  snapshot: SignalSnapshot,
  maxLevel: InterventionLevel,
): InterventionLevel | null {
  if (snapshot.confidence === 'LOW' && maxLevel > 1) return 1
  return null
}

function interventionFatigue(
  recent: InterventionAuditRecord[],
  maxLevel: InterventionLevel,
  nowMs: number,
): InterventionLevel | null {
  const cutoff = nowMs - 24 * 60 * 60 * 1000
  const last24h = recent.filter(r => new Date(r.firedAt).getTime() > cutoff && r.level >= 1)
  if (last24h.length >= 1 && maxLevel > 1) return 1
  return null
}

export function applySoftRules(
  candidates: InterventionCandidate[],
  assessments: EligibilityAssessment[],
  state: UserState,
  snapshot: SignalSnapshot,
  sequencing: SequencingDecision,
  recent: InterventionAuditRecord[],
  nowMs: number,
): SuppressionVerdict[] {
  const saturated = sequencingIsSaturated(sequencing)

  return candidates.map(candidate => {
    const assessment = assessments.find(a => a.candidateType === candidate.type)
    const maxLevel = assessment?.maxAllowedLevel ?? 0

    const downgradeLevel =
      (saturated ? 0 as InterventionLevel : null) ??
      lowConfidenceDowngrade(snapshot, maxLevel) ??
      interventionFatigue(recent, maxLevel, nowMs)

    if (downgradeLevel !== null) {
      return {
        type: candidate.type,
        suppressed: false,
        rule: downgradeLevel === 0 ? 'SEQUENCING_SATURATED' : 'LOW_CONFIDENCE_OR_FATIGUE',
        hard: false,
        downgradeLevel,
      }
    }

    return { type: candidate.type, suppressed: false, rule: '', hard: false }
  })
}
