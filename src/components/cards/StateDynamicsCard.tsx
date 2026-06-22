"use client";
import { useStateDynamicsProfile, useStateDynamics } from "@/lib/store";
import { useDataReadiness } from "@/lib/maturity";
import { Card, StatLabel, Pill, BarRow } from "@/components/ui-bits";
import { TapCard } from "@/lib/motion";
import type { BehavioralPeriodType } from "@/core/contracts/history/period";
import type { DominantPattern } from "@/core/contracts/state/dynamics";

const PERIOD_LABEL: Record<BehavioralPeriodType, string> = {
  RECOVERY: "Recovery",
  INSTABILITY: "Instability",
  STABILIZING: "Stabilizing",
  FOCUSED: "Focused",
  EXPANDING: "Expanding",
};

const PATTERN_LABEL: Record<DominantPattern, string> = {
  cycling: "Cycling",
  stable: "Stable",
  expanding: "Expanding",
  contracting: "Contracting",
  erratic: "Erratic",
};

const PATTERN_TONE: Record<DominantPattern, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  cycling: "warning",
  stable: "success",
  expanding: "accent",
  contracting: "danger",
  erratic: "warning",
};

const STABILITY_TONE: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  stable: "success",
  building: "accent",
  transitioning: "warning",
  volatile: "danger",
};

export function StateDynamicsCard() {
  const { hasMinimum } = useDataReadiness("stateDynamics");
  const profile = useStateDynamicsProfile();
  const dynamics = useStateDynamics();

  if (!hasMinimum) return null;

  const { stability, volatility, oscillation } = dynamics;
  const {
    dominantPattern,
    transitionMatrix,
    recoveryPathwayAnalysis,
    instabilityHotspots,
  } = profile;

  const topPaths = transitionMatrix.commonPaths.slice(0, 2);
  const showRecovery =
    recoveryPathwayAnalysis.pathways.length >= 2 &&
    recoveryPathwayAnalysis.avgDaysToFocusedFromRecovery !== null;
  const topHotspot = instabilityHotspots[0];
  const showHotspot = topHotspot?.riskSignal === "high";

  const recoverySuccessRate =
    recoveryPathwayAnalysis.pathways.length > 0
      ? Math.round(
          (recoveryPathwayAnalysis.pathways.filter((p) => p.isSuccessful).reduce((s, p) => s + p.count, 0) /
            recoveryPathwayAnalysis.pathways.reduce((s, p) => s + p.count, 0)) *
            100,
        )
      : null;

  return (
    <TapCard>
      <Card>
        <StatLabel className="mb-4">State Dynamics</StatLabel>

        {/* Current stability */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Current state</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {dynamics.currentPeriod ? PERIOD_LABEL[dynamics.currentPeriod] : "—"}{" "}
              <span className="text-muted-foreground">
                · {stability.currentModeDays}d
              </span>
            </p>
          </div>
          <Pill tone={STABILITY_TONE[stability.rating] ?? "neutral"}>
            {stability.rating}
          </Pill>
        </div>

        {/* Volatility */}
        <div className="mb-4">
          <BarRow
            label={`Volatility · ${volatility.interpretation}`}
            value={volatility.score}
            max={100}
            tone={volatility.score >= 60 ? "danger" : "neutral"}
          />
        </div>

        {/* Dominant pattern */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Dominant pattern</p>
          <Pill tone={PATTERN_TONE[dominantPattern]}>{PATTERN_LABEL[dominantPattern]}</Pill>
        </div>

        {/* Common transition paths */}
        {topPaths.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs text-muted-foreground">Common paths</p>
            <div className="space-y-1.5">
              {topPaths.map((path, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-foreground">
                    {PERIOD_LABEL[path.from]} → {PERIOD_LABEL[path.to]}
                  </span>
                  <span className="num-tabular text-muted-foreground">{path.count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recovery pathways */}
        {showRecovery && (
          <div className="mb-4 rounded-2xl bg-secondary/50 p-3">
            <p className="mb-1 text-xs font-medium text-foreground">Recovery</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Avg days to focused</span>
              <span className="num-tabular text-foreground">
                {Math.round(recoveryPathwayAnalysis.avgDaysToFocusedFromRecovery!)}d
              </span>
            </div>
            {recoverySuccessRate !== null && (
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Success rate</span>
                <span className="num-tabular text-foreground">{recoverySuccessRate}%</span>
              </div>
            )}
          </div>
        )}

        {/* Instability hotspot warning */}
        {showHotspot && (
          <div className="mb-4 rounded-2xl bg-danger/10 px-3 py-2.5">
            <p className="text-xs font-medium text-danger">
              High instability risk after {PERIOD_LABEL[topHotspot.predecessorState]}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {Math.round(topHotspot.precedenceRate * 100)}% of instability periods follow this state
            </p>
          </div>
        )}

        {/* Oscillation warning */}
        {oscillation.isOscillating && (
          <div className="rounded-2xl bg-warning/10 px-3 py-2.5">
            <p className="text-xs font-medium text-warning">Oscillating pattern detected</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {oscillation.frequencyPer28Days} transitions in the last 28 days
              {oscillation.dominantCyclePair && (
                <> · {PERIOD_LABEL[oscillation.dominantCyclePair.from]} ↔{" "}
                {PERIOD_LABEL[oscillation.dominantCyclePair.to]}</>
              )}
            </p>
          </div>
        )}
      </Card>
    </TapCard>
  );
}
