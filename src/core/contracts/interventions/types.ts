// Fix-1: BehavioralSignal removed from this file.
// It now lives in signals/behavioral-signals.ts where it belongs.
// This file contains only genuine intervention-domain types.

export type InterventionLevel = 0 | 1 | 2 | 3

export type InterventionType =
  | 'OVERLOAD'
  | 'BURNOUT_PREVENTION'
  | 'AVOIDANCE_INTERRUPTION'
  | 'MOMENTUM_EXPANSION'
  | 'DEEP_WORK_PROTECTION'
  | 'RECOVERY_ENFORCEMENT'
  | 'RESTART_ASSISTANCE'
  | 'FRAGMENTATION_REDUCTION'
  | 'CAPABILITY_CONTRACTION'

