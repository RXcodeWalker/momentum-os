import type { InterventionOutcomeRecord } from "@/core/contracts/interventions/intelligence";
import type { InterventionAuditRecord } from "@/core/contracts/interventions/audit";
import type { DayData } from "@/lib/store";
import type { CheckIn } from "@/lib/store";
import { computePostWindowValue } from "./measure-outcome";
import { computeAttribution } from "./attribution";

// ---------------------------------------------------------------------------
// Outcome Reconciler — finalizes PENDING records whose window has elapsed.
// Called by orchestration (saveCheckIn) before building advisories.
// Pure function: returns updated records; caller persists them.
// ---------------------------------------------------------------------------

const MIN_POST_CHECKINS = 3;

/**
 * Finalize a single PENDING outcome record.
 * Returns the updated record (FINALIZED, UNMEASURABLE, or still PENDING if window not yet elapsed).
 */
export function reconcileOutcomeRecord(
  record: InterventionOutcomeRecord,
  history: DayData[],
  checkIns: CheckIn[],
  auditRecords: InterventionAuditRecord[],
  nowMs: number,
): InterventionOutcomeRecord {
  if (record.status !== "PENDING") return record;

  const windowEndMs = new Date(record.firedAt).getTime() + record.windowDays * 24 * 60 * 60 * 1000;
  if (nowMs < windowEndMs) return record; // window not yet elapsed

  const { value: postValue, count } = computePostWindowValue(
    record.type,
    record.firedAt,
    history,
    checkIns,
  );

  const postCheckInCount = count;
  const finalizedAt = new Date(nowMs).toISOString();

  if (postCheckInCount < MIN_POST_CHECKINS || postValue === null) {
    return {
      ...record,
      postCheckInCount,
      postWindowValue: postValue,
      outcomeDelta: null,
      status: "UNMEASURABLE",
      finalizedAt,
      attribution: {
        verdict: "UNATTRIBUTABLE",
        hardConfounders: ["INSUFFICIENT_POSTDATA"],
        softConfounders: [],
        basis: `Only ${postCheckInCount} post-fire check-ins (minimum ${MIN_POST_CHECKINS} required).`,
      },
    };
  }

  const outcomeDelta = postValue - record.baselineValue;

  const measured: InterventionOutcomeRecord = {
    ...record,
    postCheckInCount,
    postWindowValue: postValue,
    outcomeDelta,
    status: "MEASURED",
  };

  const attribution = computeAttribution(measured, history, checkIns, auditRecords);

  return {
    ...measured,
    status: "FINALIZED",
    finalizedAt,
    attribution,
  };
}

/**
 * Reconcile all PENDING outcome records whose window has elapsed.
 * Returns the full set of updated records (caller persists each changed one).
 */
export function reconcileOutcomes(
  records: InterventionOutcomeRecord[],
  history: DayData[],
  checkIns: CheckIn[],
  auditRecords: InterventionAuditRecord[],
  nowMs: number,
): { updated: InterventionOutcomeRecord[]; changed: InterventionOutcomeRecord[] } {
  const changed: InterventionOutcomeRecord[] = [];
  const updated = records.map((record) => {
    if (record.status !== "PENDING") return record;
    const windowEndMs =
      new Date(record.firedAt).getTime() + record.windowDays * 24 * 60 * 60 * 1000;
    if (nowMs < windowEndMs) return record;

    const next = reconcileOutcomeRecord(record, history, checkIns, auditRecords, nowMs);
    if (next.status !== record.status) changed.push(next);
    return next;
  });
  return { updated, changed };
}
