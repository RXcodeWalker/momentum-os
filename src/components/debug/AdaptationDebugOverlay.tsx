import { useEffect, useState } from "react";
import type { AdaptationOutput } from "@/core/contracts/adaptation/output";
import { generateAdaptation } from "@/engine/adaptation/adaptation-engine";
import { useApp } from "@/lib/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TraceTimeline } from "./TraceTimeline";
import { ScenarioRunner } from "./ScenarioRunner";

type RiskBadge = { label: string; value: string };

function riskColor(level: string) {
  if (level === "CRITICAL") return "bg-danger/20 text-danger border-danger/30";
  if (level === "HIGH") return "bg-warning/20 text-warning border-warning/30";
  if (level === "MODERATE") return "bg-accent/20 text-accent border-accent/30";
  return "bg-secondary text-muted-foreground border-border";
}

function ScalarRow({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-muted-foreground w-28 truncate">{label}</span>
      <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-mono text-foreground w-8 text-right">
        {typeof value === "number" ? value.toFixed(2) : value}
      </span>
    </div>
  );
}

export function AdaptationDebugOverlay() {
  const [open, setOpen] = useState(false);
  const [output, setOutput] = useState<AdaptationOutput | null>(null);
  const [activeTab, setActiveTab] = useState<"state" | "output" | "trace" | "runner">("state");

  const pipeline = useApp((s) => s.lastPipelineResult);

  // Live output from pipeline
  useEffect(() => {
    if (!pipeline) return;
    try {
      const result = generateAdaptation({
        stateInterpretation: pipeline.stateInterpretation,
        signalSnapshot: pipeline.signalSnapshot,
        interventionEvaluation: pipeline.interventionEvaluation,
      });
      setOutput(result);
    } catch {
      // engine not yet available for this pipeline state
    }
  }, [pipeline]);

  // Ctrl+Shift+A to toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const badges: RiskBadge[] = pipeline
    ? [
        { label: "burnout", value: pipeline.stateInterpretation.burnoutRisk },
        { label: "overload", value: pipeline.stateInterpretation.overloadRisk },
        { label: "avoidance", value: pipeline.stateInterpretation.avoidanceRisk },
        { label: "collapse", value: pipeline.stateInterpretation.collapseRisk },
      ]
    : [];

  const tabClass = (t: string) =>
    `px-2 py-0.5 text-[10px] rounded cursor-pointer ${activeTab === t ? "bg-accent text-background" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-80 overflow-y-auto p-4 space-y-3 text-[11px]">
        <SheetHeader>
          <SheetTitle className="text-sm font-mono">Adaptation Debug</SheetTitle>
        </SheetHeader>

        <div className="flex gap-1 flex-wrap">
          {(["state", "output", "trace", "runner"] as const).map((t) => (
            <button key={t} className={tabClass(t)} onClick={() => setActiveTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {activeTab === "state" && pipeline && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground">Mode</span>
              <span className="text-xs font-mono font-medium text-foreground">
                {pipeline.stateInterpretation.currentMode}
              </span>
              <span className="text-[9px] text-muted-foreground ml-2">Trajectory</span>
              <span className="text-xs font-mono text-foreground">
                {pipeline.stateInterpretation.currentTrajectory}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className={`px-1.5 py-0.5 rounded border text-[9px] font-mono ${riskColor(b.value)}`}
                >
                  {b.label}: {b.value}
                </span>
              ))}
            </div>
            {output && (
              <div className="space-y-0.5 pt-1">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
                  Adaptation Intensity
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-mono font-bold text-foreground">
                    {output.adaptationIntensity.toFixed(0)}
                  </span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${output.adaptationIntensity}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            {pipeline.signalSnapshot.activeSignals.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
                  Active Signals
                </p>
                <div className="space-y-0.5">
                  {pipeline.signalSnapshot.activeSignals.map((sig) => {
                    const str = pipeline.signalSnapshot.signalStrengths[sig] ?? 0;
                    return (
                      <div key={sig} className="flex items-center gap-1">
                        <span className="text-[9px] font-mono text-foreground w-32 truncate">
                          {sig.replace(/_/g, " ")}
                        </span>
                        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-400 rounded-full"
                            style={{ width: `${str}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground w-5 text-right">
                          {str}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "output" && output && (
          <div className="space-y-3">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
                Environmental
              </p>
              <div className="space-y-0.5">
                <ScalarRow label="interfaceDensity" value={output.environmental.interfaceDensity} />
                <ScalarRow label="spacingIntensity" value={output.environmental.spacingIntensity} />
                <ScalarRow label="visualNoiseLevel" value={output.environmental.visualNoiseLevel} />
                <ScalarRow label="motionIntensity" value={output.environmental.motionIntensity} />
                <ScalarRow label="pacingFeel" value={output.environmental.pacingFeel} />
                <ScalarRow
                  label="hierarchySharpness"
                  value={output.environmental.hierarchySharpness}
                />
                <ScalarRow label="contrastStrength" value={output.environmental.contrastStrength} />
                <ScalarRow
                  label="visibleComplexity"
                  value={output.environmental.visibleComplexity}
                />
                <ScalarRow
                  label="dashboardCompression"
                  value={output.environmental.dashboardCompressionLevel}
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground w-28">deepWorkProtection</span>
                  <span
                    className={`text-[9px] font-mono px-1 rounded ${output.environmental.deepWorkProtectionEnabled ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"}`}
                  >
                    {String(output.environmental.deepWorkProtectionEnabled)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
                Execution
              </p>
              <div className="space-y-0.5">
                <ScalarRow
                  label="visibleTaskLimit"
                  value={output.execution.visibleTaskLimit}
                  max={10}
                />
                <ScalarRow
                  label="challengeLevel"
                  value={output.execution.recommendedChallengeLevel}
                />
                <ScalarRow
                  label="compressionRatio"
                  value={output.execution.workloadCompressionRatio * 100}
                />
                <ScalarRow label="deepWorkExpect" value={output.execution.deepWorkExpectation} />
                <ScalarRow
                  label="recoveryWeight"
                  value={output.execution.recoveryWeighting * 100}
                />
                <ScalarRow
                  label="advancementWeight"
                  value={output.execution.advancementWeighting * 100}
                />
                <ScalarRow
                  label="focusProtection"
                  value={output.execution.focusProtectionStrength}
                />
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[9px] text-muted-foreground w-28">
                    pacingRecommendation
                  </span>
                  <span className="text-[9px] font-mono bg-blue-500/20 text-blue-400 px-1 rounded">
                    {output.execution.pacingRecommendation}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
                Guidance
              </p>
              <div className="space-y-0.5">
                <ScalarRow label="interventionFreq" value={output.guidance.interventionFrequency} />
                <ScalarRow label="reflectionDepth" value={output.guidance.reflectionDepth} />
                <ScalarRow
                  label="strategicGuidance"
                  value={output.guidance.strategicGuidanceWeight}
                />
                <ScalarRow
                  label="emotionalPressure"
                  value={output.guidance.emotionalPressureLevel}
                />
                <ScalarRow label="clarityOrientation" value={output.guidance.clarityOrientation} />
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[9px] text-muted-foreground w-28">messagingTone</span>
                  <span className="text-[9px] font-mono bg-purple-500/20 text-purple-400 px-1 rounded">
                    {output.guidance.messagingTone}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "trace" && output?.adaptationTrace && (
          <TraceTimeline trace={output.adaptationTrace} />
        )}

        {activeTab === "runner" && (
          <ScenarioRunner
            onOutput={(out) => {
              setOutput(out);
              setActiveTab("output");
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
