import type { BehavioralPeriod, BehavioralPeriodType } from '@/core/contracts/history/period'
import type { AggregationSnapshot, WindowKey } from '@/core/contracts/history/snapshot'
import type {
  StateDynamicsProfile,
  TransitionMatrix,
  TransitionPath,
  StateStatistics,
  RecoveryPathwayAnalysis,
  RecoveryPathway,
  InstabilityHotspot,
  OscillationProfile,
  DominantPattern,
  StateDynamics,
  StabilityProfile,
  VolatilityProfile,
  RecoveryCycleStats,
  TrajectoryShiftEvent,
  ModeTransitionSummary,
} from '@/core/contracts/state/dynamics'

const TIER: Record<BehavioralPeriodType, number> = {
  RECOVERY: 0,
  INSTABILITY: 0,
  STABILIZING: 1,
  FOCUSED: 2,
  EXPANDING: 3,
}

type RawTransition = {
  from: BehavioralPeriodType
  to: BehavioralPeriodType
  date: string
  durationBefore: number
  scoreDelta: number
}

function cutoffDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function buildTransitions(periods: BehavioralPeriod[]): RawTransition[] {
  const transitions: RawTransition[] = []
  for (let i = 1; i < periods.length; i++) {
    const prev = periods[i - 1]
    const curr = periods[i]
    if (prev.periodType !== curr.periodType) {
      transitions.push({
        from: prev.periodType,
        to: curr.periodType,
        date: curr.startDate,
        durationBefore: prev.durationDays,
        scoreDelta: curr.avgScore - prev.avgScore,
      })
    }
  }
  return transitions
}

function buildTransitionMatrix(transitions: RawTransition[]): TransitionMatrix {
  const total = transitions.length
  if (total === 0) {
    return { paths: [], commonPaths: [], rarePaths: [], totalTransitions: 0 }
  }

  const grouped = new Map<string, RawTransition[]>()
  for (const t of transitions) {
    const key = `${t.from}→${t.to}`
    const arr = grouped.get(key) ?? []
    arr.push(t)
    grouped.set(key, arr)
  }

  const paths: TransitionPath[] = []
  for (const [, group] of grouped) {
    const { from, to } = group[0]
    paths.push({
      from,
      to,
      count: group.length,
      frequency: group.length / total,
      avgDurationBefore: mean(group.map((t) => t.durationBefore)),
      avgScoreDelta: mean(group.map((t) => t.scoreDelta)),
    })
  }

  paths.sort((a, b) => b.frequency - a.frequency)

  return {
    paths,
    commonPaths: paths.slice(0, 3),
    rarePaths: paths.filter((p) => p.frequency < 0.05),
    totalTransitions: total,
  }
}

function buildStateStatistics(
  periods: BehavioralPeriod[],
  transitions: RawTransition[],
): Partial<Record<BehavioralPeriodType, StateStatistics>> {
  const instabilityPeriods = periods.filter((p) => p.periodType === 'INSTABILITY')
  const totalInstability = instabilityPeriods.length

  // Build predecessor map: for each INSTABILITY period, what came before?
  const instabilityPredecessors: BehavioralPeriodType[] = []
  for (let i = 1; i < periods.length; i++) {
    if (periods[i].periodType === 'INSTABILITY') {
      instabilityPredecessors.push(periods[i - 1].periodType)
    }
  }

  const types = [...new Set(periods.map((p) => p.periodType))]
  const result: Partial<Record<BehavioralPeriodType, StateStatistics>> = {}

  for (const type of types) {
    const ofType = periods.filter((p) => p.periodType === type)
    const durations = ofType.map((p) => p.durationDays)
    const avgDuration = mean(durations)
    const maxDuration = Math.max(...durations)

    // exits from this state that go to RECOVERY or INSTABILITY
    const exitsFromThis = transitions.filter((t) => t.from === type)
    const collapseExits = exitsFromThis.filter(
      (t) => t.to === 'RECOVERY' || t.to === 'INSTABILITY',
    )
    const collapseRate =
      exitsFromThis.length > 0 ? collapseExits.length / exitsFromThis.length : 0

    const instabilityPrecedenceCount = instabilityPredecessors.filter((p) => p === type).length
    const instabilityPrecedenceRate =
      totalInstability > 0 ? instabilityPrecedenceCount / totalInstability : 0

    result[type] = {
      type,
      occurrenceCount: ofType.length,
      avgDurationDays: avgDuration,
      maxDurationDays: maxDuration,
      persistenceScore: Math.min((avgDuration / 14) * 100, 100),
      collapseRate,
      instabilityPrecedenceRate,
    }
  }

  return result
}

function buildRecoveryPathwayAnalysis(periods: BehavioralPeriod[]): RecoveryPathwayAnalysis {
  const SUCCESSFUL_EXITS: BehavioralPeriodType[] = ['STABILIZING', 'FOCUSED', 'EXPANDING']

  const exitGroups = new Map<BehavioralPeriodType, RecoveryPathway>()
  let failedRecoveries = 0
  const daysToFocusedList: number[] = []

  for (let i = 0; i < periods.length; i++) {
    if (periods[i].periodType !== 'RECOVERY') continue
    if (i + 1 >= periods.length) continue

    const exitState = periods[i + 1].periodType
    const isSuccessful = SUCCESSFUL_EXITS.includes(exitState)

    if (!isSuccessful) {
      failedRecoveries++
    }

    // Walk forward to find how many days until FOCUSED/EXPANDING
    let daysToFocused: number | null = null
    if (isSuccessful) {
      let dayCount = periods[i + 1].durationDays
      if (exitState === 'FOCUSED' || exitState === 'EXPANDING') {
        daysToFocused = dayCount
      } else {
        // keep walking
        for (let j = i + 2; j < periods.length; j++) {
          if (periods[j].periodType === 'FOCUSED' || periods[j].periodType === 'EXPANDING') {
            daysToFocused = dayCount
            break
          }
          dayCount += periods[j].durationDays
        }
      }
      if (daysToFocused !== null) daysToFocusedList.push(daysToFocused)
    }

    const existing = exitGroups.get(exitState)
    if (existing) {
      existing.count++
      if (daysToFocused !== null && existing.avgDaysToFocused !== null) {
        existing.avgDaysToFocused = (existing.avgDaysToFocused * (existing.count - 1) + daysToFocused) / existing.count
      }
    } else {
      exitGroups.set(exitState, {
        exitState,
        count: 1,
        isSuccessful,
        avgDaysToFocused: daysToFocused,
      })
    }
  }

  const pathways = [...exitGroups.values()]

  const mostCommonExitState =
    pathways.length > 0
      ? pathways.reduce((a, b) => (a.count >= b.count ? a : b)).exitState
      : null

  const successfulPathways = pathways.filter((p) => p.isSuccessful && p.avgDaysToFocused !== null)
  const mostSuccessfulPathway =
    successfulPathways.length > 0
      ? successfulPathways.reduce((a, b) =>
          (a.avgDaysToFocused ?? Infinity) <= (b.avgDaysToFocused ?? Infinity) ? a : b,
        )
      : null

  return {
    pathways,
    failedRecoveries,
    avgDaysToFocusedFromRecovery: daysToFocusedList.length > 0 ? mean(daysToFocusedList) : null,
    mostCommonExitState,
    mostSuccessfulPathway,
  }
}

function buildInstabilityHotspots(periods: BehavioralPeriod[]): InstabilityHotspot[] {
  const instabilityPeriods = periods.filter((p) => p.periodType === 'INSTABILITY')
  const total = instabilityPeriods.length
  if (total === 0) return []

  const predecessorCounts = new Map<BehavioralPeriodType, number>()
  for (let i = 1; i < periods.length; i++) {
    if (periods[i].periodType === 'INSTABILITY') {
      const pred = periods[i - 1].periodType
      predecessorCounts.set(pred, (predecessorCounts.get(pred) ?? 0) + 1)
    }
  }

  const hotspots: InstabilityHotspot[] = []
  for (const [predecessorState, count] of predecessorCounts) {
    const precedenceRate = count / total
    hotspots.push({
      predecessorState,
      precedenceRate,
      count,
      riskSignal: precedenceRate >= 0.5 ? 'high' : precedenceRate >= 0.25 ? 'moderate' : 'low',
    })
  }

  hotspots.sort((a, b) => b.precedenceRate - a.precedenceRate)
  return hotspots
}

function buildOscillation(
  transitions: RawTransition[],
  periods: BehavioralPeriod[],
): OscillationProfile {
  const cutoff28 = cutoffDate(28)
  const recent = transitions.filter((t) => t.date >= cutoff28)
  const freqPer28 = recent.length

  // find most repeated (from, to) pair
  const pairCounts = new Map<string, { from: BehavioralPeriodType; to: BehavioralPeriodType; count: number }>()
  for (const t of transitions) {
    const key = `${t.from}→${t.to}`
    const existing = pairCounts.get(key)
    if (existing) {
      existing.count++
    } else {
      pairCounts.set(key, { from: t.from, to: t.to, count: 1 })
    }
  }

  let dominantCyclePair: { from: BehavioralPeriodType; to: BehavioralPeriodType } | null = null
  let maxCount = 0
  for (const entry of pairCounts.values()) {
    if (entry.count > maxCount) {
      maxCount = entry.count
      dominantCyclePair = { from: entry.from, to: entry.to }
    }
  }

  // Count back-and-forth cycles (A→B followed by B→A)
  let cycleCount = 0
  for (let i = 1; i < transitions.length; i++) {
    if (transitions[i].from === transitions[i - 1].to && transitions[i].to === transitions[i - 1].from) {
      cycleCount++
    }
  }

  void periods

  return {
    isOscillating: freqPer28 >= 4 || cycleCount >= 2,
    frequencyPer28Days: freqPer28,
    dominantCyclePair,
    cycleCount,
  }
}

function classifyDominantPattern(
  oscillation: OscillationProfile,
  transitions: RawTransition[],
): DominantPattern {
  if (oscillation.isOscillating) return 'cycling'
  if (oscillation.frequencyPer28Days < 1) return 'stable'

  const last3 = transitions.slice(-3)
  if (last3.length === 3) {
    const allExpanding = last3.every((t) => TIER[t.to] > TIER[t.from])
    if (allExpanding) return 'expanding'
    const allContracting = last3.every((t) => TIER[t.to] < TIER[t.from])
    if (allContracting) return 'contracting'
  }

  return 'erratic'
}

export function computeStateDynamicsProfile(
  periods: BehavioralPeriod[],
  snapshots: Partial<Record<WindowKey, AggregationSnapshot>>,
): StateDynamicsProfile {
  void snapshots

  const cutoff90 = cutoffDate(90)
  const sorted = [...periods]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .filter((p) => p.startDate >= cutoff90)

  const transitions = buildTransitions(sorted)
  const transitionMatrix = buildTransitionMatrix(transitions)
  const stateStatistics = buildStateStatistics(sorted, transitions)
  const recoveryPathwayAnalysis = buildRecoveryPathwayAnalysis(sorted)
  const instabilityHotspots = buildInstabilityHotspots(sorted)
  const oscillation = buildOscillation(transitions, sorted)
  const dominantPattern = classifyDominantPattern(oscillation, transitions)

  // Most stable state: highest persistenceScore
  let mostStableState: BehavioralPeriodType | null = null
  let highestPersistence = -1
  for (const [type, stats] of Object.entries(stateStatistics) as [BehavioralPeriodType, StateStatistics][]) {
    if (stats.persistenceScore > highestPersistence) {
      highestPersistence = stats.persistenceScore
      mostStableState = type
    }
  }

  // Most volatile transition: largest absolute avgScoreDelta
  let mostVolatileTransition: { from: BehavioralPeriodType; to: BehavioralPeriodType } | null = null
  let maxDelta = -1
  for (const path of transitionMatrix.paths) {
    if (Math.abs(path.avgScoreDelta) > maxDelta) {
      maxDelta = Math.abs(path.avgScoreDelta)
      mostVolatileTransition = { from: path.from, to: path.to }
    }
  }

  const confidence: StateDynamicsProfile['confidence'] =
    sorted.length < 3 ? 'low' : sorted.length < 8 ? 'medium' : 'high'

  const earliest = sorted[0]?.startDate ?? new Date().toISOString().slice(0, 10)
  const latest = sorted[sorted.length - 1]?.endDate ?? new Date().toISOString().slice(0, 10)
  const windowDays = Math.max(
    1,
    Math.round((new Date(latest).getTime() - new Date(earliest).getTime()) / 86_400_000),
  )

  return {
    transitionMatrix,
    stateStatistics,
    recoveryPathwayAnalysis,
    instabilityHotspots,
    oscillation,
    mostStableState,
    mostVolatileTransition,
    dominantPattern,
    periodCount: sorted.length,
    windowDays,
    confidence,
    computedAt: new Date().toISOString().slice(0, 10),
  }
}

export function computeStateDynamics(
  periods: BehavioralPeriod[],
  snapshots: Partial<Record<WindowKey, AggregationSnapshot>>,
  history: { score?: number; date: string }[],
): StateDynamics {
  const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const current = sorted[sorted.length - 1] ?? null
  const transitions = buildTransitions(sorted)

  const recentTransitions: ModeTransitionSummary[] = transitions.slice(-5).map((t) => ({
    from: t.from,
    to: t.to,
    date: t.date,
    durationBefore: t.durationBefore,
  }))

  // Stability
  const currentModeDays = current?.durationDays ?? 0
  const rating: import('@/core/contracts/state/dynamics').StabilityRating =
    transitions.length === 0
      ? 'stable'
      : currentModeDays >= 14
        ? 'stable'
        : currentModeDays >= 7
          ? 'building'
          : transitions.length >= 6
            ? 'volatile'
            : 'transitioning'

  let longestStablePeriodDays = 0
  let longestStablePeriodType: BehavioralPeriodType | null = null
  for (const p of sorted) {
    if (p.durationDays > longestStablePeriodDays) {
      longestStablePeriodDays = p.durationDays
      longestStablePeriodType = p.periodType
    }
  }

  const stability: StabilityProfile = {
    currentModeDays,
    rating,
    longestStablePeriodDays,
    longestStablePeriodType,
  }

  // Volatility using W14 snapshot stdDev
  const w14 = snapshots['W14']
  const scoreStdDev14d = w14?.metrics.scoreStdDev ?? 0
  const volatilityScore = Math.min(Math.round(scoreStdDev14d * 5), 100)
  const volatility: VolatilityProfile = {
    score: volatilityScore,
    trend: 'stable',
    scoreStdDev14d,
    interpretation:
      scoreStdDev14d > 15
        ? 'High day-to-day variability'
        : scoreStdDev14d > 8
          ? 'Moderate variability'
          : 'Consistent execution',
  }

  // Oscillation
  const oscillation = buildOscillation(transitions, sorted)

  // Recovery cycles
  const recoveryPeriods = sorted.filter((p) => p.periodType === 'RECOVERY')
  const durations = recoveryPeriods.map((p) => p.durationDays)
  const recoveryCycles: RecoveryCycleStats = {
    count: recoveryPeriods.length,
    avgDurationDays: mean(durations),
    lastDurationDays: durations[durations.length - 1] ?? 0,
    longestDurationDays: durations.length > 0 ? Math.max(...durations) : 0,
    successRate: 0,
  }

  // Trajectory shifts (significant tier changes)
  const trajectoryShifts: TrajectoryShiftEvent[] = transitions
    .filter((t) => Math.abs(TIER[t.to] - TIER[t.from]) >= 2)
    .map((t) => ({
      from: t.from,
      to: t.to,
      date: t.date,
      significance: (Math.abs(TIER[t.to] - TIER[t.from]) >= 3 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
    }))

  void history

  return {
    currentPeriod: current?.periodType ?? null,
    recentTransitions,
    stability,
    volatility,
    oscillation,
    recoveryCycles,
    trajectoryShifts,
    evidenceDays: sorted.reduce((sum, p) => sum + p.durationDays, 0),
    confidence: sorted.length < 3 ? 'low' : sorted.length < 8 ? 'medium' : 'high',
  }
}
