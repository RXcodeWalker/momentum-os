import type { Scalar, Timestamp } from '../primitives'
import type { StateCompatibility } from './compatibility'

export type TaskCategory =
  | 'MAINTENANCE'
  | 'RECOVERY'
  | 'GROWTH'
  | 'ADVANCEMENT'
  | 'SUPPORT'

export type TimeHorizon = 'IMMEDIATE' | 'MEDIUM' | 'LONG'

/** Intelligence-facing task contract. Domain layer maps persisted entities to this. */
export type Task = {
  id: string
  title: string
  description?: string
  category: TaskCategory
  meaningfulness: Scalar
  cognitiveLoad: Scalar
  emotionalResistance: Scalar
  ambiguity: Scalar
  reversibilityRisk: Scalar
  recoveryCost: Scalar
  fragmentationRisk: Scalar
  momentumContribution: Scalar
  recoveryCompatibility: Scalar
  deepWorkCompatibility: Scalar
  timeHorizon: TimeHorizon
  leverageWeight: Scalar
  executionQuality?: Scalar
  initiationDelay?: Scalar
  repeatedDeferralCount: number
  stateCompatibility: StateCompatibility
  estimatedDuration?: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

