import type { StateDynamicsProfile } from "@/core/contracts/state/dynamics";
import type { PatternDetectionProfile } from "@/core/contracts/patterns/profile";
import type { BehavioralPeriodType } from "@/core/contracts/history/period";
import type { ForecastOutcome, ReplayForecast } from "@/core/contracts/replay/forecast";
import { FORECAST_MINIMUM_TRANSITION_EVIDENCE } from "@/core/contracts/replay/forecast";
import type { ConfidenceBand } from "@/core/contracts/primitives";
import type { SectionSuppressionMap } from "./evidence-gate";
import { guardAllText } from "./language-guard";
import type { TrustViolation } from "@/core/contracts/replay/result";

type PeriodPair = `${BehavioralPeriodType}->${BehavioralPeriodType}`;

const OUTCOME_OBSERVATIONS: Partial<Record<PeriodPair, string>> = {
  "RECOVERY->STABILIZING":
    "Patterns have tended toward a stabilizing phase — scores in this window have often begun leveling off.",
  "RECOVERY->FOCUSED":
    "In patterns where recovery was observed, focused execution phases followed on a number of occasions.",
  "RECOVERY->INSTABILITY":
    "In patterns where recovery appeared, instability has sometimes persisted — a common observation after extended dips.",
  "STABILIZING->FOCUSED":
    "Stabilizing periods have tended to precede focused execution in historical patterns.",
  "STABILIZING->EXPANDING":
    "An expanding phase appeared alongside several stabilizing periods in the record.",
  "STABILIZING->INSTABILITY":
    "Instability was observed following some stabilizing periods — often in patterns where consistency was lower.",
  "FOCUSED->EXPANDING":
    "Expanding output phases appeared alongside several focused periods in the pattern history.",
  "FOCUSED->INSTABILITY":
    "Instability was observed following focused periods on some occasions — common when overextension was present.",
  "FOCUSED->RECOVERY":
    "A recovery phase appeared after focused periods in a number of cases — often preceded by high output density.",
  "EXPANDING->FOCUSED":
    "Focused phases tended to follow expanding ones, often as a natural consolidation.",
  "EXPANDING->INSTABILITY":
    "Instability appeared following expanding phases in some historical instances.",
  "INSTABILITY->STABILIZING":
    "Stabilizing patterns appeared after instability phases in the record — a commonly observed recovery path.",
  "INSTABILITY->RECOVERY":
    "Recovery activation was observed following several instability periods.",
  "INSTABILITY->FOCUSED":
    "Direct transitions from instability to focused phases appeared on occasion — typically where strong re-engagement was present.",
};

function fallbackObservation(from: BehavioralPeriodType, to: BehavioralPeriodType): string {
  return `A transition from ${from} to ${to} has been observed in the historical pattern record.`;
}

export function buildForecast(
  dynamics: StateDynamicsProfile,
  patterns: PatternDetectionProfile,
  suppressionMap: SectionSuppressionMap,
  existingViolations: TrustViolation[],
): { forecast: ReplayForecast; violations: TrustViolation[] } {
  const gate = suppressionMap.forecast;
  if (gate.suppressed) {
    return {
      forecast: {
        outcomes: [],
        primaryOutcome: null,
        sectionHedge: "TENTATIVE",
        sourceTransitionCount: 0,
        confidence: "LOW",
        suppressed: true,
        suppressionReason: gate.reason,
      },
      violations: [],
    };
  }

  const currentPeriod = dynamics.currentPeriod;
  if (!currentPeriod) {
    return {
      forecast: {
        outcomes: [],
        primaryOutcome: null,
        sectionHedge: "TENTATIVE",
        sourceTransitionCount: 0,
        confidence: "LOW",
        suppressed: true,
        suppressionReason: "No active behavioral period detected.",
      },
      violations: [],
    };
  }

  const eligiblePaths = dynamics.transitionMatrix.paths.filter(
    (p) => p.from === currentPeriod && p.count >= FORECAST_MINIMUM_TRANSITION_EVIDENCE,
  );

  if (eligiblePaths.length === 0) {
    return {
      forecast: {
        outcomes: [],
        primaryOutcome: null,
        sectionHedge: "TENTATIVE",
        sourceTransitionCount: 0,
        confidence: "LOW",
        suppressed: true,
        suppressionReason:
          "Not enough transition data from the current period to surface patterns.",
      },
      violations: [],
    };
  }

  // Sort by frequency descending, take top 3
  const topPaths = [...eligiblePaths].sort((a, b) => b.frequency - a.frequency).slice(0, 3);

  const outcomes: ForecastOutcome[] = topPaths.map((path, i) => {
    const probability =
      path.frequency >= 0.5 ? "LIKELY" : path.frequency >= 0.25 ? "POSSIBLE" : "UNLIKELY";
    // avgDurationBefore is used as a proxy for time-to-outcome (see design doc)
    const avg = path.avgDurationBefore;
    const estimatedDaysRange =
      avg > 0 ? { min: Math.max(1, Math.round(avg * 0.5)), max: Math.round(avg * 1.5) } : null;
    const key: PeriodPair = `${path.from}->${path.to}`;
    const obsTemplate = OUTCOME_OBSERVATIONS[key] ?? fallbackObservation(path.from, path.to);

    // Overlay dominant protective pattern context on the primary outcome
    let obs = obsTemplate;
    if (i === 0 && patterns.dominantProtectivePattern && patterns.confidence === "HIGH") {
      obs += ` The ${patterns.dominantProtectivePattern.patternType} pattern has appeared alongside more stable outcomes in historical data.`;
    }

    return {
      outcomeId: `forecast-${path.from}-${path.to}`,
      targetPeriodType: path.to,
      probability,
      estimatedDaysRange,
      observation: obs,
      evidenceCount: path.count,
      isPrimary: i === 0,
    };
  });

  const guarded = guardAllText(
    outcomes.map((o) => ({ text: o.observation, section: "forecast" as const })),
  );
  const guardedOutcomes = outcomes.map((o, i) => ({ ...o, observation: guarded.results[i].text }));

  const conf: ConfidenceBand =
    dynamics.confidence === "high" ? "HIGH" : dynamics.confidence === "medium" ? "MEDIUM" : "LOW";
  const violations = [...existingViolations, ...guarded.violations];

  return {
    forecast: {
      outcomes: guardedOutcomes,
      primaryOutcome: guardedOutcomes.find((o) => o.isPrimary) ?? null,
      sectionHedge: conf === "HIGH" ? "CONSISTENT" : conf === "MEDIUM" ? "OBSERVED" : "TENTATIVE",
      sourceTransitionCount: eligiblePaths.length,
      confidence: conf,
      suppressed: false,
      suppressionReason: null,
    },
    violations,
  };
}
