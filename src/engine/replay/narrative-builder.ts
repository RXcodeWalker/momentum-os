import type { BehavioralEvidence } from "@/core/contracts/history/evidence";
import type { BehavioralEvent, BehavioralEventType } from "@/core/contracts/history/event";
import type { ReplayWindowScope } from "@/core/contracts/replay/window";
import { REPLAY_WINDOW_CONFIG } from "@/core/contracts/replay/window";
import type { ReplayEntry, ReplayEntrySignificance } from "@/core/contracts/replay/entry";
import { NARRATIVE_RULES } from "@/core/contracts/replay/entry";
import type { ReplayNarrative } from "@/core/contracts/replay/narrative";
import type { SectionSuppressionMap } from "./evidence-gate";
import { guardAllText } from "./language-guard";
import type { TrustViolation } from "@/core/contracts/replay/result";

function scopeStartDate(scope: ReplayWindowScope): string {
  const days = scope === "W7" ? 7 : scope === "W14" ? 14 : 28;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function countEventTypeInWindow(
  events: BehavioralEvent[],
  type: BehavioralEventType,
  start: string,
): number {
  return events.filter((e) => e.eventType === type && e.sessionDate >= start).length;
}

function eventToEntry(
  event: BehavioralEvent,
  blockerCountInWindow: number,
  distractionCountInWindow: number,
): ReplayEntry | null {
  const { eventType, occurredAt, sessionDate, payload } = event;
  const entryId = `${eventType}-${sessionDate}`;

  if ((NARRATIVE_RULES.excludedEventTypes as readonly string[]).includes(eventType)) return null;

  switch (eventType) {
    case "CHECK_IN_COMPLETED": {
      const p = payload as { score: number; delta: number };
      if (Math.abs(p.delta) < NARRATIVE_RULES.checkInScoreDeltaThreshold) return null;
      const significance: ReplayEntrySignificance = Math.abs(p.delta) >= 15 ? "HIGH" : "MEDIUM";
      const direction = p.delta > 0 ? "up" : "down";
      return {
        entryId,
        kind: "EVENT",
        sourceEventType: eventType,
        periodType: null,
        occurredAt,
        sessionDate,
        headline: `Score moved ${direction} ${Math.abs(p.delta)} points to ${p.score}`,
        detail: null,
        significance,
        numericContext: p.score,
      };
    }
    case "SCORE_THRESHOLD_CROSSED": {
      const p = payload as { threshold: number; direction: "above" | "below"; score: number };
      const significance: ReplayEntrySignificance =
        p.threshold === 60 || p.threshold === 45 ? "HIGH" : "MEDIUM";
      return {
        entryId,
        kind: "THRESHOLD_CROSSING",
        sourceEventType: eventType,
        periodType: null,
        occurredAt,
        sessionDate,
        headline: `Score crossed ${p.threshold} — ${p.direction === "above" ? "above" : "below"} threshold`,
        detail: null,
        significance,
        numericContext: p.score,
      };
    }
    case "STREAK_MILESTONE": {
      const p = payload as { streakType: string; milestone: number };
      return {
        entryId,
        kind: "EVENT",
        sourceEventType: eventType,
        periodType: null,
        occurredAt,
        sessionDate,
        headline: `${p.streakType === "execution" ? "Execution" : "Resilience"} streak reached ${p.milestone} days`,
        detail: null,
        significance: "HIGH",
        numericContext: p.milestone,
      };
    }
    case "RECOVERY_TRIGGERED": {
      return {
        entryId,
        kind: "EVENT",
        sourceEventType: eventType,
        periodType: "RECOVERY",
        occurredAt,
        sessionDate,
        headline: "Recovery mode was activated",
        detail: null,
        significance: "HIGH",
        numericContext: null,
      };
    }
    case "RECOVERY_EXITED": {
      const p = payload as { daysInRecovery: number };
      return {
        entryId,
        kind: "EVENT",
        sourceEventType: eventType,
        periodType: null,
        occurredAt,
        sessionDate,
        headline: `Recovery mode exited after ${p.daysInRecovery} day${p.daysInRecovery === 1 ? "" : "s"}`,
        detail: null,
        significance: "HIGH",
        numericContext: p.daysInRecovery,
      };
    }
    case "INSIGHT_COMMITTED": {
      return {
        entryId,
        kind: "EVENT",
        sourceEventType: eventType,
        periodType: null,
        occurredAt,
        sessionDate,
        headline: "Committed to a behavioral insight",
        detail: null,
        significance: "MEDIUM",
        numericContext: null,
      };
    }
    case "BLOCKER_CAPTURED": {
      if (blockerCountInWindow < NARRATIVE_RULES.blockerMinOccurrences) return null;
      const p = payload as { blockerType: string };
      return {
        entryId,
        kind: "EVENT",
        sourceEventType: eventType,
        periodType: null,
        occurredAt,
        sessionDate,
        headline: `Repeated blocker pattern: ${p.blockerType}`,
        detail: null,
        significance: "LOW",
        numericContext: blockerCountInWindow,
      };
    }
    case "DISTRACTION_LOGGED": {
      if (distractionCountInWindow < NARRATIVE_RULES.distractionMinOccurrences) return null;
      return {
        entryId,
        kind: "EVENT",
        sourceEventType: eventType,
        periodType: null,
        occurredAt,
        sessionDate,
        headline: `Distractions logged repeatedly this window`,
        detail: null,
        significance: "LOW",
        numericContext: distractionCountInWindow,
      };
    }
    case "TASK_RESCHEDULED": {
      const p = payload as { rescheduledCount: number };
      if (p.rescheduledCount < NARRATIVE_RULES.taskRescheduledMinCount) return null;
      return {
        entryId,
        kind: "EVENT",
        sourceEventType: eventType,
        periodType: null,
        occurredAt,
        sessionDate,
        headline: `A task was rescheduled ${p.rescheduledCount} times`,
        detail: null,
        significance: "LOW",
        numericContext: p.rescheduledCount,
      };
    }
    default:
      return null;
  }
}

export function buildNarrative(
  evidence: BehavioralEvidence,
  scope: ReplayWindowScope,
  suppressionMap: SectionSuppressionMap,
  existingViolations: TrustViolation[],
): { narrative: ReplayNarrative; violations: TrustViolation[] } {
  const gate = suppressionMap.narrative;
  if (gate.suppressed) {
    return {
      narrative: {
        windowScope: scope,
        entries: [],
        windowSummary: {
          avgExecutionScore: 0,
          momentumDirection: "STABLE",
          evidenceDays: 0,
          scopeLabel: REPLAY_WINDOW_CONFIG[scope].label,
        },
        confidence: "LOW",
        suppressed: true,
        suppressionReason: gate.reason,
      },
      violations: [],
    };
  }

  const startDate = scopeStartDate(scope);
  const windowEvents = evidence.recentEvents.filter((e) => e.sessionDate >= startDate);

  const blockerCount = countEventTypeInWindow(windowEvents, "BLOCKER_CAPTURED", startDate);
  const distractionCount = countEventTypeInWindow(windowEvents, "DISTRACTION_LOGGED", startDate);

  const candidates: ReplayEntry[] = [];
  for (const event of windowEvents) {
    const entry = eventToEntry(event, blockerCount, distractionCount);
    if (entry) candidates.push(entry);
  }

  // Inject PERIOD_START if activePeriod.startDate falls within window
  if (evidence.activePeriod?.startDate && evidence.activePeriod.startDate >= startDate) {
    const period = evidence.activePeriod;
    candidates.push({
      entryId: `PERIOD_START-${period.startDate}`,
      kind: "PERIOD_START",
      sourceEventType: null,
      periodType: period.periodType,
      occurredAt: period.startDate + "T00:00:00Z",
      sessionDate: period.startDate,
      headline: `${period.periodType} period began`,
      detail: null,
      significance: "MEDIUM",
      numericContext: null,
    });
  }

  // Deduplicate: same kind within 2 days — keep higher significance
  const sigOrder: Record<ReplayEntrySignificance, number> = { HIGH: 2, MEDIUM: 1, LOW: 0 };
  const deduped: ReplayEntry[] = [];
  for (const entry of candidates) {
    const dupe = deduped.find(
      (e) =>
        e.kind === entry.kind &&
        Math.abs(
          (new Date(e.sessionDate).getTime() - new Date(entry.sessionDate).getTime()) / 86400000,
        ) <= NARRATIVE_RULES.deduplicationWindowDays,
    );
    if (dupe) {
      if (sigOrder[entry.significance] > sigOrder[dupe.significance]) {
        deduped.splice(deduped.indexOf(dupe), 1, entry);
      }
    } else {
      deduped.push(entry);
    }
  }

  // Sort chronologically, trim to max
  deduped.sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));
  const maxEntries = NARRATIVE_RULES.maxEntriesPerWindow[scope];
  const trimmed = deduped.slice(0, maxEntries);

  // Guard all text
  const snapshotKey = scope === "W7" ? "W7" : scope === "W14" ? "W14" : "W28";
  const snapshot = evidence.snapshots[snapshotKey];
  const guarded = guardAllText(
    trimmed.map((e) => ({ text: e.headline, section: "narrative" as const })),
  );
  const guardedEntries = trimmed.map((e, i) => ({
    ...e,
    headline: guarded.results[i].text,
  }));

  const violations = [...existingViolations, ...guarded.violations];

  return {
    narrative: {
      windowScope: scope,
      entries: guardedEntries,
      windowSummary: {
        avgExecutionScore: snapshot?.metrics.avgExecutionScore ?? 0,
        momentumDirection: evidence.derivedMetrics.momentumDirection,
        evidenceDays: snapshot?.evidenceDays ?? 0,
        scopeLabel: REPLAY_WINDOW_CONFIG[scope].label,
      },
      confidence: evidence.summary.confidence.band,
      suppressed: false,
      suppressionReason: null,
    },
    violations,
  };
}
