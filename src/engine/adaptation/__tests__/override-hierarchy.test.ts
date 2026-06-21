import { describe, it, expect } from 'vitest'
import { generateAdaptation } from '../adaptation-engine'
import { makeAdaptationInput } from '@/testing/fixtures/adaptation-engine'
import type { AdaptationDirective } from '@/core/contracts/adaptation/directives'

describe('Override hierarchy: baseline → trajectory', () => {
  it('FOCUSED baseline interfaceDensity=70; CONTRACTING delta → 60; trace shows trajectory as last writer', () => {
    const input = makeAdaptationInput({
      state: { currentMode: 'FOCUSED', currentTrajectory: 'CONTRACTING' },
    })
    const output = generateAdaptation(input)
    expect(output.environmental.interfaceDensity).toBe(60)

    const trace = output.adaptationTrace!
    const densityEntries = trace.entries.filter(e => e.field.includes('interfaceDensity'))
    const lastEntry = densityEntries[densityEntries.length - 1]
    expect(lastEntry.layer).toBe('trajectory')
  })
})

describe('Override hierarchy: trajectory → risk', () => {
  it('CONTRACTING reduces density to 60; burnoutRisk CRITICAL gate → 40; trace shows risk as last writer', () => {
    const input = makeAdaptationInput({
      state: {
        currentMode: 'FOCUSED',
        currentTrajectory: 'CONTRACTING',
        burnoutRisk: 'CRITICAL',
      },
    })
    const output = generateAdaptation(input)
    expect(output.environmental.interfaceDensity).toBeLessThanOrEqual(40)

    const trace = output.adaptationTrace!
    const densityEntries = trace.entries.filter(e => e.field.includes('interfaceDensity'))
    const lastEntry = densityEntries[densityEntries.length - 1]
    expect(lastEntry.layer).toBe('risk')
  })
})

describe('Override hierarchy: risk → signal (within signal domain)', () => {
  it('overloadRisk HIGH caps visualNoiseLevel; RISING_FRAGMENTATION at 90 pushes below; signal is last writer', () => {
    const input = makeAdaptationInput({
      state: {
        currentMode: 'EXPANDING',
        currentTrajectory: 'STABLE',
        overloadRisk: 'HIGH',
      },
      signals: ['RISING_FRAGMENTATION'],
      signalStrengths: { RISING_FRAGMENTATION: 90 },
    })
    const output = generateAdaptation(input)
    // Risk gate sets ≤ 35; signal subtracts further
    expect(output.environmental.visualNoiseLevel).toBeLessThan(35)

    const trace = output.adaptationTrace!
    const noiseEntries = trace.entries.filter(e => e.field.includes('visualNoiseLevel'))
    expect(noiseEntries.length).toBeGreaterThan(0)
    const lastEntry = noiseEntries[noiseEntries.length - 1]
    expect(lastEntry.layer).toBe('signal')
  })
})

describe('Override hierarchy: signal → directive (authoritative override)', () => {
  it('directive sets visibleTaskLimit=10 after all passes; trace shows directive as last writer; output=10', () => {
    const directives: AdaptationDirective[] = [
      { field: 'execution.visibleTaskLimit', suggestedValue: 10, reason: 'override test' },
    ]
    const input = makeAdaptationInput({
      state: {
        currentMode: 'FOCUSED',
        currentTrajectory: 'STABLE',
        overloadRisk: 'HIGH', // would set ceil(4)
      },
      signals: ['AVOIDANCE_CLUSTERING'],
      signalStrengths: { AVOIDANCE_CLUSTERING: 80 }, // would reduce by 1
      directives,
    })
    const output = generateAdaptation(input)
    expect(output.execution.visibleTaskLimit).toBe(10)

    const trace = output.adaptationTrace!
    const taskEntries = trace.entries.filter(e => e.field.includes('visibleTaskLimit'))
    const lastEntry = taskEntries[taskEntries.length - 1]
    expect(lastEntry.layer).toBe('directive')
    expect(lastEntry.newValue).toBe(10)
  })
})

describe('Override hierarchy: trace layer summary counts', () => {
  it('a run with all 5 layers firing shows non-zero counts for all 5 in layerSummary', () => {
    const directives: AdaptationDirective[] = [
      { field: 'execution.visibleTaskLimit', suggestedValue: 10, reason: 'override' },
    ]
    // CONTRACTING trajectory (trajectory layer will fire)
    // burnoutRisk CRITICAL (risk layer will fire)
    // AVOIDANCE_CLUSTERING (signal layer will fire)
    // baseline always fires
    // directive fires
    const input = makeAdaptationInput({
      state: {
        currentMode: 'FOCUSED',
        currentTrajectory: 'CONTRACTING',
        burnoutRisk: 'CRITICAL',
      },
      signals: ['AVOIDANCE_CLUSTERING'],
      signalStrengths: { AVOIDANCE_CLUSTERING: 80 },
      directives,
    })
    const output = generateAdaptation(input)
    const trace = output.adaptationTrace!
    expect(trace.layerSummary.baseline).toBeGreaterThan(0)
    expect(trace.layerSummary.trajectory).toBeGreaterThan(0)
    expect(trace.layerSummary.risk).toBeGreaterThan(0)
    expect(trace.layerSummary.signal).toBeGreaterThan(0)
    expect(trace.layerSummary.directive).toBeGreaterThan(0)
  })
})
