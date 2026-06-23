import type { Timestamp } from "../primitives";

export type BehavioralEventType =
  | "CHECK_IN_COMPLETED"
  | "TASK_COMPLETED"
  | "TASK_RESCHEDULED"
  | "INSIGHT_COMMITTED"
  | "RECOVERY_TRIGGERED"
  | "RECOVERY_EXITED"
  | "STREAK_MILESTONE"
  | "SCORE_THRESHOLD_CROSSED"
  | "BLOCKER_CAPTURED"
  | "DISTRACTION_LOGGED"
  | "REFLECTION_GENERATED";

export type EventPayloadMap = {
  CHECK_IN_COMPLETED: {
    score: number;
    delta: number;
    date: string;
    focus: number;
    sleepHours: number;
    distractionCount: number;
  };
  TASK_COMPLETED: { taskId: string; taskType: string; estMin: number };
  TASK_RESCHEDULED: { taskId: string; taskType: string; rescheduledCount: number };
  INSIGHT_COMMITTED: { insightId: string; preCommitAvgScore: number };
  RECOVERY_TRIGGERED: { reason: string; triggeredBy: "manual" | "pipeline" };
  RECOVERY_EXITED: { daysInRecovery: number };
  STREAK_MILESTONE: { streakType: "execution" | "resilience"; milestone: number };
  SCORE_THRESHOLD_CROSSED: { threshold: number; direction: "above" | "below"; score: number };
  BLOCKER_CAPTURED: { blockerType: string; taskType: string };
  DISTRACTION_LOGGED: { types: string[] };
  REFLECTION_GENERATED: {
    workloadGuidance: "REDUCE" | "HOLD" | "EXPAND";
    confidenceBand: string;
  };
};

export type BehavioralEvent<T extends BehavioralEventType = BehavioralEventType> = {
  eventId: string;
  eventType: T;
  occurredAt: Timestamp;
  sessionDate: string;
  payload: EventPayloadMap[T];
  sourceAction: string;
  isBackfilled: boolean;
};
