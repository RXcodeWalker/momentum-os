import type { GuidanceContext, GuidanceMessage, GuidanceProvenance } from '@/core/contracts/guidance/messages'
import type { ToneVocabulary } from '../tone-system/vocabulary'

function buildProvenance(ctx: GuidanceContext): GuidanceProvenance {
  return {
    mode: ctx.mode,
    trajectory: ctx.trajectory,
    tone: ctx.tone,
    primaryDriver: 'intervention',
  }
}

const INTERVENTION_BASE_COPY: Record<string, string> = {
  BURNOUT_PREVENTION: 'Your load pattern suggests recovery time is needed before output drops further.',
  RECOVERY_ENFORCEMENT: 'Staying in recovery mode is the fastest path back to baseline.',
  OVERLOAD: 'Task volume is above your recent capacity. Consider deferring lower-priority items.',
  AVOIDANCE_INTERRUPTION: 'A task has been pending for multiple sessions. A small start breaks the pattern.',
  FRAGMENTATION_REDUCTION: 'Frequent context-switching is reducing effective output. Consolidate your focus window.',
  DEEP_WORK_PROTECTION: 'Your deep work block is at risk. Protect the next 90 minutes.',
  RESTART_ASSISTANCE: 'Returning after a gap — the most effective re-entry is a single small win today.',
}

export function generateInterventionCopy(
  ctx: GuidanceContext,
  vocab: ToneVocabulary,
  reasoning: string[],
): GuidanceMessage | null {
  if (!ctx.interventionType) return null

  const baseCopy = INTERVENTION_BASE_COPY[ctx.interventionType]
  if (!baseCopy) return null

  const text = `${vocab.interventionPhrasePrefix}${baseCopy}`
  reasoning.push(
    `Intervention copy generated for type=${ctx.interventionType} with tone prefix "${vocab.interventionPhrasePrefix}".`,
  )

  return {
    surface: 'intervention-override',
    text,
    tone: ctx.tone,
    suppressible: false,
    provenance: buildProvenance(ctx),
  }
}
