import type { InterventionAuditRecord } from '@/core/contracts/interventions/audit'
import type { ActiveInterventionType } from '@/core/contracts/interventions/types'
import type { Timestamp } from '@/core/contracts/primitives'

const ACTIVE_TYPES: readonly ActiveInterventionType[] = [
  'BURNOUT_PREVENTION',
  'RECOVERY_ENFORCEMENT',
  'OVERLOAD',
  'AVOIDANCE_INTERRUPTION',
  'FRAGMENTATION_REDUCTION',
  'DEEP_WORK_PROTECTION',
  'RESTART_ASSISTANCE',
]

// ---------------------------------------------------------------------------
// Persistence read/write for InterventionAuditRecord.
// Orchestration calls these functions — engine never calls them directly.
// Engine receives audit records via InterventionEvaluationContext.recentInterventions.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'cadence-intervention-audit-v1'
// 8 days instead of 7: the longest cooldown (RESTART_ASSISTANCE = 168h = 7d) uses exact hours,
// while setDate() prunes at midnight boundaries. One extra day prevents premature pruning.
const MAX_RECORD_AGE_DAYS = 8

function cutoffIso(days: number): Timestamp {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
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

/** Read audit records from the last N days. Passed to engine as context.
 * Filters out stale-taxonomy records whose type is no longer in the active set. */
export function readRecentAuditRecords(days = MAX_RECORD_AGE_DAYS): InterventionAuditRecord[] {
  const cutoff = cutoffIso(days)
  return loadAll().filter(
    r => r.firedAt >= cutoff && (ACTIVE_TYPES as readonly string[]).includes(r.type),
  )
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
