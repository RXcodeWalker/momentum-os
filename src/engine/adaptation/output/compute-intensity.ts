import type { Scalar } from "@/core/contracts/primitives";
import type { AdaptationDraft } from "../types/internal";
import { INTENSITY_FOCUSED_REF } from "../config";

export function computeAdaptationIntensity(draft: AdaptationDraft): Scalar {
  const draftValues = [
    draft.interfaceDensity,
    draft.dashboardCompressionLevel,
    draft.workloadCompressionRatio * 100,
    draft.recoveryWeighting * 100,
    draft.emotionalPressureLevel,
    draft.interventionFrequency,
  ];
  const refValues = [
    INTENSITY_FOCUSED_REF.interfaceDensity,
    INTENSITY_FOCUSED_REF.dashboardCompressionLevel,
    INTENSITY_FOCUSED_REF.workloadCompressionRatioScaled,
    INTENSITY_FOCUSED_REF.recoveryWeightingScaled,
    INTENSITY_FOCUSED_REF.emotionalPressureLevel,
    INTENSITY_FOCUSED_REF.interventionFrequency,
  ];

  let sumDev = 0;
  for (let i = 0; i < draftValues.length; i++) {
    sumDev += Math.abs(draftValues[i] - refValues[i]);
  }
  const meanDev = sumDev / draftValues.length;
  return Math.min(100, Math.max(0, meanDev * 1.5));
}
