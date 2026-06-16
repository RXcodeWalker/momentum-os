import type { UserState } from '../state/user-state'
import type { SignalSnapshot } from '../signals/signal-snapshot'
import type { SequencingDecision } from '../tasks/sequencing'
import type { ReentryProtocol } from '../reentry/protocol'
import type { Intervention } from './intervention'
import type { InterventionAuditRecord } from './audit'

export type InterventionEvaluationContext = {
  flowPhase: 'morning' | 'midday' | 'evening'
  /** Last 7 days of audit records — supplied by orchestration, never fetched by engine. */
  recentInterventions: InterventionAuditRecord[]
  activeReentryProtocol?: ReentryProtocol
}

export type InterventionEvaluationInput = {
  state: UserState
  signalSnapshot: SignalSnapshot
  sequencing: SequencingDecision
  context: InterventionEvaluationContext
}

export type InterventionEvaluationResult = {
  /** 0–1 primary interventions with level ≥1; level-0 directives may be merged here. */
  interventions: Intervention[]
  /** Observational notes on suppressed candidates — audit-safe, no weights/scores. */
  evaluationNotes: string[]
  /** True when suppression or cooldown prevented a higher level from firing. */
  restraintApplied: boolean
}
