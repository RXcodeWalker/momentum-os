import type { GuidanceContext, GuidanceMessage, GuidanceProvenance } from '@/core/contracts/guidance/messages'
import type { ToneVocabulary } from '../tone-system/vocabulary'

function pickIndex(arr: string[], seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return Math.abs(h) % arr.length
}

function buildProvenance(ctx: GuidanceContext): GuidanceProvenance {
  return {
    mode: ctx.mode,
    trajectory: ctx.trajectory,
    tone: ctx.tone,
    primaryDriver: ctx.interventionType
      ? 'intervention'
      : ctx.collapseRisk === 'HIGH' || ctx.collapseRisk === 'CRITICAL'
        ? 'risk'
        : 'mode',
  }
}

export function generateHeroCard(
  ctx: GuidanceContext,
  vocab: ToneVocabulary,
  dateSeed: string,
  reasoning: string[],
): { headline: GuidanceMessage; subtitle: GuidanceMessage } {
  const headlineIdx = pickIndex(vocab.heroHeadlines, dateSeed + 'headline')
  const subtitleIdx = pickIndex(vocab.heroSubtitles, dateSeed + 'subtitle')

  reasoning.push(
    `Hero headline index=${headlineIdx} selected via hash(date+userId).`,
  )

  const provenance = buildProvenance(ctx)

  return {
    headline: {
      surface: 'hero-headline',
      text: vocab.heroHeadlines[headlineIdx],
      tone: ctx.tone,
      suppressible: false,
      provenance,
    },
    subtitle: {
      surface: 'hero-subtitle',
      text: vocab.heroSubtitles[subtitleIdx],
      tone: ctx.tone,
      suppressible: true,
      provenance,
    },
  }
}
