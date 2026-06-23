import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { computeStateDynamicsProfile, computeStateDynamics } from "@/engine/state/dynamics-engine";
import { detectAvoidance } from "@/engine/avoidance/detect-avoidance";
import { computeMomentumModel } from "@/engine/momentum/momentum-engine";
import { computeExpansionDecision } from "@/engine/expansion/capability-expansion-engine";
import { evaluateRecoveryCompatibility } from "@/engine/tasks/analysis/recovery-compatibility-engine";
import type { AvoidanceProfile } from "@/core/contracts/avoidance";
import type { MomentumModel } from "@/core/contracts/momentum";
import type { ExpansionDecision } from "@/core/contracts/expansion";
import type { RecoveryCompatibilityTier } from "@/core/contracts/tasks/recovery-compatibility";
import type { ConfidenceBand } from "@/core/contracts/primitives";
import type { StateDynamicsProfile, StateDynamics } from "@/core/contracts/state/dynamics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaskCompatibilityProfile = {
  distribution: Record<RecoveryCompatibilityTier, number>;
  harmfulTaskIds: string[];
  excellentTaskIds: string[];
  averageScore: number;
} | null;

export type BehavioralIntelligence = {
  avoidance: AvoidanceProfile | null;
  momentum: MomentumModel;
  expansion: ExpansionDecision | null;
  taskCompatibility: TaskCompatibilityProfile;

  composite: {
    overallReadinessScore: number;
    activeConstraints: string[];
    systemConfidence: ConfidenceBand;
    primaryGuidance: string;
  };

  dataReadiness: {
    checkInsCount: number;
    stage: "insufficient" | "early" | "developing" | "established";
    hasMinimumData: boolean;
    isFullyCalibrated: boolean;
  };
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function computeConsistency(history: { executionScore: number }[], days: number): number {
  const recent = history.slice(-days);
  if (recent.length === 0) return 0;
  const highDays = recent.filter((d) => d.executionScore >= 70).length;
  return Math.round((highDays / recent.length) * 100);
}

function deriveStage(n: number): "insufficient" | "early" | "developing" | "established" {
  if (n < 2) return "insufficient";
  if (n < 7) return "early";
  if (n < 14) return "developing";
  return "established";
}

function buildTaskCompatibilityProfile(
  pipeline: {
    taskEvaluation: Array<{
      task: { id: string };
      score: { recoveryCompatibility?: { tier: RecoveryCompatibilityTier; score: number } | null };
    }>;
    stateInterpretation: Parameters<typeof evaluateRecoveryCompatibility>[0]["userState"];
  } | null,
  dynamicsProfile: StateDynamicsProfile,
): TaskCompatibilityProfile {
  if (!pipeline || pipeline.taskEvaluation.length === 0) return null;

  const distribution: Record<RecoveryCompatibilityTier, number> = {
    excellent: 0,
    good: 0,
    moderate: 0,
    poor: 0,
    harmful: 0,
  };
  const harmfulTaskIds: string[] = [];
  const excellentTaskIds: string[] = [];
  let totalScore = 0;

  for (const evalRow of pipeline.taskEvaluation) {
    const rc =
      evalRow.score.recoveryCompatibility ??
      evaluateRecoveryCompatibility({
        task: evalRow.task as Parameters<typeof evaluateRecoveryCompatibility>[0]["task"],
        userState: pipeline.stateInterpretation,
        dynamicsProfile,
      });

    distribution[rc.tier] += 1;
    totalScore += rc.score;
    if (rc.tier === "harmful") harmfulTaskIds.push(evalRow.task.id);
    if (rc.tier === "excellent") excellentTaskIds.push(evalRow.task.id);
  }

  return {
    distribution,
    harmfulTaskIds,
    excellentTaskIds,
    averageScore: totalScore / pipeline.taskEvaluation.length,
  };
}

function synthesize(
  avoidance: AvoidanceProfile | null,
  momentum: MomentumModel,
  expansion: ExpansionDecision | null,
): BehavioralIntelligence["composite"] {
  const activeConstraints: string[] = [
    ...(expansion?.safetyConstraints.filter((c) => c.triggered).map((c) => c.id) ?? []),
    ...(avoidance?.activePatterns ?? []),
  ];

  const confidenceBandRank: Record<ConfidenceBand, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  const bands: ConfidenceBand[] = [
    avoidance?.confidence ?? "LOW",
    momentum.confidence === "low" ? "LOW" : momentum.confidence === "medium" ? "MEDIUM" : "HIGH",
    expansion?.confidence ?? "LOW",
  ];
  const systemConfidence = bands.reduce<ConfidenceBand>(
    (min, b) => (confidenceBandRank[b] < confidenceBandRank[min] ? b : min),
    "HIGH",
  );

  let primaryGuidance: string;
  // Rule 1: Avoidance gate active (highest priority)
  if (
    avoidance &&
    avoidance.activePatterns.length > 0 &&
    expansion &&
    expansion.safetyConstraints.some((c) => c.id === "AVOIDANCE_GATE" && c.triggered)
  ) {
    primaryGuidance = avoidance.observationalSummary;
  // Rule 2: Fragility with any upward directive (covers both 'increase' and 'gradual_increase')
  } else if (
    momentum.quality.fragilityScore > 60 &&
    expansion?.directive &&
    (expansion.directive === "increase" || expansion.directive === "gradual_increase")
  ) {
    primaryGuidance = `Structural signals indicate increased fragility. Expansion pace is being held. ${momentum.summary}`;
  // Rule 3: Active reduce directive (prevents contradictory stability affirmation)
  } else if (expansion?.directive === "reduce") {
    primaryGuidance = `Active constraints require reducing challenge level. ${expansion.rationale}`;
  // Rule 4: Sustainability affirmation — only when directive is not 'reduce'
  } else if (momentum.quality.sustainabilityScore > 70) {
    primaryGuidance = `Execution patterns show structural stability. ${momentum.summary}`;
  // Rule 5: Fallback
  } else {
    primaryGuidance = expansion?.rationale ?? momentum.summary;
  }

  return {
    overallReadinessScore: expansion?.readinessScore ?? 0,
    activeConstraints,
    systemConfidence,
    primaryGuidance,
  };
}

// ---------------------------------------------------------------------------
// Unified hook
// ---------------------------------------------------------------------------

export function useBehavioralIntelligence(): BehavioralIntelligence {
  // Layer 0: read each store slice once
  const tasks = useApp((s) => s.tasks);
  const checkIns = useApp((s) => s.checkIns);
  const history = useApp((s) => s.history);
  const blockerHistory = useApp((s) => s.blockerHistory);
  const distractionLog = useApp((s) => s.distractionLog);
  const recoveryMode = useApp((s) => s.recoveryMode);
  const streaks = useApp((s) => s.streaks);
  const behavioralPeriods = useApp((s) => s.behavioralPeriods);
  const aggregationSnapshots = useApp((s) => s.aggregationSnapshots);
  const trendRecords = useApp((s) => s.trendRecords);
  const lastPipelineResult = useApp((s) => s.lastPipelineResult);
  const w7 = useApp((s) => s.aggregationSnapshots.W7);
  const w7Prior = useApp((s) => s.aggregationSnapshots.W7_PRIOR);
  const w14Metrics = useApp((s) => s.aggregationSnapshots.W14?.metrics ?? null);

  // Derived shared context (memoized, computed once)
  const stateDynamicsProfile: StateDynamicsProfile = useMemo(
    () => computeStateDynamicsProfile(behavioralPeriods, aggregationSnapshots),
    [behavioralPeriods, aggregationSnapshots],
  );

  const stateDynamics: StateDynamics = useMemo(
    () => computeStateDynamics(behavioralPeriods, aggregationSnapshots, history),
    [behavioralPeriods, aggregationSnapshots, history],
  );

  const streakCtx = useMemo(() => {
    const { current, longest, currentResilienceStreak, longestResilienceStreak, quickRecoveries } =
      streaks;
    const atRisk =
      w7 && !w7.isStale
        ? w7.metrics.streakAtRisk
        : (() => {
            const last3 = history.slice(-3).map((d) => d.executionScore);
            return (
              last3.length >= 2 &&
              last3[last3.length - 1] < 65 &&
              last3[last3.length - 1] < (last3[last3.length - 2] ?? 100)
            );
          })();
    const useResilienceStreak = currentResilienceStreak > current && currentResilienceStreak > 3;
    const displayStreak = useResilienceStreak ? currentResilienceStreak : current;
    const streakType: "execution" | "resilience" = useResilienceStreak ? "resilience" : "execution";
    const milestones = [7, 14, 30, 60, 90];
    const nextMilestone = milestones.find((m) => m > displayStreak) ?? 100;
    const milestoneNext = nextMilestone - displayStreak;
    const milestoneLabel =
      milestoneNext <= 0
        ? "Milestone reached!"
        : `${milestoneNext} day${milestoneNext === 1 ? "" : "s"} to ${nextMilestone}-day ${streakType} streak`;
    return {
      currentStreak: displayStreak,
      streakType,
      atRisk,
      milestoneNext,
      milestoneLabel,
      longest,
      longestResilienceStreak,
      quickRecoveries,
      execStreak: current,
      resStreak: currentResilienceStreak,
    };
  }, [streaks, history, w7]);

  const momentumDelta = useMemo(() => {
    if (w7 && !w7.isStale && w7Prior && !w7Prior.isStale) {
      const delta = Math.round(w7.metrics.avgExecutionScore - w7Prior.metrics.avgExecutionScore);
      return {
        delta,
        trend: delta > 2 ? ("up" as const) : delta < -2 ? ("down" as const) : ("flat" as const),
      };
    }
    const last7 = history.slice(-7).map((d) => d.executionScore);
    const prev7 = history.slice(-14, -7).map((d) => d.executionScore);
    const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
    const delta = Math.round(avg(last7) - avg(prev7));
    return {
      delta,
      trend: delta > 2 ? ("up" as const) : delta < -2 ? ("down" as const) : ("flat" as const),
    };
  }, [history, w7, w7Prior]);

  const consistency7 = useMemo(() => computeConsistency(history, 7), [history]);
  const consistency28 = useMemo(() => computeConsistency(history, 28), [history]);
  const checkInsCount = checkIns.length;

  // Layer 1 (5A): Avoidance — no cross-engine deps
  const avoidance = useMemo(
    () =>
      detectAvoidance({ tasks, checkIns, history, blockerHistory, distractionLog, recoveryMode }),
    [tasks, checkIns, history, blockerHistory, distractionLog, recoveryMode],
  );
  const avoidancePressure = avoidance?.overallAvoidancePressure ?? 0;

  // Layer 2 (5D): Momentum — feeds on 5A output
  const momentumModel = useMemo(
    () =>
      computeMomentumModel({
        dynamics: stateDynamics,
        profile: stateDynamicsProfile,
        streakCtx,
        momentum: momentumDelta,
        consistency: consistency28,
        checkInsCount,
        recoveryMode,
        trajectoryFromPipeline: lastPipelineResult?.trajectoryAnalysis ?? null,
        trendRecords,
        recoveryDebtAccumulating: w14Metrics?.recoveryDebtAccumulating ?? false,
        avoidancePressure,
      }),
    [
      stateDynamics,
      stateDynamicsProfile,
      streakCtx,
      momentumDelta,
      consistency28,
      checkInsCount,
      recoveryMode,
      lastPipelineResult,
      trendRecords,
      w14Metrics,
      avoidancePressure,
    ],
  );

  // 5B aggregate (computed before 5C so we can pass taskCompatibilityAvgScore)
  const taskCompatibility = useMemo(
    () => buildTaskCompatibilityProfile(lastPipelineResult, stateDynamicsProfile),
    [lastPipelineResult, stateDynamicsProfile],
  );

  // Layer 3 (5C): Expansion — feeds on 5A + 5D + 5B avg
  const expansion = useMemo(() => {
    if (checkInsCount < 1) return null;
    const mode = lastPipelineResult?.stateInterpretation.currentMode ?? "STABILIZING";
    const trajectory = momentumModel.underlyingTrajectory ?? "STABLE";
    return computeExpansionDecision(
      {
        momentumModel,
        stateDynamics,
        dynamicsProfile: stateDynamicsProfile,
        avoidancePressure,
        taskCompatibilityAvgScore: taskCompatibility?.averageScore ?? null,
        recoveryMode,
        streakAtRisk: streakCtx.atRisk,
        consistency: consistency7,
        recoveryDebtAccumulating: w14Metrics?.recoveryDebtAccumulating ?? false,
        checkInsCount,
      },
      mode,
      trajectory,
    );
  }, [
    momentumModel,
    stateDynamics,
    stateDynamicsProfile,
    avoidancePressure,
    taskCompatibility,
    recoveryMode,
    streakCtx,
    consistency7,
    w14Metrics,
    checkInsCount,
    lastPipelineResult,
  ]);

  // Synthesis
  const composite = useMemo(
    () => synthesize(avoidance, momentumModel, expansion),
    [avoidance, momentumModel, expansion],
  );

  const dataReadiness = useMemo(
    () => ({
      checkInsCount,
      stage: deriveStage(checkInsCount),
      hasMinimumData: checkInsCount >= 2,
      isFullyCalibrated: checkInsCount >= 14,
    }),
    [checkInsCount],
  );

  return {
    avoidance,
    momentum: momentumModel,
    expansion,
    taskCompatibility,
    composite,
    dataReadiness,
  };
}

// ---------------------------------------------------------------------------
// Narrow selectors
// ---------------------------------------------------------------------------

export function useBehavioralAvoidance(): AvoidanceProfile | null {
  return useBehavioralIntelligence().avoidance;
}

export function useBehavioralMomentum(): MomentumModel {
  return useBehavioralIntelligence().momentum;
}

export function useBehavioralExpansion(): ExpansionDecision | null {
  return useBehavioralIntelligence().expansion;
}

export function useBehavioralReadiness(): BehavioralIntelligence["dataReadiness"] {
  return useBehavioralIntelligence().dataReadiness;
}
