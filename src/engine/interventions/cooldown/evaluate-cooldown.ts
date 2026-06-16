import type { InterventionAuditRecord } from '@/core/contracts/interventions/audit'
import type { ActiveInterventionType } from '@/core/contracts/interventions/types'
import type { CooldownVerdict, InterventionCandidate } from '../types/internal'
import { COOLDOWN_DEFAULTS } from '../matrix/intervention-matrix-v1'

// ---------------------------------------------------------------------------
// Stage 3 — Cooldown gate. Engine reads audit; never writes.
// nowMs is captured once by the orchestrator for deterministic time reference.
// ---------------------------------------------------------------------------

function elapsedHours(iso: string, nowMs: number): number {
  return (nowMs - new Date(iso).getTime()) / (1000 * 60 * 60)
}

function evaluateSingle(
  type: ActiveInterventionType,
  recent: InterventionAuditRecord[],
  nowMs: number,
): CooldownVerdict {
  const cooldownHours = COOLDOWN_DEFAULTS[type] ?? 24
  const lastRecord = recent
    .filter(r => r.type === type)
    .sort((a, b) => new Date(b.firedAt).getTime() - new Date(a.firedAt).getTime())[0]

  if (!lastRecord) {
    return { type, blocked: false, remainingHours: 0 }
  }

  const elapsed = elapsedHours(lastRecord.firedAt, nowMs)
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
  nowMs: number,
): CooldownVerdict[] {
  return eligible.map(c => evaluateSingle(c.type, recentInterventions, nowMs))
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
