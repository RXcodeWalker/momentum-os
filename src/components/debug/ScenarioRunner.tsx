import { useState } from "react";
import type { AdaptationOutput } from "@/core/contracts/adaptation/output";
import type { AdaptationEngineInput } from "@/engine/adaptation/adaptation-engine";
import { generateAdaptation } from "@/engine/adaptation/adaptation-engine";
import type { UserMode, UserTrajectory } from "@/core/contracts/state/modes";
import type { RiskLevel } from "@/core/contracts/primitives";
import type { BehavioralSignal } from "@/core/contracts/signals/behavioral-signals";
import {
  SCENARIO_RECOVERY_CONTRACTING,
  SCENARIO_RECOVERY_FRAGILE,
  SCENARIO_RECOVERY_STABLE,
  SCENARIO_RECOVERY_EXPANDING,
  SCENARIO_STABILIZING_CONTRACTING,
  SCENARIO_STABILIZING_FRAGILE,
  SCENARIO_STABILIZING_STABLE,
  SCENARIO_STABILIZING_EXPANDING,
  SCENARIO_FOCUSED_CONTRACTING,
  SCENARIO_FOCUSED_FRAGILE,
  SCENARIO_FOCUSED_STABLE,
  SCENARIO_FOCUSED_EXPANDING,
  SCENARIO_EXPANDING_CONTRACTING,
  SCENARIO_EXPANDING_FRAGILE,
  SCENARIO_EXPANDING_STABLE,
  SCENARIO_EXPANDING_EXPANDING,
} from "@/testing/fixtures/adaptation-engine";

const MODES: UserMode[] = ["RECOVERY", "STABILIZING", "FOCUSED", "EXPANDING"];
const TRAJECTORIES: UserTrajectory[] = ["CONTRACTING", "FRAGILE", "STABLE", "EXPANDING"];
const RISK_LEVELS: RiskLevel[] = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
const SIGNALS: BehavioralSignal[] = [
  "DEEP_WORK_DEGRADATION",
  "RISING_FRAGMENTATION",
  "VOLATILITY_ACCELERATION",
  "AVOIDANCE_CLUSTERING",
  "OVERCOMMITMENT_EXPANSION",
  "PLANNING_ESCAPE",
  "MEANINGFULNESS_DEFERRAL",
  "DECLINING_EXECUTION_QUALITY",
  "PACING_INSTABILITY",
];

const PRESETS: Array<{ label: string; input: AdaptationEngineInput }> = [
  { label: "RECOVERY × CONTRACTING", input: SCENARIO_RECOVERY_CONTRACTING },
  { label: "RECOVERY × FRAGILE", input: SCENARIO_RECOVERY_FRAGILE },
  { label: "RECOVERY × STABLE", input: SCENARIO_RECOVERY_STABLE },
  { label: "RECOVERY × EXPANDING", input: SCENARIO_RECOVERY_EXPANDING },
  { label: "STABILIZING × CONTRACTING", input: SCENARIO_STABILIZING_CONTRACTING },
  { label: "STABILIZING × FRAGILE", input: SCENARIO_STABILIZING_FRAGILE },
  { label: "STABILIZING × STABLE", input: SCENARIO_STABILIZING_STABLE },
  { label: "STABILIZING × EXPANDING", input: SCENARIO_STABILIZING_EXPANDING },
  { label: "FOCUSED × CONTRACTING", input: SCENARIO_FOCUSED_CONTRACTING },
  { label: "FOCUSED × FRAGILE", input: SCENARIO_FOCUSED_FRAGILE },
  { label: "FOCUSED × STABLE", input: SCENARIO_FOCUSED_STABLE },
  { label: "FOCUSED × EXPANDING", input: SCENARIO_FOCUSED_EXPANDING },
  { label: "EXPANDING × CONTRACTING", input: SCENARIO_EXPANDING_CONTRACTING },
  { label: "EXPANDING × FRAGILE", input: SCENARIO_EXPANDING_FRAGILE },
  { label: "EXPANDING × STABLE", input: SCENARIO_EXPANDING_STABLE },
  { label: "EXPANDING × EXPANDING", input: SCENARIO_EXPANDING_EXPANDING },
];

type Props = {
  onOutput: (output: AdaptationOutput) => void;
};

function sel(label: string, value: string, options: string[], onChange: (v: string) => void) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-background border border-border rounded px-1 py-0.5 text-[10px] font-mono text-foreground"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ScenarioRunner({ onOutput }: Props) {
  const [mode, setMode] = useState<UserMode>("FOCUSED");
  const [trajectory, setTrajectory] = useState<UserTrajectory>("STABLE");
  const [burnout, setBurnout] = useState<RiskLevel>("LOW");
  const [overload, setOverload] = useState<RiskLevel>("LOW");
  const [avoidance, setAvoidance] = useState<RiskLevel>("LOW");
  const [collapse, setCollapse] = useState<RiskLevel>("LOW");
  const [signalStrengths, setSignalStrengths] = useState<Partial<Record<BehavioralSignal, number>>>(
    {},
  );
  const [preset, setPreset] = useState("");

  function loadPreset(label: string) {
    const p = PRESETS.find((p) => p.label === label);
    if (!p) return;
    const s = p.input.stateInterpretation;
    setMode(s.currentMode);
    setTrajectory(s.currentTrajectory);
    setBurnout(s.burnoutRisk);
    setOverload(s.overloadRisk);
    setAvoidance(s.avoidanceRisk);
    setCollapse(s.collapseRisk);
    setSignalStrengths(
      p.input.signalSnapshot.signalStrengths as Partial<Record<BehavioralSignal, number>>,
    );
    setPreset(label);
  }

  function buildInput(): AdaptationEngineInput {
    const activeSignals = (Object.entries(signalStrengths) as [BehavioralSignal, number][])
      .filter(([, v]) => v > 0)
      .map(([k]) => k);

    return {
      stateInterpretation: {
        recoveryDebt: 30,
        cognitiveStrain: 28,
        executionStability: 72,
        emotionalFriction: 25,
        momentumIntegrity: 68,
        resilienceCapacity: 70,
        overwhelmLevel: 22,
        fragmentationLevel: 20,
        recoveryCapacity: 70,
        meaningfulEngagement: 72,
        deepWorkContinuity: 75,
        behavioralVolatility: 18,
        currentMode: mode,
        currentTrajectory: trajectory,
        overloadRisk: overload,
        burnoutRisk: burnout,
        avoidanceRisk: avoidance,
        collapseRisk: collapse,
        adaptationReadiness: 72,
        expansionReadiness: 68,
        consistencyTrend: "STABLE",
        recoveryTrend: "STABLE",
        engagementTrend: "STABLE",
        confidence: {
          score: 75,
          band: "HIGH",
          evidenceCoverage: 0.85,
          signalConsistency: 0.8,
          uncertaintyFactors: [],
        },
        lastUpdatedAt: new Date().toISOString(),
      },
      signalSnapshot: {
        capturedAt: new Date().toISOString(),
        activeSignals,
        signalStrengths: Object.fromEntries(activeSignals.map((s) => [s, signalStrengths[s] ?? 0])),
        signalDurations: Object.fromEntries(activeSignals.map((s) => [s, 3])),
        confidence: "HIGH",
      },
      interventionEvaluation: {
        interventions: [],
        evaluationNotes: [],
        restraintApplied: false,
        candidatesFound: 0,
        engineVersion: "v1",
      },
    };
  }

  function run() {
    const output = generateAdaptation(buildInput());
    onOutput(output);
  }

  function copyJSON() {
    const output = generateAdaptation(buildInput());
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-0.5">
        <label className="text-[9px] uppercase tracking-wider text-muted-foreground">
          Load Preset
        </label>
        <select
          value={preset}
          onChange={(e) => loadPreset(e.target.value)}
          className="bg-background border border-border rounded px-1 py-0.5 text-[10px] font-mono text-foreground"
        >
          <option value="">— select preset —</option>
          {PRESETS.map((p) => (
            <option key={p.label} value={p.label}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-1">
        {sel("Mode", mode, MODES, (v) => setMode(v as UserMode))}
        {sel("Trajectory", trajectory, TRAJECTORIES, (v) => setTrajectory(v as UserTrajectory))}
        {sel("Burnout", burnout, RISK_LEVELS, (v) => setBurnout(v as RiskLevel))}
        {sel("Overload", overload, RISK_LEVELS, (v) => setOverload(v as RiskLevel))}
        {sel("Avoidance", avoidance, RISK_LEVELS, (v) => setAvoidance(v as RiskLevel))}
        {sel("Collapse", collapse, RISK_LEVELS, (v) => setCollapse(v as RiskLevel))}
      </div>

      <div className="space-y-1">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
          Signal Strengths
        </p>
        {SIGNALS.map((signal) => (
          <div key={signal} className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-muted-foreground w-36 truncate">
              {signal.replace(/_/g, " ")}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={signalStrengths[signal] ?? 0}
              onChange={(e) =>
                setSignalStrengths((prev) => ({ ...prev, [signal]: Number(e.target.value) }))
              }
              className="flex-1 h-1 accent-accent"
            />
            <span className="text-[9px] font-mono text-foreground w-5 text-right">
              {signalStrengths[signal] ?? 0}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-1 pt-1">
        <button
          onClick={run}
          className="flex-1 bg-accent text-background rounded px-2 py-1 text-[10px] font-medium"
        >
          Run
        </button>
        <button
          onClick={copyJSON}
          className="bg-secondary text-foreground rounded px-2 py-1 text-[10px]"
        >
          Copy JSON
        </button>
      </div>
    </div>
  );
}
