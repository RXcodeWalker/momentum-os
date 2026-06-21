import { describe, it, expect } from 'vitest'
import { applyModeBaseline } from '../../baseline/mode-baseline'
import { resolveMessagingTone } from '../../output/resolve-guidance'
import type { AdaptationContext } from '../../types/internal'
import { makeUserState } from '@/testing/fixtures/task-intelligence'

function makeNoopRecorder() {
  return { record: () => {}, flush: () => undefined }
}

function makeCtx(overrides: Partial<AdaptationContext>): AdaptationContext {
  const state = makeUserState('FOCUSED')
  return {
    mode: 'FOCUSED',
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

describe('resolveMessagingTone', () => {
  it('RECOVERY + collapseRisk CRITICAL → CALM', () => {
    const draft = applyModeBaseline('RECOVERY', makeNoopRecorder())
    resolveMessagingTone(draft, makeCtx({ mode: 'RECOVERY', collapseRisk: 'CRITICAL' }))
    expect(draft.messagingTone).toBe('CALM')
  })

  it('RECOVERY (no collapse CRITICAL) → STABILIZING', () => {
    const draft = applyModeBaseline('RECOVERY', makeNoopRecorder())
    resolveMessagingTone(draft, makeCtx({ mode: 'RECOVERY' }))
    expect(draft.messagingTone).toBe('STABILIZING')
  })

  it('STABILIZING mode → STEADY', () => {
    const draft = applyModeBaseline('STABILIZING', makeNoopRecorder())
    resolveMessagingTone(draft, makeCtx({ mode: 'STABILIZING' }))
    expect(draft.messagingTone).toBe('STEADY')
  })

  it('FRAGILE trajectory → STEADY', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    resolveMessagingTone(draft, makeCtx({ mode: 'FOCUSED', trajectory: 'FRAGILE' }))
    expect(draft.messagingTone).toBe('STEADY')
  })

  it('FOCUSED mode → FOCUSED', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    resolveMessagingTone(draft, makeCtx({ mode: 'FOCUSED' }))
    expect(draft.messagingTone).toBe('FOCUSED')
  })

  it('EXPANDING + challengeLevel > 70 → CHALLENGING', () => {
    const draft = applyModeBaseline('EXPANDING', makeNoopRecorder())
    draft.recommendedChallengeLevel = 80 // > 70
    resolveMessagingTone(draft, makeCtx({ mode: 'EXPANDING' }))
    expect(draft.messagingTone).toBe('CHALLENGING')
  })

  it('CONTRACTING trajectory (EXPANDING mode, no critical risks) → OBSERVATIONAL', () => {
    // EXPANDING mode with CONTRACTING trajectory and challengeLevel ≤ 70 → falls through to CONTRACTING check
    const draft = applyModeBaseline('EXPANDING', makeNoopRecorder())
    draft.recommendedChallengeLevel = 60 // ≤ 70, so CHALLENGING doesn't fire
    resolveMessagingTone(draft, makeCtx({ mode: 'EXPANDING', trajectory: 'CONTRACTING' }))
    expect(draft.messagingTone).toBe('OBSERVATIONAL')
  })

  it('EXPANDING mode + challengeLevel ≤ 70 → STEADY (default)', () => {
    const draft = applyModeBaseline('EXPANDING', makeNoopRecorder())
    draft.recommendedChallengeLevel = 60 // ≤ 70
    resolveMessagingTone(draft, makeCtx({ mode: 'EXPANDING' }))
    expect(draft.messagingTone).toBe('STEADY')
  })

  it('low emotionalPressure + high clarityOrientation → CALM', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    draft.emotionalPressureLevel = 15 // < 20
    draft.clarityOrientation = 80 // > 70
    resolveMessagingTone(draft, makeCtx({ mode: 'FOCUSED', trajectory: 'STABLE' }))
    expect(draft.messagingTone).toBe('CALM')
  })
})
