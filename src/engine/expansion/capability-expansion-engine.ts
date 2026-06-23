import type { ConfidenceBand } from "@/core/contracts/primitives";
import type {
  ExpansionDecision,
  ExpansionDirective,
  ExpansionEngineInput,
  ExpansionSignal,
} from "@/core/contracts/expansion";
import type { UserMode, UserTrajectory } from "@/core/contracts/state/modes";
import { detectChallengeBaseline } from "./challenge-detector";
import { evaluateSafetyGates, hasBlockingGate } from "./safety-gates";
import { computePaceModifier } from "./pace-calculator";

// ── Signal group weights (all sum ≈ 1.0) ────────────────────────────────────
// Max contributions: 40 + 30 + 10 + 20 + 10 + 10 + 10 = 130 total
const TOTAL_MAX = 130;
const W_MOMENTUM = 40 / TOTAL_MAX; // ≈ 0.308
const W_STRUCTURAL = 30 / TOTAL_MAX; // ≈ 0.231
const W_VELOCITY = 10 / TOTAL_MAX; // ≈ 0.077
const W_PATTERN = 20 / TOTAL_MAX; // ≈ 0.154
const W_RECOVERY = 10 / TOTAL_MAX; // ≈ 0.077
const W_AVOIDANCE = 10 / TOTAL_MAX; // ≈ 0.077
const W_TASK_COMPAT = 10 / TOTAL_MAX; // ≈ 0.077

function normalizeSignal(contribution: number, maxAbs: number): number {
  return Math.min(1, Math.max(0, (contribution + maxAbs) / (2 * maxAbs)));
}

function signalDirection(score: number): ExpansionSignal["direction"] {
  if (score > 0) return "supports_expansion";
  if (score < 0) return "supports_reduction";
  return "supports_hold";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computeReadinessAndSignals(input: ExpansionEngineInput): {
  readinessScore: number;
  signals: ExpansionSignal[];
} {
  const {
    momentumModel,
    dynamicsProfile,
    stateDynamics,
    avoidancePressure,
    consistency,
    taskCompatibilityAvgScore,
  } = input;
  const signals: ExpansionSignal[] = [];
  let readinessScore = 0;

  // ── Group 1: Momentum classification (±40) ──────────────────────────────
  const momentumScoreMap = {
    expanding: 30,
    stable: 15,
    fragile: -25,
    contracting: -40,
  } as const;
  const momentumScore = momentumScoreMap[momentumModel.classification];
  readinessScore += momentumScore;
  signals.push({
    id: "momentum_classification",
    label: "Momentum Classification",
    direction: signalDirection(momentumScore),
    weight: W_MOMENTUM,
    normalizedValue: normalizeSignal(momentumScore, 40),
    description: `Classification is ${momentumModel.classification} (${momentumScore > 0 ? "+" : ""}${momentumScore})`,
  });

  // ── Group 2: Structural quality (±30) ───────────────────────────────────
  let structuralScore = 0;
  if (momentumModel.quality.isStructurallySound) structuralScore += 20;
  if (momentumModel.quality.sustainabilityScore > 70) structuralScore += 10;
  if (momentumModel.quality.fragilityScore > 45) structuralScore -= 15;
  structuralScore = clamp(structuralScore, -30, 30);
  readinessScore += structuralScore;
  signals.push({
    id: "structural_quality",
    label: "Structural Quality",
    direction: signalDirection(structuralScore),
    weight: W_STRUCTURAL,
    normalizedValue: normalizeSignal(structuralScore, 30),
    description: [
      `Sound=${momentumModel.quality.isStructurallySound}`,
      `sustainability=${momentumModel.quality.sustainabilityScore.toFixed(0)}`,
      `fragility=${momentumModel.quality.fragilityScore.toFixed(0)}`,
    ].join(", "),
  });

  // ── Group 3: Velocity (±10) ──────────────────────────────────────────────
  const velocityScoreMap: Record<typeof momentumModel.velocity, number> = {
    accelerating: 10,
    steady: 5,
    decelerating: 0,
    stalled: -10,
  };
  const velocityScore = velocityScoreMap[momentumModel.velocity];
  readinessScore += velocityScore;
  signals.push({
    id: "velocity",
    label: "Momentum Velocity",
    direction: signalDirection(velocityScore),
    weight: W_VELOCITY,
    normalizedValue: normalizeSignal(velocityScore, 10),
    description: `Velocity is ${momentumModel.velocity} (${velocityScore > 0 ? "+" : ""}${velocityScore})`,
  });

  // ── Group 4: Dynamics pattern (±20) ─────────────────────────────────────
  const patternScoreMap: Record<typeof dynamicsProfile.dominantPattern, number> = {
    expanding: 10,
    stable: 0,
    contracting: -10,
    erratic: -10,
    cycling: -20,
  };
  const patternScore = patternScoreMap[dynamicsProfile.dominantPattern];
  readinessScore += patternScore;
  signals.push({
    id: "dynamics_pattern",
    label: "Dynamics Pattern",
    direction: signalDirection(patternScore),
    weight: W_PATTERN,
    normalizedValue: normalizeSignal(patternScore, 20),
    description: `Dominant pattern is ${dynamicsProfile.dominantPattern} (${patternScore > 0 ? "+" : ""}${patternScore})`,
  });

  // ── Group 5: Recovery stability (±10) ───────────────────────────────────
  const { successRate } = stateDynamics.recoveryCycles;
  let recoveryScore = 0;
  if (successRate >= 0.8) recoveryScore = 10;
  else if (successRate < 0.5) recoveryScore = -10;
  readinessScore += recoveryScore;
  signals.push({
    id: "recovery_stability",
    label: "Recovery Stability",
    direction: signalDirection(recoveryScore),
    weight: W_RECOVERY,
    normalizedValue: normalizeSignal(recoveryScore, 10),
    description: `Recovery success rate ${(successRate * 100).toFixed(0)}% (${recoveryScore > 0 ? "+" : ""}${recoveryScore})`,
  });

  // ── Group 6: Avoidance & consistency (±10) ──────────────────────────────
  let avoidanceScore = 0;
  if (avoidancePressure <= 25) avoidanceScore += 5;
  if (consistency > 0.8) avoidanceScore += 10;
  else if (consistency < 0.5) avoidanceScore -= 5;
  avoidanceScore = clamp(avoidanceScore, -10, 10);
  readinessScore += avoidanceScore;
  signals.push({
    id: "avoidance_consistency",
    label: "Avoidance & Consistency",
    direction: signalDirection(avoidanceScore),
    weight: W_AVOIDANCE,
    normalizedValue: normalizeSignal(avoidanceScore, 10),
    description: `Avoidance pressure=${avoidancePressure}, 7d consistency=${(consistency * 100).toFixed(0)}%`,
  });

  // ── Group 7: Task compatibility (±10) ───────────────────────────────────
  let taskCompatScore = 0;
  if (taskCompatibilityAvgScore !== null && taskCompatibilityAvgScore !== undefined) {
    if (taskCompatibilityAvgScore >= 75) taskCompatScore = 8;
    else if (taskCompatibilityAvgScore >= 55) taskCompatScore = 4;
    else if (taskCompatibilityAvgScore < 35) taskCompatScore = -8;
  }
  readinessScore += taskCompatScore;
  signals.push({
    id: "task_compatibility",
    label: "Task Compatibility",
    direction: signalDirection(taskCompatScore),
    weight: W_TASK_COMPAT,
    normalizedValue: normalizeSignal(taskCompatScore, 10),
    description:
      taskCompatibilityAvgScore !== null && taskCompatibilityAvgScore !== undefined
        ? `Avg recovery compatibility score ${taskCompatibilityAvgScore.toFixed(0)} (${taskCompatScore > 0 ? "+" : ""}${taskCompatScore})`
        : "No task compatibility data available",
  });

  return { readinessScore, signals };
}

function resolveDirective(
  readinessScore: number,
  hasBlocking: boolean,
  recoveryMode: boolean,
  classification: string,
  checkInsCount: number,
): ExpansionDirective {
  // Safety gates veto increase; force hold (or reduce if contracting/recovery)
  if (hasBlocking) {
    if (recoveryMode || classification === "contracting") return "reduce";
    return "hold";
  }

  let directive: ExpansionDirective;
  if (readinessScore >= 50) directive = "increase";
  else if (readinessScore >= 15) directive = "gradual_increase";
  else if (readinessScore >= -15) directive = "hold";
  else directive = "reduce";

  // Rate-control: cap directive based on data confidence
  if (checkInsCount < 3) return directive === "reduce" ? "reduce" : "hold";
  if (checkInsCount < 7) return directive === "increase" ? "gradual_increase" : directive;

  return directive;
}

function resolveConfidence(
  checkInsCount: number,
  momentumConfidence: "low" | "medium" | "high",
): ConfidenceBand {
  if (checkInsCount >= 14 && momentumConfidence === "high") return "HIGH";
  if (checkInsCount >= 7 || momentumConfidence === "medium") return "MEDIUM";
  return "LOW";
}

function buildRationale(
  directive: ExpansionDirective,
  readinessScore: number,
  hasBlocking: boolean,
  triggeredBlockers: string[],
  paceModifier: number,
): string {
  const parts: string[] = [];

  if (hasBlocking) {
    parts.push(`Blocked by: ${triggeredBlockers.join(", ")}.`);
  }

  parts.push(`Readiness score: ${readinessScore > 0 ? "+" : ""}${readinessScore}.`);

  switch (directive) {
    case "increase":
      parts.push(`Challenge can increase at full pace (×${paceModifier.toFixed(2)}).`);
      break;
    case "gradual_increase":
      parts.push(`Challenge can increase gradually (×${paceModifier.toFixed(2)} at 50% rate).`);
      break;
    case "hold":
      parts.push("Challenge held — insufficient evidence of sustained expansion readiness.");
      break;
    case "reduce":
      parts.push(
        `Challenge reduced to relieve pressure (pace factor ×${paceModifier.toFixed(2)}).`,
      );
      break;
  }

  return parts.join(" ");
}

// ── Public entry point ───────────────────────────────────────────────────────

export function computeExpansionDecision(
  input: ExpansionEngineInput,
  mode: UserMode,
  trajectory: UserTrajectory,
): ExpansionDecision {
  const {
    momentumModel,
    stateDynamics,
    dynamicsProfile,
    recoveryMode,
    streakAtRisk,
    recoveryDebtAccumulating,
    avoidancePressure,
    checkInsCount,
  } = input;

  const challengeBaseline = detectChallengeBaseline(mode, trajectory);

  const { readinessScore, signals } = computeReadinessAndSignals(input);

  const safetyConstraints = evaluateSafetyGates({
    stateDynamics,
    dynamicsProfile,
    avoidancePressure,
    recoveryMode,
    streakAtRisk,
    recoveryDebtAccumulating,
  });

  const blocking = hasBlockingGate(safetyConstraints);
  const triggeredBlockers = safetyConstraints
    .filter((c) => c.triggered && c.severity === "blocking")
    .map((c) => c.id);

  const directive = resolveDirective(
    readinessScore,
    blocking,
    recoveryMode,
    momentumModel.classification,
    checkInsCount,
  );

  const paceModifier = computePaceModifier({
    readinessScore,
    momentumModel,
    dynamicsProfile,
    safetyConstraints,
  });

  const confidence = resolveConfidence(checkInsCount, momentumModel.confidence);

  const rationale = buildRationale(
    directive,
    readinessScore,
    blocking,
    triggeredBlockers,
    paceModifier,
  );

  return {
    directive,
    paceModifier,
    challengeBaseline,
    readinessScore,
    signals,
    safetyConstraints,
    confidence,
    rationale,
    computedAt: new Date().toISOString(),
  };
}
