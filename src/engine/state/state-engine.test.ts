import { describe, expect, it } from 'vitest'
import { evaluate } from './state-engine'
import { THRESHOLDS, CONFIDENCE_BAND_MEDIUM_THRESHOLD } from './config'
import { computeDimensions } from './state-dimensions'
import { computeStateConfidence } from './state-confidence'
import { analyzeTrajectory } from './trajectory-analyzer'
import {
  buildScenario_RecoveryTrigger,
  buildScenario_ExpandingMomentum,
  buildScenario_SingleBadDayAfterStreak,
  buildScenario_FragmentedExecution,
  buildScenario_IncompleteEvidence,
  makeEvidence,
  buildEvidence,
  makeSnapshot,
  emptySnapshot,
} from '@/testing/fixtures/state-evidence'

// ---------------------------------------------------------------------------
// Scenario 1 — 3 days poor sleep + high overwhelm + declining execution
// Expected: RECOVERY mode
// ---------------------------------------------------------------------------

describe('Scenario 1: RecoveryTrigger', () => {
  const evidence = buildScenario_RecoveryTrigger()
  const result   = evaluate({ evidence, signalSnapshots: [emptySnapshot(2)] })

  it('classifies mode as RECOVERY', () => {
    expect(result.state.currentMode).toBe('RECOVERY')
  })

  it('produces a state with elevated recoveryDebt', () => {
    expect(result.state.recoveryDebt).toBeGreaterThan(55)
  })

  it('produces elevated overwhelmLevel', () => {
    expect(result.state.overwhelmLevel).toBeGreaterThan(55)
  })

  it('includes StateConfidence with valid band', () => {
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.state.confidence.band)
  })

  it('emits a transition when previousMode was FOCUSED', () => {
    const result2 = evaluate({ evidence, signalSnapshots: [emptySnapshot(2)], previousMode: 'FOCUSED' })
    expect(result2.transition).toBeDefined()
    expect(result2.transition?.to).toBe('RECOVERY')
    expect(result2.transition?.from).toBe('FOCUSED')
    expect(result2.transition?.reversible).toBe(true)
  })

  it('does not emit a transition when previousMode already RECOVERY', () => {
    const result2 = evaluate({ evidence, signalSnapshots: [emptySnapshot(2)], previousMode: 'RECOVERY' })
    expect(result2.transition).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Scenario 2 — 14 days stable execution + low recovery debt + strong continuity
// Expected: EXPANDING mode
// ---------------------------------------------------------------------------

describe('Scenario 2: ExpandingMomentum', () => {
  const evidence = buildScenario_ExpandingMomentum()
  const result   = evaluate({ evidence, signalSnapshots: [emptySnapshot(13)] })

  it('classifies mode as EXPANDING', () => {
    expect(result.state.currentMode).toBe('EXPANDING')
  })

  it('produces low recoveryDebt', () => {
    expect(result.state.recoveryDebt).toBeLessThan(32)
  })

  it('produces high executionStability', () => {
    expect(result.state.executionStability).toBeGreaterThan(66)
  })

  it('produces low emotionalFriction', () => {
    expect(result.state.emotionalFriction).toBeLessThan(42)
  })

  it('produces STABLE trajectory for flat sustained strength', () => {
    expect(result.state.currentTrajectory).toBe('STABLE')
  })

  it('carries MEDIUM or HIGH confidence with 14 days of evidence', () => {
    expect(['MEDIUM', 'HIGH']).toContain(result.state.confidence.band)
  })
})

// ---------------------------------------------------------------------------
// Scenario 3 — One bad day after 10 strong days
// Expected: mode MUST NOT flip to RECOVERY or STABILIZING
// ---------------------------------------------------------------------------

describe('Scenario 3: SingleBadDayNoModeFlip', () => {
  const evidence = buildScenario_SingleBadDayAfterStreak()
  const result   = evaluate({ evidence, signalSnapshots: [emptySnapshot(10)], previousMode: 'FOCUSED' })

  it('does not flip to RECOVERY after a single bad day', () => {
    expect(result.state.currentMode).not.toBe('RECOVERY')
  })

  it('does not flip to RECOVERY on the first day of evidence alone', () => {
    const singleDay = evaluate({
      evidence: [makeEvidence(0, { sleepQuality: 15, physicalEnergy: 15, mentalClarity: 15 })],
      signalSnapshots: [],
    })
    expect(singleDay.state.currentMode).not.toBe('RECOVERY')
  })

  it('does not emit a mode transition on a single-day anomaly', () => {
    expect(result.transition).toBeUndefined()
  })

  it('confidence may decrease but state remains valid', () => {
    expect(result.state.confidence.score).toBeGreaterThan(0)
    expect(result.state.lastUpdatedAt).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Scenario 4 — Rising fragmentation + declining execution + stable sleep
// Expected: increased CognitiveStrain, reduced ExecutionStability
// ---------------------------------------------------------------------------

describe('Scenario 4: FragmentedExecution', () => {
  const evidence = buildScenario_FragmentedExecution()
  const dims     = computeDimensions(evidence)

  it('produces elevated cognitiveStrain', () => {
    expect(dims.cognitiveStrain).toBeGreaterThan(38)
  })

  it('produces reduced executionStability', () => {
    expect(dims.executionStability).toBeLessThan(58)
  })

  it('leaves recoveryCapacity mostly intact (sleep is stable)', () => {
    expect(dims.recoveryCapacity).toBeGreaterThan(60)
  })

  it('produces elevated fragmentationLevel', () => {
    expect(dims.fragmentationLevel).toBeGreaterThan(45)
  })
})

// ---------------------------------------------------------------------------
// Scenario 5 — Incomplete evidence (1 day, 45% completeness)
// Expected: LOW confidence, still valid UserState
// ---------------------------------------------------------------------------

describe('Scenario 5: IncompleteEvidence', () => {
  const evidence = buildScenario_IncompleteEvidence()
  const result   = evaluate({ evidence, signalSnapshots: [] })

  it('produces a valid UserState with all required fields', () => {
    const s = result.state
    expect(typeof s.recoveryDebt).toBe('number')
    expect(typeof s.cognitiveStrain).toBe('number')
    expect(typeof s.executionStability).toBe('number')
    expect(typeof s.emotionalFriction).toBe('number')
    expect(s.currentMode).toBeDefined()
    expect(s.confidence).toBeDefined()
    expect(s.lastUpdatedAt).toBeTruthy()
  })

  it('returns LOW confidence band with sparse evidence', () => {
    expect(result.state.confidence.band).toBe('LOW')
  })

  it('lists uncertainty factors explaining the low confidence', () => {
    expect(result.state.confidence.uncertaintyFactors.length).toBeGreaterThan(0)
  })

  it('produces a valid mode even with minimal evidence', () => {
    expect(['RECOVERY', 'STABILIZING', 'FOCUSED', 'EXPANDING']).toContain(result.state.currentMode)
  })
})

// ---------------------------------------------------------------------------
// Unit: computeDimensions
// ---------------------------------------------------------------------------

describe('computeDimensions', () => {
  it('returns neutral-healthy defaults for empty evidence', () => {
    const dims = computeDimensions([])
    expect(dims.recoveryDebt).toBeGreaterThan(25)
    expect(dims.recoveryDebt).toBeLessThan(50)
    expect(dims.executionStability).toBeGreaterThan(50)
  })

  it('reflects high recovery debt when sleep is consistently poor', () => {
    const evidence = buildEvidence(5, { sleepQuality: 22, physicalEnergy: 25, mentalClarity: 28 })
    const dims = computeDimensions(evidence)
    expect(dims.recoveryDebt).toBeGreaterThan(55)
    expect(dims.recoveryCapacity).toBeLessThan(35)
  })

  it('reflects high execution stability with strong execution evidence', () => {
    const evidence = buildEvidence(5, {
      meaningfulAdvancementQuality: 85,
      deepWorkContinuity: 82,
      executionIntegrity: 84,
      pacingQuality: 80,
      fragmentationLevel: 18,
    })
    const dims = computeDimensions(evidence)
    expect(dims.executionStability).toBeGreaterThan(68)
  })
})

// ---------------------------------------------------------------------------
// Unit: computeStateConfidence
// ---------------------------------------------------------------------------

describe('computeStateConfidence', () => {
  it('returns LOW confidence with no evidence', () => {
    const c = computeStateConfidence([], [])
    expect(c.band).toBe('LOW')
    expect(c.evidenceCoverage).toBe(0)
  })

  it('returns MEDIUM or HIGH confidence with 7+ complete days', () => {
    const evidence = buildEvidence(7, {}, 0.9)
    const c = computeStateConfidence(evidence, [emptySnapshot(6)])
    expect(['MEDIUM', 'HIGH']).toContain(c.band)
  })

  it('lists uncertainty factors when evidence is sparse', () => {
    const c = computeStateConfidence(buildEvidence(2, {}, 0.4), [])
    expect(c.uncertaintyFactors.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Unit: analyzeTrajectory
// ---------------------------------------------------------------------------

describe('analyzeTrajectory', () => {
  it('returns STABLE for no evidence', () => {
    expect(analyzeTrajectory([])).toBe('STABLE')
  })

  it('returns EXPANDING when performance is actively rising', () => {
    const evidence = Array.from({ length: 14 }, (_, day) =>
      makeEvidence(day, {
        sleepQuality: 62 + day * 2,
        physicalEnergy: 60 + day * 2,
        meaningfulAdvancementQuality: 58 + day * 2,
        executionIntegrity: 58 + day * 2,
        fragmentationLevel: 30 - day,
        avoidancePressure: 28 - day,
      }),
    )
    expect(analyzeTrajectory(evidence)).toBe('EXPANDING')
  })

  it('returns STABLE for consistently high but flat performance', () => {
    const evidence = buildEvidence(14, {
      sleepQuality: 82, physicalEnergy: 80,
      meaningfulAdvancementQuality: 80, executionIntegrity: 80,
      fragmentationLevel: 15, avoidancePressure: 15,
    })
    expect(analyzeTrajectory(evidence)).toBe('STABLE')
  })

  it('returns CONTRACTING for steep multi-week decline', () => {
    const evidence = Array.from({ length: 10 }, (_, day) =>
      makeEvidence(day, {
        sleepQuality:                  72 - day * 8,
        physicalEnergy:                68 - day * 8,
        meaningfulAdvancementQuality:  70 - day * 8,
        executionIntegrity:            68 - day * 8,
        fragmentationLevel:            20 + day * 8,
        avoidancePressure:             20 + day * 8,
      }),
    )
    const t = analyzeTrajectory(evidence)
    expect(['CONTRACTING', 'FRAGILE']).toContain(t)
  })
})

// ---------------------------------------------------------------------------
// Unit: StateTransition contract compliance
// ---------------------------------------------------------------------------

describe('StateTransition shape', () => {
  it('transition has all required contract fields', () => {
    const evidence = buildScenario_RecoveryTrigger()
    const result = evaluate({ evidence, signalSnapshots: [emptySnapshot(2)], previousMode: 'FOCUSED' })
    const t = result.transition
    expect(t).toBeDefined()
    if (!t) return

    expect(typeof t.from).toBe('string')
    expect(typeof t.to).toBe('string')
    expect(typeof t.confidence).toBe('number')
    expect(Array.isArray(t.supportingFactors)).toBe(true)
    expect(typeof t.sustainedSignalDurationDays).toBe('number')
    expect(t.reversible).toBe(true)
    expect(typeof t.occurredAt).toBe('string')
  })

  it('RECOVERY transition confidence is anchored at the recovery debt gate threshold', () => {
    const evidence = buildScenario_RecoveryTrigger()
    const result = evaluate({
      evidence,
      signalSnapshots: [emptySnapshot(2)],
      previousMode: 'FOCUSED',
    })
    const t = result.transition
    expect(t).toBeDefined()
    if (!t) return

    expect(result.state.recoveryDebt).toBeGreaterThanOrEqual(THRESHOLDS.recoveryDebtRecovery)
    expect(t.confidence).toBeGreaterThanOrEqual(CONFIDENCE_BAND_MEDIUM_THRESHOLD)
  })

  it('signal-snapshot driven RECOVERY transition includes collapse duration', () => {
    const evidence = buildScenario_RecoveryTrigger()
    const snapshot = makeSnapshot(2, { RECOVERY_COLLAPSE: { strength: 72, days: 3 } })
    const result = evaluate({
      evidence,
      signalSnapshots: [snapshot],
      previousMode: 'FOCUSED',
    })
    expect(result.transition?.to).toBe('RECOVERY')
    expect(result.transition?.supportingFactors.some(f => f.includes('collapse'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Architecture rule: engine outputs no React / Zustand / DOM
// ---------------------------------------------------------------------------

describe('Architecture compliance', () => {
  it('evaluate() returns plain data, no framework objects', () => {
    const result = evaluate({ evidence: [], signalSnapshots: [] })
    expect(result.state).toBeTypeOf('object')
    expect(result.engineVersion).toBe('v1')
    // No prototype chain beyond Object
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
  })
})
