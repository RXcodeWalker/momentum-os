export type PatternWindowKey = "P28" | "P56" | "P90";

export const PATTERN_WINDOW_DAYS: Record<PatternWindowKey, number> = {
  P28: 28,
  P56: 56,
  P90: 90,
};

export const PATTERN_DECAY_HALF_LIFE_DAYS = 21;

export type PatternWindow = {
  windowKey: PatternWindowKey;
  windowDays: number;
  evidenceDays: number;
  firstDate: string;
  lastDate: string;
};
