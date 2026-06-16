import type { UserState } from '@/core/contracts/state/user-state'
import type { SequencingDecision } from '@/core/contracts/tasks/sequencing'
import type { RiskLevel } from '@/core/contracts/primitives'
import type { ActiveInterventionType, InterventionLevel } from '@/core/contracts/interventions/types'
import type { InterventionCandidate } from '../types/internal'
import {
  MIN_SIGNAL_DURATION_BY_LEVEL,
  RESTART_ASSISTANCE_MAX_LEVEL,
  DEEP_WORK_PROTECTION_MAX_LEVEL,
  EV_GATE_EXEMPT,
} from '../matrix/intervention-matrix-v1'
import { sequencingIsSaturated } from '../shared/sequencing-saturation'

// ---------------------------------------------------------------------------
// Stage 2 — Five eligibility gates
// ---------------------------------------------------------------------------

function riskAtLeast(risk: RiskLevel, threshold: RiskLevel): boolean {
  const order: RiskLevel[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']
  return order.indexOf(risk) >= order.indexOf(threshold)
}

/** Gate 2: relevant risk field for each type. */
function stateCorroboration(type: ActiveInterventionType, state: UserState): boolean {
  switch (type) {
    case 'BURNOUT_PREVENTION':
      return riskAtLeast(state.burnoutRisk, 'HIGH') || riskAtLeast(state.collapseRisk, 'HIGH')
    case 'RECOVERY_ENFORCEMENT':
      return state.currentMode === 'RECOVERY' && riskAtLeast(state.overloadRisk, 'MODERATE')
    case 'OVERLOAD':
      return riskAtLeast(state.overloadRisk, 'HIGH') && state.overwhelmLevel > 60
    case 'AVOIDANCE_INTERRUPTION':
      return riskAtLeast(state.avoidanceRisk, 'MODERATE') && state.emotionalFriction > 50
    case 'FRAGMENTATION_REDUCTION':
      return state.fragmentationLevel > 55
    case 'DEEP_WORK_PROTECTION':
      return state.deepWorkContinuity < 45
    case 'RESTART_ASSISTANCE':
      return riskAtLeast(state.overloadRisk, 'MODERATE') || state.executionStability < 40
    default:
      return false
  }
}

/**
 * Gate 3: sequencing already achieved the behavioral objective → skip level ≥1.
 * Uses shared sequencingIsSaturated + additional high-recovery-impact check.
 * Gate 3 has a stricter bar than the soft rule: it eliminates rather than downgrades,
 * so it requires BOTH suppression ratio ≥50% AND high recovery impact.
 */
function sequencingNotSaturated(sequencing: SequencingDecision): boolean {
  if (!sequencingIsSaturated(sequencing)) return true
  return sequencing.expectedRecoveryImpact <= 65
}

/**
 * Gate 4: interruption EV > cost.
 * T0 (BURNOUT_PREVENTION) and T1 (RECOVERY_ENFORCEMENT) are exempt — their EV
 * model is collapse prevention, not a cost/benefit optimisation.
 */
function interruptionValuePositive(
  candidate: InterventionCandidate,
  state: UserState,
): boolean {
  if (EV_GATE_EXEMPT.includes(candidate.type)) return true
  const benefit = candidate.evidenceScore
  const cost = state.emotionalFriction * 0.5 + (state.recoveryDebt > 70 ? 20 : 0)
  return benefit > cost
}

/** Gate 5: constitutional filter. Add block types here as taxonomy evolves. */
const CONSTITUTIONAL_BLOCK_TYPES: ActiveInterventionType[] = []

function constitutionalFilter(type: ActiveInterventionType): boolean {
  return !CONSTITUTIONAL_BLOCK_TYPES.includes(type)
}

/** Derive the maximum level this candidate is allowed to reach. */
export function maxAllowedLevel(type: ActiveInterventionType, durationDays: number): InterventionLevel {
  if (type === 'RESTART_ASSISTANCE') return RESTART_ASSISTANCE_MAX_LEVEL
  if (type === 'DEEP_WORK_PROTECTION') return DEEP_WORK_PROTECTION_MAX_LEVEL

  if (durationDays >= MIN_SIGNAL_DURATION_BY_LEVEL[2]) return 2
  if (durationDays >= MIN_SIGNAL_DURATION_BY_LEVEL[1]) return 1
  return 0
}

export function assessGates(
  candidate: InterventionCandidate,
  state: UserState,
  sequencing: SequencingDecision,
): {
  eligible: boolean
  maxLevel: InterventionLevel
  gates: Pick<
    import('../types/internal').EligibilityAssessment,
    | 'gate1_signalEvidence'
    | 'gate2_stateCorroboration'
    | 'gate3_sequencingSaturation'
    | 'gate4_interruptionValue'
    | 'gate5_constitutionalFilter'
  >
  reason: string
} {
  const g1 = candidate.matchedSignals.length > 0 && candidate.evidenceScore > 0
  const g2 = stateCorroboration(candidate.type, state)
  const g3 = sequencingNotSaturated(sequencing)
  const g4 = interruptionValuePositive(candidate, state)
  const g5 = constitutionalFilter(candidate.type)

  const eligible = g1 && g2 && g3 && g4 && g5
  const maxLevel = maxAllowedLevel(candidate.type, candidate.minSignalDuration)

  let reason = ''
  if (!g1) reason = 'signal evidence insufficient'
  else if (!g2) reason = 'state does not corroborate signal'
  else if (!g3) reason = 'sequencing already saturated'
  else if (!g4) reason = 'interruption cost exceeds expected benefit'
  else if (!g5) reason = 'constitutional filter blocked'
  else reason = 'all gates passed'

  return {
    eligible,
    maxLevel,
    gates: {
      gate1_signalEvidence: g1,
      gate2_stateCorroboration: g2,
      gate3_sequencingSaturation: g3,
      gate4_interruptionValue: g4,
      gate5_constitutionalFilter: g5,
    },
    reason,
  }
}
