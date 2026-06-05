// Fix-1: BehavioralSignal now imported from signals/ (correct direction).
// Inline import() replaced with top-level import type for CooldownPolicy.perTypeOverrides.

import type { Scalar } from '../primitives'
import type { BehavioralSignal } from '../signals/behavioral-signals'
import type { InterventionType } from './types'

export type SuppressionRule = {
  whenSignal: BehavioralSignal
  whenRecentType?: InterventionType
  windowHours: number
}

export type CooldownPolicy = {
  defaultCooldownHours: number
  perTypeOverrides: Partial<Record<InterventionType, number>>
  escalationResetsCooldown: boolean
}

export type InterventionTrigger = {
  triggerType: InterventionType
  requiredSignals: BehavioralSignal[]
  minimumConfidence: Scalar
  escalationThreshold?: Scalar
  suppressionRules: SuppressionRule[]
  cooldownPolicy: CooldownPolicy
}

