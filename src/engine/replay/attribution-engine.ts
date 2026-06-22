import type { BehavioralEvidence } from '@/core/contracts/history/evidence'
import type { ReplayWindowScope } from '@/core/contracts/replay/window'
import type { AttributionFactor, AttributionFactorKind, AttributionDirection, ReplayAttribution } from '@/core/contracts/replay/attribution'
import type { ConfidenceBand } from '@/core/contracts/primitives'
import type { SectionSuppressionMap } from './evidence-gate'
import { guardAllText } from './language-guard'
import type { TrustViolation } from '@/core/contracts/replay/result'

function hedgeFromBand(band: ConfidenceBand): 'TENTATIVE' | 'OBSERVED' | 'CONSISTENT' {
  if (band === 'HIGH') return 'CONSISTENT'
  if (band === 'MEDIUM') return 'OBSERVED'
  return 'TENTATIVE'
}

function buildSleepFactor(evidence: BehavioralEvidence, evidenceDays: number): AttributionFactor | null {
  const snapshot = evidence.snapshots['W7'] ?? evidence.snapshots['W14'] ?? evidence.snapshots['W28']
  if (!snapshot) return null
  const { daysUnderSleepTarget, avgSleepHours } = snapshot.metrics
  const sleepTrend = evidence.trends['sleepHours']
  let direction: AttributionDirection = 'NEUTRAL'
  if (daysUnderSleepTarget > 2 || sleepTrend?.direction === 'DECLINING') direction = 'LIMITING'
  else if (sleepTrend?.direction === 'RISING') direction = 'SUPPORTIVE'
  const scoreDelta = sleepTrend?.currentWindowAvg != null && sleepTrend?.priorWindowAvg != null
    ? (sleepTrend.currentWindowAvg - sleepTrend.priorWindowAvg) * 3
    : null
  const obs = direction === 'LIMITING'
    ? `Sleep tended to precede lower scores on ${daysUnderSleepTarget} days in this window (avg ${avgSleepHours.toFixed(1)}h).`
    : direction === 'SUPPORTIVE'
      ? `Sleep appeared alongside higher scores — avg ${avgSleepHours.toFixed(1)}h this window.`
      : `Sleep was stable at ${avgSleepHours.toFixed(1)}h on average.`
  return {
    kind: 'SLEEP',
    trendMetricKey: 'sleepHours',
    direction,
    observation: obs,
    associationStrength: daysUnderSleepTarget / Math.max(evidenceDays, 1),
    scoreDelta,
    confidence: sleepTrend?.confidence ?? 'LOW',
    evidenceDays,
  }
}

function buildDistractionFactor(evidence: BehavioralEvidence, evidenceDays: number): AttributionFactor | null {
  const snapshot = evidence.snapshots['W7'] ?? evidence.snapshots['W14'] ?? evidence.snapshots['W28']
  if (!snapshot) return null
  const { avgDistractionCount, dominantDistractionType } = snapshot.metrics
  let direction: AttributionDirection = 'NEUTRAL'
  if (avgDistractionCount > 2) direction = 'LIMITING'
  else if (avgDistractionCount <= 1) direction = 'SUPPORTIVE'
  const obs = direction === 'LIMITING'
    ? `Distractions coincided with lower execution days — avg ${avgDistractionCount.toFixed(1)} per day${dominantDistractionType ? `, most common: ${dominantDistractionType}` : ''}.`
    : direction === 'SUPPORTIVE'
      ? `Low distraction count (avg ${avgDistractionCount.toFixed(1)}) appeared alongside stronger execution days.`
      : `Distraction patterns were in a neutral range (avg ${avgDistractionCount.toFixed(1)}).`
  return {
    kind: 'DISTRACTION',
    trendMetricKey: 'distractionCount',
    direction,
    observation: obs,
    associationStrength: Math.min(avgDistractionCount / 5, 1),
    scoreDelta: direction === 'LIMITING' ? -avgDistractionCount * 2 : direction === 'SUPPORTIVE' ? 3 : 0,
    confidence: evidenceDays >= 7 ? 'MEDIUM' : 'LOW',
    evidenceDays,
  }
}

function buildBlockerFactor(evidence: BehavioralEvidence, evidenceDays: number): AttributionFactor | null {
  const snapshot = evidence.snapshots['W7'] ?? evidence.snapshots['W14'] ?? evidence.snapshots['W28']
  if (!snapshot) return null
  const { dominantBlockerType, blockerFrequency } = snapshot.metrics
  const topBlocker = blockerFrequency[0]
  let direction: AttributionDirection = 'NEUTRAL'
  if (dominantBlockerType && topBlocker && topBlocker.count >= 2) direction = 'LIMITING'
  const obs = direction === 'LIMITING'
    ? `A recurring blocker appeared alongside lower-completion days: ${dominantBlockerType}.`
    : `No dominant blocker pattern was observed in this window.`
  return {
    kind: 'BLOCKER',
    trendMetricKey: null,
    direction,
    observation: obs,
    associationStrength: dominantBlockerType ? 0.6 : 0.1,
    scoreDelta: direction === 'LIMITING' ? -5 : null,
    confidence: evidenceDays >= 7 ? 'MEDIUM' : 'LOW',
    evidenceDays,
  }
}

function buildFocusFactor(evidence: BehavioralEvidence, evidenceDays: number): AttributionFactor | null {
  const focusTrend = evidence.trends['focus']
  if (!focusTrend) return null
  let direction: AttributionDirection = 'NEUTRAL'
  if (focusTrend.direction === 'DECLINING') direction = 'LIMITING'
  else if (focusTrend.direction === 'RISING') direction = 'SUPPORTIVE'
  const scoreDelta = focusTrend.currentWindowAvg != null && focusTrend.priorWindowAvg != null
    ? (focusTrend.currentWindowAvg - focusTrend.priorWindowAvg) * 4
    : null
  const obs = direction === 'LIMITING'
    ? `Focus tended to precede lower scores — a declining trend was observed in this window.`
    : direction === 'SUPPORTIVE'
      ? `Focus coincided with stronger execution — trending upward in this window.`
      : `Focus was in a stable range during this period.`
  return {
    kind: 'FOCUS',
    trendMetricKey: 'focus',
    direction,
    observation: obs,
    associationStrength: Math.abs(focusTrend.velocity),
    scoreDelta,
    confidence: focusTrend.confidence,
    evidenceDays,
  }
}

function buildConsistencyFactor(evidence: BehavioralEvidence, evidenceDays: number): AttributionFactor | null {
  const snapshot = evidence.snapshots['W7'] ?? evidence.snapshots['W14'] ?? evidence.snapshots['W28']
  if (!snapshot) return null
  const rate = snapshot.metrics.consistencyRate
  let direction: AttributionDirection = 'NEUTRAL'
  if (rate < 0.5) direction = 'LIMITING'
  else if (rate >= 0.7) direction = 'SUPPORTIVE'
  const pct = Math.round(rate * 100)
  const obs = direction === 'LIMITING'
    ? `Consistency was associated with lower execution — ${pct}% of days met the 60-point threshold.`
    : direction === 'SUPPORTIVE'
      ? `High consistency appeared alongside stronger outcomes — ${pct}% of days above 60.`
      : `Consistency was in a moderate range at ${pct}% of days above 60.`
  return {
    kind: 'CONSISTENCY',
    trendMetricKey: 'consistency',
    direction,
    observation: obs,
    associationStrength: Math.abs(rate - 0.6),
    scoreDelta: direction === 'LIMITING' ? -8 : direction === 'SUPPORTIVE' ? 5 : 0,
    confidence: evidenceDays >= 7 ? 'MEDIUM' : 'LOW',
    evidenceDays,
  }
}

function buildRecoveryFactor(evidence: BehavioralEvidence, evidenceDays: number): AttributionFactor | null {
  const snapshot = evidence.snapshots['W7'] ?? evidence.snapshots['W14'] ?? evidence.snapshots['W28']
  if (!snapshot) return null
  const { recoveryDayCount } = snapshot.metrics
  let direction: AttributionDirection = 'NEUTRAL'
  if (recoveryDayCount === 0) direction = 'LIMITING'
  else if (recoveryDayCount >= 2) direction = 'SUPPORTIVE'
  const obs = direction === 'LIMITING'
    ? `No recovery days were logged — patterns where rest is absent tended to precede lower resilience.`
    : direction === 'SUPPORTIVE'
      ? `${recoveryDayCount} recovery day${recoveryDayCount > 1 ? 's' : ''} appeared alongside more stable scores.`
      : `Recovery days were present but infrequent in this window.`
  return {
    kind: 'RECOVERY_DAYS',
    trendMetricKey: null,
    direction,
    observation: obs,
    associationStrength: Math.min(recoveryDayCount / 3, 1),
    scoreDelta: direction === 'SUPPORTING' ? 4 : direction === 'LIMITING' ? -3 : 0,
    confidence: evidenceDays >= 7 ? 'MEDIUM' : 'LOW',
    evidenceDays,
  }
}

export function buildAttribution(
  evidence: BehavioralEvidence,
  scope: ReplayWindowScope,
  suppressionMap: SectionSuppressionMap,
  existingViolations: TrustViolation[],
): { attribution: ReplayAttribution; violations: TrustViolation[] } {
  const gate = suppressionMap.attribution
  if (gate.suppressed) {
    return {
      attribution: {
        factors: [],
        primaryFactor: null,
        sectionHedge: 'TENTATIVE',
        confidence: 'LOW',
        suppressed: true,
        suppressionReason: gate.reason,
      },
      violations: [],
    }
  }

  const snapshotKey = scope === 'W7' ? 'W7' : scope === 'W14' ? 'W14' : 'W28'
  const snapshot = evidence.snapshots[snapshotKey]
  const evidenceDays = snapshot?.evidenceDays ?? 0

  const rawFactors: (AttributionFactor | null)[] = [
    buildSleepFactor(evidence, evidenceDays),
    buildDistractionFactor(evidence, evidenceDays),
    buildBlockerFactor(evidence, evidenceDays),
    buildFocusFactor(evidence, evidenceDays),
    buildConsistencyFactor(evidence, evidenceDays),
    buildRecoveryFactor(evidence, evidenceDays),
  ]
  const factors = rawFactors.filter((f): f is AttributionFactor => f !== null && f.evidenceDays >= 3)

  // Guard all observation text
  const guarded = guardAllText(factors.map((f) => ({ text: f.observation, section: 'attribution' as const })))
  const guardedFactors = factors.map((f, i) => ({ ...f, observation: guarded.results[i].text }))

  const primaryFactor = guardedFactors.reduce<AttributionFactor | null>((best, f) => {
    if (f.evidenceDays < 3) return best
    if (!best) return f
    const bestDelta = Math.abs(best.scoreDelta ?? 0)
    const thisDelta = Math.abs(f.scoreDelta ?? 0)
    return thisDelta > bestDelta ? f : best
  }, null)

  const confidence = evidence.summary.confidence.band
  const violations = [...existingViolations, ...guarded.violations]

  return {
    attribution: {
      factors: guardedFactors,
      primaryFactor,
      sectionHedge: hedgeFromBand(confidence),
      confidence,
      suppressed: false,
      suppressionReason: null,
    },
    violations,
  }
}
