import type { AdaptationContext, AdaptationDraft } from "../types/internal";
import type { TraceRecorder } from "../trace/trace-recorder";
import { EXPANSION_DELTA_CONFIG } from "../config";

/**
 * Pass 2.5 — Expansion Modulator
 *
 * Applies a precision delta to `recommendedChallengeLevel` based on the
 * ExpansionDecision injected into AdaptationContext. This runs after the
 * coarse trajectory delta (Pass 2) and before risk amplification (Pass 3),
 * giving the expansion engine fine-grained rate control over challenge growth.
 *
 * Degrades gracefully when expansionDirective is absent (no-op).
 */
export function applyExpansionModulation(
  draft: AdaptationDraft,
  ctx: AdaptationContext,
  recorder: TraceRecorder,
): void {
  const { expansionDirective, expansionPaceModifier } = ctx;

  if (expansionDirective === undefined || expansionPaceModifier === undefined) return;

  const { MAX_EXPANSION_DELTA, MAX_CONTRACTION_DELTA } = EXPANSION_DELTA_CONFIG;
  const prev = draft.recommendedChallengeLevel;
  let delta = 0;

  switch (expansionDirective) {
    case "increase":
      delta = MAX_EXPANSION_DELTA * expansionPaceModifier;
      break;
    case "gradual_increase":
      delta = MAX_EXPANSION_DELTA * expansionPaceModifier * 0.5;
      break;
    case "hold":
      delta = 0;
      break;
    case "reduce": {
      // Always subtracts at least 30% of max contraction even when pace is high
      const rawReduction = MAX_CONTRACTION_DELTA * (1 - expansionPaceModifier + 0.3);
      delta = -Math.min(rawReduction, MAX_CONTRACTION_DELTA);
      break;
    }
  }

  if (delta === 0) return;

  const next = prev + delta;
  draft.recommendedChallengeLevel = next;
  recorder.record(
    "execution.recommendedChallengeLevel",
    prev,
    next,
    "expansion",
    expansionDirective,
  );
  draft.reasoning.push(
    `Expansion modulator: ${expansionDirective} (pace=${expansionPaceModifier.toFixed(2)}) → Δ${delta > 0 ? "+" : ""}${delta.toFixed(1)} challenge`,
  );
}
