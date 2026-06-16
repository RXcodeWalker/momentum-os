import type { Timestamp } from '../primitives'
import type { InterventionType, InterventionLevel } from './types'

/** Persistence record written by orchestration after an intervention fires. Read-only for engine. */
export type InterventionAuditRecord = {
  interventionId: string
  type: InterventionType
  level: InterventionLevel
  firedAt: Timestamp
  flowPhase: 'morning' | 'midday' | 'evening'
  cooldownDurationHours: number
}
