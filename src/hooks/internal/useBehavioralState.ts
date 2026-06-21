import { useMemo } from 'react'
import { useApp } from '@/lib/store'
import type { BehavioralPipeline } from '@/core/contracts/pipeline/behavioral-pipeline'
import type { UserMode } from '@/core/contracts/state/modes'
import type { PacingRecommendation } from '@/core/contracts/adaptation/execution'
import type { BehavioralStateView, Band, Tone, Readiness } from './contracts'
import {
  scalarToBand,
  invertBand,
  confidenceBandToPresentation,
  messagingToneToTone,
  modeToneDefault,
  scalarToReadiness,
} from './map'

// ---------------------------------------------------------------------------
// Neutral projections — used when Adaptation Engine (Phase 3) is absent
// ---------------------------------------------------------------------------

const NEUTRAL_PACING: PacingRecommendation = 'MAINTAIN_RHYTHM'

function neutralEnvironment(mode: UserMode): BehavioralStateView['environment'] {
  const deepWorkProtection = mode === 'FOCUSED' || mode === 'EXPANDING'
  // F-06: mode-appropriate density so EXPANDING reaches surfaceLevel 'full'
  const densityMap: Record<UserMode, BehavioralStateView['environment']['density']> = {
    RECOVERY:    'low',
    STABILIZING: 'moderate',
    FOCUSED:     'elevated',
    EXPANDING:   'high',
  }
  return {
    density:              densityMap[mode],
    visualCalm:           'moderate',
    motion:               'moderate',
    deepWorkProtection,
    dashboardCompression: 'moderate',
  }
}

function neutralExecution(mode: UserMode): BehavioralStateView['execution'] {
  const challengeMap: Record<UserMode, Readiness> = {
    RECOVERY:    'not-ready',
    STABILIZING: 'building',
    FOCUSED:     'building',
    EXPANDING:   'ready',
  }
  const recoveryMap: Record<UserMode, Band> = {
    RECOVERY:    'high',
    STABILIZING: 'elevated',
    FOCUSED:     'moderate',
    EXPANDING:   'low',
  }
  return {
    pacing:           NEUTRAL_PACING,
    challenge:        challengeMap[mode],
    recoveryEmphasis: recoveryMap[mode],
  }
}

function neutralGuidance(mode: UserMode): BehavioralStateView['guidance'] {
  const tone: Tone = modeToneDefault(mode)
  const freqMap: Record<UserMode, Band> = {
    RECOVERY:    'high',
    STABILIZING: 'elevated',
    FOCUSED:     'moderate',
    EXPANDING:   'low',
  }
  return {
    tone,
    interventionFrequency: freqMap[mode],
    reflectionDepth:       mode === 'RECOVERY' ? 'elevated' : 'moderate',
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBehavioralState(): BehavioralStateView {
  const pipeline = useApp((s) => s.lastPipelineResult) as BehavioralPipeline | null

  return useMemo((): BehavioralStateView => {
    if (!pipeline) {
      return {
        ready:               false,
        mode:                'STABILIZING',
        trajectory:          'STABLE',
        transitioned:        false,
        interpretation:      { headline: '', supporting: [], confidence: 'low' },
        environment:         neutralEnvironment('STABILIZING'),
        execution:           neutralExecution('STABILIZING'),
        guidance:            neutralGuidance('STABILIZING'),
        adaptationAvailable: false,
      }
    }

    const { stateInterpretation: state, pendingTransition, stateExplanation, adaptationGeneration } = pipeline
    const mode = state.currentMode

    // Interpretation — engine strings pass through verbatim
    const interpretation: BehavioralStateView['interpretation'] = stateExplanation
      ? {
          headline:   stateExplanation.primary.observation,
          supporting: stateExplanation.supporting.map((s) => s.observation),
          confidence: confidenceBandToPresentation(stateExplanation.primary.confidence),
        }
      : {
          headline:   '',
          supporting: [],
          confidence: confidenceBandToPresentation(state.confidence.band),
        }

    // Adaptation — real values or neutral projection
    const adaptationAvailable = !!adaptationGeneration
    const environment: BehavioralStateView['environment'] = adaptationGeneration
      ? {
          density:              scalarToBand(adaptationGeneration.environmental.interfaceDensity),
          visualCalm:           invertBand(scalarToBand(adaptationGeneration.environmental.visualNoiseLevel)),
          motion:               scalarToBand(adaptationGeneration.environmental.motionIntensity),
          deepWorkProtection:   adaptationGeneration.environmental.deepWorkProtectionEnabled,
          dashboardCompression: scalarToBand(adaptationGeneration.environmental.dashboardCompressionLevel),
        }
      : neutralEnvironment(mode)

    const execution: BehavioralStateView['execution'] = adaptationGeneration
      ? {
          pacing:           adaptationGeneration.execution.pacingRecommendation,
          challenge:        scalarToReadiness(adaptationGeneration.execution.recommendedChallengeLevel),
          recoveryEmphasis: scalarToBand(adaptationGeneration.execution.recoveryWeighting * 100),
        }
      : neutralExecution(mode)

    const guidance: BehavioralStateView['guidance'] = adaptationGeneration
      ? {
          tone:                  messagingToneToTone(adaptationGeneration.guidance.messagingTone),
          interventionFrequency: scalarToBand(adaptationGeneration.guidance.interventionFrequency),
          reflectionDepth:       scalarToBand(adaptationGeneration.guidance.reflectionDepth),
        }
      : neutralGuidance(mode)

    return {
      ready:               true,
      mode,
      trajectory:          state.currentTrajectory,
      transitioned:        !!pendingTransition,
      interpretation,
      environment,
      execution,
      guidance,
      adaptationAvailable,
    }
  }, [pipeline])
}
