import type { UserState } from '@/core/contracts/state/user-state'
import type { UserMode } from '@/core/contracts/state/modes'
import type { StateExplanation, StateExplanationResult } from '@/core/contracts/state/explanation'
import type { ConfidenceBand } from '@/core/contracts/primitives'
import {
  MODE_OBSERVATIONS,
  MODE_RATIONALE,
  TRAJECTORY_OBSERVATIONS,
  TRAJECTORY_RATIONALE,
  SPARSE_EVIDENCE_OBSERVATION,
  TRANSITION_OBSERVATION,
  observationContainsFormulaLeak,
} from './explanation-templates'

// ---------------------------------------------------------------------------
// Confidence helpers
// ---------------------------------------------------------------------------

const MINIMUM_CONFIDENCE_SCORE_FOR_OBSERVATION = 30

function confidenceBandFromState(state: UserState): ConfidenceBand {
  return state.confidence.band
}

// ---------------------------------------------------------------------------
// Primary observation selection
// ---------------------------------------------------------------------------

/**
 * Priority order:
 * 1. RECOVERY mode always surfaces as primary — it requires immediate attention
 * 2. CONTRACTING trajectory overrides EXPANDING/FOCUSED mode — declining trajectory
 *    is more actionable than a current-state label when the two conflict
 * 3. LOW confidence → sparse evidence observation (avoid misleading low-signal claims)
 * 4. EXPANDING mode surfaces expansion opportunity
 * 5. Default → mode-based primary observation
 */
function selectPrimary(state: UserState): StateExplanation {
  const conf = confidenceBandFromState(state)

  if (state.currentMode === 'RECOVERY') {
    return MODE_OBSERVATIONS.RECOVERY(conf)
  }

  if (state.currentTrajectory === 'CONTRACTING' && conf !== 'LOW') {
    return TRAJECTORY_OBSERVATIONS.CONTRACTING(conf)
  }

  if (conf === 'LOW' || state.confidence.score < MINIMUM_CONFIDENCE_SCORE_FOR_OBSERVATION) {
    return SPARSE_EVIDENCE_OBSERVATION
  }

  if (state.currentMode === 'EXPANDING') {
    return MODE_OBSERVATIONS.EXPANDING(conf)
  }

  return MODE_OBSERVATIONS[state.currentMode](conf)
}

// ---------------------------------------------------------------------------
// Supporting observations (max 2)
// ---------------------------------------------------------------------------

function buildSupporting(
  state: UserState,
  primary: StateExplanation,
): StateExplanation[] {
  const conf = confidenceBandFromState(state)

  // Never emit supporting observations under LOW confidence
  if (conf === 'LOW' || state.confidence.score < MINIMUM_CONFIDENCE_SCORE_FOR_OBSERVATION) {
    return []
  }

  const supporting: StateExplanation[] = []

  // Add trajectory observation if it carries different information from the primary
  const trajectoryObs = TRAJECTORY_OBSERVATIONS[state.currentTrajectory](conf)
  if (trajectoryObs.code !== primary.code) {
    supporting.push(trajectoryObs)
  }

  // Add a notable dimension observation if we haven't filled the max already
  if (supporting.length < 2) {
    const notable = selectNotableDimensionObservation(state, conf)
    if (notable && notable.code !== primary.code) {
      supporting.push(notable)
    }
  }

  return supporting.slice(0, 2)
}

/**
 * Identifies the single most notable dimension — either the highest-risk
 * variable or the strongest positive signal — and returns an observation for it.
 * Returns null if no dimension is notably out of healthy range.
 */
function selectNotableDimensionObservation(
  state: UserState,
  conf: ConfidenceBand,
): StateExplanation | null {
  // Check for elevated cognitive load as a supporting signal
  if (state.cognitiveStrain > 70 && state.currentMode !== 'RECOVERY') {
    return {
      code: 'COGNITIVE_LOAD_ACCUMULATING',
      observation:
        'Cognitive load patterns appear elevated based on recent fragmentation and interruption signals. Protecting focus windows may be helpful.',
      confidence: conf,
    }
  }

  // High emotional friction as a supporting signal
  if (state.emotionalFriction > 65 && state.currentMode !== 'RECOVERY') {
    return {
      code: 'EXECUTION_RHYTHM_BUILDING',
      observation:
        'Recent patterns suggest some initiation resistance. Starting with smaller, concrete tasks may help rebuild momentum.',
      confidence: conf,
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generates a `StateExplanationResult` from a fully-computed `UserState`.
 * Call this after `evaluate()` returns — pass the state directly.
 *
 * An optional `transitionFrom` arg generates a TRANSITION_DETECTED supporting
 * observation when a mode change occurred this pipeline run.
 */
export function buildStateExplanation(
  state: UserState,
  transitionFrom?: UserMode,
): StateExplanationResult {
  const primary   = selectPrimary(state)
  const conf      = confidenceBandFromState(state)

  const rawSupporting = buildSupporting(state, primary)

  // Inject a transition observation when a mode change occurred
  const supporting: StateExplanation[] = transitionFrom
    ? [TRANSITION_OBSERVATION(transitionFrom, state.currentMode), ...rawSupporting].slice(0, 2)
    : rawSupporting

  const result: StateExplanationResult = {
    primary,
    supporting,
    modeRationale:       MODE_RATIONALE[state.currentMode],
    trajectoryRationale: TRAJECTORY_RATIONALE[state.currentTrajectory],
    generatedAt:         state.lastUpdatedAt,
  }

  // Development-time invariant check — throws in test environments only
  if (import.meta.env?.DEV) {
    const allObs = [primary, ...supporting]
    for (const o of allObs) {
      if (observationContainsFormulaLeak(o.observation)) {
        console.error(
          `[StateExplanation] Formula leak detected in observation (code=${o.code}):`,
          o.observation,
        )
      }
    }
  }

  return result
}
