import type {
  EveningObservationCode,
  EveningReflectionRecord,
} from "@/core/contracts/flow/reflection";
import type { BehavioralSignal } from "@/core/contracts/signals/behavioral-signals";
import type { UserMode } from "@/core/contracts/state/modes";
import { REFLECTION_CONFIG } from "./reflection-config";

// Which active pipeline signals contradict each observation
const SIGNAL_CONFLICTS: Partial<Record<EveningObservationCode, BehavioralSignal[]>> = {
  FRAGMENTATION_CONTINUITY_IMPROVEMENT: ["RISING_FRAGMENTATION"],
  HIGH_RESISTANCE_COMPLETION: ["DECLINING_EXECUTION_QUALITY", "AVOIDANCE_CLUSTERING"],
  PACING_PROTECTION_OBSERVED: ["PACING_INSTABILITY"],
  EXECUTION_CONTINUITY_HELD: ["DECLINING_EXECUTION_QUALITY"],
  MEANINGFUL_PROGRESS_ACHIEVED: ["MEANINGFULNESS_DEFERRAL"],
  RECOVERY_STABILITY_MAINTAINED: ["RECOVERY_COLLAPSE"],
};

export function shouldSuppressObservation(
  code: EveningObservationCode,
  activeSignals: BehavioralSignal[],
  mode: UserMode,
  reflectionHistory: EveningReflectionRecord[],
): boolean {
  // In RECOVERY mode only RECOVERY_STABILITY_MAINTAINED is eligible
  if (mode === "RECOVERY" && code !== "RECOVERY_STABILITY_MAINTAINED") return true;

  // Contradicting active pipeline signal
  const conflicting = SIGNAL_CONFLICTS[code] ?? [];
  if (conflicting.some((s) => activeSignals.includes(s))) return true;

  // Repetition suppression: same code appeared in last N entries
  const recentCodes = reflectionHistory
    .slice(-REFLECTION_CONFIG.repetitionSuppressionWindow)
    .flatMap((r) => r.observations.map((o) => o.code));
  if (recentCodes.includes(code)) return true;

  return false;
}
