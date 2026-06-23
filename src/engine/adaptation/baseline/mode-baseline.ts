import type { UserMode } from "@/core/contracts/state/modes";
import type { AdaptationDraft } from "../types/internal";
import type { TraceRecorder } from "../trace/trace-recorder";
import { MODE_ENV_BASELINES, MODE_EXEC_BASELINES, MODE_GUIDANCE_BASELINES } from "../config";

export function applyModeBaseline(mode: UserMode, recorder: TraceRecorder): AdaptationDraft {
  const env = MODE_ENV_BASELINES[mode];
  const exec = MODE_EXEC_BASELINES[mode];
  const guidance = MODE_GUIDANCE_BASELINES[mode];

  const draft: AdaptationDraft = {
    // Environmental
    interfaceDensity: env.interfaceDensity,
    spacingIntensity: env.spacingIntensity,
    visualNoiseLevel: env.visualNoiseLevel,
    motionIntensity: env.motionIntensity,
    pacingFeel: env.pacingFeel,
    hierarchySharpness: env.hierarchySharpness,
    contrastStrength: env.contrastStrength,
    visibleComplexity: env.visibleComplexity,
    deepWorkProtectionEnabled: env.deepWorkProtectionEnabled,
    dashboardCompressionLevel: env.dashboardCompressionLevel,
    // Execution
    visibleTaskLimit: exec.visibleTaskLimit,
    recommendedChallengeLevel: exec.recommendedChallengeLevel,
    workloadCompressionRatio: exec.workloadCompressionRatio,
    pacingRecommendation: "MAINTAIN_RHYTHM",
    deepWorkExpectation: exec.deepWorkExpectation,
    recoveryWeighting: exec.recoveryWeighting,
    advancementWeighting: exec.advancementWeighting,
    focusProtectionStrength: exec.focusProtectionStrength,
    // Guidance
    messagingTone: "STEADY",
    interventionFrequency: guidance.interventionFrequency,
    reflectionDepth: guidance.reflectionDepth,
    strategicGuidanceWeight: guidance.strategicGuidanceWeight,
    emotionalPressureLevel: guidance.emotionalPressureLevel,
    clarityOrientation: guidance.clarityOrientation,
    // Audit
    reasoning: [`Mode baseline applied: ${mode}`],
  };

  // Record all baseline fields
  const envFields = Object.keys(env) as (keyof typeof env)[];
  for (const f of envFields) {
    recorder.record(
      `environmental.${f}`,
      0,
      draft[f as keyof AdaptationDraft] as number | boolean,
      "baseline",
    );
  }
  const execFields = Object.keys(exec) as (keyof typeof exec)[];
  for (const f of execFields) {
    recorder.record(`execution.${f}`, 0, draft[f as keyof AdaptationDraft] as number, "baseline");
  }
  const guidanceFields = Object.keys(guidance) as (keyof typeof guidance)[];
  for (const f of guidanceFields) {
    recorder.record(`guidance.${f}`, 0, draft[f as keyof AdaptationDraft] as number, "baseline");
  }

  return draft;
}
