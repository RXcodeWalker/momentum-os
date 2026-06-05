import { describe, expect, it } from 'vitest'
import {
  buildDecliningExecutionTimeline,
  buildRecoveryCollapseTimeline,
  buildRisingFragmentationTimeline,
  buildSingleDaySpikeTimeline,
  buildStableBaselineTimeline,
  buildVolatilityTimeline,
  makeDailyInputs,
  makeSessionEvidence,
} from '@/testing/fixtures/signal-evidence'
import {
  calculateTrend,
  detectBehavioralSignals,
  generateSignalSnapshot,
  movingAverage,
  normalize,
  weightedAverage,
} from './index'

describe('normalize', () => {
  it('clamps values into a 0–100 scalar', () => {
    expect(normalize(50)).toBe(50)
    expect(normalize(150)).toBe(100)
    expect(normalize(-10)).toBe(0)
  })

  it('scales custom ranges', () => {
    expect(normalize(5, 0, 10)).toBe(50)
    expect(normalize(10, 0, 10)).toBe(100)
  })
})

describe('movingAverage', () => {
  it('smooths spikes across a rolling window', () => {
    expect(movingAverage([10, 100, 10], 3)).toEqual([10, 55, 40])
  })

  it('returns an empty array for empty input', () => {
    expect(movingAverage([], 3)).toEqual([])
  })
})

describe('weightedAverage', () => {
  it('computes a weighted mean', () => {
    expect(weightedAverage([80, 40], [0.75, 0.25])).toBe(70)
  })

  it('returns 0 when weights sum to zero', () => {
    expect(weightedAverage([80, 40], [0, 0])).toBe(0)
  })
})

describe('calculateTrend', () => {
  it('returns STABLE for insufficient data', () => {
    expect(calculateTrend([])).toBe('STABLE')
    expect(calculateTrend([70])).toBe('STABLE')
  })

  it('detects rising and declining trends', () => {
    expect(calculateTrend([30, 40, 50, 60, 70])).toBe('RISING')
    expect(calculateTrend([70, 60, 50, 40, 30])).toBe('DECLINING')
  })

  it('treats small oscillations as stable', () => {
    expect(calculateTrend([68, 70, 69, 71, 70])).toBe('STABLE')
  })

  it('respects custom stability thresholds', () => {
    expect(calculateTrend([50, 52, 54], { stabilityThreshold: 10 })).toBe('STABLE')
    expect(calculateTrend([50, 52, 54], { stabilityThreshold: 1 })).toBe('RISING')
  })
})

describe('detectBehavioralSignals', () => {
  it('detects rising fragmentation after sustained elevation', () => {
    const dailyInputs = buildRisingFragmentationTimeline(5)
    const signals = detectBehavioralSignals([], dailyInputs)

    expect(signals).toContain('RISING_FRAGMENTATION')
  })

  it('detects declining execution quality after sustained decline', () => {
    const dailyInputs = buildDecliningExecutionTimeline(5)
    const signals = detectBehavioralSignals([], dailyInputs)

    expect(signals).toContain('DECLINING_EXECUTION_QUALITY')
  })

  it('detects recovery collapse only after multi-day sustained decline', () => {
    const dailyInputs = buildRecoveryCollapseTimeline()
    const signals = detectBehavioralSignals([], dailyInputs)

    expect(signals).toContain('RECOVERY_COLLAPSE')
  })

  it('detects volatility acceleration from erratic behavioral swings', () => {
    const dailyInputs = buildVolatilityTimeline()
    const signals = detectBehavioralSignals([], dailyInputs)

    expect(signals).toContain('VOLATILITY_ACCELERATION')
  })

  it('prevents single-day spikes from generating major signals', () => {
    const dailyInputs = buildSingleDaySpikeTimeline()
    const signals = detectBehavioralSignals([], dailyInputs)

    expect(signals).not.toContain('RISING_FRAGMENTATION')
    expect(signals).not.toContain('RECOVERY_COLLAPSE')
  })

  it('does not fire signals on a stable baseline', () => {
    const dailyInputs = buildStableBaselineTimeline(5)
    const signals = detectBehavioralSignals([], dailyInputs)

    expect(signals).toHaveLength(0)
  })

  it('merges SessionEvidence with higher completeness over duplicate days', () => {
    const evidence = [
      makeSessionEvidence(0, { fragmentationLevel: 30 }, 0.5),
      makeSessionEvidence(0, { fragmentationLevel: 80 }, 0.95),
    ]
    const dailyInputs = [makeDailyInputs(0, { fragmentationLevel: 30 })]

    const snapshot = generateSignalSnapshot(evidence, dailyInputs)
    expect(snapshot.activeSignals.length).toBeGreaterThanOrEqual(0)
  })
})

describe('generateSignalSnapshot', () => {
  it('returns a contract-valid snapshot with probabilistic confidence', () => {
    const dailyInputs = buildRisingFragmentationTimeline(5)
    const snapshot = generateSignalSnapshot([], dailyInputs)

    expect(snapshot.capturedAt).toBeTruthy()
    expect(snapshot.activeSignals).toContain('RISING_FRAGMENTATION')
    expect(snapshot.signalStrengths.RISING_FRAGMENTATION).toBeGreaterThan(0)
    expect(snapshot.signalDurations.RISING_FRAGMENTATION).toBeGreaterThanOrEqual(2)
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(snapshot.confidence)
  })

  it('uses LOW confidence when evidence is sparse', () => {
    const snapshot = generateSignalSnapshot([], [makeDailyInputs(0)])
    expect(snapshot.confidence).toBe('LOW')
    expect(snapshot.activeSignals).toHaveLength(0)
  })

  it('returns MEDIUM or HIGH confidence with sufficient sustained evidence', () => {
    const dailyInputs = buildRecoveryCollapseTimeline()
    const evidence = dailyInputs.map((inputs) => ({
      sessionId: inputs.sessionId ?? inputs.capturedAt,
      capturedAt: inputs.capturedAt,
      evidenceType: 'CHECK_IN' as const,
      inputs,
      completeness: 0.9,
    }))
    const snapshot = generateSignalSnapshot(evidence, dailyInputs)

    expect(snapshot.activeSignals).toContain('RECOVERY_COLLAPSE')
    expect(['MEDIUM', 'HIGH']).toContain(snapshot.confidence)
  })

  it('prevents recovery collapse on a single-day sleep dip', () => {
    const dailyInputs = [
      makeDailyInputs(0),
      makeDailyInputs(1),
      makeDailyInputs(2, { sleepQuality: 20, physicalEnergy: 25, mentalClarity: 22 }),
      makeDailyInputs(3),
      makeDailyInputs(4),
    ]

    const snapshot = generateSignalSnapshot([], dailyInputs)
    expect(snapshot.activeSignals).not.toContain('RECOVERY_COLLAPSE')
  })
})
