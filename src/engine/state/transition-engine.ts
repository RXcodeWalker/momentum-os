import type { StateTransition } from '@/core/contracts/state/transitions'
import type { UserMode } from '@/core/contracts/state/modes'
import type { SignalSnapshot } from '@/core/contracts/signals/signal-snapshot'
import type { DimensionResult } from './state-dimensions'
import type { ModeClassification } from './mode-classifier'

/**
 * Emits a `StateTransition` only when `currentMode` differs from `previousMode`.
 * All transitions are marked reversible — modes are operational conditions,
 * not identity labels.  No shame or punishment signals are produced here.
 */
export function detectTransition(
  previousMode: UserMode | undefined,
  classification: ModeClassification,
  dimensions: DimensionResult,
  snapshot: SignalSnapshot | undefined,
  occurredAt: string,
): StateTransition | undefined {
  if (!previousMode || previousMode === classification.mode) return undefined

  const sustainedDays = resolveMinSustainedDays(classification, snapshot)

  return {
    from:                      previousMode,
    to:                        classification.mode,
    confidence:                resolveTransitionConfidence(dimensions, classification, sustainedDays),
    supportingFactors:         classification.supportingFactors,
    sustainedSignalDurationDays: sustainedDays,
    reversible:                true,
    occurredAt,
  }
}

function resolveMinSustainedDays(
  classification: ModeClassification,
  snapshot: SignalSnapshot | undefined,
): number {
  if (!snapshot) return 1

  const durations = Object.values(snapshot.signalDurations ?? {}).filter(
    (d): d is number => typeof d === 'number',
  )
  if (durations.length === 0) return 1
  return Math.min(...durations)
}

function resolveTransitionConfidence(
  dimensions: DimensionResult,
  classification: ModeClassification,
  sustainedDays: number,
): number {
  // Base from dimension evidence quality (how far from threshold)
  let base: number

  switch (classification.mode) {
    case 'RECOVERY': {
      const debt = dimensions.recoveryDebt
      base = Math.min(100, 50 + (debt - 62) * 2)
      break
    }
    case 'EXPANDING': {
      const stability = dimensions.executionStability
      base = Math.min(100, 50 + (stability - 68) * 2)
      break
    }
    case 'STABILIZING': {
      base = 55
      break
    }
    default: {
      base = 60
    }
  }

  // Duration boost: each sustained day adds modest confidence
  const durationBoost = Math.min(20, sustainedDays * 5)
  return Math.min(100, Math.round(base + durationBoost))
}
