import type { SessionEvidence } from "@/core/contracts/signals/session-evidence";
import type { SignalSnapshot } from "@/core/contracts/signals/signal-snapshot";
import type { BehavioralSignal } from "@/core/contracts/signals/behavioral-signals";
import { makeDailyInputs } from "./signal-evidence";

// ---------------------------------------------------------------------------
// SessionEvidence builder
// ---------------------------------------------------------------------------

type DayOverrides = Parameters<typeof makeDailyInputs>[1];

const BASE = new Date("2026-01-01T08:00:00.000Z");

function isoDay(offset: number): string {
  const d = new Date(BASE);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString();
}

export function makeEvidence(
  dayOffset: number,
  overrides: DayOverrides = {},
  completeness = 0.9,
): SessionEvidence {
  const inputs = makeDailyInputs(dayOffset, overrides);
  return {
    sessionId: inputs.sessionId ?? `se-${dayOffset}`,
    capturedAt: isoDay(dayOffset),
    evidenceType: "CHECK_IN",
    inputs,
    completeness,
  };
}

export function buildEvidence(
  days: number,
  overrides: DayOverrides | ((day: number) => DayOverrides) = {},
  completeness = 0.9,
): SessionEvidence[] {
  return Array.from({ length: days }, (_, day) =>
    makeEvidence(day, typeof overrides === "function" ? overrides(day) : overrides, completeness),
  );
}

// ---------------------------------------------------------------------------
// Scenario fixture builders
// ---------------------------------------------------------------------------

/** 3 days declining sleep + high overwhelm + declining execution → RECOVERY */
export function buildScenario_RecoveryTrigger(): SessionEvidence[] {
  return [
    makeEvidence(0, {
      sleepQuality: 62,
      physicalEnergy: 60,
      mentalClarity: 62,
      overwhelm: 62,
      emotionalResistance: 58,
      stressPressure: 52,
      meaningfulAdvancementQuality: 60,
    }),
    makeEvidence(1, {
      sleepQuality: 38,
      physicalEnergy: 35,
      mentalClarity: 40,
      overwhelm: 78,
      emotionalResistance: 70,
      stressPressure: 62,
      meaningfulAdvancementQuality: 48,
    }),
    makeEvidence(2, {
      sleepQuality: 22,
      physicalEnergy: 22,
      mentalClarity: 25,
      overwhelm: 86,
      emotionalResistance: 76,
      stressPressure: 68,
      meaningfulAdvancementQuality: 32,
      executionIntegrity: 28,
    }),
  ];
}

/** 14 days of strong sustained performance → EXPANDING */
export function buildScenario_ExpandingMomentum(): SessionEvidence[] {
  return buildEvidence(14, {
    sleepQuality: 82,
    physicalEnergy: 80,
    mentalClarity: 78,
    overwhelm: 22,
    emotionalResistance: 20,
    stressPressure: 22,
    meaningfulAdvancementQuality: 80,
    deepWorkContinuity: 78,
    executionIntegrity: 78,
    fragmentationLevel: 18,
    distractionPatterns: 16,
    avoidancePressure: 18,
    pacingQuality: 78,
  });
}

/** 10 strong days then 1 bad day → mode must NOT flip */
export function buildScenario_SingleBadDayAfterStreak(): SessionEvidence[] {
  const strong = buildEvidence(10, {
    sleepQuality: 76,
    physicalEnergy: 74,
    overwhelm: 24,
    meaningfulAdvancementQuality: 75,
    executionIntegrity: 74,
    fragmentationLevel: 20,
    pacingQuality: 74,
  });
  const badDay = makeEvidence(10, {
    sleepQuality: 22,
    physicalEnergy: 25,
    mentalClarity: 28,
    overwhelm: 82,
    fragmentationLevel: 78,
  });
  return [...strong, badDay];
}

/** Rising fragmentation + declining execution + stable sleep */
export function buildScenario_FragmentedExecution(): SessionEvidence[] {
  return Array.from({ length: 6 }, (_, day) =>
    makeEvidence(day, {
      sleepQuality: 70,
      physicalEnergy: 68,
      mentalClarity: 70,
      fragmentationLevel: 22 + day * 12,
      distractionPatterns: 20 + day * 10,
      pacingQuality: 72 - day * 5,
      meaningfulAdvancementQuality: 70 - day * 8,
      executionIntegrity: 68 - day * 9,
      deepWorkContinuity: 66 - day * 8,
    }),
  );
}

/** Only 1–2 days of evidence — should return LOW confidence */
export function buildScenario_IncompleteEvidence(): SessionEvidence[] {
  return [makeEvidence(0, {}, 0.45)];
}

// ---------------------------------------------------------------------------
// Snapshot builders
// ---------------------------------------------------------------------------

export function makeSnapshot(
  dayOffset: number,
  signals: Partial<Record<BehavioralSignal, { strength: number; days: number }>> = {},
): SignalSnapshot {
  const activeSignals = Object.keys(signals) as BehavioralSignal[];
  return {
    capturedAt: isoDay(dayOffset),
    activeSignals,
    signalStrengths: Object.fromEntries(
      activeSignals.map((s) => [s, signals[s]!.strength]),
    ) as SignalSnapshot["signalStrengths"],
    signalDurations: Object.fromEntries(
      activeSignals.map((s) => [s, signals[s]!.days]),
    ) as SignalSnapshot["signalDurations"],
    confidence: activeSignals.length > 0 ? "MEDIUM" : "LOW",
  };
}

export function emptySnapshot(dayOffset = 0): SignalSnapshot {
  return makeSnapshot(dayOffset);
}
