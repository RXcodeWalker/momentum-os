import type { InterventionOutcomeRecord } from "@/core/contracts/interventions/intelligence";
import type { ActiveInterventionType } from "@/core/contracts/interventions/types";

// ---------------------------------------------------------------------------
// Persistence for InterventionOutcomeRecord.
// Outcome records live for 90 days (vs 8d for audit records) because effectiveness
// scoring needs months of finalized outcomes before verdicts can form.
// Orchestration calls these functions — engine never calls them directly.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "cadence-intervention-outcomes-v1";
const MAX_RECORD_AGE_DAYS = 90;

function cutoffIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function loadAll(): InterventionOutcomeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as InterventionOutcomeRecord[];
  } catch {
    return [];
  }
}

function saveAll(records: InterventionOutcomeRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // localStorage unavailable (SSR or storage full) — silent degradation
  }
}

function prune(records: InterventionOutcomeRecord[]): InterventionOutcomeRecord[] {
  const cutoff = cutoffIso(MAX_RECORD_AGE_DAYS);
  return records.filter((r) => r.firedAt >= cutoff);
}

/** Write a new PENDING outcome record immediately after an intervention fires. */
export function writeOutcomeRecord(record: InterventionOutcomeRecord): void {
  const all = loadAll();
  saveAll([...prune(all), record]);
}

/** Read all outcome records (both PENDING and FINALIZED). Pruned to 90 days. */
export function readOutcomes(): InterventionOutcomeRecord[] {
  return prune(loadAll());
}

/** Read only outcomes that need reconciliation (PENDING and whose window has elapsed). */
export function readPendingElapsed(nowMs: number): InterventionOutcomeRecord[] {
  const all = prune(loadAll());
  return all.filter((r) => {
    if (r.status !== "PENDING") return false;
    const windowEndMs = new Date(r.firedAt).getTime() + r.windowDays * 24 * 60 * 60 * 1000;
    return nowMs >= windowEndMs;
  });
}

/** Update one outcome record in-place (used by reconciler to finalize). */
export function updateOutcome(updated: InterventionOutcomeRecord): void {
  const all = loadAll();
  const next = all.map((r) => (r.outcomeId === updated.outcomeId ? updated : r));
  saveAll(prune(next));
}

/** Read finalized, attributable outcomes for a specific type (for effectiveness scoring). */
export function readAttributableOutcomes(
  type: ActiveInterventionType,
): InterventionOutcomeRecord[] {
  return prune(loadAll()).filter(
    (r) =>
      r.type === type &&
      r.status === "FINALIZED" &&
      r.attribution !== null &&
      r.attribution.verdict !== "UNATTRIBUTABLE" &&
      r.outcomeDelta !== null,
  );
}

/** Clear all outcome records (test / reset only). */
export function clearOutcomeRecords(): void {
  saveAll([]);
}
