import type { AvoidancePatternId } from '@/core/contracts/avoidance'

export type SignalConfig = {
  id: string
  weight: number
  threshold: number
  descriptionTemplate: string
}

export type PatternConfig = {
  id: AvoidancePatternId
  signals: SignalConfig[]
  detectionThreshold: number
}

export const AVOIDANCE_DETECTION_THRESHOLD = 0.55

export const SEVERITY_THRESHOLDS = {
  LOW: 0.55,
  MODERATE: 0.65,
  HIGH: 0.80,
  CRITICAL: 0.90,
} as const

export const PATTERN_CONFIGS: Record<AvoidancePatternId, PatternConfig> = {
  MAINTENANCE_LOOP: {
    id: 'MAINTENANCE_LOOP',
    detectionThreshold: AVOIDANCE_DETECTION_THRESHOLD,
    signals: [
      {
        id: 'deep_completion_deficit',
        weight: 0.35,
        threshold: 0.4,
        descriptionTemplate: 'Deep task completion rate below expected level relative to planning',
      },
      {
        id: 'meaningful_progress_negative_rate',
        weight: 0.30,
        threshold: 0.4,
        descriptionTemplate: 'Meaningful progress noted as partial or absent on multiple recent check-ins',
      },
      {
        id: 'deep_rescheduled_count',
        weight: 0.20,
        threshold: 1,
        descriptionTemplate: 'Deep work tasks have been rescheduled multiple times without completion',
      },
      {
        id: 'admin_heavy_completion_ratio',
        weight: 0.15,
        threshold: 0.6,
        descriptionTemplate: 'Completion activity concentrated in admin and shallow task categories',
      },
    ],
  },

  PREPARATION_ESCAPE: {
    id: 'PREPARATION_ESCAPE',
    detectionThreshold: AVOIDANCE_DETECTION_THRESHOLD,
    signals: [
      {
        id: 'prep_task_dominance_ratio',
        weight: 0.30,
        threshold: 0.5,
        descriptionTemplate: 'Completed task set is dominated by preparation-oriented items',
      },
      {
        id: 'meaningful_progress_negative_concurrent',
        weight: 0.25,
        threshold: 0.4,
        descriptionTemplate: 'Meaningful progress absent despite completion activity being logged',
      },
      {
        id: 'no_advancement_follow_through',
        weight: 0.25,
        threshold: 0.5,
        descriptionTemplate: 'Advancement tasks not initiated in follow-through window after preparation days',
      },
      {
        id: 'deep_task_blocker_rate',
        weight: 0.20,
        threshold: 0.3,
        descriptionTemplate: 'Deep and advancement tasks have accumulated blocker records',
      },
    ],
  },

  FRAGMENTATION_ESCAPE: {
    id: 'FRAGMENTATION_ESCAPE',
    detectionThreshold: AVOIDANCE_DETECTION_THRESHOLD,
    signals: [
      {
        id: 'avg_task_size_below_threshold',
        weight: 0.30,
        threshold: 20,
        descriptionTemplate: 'Average estimated task duration is below 20 minutes with high task volume',
      },
      {
        id: 'low_focus_on_high_completion_days',
        weight: 0.25,
        threshold: 5,
        descriptionTemplate: 'Focus rating low on days with high task completion ratios',
      },
      {
        id: 'distraction_type_density',
        weight: 0.25,
        threshold: 3,
        descriptionTemplate: 'Multiple distraction categories active across recent check-ins',
      },
      {
        id: 'task_type_switch_rate',
        weight: 0.20,
        threshold: 3,
        descriptionTemplate: 'High variety of task types observed within single-day completion sets',
      },
    ],
  },

  ADVANCEMENT_DEFERRAL: {
    id: 'ADVANCEMENT_DEFERRAL',
    detectionThreshold: AVOIDANCE_DETECTION_THRESHOLD,
    signals: [
      {
        id: 'meaningful_progress_sustained_negative',
        weight: 0.35,
        threshold: 0.6,
        descriptionTemplate: 'Meaningful progress rated absent across the majority of recent check-ins',
      },
      {
        id: 'deep_tasks_persistently_rescheduled',
        weight: 0.30,
        threshold: 1,
        descriptionTemplate: 'Deep tasks present on the active list with repeated rescheduling',
      },
      {
        id: 'completion_ratio_acceptable',
        weight: 0.20,
        threshold: 0.5,
        descriptionTemplate: 'Completion ratio at acceptable level, suggesting capacity is not the constraint',
      },
      {
        id: 'energy_not_depleted_on_low_progress_days',
        weight: 0.15,
        threshold: 5,
        descriptionTemplate: 'Energy self-report above depletion threshold on low-progress days',
      },
    ],
  },
}

export const PREP_TASK_KEYWORDS = [
  'plan', 'research', 'prep', 'review', 'outline', 'draft', 'notes', 'gather', 'brainstorm',
]

export const CONFIDENCE_BAND_THRESHOLDS = {
  HIGH: 6,
  MEDIUM_UPPER: 6,
  MEDIUM_LOWER: 4,
  LOW: 2,
} as const
