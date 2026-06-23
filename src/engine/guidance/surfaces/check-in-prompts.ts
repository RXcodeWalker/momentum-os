import type {
  GuidanceContext,
  GuidanceMessage,
  GuidanceProvenance,
} from "@/core/contracts/guidance/messages";
import type { ToneVocabulary } from "../tone-system/vocabulary";
import type { ReflectionDepthDirective } from "@/core/contracts/guidance/depth";

function pickIndex(arr: string[], seed: string): number {
  if (arr.length === 0) return 0;
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
    primaryDriver: "guidance-scalar",
  };
}

export function generateCheckInPrompts(
  ctx: GuidanceContext,
  vocab: ToneVocabulary,
  directive: ReflectionDepthDirective,
  dateSeed: string,
  reasoning: string[],
): Partial<
  Record<
    "checkin-open-question" | "checkin-pattern-question" | "checkin-forward-question",
    GuidanceMessage
  >
> {
  const provenance = buildProvenance(ctx);
  const result: Partial<
    Record<
      "checkin-open-question" | "checkin-pattern-question" | "checkin-forward-question",
      GuidanceMessage
    >
  > = {};

  if (directive.requireOpenEnded || directive.level === "minimal") {
    const idx = pickIndex(vocab.checkInOpenQuestions, dateSeed + "open");
    result["checkin-open-question"] = {
      surface: "checkin-open-question",
      text: vocab.checkInOpenQuestions[idx] ?? "",
      tone: ctx.tone,
      suppressible: false,
      provenance,
    };
    reasoning.push(`Check-in open question index=${idx}.`);
  }

  if (directive.includePatternQuestion && vocab.checkInPatternQuestions.length > 0) {
    const idx = pickIndex(vocab.checkInPatternQuestions, dateSeed + "pattern");
    result["checkin-pattern-question"] = {
      surface: "checkin-pattern-question",
      text: vocab.checkInPatternQuestions[idx],
      tone: ctx.tone,
      suppressible: true,
      provenance,
    };
  }

  if (directive.includeForwardQuestion && vocab.checkInForwardQuestions.length > 0) {
    const idx = pickIndex(vocab.checkInForwardQuestions, dateSeed + "forward");
    result["checkin-forward-question"] = {
      surface: "checkin-forward-question",
      text: vocab.checkInForwardQuestions[idx],
      tone: ctx.tone,
      suppressible: true,
      provenance,
    };
  }

  return result;
}
