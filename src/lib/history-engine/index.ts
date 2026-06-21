export { buildEvidence, buildEvidenceForPipeline } from './evidence-builder'
export {
  emitCheckInCompleted,
  emitBlockerCaptured,
  emitDistractionLogged,
  emitInsightCommitted,
  emitTaskRescheduled,
  emitRecoveryTriggered,
  emitRecoveryExited,
  emitReflectionGenerated,
  emitScoreThresholdCrossed,
  pruneEvents,
  computeThresholdCrossings,
} from './event-emitter'
export { isSnapshotStale, isSnapshotMissing, stalestWindowKey } from './staleness'
export { computeAllSnapshots } from './snapshot-engine'
export { detectTrends, pruneTrends } from './trend-detector'
export { backfillEventsFromHistory, backfillPeriodsFromHistory } from './backfill'
