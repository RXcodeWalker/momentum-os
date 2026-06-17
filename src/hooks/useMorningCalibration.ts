import { useApp } from "@/lib/store";
import type { MorningCalibration, Task } from "@/lib/store";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export type MorningCalibrationHook = {
  shouldShow: boolean;
  isComplete: boolean;
  wasSkipped: boolean;
  calibration: MorningCalibration | null;
  committedTask: Task | null;
};

/**
 * Gate logic + committed task resolution for morning calibration.
 *
 * Gate conditions (all must pass for shouldShow):
 *   - Hour between 5 and 11 (inclusive lower, exclusive upper)
 *   - No calibration written for today
 *   - At least 1 prior check-in (user is not first-time)
 *   - Not currently in recovery mode
 */
export function useMorningCalibration(): MorningCalibrationHook {
  const calibration = useApp((s) => s.lastMorningCalibration);
  const checkIns = useApp((s) => s.checkIns);
  const recoveryMode = useApp((s) => s.recoveryMode);
  const tasks = useApp((s) => s.tasks);

  const hour = new Date().getHours();
  const today = todayStr();

  const doneToday = calibration?.date === today;
  const isComplete = doneToday && !calibration?.skipped;
  const wasSkipped = doneToday && (calibration?.skipped ?? false);

  const shouldShow = hour >= 5 && hour < 12 && !doneToday && checkIns.length >= 1 && !recoveryMode;

  const committedTask: Task | null = (() => {
    if (!calibration || calibration.skipped || !calibration.committedTaskId) return null;
    return tasks.find((t) => t.id === calibration.committedTaskId) ?? null;
  })();

  return {
    shouldShow,
    isComplete,
    wasSkipped,
    calibration: doneToday ? calibration : null,
    committedTask,
  };
}
