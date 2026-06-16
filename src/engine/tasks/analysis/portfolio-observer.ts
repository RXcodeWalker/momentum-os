import type { ConfidenceBand } from '@/core/contracts/primitives'
import type { UserState } from '@/core/contracts/state/user-state'
import type { SignalSnapshot } from '@/core/contracts/signals/signal-snapshot'
import type { Task } from '@/core/contracts/tasks/task'
import type { TaskScore } from '@/core/contracts/tasks/scores'
import {
  AVOIDANCE_RELATED_SIGNALS,
  DEFERRAL_THRESHOLD,
  HIGH_MEANINGFULNESS_THRESHOLD,
  HIGH_RESISTANCE_THRESHOLD,
  LOW_MEANINGFULNESS_THRESHOLD,
  LOW_MEANINGFUL_ENGAGEMENT,
  MIN_PORTFOLIO_TASKS,
} from '../config'
import {
  lowerConfidence,
  type PortfolioObservation,
  type PortfolioPattern,
} from './types'

// ---------------------------------------------------------------------------
// Portfolio observation — observational patterns, not intervention triggers
// ---------------------------------------------------------------------------

export type { PortfolioObservation } from './types'

function hasAvoidanceSignals(snapshot?: SignalSnapshot): boolean {
  if (!snapshot) return false
  return AVOIDANCE_RELATED_SIGNALS.some(s => snapshot.activeSignals.includes(s))
}

function isPlanningContext(tasks: Task[]): boolean {
  const deferredAdvancement = tasks.filter(
    t => t.category === 'ADVANCEMENT' && t.repeatedDeferralCount >= DEFERRAL_THRESHOLD,
  )
  if (deferredAdvancement.length === 0) return false
  return deferredAdvancement.every(t => t.timeHorizon === 'LONG')
}

function resolveConfidence(
  patternCount: number,
  signalSnapshot: SignalSnapshot | undefined,
): ConfidenceBand {
  if (patternCount === 0) return 'LOW'
  let band: ConfidenceBand = patternCount >= 2 ? 'HIGH' : 'MEDIUM'
  if (signalSnapshot && !hasAvoidanceSignals(signalSnapshot)) {
    band = lowerConfidence(band, 'MEDIUM')
  }
  return band
}

function detectMaintenanceAdvancementGap(
  tasks: Task[],
  state: UserState,
): PortfolioPattern | undefined {
  if (state.currentMode === 'RECOVERY' || state.currentMode === 'STABILIZING') return undefined
  if (state.meaningfulEngagement <= LOW_MEANINGFUL_ENGAGEMENT) return undefined

  const maintenance = tasks.filter(t => t.category === 'MAINTENANCE')
  const deferredAdvancement = tasks.filter(
    t => t.category === 'ADVANCEMENT' && t.repeatedDeferralCount >= DEFERRAL_THRESHOLD,
  )

  if (deferredAdvancement.length === 0) return undefined
  if (maintenance.length < deferredAdvancement.length) return undefined

  const lowDeferralMaintenance = maintenance.filter(
    t => t.repeatedDeferralCount < DEFERRAL_THRESHOLD,
  )
  if (lowDeferralMaintenance.length === 0) return undefined

  return 'MAINTENANCE_ADVANCEMENT_GAP'
}

function detectSupportAdvancementGap(tasks: Task[]): PortfolioPattern | undefined {
  if (isPlanningContext(tasks)) return undefined

  const support = tasks.filter(t => t.category === 'SUPPORT')
  const deferredAdvancement = tasks.filter(
    t => t.category === 'ADVANCEMENT' && t.repeatedDeferralCount >= DEFERRAL_THRESHOLD,
  )

  if (support.length < 2 || deferredAdvancement.length === 0) return undefined
  if (support.length / tasks.length < 0.35) return undefined

  return 'SUPPORT_ADVANCEMENT_GAP'
}

function detectResistanceCluster(tasks: Task[]): PortfolioPattern | undefined {
  const cluster = tasks.filter(
    t =>
      t.emotionalResistance >= HIGH_RESISTANCE_THRESHOLD &&
      t.meaningfulness >= HIGH_MEANINGFULNESS_THRESHOLD &&
      t.repeatedDeferralCount >= DEFERRAL_THRESHOLD,
  )
  return cluster.length >= 2 ? 'HIGH_RESISTANCE_DEFERRAL_CLUSTER' : undefined
}

function detectLowValueCluster(tasks: Task[], state: UserState): PortfolioPattern | undefined {
  if (state.currentMode !== 'FOCUSED') return undefined
  if (state.deepWorkContinuity <= LOW_MEANINGFUL_ENGAGEMENT) return undefined

  const lowValue = tasks.filter(
    t =>
      t.meaningfulness < LOW_MEANINGFULNESS_THRESHOLD &&
      t.repeatedDeferralCount < DEFERRAL_THRESHOLD,
  )
  const deepWorkCandidates = tasks.filter(
    t => t.deepWorkCompatibility >= 60 && t.meaningfulness >= HIGH_MEANINGFULNESS_THRESHOLD,
  )

  if (lowValue.length < 2 || deepWorkCandidates.length === 0) return undefined
  if (lowValue.length <= deepWorkCandidates.length) return undefined

  return 'LOW_VALUE_TASK_CLUSTER'
}

const PATTERN_OBSERVATIONS: Record<PortfolioPattern, string> = {
  MAINTENANCE_ADVANCEMENT_GAP:
    'Patterns may suggest maintenance activity is recurring while meaningful advancement tasks remain deferred.',
  SUPPORT_ADVANCEMENT_GAP:
    'Patterns may suggest planning or support activity is prominent relative to deferred advancement execution.',
  HIGH_RESISTANCE_DEFERRAL_CLUSTER:
    'Patterns may suggest a cluster of meaningful tasks with elevated resistance are being repeatedly postponed.',
  LOW_VALUE_TASK_CLUSTER:
    'Patterns may suggest lower-meaningfulness tasks are surfacing ahead of deeper work candidates.',
}

export function observePortfolio(
  tasks: Task[],
  _scores: TaskScore[],
  state: UserState,
  signalSnapshot?: SignalSnapshot,
): PortfolioObservation {
  if (tasks.length < MIN_PORTFOLIO_TASKS) {
    return { patterns: [], confidenceBand: 'LOW', observations: [] }
  }

  const patterns: PortfolioPattern[] = []

  const maintenanceGap = detectMaintenanceAdvancementGap(tasks, state)
  if (maintenanceGap) patterns.push(maintenanceGap)

  const supportGap = detectSupportAdvancementGap(tasks)
  if (supportGap) patterns.push(supportGap)

  const resistanceCluster = detectResistanceCluster(tasks)
  if (resistanceCluster) patterns.push(resistanceCluster)

  const lowValueCluster = detectLowValueCluster(tasks, state)
  if (lowValueCluster) patterns.push(lowValueCluster)

  const confidenceBand = resolveConfidence(patterns.length, signalSnapshot)
  const soften = signalSnapshot && !hasAvoidanceSignals(signalSnapshot)
  const observations = patterns.map(p => {
    const base = PATTERN_OBSERVATIONS[p]
    return soften ? base.replace('may suggest', 'could tentatively suggest') : base
  })

  return { patterns, confidenceBand, observations }
}
