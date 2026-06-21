import type { PacingRecommendation } from '@/core/contracts/adaptation/execution'
import type { AdaptationContext, AdaptationDraft } from '../types/internal'

export function resolvePacingRecommendation(
  draft: AdaptationDraft,
  ctx: AdaptationContext,
): void {
  let pacing: PacingRecommendation

  if (ctx.mode === 'RECOVERY') {
    pacing = 'REDUCE_LOAD'
  } else if (ctx.burnoutRisk === 'CRITICAL' || ctx.collapseRisk === 'CRITICAL') {
    pacing = 'COMPRESS_SCOPE'
  } else if (draft.workloadCompressionRatio < 0.55) {
    pacing = 'REDUCE_LOAD'
  } else if (
    ctx.activeSignalStrengths['DEEP_WORK_DEGRADATION'] !== undefined &&
    draft.deepWorkExpectation > 50
  ) {
    pacing = 'PROTECT_CONTINUITY'
  } else if (ctx.activeSignalStrengths['RISING_FRAGMENTATION'] !== undefined) {
    pacing = 'MAINTAIN_RHYTHM'
  } else if (ctx.mode === 'EXPANDING' && draft.recommendedChallengeLevel > 65) {
    pacing = 'INCREASE_CHALLENGE'
  } else {
    pacing = 'MAINTAIN_RHYTHM'
  }

  draft.pacingRecommendation = pacing

  // Re-normalize weighting pair so sum stays at 1.0
  const sum = draft.recoveryWeighting + draft.advancementWeighting
  if (sum > 0 && Math.abs(sum - 1.0) > 0.001) {
    draft.recoveryWeighting = draft.recoveryWeighting / sum
    draft.advancementWeighting = draft.advancementWeighting / sum
  }
}
