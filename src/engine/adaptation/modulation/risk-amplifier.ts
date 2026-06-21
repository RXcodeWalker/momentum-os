import type { RiskLevel } from '@/core/contracts/primitives'
import type { AdaptationContext, AdaptationDraft } from '../types/internal'
import type { TraceRecorder } from '../trace/trace-recorder'
import { RISK_GATES } from '../config'

const RISK_PRIORITY: RiskLevel[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']

function riskAtLeast(actual: RiskLevel, threshold: RiskLevel): boolean {
  return RISK_PRIORITY.indexOf(actual) >= RISK_PRIORITY.indexOf(threshold)
}

export function applyRiskAmplification(
  draft: AdaptationDraft,
  ctx: AdaptationContext,
  recorder: TraceRecorder,
): void {
  let anyFired = false

  for (const entry of RISK_GATES) {
    const actual = ctx[entry.risk as keyof AdaptationContext] as RiskLevel
    if (!riskAtLeast(actual, entry.level)) continue

    for (const gate of entry.gates) {
      const field = gate.field as keyof AdaptationDraft
      const prev = draft[field] as number | boolean

      let next: number | boolean = prev
      if (typeof prev === 'number' && typeof gate.value === 'number') {
        if (gate.op === 'ceil') next = Math.min(prev, gate.value)
        else if (gate.op === 'floor') next = Math.max(prev, gate.value)
        else next = gate.value
      } else if (gate.op === 'set') {
        next = gate.value
      }

      if (prev !== next) {
        ;(draft as Record<string, unknown>)[field as string] = next
        recorder.record(
          `${domainFor(field as string)}.${field}`,
          prev,
          next,
          'risk',
          gate.reason,
        )
        anyFired = true
      }
    }
  }

  if (anyFired) {
    draft.reasoning.push(`Risk gates applied (burnout=${ctx.burnoutRisk}, overload=${ctx.overloadRisk}, avoidance=${ctx.avoidanceRisk}, collapse=${ctx.collapseRisk})`)
  }
}

function domainFor(field: string): string {
  const exec = ['visibleTaskLimit', 'recommendedChallengeLevel', 'workloadCompressionRatio', 'deepWorkExpectation', 'recoveryWeighting', 'advancementWeighting', 'focusProtectionStrength']
  const guidance = ['interventionFrequency', 'reflectionDepth', 'strategicGuidanceWeight', 'emotionalPressureLevel', 'clarityOrientation']
  if (exec.includes(field)) return 'execution'
  if (guidance.includes(field)) return 'guidance'
  return 'environmental'
}
