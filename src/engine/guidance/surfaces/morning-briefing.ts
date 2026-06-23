import type {
  GuidanceContext,
  GuidanceMessage,
  GuidanceProvenance,
} from "@/core/contracts/guidance/messages";
import type { ToneVocabulary } from "../tone-system/vocabulary";
import type { ReflectionDepthDirective } from "@/core/contracts/guidance/depth";

function pickIndex(arr: string[], seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % arr.length;
}

function buildProvenance(ctx: GuidanceContext): GuidanceProvenance {
  return {
    mode: ctx.mode,
    trajectory: ctx.trajectory,
    tone: ctx.tone,
    primaryDriver:
      ctx.collapseRisk === "HIGH" || ctx.collapseRisk === "CRITICAL"
        ? "risk"
        : ctx.trajectory === "FRAGILE" || ctx.trajectory === "CONTRACTING"
          ? "trajectory"
          : "mode",
  };
}

export function generateMorningBriefing(
  ctx: GuidanceContext,
  vocab: ToneVocabulary,
  _directive: ReflectionDepthDirective,
  dateSeed: string,
  reasoning: string[],
): { insight: GuidanceMessage; encouragement: GuidanceMessage } {
  const insightIdx = pickIndex(vocab.morningInsights, dateSeed + "insight");
  const encourageIdx = pickIndex(vocab.morningEncouragements, dateSeed + "encourage");

  reasoning.push(`Morning briefing index=${insightIdx} selected via hash(date+userId).`);

  const provenance = buildProvenance(ctx);

  return {
    insight: {
      surface: "morning-insight",
      text: vocab.morningInsights[insightIdx],
      tone: ctx.tone,
      suppressible: true,
      provenance,
    },
    encouragement: {
      surface: "morning-encouragement",
      text: vocab.morningEncouragements[encourageIdx],
      tone: ctx.tone,
      suppressible: true,
      provenance,
    },
  };
}
