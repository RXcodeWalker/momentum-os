import type { StateTransition } from "@/core/contracts/state/transitions";
import type { UserMode } from "@/core/contracts/state/modes";
import type { SignalSnapshot } from "@/core/contracts/signals/signal-snapshot";
import type { DimensionResult } from "./state-dimensions";
import type { ModeClassification } from "./mode-classifier";
import { THRESHOLDS, TRANSITION_CONFIDENCE } from "./config";

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
  if (!previousMode || previousMode === classification.mode) return undefined;

  const sustainedDays = resolveMinSustainedDays(classification, snapshot);

  return {
    from: previousMode,
    to: classification.mode,
    confidence: resolveTransitionConfidence(dimensions, classification, sustainedDays),
    supportingFactors: classification.supportingFactors,
    sustainedSignalDurationDays: sustainedDays,
    reversible: true,
    occurredAt,
  };
}

function resolveMinSustainedDays(
  classification: ModeClassification,
  snapshot: SignalSnapshot | undefined,
): number {
  if (!snapshot) return 1;

  const durations = Object.values(snapshot.signalDurations ?? {}).filter(
    (d): d is number => typeof d === "number",
  );
  if (durations.length === 0) return 1;
  return Math.min(...durations);
}

function confidenceFromThresholdDistance(distance: number): number {
  return Math.min(
    100,
    TRANSITION_CONFIDENCE.atThreshold + distance * TRANSITION_CONFIDENCE.perPointMultiplier,
  );
}

function resolveTransitionConfidence(
  dimensions: DimensionResult,
  classification: ModeClassification,
  sustainedDays: number,
): number {
  let base: number;

  switch (classification.mode) {
    case "RECOVERY": {
      const debt = dimensions.recoveryDebt;
      base = confidenceFromThresholdDistance(debt - THRESHOLDS.recoveryDebtRecovery);
      break;
    }
    case "EXPANDING": {
      const stability = dimensions.executionStability;
      base = confidenceFromThresholdDistance(stability - THRESHOLDS.expandingExecutionStability);
      break;
    }
    case "STABILIZING": {
      base = TRANSITION_CONFIDENCE.stabilizingBase;
      break;
    }
    default: {
      base = TRANSITION_CONFIDENCE.focusedBase;
    }
  }

  const durationBoost = Math.min(
    TRANSITION_CONFIDENCE.maxDurationBoost,
    sustainedDays * TRANSITION_CONFIDENCE.durationBoostPerDay,
  );
  return Math.min(100, Math.round(base + durationBoost));
}
