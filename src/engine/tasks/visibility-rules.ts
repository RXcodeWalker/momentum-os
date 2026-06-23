import type { ExecutionAdaptation } from "@/core/contracts/adaptation/execution";

export type VisibilityResult = {
  visibleTaskIds: string[];
  hiddenCount: number;
  compressionReason: "recovery-protection" | "capacity-cap" | "none";
};

export function applyVisibilityRules(
  orderedIds: string[],
  execution: ExecutionAdaptation,
): VisibilityResult {
  const pacing = execution.pacingRecommendation;
  let limit = execution.visibleTaskLimit;
  let compressionReason: VisibilityResult["compressionReason"] = "none";

  if (pacing === "COMPRESS_SCOPE" || pacing === "REDUCE_LOAD") {
    limit = Math.min(limit, 2);
    compressionReason = "recovery-protection";
  } else if (orderedIds.length > limit) {
    compressionReason = "capacity-cap";
  }

  return {
    visibleTaskIds: orderedIds.slice(0, limit),
    hiddenCount: Math.max(0, orderedIds.length - limit),
    compressionReason,
  };
}
