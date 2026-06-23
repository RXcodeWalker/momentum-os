import type { AdaptationContext, AdaptationDraft } from "../types/internal";
import type { TraceRecorder } from "../trace/trace-recorder";
import {
  TRAJECTORY_ENV_DELTAS,
  TRAJECTORY_EXEC_DELTAS,
  TRAJECTORY_GUIDANCE_DELTAS,
} from "../config";

export function applyTrajectoryDelta(
  draft: AdaptationDraft,
  ctx: AdaptationContext,
  recorder: TraceRecorder,
): void {
  const envDelta = TRAJECTORY_ENV_DELTAS[ctx.trajectory];
  const execDelta = TRAJECTORY_EXEC_DELTAS[ctx.trajectory];
  const guidanceDelta = TRAJECTORY_GUIDANCE_DELTAS[ctx.trajectory];

  function applyField<K extends keyof AdaptationDraft>(field: K, delta: number, domain: string) {
    const prev = draft[field] as number;
    const next = prev + delta;
    if (prev !== next) {
      (draft as Record<string, unknown>)[field as string] = next;
      recorder.record(`${domain}.${field}`, prev, next, "trajectory", ctx.trajectory);
    }
  }

  for (const [f, delta] of Object.entries(envDelta) as [keyof typeof envDelta, number][]) {
    applyField(f as keyof AdaptationDraft, delta, "environmental");
  }
  for (const [f, delta] of Object.entries(execDelta) as [keyof typeof execDelta, number][]) {
    applyField(f as keyof AdaptationDraft, delta, "execution");
  }
  for (const [f, delta] of Object.entries(guidanceDelta) as [
    keyof typeof guidanceDelta,
    number,
  ][]) {
    applyField(f as keyof AdaptationDraft, delta, "guidance");
  }

  if (
    Object.keys(envDelta).length +
      Object.keys(execDelta).length +
      Object.keys(guidanceDelta).length >
    0
  ) {
    draft.reasoning.push(`Trajectory delta applied: ${ctx.trajectory}`);
  }
}
