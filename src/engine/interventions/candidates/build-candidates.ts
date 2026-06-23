import type { SignalSnapshot } from "@/core/contracts/signals/signal-snapshot";
import type { BehavioralSignal } from "@/core/contracts/signals/behavioral-signals";
import type { InterventionTrigger } from "@/core/contracts/interventions/triggers";
import type { InterventionCandidate } from "../types/internal";

// ---------------------------------------------------------------------------
// Stage 1 — Build candidates from matrix trigger matches against SignalSnapshot
// ---------------------------------------------------------------------------

function signalStrengthScore(signals: BehavioralSignal[], snapshot: SignalSnapshot): number {
  if (signals.length === 0) return 0;
  const total = signals.reduce((sum, sig) => {
    return sum + (snapshot.signalStrengths[sig] ?? 0);
  }, 0);
  return total / signals.length;
}

function minDuration(signals: BehavioralSignal[], snapshot: SignalSnapshot): number {
  if (signals.length === 0) return 0;
  return Math.min(...signals.map((sig) => snapshot.signalDurations[sig] ?? 0));
}

function confidenceMet(snapshot: SignalSnapshot, minimumConfidence: number): boolean {
  const band = snapshot.confidence;
  const bandScore = band === "HIGH" ? 90 : band === "MEDIUM" ? 60 : 30;
  return bandScore >= minimumConfidence;
}

/**
 * For each trigger in the matrix, check if all required signals are active
 * and confidence is sufficient. Returns matched candidates only.
 */
export function buildCandidates(
  triggers: InterventionTrigger[],
  snapshot: SignalSnapshot,
): InterventionCandidate[] {
  const candidates: InterventionCandidate[] = [];

  for (const trigger of triggers) {
    const allActive = trigger.requiredSignals.every((sig) => snapshot.activeSignals.includes(sig));
    if (!allActive) continue;
    if (!confidenceMet(snapshot, trigger.minimumConfidence)) continue;

    candidates.push({
      type: trigger.triggerType as import("@/core/contracts/interventions/types").ActiveInterventionType,
      matchedSignals: trigger.requiredSignals,
      minSignalDuration: minDuration(trigger.requiredSignals, snapshot),
      evidenceScore: signalStrengthScore(trigger.requiredSignals, snapshot),
    });
  }

  return candidates;
}
