import type { UserState } from '@/core/contracts/state/user-state'
import type { InterventionAuditRecord } from '@/core/contracts/interventions/audit'
import type { ReentryProtocol } from '@/core/contracts/reentry/protocol'
import type { ActiveInterventionType } from '@/core/contracts/interventions/types'
import type { SuppressionVerdict, InterventionCandidate } from '../types/internal'
import {
  FRICTION_CEILING,
  LEVEL2_FATIGUE_THRESHOLD,
  LEVEL2_FATIGUE_WINDOW_HOURS,
} from '../matrix/intervention-matrix-v1'

// ---------------------------------------------------------------------------
// Hard suppression rules — candidate eliminated entirely
// ---------------------------------------------------------------------------

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60)
}

function reentryLock(
  type: ActiveInterventionType,
  reentry: ReentryProtocol | undefined,
): string | null {
  if (!reentry) return null
  const lockedStages: ReentryProtocol['currentStage'][] = [
    'ASSESSMENT',
    'MINIMUM_VIABLE_RESTART',
  ]
  if (lockedStages.includes(reentry.currentStage) && type !== 'RESTART_ASSISTANCE') {
    return 'REENTRY_LOCK'
  }
  return null
}

function frictionCeiling(state: UserState): string | null {
  if (state.emotionalFriction > FRICTION_CEILING) return 'FRICTION_CEILING'
  return null
}

function level2Fatigue(recent: InterventionAuditRecord[]): string | null {
  const windowStart = new Date(Date.now() - LEVEL2_FATIGUE_WINDOW_HOURS * 60 * 60 * 1000)
  const highLevelCount = recent.filter(
    r => r.level >= 2 && new Date(r.firedAt) >= windowStart,
  ).length
  if (highLevelCount >= LEVEL2_FATIGUE_THRESHOLD) return 'RECENT_LEVEL2_FATIGUE'
  return null
}

function expansionModeGuard(type: ActiveInterventionType, state: UserState): string | null {
  const deprecatedTypes = ['MOMENTUM_EXPANSION', 'CAPABILITY_CONTRACTION']
  if (state.currentMode === 'EXPANDING' && deprecatedTypes.includes(type)) {
    return 'EXPANSION_MODE_GUARD'
  }
  return null
}

export function applyHardRules(
  candidates: InterventionCandidate[],
  state: UserState,
  recent: InterventionAuditRecord[],
  reentry: ReentryProtocol | undefined,
): SuppressionVerdict[] {
  return candidates.map(candidate => {
    const rule =
      reentryLock(candidate.type, reentry) ??
      frictionCeiling(state) ??
      level2Fatigue(recent) ??
      expansionModeGuard(candidate.type, state)

    if (rule) {
      return { type: candidate.type, suppressed: true, rule, hard: true }
    }
    return { type: candidate.type, suppressed: false, rule: '', hard: true }
  })
}
