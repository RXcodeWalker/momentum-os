import type { ActiveInterventionType } from "@/core/contracts/interventions/types";
import type {
  TypeEffectiveness,
  InterventionFatigueSignal,
  CooldownAdvisory,
  SuppressionAdvisory,
  InterventionIntelligenceReport,
} from "@/core/contracts/interventions/intelligence";
import type { InterventionOutcomeRecord } from "@/core/contracts/interventions/intelligence";

// ---------------------------------------------------------------------------
// Advisory Builder — translates effectiveness + fatigue into bounded, reversible
// advisories that feed back into the engine pipeline.
// Safety types (BURNOUT_PREVENTION, RECOVERY_ENFORCEMENT) are never demoted
// and never cooldown-extended; they are always forced to multiplier=1, action=NONE.
// ---------------------------------------------------------------------------

/** Types that must never be suppressed or have cooldown extended. */
const HARD_SUPPRESSION_EXEMPT: readonly ActiveInterventionType[] = [
  "BURNOUT_PREVENTION",
  "RECOVERY_ENFORCEMENT",
];

/** Maximum allowed cooldown multiplier (capped). */
const MAX_COOLDOWN_MULTIPLIER = 3;

function isSafetyType(type: ActiveInterventionType): boolean {
  return (HARD_SUPPRESSION_EXEMPT as readonly string[]).includes(type);
}

/**
 * Build a cooldown advisory for a single type.
 * Multiplier is capped [1×, 3×]; safety types forced to 1×.
 */
function buildCooldownAdvisory(
  type: ActiveInterventionType,
  effectiveness: TypeEffectiveness | undefined,
  fatigue: InterventionFatigueSignal | undefined,
): CooldownAdvisory {
  if (isSafetyType(type)) {
    return { type, multiplier: 1, reason: "Safety type — cooldown never extended." };
  }

  let multiplier = 1;
  const reasons: string[] = [];

  const notWorking =
    effectiveness?.verdict === "NOT_WORKING" &&
    (effectiveness.confidence === "MEDIUM" || effectiveness.confidence === "HIGH");

  const highFatigue = fatigue?.level === "HIGH";
  const emergingFatigue = fatigue?.level === "EMERGING";

  if (notWorking) {
    multiplier = Math.max(multiplier, 2);
    reasons.push(`${type} shows NOT_WORKING at ${effectiveness!.confidence} confidence.`);
  }
  if (highFatigue) {
    multiplier = Math.max(multiplier, 2);
    reasons.push("High user fatigue detected.");
  }
  if (notWorking && highFatigue) {
    multiplier = MAX_COOLDOWN_MULTIPLIER;
    reasons.push("Combined NOT_WORKING + high fatigue → 3× cooldown (cap).");
  }
  if (emergingFatigue && !notWorking) {
    // Mild nudge — already handled by regular fatigue mechanisms; no cooldown extension
    multiplier = Math.max(multiplier, 1);
  }

  const clampedMultiplier = Math.min(Math.max(multiplier, 1), MAX_COOLDOWN_MULTIPLIER);
  return {
    type,
    multiplier: clampedMultiplier,
    reason: reasons.length > 0 ? reasons.join(" ") : "No advisory — default cooldown.",
  };
}

/**
 * Build a suppression advisory for a single type.
 * DEMOTE: cap max level −1 and lower priority. Safety types always get NONE.
 */
function buildSuppressionAdvisory(
  type: ActiveInterventionType,
  effectiveness: TypeEffectiveness | undefined,
  fatigue: InterventionFatigueSignal | undefined,
): SuppressionAdvisory {
  if (isSafetyType(type)) {
    return { type, action: "NONE", reason: "Safety type — never demoted." };
  }

  const notWorking =
    effectiveness?.verdict === "NOT_WORKING" &&
    (effectiveness.confidence === "MEDIUM" || effectiveness.confidence === "HIGH");
  const highFatigue = fatigue?.level === "HIGH";

  if (notWorking && highFatigue) {
    return {
      type,
      action: "DEMOTE",
      reason: `${type} is NOT_WORKING (${effectiveness!.confidence} confidence) with high user fatigue. Max level capped −1; priority lowered.`,
    };
  }

  return { type, action: "NONE", reason: "No suppression advisory." };
}

/**
 * Build the full intelligence advisory set from effectiveness scores + fatigue signals.
 * This is the top-level function called by orchestration before each pipeline run.
 */
export function buildIntelligenceAdvisories(
  outcomes: InterventionOutcomeRecord[],
  effectiveness: TypeEffectiveness[],
  fatigue: InterventionFatigueSignal[],
  lastReconciled: string | null,
): InterventionIntelligenceReport {
  const types: ActiveInterventionType[] = [
    "BURNOUT_PREVENTION",
    "RECOVERY_ENFORCEMENT",
    "OVERLOAD",
    "AVOIDANCE_INTERRUPTION",
    "FRAGMENTATION_REDUCTION",
    "DEEP_WORK_PROTECTION",
    "RESTART_ASSISTANCE",
  ];

  const cooldownAdvisories: CooldownAdvisory[] = types.map((type) =>
    buildCooldownAdvisory(
      type,
      effectiveness.find((e) => e.type === type),
      fatigue.find((f) => f.type === type),
    ),
  );

  const suppressionAdvisories: SuppressionAdvisory[] = types.map((type) =>
    buildSuppressionAdvisory(
      type,
      effectiveness.find((e) => e.type === type),
      fatigue.find((f) => f.type === type),
    ),
  );

  return {
    effectiveness,
    fatigue,
    cooldownAdvisories,
    suppressionAdvisories,
    lastReconciled,
  };
}
