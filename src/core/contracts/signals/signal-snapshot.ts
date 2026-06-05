// Fix-1: Now imports BehavioralSignal from signals/ (same domain), not from interventions/.
// Eliminates the backward cross-domain dependency that caused signals/ → interventions/.

import type { Timestamp, Scalar, ConfidenceBand } from '../primitives'
import type { BehavioralSignal } from './behavioral-signals'

/** Point-in-time signal detection — bridges evidence to intervention triggers. */
export type SignalSnapshot = {
  capturedAt: Timestamp
  activeSignals: BehavioralSignal[]
  /** Per-signal strength 0–100 where detected. */
  signalStrengths: Partial<Record<BehavioralSignal, Scalar>>
  confidence: ConfidenceBand
  /** Days each active signal has been sustained. */
  signalDurations: Partial<Record<BehavioralSignal, number>>
}

