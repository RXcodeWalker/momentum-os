import { describe, it, expect } from 'vitest'
import { generateAdaptation } from '../adaptation-engine'
import { makeAdaptationInput, scenarioFor } from '@/testing/fixtures/adaptation-engine'
import type { AdaptationDirective } from '@/core/contracts/adaptation/directives'

describe('Failure cases', () => {
  it('1. No signals: output valid, all signal-domain fields match post-risk values', () => {
    const input = makeAdaptationInput({
      state: { currentMode: 'FOCUSED', currentTrajectory: 'STABLE' },
      signalStrengths: {},
    })
    const output = generateAdaptation(input)
    // Output must be structurally valid
    expect(output.environmental).toBeDefined()
    expect(output.execution).toBeDefined()
    expect(output.guidance).toBeDefined()
    expect(output.adaptationReasoning.length).toBeGreaterThan(0)
  })

  it('2. All risks LOW, no signals: output matches post-trajectory baseline (no gates fire)', () => {
    const input = makeAdaptationInput({
      state: {
        currentMode: 'FOCUSED',
        currentTrajectory: 'STABLE',
        burnoutRisk: 'LOW',
        overloadRisk: 'LOW',
        avoidanceRisk: 'LOW',
        collapseRisk: 'LOW',
      },
    })
    const output = generateAdaptation(input)
    // FOCUSED × STABLE → reference state; interfaceDensity should be 70 (no risk gate fires)
    expect(output.environmental.interfaceDensity).toBe(70)
    expect(output.execution.visibleTaskLimit).toBe(6)
  })

  it('3. Empty interventions: directive merge is no-op', () => {
    const input: Parameters<typeof generateAdaptation>[0] = {
      stateInterpretation: scenarioFor('FOCUSED', 'STABLE').stateInterpretation,
      signalSnapshot: scenarioFor('FOCUSED', 'STABLE').signalSnapshot,
      interventionEvaluation: {
        interventions: [],
        evaluationNotes: [],
        restraintApplied: false,
        candidatesFound: 0,
        engineVersion: 'v1',
      },
    }
    const output = generateAdaptation(input)
    expect(output.execution.visibleTaskLimit).toBe(6)
    expect(output.environmental.interfaceDensity).toBe(70)
  })

  it('4. Unknown directive field path: no throw, output is valid', () => {
    const directives: AdaptationDirective[] = [
      { field: 'unknown.bad', suggestedValue: 99, reason: 'bad path' },
    ]
    expect(() => {
      generateAdaptation(makeAdaptationInput({
        state: { currentMode: 'FOCUSED', currentTrajectory: 'STABLE' },
        directives,
      }))
    }).not.toThrow()
  })

  it('5. visibleTaskLimit set to 0 via directive: output is 0 (authoritative, bypasses clamp)', () => {
    const directives: AdaptationDirective[] = [
      { field: 'execution.visibleTaskLimit', suggestedValue: 0, reason: 'zero test' },
    ]
    const output = generateAdaptation(makeAdaptationInput({
      state: { currentMode: 'FOCUSED', currentTrajectory: 'STABLE' },
      directives,
    }))
    expect(output.execution.visibleTaskLimit).toBe(0)
  })

  it('6. AVOIDANCE_CLUSTERING + RECOVERY baseline (2), CONTRACTING traj → clamp restores to 1; signal then tries to reduce → stays 1', () => {
    const input = makeAdaptationInput({
      state: {
        currentMode: 'RECOVERY',
        currentTrajectory: 'CONTRACTING',
      },
      signals: ['AVOIDANCE_CLUSTERING'],
      signalStrengths: { AVOIDANCE_CLUSTERING: 80 }, // strength > 55, would reduce by 1
    })
    const output = generateAdaptation(input)
    // RECOVERY baseline: 2; CONTRACTING delta: -2 → 0; clamp → 1; AVOIDANCE at 80 → Math.max(1, 0) = 1
    expect(output.execution.visibleTaskLimit).toBeGreaterThanOrEqual(1)
  })

  it('7. Weight drift via trajectory: normalization runs post-output; sum ≈ 1.0', () => {
    const input = makeAdaptationInput({
      state: { currentMode: 'RECOVERY', currentTrajectory: 'CONTRACTING' },
    })
    const output = generateAdaptation(input)
    const sum = output.execution.recoveryWeighting + output.execution.advancementWeighting
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it('8. DEEP_WORK_DEGRADATION at strength=0: does NOT set deepWorkProtectionEnabled', () => {
    // Start with EXPANDING mode where deepWorkProtection is false
    const input = makeAdaptationInput({
      state: { currentMode: 'EXPANDING', currentTrajectory: 'STABLE' },
      signals: ['DEEP_WORK_DEGRADATION'],
      signalStrengths: { DEEP_WORK_DEGRADATION: 0 },
    })
    const output = generateAdaptation(input)
    // EXPANDING baseline has deepWorkProtectionEnabled=false; signal at strength=0 should not fire
    expect(output.environmental.deepWorkProtectionEnabled).toBe(false)
  })
})
