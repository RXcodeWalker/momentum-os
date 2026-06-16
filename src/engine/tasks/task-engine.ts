import type { Timestamp } from '@/core/contracts/primitives'
import type { UserState } from '@/core/contracts/state/user-state'
import type { SignalSnapshot } from '@/core/contracts/signals/signal-snapshot'
import type { Task } from '@/core/contracts/tasks/task'
import type { TaskEvaluation, SequencingDecision } from '@/core/contracts/tasks'
import { TASK_INTELLIGENCE_VERSION } from './config'
import { evaluateCompatibility } from './analysis/compatibility-evaluator'
import { observePortfolio } from './analysis/portfolio-observer'
import { scoreTask } from './analysis/task-scoring'
import type { SequencingContext } from './decision/sequencing-context'
import { sequenceTasks } from './decision/task-sequencer'
import { attachReasoning } from './explainability/reasoning'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type TaskEngineInput = {
  state: UserState
  tasks: Task[]
  signalSnapshot?: SignalSnapshot
  evaluatedAt?: Timestamp
}

export type TaskEngineResult = {
  evaluations: TaskEvaluation[]
  sequencing: SequencingDecision
  engineVersion: typeof TASK_INTELLIGENCE_VERSION
}

function resolveTimestamp(input: TaskEngineInput): Timestamp {
  return input.evaluatedAt ?? input.state.lastUpdatedAt
}

export function evaluate(input: TaskEngineInput): TaskEngineResult {
  const { state, tasks, signalSnapshot } = input
  const evaluatedAt = resolveTimestamp(input)

  const scores = tasks.map(task => scoreTask(task, evaluatedAt))
  const evaluations: TaskEvaluation[] = tasks.map((task, index) => ({
    task,
    score: scores[index],
  }))

  const compatibilities = tasks.map(task => evaluateCompatibility(task, state))
  const portfolioObservation = observePortfolio(tasks, scores, state, signalSnapshot)

  const context: SequencingContext = {
    state,
    signalSnapshot,
    tasks,
    evaluations,
    compatibilities,
    portfolioObservation,
  }

  const rawDecision = sequenceTasks(context)
  const sequencing = attachReasoning(context, rawDecision)

  return {
    evaluations,
    sequencing,
    engineVersion: TASK_INTELLIGENCE_VERSION,
  }
}
