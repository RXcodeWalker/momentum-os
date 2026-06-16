import { describe, expect, it } from 'vitest'
import { evaluate } from './task-engine'
import { scoreTask, computeExecutionWeight, computeResistanceWeight } from './analysis/task-scoring'
import { computeRecoveryBurden } from './analysis/burden-calculator'
import { evaluateCompatibility } from './analysis/compatibility-evaluator'
import { observePortfolio } from './analysis/portfolio-observer'
import { sequenceTasks } from './decision/task-sequencer'
import {
  attachReasoning,
  buildReasoningTrace,
  observationsContainFormulaLeak,
} from './explainability/reasoning'
import {
  buildScenario_ExpandingStretch,
  buildScenario_FocusedDeepWork,
  buildScenario_LowTaskVolume,
  buildScenario_MaintenanceLooping,
  buildScenario_PlanningPhaseLongHorizon,
  buildScenario_PreparationEscape,
  buildScenario_RecoveryMaintenanceExpected,
  buildScenario_RecoverySequencing,
  buildScenario_ResistanceClustering,
  makeTask,
  makeUserState,
  makeSignalSnapshot,
} from '@/testing/fixtures/task-intelligence'

const TS = '2026-03-01T08:00:00.000Z'

// ---------------------------------------------------------------------------
// Unit tests — analysis layer
// ---------------------------------------------------------------------------

describe('computeRecoveryBurden', () => {
  it('computes burden from task attributes only', () => {
    const task = makeTask({ title: 'Test', cognitiveLoad: 80, recoveryCost: 60, fragmentationRisk: 40 })
    const burden = computeRecoveryBurden(task)
    expect(burden.cognitiveBurden).toBe(80)
    expect(burden.depletionBurden).toBe(60)
    expect(burden.fragmentationBurden).toBe(40)
    expect(burden.totalBurdenScore).toBeGreaterThan(0)
    expect(burden.totalBurdenScore).toBeLessThanOrEqual(100)
  })
})

describe('scoreTask', () => {
  it('produces TaskScore with netPriority', () => {
    const task = makeTask({ title: 'Score test', meaningfulness: 80 })
    const score = scoreTask(task, TS)
    expect(score.taskId).toBe(task.id)
    expect(score.execution.finalExecutionWeight).toBeGreaterThan(0)
    expect(score.resistance.finalResistanceWeight).toBeGreaterThanOrEqual(0)
    expect(score.burden.totalBurdenScore).toBeGreaterThanOrEqual(0)
    expect(score.netPriority).toBeGreaterThanOrEqual(0)
    expect(score.netPriority).toBeLessThanOrEqual(100)
  })

  it('uses deferral proxy when initiationDelay is absent', () => {
    const low = makeTask({ title: 'Low deferral', repeatedDeferralCount: 0 })
    const high = makeTask({ title: 'High deferral', repeatedDeferralCount: 4 })
    const lowR = computeResistanceWeight(low)
    const highR = computeResistanceWeight(high)
    expect(highR.initiationDelayWeight).toBeGreaterThan(lowR.initiationDelayWeight)
  })

  it('maps leverageWeight to goalAlignmentWeight', () => {
    const task = makeTask({ title: 'Leverage', leverageWeight: 88 })
    const exec = computeExecutionWeight(task)
    expect(exec.goalAlignmentWeight).toBe(88)
  })
})

describe('evaluateCompatibility', () => {
  it('reads static band and computes burden relative to capacity', () => {
    const task = makeTask({ title: 'Compat', category: 'ADVANCEMENT', recoveryCost: 50, cognitiveLoad: 50 })
    const state = makeUserState('RECOVERY', { recoveryCapacity: 50 })
    const assessment = evaluateCompatibility(task, state)
    expect(assessment.band).toBe('HARMFUL')
    expect(assessment.modeAppropriate).toBe(false)
    expect(assessment.burdenRelativeToCapacity).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Scenario tests
// ---------------------------------------------------------------------------

describe('Scenario: MaintenanceLooping', () => {
  const { state, tasks } = buildScenario_MaintenanceLooping()
  const result = evaluate({ state, tasks })

  it('detects MAINTENANCE_ADVANCEMENT_GAP pattern', () => {
    const observation = observePortfolio(tasks, result.evaluations.map(e => e.score), state)
    expect(observation.patterns).toContain('MAINTENANCE_ADVANCEMENT_GAP')
  })

  it('does not surface deferred advancement as primary', () => {
    const primary = tasks.find(t => t.id === result.sequencing.recommendedPrimaryTaskId)
    expect(primary?.category).not.toBe('ADVANCEMENT')
  })
})

describe('Scenario: PreparationEscape', () => {
  const { state, tasks } = buildScenario_PreparationEscape()
  const result = evaluate({ state, tasks })

  it('detects SUPPORT_ADVANCEMENT_GAP pattern', () => {
    const observation = observePortfolio(tasks, result.evaluations.map(e => e.score), state)
    expect(observation.patterns).toContain('SUPPORT_ADVANCEMENT_GAP')
  })

  it('does not surface support task as primary over advancement', () => {
    const primary = tasks.find(t => t.id === result.sequencing.recommendedPrimaryTaskId)
    expect(primary?.category).not.toBe('SUPPORT')
  })
})

describe('Scenario: ResistanceClustering', () => {
  const { state, tasks } = buildScenario_ResistanceClustering()
  const result = evaluate({ state, tasks })

  it('detects HIGH_RESISTANCE_DEFERRAL_CLUSTER', () => {
    const observation = observePortfolio(tasks, result.evaluations.map(e => e.score), state)
    expect(observation.patterns).toContain('HIGH_RESISTANCE_DEFERRAL_CLUSTER')
  })

  it('deprioritizes high-resistance meaningful tasks when avoidance risk elevated', () => {
    const primary = tasks.find(t => t.id === result.sequencing.recommendedPrimaryTaskId)
    const isHighResistanceDeferred =
      primary?.emotionalResistance !== undefined &&
      primary.emotionalResistance >= 60 &&
      primary.repeatedDeferralCount >= 2
    expect(isHighResistanceDeferred).toBe(false)
  })
})

describe('Scenario: RecoverySequencing', () => {
  const { state, tasks } = buildScenario_RecoverySequencing()
  const result = evaluate({ state, tasks })

  it('surfaces recovery-compatible task as primary', () => {
    const primary = tasks.find(t => t.id === result.sequencing.recommendedPrimaryTaskId)
    expect(['RECOVERY', 'MAINTENANCE']).toContain(primary?.category)
  })

  it('suppresses harmful advancement tasks', () => {
    const advancement = tasks.find(t => t.category === 'ADVANCEMENT')!
    expect(result.sequencing.suppressedTaskIds).toContain(advancement.id)
  })
})

describe('Scenario: FocusedDeepWork', () => {
  const { state, tasks } = buildScenario_FocusedDeepWork()
  const result = evaluate({ state, tasks })

  it('prioritizes deep-work advancement task as primary', () => {
    const primary = tasks.find(t => t.id === result.sequencing.recommendedPrimaryTaskId)
    expect(primary?.title).toBe('Design system architecture')
    expect(primary?.deepWorkCompatibility).toBeGreaterThanOrEqual(60)
  })
})

describe('Scenario: ExpandingStretch', () => {
  const { state, tasks } = buildScenario_ExpandingStretch()
  const result = evaluate({ state, tasks })

  it('selects growth or advancement stretch over maintenance', () => {
    const primary = tasks.find(t => t.id === result.sequencing.recommendedPrimaryTaskId)
    expect(['GROWTH', 'ADVANCEMENT']).toContain(primary?.category)
  })
})

// ---------------------------------------------------------------------------
// False-positive safeguard scenarios
// ---------------------------------------------------------------------------

describe('Scenario: RecoveryMaintenanceExpected', () => {
  const { state, tasks } = buildScenario_RecoveryMaintenanceExpected()

  it('does not flag MAINTENANCE_ADVANCEMENT_GAP in RECOVERY mode', () => {
    const observation = observePortfolio(tasks, tasks.map(t => scoreTask(t, TS)), state)
    expect(observation.patterns).not.toContain('MAINTENANCE_ADVANCEMENT_GAP')
  })
})

describe('Scenario: PlanningPhaseLongHorizon', () => {
  const { state, tasks } = buildScenario_PlanningPhaseLongHorizon()

  it('does not flag SUPPORT_ADVANCEMENT_GAP during long-horizon planning', () => {
    const observation = observePortfolio(tasks, tasks.map(t => scoreTask(t, TS)), state)
    expect(observation.patterns).not.toContain('SUPPORT_ADVANCEMENT_GAP')
  })
})

describe('Scenario: LowTaskVolume', () => {
  const { state, tasks } = buildScenario_LowTaskVolume()

  it('returns empty patterns with LOW confidence', () => {
    const observation = observePortfolio(tasks, tasks.map(t => scoreTask(t, TS)), state)
    expect(observation.patterns).toHaveLength(0)
    expect(observation.confidenceBand).toBe('LOW')
  })
})

// ---------------------------------------------------------------------------
// Explainability
// ---------------------------------------------------------------------------

describe('Explainability', () => {
  it('reasoning trace contains no formula leakage', () => {
    const { state, tasks } = buildScenario_FocusedDeepWork()
    const result = evaluate({ state, tasks })
    expect(observationsContainFormulaLeak(result.sequencing.reasoningTrace)).toBe(false)
  })

  it('sequencingReasoning is derived from reasoningTrace factors', () => {
    const { state, tasks } = buildScenario_RecoverySequencing()
    const result = evaluate({ state, tasks })
    expect(result.sequencing.sequencingReasoning).toEqual(
      result.sequencing.reasoningTrace.factors.map(f => f.observation),
    )
  })

  it('uses observational language without forbidden identity labels', () => {
    const { state, tasks } = buildScenario_MaintenanceLooping()
    const result = evaluate({ state, tasks })
    const allText = result.sequencing.sequencingReasoning.join(' ').toLowerCase()
    expect(allText).not.toMatch(/lazy|procrastinat|you are|you're falling/)
  })
})

// ---------------------------------------------------------------------------
// Architecture compliance
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('evaluate() returns plain data with version tag', () => {
    const state = makeUserState('FOCUSED')
    const tasks = [makeTask({ title: 'A' }), makeTask({ title: 'B' }), makeTask({ title: 'C' })]
    const result = evaluate({ state, tasks })
    expect(result.engineVersion).toBe('v1')
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
  })

  it('SequencingDecision uses task IDs only', () => {
    const { state, tasks } = buildScenario_RecoverySequencing()
    const result = evaluate({ state, tasks })
    const { sequencing } = result
    if (sequencing.recommendedPrimaryTaskId) {
      expect(typeof sequencing.recommendedPrimaryTaskId).toBe('string')
    }
    for (const id of sequencing.suppressedTaskIds) {
      expect(typeof id).toBe('string')
    }
    expect(sequencing).not.toHaveProperty('recommendedPrimaryTask')
  })

  it('signal snapshot caps portfolio confidence when no avoidance signals', () => {
    const { state, tasks } = buildScenario_MaintenanceLooping()
    const scores = tasks.map(t => scoreTask(t, TS))
    const withoutSignal = observePortfolio(tasks, scores, state)
    const withEmptySignal = observePortfolio(tasks, scores, state, makeSignalSnapshot())
    if (withoutSignal.patterns.length > 0) {
      expect(withEmptySignal.confidenceBand).not.toBe('HIGH')
    }
  })
})

// ---------------------------------------------------------------------------
// Decision layer isolation
// ---------------------------------------------------------------------------

describe('sequenceTasks', () => {
  it('is the only module that produces suppression decisions', () => {
    const { state, tasks } = buildScenario_RecoverySequencing()
    const evaluations = tasks.map(task => ({ task, score: scoreTask(task, TS) }))
    const compatibilities = tasks.map(task => evaluateCompatibility(task, state))
    const portfolioObservation = observePortfolio(
      tasks,
      evaluations.map(e => e.score),
      state,
    )
    const raw = sequenceTasks({
      state,
      tasks,
      evaluations,
      compatibilities,
      portfolioObservation,
    })
    const sequencing = attachReasoning(
      { state, tasks, evaluations, compatibilities, portfolioObservation },
      raw,
    )
    expect(sequencing.suppressedTaskIds.length).toBeGreaterThan(0)
    expect(sequencing.reasoningTrace.factors.length).toBeGreaterThan(0)
  })
})
