import type { DayData, BlockerRecord, DistractionLogEntry } from "@/lib/store";
import type { BehavioralEvent } from "@/core/contracts/history/event";
import type { BehavioralPeriod, BehavioralPeriodType } from "@/core/contracts/history/period";
import type { UserMode } from "@/core/contracts/state/modes";
import { createBackfilledEvent } from "./event-emitter";
import { pruneEvents } from "./event-emitter";

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

export function backfillEventsFromHistory(
  history: DayData[],
  blockerHistory: BlockerRecord[],
  distractionLog: DistractionLogEntry[],
): BehavioralEvent[] {
  const events: BehavioralEvent[] = [];

  for (const day of history) {
    events.push(
      createBackfilledEvent(
        "CHECK_IN_COMPLETED",
        {
          score: day.executionScore,
          delta: 0,
          date: day.date,
          focus: day.focus,
          sleepHours: day.sleepHours,
          distractionCount: day.distractions,
        },
        day.date,
      ),
    );
  }

  for (const blocker of blockerHistory) {
    events.push(
      createBackfilledEvent(
        "BLOCKER_CAPTURED",
        { blockerType: blocker.blockerType, taskType: blocker.taskType },
        blocker.date,
      ),
    );
  }

  for (const entry of distractionLog) {
    events.push(createBackfilledEvent("DISTRACTION_LOGGED", { types: entry.types }, entry.date));
  }

  return pruneEvents(events, 90);
}

function classifyScore(score: number): BehavioralPeriodType {
  if (score < 50) return "RECOVERY";
  if (score < 65) return "STABILIZING";
  if (score < 75) return "FOCUSED";
  return "EXPANDING";
}

function modeFromPeriodType(type: BehavioralPeriodType): UserMode {
  switch (type) {
    case "RECOVERY":
      return "RECOVERY";
    case "STABILIZING":
      return "STABILIZING";
    case "FOCUSED":
      return "FOCUSED";
    case "EXPANDING":
      return "EXPANDING";
    case "INSTABILITY":
      return "FOCUSED";
  }
}

export function backfillPeriodsFromHistory(history: DayData[]): BehavioralPeriod[] {
  if (history.length === 0) return [];

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const today = todayStr();

  // Detect INSTABILITY: 3+ consecutive days with score stdDev > 15
  function hasInstabilityAt(idx: number): boolean {
    const window = sorted.slice(Math.max(0, idx - 2), idx + 1);
    if (window.length < 3) return false;
    const scores = window.map((d) => d.executionScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, v) => a + (v - mean) ** 2, 0) / scores.length;
    return Math.sqrt(variance) > 15;
  }

  const periods: BehavioralPeriod[] = [];
  let currentType: BehavioralPeriodType | null = null;
  let periodStart: string | null = null;
  let periodDays: DayData[] = [];

  function flushPeriod(endDate: string | null) {
    if (!currentType || !periodStart || periodDays.length === 0) return;
    const scores = periodDays.map((d) => d.executionScore);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const duration = endDate
      ? daysBetween(periodStart, endDate)
      : daysBetween(periodStart, today) + 1;

    periods.push({
      periodId: generateId(),
      periodType: currentType,
      startDate: periodStart,
      endDate,
      durationDays: Math.max(1, duration),
      avgScore,
      scoreRange: { min: Math.min(...scores), max: Math.max(...scores) },
      dominantMode: modeFromPeriodType(currentType),
      trajectory: "STABLE",
      keySignals: [],
      confidence: periodDays.length >= 5 ? "MEDIUM" : "LOW",
      detectedBy: "inferred",
    });
  }

  for (let i = 0; i < sorted.length; i++) {
    const day = sorted[i];
    const dayType: BehavioralPeriodType = hasInstabilityAt(i)
      ? "INSTABILITY"
      : classifyScore(day.executionScore);

    if (dayType !== currentType) {
      if (currentType !== null) {
        flushPeriod(day.date);
      }
      currentType = dayType;
      periodStart = day.date;
      periodDays = [day];
    } else {
      periodDays.push(day);
    }
  }

  // Flush last period — mark ongoing if last day is within 2 days of today
  const lastDay = sorted[sorted.length - 1];
  const daysSinceLast = lastDay ? daysBetween(lastDay.date, today) : Infinity;
  const isOngoing = daysSinceLast <= 2;

  flushPeriod(isOngoing ? null : (lastDay?.date ?? null));

  return periods;
}
