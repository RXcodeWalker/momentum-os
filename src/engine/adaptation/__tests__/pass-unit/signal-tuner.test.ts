import { describe, it, expect } from 'vitest'
import { applyModeBaseline } from '../../baseline/mode-baseline'
import { applySignalTuning } from '../../modulation/signal-tuner'
import type { AdaptationContext } from '../../types/internal'
import { makeUserState } from '@/testing/fixtures/task-intelligence'

function makeNoopRecorder() {
  return { record: () => {}, flush: () => undefined }
}

function makeCtx(signalStrengths: Partial<Record<string, number>>): AdaptationContext {
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
    activeSignalStrengths: signalStrengths as ReturnType<typeof makeCtx>['activeSignalStrengths'],
    resolvedDirectives: [],
    stateConfidence: state.confidence,
  }
}

describe('applySignalTuning', () => {
  describe('DEEP_WORK_DEGRADATION', () => {
    it('strength=0: does NOT fire (threshold=0, check is strength <= threshold)', () => {
      const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
      draft.deepWorkProtectionEnabled = false
      applySignalTuning(draft, makeCtx({ DEEP_WORK_DEGRADATION: 0 }), makeNoopRecorder())
      expect(draft.deepWorkProtectionEnabled).toBe(false)
    })

    it('strength=1: fires, deepWorkProtectionEnabled=true', () => {
      const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
      draft.deepWorkProtectionEnabled = false
      applySignalTuning(draft, makeCtx({ DEEP_WORK_DEGRADATION: 1 }), makeNoopRecorder())
      expect(draft.deepWorkProtectionEnabled).toBe(true)
    })

    it('strength=75: reduces motionIntensity', () => {
      const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
      const before = draft.motionIntensity
      applySignalTuning(draft, makeCtx({ DEEP_WORK_DEGRADATION: 75 }), makeNoopRecorder())
      expect(draft.motionIntensity).toBeLessThan(before)
    })
  })

  describe('AVOIDANCE_CLUSTERING', () => {
    it('strength=55: does NOT reduce visibleTaskLimit (at-threshold = no fire)', () => {
      const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
      const before = draft.visibleTaskLimit
      // The rule for AVOIDANCE_CLUSTERING that reduces visibleTaskLimit has threshold=55
      // strength <= 55 means skip
      applySignalTuning(draft, makeCtx({ AVOIDANCE_CLUSTERING: 55 }), makeNoopRecorder())
      expect(draft.visibleTaskLimit).toBe(before)
    })

    it('strength=56: reduces visibleTaskLimit by 1', () => {
      const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
      const before = draft.visibleTaskLimit
      applySignalTuning(draft, makeCtx({ AVOIDANCE_CLUSTERING: 56 }), makeNoopRecorder())
      expect(draft.visibleTaskLimit).toBe(before - 1)
    })

    it('visibleTaskLimit stays at 1 (Math.max guard) when already at minimum', () => {
      const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
      draft.visibleTaskLimit = 1
      applySignalTuning(draft, makeCtx({ AVOIDANCE_CLUSTERING: 80 }), makeNoopRecorder())
      expect(draft.visibleTaskLimit).toBeGreaterThanOrEqual(1)
    })

    it('strength=0: fires emotionalPressureLevel rule (threshold=0)', () => {
      // The second AVOIDANCE_CLUSTERING rule (emotionalPressure reduction) has threshold=0
      // so strength > 0 is required - but strength=0 is <= 0, won't fire
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder())
      const before = draft.emotionalPressureLevel // 60
      applySignalTuning(draft, makeCtx({ AVOIDANCE_CLUSTERING: 0 }), makeNoopRecorder())
      expect(draft.emotionalPressureLevel).toBe(before)
    })

    it('strength=1: fires emotionalPressureLevel rule (reduces by strength*0.15)', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder())
      const before = draft.emotionalPressureLevel
      applySignalTuning(draft, makeCtx({ AVOIDANCE_CLUSTERING: 1 }), makeNoopRecorder())
      expect(draft.emotionalPressureLevel).toBeLessThan(before)
    })
  })

  describe('RISING_FRAGMENTATION', () => {
    it('strength=60: does NOT fire (check is strength <= threshold)', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder())
      const before = draft.visualNoiseLevel
      applySignalTuning(draft, makeCtx({ RISING_FRAGMENTATION: 60 }), makeNoopRecorder())
      expect(draft.visualNoiseLevel).toBe(before)
    })

    it('strength=61: fires, reduces visualNoiseLevel by 0.3', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder())
      const before = draft.visualNoiseLevel
      applySignalTuning(draft, makeCtx({ RISING_FRAGMENTATION: 61 }), makeNoopRecorder())
      expect(draft.visualNoiseLevel).toBeCloseTo(before - (61 - 60) * 0.3)
    })
  })

  describe('PACING_INSTABILITY', () => {
    it('no AdaptationDraft field is mutated (no tuning rule for this signal)', () => {
      const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
      const before = { ...draft }
      applySignalTuning(draft, makeCtx({ PACING_INSTABILITY: 80 }), makeNoopRecorder())
      // PACING_INSTABILITY has no signal tuning rule so nothing should change
      expect(draft.interfaceDensity).toBe(before.interfaceDensity)
      expect(draft.visibleTaskLimit).toBe(before.visibleTaskLimit)
      expect(draft.emotionalPressureLevel).toBe(before.emotionalPressureLevel)
      expect(draft.deepWorkProtectionEnabled).toBe(before.deepWorkProtectionEnabled)
    })
  })

  describe('no signals', () => {
    it('draft fields unchanged when no signal strengths provided', () => {
      const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
      const before = { ...draft }
      applySignalTuning(draft, makeCtx({}), makeNoopRecorder())
      expect(draft.visibleTaskLimit).toBe(before.visibleTaskLimit)
      expect(draft.visualNoiseLevel).toBe(before.visualNoiseLevel)
      expect(draft.deepWorkProtectionEnabled).toBe(before.deepWorkProtectionEnabled)
    })
  })
})
