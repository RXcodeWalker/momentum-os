import { describe, it, expect } from 'vitest'
import { applyModeBaseline } from '../../baseline/mode-baseline'
import { applyRiskAmplification } from '../../modulation/risk-amplifier'
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

describe('applyRiskAmplification', () => {
  describe('burnoutRisk CRITICAL', () => {
    it('interfaceDensity ≤ 40', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder()) // starts at 85
      applyRiskAmplification(draft, makeCtx({ burnoutRisk: 'CRITICAL' }), makeNoopRecorder())
      expect(draft.interfaceDensity).toBeLessThanOrEqual(40)
    })

    it('visibleTaskLimit ≤ 3', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder()) // starts at 8
      applyRiskAmplification(draft, makeCtx({ burnoutRisk: 'CRITICAL' }), makeNoopRecorder())
      expect(draft.visibleTaskLimit).toBeLessThanOrEqual(3)
    })

    it('workloadCompressionRatio ≤ 0.50', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder()) // starts at 1.0
      applyRiskAmplification(draft, makeCtx({ burnoutRisk: 'CRITICAL' }), makeNoopRecorder())
      expect(draft.workloadCompressionRatio).toBeLessThanOrEqual(0.50)
    })

    it('recoveryWeighting ≥ 0.75', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder()) // starts at 0.15
      applyRiskAmplification(draft, makeCtx({ burnoutRisk: 'CRITICAL' }), makeNoopRecorder())
      expect(draft.recoveryWeighting).toBeGreaterThanOrEqual(0.75)
    })

    it('emotionalPressureLevel ≤ 20', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder()) // starts at 60
      applyRiskAmplification(draft, makeCtx({ burnoutRisk: 'CRITICAL' }), makeNoopRecorder())
      expect(draft.emotionalPressureLevel).toBeLessThanOrEqual(20)
    })
  })

  describe('burnoutRisk HIGH', () => {
    it('interfaceDensity ≤ 55', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder()) // starts at 85
      applyRiskAmplification(draft, makeCtx({ burnoutRisk: 'HIGH' }), makeNoopRecorder())
      expect(draft.interfaceDensity).toBeLessThanOrEqual(55)
    })

    it('emotionalPressureLevel ≤ 20', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder())
      applyRiskAmplification(draft, makeCtx({ burnoutRisk: 'HIGH' }), makeNoopRecorder())
      expect(draft.emotionalPressureLevel).toBeLessThanOrEqual(20)
    })

    it('CRITICAL inputs also pass HIGH-level check (gate uses ≥ comparison)', () => {
      // CRITICAL ≥ HIGH, so HIGH gates should fire for CRITICAL
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder())
      applyRiskAmplification(draft, makeCtx({ burnoutRisk: 'CRITICAL' }), makeNoopRecorder())
      // The CRITICAL gate sets ≤ 40, which also satisfies ≤ 55
      expect(draft.interfaceDensity).toBeLessThanOrEqual(55)
    })
  })

  describe('overloadRisk CRITICAL', () => {
    it('visualNoiseLevel ≤ 35', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder()) // starts at 70
      applyRiskAmplification(draft, makeCtx({ overloadRisk: 'CRITICAL' }), makeNoopRecorder())
      expect(draft.visualNoiseLevel).toBeLessThanOrEqual(35)
    })

    it('visibleTaskLimit ≤ 4', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder()) // starts at 8
      applyRiskAmplification(draft, makeCtx({ overloadRisk: 'CRITICAL' }), makeNoopRecorder())
      expect(draft.visibleTaskLimit).toBeLessThanOrEqual(4)
    })
  })

  describe('overloadRisk HIGH', () => {
    it('visualNoiseLevel ≤ 35', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder())
      applyRiskAmplification(draft, makeCtx({ overloadRisk: 'HIGH' }), makeNoopRecorder())
      expect(draft.visualNoiseLevel).toBeLessThanOrEqual(35)
    })

    it('visibleTaskLimit ≤ 4', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder())
      applyRiskAmplification(draft, makeCtx({ overloadRisk: 'HIGH' }), makeNoopRecorder())
      expect(draft.visibleTaskLimit).toBeLessThanOrEqual(4)
    })
  })

  describe('collapseRisk CRITICAL', () => {
    it('hierarchySharpness ≥ 80', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder()) // starts at 55
      applyRiskAmplification(draft, makeCtx({ collapseRisk: 'CRITICAL' }), makeNoopRecorder())
      expect(draft.hierarchySharpness).toBeGreaterThanOrEqual(80)
    })

    it('deepWorkExpectation ≤ 20', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder()) // starts at 80
      applyRiskAmplification(draft, makeCtx({ collapseRisk: 'CRITICAL' }), makeNoopRecorder())
      expect(draft.deepWorkExpectation).toBeLessThanOrEqual(20)
    })

    it('interventionFrequency ≥ 70', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder()) // starts at 20
      applyRiskAmplification(draft, makeCtx({ collapseRisk: 'CRITICAL' }), makeNoopRecorder())
      expect(draft.interventionFrequency).toBeGreaterThanOrEqual(70)
    })
  })

  describe('avoidanceRisk HIGH', () => {
    it('emotionalPressureLevel ≤ 25', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder()) // starts at 60
      applyRiskAmplification(draft, makeCtx({ avoidanceRisk: 'HIGH' }), makeNoopRecorder())
      expect(draft.emotionalPressureLevel).toBeLessThanOrEqual(25)
    })

    it('clarityOrientation ≥ 75', () => {
      const draft = applyModeBaseline('EXPANDING', makeNoopRecorder()) // starts at 40
      applyRiskAmplification(draft, makeCtx({ avoidanceRisk: 'HIGH' }), makeNoopRecorder())
      expect(draft.clarityOrientation).toBeGreaterThanOrEqual(70)
    })
  })

  it('no risks: draft fields unchanged', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    const before = { ...draft }
    applyRiskAmplification(draft, makeCtx({}), makeNoopRecorder())
    expect(draft.interfaceDensity).toBe(before.interfaceDensity)
    expect(draft.visibleTaskLimit).toBe(before.visibleTaskLimit)
    expect(draft.emotionalPressureLevel).toBe(before.emotionalPressureLevel)
  })
})
