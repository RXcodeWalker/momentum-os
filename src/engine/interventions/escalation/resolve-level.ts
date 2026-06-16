import type { ActiveInterventionType, InterventionLevel } from '@/core/contracts/interventions/types'
import type { EligibilityAssessment } from '../types/internal'
import type { CombinedSuppression } from '../suppression/evaluate-suppression'
import {
  MIN_SIGNAL_DURATION_BY_LEVEL,
  RESTART_ASSISTANCE_MAX_LEVEL,
  DEEP_WORK_PROTECTION_MAX_LEVEL,
} from '../matrix/intervention-matrix-v1'

// ---------------------------------------------------------------------------
// Stage 6 — Resolve final InterventionLevel for the priority winner
// ---------------------------------------------------------------------------

function hardCap(type: ActiveInterventionType, state: import('@/core/contracts/state/user-state').UserState): InterventionLevel {
  if (type === 'RESTART_ASSISTANCE') return RESTART_ASSISTANCE_MAX_LEVEL
  if (type === 'DEEP_WORK_PROTECTION') return DEEP_WORK_PROTECTION_MAX_LEVEL
  // AVOIDANCE_INTERRUPTION: level 1 max unless collapseRisk CRITICAL
  if (type === 'AVOIDANCE_INTERRUPTION' && state.collapseRisk !== 'CRITICAL') return 1
  return 3
}

export function resolveLevel(
  type: ActiveInterventionType,
  combined: CombinedSuppression,
  assessment: EligibilityAssessment,
  state: import('@/core/contracts/state/user-state').UserState,
): InterventionLevel {
  const soft = combined.softVerdict
  const cap = hardCap(type, state)

  // Soft downgrade takes precedence over eligibility max
  if (soft.downgradeLevel !== undefined) {
    return Math.min(soft.downgradeLevel, cap) as InterventionLevel
  }

  const eligibilityMax = assessment.maxAllowedLevel
  return Math.min(eligibilityMax, cap) as InterventionLevel
}
