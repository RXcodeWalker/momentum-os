import type {
  BehavioralEvent,
  BehavioralEventType,
  EventPayloadMap,
} from "@/core/contracts/history/event";
import type { CheckIn } from "@/lib/store";

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function sessionDateFromIso(iso: string): string {
  return iso.slice(0, 10);
}

function createEvent<T extends BehavioralEventType>(
  eventType: T,
  payload: EventPayloadMap[T],
  sourceAction: string,
  isBackfilled = false,
): BehavioralEvent<T> {
  const occurredAt = new Date().toISOString();
  return {
    eventId: generateId(),
    eventType,
    occurredAt,
    sessionDate: sessionDateFromIso(occurredAt),
    payload,
    sourceAction,
    isBackfilled,
  };
}

function createBackfilledEvent<T extends BehavioralEventType>(
  eventType: T,
  payload: EventPayloadMap[T],
  date: string,
): BehavioralEvent<T> {
  return {
    eventId: generateId(),
    eventType,
    occurredAt: `${date}T00:00:00.000Z`,
    sessionDate: date,
    payload,
    sourceAction: "backfill",
    isBackfilled: true,
  };
}

export function emitCheckInCompleted(
  score: number,
  delta: number,
  date: string,
  checkIn: Omit<CheckIn, "date">,
): BehavioralEvent<"CHECK_IN_COMPLETED"> {
  return createEvent(
    "CHECK_IN_COMPLETED",
    {
      score,
      delta,
      date,
      focus: checkIn.focus,
      sleepHours: checkIn.sleepHours,
      distractionCount: checkIn.distractions.length,
    },
    "saveCheckIn",
  );
}

export function emitBlockerCaptured(
  blockerType: string,
  taskType: string,
): BehavioralEvent<"BLOCKER_CAPTURED"> {
  return createEvent("BLOCKER_CAPTURED", { blockerType, taskType }, "saveCheckIn");
}

export function emitDistractionLogged(types: string[]): BehavioralEvent<"DISTRACTION_LOGGED"> {
  return createEvent("DISTRACTION_LOGGED", { types }, "saveCheckIn");
}

export function emitInsightCommitted(
  insightId: string,
  preCommitAvgScore: number,
): BehavioralEvent<"INSIGHT_COMMITTED"> {
  return createEvent("INSIGHT_COMMITTED", { insightId, preCommitAvgScore }, "commitToInsight");
}

export function emitTaskRescheduled(task: {
  id: string;
  type: string;
  rescheduled?: number;
}): BehavioralEvent<"TASK_RESCHEDULED"> {
  return createEvent(
    "TASK_RESCHEDULED",
    { taskId: task.id, taskType: task.type, rescheduledCount: (task.rescheduled ?? 0) + 1 },
    "rescheduleTask",
  );
}

export function emitRecoveryTriggered(
  reason: string,
  triggeredBy: "manual" | "pipeline",
): BehavioralEvent<"RECOVERY_TRIGGERED"> {
  return createEvent("RECOVERY_TRIGGERED", { reason, triggeredBy }, "enterRecovery");
}

export function emitRecoveryExited(daysInRecovery: number): BehavioralEvent<"RECOVERY_EXITED"> {
  return createEvent("RECOVERY_EXITED", { daysInRecovery }, "exitRecovery");
}

export function emitReflectionGenerated(
  workloadGuidance: "REDUCE" | "HOLD" | "EXPAND",
  confidenceBand: string,
): BehavioralEvent<"REFLECTION_GENERATED"> {
  return createEvent("REFLECTION_GENERATED", { workloadGuidance, confidenceBand }, "saveCheckIn");
}

export function emitScoreThresholdCrossed(
  threshold: number,
  direction: "above" | "below",
  score: number,
): BehavioralEvent<"SCORE_THRESHOLD_CROSSED"> {
  return createEvent("SCORE_THRESHOLD_CROSSED", { threshold, direction, score }, "saveCheckIn");
}

export function pruneEvents(events: BehavioralEvent[], maxAgeDays: number): BehavioralEvent[] {
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();
  return events
    .filter((e) => e.occurredAt >= cutoff)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

export function computeThresholdCrossings(
  prevScore: number,
  newScore: number,
): BehavioralEvent<"SCORE_THRESHOLD_CROSSED">[] {
  const thresholds = [45, 60, 70] as const;
  const results: BehavioralEvent<"SCORE_THRESHOLD_CROSSED">[] = [];
  for (const t of thresholds) {
    if (prevScore < t && newScore >= t) {
      results.push(emitScoreThresholdCrossed(t, "above", newScore));
    } else if (prevScore >= t && newScore < t) {
      results.push(emitScoreThresholdCrossed(t, "below", newScore));
    }
  }
  return results;
}

export { createBackfilledEvent };
