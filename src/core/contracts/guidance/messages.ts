import type { MessagingTone } from '../adaptation/guidance'
import type { UserMode, UserTrajectory } from '../state/modes'
import type { ActiveInterventionType } from '../interventions/types'
import type { GuidanceAdaptation } from '../adaptation/guidance'
import type { RiskLevel } from '../primitives'

export type GuidanceSurface =
  | 'hero-headline'
  | 'hero-subtitle'
  | 'morning-insight'
  | 'morning-encouragement'
  | 'checkin-open-question'
  | 'checkin-pattern-question'
  | 'checkin-forward-question'
  | 'intervention-override'

export type GuidanceProvenance = {
  mode: UserMode
  trajectory: UserTrajectory
  tone: MessagingTone
  primaryDriver:
    | 'mode'
    | 'trajectory'
    | 'risk'
    | 'guidance-scalar'
    | 'intervention'
}

export type GuidanceMessage = {
  surface: GuidanceSurface
  text: string
  tone: MessagingTone
  suppressible: boolean
  provenance: GuidanceProvenance
}

export type GuidanceContext = {
  tone: MessagingTone
  mode: UserMode
  trajectory: UserTrajectory
  guidance: GuidanceAdaptation
  flowPhase: 'morning' | 'midday' | 'evening'
  collapseRisk: RiskLevel
  interventionType?: ActiveInterventionType
}
