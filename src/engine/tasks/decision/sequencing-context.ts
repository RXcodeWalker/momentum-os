import type { UserState } from '@/core/contracts/state/user-state'
import type { StateDynamicsProfile } from '@/core/contracts/state/dynamics'
import type { SignalSnapshot } from '@/core/contracts/signals/signal-snapshot'
import type { Task } from '@/core/contracts/tasks/task'
import type { TaskEvaluation } from '@/core/contracts/tasks/scores'
import type { CompatibilityAssessment, PortfolioObservation } from '../analysis/types'

// ---------------------------------------------------------------------------
// Future-proof sequencing input — extend with optional slots as pipeline grows
// ---------------------------------------------------------------------------

export type SequencingContext = {
  state: UserState
  dynamicsProfile: StateDynamicsProfile
  signalSnapshot?: SignalSnapshot
  tasks: Task[]
  evaluations: TaskEvaluation[]
  compatibilities: CompatibilityAssessment[]
  portfolioObservation: PortfolioObservation
  // Future slots:
  // activeInterventions?: Intervention[]
  // adaptationHints?: Pick<AdaptationOutput, 'execution'>
  // evidenceWindow?: SessionEvidence[]
}
