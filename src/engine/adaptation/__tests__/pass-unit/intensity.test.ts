import { describe, it, expect } from 'vitest'
import { applyModeBaseline } from '../../baseline/mode-baseline'
import { computeAdaptationIntensity } from '../../output/compute-intensity'
import { generateAdaptation } from '../../adaptation-engine'
import { scenarioFor } from '@/testing/fixtures/adaptation-engine'

function makeNoopRecorder() {
  return { record: () => {}, flush: () => undefined }
}

describe('computeAdaptationIntensity', () => {
  it('FOCUSED mode draft produces adaptationIntensity=0 exactly', () => {
    const draft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    const intensity = computeAdaptationIntensity(draft)
    expect(intensity).toBe(0)
  })

  it('RECOVERY mode draft produces adaptationIntensity ≥ 50', () => {
    const draft = applyModeBaseline('RECOVERY', makeNoopRecorder())
    const intensity = computeAdaptationIntensity(draft)
    expect(intensity).toBeGreaterThanOrEqual(50)
  })

  it('result clamped to [0, 100]', () => {
    const draft = applyModeBaseline('RECOVERY', makeNoopRecorder())
    const intensity = computeAdaptationIntensity(draft)
    expect(intensity).toBeGreaterThanOrEqual(0)
    expect(intensity).toBeLessThanOrEqual(100)
  })

  it('EXPANDING mode draft intensity > FOCUSED (deviation in opposite direction)', () => {
    const focusedDraft = applyModeBaseline('FOCUSED', makeNoopRecorder())
    const expandingDraft = applyModeBaseline('EXPANDING', makeNoopRecorder())
    const focusedIntensity = computeAdaptationIntensity(focusedDraft)
    const expandingIntensity = computeAdaptationIntensity(expandingDraft)
    expect(expandingIntensity).toBeGreaterThan(focusedIntensity)
  })
})

describe('adaptationIntensity via generateAdaptation', () => {
  it('FOCUSED × STABLE (no risks, no signals) → adaptationIntensity=0 exactly', () => {
    const input = scenarioFor('FOCUSED', 'STABLE')
    const output = generateAdaptation(input)
    expect(output.adaptationIntensity).toBe(0)
  })

  it('RECOVERY × STABLE → adaptationIntensity ≥ 50', () => {
    const input = scenarioFor('RECOVERY', 'STABLE')
    const output = generateAdaptation(input)
    expect(output.adaptationIntensity).toBeGreaterThanOrEqual(50)
  })

  it('adaptationIntensity always in [0, 100]', () => {
    for (const mode of ['RECOVERY', 'STABILIZING', 'FOCUSED', 'EXPANDING'] as const) {
      for (const traj of ['CONTRACTING', 'FRAGILE', 'STABLE', 'EXPANDING'] as const) {
        const output = generateAdaptation(scenarioFor(mode, traj))
        expect(output.adaptationIntensity).toBeGreaterThanOrEqual(0)
        expect(output.adaptationIntensity).toBeLessThanOrEqual(100)
      }
    }
  })
})
