import type { Scalar } from '../primitives'
import type { EnvironmentalAdaptation } from '../adaptation/environmental'
import type { Intervention } from '../interventions/intervention'

export type MiddayRegulationOutput = {
  driftDetected: boolean
  fragmentationLevel: Scalar
  deepWorkIntegrity: Scalar
  recalibrationNeeded: boolean
  recommendedIntervention?: Intervention
  environmentAdjustment?: EnvironmentalAdaptation
}

