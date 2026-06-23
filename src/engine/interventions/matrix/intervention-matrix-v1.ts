import type { InterventionTrigger, CooldownPolicy } from "@/core/contracts/interventions/triggers";
import type { ActiveInterventionType } from "@/core/contracts/interventions/types";
import type { AdaptationDirective } from "@/core/contracts/adaptation/directives";

// ---------------------------------------------------------------------------
// Intervention Matrix v1
// 6 active types + 1 orientation stub (RESTART_ASSISTANCE, level 0–1 only)
// MOMENTUM_EXPANSION and CAPABILITY_CONTRACTION excluded — Adaptation Engine owns them
// ---------------------------------------------------------------------------

export const INTERVENTION_MATRIX_VERSION = "v1" as const;

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
};

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
};

function cooldownPolicy(type: ActiveInterventionType): CooldownPolicy {
  return {
    defaultCooldownHours: COOLDOWN_DEFAULTS[type],
  };
}

export const INTERVENTION_TRIGGERS: InterventionTrigger[] = [
  {
    triggerType: "BURNOUT_PREVENTION",
    requiredSignals: ["RECOVERY_COLLAPSE"],
    minimumConfidence: 75,
    cooldownPolicy: cooldownPolicy("BURNOUT_PREVENTION"),
  },
  {
    triggerType: "RECOVERY_ENFORCEMENT",
    requiredSignals: ["DECLINING_EXECUTION_QUALITY", "AVOIDANCE_CLUSTERING"],
    minimumConfidence: 65,
    cooldownPolicy: cooldownPolicy("RECOVERY_ENFORCEMENT"),
  },
  {
    triggerType: "OVERLOAD",
    requiredSignals: ["RISING_FRAGMENTATION", "PACING_INSTABILITY"],
    minimumConfidence: 60,
    cooldownPolicy: cooldownPolicy("OVERLOAD"),
  },
  {
    triggerType: "AVOIDANCE_INTERRUPTION",
    requiredSignals: ["AVOIDANCE_CLUSTERING", "MEANINGFULNESS_DEFERRAL"],
    minimumConfidence: 65,
    cooldownPolicy: cooldownPolicy("AVOIDANCE_INTERRUPTION"),
  },
  {
    triggerType: "FRAGMENTATION_REDUCTION",
    requiredSignals: ["RISING_FRAGMENTATION"],
    minimumConfidence: 55,
    cooldownPolicy: cooldownPolicy("FRAGMENTATION_REDUCTION"),
  },
  {
    triggerType: "DEEP_WORK_PROTECTION",
    requiredSignals: ["DEEP_WORK_DEGRADATION"],
    minimumConfidence: 55,
    cooldownPolicy: cooldownPolicy("DEEP_WORK_PROTECTION"),
  },
  {
    triggerType: "RESTART_ASSISTANCE",
    requiredSignals: ["DECLINING_EXECUTION_QUALITY"],
    minimumConfidence: 50,
    cooldownPolicy: cooldownPolicy("RESTART_ASSISTANCE"),
  },
];

/** Minimum signal duration (days) required per level for any type. */
export const MIN_SIGNAL_DURATION_BY_LEVEL: Record<number, number> = {
  0: 0,
  1: 2,
  2: 3,
  3: 3,
};

/** Hard cap on RESTART_ASSISTANCE level. */
export const RESTART_ASSISTANCE_MAX_LEVEL = 1;

/**
 * Avoidance pattern → BehavioralSignal mapping.
 * When the AvoidanceDetection engine detects one of these patterns at HIGH/CRITICAL
 * severity with MEDIUM+ confidence, the mapped signal is treated as active for
 * AVOIDANCE_INTERRUPTION trigger evaluation.
 */
export const AVOIDANCE_PATTERN_SIGNAL_MAP = {
  MAINTENANCE_LOOP: "AVOIDANCE_CLUSTERING",
  ADVANCEMENT_DEFERRAL: "MEANINGFULNESS_DEFERRAL",
  PREPARATION_ESCAPE: "PLANNING_ESCAPE",
  FRAGMENTATION_ESCAPE: "RISING_FRAGMENTATION",
} as const;

/** Minimum severity required for AVOIDANCE_INTERRUPTION to fire from avoidance profile. */
export const AVOIDANCE_INTERRUPTION_MIN_SEVERITY = "HIGH" as const;

/** Minimum confidence required for AVOIDANCE_INTERRUPTION to fire from avoidance profile. */
export const AVOIDANCE_INTERRUPTION_MIN_CONFIDENCE = "MEDIUM" as const;

/** Hard cap on DEEP_WORK_PROTECTION level. */
export const DEEP_WORK_PROTECTION_MAX_LEVEL = 1;

/** emotionalFriction ceiling above which level ≥2 is hard-suppressed for T2–T5 types. T0/T1 are exempt. */
export const FRICTION_CEILING = 85;

/** T0/T1 types are exempt from friction ceiling and level-2 fatigue hard blocks. */
export const HARD_SUPPRESSION_EXEMPT: ActiveInterventionType[] = [
  "BURNOUT_PREVENTION",
  "RECOVERY_ENFORCEMENT",
];

/** Number of level-2+ interventions in 48h that blocks further level-2 (T2–T5 only). */
export const LEVEL2_FATIGUE_THRESHOLD = 2;
export const LEVEL2_FATIGUE_WINDOW_HOURS = 48;

/** T0/T1 EV gate exemption — these types bypass interruptionValue cost/benefit check. */
export const EV_GATE_EXEMPT: ActiveInterventionType[] = [
  "BURNOUT_PREVENTION",
  "RECOVERY_ENFORCEMENT",
];

/**
 * Adaptation directive blueprints per type.
 * evaluate.ts calls ADAPTATION_BLUEPRINTS[type](level) rather than a type-switch.
 * Add new types here; evaluate.ts never changes.
 */
export const ADAPTATION_BLUEPRINTS: Record<
  ActiveInterventionType,
  (level: number) => AdaptationDirective[]
> = {
  BURNOUT_PREVENTION: (level) => [
    {
      field: "execution.workloadCompressionRatio",
      suggestedValue: level >= 2 ? 0.5 : 0.7,
      reason: "reduce visible load to match sustainable capacity",
    },
    {
      field: "environmental.interfaceDensity",
      suggestedValue: level >= 2 ? 30 : 50,
      reason: "calm interface density during burnout risk",
    },
  ],
  RECOVERY_ENFORCEMENT: (level) => [
    {
      field: "execution.recoveryWeighting",
      suggestedValue: 0.8,
      reason: "prioritize recovery-compatible tasks",
    },
    {
      field: "execution.workloadCompressionRatio",
      suggestedValue: level >= 2 ? 0.5 : 0.65,
      reason: "reduce scope to support recovery",
    },
  ],
  OVERLOAD: (level) => [
    {
      field: "execution.workloadCompressionRatio",
      suggestedValue: level >= 2 ? 0.5 : 0.7,
      reason: "reduce visible load to match sustainable capacity",
    },
    {
      field: "environmental.interfaceDensity",
      suggestedValue: level >= 2 ? 30 : 50,
      reason: "calm interface density during overload",
    },
  ],
  AVOIDANCE_INTERRUPTION: (_level) => [
    {
      field: "guidance.emotionalPressureLevel",
      suggestedValue: 10,
      reason: "reduce pressure — avoidance amplifies under pressure",
    },
    {
      field: "execution.visibleTaskLimit",
      suggestedValue: 1,
      reason: "surface one task to reduce choice paralysis",
    },
  ],
  FRAGMENTATION_REDUCTION: (_level) => [
    {
      field: "execution.focusProtectionStrength",
      suggestedValue: 80,
      reason: "protect continuity windows from fragmentation",
    },
  ],
  DEEP_WORK_PROTECTION: (_level) => [
    {
      field: "environmental.deepWorkProtectionEnabled",
      suggestedValue: true,
      reason: "enable deep work protection mode",
    },
  ],
  RESTART_ASSISTANCE: (_level) => [
    {
      field: "execution.visibleTaskLimit",
      suggestedValue: 1,
      reason: "surface minimal scope to make restarting achievable",
    },
  ],
};
