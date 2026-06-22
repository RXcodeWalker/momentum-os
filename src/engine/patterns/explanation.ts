import type { PatternTemplate } from "@/core/contracts/patterns/template";
import type { PatternAssociation } from "@/core/contracts/patterns/association";
import type { PatternConfidence } from "@/core/contracts/patterns/confidence";
import type { PatternEvidence } from "@/core/contracts/patterns/evidence";
import type { PatternExplanation, PatternHedge } from "@/core/contracts/patterns/explanation";
import type { PatternExplanationCode } from "@/core/contracts/patterns/template";

const OBSERVATION_COPY: Record<
  PatternExplanationCode,
  (supporting: number, antecedent: number) => string
> = {
  SLEEP_DEBT_PRECEDES_DIP: (s, a) =>
    `Short sleep (under 6.5h) tends to precede lower execution the next day — observed in ${s} of ${a} such nights.`,
  SLEEP_PROTECTS_EXECUTION: (s, a) =>
    `Good sleep (7.5h or more) tends to coincide with stronger execution the following day — observed in ${s} of ${a} such nights.`,
  MONDAY_OVERPLAN: (s, a) =>
    `Mondays tend to have higher planned load than other days — observed in ${s} of ${a} Mondays.`,
  POST_PEAK_DISTRACTION: (s, a) =>
    `A peak-score day tends to precede a higher-distraction day — observed in ${s} of ${a} peak days.`,
  CONSECUTIVE_FOCUS_FATIGUE: (s, a) =>
    `Three or more high-focus days in a row tend to precede a dip the next day — observed in ${s} of ${a} such streaks.`,
  RECOVERY_DAY_PROTECTS_NEXT: (s, a) =>
    `Recovery days tend to be followed by stronger execution the next day — observed in ${s} of ${a} recovery days.`,
  DISTRACTION_PRECEDES_DIP: (s, a) =>
    `High-distraction days tend to precede a lower-execution day — observed in ${s} of ${a} high-distraction days.`,
  BLOCKER_CHAINS: (s, a) =>
    `Days with reported blockers tend to coincide with lower execution scores — observed in ${s} of ${a} blocked days.`,
  WEEKDAY_OVERLOAD: (s, a) =>
    `This weekday tends to carry higher planned load — observed in ${s} of ${a} occurrences.`,
};

const FORBIDDEN_CAUSAL = ["causes", "because", "makes you", "results in", "leads to"];

function assertNonCausal(text: string): void {
  for (const phrase of FORBIDDEN_CAUSAL) {
    if (text.toLowerCase().includes(phrase)) {
      throw new Error(
        `[PatternEngine] Causal language detected in explanation copy: "${phrase}" in "${text}"`,
      );
    }
  }
}

export function generateExplanation(
  template: PatternTemplate,
  association: PatternAssociation,
  confidence: PatternConfidence,
  evidence: PatternEvidence,
): PatternExplanation {
  const hedge: PatternHedge =
    confidence.band === "HIGH" && confidence.rateInterval.high - confidence.rateInterval.low < 0.3
      ? "CONSISTENT"
      : confidence.band === "MEDIUM"
        ? "OBSERVED"
        : "TENTATIVE";

  const copyFn = OBSERVATION_COPY[template.explanationCode];
  const observation = copyFn(evidence.supportingCount, evidence.antecedentOccurrences);

  assertNonCausal(observation);

  const basis = `Based on ${evidence.totalObservations} observations over ${template.minWindowDays}+ days.`;

  return {
    code: template.explanationCode,
    observation,
    hedge,
    basis,
    confidence: confidence.band,
  };
}
