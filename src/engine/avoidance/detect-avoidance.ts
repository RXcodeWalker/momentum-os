import type {
  AvoidanceProfile,
  AvoidancePatternId,
  DetectedAvoidancePattern,
  AvoidanceEvidence,
} from "@/core/contracts/avoidance";
import type { ConfidenceBand, RiskLevel } from "@/core/contracts/primitives";
import type { CheckIn, Task, BlockerRecord, DistractionLogEntry, DayData } from "@/lib/store";
import {
  PATTERN_CONFIGS,
  SEVERITY_THRESHOLDS,
  AVOIDANCE_DETECTION_THRESHOLD,
  PREP_TASK_KEYWORDS,
  CONFIDENCE_BAND_THRESHOLDS,
} from "./pattern-configs";

export type AvoidanceDetectionInputs = {
  tasks: Task[];
  checkIns: CheckIn[];
  history: DayData[];
  blockerHistory: BlockerRecord[];
  distractionLog: DistractionLogEntry[];
  recoveryMode: boolean;
  windowDays?: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function windowDateStr(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

function severityFromScore(score: number): RiskLevel {
  if (score >= SEVERITY_THRESHOLDS.CRITICAL) return "CRITICAL";
  if (score >= SEVERITY_THRESHOLDS.HIGH) return "HIGH";
  if (score >= SEVERITY_THRESHOLDS.MODERATE) return "MODERATE";
  return "LOW";
}

function confidenceBandFromCheckInCount(count: number): ConfidenceBand {
  if (count >= CONFIDENCE_BAND_THRESHOLDS.HIGH) return "HIGH";
  if (count >= CONFIDENCE_BAND_THRESHOLDS.MEDIUM_LOWER) return "MEDIUM";
  return "LOW";
}

function stepDownConfidence(band: ConfidenceBand, steps: number): ConfidenceBand {
  const ladder: ConfidenceBand[] = ["HIGH", "MEDIUM", "LOW"];
  const idx = ladder.indexOf(band);
  return ladder[Math.min(ladder.length - 1, idx + steps)];
}

function stepUpConfidence(band: ConfidenceBand): ConfidenceBand {
  const ladder: ConfidenceBand[] = ["HIGH", "MEDIUM", "LOW"];
  const idx = ladder.indexOf(band);
  return ladder[Math.max(0, idx - 1)];
}

function isPrepTask(label: string): boolean {
  const lower = label.toLowerCase();
  return PREP_TASK_KEYWORDS.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// MAINTENANCE_LOOP detector
// ---------------------------------------------------------------------------

function detectMaintenanceLoop(
  tasks: Task[],
  checkIns: CheckIn[],
  history: DayData[],
  blockerHistory: BlockerRecord[],
  windowStart: string,
): { score: number; evidence: AvoidanceEvidence[]; durationDays: number } {
  const recentCheckIns = checkIns.filter((c) => c.date >= windowStart);
  const recentHistory = history.filter((d) => d.date >= windowStart);

  const completedTasks = tasks.filter((t) => t.done);
  const plannedDeep = tasks.filter((t) => t.type === "deep").length;
  const completedDeep = completedTasks.filter((t) => t.type === "deep").length;
  const completedAdmin = completedTasks.filter(
    (t) => t.type === "admin" || t.type === "shallow",
  ).length;

  const deepCompletionRate = plannedDeep > 0 ? completedDeep / plannedDeep : 1;
  const deepCompletionDeficit = clamp(1 - deepCompletionRate, 0, 1);
  const deepCompletionSignal = deepCompletionDeficit >= 0.4 ? deepCompletionDeficit : 0;

  const negativeProgressCount = recentCheckIns.filter(
    (c) => c.meaningfulProgress === "no" || c.meaningfulProgress === "partial",
  ).length;
  const negativeProgressRate =
    recentCheckIns.length > 0 ? negativeProgressCount / recentCheckIns.length : 0;
  const negativeProgressSignal = negativeProgressRate >= 0.4 ? negativeProgressRate : 0;

  const deepRescheduledTasks = tasks.filter((t) => t.type === "deep" && (t.rescheduled ?? 0) >= 2);
  const deepRescheduledSignal =
    deepRescheduledTasks.length > 0
      ? clamp(deepRescheduledTasks.length / Math.max(1, plannedDeep), 0, 1)
      : 0;

  const totalCompleted = completedTasks.length;
  const adminHeavyRatio = totalCompleted > 0 ? completedAdmin / totalCompleted : 0;
  const adminHeavySignal = adminHeavyRatio >= 0.6 ? adminHeavyRatio : 0;

  const config = PATTERN_CONFIGS.MAINTENANCE_LOOP;
  const score = clamp(
    deepCompletionSignal * config.signals[0].weight +
      negativeProgressSignal * config.signals[1].weight +
      deepRescheduledSignal * config.signals[2].weight +
      adminHeavySignal * config.signals[3].weight,
    0,
    1,
  );

  const evidence: AvoidanceEvidence[] = [
    {
      signal: "deep_completion_deficit",
      value: deepCompletionDeficit,
      threshold: 0.4,
      weight: 0.35,
      description: config.signals[0].descriptionTemplate,
    },
    {
      signal: "meaningful_progress_negative_rate",
      value: negativeProgressRate,
      threshold: 0.4,
      weight: 0.3,
      description: config.signals[1].descriptionTemplate,
    },
    {
      signal: "deep_rescheduled_count",
      value: deepRescheduledTasks.length,
      threshold: 1,
      weight: 0.2,
      description: config.signals[2].descriptionTemplate,
    },
    {
      signal: "admin_heavy_completion_ratio",
      value: adminHeavyRatio,
      threshold: 0.6,
      weight: 0.15,
      description: config.signals[3].descriptionTemplate,
    },
  ];

  const durationDays = recentHistory.length;

  return { score, evidence, durationDays };
}

// ---------------------------------------------------------------------------
// PREPARATION_ESCAPE detector
// ---------------------------------------------------------------------------

function detectPreparationEscape(
  tasks: Task[],
  checkIns: CheckIn[],
  blockerHistory: BlockerRecord[],
  windowStart: string,
): { score: number; evidence: AvoidanceEvidence[]; durationDays: number } {
  const recentCheckIns = checkIns.filter((c) => c.date >= windowStart);

  const completedTasks = tasks.filter((t) => t.done);
  const completedPrep = completedTasks.filter((t) => isPrepTask(t.label));
  const prepDominanceRatio =
    completedTasks.length > 0 ? completedPrep.length / completedTasks.length : 0;
  const prepDominanceSignal = prepDominanceRatio >= 0.5 ? prepDominanceRatio : 0;

  const noProgressWithCompletionCount = recentCheckIns.filter((c) => {
    const hasCompletion = c.completed > 0;
    const noProgress = c.meaningfulProgress === "no";
    return hasCompletion && noProgress;
  }).length;
  const concurrentNegativeRate =
    recentCheckIns.length > 0 ? noProgressWithCompletionCount / recentCheckIns.length : 0;
  const concurrentNegativeSignal = concurrentNegativeRate >= 0.4 ? concurrentNegativeRate : 0;

  const recentBlockers = blockerHistory.filter((b) => b.date >= windowStart);
  const deepBlockers = recentBlockers.filter((b) => b.taskType === "deep");
  const deepBlockerRate =
    recentCheckIns.length > 0 ? deepBlockers.length / Math.max(1, recentCheckIns.length) : 0;
  const deepBlockerSignal = deepBlockerRate >= 0.3 ? clamp(deepBlockerRate, 0, 1) : 0;

  // No advancement follow-through: prep days not followed by deep task completion
  const prepDayCount = recentCheckIns.filter((c) => {
    const doneTasks = tasks.filter((t) => t.done && isPrepTask(t.label));
    return doneTasks.length > 0 && c.meaningfulProgress !== "yes";
  }).length;
  const noFollowThroughSignal =
    prepDayCount > 0 && completedTasks.filter((t) => t.type === "deep").length === 0
      ? clamp(prepDayCount / Math.max(1, recentCheckIns.length), 0, 1)
      : 0;

  const config = PATTERN_CONFIGS.PREPARATION_ESCAPE;
  const score = clamp(
    prepDominanceSignal * config.signals[0].weight +
      concurrentNegativeSignal * config.signals[1].weight +
      noFollowThroughSignal * config.signals[2].weight +
      deepBlockerSignal * config.signals[3].weight,
    0,
    1,
  );

  const evidence: AvoidanceEvidence[] = [
    {
      signal: "prep_task_dominance_ratio",
      value: prepDominanceRatio,
      threshold: 0.5,
      weight: 0.3,
      description: config.signals[0].descriptionTemplate,
    },
    {
      signal: "meaningful_progress_negative_concurrent",
      value: concurrentNegativeRate,
      threshold: 0.4,
      weight: 0.25,
      description: config.signals[1].descriptionTemplate,
    },
    {
      signal: "no_advancement_follow_through",
      value: noFollowThroughSignal,
      threshold: 0.5,
      weight: 0.25,
      description: config.signals[2].descriptionTemplate,
    },
    {
      signal: "deep_task_blocker_rate",
      value: deepBlockerRate,
      threshold: 0.3,
      weight: 0.2,
      description: config.signals[3].descriptionTemplate,
    },
  ];

  return { score, evidence, durationDays: recentCheckIns.length };
}

// ---------------------------------------------------------------------------
// FRAGMENTATION_ESCAPE detector
// ---------------------------------------------------------------------------

function detectFragmentationEscape(
  tasks: Task[],
  checkIns: CheckIn[],
  distractionLog: DistractionLogEntry[],
  windowStart: string,
): { score: number; evidence: AvoidanceEvidence[]; durationDays: number } {
  const recentCheckIns = checkIns.filter((c) => c.date >= windowStart);
  const recentDistractions = distractionLog.filter((d) => d.date >= windowStart);

  const completedTasks = tasks.filter((t) => t.done);
  const avgEstMin = completedTasks.length > 0 ? avg(completedTasks.map((t) => t.estMin)) : 30;
  const taskSizeSignal =
    avgEstMin < 20 && completedTasks.length >= 5 ? clamp(1 - avgEstMin / 20, 0, 1) : 0;

  const highCompletionLowFocusDays = recentCheckIns.filter((c) => {
    const completionRatio = c.planned > 0 ? c.completed / c.planned : 0;
    return completionRatio >= 0.7 && c.focus <= 5;
  }).length;
  const focusSignal =
    recentCheckIns.length > 0 ? clamp(highCompletionLowFocusDays / recentCheckIns.length, 0, 1) : 0;
  const focusSignalNorm = focusSignal >= 0.3 ? focusSignal : 0;

  const allDistractionTypes = new Set(recentDistractions.flatMap((d) => d.types));
  const distractionTypeDensity = allDistractionTypes.size;
  const distractionSignal =
    distractionTypeDensity >= 3 ? clamp((distractionTypeDensity - 2) / 5, 0, 1) : 0;

  const taskTypes = new Set(completedTasks.map((t) => t.type));
  const typeSwitchCount = taskTypes.size;
  const taskTypeSwitchSignal = typeSwitchCount >= 3 ? clamp((typeSwitchCount - 2) / 3, 0, 1) : 0;

  const config = PATTERN_CONFIGS.FRAGMENTATION_ESCAPE;
  const score = clamp(
    taskSizeSignal * config.signals[0].weight +
      focusSignalNorm * config.signals[1].weight +
      distractionSignal * config.signals[2].weight +
      taskTypeSwitchSignal * config.signals[3].weight,
    0,
    1,
  );

  const evidence: AvoidanceEvidence[] = [
    {
      signal: "avg_task_size_below_threshold",
      value: avgEstMin,
      threshold: 20,
      weight: 0.3,
      description: config.signals[0].descriptionTemplate,
    },
    {
      signal: "low_focus_on_high_completion_days",
      value: highCompletionLowFocusDays,
      threshold: 1,
      weight: 0.25,
      description: config.signals[1].descriptionTemplate,
    },
    {
      signal: "distraction_type_density",
      value: distractionTypeDensity,
      threshold: 3,
      weight: 0.25,
      description: config.signals[2].descriptionTemplate,
    },
    {
      signal: "task_type_switch_rate",
      value: typeSwitchCount,
      threshold: 3,
      weight: 0.2,
      description: config.signals[3].descriptionTemplate,
    },
  ];

  return { score, evidence, durationDays: recentCheckIns.length };
}

// ---------------------------------------------------------------------------
// ADVANCEMENT_DEFERRAL detector
// ---------------------------------------------------------------------------

function detectAdvancementDeferral(
  tasks: Task[],
  checkIns: CheckIn[],
  history: DayData[],
  windowStart: string,
): { score: number; evidence: AvoidanceEvidence[]; durationDays: number } {
  const recentCheckIns = checkIns.filter((c) => c.date >= windowStart);
  const last5 = recentCheckIns.slice(-5);

  const noProgressCount = last5.filter((c) => c.meaningfulProgress === "no").length;
  const noProgressRate = last5.length > 0 ? noProgressCount / last5.length : 0;
  const sustainedNegativeSignal = noProgressRate >= 0.6 ? noProgressRate : 0;

  const deepTasksRescheduled = tasks.filter((t) => t.type === "deep" && (t.rescheduled ?? 0) >= 2);
  const deepRescheduledSignal =
    deepTasksRescheduled.length > 0
      ? clamp(
          deepTasksRescheduled.length / Math.max(1, tasks.filter((t) => t.type === "deep").length),
          0,
          1,
        )
      : 0;

  const recentHistory = history.filter((d) => d.date >= windowStart);
  const avgCompletionRatio =
    recentHistory.length > 0
      ? avg(recentHistory.map((d) => (d.planned > 0 ? d.completed / d.planned : 0)))
      : 0;
  // Completion acceptable (not a capacity failure) contributes positively to the pattern score
  const completionAcceptableSignal =
    avgCompletionRatio >= 0.5 ? clamp(avgCompletionRatio, 0, 1) : 0;

  // Energy not depleted on low-progress days
  const lowProgressDays = last5.filter((c) => c.meaningfulProgress === "no");
  const avgEnergyOnLowDays =
    lowProgressDays.length > 0 ? avg(lowProgressDays.map((c) => c.energy)) : 0;
  const energyNotDepletedSignal =
    avgEnergyOnLowDays >= 5 ? clamp((avgEnergyOnLowDays - 4) / 6, 0, 1) : 0;

  const config = PATTERN_CONFIGS.ADVANCEMENT_DEFERRAL;
  const score = clamp(
    sustainedNegativeSignal * config.signals[0].weight +
      deepRescheduledSignal * config.signals[1].weight +
      completionAcceptableSignal * config.signals[2].weight +
      energyNotDepletedSignal * config.signals[3].weight,
    0,
    1,
  );

  const evidence: AvoidanceEvidence[] = [
    {
      signal: "meaningful_progress_sustained_negative",
      value: noProgressCount,
      threshold: 3,
      weight: 0.35,
      description: config.signals[0].descriptionTemplate,
    },
    {
      signal: "deep_tasks_persistently_rescheduled",
      value: deepTasksRescheduled.length,
      threshold: 1,
      weight: 0.3,
      description: config.signals[1].descriptionTemplate,
    },
    {
      signal: "completion_ratio_acceptable",
      value: Math.round(avgCompletionRatio * 100),
      threshold: 50,
      weight: 0.2,
      description: config.signals[2].descriptionTemplate,
    },
    {
      signal: "energy_not_depleted_on_low_progress_days",
      value: Math.round(avgEnergyOnLowDays * 10) / 10,
      threshold: 5,
      weight: 0.15,
      description: config.signals[3].descriptionTemplate,
    },
  ];

  return { score, evidence, durationDays: last5.length };
}

// ---------------------------------------------------------------------------
// Confidence adjustment
// ---------------------------------------------------------------------------

function applyConfidenceModifiers(
  baseBand: ConfidenceBand,
  options: {
    recoveryMode: boolean;
    avgSleepInWindow: number;
    allSignalsSingleDay: boolean;
    weekendDaysInWindow: number;
    independentSignalsAgreeing: number;
  },
): ConfidenceBand {
  let steps = 0;

  if (options.recoveryMode) steps += 1;
  if (options.avgSleepInWindow < 6) steps += 1;
  if (options.allSignalsSingleDay) steps += 1;
  if (options.weekendDaysInWindow >= 2) steps += 0.5;

  let band = stepDownConfidence(baseBand, Math.round(steps));

  if (options.independentSignalsAgreeing >= 3) {
    band = stepUpConfidence(band);
  }

  return band;
}

// ---------------------------------------------------------------------------
// Observational summary builder
// ---------------------------------------------------------------------------

function buildObservationalSummary(
  activePatterns: AvoidancePatternId[],
  overallPressure: number,
): string {
  if (activePatterns.length === 0) {
    return "Activity patterns appear balanced across task types over the observed window.";
  }

  const fragments: string[] = [];

  if (activePatterns.includes("MAINTENANCE_LOOP")) {
    fragments.push(
      "Completion activity has been concentrated in shorter admin and shallow tasks. Deeper work items have been rescheduled multiple times.",
    );
  }
  if (activePatterns.includes("PREPARATION_ESCAPE")) {
    fragments.push(
      "Preparation-oriented tasks appear in the completed set more frequently than advancement tasks over recent days.",
    );
  }
  if (activePatterns.includes("FRAGMENTATION_ESCAPE")) {
    fragments.push(
      "Task completion is spread across many brief items. Focus ratings are lower on days with high completion counts.",
    );
  }
  if (activePatterns.includes("ADVANCEMENT_DEFERRAL")) {
    fragments.push(
      "Meaningful advancement has been noted as absent across multiple recent check-ins, while completion activity and energy remain at normal levels.",
    );
  }

  return fragments.join(" ");
}

// ---------------------------------------------------------------------------
// Main detection function
// ---------------------------------------------------------------------------

export function detectAvoidance(inputs: AvoidanceDetectionInputs): AvoidanceProfile | null {
  const windowDays = inputs.windowDays ?? 7;
  const windowStart = windowDateStr(windowDays);

  const recentCheckIns = inputs.checkIns.filter((c) => c.date >= windowStart);
  const checkInsInWindow = recentCheckIns.length;

  if (checkInsInWindow < 2) return null;

  const recentHistory = inputs.history.filter((d) => d.date >= windowStart);
  const avgSleep = recentHistory.length > 0 ? avg(recentHistory.map((d) => d.sleepHours)) : 7;

  // Weekend days in window
  const weekendDays = recentHistory.filter((d) => {
    const dow = new Date(d.date).getDay();
    return dow === 0 || dow === 6;
  }).length;

  const now = new Date().toISOString();

  // Run sub-detectors
  const maintenanceResult = detectMaintenanceLoop(
    inputs.tasks,
    inputs.checkIns,
    inputs.history,
    inputs.blockerHistory,
    windowStart,
  );
  const preparationResult = detectPreparationEscape(
    inputs.tasks,
    inputs.checkIns,
    inputs.blockerHistory,
    windowStart,
  );
  const fragmentationResult = detectFragmentationEscape(
    inputs.tasks,
    inputs.checkIns,
    inputs.distractionLog,
    windowStart,
  );
  const advancementResult = detectAdvancementDeferral(
    inputs.tasks,
    inputs.checkIns,
    inputs.history,
    windowStart,
  );

  const rawScores: Record<AvoidancePatternId, number> = {
    MAINTENANCE_LOOP: maintenanceResult.score,
    PREPARATION_ESCAPE: preparationResult.score,
    FRAGMENTATION_ESCAPE: fragmentationResult.score,
    ADVANCEMENT_DEFERRAL: advancementResult.score,
  };

  const baseBand = confidenceBandFromCheckInCount(checkInsInWindow);

  // Build pattern objects
  const patterns: DetectedAvoidancePattern[] = (
    Object.entries(rawScores) as [AvoidancePatternId, number][]
  ).map(([id, score]) => {
    const detected = score >= AVOIDANCE_DETECTION_THRESHOLD;
    const severity: RiskLevel = detected ? severityFromScore(score) : "LOW";

    const resultMap = {
      MAINTENANCE_LOOP: maintenanceResult,
      PREPARATION_ESCAPE: preparationResult,
      FRAGMENTATION_ESCAPE: fragmentationResult,
      ADVANCEMENT_DEFERRAL: advancementResult,
    };
    const result = resultMap[id];

    // Count how many sub-signals exceed threshold
    const evidenceAboveThreshold = result.evidence.filter((e) => e.value >= e.threshold).length;

    const confidence = applyConfidenceModifiers(baseBand, {
      recoveryMode: inputs.recoveryMode,
      avgSleepInWindow: avgSleep,
      allSignalsSingleDay: checkInsInWindow === 1,
      weekendDaysInWindow: weekendDays,
      independentSignalsAgreeing: evidenceAboveThreshold,
    });

    // Cap severity to LOW if confidence is LOW and score > 0.70
    const finalSeverity: RiskLevel = confidence === "LOW" && score > 0.7 ? "LOW" : severity;

    return {
      id,
      detected,
      confidence,
      severity: finalSeverity,
      evidence: result.evidence,
      durationDays: result.durationDays,
      observedAt: now,
    };
  });

  const activePatterns = patterns.filter((p) => p.detected).map((p) => p.id);

  // Overall avoidance pressure
  const activeScores = activePatterns.map((id) => rawScores[id]);
  let overallAvoidancePressure = 0;
  if (activeScores.length > 0) {
    const maxScore = Math.max(...activeScores);
    const avgScore = avg(activeScores);
    overallAvoidancePressure = Math.round((maxScore * 0.6 + avgScore * 0.4) * 100);
  }

  // Recovery grace: if the user completed deep work AND reported meaningful progress
  // in the most recent check-in, apply a 20% proportional pressure reduction.
  // Both conditions must hold simultaneously to prevent single-signal resets.
  const lastCheckIn = inputs.checkIns[inputs.checkIns.length - 1];
  const hasRecentMeaningfulProgress = lastCheckIn?.meaningfulProgress === "yes";
  const hasCompletedDeepWork = inputs.tasks.some((t) => t.done && t.type === "deep");
  if (hasRecentMeaningfulProgress && hasCompletedDeepWork) {
    overallAvoidancePressure = Math.round(overallAvoidancePressure * 0.8);
  }

  // Dominant pattern: highest severity active pattern, tie-break by score
  let dominantPattern: AvoidancePatternId | null = null;
  const severityRank: Record<RiskLevel, number> = { LOW: 0, MODERATE: 1, HIGH: 2, CRITICAL: 3 };
  const activeDetected = patterns.filter((p) => p.detected);
  if (activeDetected.length > 0) {
    const sorted = [...activeDetected].sort((a, b) => {
      const rankDiff = severityRank[b.severity] - severityRank[a.severity];
      if (rankDiff !== 0) return rankDiff;
      return rawScores[b.id] - rawScores[a.id];
    });
    dominantPattern = sorted[0].id;
  }

  // Minimum confidence across active patterns
  const confidenceRank: Record<ConfidenceBand, number> = { HIGH: 2, MEDIUM: 1, LOW: 0 };
  const minConfidence: ConfidenceBand =
    activeDetected.length > 0
      ? activeDetected.reduce((min, p) => {
          return confidenceRank[p.confidence] < confidenceRank[min] ? p.confidence : min;
        }, activeDetected[0].confidence)
      : baseBand;

  const observationalSummary = buildObservationalSummary(activePatterns, overallAvoidancePressure);

  return {
    patterns,
    activePatterns,
    dominantPattern,
    overallAvoidancePressure,
    observationalSummary,
    confidence: minConfidence,
    windowDays,
    checkInsInWindow,
    detectedAt: now,
  };
}
