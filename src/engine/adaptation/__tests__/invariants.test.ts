import { describe, it, expect } from 'vitest'
import { generateAdaptation } from '../adaptation-engine'
import { generateRandomInput } from '@/testing/fixtures/adaptation-engine'

const PACING_VALUES = new Set(['REDUCE_LOAD', 'MAINTAIN_RHYTHM', 'PROTECT_CONTINUITY', 'INCREASE_CHALLENGE', 'COMPRESS_SCOPE'])
const TONE_VALUES = new Set(['CALM', 'STEADY', 'FOCUSED', 'CHALLENGING', 'STABILIZING', 'OBSERVATIONAL'])
const MODE_VALUES = new Set(['RECOVERY', 'STABILIZING', 'FOCUSED', 'EXPANDING'])

const SEEDS = Array.from({ length: 50 }, (_, i) => i)

const RANDOM_OUTPUTS = SEEDS.map(seed => {
  const input = generateRandomInput(seed)
  return { seed, input, output: generateAdaptation(input) }
})

describe('Invariant tests: 50 random inputs', () => {
  it.each(SEEDS)('seed %i: all environmental numeric scalars in [0, 100]', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    const env = output.environmental
    expect(env.interfaceDensity).toBeGreaterThanOrEqual(0)
    expect(env.interfaceDensity).toBeLessThanOrEqual(100)
    expect(env.spacingIntensity).toBeGreaterThanOrEqual(0)
    expect(env.spacingIntensity).toBeLessThanOrEqual(100)
    expect(env.visualNoiseLevel).toBeGreaterThanOrEqual(0)
    expect(env.visualNoiseLevel).toBeLessThanOrEqual(100)
    expect(env.motionIntensity).toBeGreaterThanOrEqual(0)
    expect(env.motionIntensity).toBeLessThanOrEqual(100)
    expect(env.pacingFeel).toBeGreaterThanOrEqual(0)
    expect(env.pacingFeel).toBeLessThanOrEqual(100)
    expect(env.hierarchySharpness).toBeGreaterThanOrEqual(0)
    expect(env.hierarchySharpness).toBeLessThanOrEqual(100)
    expect(env.contrastStrength).toBeGreaterThanOrEqual(0)
    expect(env.contrastStrength).toBeLessThanOrEqual(100)
    expect(env.visibleComplexity).toBeGreaterThanOrEqual(0)
    expect(env.visibleComplexity).toBeLessThanOrEqual(100)
    expect(env.dashboardCompressionLevel).toBeGreaterThanOrEqual(0)
    expect(env.dashboardCompressionLevel).toBeLessThanOrEqual(100)
  })

  it.each(SEEDS)('seed %i: deepWorkProtectionEnabled is boolean', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(typeof output.environmental.deepWorkProtectionEnabled).toBe('boolean')
  })

  it.each(SEEDS)('seed %i: visibleTaskLimit ≥ 1 and is integer', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(output.execution.visibleTaskLimit).toBeGreaterThanOrEqual(1)
    expect(Number.isInteger(output.execution.visibleTaskLimit)).toBe(true)
  })

  it.each(SEEDS)('seed %i: recommendedChallengeLevel in [0, 100]', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(output.execution.recommendedChallengeLevel).toBeGreaterThanOrEqual(0)
    expect(output.execution.recommendedChallengeLevel).toBeLessThanOrEqual(100)
  })

  it.each(SEEDS)('seed %i: workloadCompressionRatio in [0, 1]', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(output.execution.workloadCompressionRatio).toBeGreaterThanOrEqual(0)
    expect(output.execution.workloadCompressionRatio).toBeLessThanOrEqual(1)
  })

  it.each(SEEDS)('seed %i: deepWorkExpectation in [0, 100]', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(output.execution.deepWorkExpectation).toBeGreaterThanOrEqual(0)
    expect(output.execution.deepWorkExpectation).toBeLessThanOrEqual(100)
  })

  it.each(SEEDS)('seed %i: recoveryWeighting in [0, 1]', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(output.execution.recoveryWeighting).toBeGreaterThanOrEqual(0)
    expect(output.execution.recoveryWeighting).toBeLessThanOrEqual(1)
  })

  it.each(SEEDS)('seed %i: advancementWeighting in [0, 1]', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(output.execution.advancementWeighting).toBeGreaterThanOrEqual(0)
    expect(output.execution.advancementWeighting).toBeLessThanOrEqual(1)
  })

  it.each(SEEDS)('seed %i: focusProtectionStrength in [0, 100]', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(output.execution.focusProtectionStrength).toBeGreaterThanOrEqual(0)
    expect(output.execution.focusProtectionStrength).toBeLessThanOrEqual(100)
  })

  it.each(SEEDS)('seed %i: weight normalization |recoveryWeighting + advancementWeighting - 1.0| ≤ 0.001', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    const sum = output.execution.recoveryWeighting + output.execution.advancementWeighting
    expect(Math.abs(sum - 1.0)).toBeLessThanOrEqual(0.001)
  })

  it.each(SEEDS)('seed %i: pacingRecommendation is valid enum value', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(PACING_VALUES.has(output.execution.pacingRecommendation)).toBe(true)
  })

  it.each(SEEDS)('seed %i: all guidance scalars in [0, 100]', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    const g = output.guidance
    expect(g.interventionFrequency).toBeGreaterThanOrEqual(0)
    expect(g.interventionFrequency).toBeLessThanOrEqual(100)
    expect(g.reflectionDepth).toBeGreaterThanOrEqual(0)
    expect(g.reflectionDepth).toBeLessThanOrEqual(100)
    expect(g.strategicGuidanceWeight).toBeGreaterThanOrEqual(0)
    expect(g.strategicGuidanceWeight).toBeLessThanOrEqual(100)
    expect(g.emotionalPressureLevel).toBeGreaterThanOrEqual(0)
    expect(g.emotionalPressureLevel).toBeLessThanOrEqual(100)
    expect(g.clarityOrientation).toBeGreaterThanOrEqual(0)
    expect(g.clarityOrientation).toBeLessThanOrEqual(100)
  })

  it.each(SEEDS)('seed %i: messagingTone is valid enum value', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(TONE_VALUES.has(output.guidance.messagingTone)).toBe(true)
  })

  it.each(SEEDS)('seed %i: adaptationIntensity in [0, 100]', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(output.adaptationIntensity).toBeGreaterThanOrEqual(0)
    expect(output.adaptationIntensity).toBeLessThanOrEqual(100)
  })

  it.each(SEEDS)('seed %i: adaptationReasoning.length > 0', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(output.adaptationReasoning.length).toBeGreaterThan(0)
  })

  it.each(SEEDS)('seed %i: generatedAt is valid ISO-8601', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(() => new Date(output.generatedAt)).not.toThrow()
    expect(isNaN(new Date(output.generatedAt).getTime())).toBe(false)
    expect(output.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it.each(SEEDS)('seed %i: stateMode is valid UserMode', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(MODE_VALUES.has(output.stateMode)).toBe(true)
  })

  it.each(SEEDS)('seed %i: stateConfidence is defined with required fields', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(output.stateConfidence).toBeDefined()
    expect(output.stateConfidence.score).toBeDefined()
    expect(output.stateConfidence.band).toBeDefined()
  })

  it.each(SEEDS)('seed %i: adaptationTrace is defined', (seed) => {
    const { output } = RANDOM_OUTPUTS[seed]
    expect(output.adaptationTrace).toBeDefined()
  })

  // Risk gate behavioral invariants
  it.each(SEEDS)('seed %i: burnoutRisk CRITICAL → interfaceDensity ≤ 40', (seed) => {
    const { input, output } = RANDOM_OUTPUTS[seed]
    if (input.stateInterpretation.burnoutRisk === 'CRITICAL') {
      expect(output.environmental.interfaceDensity).toBeLessThanOrEqual(40)
    }
  })

  it.each(SEEDS)('seed %i: burnoutRisk CRITICAL → visibleTaskLimit ≤ 3', (seed) => {
    const { input, output } = RANDOM_OUTPUTS[seed]
    if (input.stateInterpretation.burnoutRisk === 'CRITICAL') {
      expect(output.execution.visibleTaskLimit).toBeLessThanOrEqual(3)
    }
  })

  it.each(SEEDS)('seed %i: avoidanceRisk HIGH → emotionalPressureLevel ≤ 25', (seed) => {
    const { input, output } = RANDOM_OUTPUTS[seed]
    const risk = input.stateInterpretation.avoidanceRisk
    if (risk === 'HIGH' || risk === 'CRITICAL') {
      expect(output.guidance.emotionalPressureLevel).toBeLessThanOrEqual(25)
    }
  })

  it.each(SEEDS)('seed %i: collapseRisk CRITICAL → interventionFrequency ≥ 70', (seed) => {
    const { input, output } = RANDOM_OUTPUTS[seed]
    if (input.stateInterpretation.collapseRisk === 'CRITICAL') {
      expect(output.guidance.interventionFrequency).toBeGreaterThanOrEqual(70)
    }
  })

  it.each(SEEDS)('seed %i: DEEP_WORK_DEGRADATION strength > 0 → deepWorkProtectionEnabled = true', (seed) => {
    const { input, output } = RANDOM_OUTPUTS[seed]
    const strength = input.signalSnapshot.signalStrengths['DEEP_WORK_DEGRADATION']
    if (strength !== undefined && strength > 0) {
      expect(output.environmental.deepWorkProtectionEnabled).toBe(true)
    }
  })

  it.each(SEEDS)('seed %i: determinism — same seed produces same output', (seed) => {
    const input = generateRandomInput(seed)
    const out1 = generateAdaptation(input)
    const out2 = generateAdaptation(input)
    expect(out1.environmental.interfaceDensity).toBe(out2.environmental.interfaceDensity)
    expect(out1.execution.visibleTaskLimit).toBe(out2.execution.visibleTaskLimit)
    expect(out1.execution.pacingRecommendation).toBe(out2.execution.pacingRecommendation)
    expect(out1.guidance.messagingTone).toBe(out2.guidance.messagingTone)
    expect(out1.adaptationIntensity).toBe(out2.adaptationIntensity)
  })
})
