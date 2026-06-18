/**
 * Behavioral Pipeline Layer — public barrel.
 *
 * Exports ONLY useBehavioralPipeline and the presentation contract types.
 * The three sub-hooks (useBehavioralState, useBehavioralTasks,
 * useBehavioralInterventions) are internal to hooks/internal/ and must
 * not be imported directly by routes or components.
 */

export { useBehavioralPipeline } from './useBehavioralPipeline'
export { useMorningCalibration } from './useMorningCalibration'
export type { MorningCalibrationHook } from './useMorningCalibration'
export { useEveningReflection } from './internal/useEveningReflection'
export type { EveningReflectionView } from './internal/useEveningReflection'

export type {
  BehavioralView,
  BehavioralStateView,
  BehavioralTasksView,
  BehavioralInterventionsView,
  ActiveInterventionView,
  ResolvedTask,
  Band,
  Tone,
  Confidence,
  Readiness,
} from './internal/contracts'
