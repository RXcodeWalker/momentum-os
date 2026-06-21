import { describe, it, expect } from 'vitest'
import { applyModeBaseline } from '../../baseline/mode-baseline'
import { resolvePacingRecommendation } from '../../output/resolve-execution'
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

describe('resolvePacingRecommendation', () => {
  it('RECOVERY mode → always REDUCE_LOAD', () => {
    const draft = applyModeBaseline('RECOVERY', makeNoopRecorder())
    resolvePacingRecommendation(draft, makeCtx({ mode: 'RECOVERY' }))
    expect(draft.pacingRecommendation).toBe('REDUCE_LOAD')
  })

  it('burnoutRisk CRITICAL → COMPRESS_SCOPE', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    resolvePacingRecommendation(draft, makeCtx({ burnoutRisk: 'CRITICAL', mode: 'FOCUSED' }))
    expect(draft.pacingRecommendation).toBe('COMPRESS_SCOPE')
  })

  it('collapseRisk CRITICAL → COMPRESS_SCOPE', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    resolvePacingRecommendation(draft, makeCtx({ collapseRisk: 'CRITICAL', mode: 'FOCUSED' }))
    expect(draft.pacingRecommendation).toBe('COMPRESS_SCOPE')
  })

  it('DEEP_WORK_DEGRADATION active + deepWorkExpectation > 50 → PROTECT_CONTINUITY', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    draft.deepWorkExpectation = 70 // > 50
    resolvePacingRecommendation(
      draft,
      makeCtx({
        mode: 'FOCUSED',
        activeSignalStrengths: { DEEP_WORK_DEGRADATION: 75 },
      }),
    )
    expect(draft.pacingRecommendation).toBe('PROTECT_CONTINUITY')
  })

  it('EXPANDING mode + challengeLevel > 65 → INCREASE_CHALLENGE', () => {
    const draft = applyModeBaseline('EXPANDING', makeNoopRecorder())
    draft.recommendedChallengeLevel = 80 // > 65
    resolvePacingRecommendation(draft, makeCtx({ mode: 'EXPANDING' }))
    expect(draft.pacingRecommendation).toBe('INCREASE_CHALLENGE')
  })

  it('default → MAINTAIN_RHYTHM', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    resolvePacingRecommendation(draft, makeCtx({ mode: 'FOCUSED' }))
    expect(draft.pacingRecommendation).toBe('MAINTAIN_RHYTHM')
  })

  it('weight normalization: recoveryWeighting=0.6 + advancementWeighting=0.6 → both become 0.5', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    draft.recoveryWeighting = 0.6
    draft.advancementWeighting = 0.6
    resolvePacingRecommendation(draft, makeCtx({ mode: 'FOCUSED' }))
    expect(draft.recoveryWeighting + draft.advancementWeighting).toBeCloseTo(1.0, 3)
    expect(draft.recoveryWeighting).toBeCloseTo(0.5, 3)
    expect(draft.advancementWeighting).toBeCloseTo(0.5, 3)
  })

  it('weight normalization: sum already ≈ 1.0 → no change', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    const rBefore = draft.recoveryWeighting
    const aBefore = draft.advancementWeighting
    resolvePacingRecommendation(draft, makeCtx({ mode: 'FOCUSED' }))
    expect(draft.recoveryWeighting + draft.advancementWeighting).toBeCloseTo(1.0, 3)
    expect(draft.recoveryWeighting).toBeCloseTo(rBefore, 5)
    expect(draft.advancementWeighting).toBeCloseTo(aBefore, 5)
  })
})
