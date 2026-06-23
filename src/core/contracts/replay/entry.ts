import type { Timestamp } from "../primitives";
import type { BehavioralEventType } from "../history/event";
import type { BehavioralPeriodType } from "../history/period";

export type ReplayEntryKind = "EVENT" | "THRESHOLD_CROSSING" | "PERIOD_START" | "PERIOD_END";

export type ReplayEntrySignificance = "HIGH" | "MEDIUM" | "LOW";

export type ReplayEntry = {
  entryId: string;
  kind: ReplayEntryKind;
  sourceEventType: BehavioralEventType | null;
  periodType: BehavioralPeriodType | null;
  occurredAt: Timestamp;
  sessionDate: string;
  headline: string;
  detail: string | null;
  significance: ReplayEntrySignificance;
  numericContext: number | null;
};

export const NARRATIVE_RULES = {
  maxEntriesPerWindow: { W7: 5, W14: 9, W28: 14 } as const,
  checkInScoreDeltaThreshold: 8,
  thresholdCrossingLevels: [45, 60, 75, 90] as const,
  deduplicationWindowDays: 2,
  excludedEventTypes: ["TASK_COMPLETED", "REFLECTION_GENERATED"] as const,
  blockerMinOccurrences: 3,
  distractionMinOccurrences: 3,
  taskRescheduledMinCount: 3,
};
