import type { AdaptationContext, AdaptationDraft } from "../types/internal";
import type { TraceRecorder } from "../trace/trace-recorder";
import { SIGNAL_TUNING_RULES } from "../config";

export function applySignalTuning(
  draft: AdaptationDraft,
  ctx: AdaptationContext,
  recorder: TraceRecorder,
): void {
  const fired: string[] = [];

  for (const rule of SIGNAL_TUNING_RULES) {
    const strength = ctx.activeSignalStrengths[rule.signal];
    if (strength === undefined) continue;
    if (strength <= rule.strengthThreshold) continue;

    // Snapshot relevant fields before mutation
    const snap = snapshot(draft);
    rule.apply(draft, strength);
    recordChanges(snap, draft, rule.signal, recorder);
    fired.push(rule.signal);
  }

  if (fired.length > 0) {
    draft.reasoning.push(`Signal tuning applied: ${[...new Set(fired)].join(", ")}`);
  }
}

function snapshot(draft: AdaptationDraft): Record<string, number | boolean> {
  return {
    interfaceDensity: draft.interfaceDensity,
    spacingIntensity: draft.spacingIntensity,
    visualNoiseLevel: draft.visualNoiseLevel,
    motionIntensity: draft.motionIntensity,
    deepWorkProtectionEnabled: draft.deepWorkProtectionEnabled,
    visibleTaskLimit: draft.visibleTaskLimit,
    workloadCompressionRatio: draft.workloadCompressionRatio,
    advancementWeighting: draft.advancementWeighting,
    strategicGuidanceWeight: draft.strategicGuidanceWeight,
    emotionalPressureLevel: draft.emotionalPressureLevel,
    reflectionDepth: draft.reflectionDepth,
  };
}

function recordChanges(
  before: Record<string, number | boolean>,
  draft: AdaptationDraft,
  signal: string,
  recorder: TraceRecorder,
): void {
  for (const [key, prev] of Object.entries(before)) {
    const curr = draft[key as keyof AdaptationDraft] as number | boolean;
    if (prev !== curr) {
      recorder.record(`${domainFor(key)}.${key}`, prev, curr, "signal", signal);
    }
  }
}

function domainFor(field: string): string {
  const exec = ["visibleTaskLimit", "workloadCompressionRatio", "advancementWeighting"];
  const guidance = ["strategicGuidanceWeight", "emotionalPressureLevel", "reflectionDepth"];
  if (exec.includes(field)) return "execution";
  if (guidance.includes(field)) return "guidance";
  return "environmental";
}
