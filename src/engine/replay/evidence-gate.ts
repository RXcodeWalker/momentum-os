import type { BehavioralEvidence } from "@/core/contracts/history/evidence";
import type { ReplayWindowScope } from "@/core/contracts/replay/window";
import type { ReplaySection } from "@/core/contracts/replay/result";
import { REPLAY_WINDOW_CONFIG } from "@/core/contracts/replay/window";

export type SectionSuppressionMap = {
  narrative: { suppressed: boolean; reason: string | null };
  attribution: { suppressed: boolean; reason: string | null };
  transition: { suppressed: boolean; reason: string | null };
  forecast: { suppressed: boolean; reason: string | null };
};

export function computeSuppressionMap(
  evidence: BehavioralEvidence,
  scope: ReplayWindowScope,
): SectionSuppressionMap {
  const config = REPLAY_WINDOW_CONFIG[scope];
  const totalCheckIns = evidence.summary.totalCheckIns;
  const confidenceBand = evidence.summary.confidence.band;
  const snapshot = evidence.snapshots[scope === "W7" ? "W7" : scope === "W14" ? "W14" : "W28"];
  const priorSnapshot = evidence.snapshots["W7_PRIOR"];
  const evidenceDays = snapshot?.evidenceDays ?? 0;

  const narrative = (() => {
    if (totalCheckIns < 5)
      return { suppressed: true, reason: "At least 5 check-ins needed to build a timeline." };
    if (evidenceDays < config.minimumEvidenceDays)
      return { suppressed: true, reason: "Not enough data days in this window." };
    return { suppressed: false, reason: null };
  })();

  const attribution = (() => {
    if (totalCheckIns < 7)
      return { suppressed: true, reason: "At least 7 check-ins needed for factor analysis." };
    if (confidenceBand === "LOW")
      return { suppressed: true, reason: "Not enough consistent data to attribute patterns." };
    return { suppressed: false, reason: null };
  })();

  const transition = (() => {
    if (totalCheckIns < 10)
      return { suppressed: true, reason: "At least 10 check-ins needed to detect transitions." };
    if (!priorSnapshot)
      return { suppressed: true, reason: "No prior period data available for comparison." };
    return { suppressed: false, reason: null };
  })();

  const forecast = (() => {
    if (totalCheckIns < 21)
      return {
        suppressed: true,
        reason: "At least 21 check-ins needed for pattern-based forecasting.",
      };
    if (confidenceBand === "LOW")
      return { suppressed: true, reason: "Evidence confidence is too low to generate forecasts." };
    return { suppressed: false, reason: null };
  })();

  return { narrative, attribution, transition, forecast };
}

export function suppressedSectionsList(map: SectionSuppressionMap): ReplaySection[] {
  const sections: ReplaySection[] = [];
  if (map.narrative.suppressed) sections.push("narrative");
  if (map.attribution.suppressed) sections.push("attribution");
  if (map.transition.suppressed) sections.push("transition");
  if (map.forecast.suppressed) sections.push("forecast");
  return sections;
}
