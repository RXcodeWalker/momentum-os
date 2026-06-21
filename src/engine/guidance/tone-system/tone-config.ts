import type { MessagingTone } from '@/core/contracts/adaptation/guidance'

/** Per-tone constraints applied before and after message generation. */
export type ToneConstraints = {
  tone: MessagingTone
  /** emotionalPressureLevel is clamped to this value when exceeded */
  pressureCap: number
  /** Intervention surface levels suppressed for this tone */
  suppressedInterventionLevels: number[]
  /** Whether modal-level (3) interventions are ever allowed */
  allowModal: boolean
  /** Whether banner-level (2) interventions are ever allowed */
  allowBanner: boolean
}

export const TONE_CONSTRAINTS: Record<MessagingTone, ToneConstraints> = {
  CALM: {
    tone: 'CALM',
    pressureCap: 0,
    suppressedInterventionLevels: [2, 3],
    allowModal: false,
    allowBanner: false,
  },
  STABILIZING: {
    tone: 'STABILIZING',
    pressureCap: 20,
    suppressedInterventionLevels: [3],
    allowModal: false,
    allowBanner: true,
  },
  STEADY: {
    tone: 'STEADY',
    pressureCap: 40,
    suppressedInterventionLevels: [],
    allowModal: true,
    allowBanner: true,
  },
  OBSERVATIONAL: {
    tone: 'OBSERVATIONAL',
    pressureCap: 20,
    suppressedInterventionLevels: [3],
    allowModal: false,
    allowBanner: true,
  },
  FOCUSED: {
    tone: 'FOCUSED',
    pressureCap: 60,
    suppressedInterventionLevels: [],
    allowModal: true,
    allowBanner: true,
  },
  CHALLENGING: {
    tone: 'CHALLENGING',
    pressureCap: 75,
    suppressedInterventionLevels: [],
    allowModal: true,
    allowBanner: true,
  },
}
