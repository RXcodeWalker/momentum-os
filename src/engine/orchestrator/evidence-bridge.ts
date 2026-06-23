/**
 * Evidence Bridge — maps Zustand store data (DayData + CheckIn) to the
 * SessionEvidence[] format consumed by the State Engine and Signal Engine.
 *
 * All mapping decisions are documented inline. Each one involves a judgment
 * call about how a simple user-facing value (e.g. sleepHours: 7) maps to a
 * normalized 0–100 behavioral signal (sleepQuality: 87.5). The `BRIDGE_CONFIG`
 * object centralises these mapping parameters so they can be tuned without
 * touching the logic.
 */

import type { DailyInputs } from "@/core/contracts/signals/daily-inputs";
import type { SessionEvidence } from "@/core/contracts/signals/session-evidence";
import type { DayData, CheckIn } from "@/lib/store";

// ---------------------------------------------------------------------------
// Bridge configuration — all mapping parameters in one place
// ---------------------------------------------------------------------------

export const BRIDGE_CONFIG = {
  /**
   * Sleep hours treated as "full quality" sleep. 8h = 100 sleepQuality.
   * Values above this are clamped to 100 (extra sleep is not penalised).
   */
  sleepOptimalHours: 8,

  /**
   * Number of distinct distraction types that maps to 100 fragmentationLevel.
   * e.g. 4+ types of distraction in one day = maximum fragmentation signal.
   */
  distractionTypesSaturate: 4,

  /**
   * Focus score divisor — CheckIn.focus is 0–10, DailyInputs expects 0–100.
   */
  focusScale: 10,

  /**
   * Energy score divisor — CheckIn.energy is 0–10, DailyInputs expects 0–100.
   */
  energyScale: 10,

  /**
   * Mood score divisor — CheckIn.mood is 0–10.
   * Used as a proxy for emotional resistance (inverse: high mood = low resistance).
   */
  moodScale: 10,

  /**
   * Avoidance pressure from blockerTypes. Each "energy" or "focus" blocker
   * type adds this weight to avoidancePressure. Capped at 100.
   */
  blockerAvoidanceWeight: 20,

  /**
   * Completeness thresholds: a CheckIn is considered "complete" if all of
   * these fields are present and non-zero.
   */
  requiredFields: ["honesty", "focus", "sleepHours", "energy", "mood"] as const,
} as const;

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/** Maps sleepHours (0–12) to sleepQuality (0–100). 8h = 100. */
function sleepQualityFromHours(hours: number): number {
  return clamp((hours / BRIDGE_CONFIG.sleepOptimalHours) * 100);
}

/** Maps distraction type list to fragmentationLevel (0–100). */
function fragmentationFromDistractions(distractionTypes: string[]): number {
  return clamp((distractionTypes.length / BRIDGE_CONFIG.distractionTypesSaturate) * 100);
}

/** Maps completed/planned ratio to executionIntegrity (0–100). */
function executionIntegrityFromCompletion(completed: number, planned: number): number {
  if (planned === 0) return completed > 0 ? 80 : 50; // no plan: neutral default
  return clamp((completed / planned) * 100);
}

/**
 * Estimates avoidancePressure from the blocker map.
 * Energy + focus blockers are the strongest avoidance signals. Other types
 * (time, distraction) are real impediments but not avoidance per se.
 */
function avoidancePressureFromBlockers(blockers: Record<string, string>): number {
  const avoidanceTypes = new Set(["energy", "focus", "motivation", "anxiety"]);
  const avoidanceCount = Object.values(blockers).filter((bt) => avoidanceTypes.has(bt)).length;
  return clamp(avoidanceCount * BRIDGE_CONFIG.blockerAvoidanceWeight);
}

/** Estimates completeness fraction: fraction of required fields that are non-zero. */
function computeCompleteness(checkIn: CheckIn): number {
  const present = BRIDGE_CONFIG.requiredFields.filter(
    (f) =>
      (checkIn as Record<string, unknown>)[f] !== undefined &&
      (checkIn as Record<string, unknown>)[f] !== 0,
  ).length;
  return present / BRIDGE_CONFIG.requiredFields.length;
}

/** Converts a date string (YYYY-MM-DD) to a UTC midnight ISO timestamp. */
function dateToTimestamp(date: string): string {
  return `${date}T00:00:00.000Z`;
}

// ---------------------------------------------------------------------------
// Core mapping
// ---------------------------------------------------------------------------

function checkInToDailyInputs(checkIn: CheckIn): DailyInputs {
  const sleepQuality = sleepQualityFromHours(checkIn.sleepHours);
  const physicalEnergy = clamp(checkIn.energy * BRIDGE_CONFIG.energyScale);
  const mentalClarity = clamp(checkIn.focus * BRIDGE_CONFIG.focusScale);

  // Overwhelm: inverse of mood, amplified by low energy.
  // High mood + high energy → low overwhelm. Low mood + low energy → high overwhelm.
  const moodNorm = checkIn.mood / BRIDGE_CONFIG.moodScale; // 0–1
  const energyNorm = checkIn.energy / BRIDGE_CONFIG.energyScale; // 0–1
  const overwhelm = clamp((1 - moodNorm * 0.6 - energyNorm * 0.4) * 100);

  // Emotional resistance: low honesty correlates with avoidance / emotional hiding.
  const honestyNorm = checkIn.honesty / 10;
  const emotionalResistance = clamp((1 - honestyNorm * 0.5 - moodNorm * 0.5) * 100);

  // Stress pressure: inverse mood + fragmentation proxy.
  const fragmentation = fragmentationFromDistractions(checkIn.distractions);
  const stressPressure = clamp((1 - moodNorm) * 60 + fragmentation * 0.4);

  // Execution quality signals.
  const meaningfulAdvancementQuality = executionIntegrityFromCompletion(
    checkIn.completed,
    checkIn.planned,
  );
  const deepWorkContinuity = mentalClarity; // focus score is the closest proxy
  const executionIntegrity = clamp(
    meaningfulAdvancementQuality * 0.6 + (checkIn.honesty / 10) * 40,
  );

  // Behavioral signals.
  const avoidancePressure = avoidancePressureFromBlockers(checkIn.blockers ?? {});
  const pacingQuality = clamp((1 - fragmentation / 100) * 60 + physicalEnergy * 0.4);

  return {
    capturedAt: dateToTimestamp(checkIn.date),
    sessionId: `checkin-${checkIn.date}`,
    recoveryInputs: { sleepQuality, physicalEnergy, mentalClarity },
    emotionalInputs: { overwhelm, emotionalResistance, stressPressure },
    executionInputs: { meaningfulAdvancementQuality, deepWorkContinuity, executionIntegrity },
    behavioralInputs: {
      fragmentationLevel: fragmentation,
      distractionPatterns: fragmentation,
      avoidancePressure,
      pacingQuality,
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds a `SessionEvidence[]` array from Zustand store data.
 *
 * The bridge matches each `DayData` to its corresponding `CheckIn` by date.
 * Days that have a `DayData` record but no `CheckIn` produce evidence with
 * neutral defaults and low completeness, preserving timeline continuity.
 *
 * `maxDays` limits how far back to include evidence (default: 28 days).
 * Older evidence is excluded to prevent stale history from distorting dimensions.
 */
export function buildSessionEvidence(
  history: DayData[],
  checkIns: CheckIn[],
  maxDays = 28,
): SessionEvidence[] {
  const checkInByDate = new Map(checkIns.map((c) => [c.date, c]));

  // Sort chronologically, take only the most recent `maxDays`
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date)).slice(-maxDays);

  return sorted.map((day) => {
    const checkIn = checkInByDate.get(day.date);

    if (checkIn) {
      return {
        sessionId: `checkin-${day.date}`,
        capturedAt: dateToTimestamp(day.date),
        evidenceType: "CHECK_IN" as const,
        inputs: checkInToDailyInputs(checkIn),
        completeness: computeCompleteness(checkIn),
      };
    }

    // No CheckIn for this DayData — use executionScore + sleepHours to build
    // a partial evidence entry. Marked as low completeness.
    return {
      sessionId: `partial-${day.date}`,
      capturedAt: dateToTimestamp(day.date),
      evidenceType: "CHECK_IN" as const,
      completeness: 0.3,
      inputs: {
        capturedAt: dateToTimestamp(day.date),
        recoveryInputs: {
          sleepQuality: sleepQualityFromHours(day.sleepHours),
          physicalEnergy: 65, // neutral — no direct signal
          mentalClarity: clamp(day.focus * 10),
        },
        emotionalInputs: {
          overwhelm: 40,
          emotionalResistance: 30,
          stressPressure: 30,
        },
        executionInputs: {
          meaningfulAdvancementQuality:
            day.planned > 0 ? clamp((day.completed / day.planned) * 100) : 50,
          deepWorkContinuity: clamp(day.focus * 10),
          executionIntegrity: clamp(day.executionScore),
        },
        behavioralInputs: {
          fragmentationLevel: clamp(
            (day.distractions / BRIDGE_CONFIG.distractionTypesSaturate) * 100,
          ),
          distractionPatterns: clamp(
            (day.distractions / BRIDGE_CONFIG.distractionTypesSaturate) * 100,
          ),
          avoidancePressure: 25,
          pacingQuality: 65,
        },
      },
    };
  });
}
