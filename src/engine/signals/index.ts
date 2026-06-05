export { SIGNAL_ENGINE_VERSION, DEFAULT_SMOOTHING_WINDOW } from './config'
export { normalize } from './normalize'
export { movingAverage, weightedAverage, calculateTrend, type TrendOptions } from '@/engine/shared'
export {
  buildMetricTimeline,
  seriesFromTimeline,
  averageCompleteness,
  type DailyMetricPoint,
  type MetricTimeline,
} from './evidence'
export {
  detectBehavioralSignals,
  detectBehavioralSignalsDetailed,
  resolveConfidenceBand,
  type DetectedSignal,
  type SignalDetectionOptions,
} from './detection'
export { generateSignalSnapshot, type GenerateSignalSnapshotOptions } from './snapshot'
