import type { InterventionTrigger, CooldownPolicy } from '@/core/contracts/interventions/triggers'
import type { ActiveInterventionType } from '@/core/contracts/interventions/types'

// ---------------------------------------------------------------------------
// Intervention Matrix v1
// 6 active types + 1 orientation stub (RESTART_ASSISTANCE, level 0–1 only)
// MOMENTUM_EXPANSION and CAPABILITY_CONTRACTION excluded — Adaptation Engine owns them
// ---------------------------------------------------------------------------

export const INTERVENTION_MATRIX_VERSION = 'v1' as const

/**
 * Priority tier assignment per type.
 * Lower tier number = higher priority.
 * T0 = collapse prevention; T5 = orientation only.
 */
export const PRIORITY_TIERS: Record<ActiveInterventionType, number> = {
  BURNOUT_PREVENTION: 0,
  RECOVERY_ENFORCEMENT: 1,
  OVERLOAD: 2,
  AVOIDANCE_INTERRUPTION: 3,
  FRAGMENTATION_REDUCTION: 4,
  DEEP_WORK_PROTECTION: 4,
  RESTART_ASSISTANCE: 5,
}

/**
 * Cooldown defaults per type (hours).
 * Engine reads; orchestration writes after emit.
 */
export const COOLDOWN_DEFAULTS: Record<ActiveInterventionType, number> = {
  BURNOUT_PREVENTION: 72,
  RECOVERY_ENFORCEMENT: 48,
  OVERLOAD: 24,
  AVOIDANCE_INTERRUPTION: 36,
  FRAGMENTATION_REDUCTION: 12,
  DEEP_WORK_PROTECTION: 8,
  RESTART_ASSISTANCE: 168,
}

const DEFAULT_COOLDOWN_POLICY: CooldownPolicy = {
  defaultCooldownHours: 24,
  perTypeOverrides: {},
  escalationResetsCooldown: true,
}

function cooldownPolicy(type: ActiveInterventionType): CooldownPolicy {
  return {
    defaultCooldownHours: COOLDOWN_DEFAULTS[type],
    perTypeOverrides: {},
    escalationResetsCooldown: true,
  }
}

export const INTERVENTION_TRIGGERS: InterventionTrigger[] = [
  {
    triggerType: 'BURNOUT_PREVENTION',
    requiredSignals: ['RECOVERY_COLLAPSE'],
    minimumConfidence: 75,
    escalationThreshold: 85,
    suppressionRules: [
      { whenSignal: 'RECOVERY_COLLAPSE', windowHours: 72 },
    ],
    cooldownPolicy: cooldownPolicy('BURNOUT_PREVENTION'),
  },
  {
    triggerType: 'RECOVERY_ENFORCEMENT',
    requiredSignals: ['DECLINING_EXECUTION_QUALITY', 'AVOIDANCE_CLUSTERING'],
    minimumConfidence: 65,
    escalationThreshold: 80,
    suppressionRules: [],
    cooldownPolicy: cooldownPolicy('RECOVERY_ENFORCEMENT'),
  },
  {
    triggerType: 'OVERLOAD',
    requiredSignals: ['RISING_FRAGMENTATION', 'PACING_INSTABILITY'],
    minimumConfidence: 60,
    escalationThreshold: 75,
    suppressionRules: [
      { whenRecentType: 'OVERLOAD', windowHours: 24 },
    ],
    cooldownPolicy: cooldownPolicy('OVERLOAD'),
  },
  {
    triggerType: 'AVOIDANCE_INTERRUPTION',
    requiredSignals: ['AVOIDANCE_CLUSTERING', 'MEANINGFULNESS_DEFERRAL'],
    minimumConfidence: 65,
    escalationThreshold: 80,
    suppressionRules: [
      { whenRecentType: 'AVOIDANCE_INTERRUPTION', windowHours: 36 },
    ],
    cooldownPolicy: cooldownPolicy('AVOIDANCE_INTERRUPTION'),
  },
  {
    triggerType: 'FRAGMENTATION_REDUCTION',
    requiredSignals: ['RISING_FRAGMENTATION'],
    minimumConfidence: 55,
    escalationThreshold: 70,
    suppressionRules: [],
    cooldownPolicy: cooldownPolicy('FRAGMENTATION_REDUCTION'),
  },
  {
    triggerType: 'DEEP_WORK_PROTECTION',
    requiredSignals: ['DEEP_WORK_DEGRADATION'],
    minimumConfidence: 55,
    escalationThreshold: 70,
    suppressionRules: [],
    cooldownPolicy: cooldownPolicy('DEEP_WORK_PROTECTION'),
  },
  {
    triggerType: 'RESTART_ASSISTANCE',
    requiredSignals: ['DECLINING_EXECUTION_QUALITY'],
    minimumConfidence: 50,
    suppressionRules: [],
    cooldownPolicy: cooldownPolicy('RESTART_ASSISTANCE'),
  },
]

/** Minimum signal duration (days) required per level for any type. */
export const MIN_SIGNAL_DURATION_BY_LEVEL: Record<number, number> = {
  0: 0,
  1: 2,
  2: 3,
  3: 3,
}

/** Hard cap on RESTART_ASSISTANCE level. */
export const RESTART_ASSISTANCE_MAX_LEVEL = 1

/** Hard cap on DEEP_WORK_PROTECTION level. */
export const DEEP_WORK_PROTECTION_MAX_LEVEL = 1

/** emotionalFriction ceiling above which level ≥2 is hard-suppressed. */
export const FRICTION_CEILING = 85

/** Number of level-2+ interventions in 48h that blocks further level-2. */
export const LEVEL2_FATIGUE_THRESHOLD = 2
export const LEVEL2_FATIGUE_WINDOW_HOURS = 48

/** T0 BURNOUT_PREVENTION hard-suppress override window (once per 72h). */
export const T0_HARD_OVERRIDE_WINDOW_HOURS = 72
