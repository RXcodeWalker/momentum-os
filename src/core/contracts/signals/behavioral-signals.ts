// Fix-1: BehavioralSignal moved here from interventions/types.ts.
// BehavioralSignal is evidence — detected behavioral patterns upstream of intervention evaluation.
// interventions/ imports this from signals/; not the reverse.

export type BehavioralSignal =
  | 'RISING_FRAGMENTATION'
  | 'DECLINING_EXECUTION_QUALITY'
  | 'RECOVERY_COLLAPSE'
  | 'AVOIDANCE_CLUSTERING'
  | 'MEANINGFULNESS_DEFERRAL'
  | 'OVERCOMMITMENT_EXPANSION'
  | 'DEEP_WORK_DEGRADATION'
  | 'VOLATILITY_ACCELERATION'
  | 'PLANNING_ESCAPE'
  | 'PACING_INSTABILITY'

