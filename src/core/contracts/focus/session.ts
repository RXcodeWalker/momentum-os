import type { FocusExitReason } from "./environment";
import type { UserMode } from "@/core/contracts/state/modes";
import type { Task } from "@/lib/store";

export type FocusSessionOutcome = "completed" | "interrupted";
export type FocusSessionQuality = "deep" | "scattered" | "done";

export type FocusSession = {
  id: string;
  taskId: string | null;
  taskType: Task["type"] | null;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  windowMs: number | null;
  reachedWindow: boolean;
  outcome: FocusSessionOutcome;
  exitReason: FocusExitReason;
  primaryCompleted: boolean;
  mode: UserMode;
  quality?: FocusSessionQuality;
};
