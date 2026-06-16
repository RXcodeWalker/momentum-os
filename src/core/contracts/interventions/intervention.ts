// Fix-4: AdaptationDirective now imported from adaptation/directives.ts.
// The type is defined in the adaptation namespace; intervention imports it from there.

import type { Timestamp } from '../primitives'
import type { InterventionLevel, ActiveInterventionType } from './types'
import type { AdaptationDirective } from '../adaptation/directives'

export type Intervention = {
  id: string
  type: ActiveInterventionType
  level: InterventionLevel
  triggerReasoning: string[]
  emotionalGoal: string
  behavioralObjective: string
  interventionMessage?: string
  adaptationDirectives: AdaptationDirective[]
  suppressionEligible: boolean
  cooldownDurationHours: number
  generatedAt: Timestamp
}

