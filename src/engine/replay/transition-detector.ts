import type { BehavioralEvidence } from '@/core/contracts/history/evidence'
import type { StateDynamicsProfile } from '@/core/contracts/state/dynamics'
import type { ReplayWindowScope } from '@/core/contracts/replay/window'
import type { ReplayTransition, ReplayTransitionSummary, TransitionDirection } from '@/core/contracts/replay/transition'
import type { BehavioralPeriodType } from '@/core/contracts/history/period'
import type { ConfidenceBand } from '@/core/contracts/primitives'
import type { SectionSuppressionMap } from './evidence-gate'
import { guardAllText } from './language-guard'
import type { TrustViolation } from '@/core/contracts/replay/result'

function periodLabel(type: BehavioralPeriodType): string {
  const labels: Record<BehavioralPeriodType, string> = {
    RECOVERY: 'Recovery',
    STABILIZING: 'Stabilizing',
    FOCUSED: 'Focused',
    EXPANDING: 'Expanding',
    INSTABILITY: 'Instability',
  }
  return labels[type]
}

const UPWARD_TRANSITIONS: Array<`${BehavioralPeriodType}->${BehavioralPeriodType}`> = [
  'RECOVERY->STABILIZING',
  'RECOVERY->FOCUSED',
  'STABILIZING->FOCUSED',
  'STABILIZING->EXPANDING',
  'FOCUSED->EXPANDING',
  'INSTABILITY->STABILIZING',
  'INSTABILITY->FOCUSED',
]

const DOWNWARD_TRANSITIONS: Array<`${BehavioralPeriodType}->${BehavioralPeriodType}`> = [
  'FOCUSED->INSTABILITY',
  'FOCUSED->RECOVERY',
  'EXPANDING->INSTABILITY',
  'EXPANDING->RECOVERY',
  'STABILIZING->INSTABILITY',
  'STABILIZING->RECOVERY',
]

function classifyDirection(from: BehavioralPeriodType, to: BehavioralPeriodType): TransitionDirection {
  const key = `${from}->${to}` as `${BehavioralPeriodType}->${BehavioralPeriodType}`
  if ((UPWARD_TRANSITIONS as string[]).includes(key)) return 'UPWARD'
  if ((DOWNWARD_TRANSITIONS as string[]).includes(key)) return 'DOWNWARD'
  return 'LATERAL'
}

function buildTransitionObservation(from: BehavioralPeriodType, to: BehavioralPeriodType, scoreDelta: number | null): string {
  const dir = classifyDirection(from, to)
  const fromLabel = periodLabel(from)
  const toLabel = periodLabel(to)
  if (dir === 'UPWARD') {
    return `A shift from ${fromLabel} to ${toLabel} was observed${scoreDelta != null ? `, coinciding with a ${scoreDelta > 0 ? '+' : ''}${scoreDelta.toFixed(0)} point score change` : ''}.`
  }
  if (dir === 'DOWNWARD') {
    return `A decline from ${fromLabel} to ${toLabel} appeared${scoreDelta != null ? `, in patterns where scores shifted by ${scoreDelta.toFixed(0)} points` : ''}.`
  }
  return `A transition from ${fromLabel} to ${toLabel} was noted in the pattern record.`
}

export function buildTransitionSummary(
  evidence: BehavioralEvidence,
  dynamics: StateDynamicsProfile,
  scope: ReplayWindowScope,
  suppressionMap: SectionSuppressionMap,
  existingViolations: TrustViolation[],
): { transitionSummary: ReplayTransitionSummary; violations: TrustViolation[] } {
  const gate = suppressionMap.transition
  if (gate.suppressed) {
    return {
      transitionSummary: {
        transitions: [],
        netDirection: 'LATERAL',
        scoreDeltaTotal: null,
        sectionHedge: 'TENTATIVE',
        confidence: 'LOW',
        suppressed: true,
        suppressionReason: gate.reason,
      },
      violations: [],
    }
  }

  const startDate = (() => {
    const days = scope === 'W7' ? 7 : scope === 'W14' ? 14 : 28
    const d = new Date()
    d.setDate(d.getDate() - days)
    return d.toISOString().slice(0, 10)
  })()

  const transitions: ReplayTransition[] = dynamics.recentTransitions
    .filter((t) => t.date >= startDate)
    .map((t, i) => {
      const dir = classifyDirection(t.from, t.to)
      const kind = dir === 'UPWARD' ? 'IMPROVEMENT' : dir === 'DOWNWARD' ? 'DECLINE' : 'LATERAL'
      return {
        transitionId: `transition-${i}-${t.date}`,
        fromPeriodType: t.from,
        toPeriodType: t.to,
        kind,
        direction: dir,
        date: t.date,
        avgScoreBefore: null,
        avgScoreAfter: null,
        scoreDelta: t.durationBefore != null ? null : null,
        observation: buildTransitionObservation(t.from, t.to, null),
      }
    })

  // Guard observations
  const guarded = guardAllText(transitions.map((t) => ({ text: t.observation, section: 'transition' as const })))
  const guardedTransitions = transitions.map((t, i) => ({ ...t, observation: guarded.results[i].text }))

  const upwardCount = guardedTransitions.filter((t) => t.direction === 'UPWARD').length
  const downwardCount = guardedTransitions.filter((t) => t.direction === 'DOWNWARD').length
  const netDirection: TransitionDirection = upwardCount > downwardCount ? 'UPWARD' : downwardCount > upwardCount ? 'DOWNWARD' : 'LATERAL'

  const w7 = evidence.snapshots['W7']
  const prior = evidence.snapshots['W7_PRIOR']
  const scoreDeltaTotal = w7 && prior
    ? w7.metrics.avgExecutionScore - prior.metrics.avgExecutionScore
    : null

  const conf: ConfidenceBand = dynamics.confidence === 'high' ? 'HIGH' : dynamics.confidence === 'medium' ? 'MEDIUM' : 'LOW'
  const violations = [...existingViolations, ...guarded.violations]

  return {
    transitionSummary: {
      transitions: guardedTransitions,
      netDirection,
      scoreDeltaTotal,
      sectionHedge: conf === 'HIGH' ? 'CONSISTENT' : conf === 'MEDIUM' ? 'OBSERVED' : 'TENTATIVE',
      confidence: conf,
      suppressed: false,
      suppressionReason: null,
    },
    violations,
  }
}
