import type { InterventionAuditRecord } from '@/core/contracts/interventions/audit'
import type { Timestamp } from '@/core/contracts/primitives'

// ---------------------------------------------------------------------------
// Persistence read/write for InterventionAuditRecord.
// Orchestration calls these functions — engine never calls them directly.
// Engine receives audit records via InterventionEvaluationContext.recentInterventions.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'cadence-intervention-audit-v1'
const MAX_RECORD_AGE_DAYS = 7

function nowIso(): Timestamp {
  return new Date().toISOString()
}

function cutoffIso(days: number): Timestamp {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function loadAll(): InterventionAuditRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as InterventionAuditRecord[]
  } catch {
    return []
  }
}

function saveAll(records: InterventionAuditRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // localStorage unavailable (SSR or storage full) — silent degradation
  }
}

/** Read audit records from the last N days. Passed to engine as context. */
export function readRecentAuditRecords(days = MAX_RECORD_AGE_DAYS): InterventionAuditRecord[] {
  const cutoff = cutoffIso(days)
  return loadAll().filter(r => r.firedAt >= cutoff)
}

/** Write a new audit record after orchestration emits an intervention. */
export function writeAuditRecord(record: InterventionAuditRecord): void {
  const all = loadAll()
  const cutoff = cutoffIso(MAX_RECORD_AGE_DAYS)
  // Prune stale records to keep storage bounded
  const pruned = all.filter(r => r.firedAt >= cutoff)
  saveAll([...pruned, record])
}

/** Clear all audit records (test / reset only). */
export function clearAuditRecords(): void {
  saveAll([])
}
