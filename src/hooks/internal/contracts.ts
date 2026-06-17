/**
 * Presentation contracts for the Behavioral Pipeline Layer.
 *
 * These types are the ONLY behavioral types the UI is allowed to import.
 * They contain NO scalars, weights, coefficients, or raw engine fields.
 * Every field is a token, label, enum, or engine-authored string.
 *
 * Defined here (not in src/core/contracts) so the engine contracts stay
 * authoritative for engine-domain types while this layer owns presentation shape.
 */

import type { UserMode, UserTrajectory } from '@/core/contracts/state/modes'
import type { PacingRecommendation } from '@/core/contracts/adaptation/execution'
import type { ActiveInterventionType, InterventionLevel } from '@/core/contracts/interventions/types'
import type { AdaptationDirective } from '@/core/contracts/adaptation/directives'
import type { Task } from '@/lib/store'

// ---------------------------------------------------------------------------
// Shared presentation primitives
// ---------------------------------------------------------------------------

/** Replaces every raw Scalar — four coarse named bands. */
export type Band = 'low' | 'moderate' | 'elevated' | 'high'

/** Messaging tone for the guidance layer. */
export type Tone = 'calm' | 'steady' | 'focused' | 'challenging' | 'stabilizing' | 'observational'

/** Collapsed from ConfidenceBand — never a number. */
export type Confidence = 'low' | 'medium' | 'high'

/** Expansion/challenge readiness — three levels. */
export type Readiness = 'not-ready' | 'building' | 'ready'

// ---------------------------------------------------------------------------
// useBehavioralState
// ---------------------------------------------------------------------------

export type BehavioralStateView = {
  ready: boolean

  mode: UserMode
  trajectory: UserTrajectory
  /** true when a mode transition occurred this pipeline run. */
  transitioned: boolean

  interpretation: {
    headline: string
    supporting: string[]
    confidence: Confidence
  }

  environment: {
    density: Band
    /** Inverse of visualNoiseLevel — named for intent, not the formula. */
    visualCalm: Band
    motion: Band
    deepWorkProtection: boolean
    dashboardCompression: Band
  }

  execution: {
    pacing: PacingRecommendation
    challenge: Readiness
    recoveryEmphasis: Band
  }

  guidance: {
    tone: Tone
    interventionFrequency: Band
    reflectionDepth: Band
  }

  /** false while the Adaptation Engine (Phase 3) is not yet implemented. */
  adaptationAvailable: boolean
}

// ---------------------------------------------------------------------------
// useBehavioralTasks
// ---------------------------------------------------------------------------

/** Store Task fields only — no TaskScore or engine weight fields. */
export type ResolvedTask = Pick<Task, 'id' | 'label' | 'type' | 'estMin'>

export type BehavioralTasksView = {
  ready: boolean

  primaryTask: ResolvedTask | null
  secondaryTask: ResolvedTask | null

  sequencing: {
    rationale: string[]
    focusWindowMinutes: number | null
    confidence: Confidence
  }

  workload: {
    visibleTaskLimit: number
    guidance: 'reduce' | 'hold' | 'expand'
    overCapacity: boolean
  }

  visibility: {
    visibleTaskIds: string[]
    suppressedTaskIds: string[]
    compressedTaskIds: string[]
  }
}

// ---------------------------------------------------------------------------
// useBehavioralInterventions
// ---------------------------------------------------------------------------

export type ActiveInterventionView = {
  id: string
  type: ActiveInterventionType
  level: InterventionLevel
  /** Engine-authored user-facing message — required at render. */
  message: string
  /** Engine-authored emotional goal — surfaced as supporting line. */
  intent: string
  /** Declarative UI adaptation instructions — passed through verbatim. */
  directives: AdaptationDirective[]
}

export type BehavioralInterventionsView = {
  ready: boolean

  active: ActiveInterventionView[]
  highestLevel: 0 | 1 | 2 | 3
  restraintApplied: boolean

  ui: {
    requiresAcknowledgement: boolean
    surface: 'none' | 'inline' | 'banner' | 'modal'
  }

  cooldown: {
    anyOnCooldown: boolean
    nextEligibleHint: string | null
  }
}

// ---------------------------------------------------------------------------
// useBehavioralPipeline (public aggregation)
// ---------------------------------------------------------------------------

export type BehavioralView = {
  ready: boolean
  generatedAt: string | null

  state: BehavioralStateView
  tasks: BehavioralTasksView
  interventions: BehavioralInterventionsView

  /** true when deep work protection or pacing calls for continuity protection. */
  focusMode: boolean
  /** Single density verdict for layout shells. */
  surfaceLevel: 'full' | 'reduced' | 'minimal'
}
