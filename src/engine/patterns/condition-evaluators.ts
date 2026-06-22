import type { DayData, CheckIn, BlockerRecord, DistractionLogEntry } from "@/lib/store";
import type { ConditionCode } from "@/core/contracts/patterns";

export type DayContext = {
  day: DayData;
  prevDay: DayData | null;
  prevPrevDay: DayData | null;
  checkIn: CheckIn | null;
  blockers: BlockerRecord[];
  distractionEntry: DistractionLogEntry | null;
};

const SLEEP_DIP_THRESHOLD = 6.5;
const SLEEP_GOOD_THRESHOLD = 7.5;
const SCORE_DIP_THRESHOLD = 50;
const SCORE_HIGH_THRESHOLD = 70;
const SCORE_PEAK_THRESHOLD = 85;
const HIGH_PLANNED_LOAD = 6;
const DISTRACTION_SPIKE_COUNT = 3;

export function evaluateCondition(
  code: ConditionCode,
  ctx: DayContext,
): { present: boolean; magnitude: number | null } {
  switch (code) {
    case "SLEEP_BELOW_6_5":
      return {
        present: ctx.day.sleepHours < SLEEP_DIP_THRESHOLD,
        magnitude: ctx.day.sleepHours,
      };
    case "SLEEP_ABOVE_7_5":
      return {
        present: ctx.day.sleepHours >= SLEEP_GOOD_THRESHOLD,
        magnitude: ctx.day.sleepHours,
      };
    case "NEXT_DAY_SCORE_DIP":
      // "next day" is this day — antecedent is evaluated on prevDay
      return {
        present: ctx.day.executionScore < SCORE_DIP_THRESHOLD,
        magnitude: ctx.day.executionScore,
      };
    case "NEXT_DAY_SCORE_HIGH":
      return {
        present: ctx.day.executionScore >= SCORE_HIGH_THRESHOLD,
        magnitude: ctx.day.executionScore,
      };
    case "WEEKDAY_MONDAY": {
      const dow = new Date(ctx.day.date).getDay();
      return { present: dow === 1, magnitude: null };
    }
    case "HIGH_PLANNED_LOAD":
      return {
        present: ctx.day.planned >= HIGH_PLANNED_LOAD,
        magnitude: ctx.day.planned,
      };
    case "PRIOR_DAY_PEAK":
      return {
        present: ctx.prevDay !== null && ctx.prevDay.executionScore >= SCORE_PEAK_THRESHOLD,
        magnitude: ctx.prevDay?.executionScore ?? null,
      };
    case "PRIOR_DAY_RECOVERY":
      return {
        present: ctx.prevDay !== null && ctx.prevDay.recovery === true,
        magnitude: null,
      };
    case "DISTRACTION_SPIKE":
      return {
        present: ctx.day.distractions >= DISTRACTION_SPIKE_COUNT,
        magnitude: ctx.day.distractions,
      };
    case "DISTRACTION_ABSENT":
      return {
        present: ctx.day.distractions === 0,
        magnitude: null,
      };
    case "CONSECUTIVE_FOCUS_3":
      return {
        present:
          ctx.prevDay !== null &&
          ctx.prevPrevDay !== null &&
          ctx.day.focus >= 7 &&
          ctx.prevDay.focus >= 7 &&
          ctx.prevPrevDay.focus >= 7,
        magnitude: ctx.day.focus,
      };
    case "SCORE_DIP_TODAY":
      return {
        present: ctx.day.executionScore < SCORE_DIP_THRESHOLD,
        magnitude: ctx.day.executionScore,
      };
    case "SCORE_HIGH_TODAY":
      return {
        present: ctx.day.executionScore >= SCORE_HIGH_THRESHOLD,
        magnitude: ctx.day.executionScore,
      };
    case "RECOVERY_DAY":
      return {
        present: ctx.day.recovery === true,
        magnitude: null,
      };
    case "BLOCKER_PRESENT":
      return {
        present: ctx.blockers.length > 0,
        magnitude: ctx.blockers.length,
      };
    default:
      return { present: false, magnitude: null };
  }
}
