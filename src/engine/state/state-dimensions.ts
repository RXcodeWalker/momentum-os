import type { SessionEvidence } from '@/core/contracts/signals/session-evidence'
import type {
  StateDimensions,
  RecoveryDebtModel,
  CognitiveStrainModel,
  ExecutionStabilityModel,
  EmotionalFrictionModel,
} from '@/core/contracts/state/dimensions'
import type { TrendDirection } from '@/core/contracts/primitives'
import { movingAverage, weightedAverage } from '@/engine/signals/averages'
import { calculateTrend } from '@/engine/signals/trend'
import { DIMENSION_SMOOTHING_WINDOW, EVIDENCE_DEFAULTS } from './config'

// ---------------------------------------------------------------------------
// Internal series types — all values 0–100
// ---------------------------------------------------------------------------

type RawSeries = {
  sleepQuality: number[]
  physicalEnergy: number[]
  mentalClarity: number[]
  overwhelm: number[]
  emotionalResistance: number[]
  stressPressure: number[]
  meaningfulAdvancementQuality: number[]
  deepWorkContinuity: number[]
  executionIntegrity: number[]
  fragmentationLevel: number[]
  distractionPatterns: number[]
  avoidancePressure: number[]
  pacingQuality: number[]
}

type SmoothedSeries = RawSeries

type RecentValues = {
  sleepQuality: number
  physicalEnergy: number
  mentalClarity: number
  overwhelm: number
  emotionalResistance: number
  stressPressure: number
  meaningfulAdvancementQuality: number
  deepWorkContinuity: number
  executionIntegrity: number
  fragmentationLevel: number
  distractionPatterns: number
  avoidancePressure: number
  pacingQuality: number
}

// ---------------------------------------------------------------------------
// Public output type
// ---------------------------------------------------------------------------

export type DimensionResult = {
  core: StateDimensions
  // Primary scalars (UserState fields)
  recoveryDebt: number
  cognitiveStrain: number
  executionStability: number
  emotionalFriction: number
  // Secondary scalars (UserState fields)
  momentumIntegrity: number
  resilienceCapacity: number
  overwhelmLevel: number
  fragmentationLevel: number
  recoveryCapacity: number
  meaningfulEngagement: number
  deepWorkContinuity: number
  behavioralVolatility: number
  // Readiness
  adaptationReadiness: number
  expansionReadiness: number
  // Trend directions
  consistencyTrend: TrendDirection
  recoveryTrend: TrendDirection
  engagementTrend: TrendDirection
}

// ---------------------------------------------------------------------------
// Evidence extraction
// ---------------------------------------------------------------------------

function extractRawSeries(sorted: SessionEvidence[]): RawSeries {
  return {
    sleepQuality:                  sorted.map(e => e.inputs.recoveryInputs.sleepQuality),
    physicalEnergy:                sorted.map(e => e.inputs.recoveryInputs.physicalEnergy),
    mentalClarity:                 sorted.map(e => e.inputs.recoveryInputs.mentalClarity),
    overwhelm:                     sorted.map(e => e.inputs.emotionalInputs.overwhelm),
    emotionalResistance:           sorted.map(e => e.inputs.emotionalInputs.emotionalResistance),
    stressPressure:                sorted.map(e => e.inputs.emotionalInputs.stressPressure),
    meaningfulAdvancementQuality:  sorted.map(e => e.inputs.executionInputs.meaningfulAdvancementQuality),
    deepWorkContinuity:            sorted.map(e => e.inputs.executionInputs.deepWorkContinuity),
    executionIntegrity:            sorted.map(e => e.inputs.executionInputs.executionIntegrity),
    fragmentationLevel:            sorted.map(e => e.inputs.behavioralInputs.fragmentationLevel),
    distractionPatterns:           sorted.map(e => e.inputs.behavioralInputs.distractionPatterns),
    avoidancePressure:             sorted.map(e => e.inputs.behavioralInputs.avoidancePressure),
    pacingQuality:                 sorted.map(e => e.inputs.behavioralInputs.pacingQuality),
  }
}

function applySmoothing(raw: RawSeries): SmoothedSeries {
  const w = DIMENSION_SMOOTHING_WINDOW
  return {
    sleepQuality:                 movingAverage(raw.sleepQuality, w),
    physicalEnergy:               movingAverage(raw.physicalEnergy, w),
    mentalClarity:                movingAverage(raw.mentalClarity, w),
    overwhelm:                    movingAverage(raw.overwhelm, w),
    emotionalResistance:          movingAverage(raw.emotionalResistance, w),
    stressPressure:               movingAverage(raw.stressPressure, w),
    meaningfulAdvancementQuality: movingAverage(raw.meaningfulAdvancementQuality, w),
    deepWorkContinuity:           movingAverage(raw.deepWorkContinuity, w),
    executionIntegrity:           movingAverage(raw.executionIntegrity, w),
    fragmentationLevel:           movingAverage(raw.fragmentationLevel, w),
    distractionPatterns:          movingAverage(raw.distractionPatterns, w),
    avoidancePressure:            movingAverage(raw.avoidancePressure, w),
    pacingQuality:                movingAverage(raw.pacingQuality, w),
  }
}

function last(series: number[]): number {
  return series[series.length - 1]
}

function getRecentValues(smooth: SmoothedSeries): RecentValues {
  return {
    sleepQuality:                 last(smooth.sleepQuality),
    physicalEnergy:               last(smooth.physicalEnergy),
    mentalClarity:                last(smooth.mentalClarity),
    overwhelm:                    last(smooth.overwhelm),
    emotionalResistance:          last(smooth.emotionalResistance),
    stressPressure:               last(smooth.stressPressure),
    meaningfulAdvancementQuality: last(smooth.meaningfulAdvancementQuality),
    deepWorkContinuity:           last(smooth.deepWorkContinuity),
    executionIntegrity:           last(smooth.executionIntegrity),
    fragmentationLevel:           last(smooth.fragmentationLevel),
    distractionPatterns:          last(smooth.distractionPatterns),
    avoidancePressure:            last(smooth.avoidancePressure),
    pacingQuality:                last(smooth.pacingQuality),
  }
}

// ---------------------------------------------------------------------------
// Statistical helpers
// ---------------------------------------------------------------------------

function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

/** 0–100; 100 = perfectly consistent, 0 = wildly inconsistent. */
function consistency(values: number[]): number {
  return Math.max(0, 100 - stddev(values) * 2.5)
}

/** Day-to-day mean absolute variation in a composite behavioral index. */
function computeBehavioralVolatility(smooth: SmoothedSeries): number {
  const composite = smooth.fragmentationLevel.map((f, i) =>
    f * 0.4 + smooth.avoidancePressure[i] * 0.35 + (100 - smooth.pacingQuality[i]) * 0.25,
  )
  if (composite.length < 2) return 0
  const deltas: number[] = []
  for (let i = 1; i < composite.length; i++) {
    deltas.push(Math.abs(composite[i] - composite[i - 1]))
  }
  const avg = deltas.reduce((s, d) => s + d, 0) / deltas.length
  return Math.min(100, avg * 4)
}

/** Captures high execution demand while recovery is declining — risk proxy. */
function computeSustainedIntensity(smooth: SmoothedSeries): number {
  const execLast = last(smooth.executionIntegrity)
  const recovLast =
    last(smooth.sleepQuality) * 0.4 +
    last(smooth.physicalEnergy) * 0.3 +
    last(smooth.mentalClarity) * 0.3
  return Math.min(100, execLast * (1 - recovLast / 100))
}

/** Recency-weighted accumulated deficit below a recovery threshold. */
function computeExhaustionAccumulation(sleepSeries: number[]): number {
  const window = sleepSeries.slice(-7)
  if (window.length === 0) return 0
  const threshold = 55
  let acc = 0
  for (let i = 0; i < window.length; i++) {
    const weight = (i + 1) / window.length
    if (window[i] < threshold) {
      acc += ((threshold - window[i]) / threshold) * weight
    }
  }
  return Math.min(100, (acc / window.length) * 200)
}

// ---------------------------------------------------------------------------
// Sub-model builders
// ---------------------------------------------------------------------------

function buildRecoveryDebtModel(
  recent: RecentValues,
  raw: RawSeries,
  smooth: SmoothedSeries,
): RecoveryDebtModel {
  return {
    sleepQuality:            recent.sleepQuality,
    sleepConsistency:        consistency(raw.sleepQuality),
    sustainedIntensity:      computeSustainedIntensity(smooth),
    recoveryBehaviorQuality: weightedAverage(
      [recent.physicalEnergy, recent.mentalClarity],
      [0.5, 0.5],
    ),
    exhaustionAccumulation: computeExhaustionAccumulation(raw.sleepQuality),
  }
}

function buildCognitiveStrainModel(
  recent: RecentValues,
  smooth: SmoothedSeries,
): CognitiveStrainModel {
  const deepWorkTrend = calculateTrend(smooth.deepWorkContinuity)
  const deepWorkDegradation = deepWorkTrend === 'DECLINING'
    ? Math.max(0, 100 - last(smooth.deepWorkContinuity))
    : Math.max(0, 65 - last(smooth.deepWorkContinuity))

  return {
    taskSwitchingRate:    weightedAverage([recent.fragmentationLevel, recent.distractionPatterns], [0.6, 0.4]),
    ambiguityExposure:    weightedAverage([recent.stressPressure, 100 - recent.executionIntegrity], [0.5, 0.5]),
    interruptionDensity:  recent.distractionPatterns,
    activeCommitmentLoad: weightedAverage([recent.executionIntegrity, recent.fragmentationLevel], [0.5, 0.5]),
    deepWorkDegradation:  Math.min(100, deepWorkDegradation),
  }
}

function buildExecutionStabilityModel(
  recent: RecentValues,
  raw: RawSeries,
  smooth: SmoothedSeries,
): ExecutionStabilityModel {
  return {
    meaningfulCompletionIntegrity: recent.meaningfulAdvancementQuality,
    rhythmConsistency:             consistency(raw.executionIntegrity),
    followThroughReliability:      recent.executionIntegrity,
    pacingStability:               recent.pacingQuality,
    volatilityResistance:          Math.max(0, 100 - computeBehavioralVolatility(smooth)),
  }
}

function buildEmotionalFrictionModel(recent: RecentValues): EmotionalFrictionModel {
  return {
    initiationResistance:  weightedAverage([recent.avoidancePressure, recent.emotionalResistance], [0.6, 0.4]),
    avoidancePressure:     recent.avoidancePressure,
    perfectionismPressure: weightedAverage([recent.stressPressure, 100 - recent.executionIntegrity], [0.55, 0.45]),
    overwhelmWeight:       recent.overwhelm,
    uncertaintyResistance: weightedAverage([recent.stressPressure, recent.emotionalResistance], [0.55, 0.45]),
  }
}

// ---------------------------------------------------------------------------
// Scalar collapses
// ---------------------------------------------------------------------------

function collapseRecoveryDebt(m: RecoveryDebtModel): number {
  return weightedAverage(
    [
      100 - m.sleepQuality,
      100 - m.sleepConsistency,
      m.sustainedIntensity,
      100 - m.recoveryBehaviorQuality,
      m.exhaustionAccumulation,
    ],
    [0.35, 0.15, 0.20, 0.15, 0.15],
  )
}

function collapseCognitiveStrain(m: CognitiveStrainModel): number {
  return weightedAverage(
    [m.taskSwitchingRate, m.ambiguityExposure, m.interruptionDensity, m.activeCommitmentLoad, m.deepWorkDegradation],
    [0.25, 0.20, 0.25, 0.15, 0.15],
  )
}

function collapseExecutionStability(m: ExecutionStabilityModel): number {
  return weightedAverage(
    [
      m.meaningfulCompletionIntegrity,
      m.rhythmConsistency,
      m.followThroughReliability,
      m.pacingStability,
      m.volatilityResistance,
    ],
    [0.30, 0.25, 0.20, 0.15, 0.10],
  )
}

function collapseEmotionalFriction(m: EmotionalFrictionModel): number {
  return weightedAverage(
    [m.initiationResistance, m.avoidancePressure, m.perfectionismPressure, m.overwhelmWeight, m.uncertaintyResistance],
    [0.25, 0.25, 0.15, 0.25, 0.10],
  )
}

// ---------------------------------------------------------------------------
// Secondary scalars
// ---------------------------------------------------------------------------

function computeMomentumIntegrity(smooth: SmoothedSeries): number {
  const execMean = smooth.executionIntegrity.reduce((s, v) => s + v, 0) / smooth.executionIntegrity.length
  const execConsistency = consistency(smooth.executionIntegrity)
  const meaningMean =
    smooth.meaningfulAdvancementQuality.reduce((s, v) => s + v, 0) /
    smooth.meaningfulAdvancementQuality.length
  return weightedAverage([execMean, execConsistency, meaningMean], [0.40, 0.35, 0.25])
}

function computeResilienceCapacity(
  recoveryCapacity: number,
  emotionalFriction: number,
  cognitiveStrain: number,
): number {
  const frictionFactor = 1 - emotionalFriction / 100
  const strainFactor   = 1 - cognitiveStrain / 100
  return Math.min(100, recoveryCapacity * frictionFactor * strainFactor * 1.6)
}

// ---------------------------------------------------------------------------
// Default result (empty evidence)
// ---------------------------------------------------------------------------

function buildDefaultDimensions(): DimensionResult {
  const d = EVIDENCE_DEFAULTS
  const recoveryDebt       = 35
  const cognitiveStrain    = 22
  const executionStability = 62
  const emotionalFriction  = 26
  const recoveryCapacity   = d.sleepQuality * 0.4 + d.physicalEnergy * 0.3 + d.mentalClarity * 0.3

  return {
    core: {
      recoveryDebt: {
        sleepQuality: d.sleepQuality, sleepConsistency: 75, sustainedIntensity: 20,
        recoveryBehaviorQuality: d.physicalEnergy, exhaustionAccumulation: 10,
      },
      cognitiveStrain: {
        taskSwitchingRate: d.fragmentationLevel, ambiguityExposure: 22,
        interruptionDensity: d.distractionPatterns, activeCommitmentLoad: 28, deepWorkDegradation: 18,
      },
      executionStability: {
        meaningfulCompletionIntegrity: d.meaningfulAdvancementQuality, rhythmConsistency: 72,
        followThroughReliability: d.executionIntegrity, pacingStability: d.pacingQuality,
        volatilityResistance: 78,
      },
      emotionalFriction: {
        initiationResistance: d.avoidancePressure, avoidancePressure: d.avoidancePressure,
        perfectionismPressure: 22, overwhelmWeight: d.overwhelm, uncertaintyResistance: 28,
      },
    },
    recoveryDebt, cognitiveStrain, executionStability, emotionalFriction,
    momentumIntegrity:   62,
    resilienceCapacity:  computeResilienceCapacity(recoveryCapacity, emotionalFriction, cognitiveStrain),
    overwhelmLevel:      d.overwhelm,
    fragmentationLevel:  d.fragmentationLevel,
    recoveryCapacity,
    meaningfulEngagement: d.meaningfulAdvancementQuality,
    deepWorkContinuity:   d.deepWorkContinuity,
    behavioralVolatility: 5,
    adaptationReadiness:  Math.min(100, (recoveryCapacity / 100) * (1 - emotionalFriction / 100) * 100),
    expansionReadiness:   35,
    consistencyTrend: 'STABLE',
    recoveryTrend:    'STABLE',
    engagementTrend:  'STABLE',
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function computeDimensions(evidence: SessionEvidence[]): DimensionResult {
  if (evidence.length === 0) return buildDefaultDimensions()

  const sorted = [...evidence].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
  const raw    = extractRawSeries(sorted)
  const smooth = applySmoothing(raw)
  const recent = getRecentValues(smooth)

  const recoveryDebtModel     = buildRecoveryDebtModel(recent, raw, smooth)
  const cognitiveStrainModel  = buildCognitiveStrainModel(recent, smooth)
  const execStabilityModel    = buildExecutionStabilityModel(recent, raw, smooth)
  const emotionalFrictionModel = buildEmotionalFrictionModel(recent)

  const recoveryDebt      = collapseRecoveryDebt(recoveryDebtModel)
  const cognitiveStrain   = collapseCognitiveStrain(cognitiveStrainModel)
  const executionStability = collapseExecutionStability(execStabilityModel)
  const emotionalFriction  = collapseEmotionalFriction(emotionalFrictionModel)

  const recoveryCapacity = weightedAverage(
    [recent.sleepQuality, recent.physicalEnergy, recent.mentalClarity],
    [0.4, 0.3, 0.3],
  )
  const overwhelmLevel = weightedAverage(
    [recent.overwhelm, recent.stressPressure, recent.emotionalResistance],
    [0.55, 0.25, 0.20],
  )
  const fragmentationLevel = weightedAverage(
    [recent.fragmentationLevel, recent.distractionPatterns],
    [0.6, 0.4],
  )
  const behavioralVolatility = computeBehavioralVolatility(smooth)
  const momentumIntegrity    = computeMomentumIntegrity(smooth)
  const resilienceCapacity   = computeResilienceCapacity(recoveryCapacity, emotionalFriction, cognitiveStrain)
  const adaptationReadiness  = Math.min(100, (recoveryCapacity / 100) * (1 - emotionalFriction / 100) * 100)
  const expansionReadiness   = Math.min(
    100,
    ((100 - recoveryDebt) / 100) *
      (executionStability / 100) *
      (1 - emotionalFriction / 100) *
      (1 - cognitiveStrain / 100) *
      150,
  )

  return {
    core: {
      recoveryDebt:      recoveryDebtModel,
      cognitiveStrain:   cognitiveStrainModel,
      executionStability: execStabilityModel,
      emotionalFriction: emotionalFrictionModel,
    },
    recoveryDebt, cognitiveStrain, executionStability, emotionalFriction,
    momentumIntegrity, resilienceCapacity,
    overwhelmLevel, fragmentationLevel, recoveryCapacity,
    meaningfulEngagement: recent.meaningfulAdvancementQuality,
    deepWorkContinuity:   recent.deepWorkContinuity,
    behavioralVolatility,
    adaptationReadiness, expansionReadiness,
    consistencyTrend: calculateTrend(smooth.executionIntegrity),
    recoveryTrend:    calculateTrend(smooth.sleepQuality),
    engagementTrend:  calculateTrend(smooth.meaningfulAdvancementQuality),
  }
}
