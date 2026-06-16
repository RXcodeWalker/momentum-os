// Fix-2: StateTransition is no longer on UserState.
// It is carried here as pendingTransition? — a pipeline-level event visible to orchestration
// and audit/persistence layers, but not passed into downstream engine function signatures.
// Downstream engines receive UserState (stable snapshot) only.

import type { DailyInputs } from '../signals/daily-inputs'
import type { UserState } from '../state/user-state'
import type { UserTrajectory } from '../state/modes'
import type { StateTransition } from '../state/transitions'
import type { TaskEvaluation, SequencingDecision } from '../tasks'
import type { InterventionEvaluationResult } from '../interventions/evaluation'
import type { AdaptationOutput } from '../adaptation/output'
import type { SignalSnapshot } from '../signals/signal-snapshot'

/** Full pipeline wire type — orchestration assembles, engines produce fields. */
export type BehavioralPipeline = {
  inputCollection: DailyInputs
  signalSnapshot: SignalSnapshot
  stateInterpretation: UserState
  /** Emitted when the state engine determines a mode transition occurred this run. */
  pendingTransition?: StateTransition
  trajectoryAnalysis: UserTrajectory
  taskEvaluation: TaskEvaluation[]
  sequencingDecision: SequencingDecision
  interventionEvaluation: InterventionEvaluationResult
  adaptationGeneration: AdaptationOutput
}

