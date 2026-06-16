// Fix-1: BehavioralSignal removed from this file.
// It now lives in signals/behavioral-signals.ts where it belongs.
// This file contains only genuine intervention-domain types.

// Taxonomy v1: 6 active types + 1 orientation stub.
// MOMENTUM_EXPANSION and CAPABILITY_CONTRACTION are deprecated — route to Adaptation Engine.
// RESTART_ASSISTANCE is capped at level 0–1 orientation; structural restart → Re-entry Engine.

export type InterventionLevel = 0 | 1 | 2 | 3

/** Active v1 types eligible for matrix trigger evaluation. */
export type ActiveInterventionType =
  | 'BURNOUT_PREVENTION'
  | 'RECOVERY_ENFORCEMENT'
  | 'OVERLOAD'
  | 'AVOIDANCE_INTERRUPTION'
  | 'FRAGMENTATION_REDUCTION'
  | 'DEEP_WORK_PROTECTION'
  | 'RESTART_ASSISTANCE'

/** @deprecated Route to Adaptation Engine (workload expansion is silent, not interruptive). */
export type DeprecatedInterventionType =
  | 'MOMENTUM_EXPANSION'
  | 'CAPABILITY_CONTRACTION'

/** Full enum preserved for backward compatibility; matrix v1 excludes deprecated types. */
export type InterventionType = ActiveInterventionType | DeprecatedInterventionType

