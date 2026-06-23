import type { DailyInputs } from "@/core/contracts/signals/daily-inputs";
import type { SessionEvidence } from "@/core/contracts/signals/session-evidence";

const BASE_DATE = new Date("2026-01-01T08:00:00.000Z");

type DailyInputOverrides = {
  sleepQuality?: number;
  physicalEnergy?: number;
  mentalClarity?: number;
  overwhelm?: number;
  emotionalResistance?: number;
  stressPressure?: number;
  meaningfulAdvancementQuality?: number;
  deepWorkContinuity?: number;
  executionIntegrity?: number;
  fragmentationLevel?: number;
  distractionPatterns?: number;
  avoidancePressure?: number;
  pacingQuality?: number;
};

function offsetDate(dayOffset: number): string {
  const date = new Date(BASE_DATE);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString();
}

export function makeDailyInputs(
  dayOffset: number,
  overrides: DailyInputOverrides = {},
): DailyInputs {
  return {
    recoveryInputs: {
      sleepQuality: overrides.sleepQuality ?? 70,
      physicalEnergy: overrides.physicalEnergy ?? 70,
      mentalClarity: overrides.mentalClarity ?? 70,
    },
    emotionalInputs: {
      overwhelm: overrides.overwhelm ?? 30,
      emotionalResistance: overrides.emotionalResistance ?? 30,
      stressPressure: overrides.stressPressure ?? 30,
    },
    executionInputs: {
      meaningfulAdvancementQuality: overrides.meaningfulAdvancementQuality ?? 70,
      deepWorkContinuity: overrides.deepWorkContinuity ?? 70,
      executionIntegrity: overrides.executionIntegrity ?? 70,
    },
    behavioralInputs: {
      fragmentationLevel: overrides.fragmentationLevel ?? 25,
      distractionPatterns: overrides.distractionPatterns ?? 25,
      avoidancePressure: overrides.avoidancePressure ?? 25,
      pacingQuality: overrides.pacingQuality ?? 70,
    },
    capturedAt: offsetDate(dayOffset),
    sessionId: `session-${dayOffset}`,
  };
}

export function makeSessionEvidence(
  dayOffset: number,
  overrides: DailyInputOverrides = {},
  completeness = 0.9,
): SessionEvidence {
  const inputs = makeDailyInputs(dayOffset, overrides);
  return {
    sessionId: inputs.sessionId ?? `session-${dayOffset}`,
    capturedAt: inputs.capturedAt,
    evidenceType: "CHECK_IN",
    inputs,
    completeness,
  };
}

export function buildRisingFragmentationTimeline(days = 5): DailyInputs[] {
  return Array.from({ length: days }, (_, day) =>
    makeDailyInputs(day, {
      fragmentationLevel: 30 + day * 12,
      distractionPatterns: 28 + day * 10,
      pacingQuality: 70 - day * 4,
    }),
  );
}

export function buildDecliningExecutionTimeline(days = 5): DailyInputs[] {
  return Array.from({ length: days }, (_, day) =>
    makeDailyInputs(day, {
      meaningfulAdvancementQuality: 72 - day * 10,
      deepWorkContinuity: 70 - day * 9,
      executionIntegrity: 74 - day * 11,
    }),
  );
}

export function buildRecoveryCollapseTimeline(days = 6): DailyInputs[] {
  return Array.from({ length: days }, (_, day) =>
    makeDailyInputs(day, {
      sleepQuality: 68 - day * 10,
      physicalEnergy: 66 - day * 10,
      mentalClarity: 64 - day * 9,
      meaningfulAdvancementQuality: 55 - day * 2,
      executionIntegrity: 52 - day * 2,
    }),
  );
}

export function buildVolatilityTimeline(): DailyInputs[] {
  const swings = [35, 88, 30, 92, 28, 90, 32, 85];
  return swings.map((fragmentationLevel, day) =>
    makeDailyInputs(day, {
      fragmentationLevel,
      distractionPatterns: fragmentationLevel - 3,
      avoidancePressure: 85 - fragmentationLevel,
      pacingQuality: 45 + (day % 2 === 0 ? 20 : -15),
      emotionalResistance: 40 + (day % 3) * 15,
    }),
  );
}

export function buildStableBaselineTimeline(days = 5): DailyInputs[] {
  return Array.from({ length: days }, (_, day) => makeDailyInputs(day));
}

export function buildSingleDaySpikeTimeline(): DailyInputs[] {
  return [
    makeDailyInputs(0),
    makeDailyInputs(1),
    makeDailyInputs(2, { fragmentationLevel: 90, distractionPatterns: 88 }),
    makeDailyInputs(3),
    makeDailyInputs(4),
  ];
}
