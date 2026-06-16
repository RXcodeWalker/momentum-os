import type { ActiveInterventionType } from '@/core/contracts/interventions/types'
import { PRIORITY_TIERS } from '../matrix/intervention-matrix-v1'

// ---------------------------------------------------------------------------
// Priority tier utilities
// ---------------------------------------------------------------------------

export function tierOf(type: ActiveInterventionType): number {
  return PRIORITY_TIERS[type] ?? 99
}

export function higherPriority(a: ActiveInterventionType, b: ActiveInterventionType): ActiveInterventionType {
  return tierOf(a) <= tierOf(b) ? a : b
}
