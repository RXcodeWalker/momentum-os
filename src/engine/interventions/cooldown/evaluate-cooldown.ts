import type { InterventionAuditRecord } from '@/core/contracts/interventions/audit'
import type { ActiveInterventionType } from '@/core/contracts/interventions/types'
import type { CooldownVerdict, InterventionCandidate } from '../types/internal'
import { COOLDOWN_DEFAULTS } from '../matrix/intervention-matrix-v1'

// ---------------------------------------------------------------------------
// Stage 3 — Cooldown gate. Engine reads audit; never writes.
// ---------------------------------------------------------------------------

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60)
}

function evaluateSingle(
  type: ActiveInterventionType,
  recent: InterventionAuditRecord[],
): CooldownVerdict {
  const cooldownHours = COOLDOWN_DEFAULTS[type] ?? 24
  const lastRecord = recent
    .filter(r => r.type === type)
    .sort((a, b) => b.firedAt.localeCompare(a.firedAt))[0]

  if (!lastRecord) {
    return { type, blocked: false, remainingHours: 0 }
  }

  const elapsed = hoursAgo(lastRecord.firedAt)
  const remaining = cooldownHours - elapsed

  return {
    type,
    blocked: remaining > 0,
    remainingHours: Math.max(0, remaining),
    lastFiredAt: lastRecord.firedAt,
  }
}

export function evaluateCooldown(
  eligible: InterventionCandidate[],
  recentInterventions: InterventionAuditRecord[],
): CooldownVerdict[] {
  return eligible.map(c => evaluateSingle(c.type, recentInterventions))
}

export function filterCooldownBlocked(
  candidates: InterventionCandidate[],
  verdicts: CooldownVerdict[],
): InterventionCandidate[] {
  return candidates.filter(c => {
    const verdict = verdicts.find(v => v.type === c.type)
    return !verdict?.blocked
  })
}
