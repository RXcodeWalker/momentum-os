import type { UserMode, UserTrajectory } from "@/core/contracts/state/modes";
import type { RiskLevel } from "@/core/contracts/primitives";
import type { BehavioralSignal } from "@/core/contracts/signals/behavioral-signals";
import type { AdaptationDraft } from "./types/internal";

export const ADAPTATION_ENGINE_VERSION = "1.0.0";

// ── Environmental baselines ────────────────────────────────────────────────

type EnvBaselineRow = Pick<
  AdaptationDraft,
  | "interfaceDensity"
  | "spacingIntensity"
  | "visualNoiseLevel"
  | "motionIntensity"
  | "pacingFeel"
  | "hierarchySharpness"
  | "contrastStrength"
  | "visibleComplexity"
  | "deepWorkProtectionEnabled"
  | "dashboardCompressionLevel"
>;

export const MODE_ENV_BASELINES: Record<UserMode, EnvBaselineRow> = {
  RECOVERY: {
    interfaceDensity: 30,
    spacingIntensity: 80,
    visualNoiseLevel: 15,
    motionIntensity: 15,
    pacingFeel: 20,
    hierarchySharpness: 85,
    contrastStrength: 70,
    visibleComplexity: 15,
    deepWorkProtectionEnabled: true,
    dashboardCompressionLevel: 80,
  },
  STABILIZING: {
    interfaceDensity: 50,
    spacingIntensity: 65,
    visualNoiseLevel: 30,
    motionIntensity: 35,
    pacingFeel: 45,
    hierarchySharpness: 75,
    contrastStrength: 60,
    visibleComplexity: 35,
    deepWorkProtectionEnabled: false,
    dashboardCompressionLevel: 60,
  },
  FOCUSED: {
    interfaceDensity: 70,
    spacingIntensity: 50,
    visualNoiseLevel: 50,
    motionIntensity: 55,
    pacingFeel: 65,
    hierarchySharpness: 65,
    contrastStrength: 55,
    visibleComplexity: 60,
    deepWorkProtectionEnabled: true,
    dashboardCompressionLevel: 35,
  },
  EXPANDING: {
    interfaceDensity: 85,
    spacingIntensity: 35,
    visualNoiseLevel: 70,
    motionIntensity: 70,
    pacingFeel: 80,
    hierarchySharpness: 55,
    contrastStrength: 45,
    visibleComplexity: 80,
    deepWorkProtectionEnabled: false,
    dashboardCompressionLevel: 20,
  },
};

type EnvDelta = Partial<
  Pick<
    AdaptationDraft,
    | "interfaceDensity"
    | "spacingIntensity"
    | "visualNoiseLevel"
    | "motionIntensity"
    | "pacingFeel"
    | "hierarchySharpness"
    | "contrastStrength"
    | "visibleComplexity"
    | "dashboardCompressionLevel"
  >
>;

export const TRAJECTORY_ENV_DELTAS: Record<UserTrajectory, EnvDelta> = {
  CONTRACTING: {
    interfaceDensity: -10,
    spacingIntensity: 10,
    visualNoiseLevel: -10,
    dashboardCompressionLevel: 15,
    pacingFeel: -10,
  },
  FRAGILE: {
    interfaceDensity: -5,
    spacingIntensity: 5,
    dashboardCompressionLevel: 8,
    pacingFeel: -5,
  },
  STABLE: {},
  EXPANDING: {
    interfaceDensity: 5,
    visualNoiseLevel: 5,
    pacingFeel: 5,
    visibleComplexity: 5,
    dashboardCompressionLevel: -5,
  },
};

// ── Execution baselines ────────────────────────────────────────────────────

type ExecBaselineRow = Pick<
  AdaptationDraft,
  | "visibleTaskLimit"
  | "recommendedChallengeLevel"
  | "workloadCompressionRatio"
  | "deepWorkExpectation"
  | "recoveryWeighting"
  | "advancementWeighting"
  | "focusProtectionStrength"
>;

export const MODE_EXEC_BASELINES: Record<UserMode, ExecBaselineRow> = {
  RECOVERY: {
    visibleTaskLimit: 2,
    recommendedChallengeLevel: 10,
    workloadCompressionRatio: 0.4,
    deepWorkExpectation: 10,
    recoveryWeighting: 0.8,
    advancementWeighting: 0.2,
    focusProtectionStrength: 60,
  },
  STABILIZING: {
    visibleTaskLimit: 4,
    recommendedChallengeLevel: 30,
    workloadCompressionRatio: 0.65,
    deepWorkExpectation: 35,
    recoveryWeighting: 0.55,
    advancementWeighting: 0.45,
    focusProtectionStrength: 50,
  },
  FOCUSED: {
    visibleTaskLimit: 6,
    recommendedChallengeLevel: 60,
    workloadCompressionRatio: 0.85,
    deepWorkExpectation: 70,
    recoveryWeighting: 0.3,
    advancementWeighting: 0.7,
    focusProtectionStrength: 75,
  },
  EXPANDING: {
    visibleTaskLimit: 8,
    recommendedChallengeLevel: 80,
    workloadCompressionRatio: 1.0,
    deepWorkExpectation: 80,
    recoveryWeighting: 0.15,
    advancementWeighting: 0.85,
    focusProtectionStrength: 65,
  },
};

type ExecDelta = {
  visibleTaskLimit?: number;
  recommendedChallengeLevel?: number;
  workloadCompressionRatio?: number;
  deepWorkExpectation?: number;
  recoveryWeighting?: number;
  advancementWeighting?: number;
};

export const TRAJECTORY_EXEC_DELTAS: Record<UserTrajectory, ExecDelta> = {
  CONTRACTING: {
    visibleTaskLimit: -2,
    workloadCompressionRatio: -0.15,
    recoveryWeighting: 0.15,
    advancementWeighting: -0.15,
  },
  FRAGILE: {
    visibleTaskLimit: -1,
    workloadCompressionRatio: -0.08,
    recoveryWeighting: 0.08,
  },
  STABLE: {},
  EXPANDING: {
    visibleTaskLimit: 1,
    recommendedChallengeLevel: 10,
    advancementWeighting: 0.1,
  },
};

// ── Guidance baselines ─────────────────────────────────────────────────────

type GuidanceBaselineRow = Pick<
  AdaptationDraft,
  | "interventionFrequency"
  | "reflectionDepth"
  | "strategicGuidanceWeight"
  | "emotionalPressureLevel"
  | "clarityOrientation"
>;

export const MODE_GUIDANCE_BASELINES: Record<UserMode, GuidanceBaselineRow> = {
  RECOVERY: {
    interventionFrequency: 80,
    reflectionDepth: 70,
    strategicGuidanceWeight: 25,
    emotionalPressureLevel: 10,
    clarityOrientation: 85,
  },
  STABILIZING: {
    interventionFrequency: 55,
    reflectionDepth: 55,
    strategicGuidanceWeight: 50,
    emotionalPressureLevel: 25,
    clarityOrientation: 70,
  },
  FOCUSED: {
    interventionFrequency: 35,
    reflectionDepth: 40,
    strategicGuidanceWeight: 65,
    emotionalPressureLevel: 45,
    clarityOrientation: 55,
  },
  EXPANDING: {
    interventionFrequency: 20,
    reflectionDepth: 30,
    strategicGuidanceWeight: 80,
    emotionalPressureLevel: 60,
    clarityOrientation: 40,
  },
};

type GuidanceDelta = {
  interventionFrequency?: number;
  reflectionDepth?: number;
  strategicGuidanceWeight?: number;
  emotionalPressureLevel?: number;
  clarityOrientation?: number;
};

export const TRAJECTORY_GUIDANCE_DELTAS: Record<UserTrajectory, GuidanceDelta> = {
  CONTRACTING: {
    interventionFrequency: 15,
    reflectionDepth: 10,
    emotionalPressureLevel: -15,
    clarityOrientation: 10,
  },
  FRAGILE: {
    interventionFrequency: 8,
    reflectionDepth: 5,
    emotionalPressureLevel: -8,
  },
  STABLE: {},
  EXPANDING: {
    strategicGuidanceWeight: 10,
    emotionalPressureLevel: 5,
    interventionFrequency: -5,
  },
};

// ── Risk gates ─────────────────────────────────────────────────────────────

export type RiskGate = {
  field: keyof AdaptationDraft;
  /** 'ceil' clamps max; 'floor' clamps min; 'set' hard-assigns */
  op: "ceil" | "floor" | "set";
  value: number | boolean;
  reason: string;
};

export const RISK_GATES: Array<{
  risk: "burnoutRisk" | "overloadRisk" | "collapseRisk" | "avoidanceRisk";
  level: RiskLevel;
  gates: RiskGate[];
}> = [
  {
    risk: "burnoutRisk",
    level: "CRITICAL",
    gates: [
      { field: "interfaceDensity", op: "ceil", value: 40, reason: "burnoutRisk CRITICAL" },
      {
        field: "dashboardCompressionLevel",
        op: "floor",
        value: 75,
        reason: "burnoutRisk CRITICAL",
      },
    ],
  },
  {
    risk: "burnoutRisk",
    level: "HIGH",
    gates: [
      { field: "interfaceDensity", op: "ceil", value: 55, reason: "burnoutRisk HIGH" },
      { field: "dashboardCompressionLevel", op: "floor", value: 60, reason: "burnoutRisk HIGH" },
    ],
  },
  {
    risk: "overloadRisk",
    level: "HIGH",
    gates: [
      { field: "visualNoiseLevel", op: "ceil", value: 35, reason: "overloadRisk HIGH" },
      { field: "pacingFeel", op: "ceil", value: 60, reason: "overloadRisk HIGH" },
    ],
  },
  {
    risk: "overloadRisk",
    level: "CRITICAL",
    gates: [
      { field: "visualNoiseLevel", op: "ceil", value: 35, reason: "overloadRisk CRITICAL" },
      { field: "pacingFeel", op: "ceil", value: 60, reason: "overloadRisk CRITICAL" },
    ],
  },
  {
    risk: "collapseRisk",
    level: "CRITICAL",
    gates: [
      { field: "hierarchySharpness", op: "floor", value: 85, reason: "collapseRisk CRITICAL" },
      { field: "deepWorkExpectation", op: "ceil", value: 20, reason: "collapseRisk CRITICAL" },
      { field: "reflectionDepth", op: "ceil", value: 35, reason: "collapseRisk CRITICAL" },
      { field: "interventionFrequency", op: "floor", value: 70, reason: "collapseRisk CRITICAL" },
    ],
  },
  {
    risk: "burnoutRisk",
    level: "CRITICAL",
    gates: [
      {
        field: "workloadCompressionRatio",
        op: "ceil",
        value: 0.5,
        reason: "burnoutRisk CRITICAL exec",
      },
      { field: "visibleTaskLimit", op: "ceil", value: 3, reason: "burnoutRisk CRITICAL exec" },
      { field: "recoveryWeighting", op: "floor", value: 0.75, reason: "burnoutRisk CRITICAL exec" },
    ],
  },
  {
    risk: "overloadRisk",
    level: "HIGH",
    gates: [
      {
        field: "workloadCompressionRatio",
        op: "ceil",
        value: 0.6,
        reason: "overloadRisk HIGH exec",
      },
      { field: "visibleTaskLimit", op: "ceil", value: 4, reason: "overloadRisk HIGH exec" },
    ],
  },
  {
    risk: "overloadRisk",
    level: "CRITICAL",
    gates: [
      {
        field: "workloadCompressionRatio",
        op: "ceil",
        value: 0.6,
        reason: "overloadRisk CRITICAL exec",
      },
      { field: "visibleTaskLimit", op: "ceil", value: 4, reason: "overloadRisk CRITICAL exec" },
    ],
  },
  {
    risk: "burnoutRisk",
    level: "HIGH",
    gates: [
      {
        field: "emotionalPressureLevel",
        op: "ceil",
        value: 20,
        reason: "burnoutRisk HIGH guidance",
      },
    ],
  },
  {
    risk: "burnoutRisk",
    level: "CRITICAL",
    gates: [
      {
        field: "emotionalPressureLevel",
        op: "ceil",
        value: 20,
        reason: "burnoutRisk CRITICAL guidance",
      },
    ],
  },
  {
    risk: "avoidanceRisk",
    level: "HIGH",
    gates: [
      {
        field: "emotionalPressureLevel",
        op: "ceil",
        value: 15,
        reason: "avoidanceRisk HIGH guidance",
      },
      {
        field: "clarityOrientation",
        op: "floor",
        value: 70,
        reason: "avoidanceRisk HIGH guidance",
      },
    ],
  },
];

// ── Signal tuning ──────────────────────────────────────────────────────────

export type SignalTuningRule = {
  signal: BehavioralSignal;
  /** Threshold above which the rule fires (0 if always-on when active). */
  strengthThreshold: number;
  apply: (draft: AdaptationDraft, strength: number) => void;
};

export const SIGNAL_TUNING_RULES: SignalTuningRule[] = [
  {
    signal: "DEEP_WORK_DEGRADATION",
    strengthThreshold: 0,
    apply: (draft, strength) => {
      draft.deepWorkProtectionEnabled = true;
      draft.motionIntensity = Math.max(0, draft.motionIntensity - strength * 0.15);
    },
  },
  {
    signal: "RISING_FRAGMENTATION",
    strengthThreshold: 60,
    apply: (draft, strength) => {
      draft.visualNoiseLevel = Math.max(0, draft.visualNoiseLevel - (strength - 60) * 0.3);
    },
  },
  {
    signal: "VOLATILITY_ACCELERATION",
    strengthThreshold: 50,
    apply: (draft, strength) => {
      draft.spacingIntensity = Math.min(100, draft.spacingIntensity + (strength - 50) * 0.2);
    },
  },
  {
    signal: "AVOIDANCE_CLUSTERING",
    strengthThreshold: 55,
    apply: (draft) => {
      draft.visibleTaskLimit = Math.max(1, draft.visibleTaskLimit - 1);
    },
  },
  {
    signal: "OVERCOMMITMENT_EXPANSION",
    strengthThreshold: 60,
    apply: (draft, strength) => {
      draft.workloadCompressionRatio = Math.max(
        0,
        draft.workloadCompressionRatio - (strength - 60) * 0.002,
      );
    },
  },
  {
    signal: "PLANNING_ESCAPE",
    strengthThreshold: 50,
    apply: (draft, strength) => {
      draft.advancementWeighting = Math.min(
        1,
        draft.advancementWeighting + (strength - 50) * 0.002,
      );
    },
  },
  {
    signal: "MEANINGFULNESS_DEFERRAL",
    strengthThreshold: 50,
    apply: (draft, strength) => {
      draft.strategicGuidanceWeight = Math.min(
        100,
        draft.strategicGuidanceWeight + (strength - 50) * 0.3,
      );
    },
  },
  {
    signal: "AVOIDANCE_CLUSTERING",
    strengthThreshold: 0,
    apply: (draft, strength) => {
      draft.emotionalPressureLevel = Math.max(0, draft.emotionalPressureLevel - strength * 0.15);
    },
  },
  {
    signal: "DECLINING_EXECUTION_QUALITY",
    strengthThreshold: 60,
    apply: (draft, strength) => {
      draft.reflectionDepth = Math.min(100, draft.reflectionDepth + (strength - 60) * 0.2);
    },
  },
];

// ── Expansion delta bounds ─────────────────────────────────────────────────

export const EXPANSION_DELTA_CONFIG = {
  /** Maximum +points applied to recommendedChallengeLevel per expansion pass */
  MAX_EXPANSION_DELTA: 15,
  /** Maximum -points applied to recommendedChallengeLevel per contraction pass */
  MAX_CONTRACTION_DELTA: 15,
} as const;

// ── Intensity reference baseline (FOCUSED mode) ────────────────────────────

export const INTENSITY_FOCUSED_REF = {
  interfaceDensity: 70,
  dashboardCompressionLevel: 35,
  workloadCompressionRatioScaled: 85, // ratio * 100
  recoveryWeightingScaled: 30, // weighting * 100
  emotionalPressureLevel: 45,
  interventionFrequency: 35,
};
