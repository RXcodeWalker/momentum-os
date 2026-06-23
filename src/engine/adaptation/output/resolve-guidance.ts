import type { MessagingTone } from "@/core/contracts/adaptation/guidance";
import type { AdaptationContext, AdaptationDraft } from "../types/internal";

export function resolveMessagingTone(draft: AdaptationDraft, ctx: AdaptationContext): void {
  let tone: MessagingTone;

  if (ctx.mode === "RECOVERY" && ctx.collapseRisk === "CRITICAL") {
    tone = "CALM";
  } else if (ctx.mode === "RECOVERY") {
    tone = "STABILIZING";
  } else if (draft.emotionalPressureLevel < 20 && draft.clarityOrientation > 70) {
    tone = "CALM";
  } else if (ctx.mode === "STABILIZING" || ctx.trajectory === "FRAGILE") {
    tone = "STEADY";
  } else if (ctx.mode === "FOCUSED") {
    tone = "FOCUSED";
  } else if (ctx.mode === "EXPANDING" && draft.recommendedChallengeLevel > 70) {
    tone = "CHALLENGING";
  } else if (ctx.trajectory === "CONTRACTING") {
    tone = "OBSERVATIONAL";
  } else {
    tone = "STEADY";
  }

  draft.messagingTone = tone;
}
