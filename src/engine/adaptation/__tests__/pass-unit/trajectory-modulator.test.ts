import { describe, it, expect } from 'vitest'
import { applyModeBaseline } from '../../baseline/mode-baseline'
import { applyTrajectoryDelta } from '../../modulation/trajectory-modulator'
import type { AdaptationContext } from '../../types/internal'
import { makeUserState } from '@/testing/fixtures/task-intelligence'

function makeNoopRecorder() {
  return { record: () => {}, flush: () => undefined }
}

function makeCtx(overrides: Partial<AdaptationContext>): AdaptationContext {
  const state = makeUserState('FOCUSED')
  return {
    mode: state.currentMode,
    trajectory: 'STABLE',
    burnoutRisk: 'LOW',
    overloadRisk: 'LOW',
    avoidanceRisk: 'LOW',
    collapseRisk: 'LOW',
    adaptationReadiness: state.adaptationReadiness,
    recoveryDebt: state.recoveryDebt,
    cognitiveStrain: state.cognitiveStrain,
    executionStability: state.executionStability,
    emotionalFriction: state.emotionalFriction,
    activeSignalStrengths: {},
    resolvedDirectives: [],
    stateConfidence: state.confidence,
    ...overrides,
  }
}

describe('applyTrajectoryDelta', () => {
  it('STABLE trajectory: zero fields changed (trace has 0 trajectory entries)', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    const before = { ...draft }
    const entries: unknown[] = []
    const recorder = {
      record: (...args: unknown[]) => entries.push(args),
      flush: () => undefined,
    }
    applyTrajectoryDelta(draft, makeCtx({ trajectory: 'STABLE', mode: 'FOCUSED' }), recorder)
    // No trajectory layer entries
    const trajectoryEntries = (entries as unknown[][]).filter(e => e[3] === 'trajectory')
    expect(trajectoryEntries.length).toBe(0)
    // Fields unchanged
    expect(draft.interfaceDensity).toBe(before.interfaceDensity)
    expect(draft.visibleTaskLimit).toBe(before.visibleTaskLimit)
  })

  it('CONTRACTING on FOCUSED baseline: interfaceDensity=60 (70-10), visibleTaskLimit=4 (6-2)', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    expect(draft.interfaceDensity).toBe(70)
    expect(draft.visibleTaskLimit).toBe(6)
    applyTrajectoryDelta(draft, makeCtx({ trajectory: 'CONTRACTING', mode: 'FOCUSED' }), makeNoopRecorder())
    expect(draft.interfaceDensity).toBe(60)
    expect(draft.visibleTaskLimit).toBe(4)
  })

  it('EXPANDING on RECOVERY baseline: interfaceDensity=35 (30+5), visibleTaskLimit=3 (2+1)', () => {
    const draft = applyModeBaseline('RECOVERY', makeNoopRecorder())
    expect(draft.interfaceDensity).toBe(30)
    expect(draft.visibleTaskLimit).toBe(2)
    applyTrajectoryDelta(draft, makeCtx({ trajectory: 'EXPANDING', mode: 'RECOVERY' }), makeNoopRecorder())
    expect(draft.interfaceDensity).toBe(35)
    expect(draft.visibleTaskLimit).toBe(3)
  })

  it('EXPANDING mode (85) + EXPANDING trajectory = 90 (additive, not set)', () => {
    const draft = applyModeBaseline('EXPANDING', makeNoopRecorder())
    const beforeDensity = draft.interfaceDensity // 85
    applyTrajectoryDelta(draft, makeCtx({ trajectory: 'EXPANDING', mode: 'EXPANDING' }), makeNoopRecorder())
    // interfaceDensity delta is +5 from EXPANDING traj
    expect(draft.interfaceDensity).toBe(beforeDensity + 5)
  })

  it('FRAGILE trajectory reduces visibleTaskLimit by 1', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    const before = draft.visibleTaskLimit
    applyTrajectoryDelta(draft, makeCtx({ trajectory: 'FRAGILE', mode: 'FOCUSED' }), makeNoopRecorder())
    expect(draft.visibleTaskLimit).toBe(before - 1)
  })

  it('records trajectory entries for non-STABLE trajectories', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    const entries: unknown[] = []
    const recorder = {
      record: (...args: unknown[]) => entries.push(args),
      flush: () => undefined,
    }
    applyTrajectoryDelta(draft, makeCtx({ trajectory: 'CONTRACTING', mode: 'FOCUSED' }), recorder)
    const trajectoryEntries = (entries as unknown[][]).filter(e => e[3] === 'trajectory')
    expect(trajectoryEntries.length).toBeGreaterThan(0)
  })
})
