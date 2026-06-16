import type { UserState } from '@/core/contracts/state/user-state'
import type { SignalSnapshot } from '@/core/contracts/signals/signal-snapshot'
import type { SequencingDecision } from '@/core/contracts/tasks/sequencing'
import type { InterventionAuditRecord } from '@/core/contracts/interventions/audit'
import type { ActiveInterventionType, InterventionLevel } from '@/core/contracts/interventions/types'
import type { EligibilityAssessment, SuppressionVerdict, InterventionCandidate } from '../types/internal'

// ---------------------------------------------------------------------------
// Soft suppression rules — downgrade level or merge to level-0 rather than eliminate
// ---------------------------------------------------------------------------

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60)
}

function sequencingSaturated(
  sequencing: SequencingDecision,
  maxLevel: InterventionLevel,
): InterventionLevel | null {
  const suppressedRatio = sequencing.suppressedTaskIds.length /
    Math.max(
      sequencing.suppressedTaskIds.length + sequencing.compressedTaskIds.length + 1,
      1,
    )
  if (suppressedRatio >= 0.5) return 0
  return null
}

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
): InterventionLevel | null {
  const last24h = recent.filter(r => hoursAgo(r.firedAt) < 24 && r.level >= 1)
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
): SuppressionVerdict[] {
  return candidates.map(candidate => {
    const assessment = assessments.find(a => a.candidateType === candidate.type)
    const maxLevel = assessment?.maxAllowedLevel ?? 0

    const downgradeLevel =
      sequencingSaturated(sequencing, maxLevel) ??
      lowConfidenceDowngrade(snapshot, maxLevel) ??
      interventionFatigue(recent, maxLevel)

    if (downgradeLevel !== null) {
      return {
        type: candidate.type,
        suppressed: false,
        rule: downgradeLevel === 0 ? 'SEQUENCING_SATURATED' : downgradeLevel < maxLevel ? 'LOW_CONFIDENCE_OR_FATIGUE' : '',
        hard: false,
        downgradeLevel,
      }
    }

    return { type: candidate.type, suppressed: false, rule: '', hard: false }
  })
}
