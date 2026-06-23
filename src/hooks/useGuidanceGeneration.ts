import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { generate } from "@/engine/guidance";
import type { GuidanceContext } from "@/core/contracts/guidance/messages";
import type { GuidanceGenerationOutput } from "@/core/contracts/guidance/output";

export function useGuidanceGeneration(
  phase: "morning" | "midday" | "evening" = "morning",
): GuidanceGenerationOutput | null {
  const pipeline = useApp((s) => s.lastPipelineResult);

  return useMemo(() => {
    const adaptation = pipeline?.adaptationGeneration;
    if (!adaptation) return null;

    const state = pipeline.stateInterpretation;

    const ctx: GuidanceContext = {
      tone: adaptation.guidance.messagingTone,
      mode: state.currentMode,
      trajectory: state.currentTrajectory,
      guidance: adaptation.guidance,
      flowPhase: phase,
      collapseRisk: state.collapseRisk,
    };

    return generate(ctx);
  }, [pipeline?.adaptationGeneration?.generatedAt, phase]);
}
