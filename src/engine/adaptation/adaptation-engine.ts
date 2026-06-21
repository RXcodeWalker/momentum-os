import type { UserState } from '@/core/contracts/state/user-state'
import type { SignalSnapshot } from '@/core/contracts/signals/signal-snapshot'
import type { InterventionEvaluationResult } from '@/core/contracts/interventions/evaluation'
import type { AdaptationOutput } from '@/core/contracts/adaptation/output'
import type { AdaptationDraft } from './types/internal'
import { buildContext } from './profile/build-profile'
import { createTraceRecorder } from './trace/trace-recorder'
import { applyModeBaseline } from './baseline/mode-baseline'
import { applyTrajectoryDelta } from './modulation/trajectory-modulator'
import { applyRiskAmplification } from './modulation/risk-amplifier'
import { applySignalTuning } from './modulation/signal-tuner'
import { mergeDirectives } from './directives/merge-directives'
import { resolvePacingRecommendation } from './output/resolve-execution'
import { resolveMessagingTone } from './output/resolve-guidance'
import { computeAdaptationIntensity } from './output/compute-intensity'
import { buildAdaptationReasoning } from './explainability/build-reasoning'
import type { PacingRecommendation } from '@/core/contracts/adaptation/execution'
import type { MessagingTone } from '@/core/contracts/adaptation/guidance'

export type AdaptationEngineInput = {
  stateInterpretation: UserState
  signalSnapshot: SignalSnapshot
  interventionEvaluation: InterventionEvaluationResult
}

function clampDraft(draft: AdaptationDraft): void {
  const numericEnvFields = [
    'interfaceDensity', 'spacingIntensity', 'visualNoiseLevel', 'motionIntensity',
    'pacingFeel', 'hierarchySharpness', 'contrastStrength', 'visibleComplexity',
    'dashboardCompressionLevel',
  ] as const

  for (const f of numericEnvFields) {
    draft[f] = Math.min(100, Math.max(0, draft[f]))
  }

  draft.visibleTaskLimit = Math.max(1, Math.round(draft.visibleTaskLimit))
  draft.recommendedChallengeLevel = Math.min(100, Math.max(0, draft.recommendedChallengeLevel))
  draft.workloadCompressionRatio = Math.min(1, Math.max(0, draft.workloadCompressionRatio))
  draft.deepWorkExpectation = Math.min(100, Math.max(0, draft.deepWorkExpectation))
  draft.recoveryWeighting = Math.min(1, Math.max(0, draft.recoveryWeighting))
  draft.advancementWeighting = Math.min(1, Math.max(0, draft.advancementWeighting))
  draft.focusProtectionStrength = Math.min(100, Math.max(0, draft.focusProtectionStrength))

  draft.interventionFrequency = Math.min(100, Math.max(0, draft.interventionFrequency))
  draft.reflectionDepth = Math.min(100, Math.max(0, draft.reflectionDepth))
  draft.strategicGuidanceWeight = Math.min(100, Math.max(0, draft.strategicGuidanceWeight))
  draft.emotionalPressureLevel = Math.min(100, Math.max(0, draft.emotionalPressureLevel))
  draft.clarityOrientation = Math.min(100, Math.max(0, draft.clarityOrientation))
}

export function generateAdaptation(input: AdaptationEngineInput): AdaptationOutput {
  const { stateInterpretation, signalSnapshot, interventionEvaluation } = input

  // Step 1 — Build frozen context
  const ctx = buildContext(stateInterpretation, signalSnapshot, interventionEvaluation)

  // Step 2 — Trace recorder (no-op in production)
  const recorder = createTraceRecorder()

  // Step 3 — Pass 1: Mode baseline
  const draft = applyModeBaseline(ctx.mode, recorder)

  // Step 4 — Pass 2: Trajectory delta + clamp
  applyTrajectoryDelta(draft, ctx, recorder)
  clampDraft(draft)

  // Step 5 — Pass 3: Risk amplification + clamp
  applyRiskAmplification(draft, ctx, recorder)
  clampDraft(draft)

  // Step 6 — Pass 4: Signal tuning + clamp
  applySignalTuning(draft, ctx, recorder)
  clampDraft(draft)

  // Step 7 — Pass 5: Directive merges (no clamp — directives are authoritative)
  mergeDirectives(draft, ctx.resolvedDirectives, recorder)

  // Step 8 — Enum resolution (reads fully-settled numerics)
  resolvePacingRecommendation(draft, ctx)
  resolveMessagingTone(draft, ctx)

  // Step 9 — Intensity + trace flush
  const adaptationIntensity = computeAdaptationIntensity(draft)
  const adaptationTrace = recorder.flush()

  // Step 10 — Reasoning audit trail
  const adaptationReasoning = buildAdaptationReasoning(draft, ctx)

  const output: AdaptationOutput = {
    environmental: {
      interfaceDensity: draft.interfaceDensity,
      spacingIntensity: draft.spacingIntensity,
      visualNoiseLevel: draft.visualNoiseLevel,
      motionIntensity: draft.motionIntensity,
      pacingFeel: draft.pacingFeel,
      hierarchySharpness: draft.hierarchySharpness,
      contrastStrength: draft.contrastStrength,
      visibleComplexity: draft.visibleComplexity,
      deepWorkProtectionEnabled: draft.deepWorkProtectionEnabled,
      dashboardCompressionLevel: draft.dashboardCompressionLevel,
    },
    execution: {
      visibleTaskLimit: draft.visibleTaskLimit,
      recommendedChallengeLevel: draft.recommendedChallengeLevel,
      workloadCompressionRatio: draft.workloadCompressionRatio,
      pacingRecommendation: draft.pacingRecommendation as PacingRecommendation,
      deepWorkExpectation: draft.deepWorkExpectation,
      recoveryWeighting: draft.recoveryWeighting,
      advancementWeighting: draft.advancementWeighting,
      focusProtectionStrength: draft.focusProtectionStrength,
    },
    guidance: {
      messagingTone: draft.messagingTone as MessagingTone,
      interventionFrequency: draft.interventionFrequency,
      reflectionDepth: draft.reflectionDepth,
      strategicGuidanceWeight: draft.strategicGuidanceWeight,
      emotionalPressureLevel: draft.emotionalPressureLevel,
      clarityOrientation: draft.clarityOrientation,
    },
    adaptationReasoning,
    adaptationIntensity,
    stateMode: ctx.mode,
    stateConfidence: ctx.stateConfidence,
    generatedAt: new Date().toISOString(),
  }

  if (!import.meta.env.PROD && adaptationTrace !== undefined) {
    output.adaptationTrace = adaptationTrace
  }

  return output
}
