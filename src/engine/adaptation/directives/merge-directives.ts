import type { AdaptationDirective } from "@/core/contracts/adaptation/directives";
import type { AdaptationDraft } from "../types/internal";
import type { TraceRecorder } from "../trace/trace-recorder";

/**
 * Maps dot-path directive fields (e.g. "execution.workloadCompressionRatio")
 * to AdaptationDraft keys. Unknown paths are silently skipped.
 */
const FIELD_MAP: Record<string, keyof AdaptationDraft> = {
  // Environmental
  "environmental.interfaceDensity": "interfaceDensity",
  "environmental.spacingIntensity": "spacingIntensity",
  "environmental.visualNoiseLevel": "visualNoiseLevel",
  "environmental.motionIntensity": "motionIntensity",
  "environmental.pacingFeel": "pacingFeel",
  "environmental.hierarchySharpness": "hierarchySharpness",
  "environmental.contrastStrength": "contrastStrength",
  "environmental.visibleComplexity": "visibleComplexity",
  "environmental.deepWorkProtectionEnabled": "deepWorkProtectionEnabled",
  "environmental.dashboardCompressionLevel": "dashboardCompressionLevel",
  // Execution
  "execution.visibleTaskLimit": "visibleTaskLimit",
  "execution.recommendedChallengeLevel": "recommendedChallengeLevel",
  "execution.workloadCompressionRatio": "workloadCompressionRatio",
  "execution.deepWorkExpectation": "deepWorkExpectation",
  "execution.recoveryWeighting": "recoveryWeighting",
  "execution.advancementWeighting": "advancementWeighting",
  "execution.focusProtectionStrength": "focusProtectionStrength",
  // Guidance
  "guidance.interventionFrequency": "interventionFrequency",
  "guidance.reflectionDepth": "reflectionDepth",
  "guidance.strategicGuidanceWeight": "strategicGuidanceWeight",
  "guidance.emotionalPressureLevel": "emotionalPressureLevel",
  "guidance.clarityOrientation": "clarityOrientation",
};

export function mergeDirectives(
  draft: AdaptationDraft,
  directives: AdaptationDirective[],
  recorder: TraceRecorder,
): void {
  if (directives.length === 0) return;

  let applied = 0;
  for (const directive of directives) {
    const draftKey = FIELD_MAP[directive.field];
    if (draftKey === undefined) continue;

    const prev = draft[draftKey] as number | boolean | string;
    const next = directive.suggestedValue;

    if (prev !== next) {
      (draft as Record<string, unknown>)[draftKey as string] = next;
      recorder.record(directive.field, prev, next, "directive", directive.reason);
      applied++;
    }
  }

  if (applied > 0) {
    draft.reasoning.push(`Intervention directives applied: ${applied} override(s)`);
  }
}
