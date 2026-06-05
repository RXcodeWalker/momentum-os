import type { StateConfidence } from '@/core/contracts/state/confidence'
import type { ConfidenceBand } from '@/core/contracts/primitives'
import type { SessionEvidence } from '@/core/contracts/signals/session-evidence'
import type { SignalSnapshot } from '@/core/contracts/signals/signal-snapshot'
import {
  CONFIDENCE_BAND_HIGH_THRESHOLD,
  CONFIDENCE_BAND_MEDIUM_THRESHOLD,
  FULL_CONFIDENCE_DAYS,
} from './config'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function avgCompleteness(evidence: SessionEvidence[]): number {
  if (evidence.length === 0) return 0
  return evidence.reduce((sum, e) => sum + e.completeness, 0) / evidence.length
}

/**
 * Checks how consistently the same signals appear across recent snapshots.
 * 0 = completely inconsistent, 1 = perfectly consistent.
 * No signals at all = 0.75 (absence is weakly consistent).
 */
function signalConsistency(snapshots: SignalSnapshot[]): number {
  if (snapshots.length === 0) return 0.5
  if (snapshots.length === 1) return 0.6

  const recent = [...snapshots]
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
    .slice(0, 3)

  const allSignals = new Set(recent.flatMap(s => s.activeSignals))
  if (allSignals.size === 0) return 0.75

  const signalSets = recent.map(s => new Set(s.activeSignals))
  const consistent = [...allSignals].filter(sig => signalSets.every(set => set.has(sig)))
  return consistent.length / allSignals.size
}

function scoreToBand(score: number): ConfidenceBand {
  if (score >= CONFIDENCE_BAND_HIGH_THRESHOLD) return 'HIGH'
  if (score >= CONFIDENCE_BAND_MEDIUM_THRESHOLD) return 'MEDIUM'
  return 'LOW'
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function computeStateConfidence(
  evidence: SessionEvidence[],
  signalSnapshots: SignalSnapshot[],
): StateConfidence {
  const days               = evidence.length
  const completeness       = avgCompleteness(evidence)
  const consistency        = signalConsistency(signalSnapshots)
  // evidenceCoverage: 0–1, scales linearly to FULL_CONFIDENCE_DAYS
  const evidenceCoverage   = Math.min(1, days / FULL_CONFIDENCE_DAYS) * completeness
  const uncertaintyFactors: string[] = []

  if (days === 0) {
    uncertaintyFactors.push('No evidence available — using behavioral baseline defaults')
  } else if (days < 3) {
    uncertaintyFactors.push(`Only ${days} day(s) of evidence — ${3 - days} more needed for trend analysis`)
  }
  if (completeness < 0.6 && days > 0) {
    uncertaintyFactors.push(`Evidence completeness below 60% (${Math.round(completeness * 100)}%)`)
  }
  if (consistency < 0.5 && signalSnapshots.length > 1) {
    uncertaintyFactors.push('Signal patterns vary significantly across recent observations')
  }
  if (days > 0 && days < FULL_CONFIDENCE_DAYS) {
    uncertaintyFactors.push(`${FULL_CONFIDENCE_DAYS - days} more day(s) needed for full confidence`)
  }

  // Weighted composite: evidence coverage (0.6) + signal consistency (0.4)
  const score = Math.round(100 * (evidenceCoverage * 0.6 + consistency * 0.4))

  return {
    score,
    band: scoreToBand(score),
    evidenceCoverage,
    signalConsistency: consistency,
    uncertaintyFactors,
  }
}
