import type { DayData, CheckIn, BlockerRecord, DistractionLogEntry } from "@/lib/store";
import type { BehavioralPeriod } from "@/core/contracts/history/period";
import type { DetectedPattern } from "@/core/contracts/patterns/pattern";
import type { PatternObservation } from "@/core/contracts/patterns/evidence";
import type { PatternDetectionProfile } from "@/core/contracts/patterns/profile";
import type { ConfidenceBand } from "@/core/contracts/primitives";
import { PATTERN_WINDOW_DAYS } from "@/core/contracts/patterns/window";
import { PATTERN_TEMPLATES } from "./pattern-templates";
import type { DayContext } from "./condition-evaluators";
import { evaluateCondition } from "./condition-evaluators";
import { computeAssociation, buildEvidence } from "./association";
import { computePatternConfidence } from "./confidence";
import { buildSuppressionAdvisory } from "./suppression";
import { resolveStatus } from "./decay";
import { generateExplanation } from "./explanation";

function cutoffDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function buildDayContexts(
  history: DayData[],
  checkIns: CheckIn[],
  blockerHistory: BlockerRecord[],
  distractionLog: DistractionLogEntry[],
  windowDays: number,
): DayContext[] {
  const cutoff = cutoffDate(windowDays);
  const windowHistory = history.filter((d) => d.date >= cutoff);

  const checkInMap = new Map(checkIns.map((c) => [c.date, c]));
  const distractionMap = new Map(distractionLog.map((d) => [d.date, d]));

  return windowHistory.map((day, idx) => {
    const prevDay = idx > 0 ? windowHistory[idx - 1] : null;
    const prevPrevDay = idx > 1 ? windowHistory[idx - 2] : null;
    const dayBlockers = blockerHistory.filter((b) => b.date === day.date);
    return {
      day,
      prevDay,
      prevPrevDay,
      checkIn: checkInMap.get(day.date) ?? null,
      blockers: dayBlockers,
      distractionEntry: distractionMap.get(day.date) ?? null,
    };
  });
}

export function detectPatterns(
  history: DayData[],
  checkIns: CheckIn[],
  blockerHistory: BlockerRecord[],
  distractionLog: DistractionLogEntry[],
  _periods: BehavioralPeriod[],
): PatternDetectionProfile {
  const now = new Date().toISOString();

  if (history.length < 14) {
    return emptyProfile(now);
  }

  // Build observations for each template first (needed for co-varying detection)
  const templateObservationsMap = new Map<string, PatternObservation[]>();

  for (const template of PATTERN_TEMPLATES) {
    const windowDays = PATTERN_WINDOW_DAYS[template.lookbackWindow];
    const contexts = buildDayContexts(
      history,
      checkIns,
      blockerHistory,
      distractionLog,
      windowDays,
    );

    const observations: PatternObservation[] = [];
    for (const ctx of contexts) {
      const ant = evaluateCondition(template.antecedent, ctx);
      const cons = evaluateCondition(template.consequent, ctx);
      observations.push({
        date: ctx.day.date,
        antecedentPresent: ant.present,
        consequentPresent: cons.present,
        magnitude: ant.present ? cons.magnitude : null,
      });
    }
    templateObservationsMap.set(template.templateId, observations);
  }

  const patterns: DetectedPattern[] = [];

  for (const template of PATTERN_TEMPLATES) {
    const windowDays = PATTERN_WINDOW_DAYS[template.lookbackWindow];
    const observations = templateObservationsMap.get(template.templateId) ?? [];

    if (observations.length < template.minWindowDays) continue;

    const antecedentDays = observations.filter((o) => o.antecedentPresent);
    if (antecedentDays.length === 0) continue;

    const evidence = buildEvidence(observations);
    const association = computeAssociation(observations, template, templateObservationsMap);
    const confidence = computePatternConfidence(
      evidence,
      association,
      template.minSupport,
      windowDays,
    );
    const explanation = generateExplanation(template, association, confidence, evidence);

    const firstDate = observations[0]?.date ?? now.slice(0, 10);
    const lastDate = observations[observations.length - 1]?.date ?? now.slice(0, 10);

    const patternId = `${template.templateId}-${firstDate}`;

    const patternWindow = {
      windowKey: template.lookbackWindow,
      windowDays,
      evidenceDays: observations.length,
      firstDate,
      lastDate,
    };

    const draft: DetectedPattern = {
      patternId,
      templateId: template.templateId,
      category: template.category,
      polarity: template.polarity,
      label: template.label,
      evidence,
      association,
      confidence,
      window: patternWindow,
      status: "EMERGING", // resolved below
      explanation,
      interventionEligible: false,
      firstObservedAt: firstDate,
      lastObservedAt: evidence.lastConfirmationDate ?? lastDate,
      computedAt: now,
    };

    const advisory = buildSuppressionAdvisory(draft);
    const status = resolveStatus(draft, advisory);
    patterns.push({ ...draft, status });
  }

  // De-duplicate overlapping templates: if two patterns share the same consequent
  // and one has higher confidence, mark the weaker one as SUPPRESSED (DUPLICATE)
  const activePatterns = patterns
    .filter((p) => p.status === "ACTIVE")
    .sort((a, b) => b.confidence.score - a.confidence.score);

  const suppressionAdvisories = patterns.map((p) => buildSuppressionAdvisory(p));

  const dominantRiskPattern = activePatterns.find((p) => p.polarity === "RISK") ?? null;
  const dominantProtectivePattern = activePatterns.find((p) => p.polarity === "PROTECTIVE") ?? null;

  // Overall confidence band: based on active count and evidence depth
  const overallConfidence: ConfidenceBand =
    activePatterns.length >= 3 ? "HIGH" : activePatterns.length >= 1 ? "MEDIUM" : "LOW";

  return {
    patterns,
    activePatterns,
    suppressionAdvisories,
    dominantRiskPattern,
    dominantProtectivePattern,
    patternCount: activePatterns.length,
    windowDays: PATTERN_WINDOW_DAYS["P56"],
    confidence: overallConfidence,
    computedAt: now,
  };
}

function emptyProfile(now: string): PatternDetectionProfile {
  return {
    patterns: [],
    activePatterns: [],
    suppressionAdvisories: [],
    dominantRiskPattern: null,
    dominantProtectivePattern: null,
    patternCount: 0,
    windowDays: PATTERN_WINDOW_DAYS["P56"],
    confidence: "LOW",
    computedAt: now,
  };
}
