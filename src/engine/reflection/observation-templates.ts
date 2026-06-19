import type { ConfidenceBand } from '@/core/contracts/primitives'
import type { EveningObservationCode, SurfaceableObservation } from '@/core/contracts/flow/reflection'

const TRUST_VIOLATIONS = [
  /\b(score|weight|coefficient|\d+%|you are|you tend|you procrastinated|burnout|diagnosis)\b/i,
  /\byou (are|were|have|lack|failed|succeeded)\b/i,
  /\b(always|never|consistently|typically)\b/i,
]

export function observationViolatesTrust(text: string): boolean {
  return TRUST_VIOLATIONS.some((p) => p.test(text))
}

export function obs(
  code: EveningObservationCode,
  text: string,
  confidence: ConfidenceBand,
  evidence: string[] = [],
): SurfaceableObservation {
  if (process.env.NODE_ENV === 'development' && observationViolatesTrust(text)) {
    console.error(`[reflection] trust violation in observation '${code}':`, text)
  }
  return { code, text, confidence, evidence }
}

export const OBSERVATION_TEXTS: Record<EveningObservationCode, string> = {
  FRAGMENTATION_CONTINUITY_IMPROVEMENT:
    'Lower fragmentation appeared today compared to recent patterns. Fewer interruptions may have supported execution continuity.',
  HIGH_RESISTANCE_COMPLETION:
    'Higher-resistance work appeared to be completed today. This tends to correlate with stronger pacing signals when resistance is present.',
  MEANINGFUL_PROGRESS_ACHIEVED:
    'Progress on a meaningful priority was reported today. This appeared alongside above-baseline execution continuity.',
  RECOVERY_STABILITY_MAINTAINED:
    'Recovery inputs appear stable relative to the recent period. This may support sustained output over the coming days.',
  PACING_PROTECTION_OBSERVED:
    'Pacing appeared steadier today than recent patterns. Consistent rhythm across the day tends to support focus continuity.',
  EXECUTION_CONTINUITY_HELD:
    'Execution continuity appeared to hold through the day. Task completion and focus patterns were aligned above recent baseline.',
  EMOTIONAL_FRICTION_REDUCED:
    'Emotional friction appeared lower than recent patterns. This may have supported initiation and follow-through today.',
}
