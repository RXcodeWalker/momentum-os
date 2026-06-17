/**
 * Pure mapping functions — the ONLY place scalar→Band, enum→Tone,
 * and level→surface conversions live. No behavioral logic here;
 * these are mechanical translations between engine-domain and
 * presentation-domain types.
 */

import type { Scalar, ConfidenceBand } from '@/core/contracts/primitives'
import type { UserMode } from '@/core/contracts/state/modes'
import type { PacingRecommendation } from '@/core/contracts/adaptation/execution'
import type { MessagingTone } from '@/core/contracts/adaptation/guidance'
import type { InterventionLevel } from '@/core/contracts/interventions/types'
import type { Band, Tone, Confidence, Readiness } from './contracts'

// ---------------------------------------------------------------------------
// Scalar → Band
// ---------------------------------------------------------------------------

export function scalarToBand(n: Scalar): Band {
  if (n <= 25) return 'low'
  if (n <= 50) return 'moderate'
  if (n <= 75) return 'elevated'
  return 'high'
}

/** Inverts a band — used for fields whose intent is the opposite of the raw value
 *  (e.g. visualCalm is the inverse of visualNoiseLevel). */
export function invertBand(b: Band): Band {
  switch (b) {
    case 'low':      return 'high'
    case 'moderate': return 'moderate'
    case 'elevated': return 'low'
    case 'high':     return 'low'
  }
}

// ---------------------------------------------------------------------------
// ConfidenceBand → Confidence
// ---------------------------------------------------------------------------

export function confidenceBandToPresentation(b: ConfidenceBand): Confidence {
  switch (b) {
    case 'LOW':    return 'low'
    case 'MEDIUM': return 'medium'
    case 'HIGH':   return 'high'
  }
}

/** Collapses a 0–100 sequencingConfidence scalar to a named band. */
export function scalarToConfidence(n: Scalar): Confidence {
  if (n < 35) return 'low'
  if (n < 70) return 'medium'
  return 'high'
}

// ---------------------------------------------------------------------------
// MessagingTone → Tone
// ---------------------------------------------------------------------------

export function messagingToneToTone(t: MessagingTone): Tone {
  switch (t) {
    case 'CALM':          return 'calm'
    case 'STEADY':        return 'steady'
    case 'FOCUSED':       return 'focused'
    case 'CHALLENGING':   return 'challenging'
    case 'STABILIZING':   return 'stabilizing'
    case 'OBSERVATIONAL': return 'observational'
  }
}

/** Deterministic tone for when the Adaptation Engine is not yet available. */
export function modeToneDefault(mode: UserMode): Tone {
  switch (mode) {
    case 'RECOVERY':    return 'stabilizing'
    case 'STABILIZING': return 'steady'
    case 'FOCUSED':     return 'focused'
    case 'EXPANDING':   return 'challenging'
  }
}

// ---------------------------------------------------------------------------
// Scalar → Readiness
// ---------------------------------------------------------------------------

export function scalarToReadiness(n: Scalar): Readiness {
  if (n < 40) return 'not-ready'
  if (n < 66) return 'building'
  return 'ready'
}

// ---------------------------------------------------------------------------
// PacingRecommendation → workload guidance
// ---------------------------------------------------------------------------

export function pacingToGuidance(p: PacingRecommendation): 'reduce' | 'hold' | 'expand' {
  switch (p) {
    case 'REDUCE_LOAD':        return 'reduce'
    case 'COMPRESS_SCOPE':     return 'reduce'
    case 'MAINTAIN_RHYTHM':    return 'hold'
    case 'PROTECT_CONTINUITY': return 'hold'
    case 'INCREASE_CHALLENGE': return 'expand'
  }
}

// ---------------------------------------------------------------------------
// InterventionLevel → UI surface
// ---------------------------------------------------------------------------

export function interventionLevelToSurface(
  level: 0 | 1 | 2 | 3,
): 'none' | 'inline' | 'banner' | 'modal' {
  switch (level) {
    case 0: return 'none'
    case 1: return 'inline'
    case 2: return 'banner'
    case 3: return 'modal'
  }
}

// ---------------------------------------------------------------------------
// density Band → layout surfaceLevel
// ---------------------------------------------------------------------------

export function densityBandToSurfaceLevel(density: Band): 'full' | 'reduced' | 'minimal' {
  switch (density) {
    case 'low':      return 'minimal'
    case 'moderate': return 'reduced'
    case 'elevated': return 'reduced'
    case 'high':     return 'full'
  }
}

// ---------------------------------------------------------------------------
// Tone → hero gradient class
// ---------------------------------------------------------------------------

const TONE_HERO_GRADIENTS: Record<Tone, string> = {
  calm:          'from-orange-950/30 via-stone-900',
  steady:        'from-stone-800/50 via-stone-900',
  focused:       'from-indigo-950/30 via-stone-900',
  challenging:   'from-emerald-950/30 via-stone-900',
  stabilizing:   'from-amber-950/30 via-stone-900',
  observational: 'from-stone-950/40 via-stone-900',
}

export function toneToHeroTheme(tone: Tone): string {
  return TONE_HERO_GRADIENTS[tone]
}

// ---------------------------------------------------------------------------
// Clamped max helper
// ---------------------------------------------------------------------------

export function clampLevel(levels: InterventionLevel[]): 0 | 1 | 2 | 3 {
  if (levels.length === 0) return 0
  return Math.min(3, Math.max(...levels)) as 0 | 1 | 2 | 3
}
