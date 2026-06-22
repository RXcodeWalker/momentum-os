import type { BehavioralEvidence } from '@/core/contracts/history/evidence'
import type { StateDynamicsProfile } from '@/core/contracts/state/dynamics'
import type { PatternDetectionProfile } from '@/core/contracts/patterns/profile'
import type { ReplayWindowScope } from '@/core/contracts/replay/window'
import type { ReplayResult, TrustViolation } from '@/core/contracts/replay/result'
import { computeSuppressionMap, suppressedSectionsList } from './evidence-gate'
import { buildNarrative } from './narrative-builder'
import { buildAttribution } from './attribution-engine'
import { buildTransitionSummary } from './transition-detector'
import { buildForecast } from './forecast-engine'

export function buildReplay(
  evidence: BehavioralEvidence,
  dynamics: StateDynamicsProfile,
  patterns: PatternDetectionProfile,
  scope: ReplayWindowScope = 'W7',
): ReplayResult {
  const suppressionMap = computeSuppressionMap(evidence, scope)
  const allViolations: TrustViolation[] = []

  const { narrative, violations: narrativeViolations } = buildNarrative(evidence, scope, suppressionMap, [])
  allViolations.push(...narrativeViolations)

  const { attribution, violations: attributionViolations } = buildAttribution(evidence, scope, suppressionMap, [])
  allViolations.push(...attributionViolations)

  const { transitionSummary, violations: transitionViolations } = buildTransitionSummary(evidence, dynamics, scope, suppressionMap, [])
  allViolations.push(...transitionViolations)

  const { forecast, violations: forecastViolations } = buildForecast(dynamics, patterns, suppressionMap, [])
  allViolations.push(...forecastViolations)

  return {
    windowScope: scope,
    generatedAt: new Date().toISOString(),
    narrative,
    attribution,
    transitionSummary,
    forecast,
    trustBoundary: {
      causalGuardFired: allViolations.some((v) => v.rule === 'causal'),
      diagnosticGuardFired: allViolations.some((v) => v.rule === 'diagnostic'),
      formulaGuardFired: allViolations.some((v) => v.rule === 'formula'),
      suppressedSections: suppressedSectionsList(suppressionMap),
      violations: allViolations,
    },
  }
}
