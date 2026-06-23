import type { UserMode } from "@/core/contracts/state/modes";
import type { RiskLevel } from "@/core/contracts/primitives";
import type { BehavioralSignal } from "@/core/contracts/signals/behavioral-signals";
import type { SignalSnapshot } from "@/core/contracts/signals/signal-snapshot";
import type { DimensionResult } from "./state-dimensions";
import {
  THRESHOLDS,
  RISK_THRESHOLDS,
  RECOVERY_EXIT_HYSTERESIS_BAND,
  RECOVERY_SUSTAINED_DAYS,
  EXPANSION_SUSTAINED_DAYS,
} from "./config";

// ---------------------------------------------------------------------------
// Risk assessment
// ---------------------------------------------------------------------------

function toRiskLevel(
  score: number,
  thresholds: { moderate: number; high: number; critical: number },
): RiskLevel {
  if (score >= thresholds.critical) return "CRITICAL";
  if (score >= thresholds.high) return "HIGH";
  if (score >= thresholds.moderate) return "MODERATE";
  return "LOW";
}

export type RiskAssessment = {
  overloadRisk: RiskLevel;
  burnoutRisk: RiskLevel;
  avoidanceRisk: RiskLevel;
  collapseRisk: RiskLevel;
};

export function assessRisks(
  dimensions: DimensionResult,
  snapshot: SignalSnapshot | undefined,
): RiskAssessment {
  // Overload: high cognitive strain + fragmentation
  const overloadScore = dimensions.cognitiveStrain * 0.55 + dimensions.fragmentationLevel * 0.45;
  // Burnout: high recovery debt + sustained intensity (embedded in dimensions)
  const burnoutScore = dimensions.recoveryDebt * 0.6 + dimensions.emotionalFriction * 0.4;
  // Avoidance: high avoidance pressure from signal snapshot or emotional friction
  const avoidanceDuration = snapshot?.signalDurations?.["AVOIDANCE_CLUSTERING"] ?? 0;
  const avoidanceScore =
    dimensions.emotionalFriction * 0.55 +
    (avoidanceDuration >= RECOVERY_SUSTAINED_DAYS ? 25 : 0) +
    dimensions.fragmentationLevel * 0.25;
  // Collapse: compounded — high recovery debt + low execution stability
  const collapseScore = dimensions.recoveryDebt * 0.5 + (100 - dimensions.executionStability) * 0.5;

  return {
    overloadRisk: toRiskLevel(overloadScore, RISK_THRESHOLDS.overload),
    burnoutRisk: toRiskLevel(burnoutScore, RISK_THRESHOLDS.burnout),
    avoidanceRisk: toRiskLevel(avoidanceScore, RISK_THRESHOLDS.avoidance),
    collapseRisk: toRiskLevel(collapseScore, RISK_THRESHOLDS.collapse),
  };
}

// ---------------------------------------------------------------------------
// Mode classification — priority ordered: RECOVERY → EXPANDING → STABILIZING → FOCUSED
// ---------------------------------------------------------------------------

const EXPANDING_BLOCKED_SIGNALS: BehavioralSignal[] = [
  "RECOVERY_COLLAPSE",
  "DECLINING_EXECUTION_QUALITY",
  "VOLATILITY_ACCELERATION",
  "RISING_FRAGMENTATION",
  "AVOIDANCE_CLUSTERING",
  "PACING_INSTABILITY",
  "MEANINGFULNESS_DEFERRAL",
];

export type ModeClassification = {
  mode: UserMode;
  supportingFactors: string[];
  risks: RiskAssessment;
};

function snapshotDuration(
  snapshot: SignalSnapshot | undefined,
  signal: SignalSnapshot["activeSignals"][number],
): number {
  return snapshot?.signalDurations?.[signal] ?? 0;
}

function checkRecovery(
  dimensions: DimensionResult,
  snapshot: SignalSnapshot | undefined,
  risks: RiskAssessment,
  evidenceDays: number,
  previousMode: UserMode | undefined,
): string[] | null {
  const factors: string[] = [];
  const hasSustainedEvidence = evidenceDays >= RECOVERY_SUSTAINED_DAYS;

  // When the prior mode was RECOVERY we apply hysteresis: the debt threshold is
  // lowered by RECOVERY_EXIT_HYSTERESIS_BAND so the user must fall further below
  // the entry threshold before the mode transitions away. This prevents rapid
  // RECOVERY↔STABILIZING oscillation on day-to-day debt swings.
  const recoveryDebtThreshold =
    previousMode === "RECOVERY"
      ? THRESHOLDS.recoveryDebtRecovery - RECOVERY_EXIT_HYSTERESIS_BAND
      : THRESHOLDS.recoveryDebtRecovery;

  // Dimension trigger: recovery debt above threshold — requires sustained evidence window
  if (hasSustainedEvidence && dimensions.recoveryDebt >= recoveryDebtThreshold) {
    factors.push(`Recovery debt elevated (${Math.round(dimensions.recoveryDebt)}/100)`);
  }

  // Signal-driven trigger: RECOVERY_COLLAPSE sustained (signal engine enforces its own duration)
  const collapseDays = snapshotDuration(snapshot, "RECOVERY_COLLAPSE");
  if (collapseDays >= RECOVERY_SUSTAINED_DAYS) {
    factors.push(`Recovery collapse signal sustained ${collapseDays} days`);
  }

  // Compound trigger: HIGH burnout risk + LOW execution stability
  if (hasSustainedEvidence && (risks.burnoutRisk === "HIGH" || risks.burnoutRisk === "CRITICAL")) {
    if (dimensions.executionStability < THRESHOLDS.executionStabilityFocused) {
      factors.push("High burnout risk with declining execution stability");
    }
  }

  // Compound trigger: CRITICAL collapse risk requires sustained evidence
  if (hasSustainedEvidence && risks.collapseRisk === "CRITICAL") {
    factors.push("Critical collapse risk requires recovery posture");
  }

  return factors.length >= 1 ? factors : null;
}

function checkExpanding(
  dimensions: DimensionResult,
  snapshot: SignalSnapshot | undefined,
  previousMode: UserMode | undefined,
  evidenceDays: number,
): string[] | null {
  if (evidenceDays < EXPANSION_SUSTAINED_DAYS) return null;
  if (dimensions.expandingGateSustainedDays < EXPANSION_SUSTAINED_DAYS) return null;

  // EXPANDING requires ALL dimension gates
  if (dimensions.recoveryDebt > THRESHOLDS.expandingRecoveryDebt) return null;
  if (dimensions.cognitiveStrain > THRESHOLDS.expandingCognitiveStrain) return null;
  if (dimensions.executionStability < THRESHOLDS.expandingExecutionStability) return null;
  if (dimensions.emotionalFriction > THRESHOLDS.expandingEmotionalFriction) return null;

  // No active negative signals that contradict safe expansion
  const hasNegativeSignal = (snapshot?.activeSignals ?? []).some((s) =>
    EXPANDING_BLOCKED_SIGNALS.includes(s),
  );
  if (hasNegativeSignal) return null;

  // Require FOCUSED or already EXPANDING as prior mode (can't leap from RECOVERY)
  if (previousMode === "RECOVERY" || previousMode === "STABILIZING") {
    // Needs extra sustained evidence to exit a recovery state — require longer smoothed positivity
    const requiredMinimumStability = THRESHOLDS.expandingExecutionStability + 4;
    if (dimensions.executionStability < requiredMinimumStability) return null;
  }

  return [
    `Recovery debt low (${Math.round(dimensions.recoveryDebt)})`,
    `Execution stability strong (${Math.round(dimensions.executionStability)})`,
    `Emotional friction low (${Math.round(dimensions.emotionalFriction)})`,
    `Positive gates sustained ${dimensions.expandingGateSustainedDays} days`,
  ];
}

function checkStabilizing(dimensions: DimensionResult): string[] | null {
  const factors: string[] = [];

  if (dimensions.recoveryDebt >= THRESHOLDS.recoveryDebtStabilizing) {
    factors.push(`Recovery debt moderate (${Math.round(dimensions.recoveryDebt)})`);
  }
  if (dimensions.executionStability < THRESHOLDS.executionStabilityFocused) {
    factors.push(
      `Execution stability below focused threshold (${Math.round(dimensions.executionStability)})`,
    );
  }
  if (dimensions.emotionalFriction >= THRESHOLDS.emotionalFrictionHigh) {
    factors.push(`Emotional friction elevated (${Math.round(dimensions.emotionalFriction)})`);
  }

  return factors.length >= 1 ? factors : null;
}

export function classifyMode(
  dimensions: DimensionResult,
  snapshot: SignalSnapshot | undefined,
  previousMode: UserMode | undefined,
  evidenceDays: number,
): ModeClassification {
  const risks = assessRisks(dimensions, snapshot);

  const recoveryFactors = checkRecovery(dimensions, snapshot, risks, evidenceDays, previousMode);
  if (recoveryFactors) {
    return { mode: "RECOVERY", supportingFactors: recoveryFactors, risks };
  }

  const expandingFactors = checkExpanding(dimensions, snapshot, previousMode, evidenceDays);
  if (expandingFactors) {
    return { mode: "EXPANDING", supportingFactors: expandingFactors, risks };
  }

  const stabilizingFactors = checkStabilizing(dimensions);
  if (stabilizingFactors) {
    return { mode: "STABILIZING", supportingFactors: stabilizingFactors, risks };
  }

  return {
    mode: "FOCUSED",
    supportingFactors: ["Dimensions within healthy operational range"],
    risks,
  };
}
