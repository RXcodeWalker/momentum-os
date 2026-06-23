import type { GuidanceContext } from "@/core/contracts/guidance/messages";
import type { GuidanceGenerationOutput } from "@/core/contracts/guidance/output";
import { TONE_VOCABULARY } from "./config";
import { resolveDepth } from "./depth-resolver";
import { resolvePromptVisibility, resolveInterventionVisibility } from "./visibility-resolver";
import { generateHeroCard } from "./surfaces/hero-card";
import { generateMorningBriefing } from "./surfaces/morning-briefing";
import { generateCheckInPrompts } from "./surfaces/check-in-prompts";
import { generateInterventionCopy } from "./surfaces/intervention-copy";
import { enforce } from "./trust-boundaries";

function buildDateSeed(ctx: GuidanceContext): string {
  // Stable per-day seed using current date — no userId available at engine layer
  return new Date().toISOString().slice(0, 10) + ctx.tone + ctx.mode;
}

export function generate(ctx: GuidanceContext): GuidanceGenerationOutput {
  const reasoning: string[] = [];
  const vocab = TONE_VOCABULARY[ctx.tone];

  reasoning.push(
    `${ctx.tone} tone selected — mode=${ctx.mode}, trajectory=${ctx.trajectory}, collapseRisk=${ctx.collapseRisk}.`,
  );

  // Resolve depth directive
  const checkInDirective = resolveDepth(ctx.guidance.reflectionDepth, reasoning);

  // Resolve visibility directives
  const promptVisibility = resolvePromptVisibility(ctx.guidance.interventionFrequency, reasoning);
  const interventionVisibility = resolveInterventionVisibility(ctx.mode, reasoning);

  // Generate surface messages
  const dateSeed = buildDateSeed(ctx);
  const { headline, subtitle } = generateHeroCard(ctx, vocab, dateSeed, reasoning);
  const { insight, encouragement } = generateMorningBriefing(
    ctx,
    vocab,
    checkInDirective,
    dateSeed,
    reasoning,
  );
  const checkInMessages = generateCheckInPrompts(ctx, vocab, checkInDirective, dateSeed, reasoning);
  const interventionMsg = generateInterventionCopy(ctx, vocab, reasoning);

  const draft: GuidanceGenerationOutput = {
    surfaceMessages: {
      "hero-headline": headline,
      "hero-subtitle": subtitle,
      "morning-insight": insight,
      "morning-encouragement": encouragement,
      ...checkInMessages,
      ...(interventionMsg ? { "intervention-override": interventionMsg } : {}),
    },
    checkInDirective,
    promptVisibility,
    interventionVisibility,
    trustViolations: [],
    generationReasoning: reasoning,
    generatedAt: new Date().toISOString(),
  };

  // Apply trust boundary enforcement (mutates draft in-place)
  enforce(draft, ctx);

  return draft;
}
