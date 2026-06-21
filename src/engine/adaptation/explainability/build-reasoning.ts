import type { AdaptationContext, AdaptationDraft } from '../types/internal'

export function buildAdaptationReasoning(
  draft: AdaptationDraft,
  ctx: AdaptationContext,
): string[] {
  const lines: string[] = [...draft.reasoning]

  lines.push(
    `Pacing: ${draft.pacingRecommendation} | Tone: ${draft.messagingTone} | TaskLimit: ${draft.visibleTaskLimit}`,
  )

  if (ctx.resolvedDirectives.length > 0) {
    lines.push(
      `Directive overrides from intervention: ${ctx.resolvedDirectives.map((d) => d.field).join(', ')}`,
    )
  }

  return lines
}
