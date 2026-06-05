export { SIGNAL_ENGINE_VERSION, DEFAULT_SMOOTHING_WINDOW } from './config'
export { normalize } from './normalize'
export { movingAverage, weightedAverage } from './averages'
export { calculateTrend, type TrendOptions } from './trend'
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
