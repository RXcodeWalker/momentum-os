import { randomUUID } from 'crypto'
import type { InterventionEvaluationInput, InterventionEvaluationResult } from '@/core/contracts/interventions/evaluation'
import type { Intervention } from '@/core/contracts/interventions/intervention'
import type { AdaptationDirective } from '@/core/contracts/adaptation/directives'
import type { ActiveInterventionType } from '@/core/contracts/interventions/types'
import { INTERVENTION_TRIGGERS, COOLDOWN_DEFAULTS } from './matrix/intervention-matrix-v1'
import { buildCandidates } from './candidates/build-candidates'
import { assessEligibility, filterEligible } from './eligibility/assess-eligibility'
import { evaluateCooldown, filterCooldownBlocked } from './cooldown/evaluate-cooldown'
import { evaluateSuppression, filterSuppressed } from './suppression/evaluate-suppression'
import { resolvePriority } from './priority/resolve-priority'
import { resolveLevel } from './escalation/resolve-level'
import {
  buildTriggerReasoning,
  buildEvaluationNotes,
  getGoals,
} from './explainability/build-reasoning'

// ---------------------------------------------------------------------------
// Stage 9 — Assemble InterventionEvaluationResult
// ---------------------------------------------------------------------------

function buildAdaptationDirectives(
  type: ActiveInterventionType,
  level: number,
): AdaptationDirective[] {
  const directives: AdaptationDirective[] = []

  if (type === 'OVERLOAD' || type === 'BURNOUT_PREVENTION') {
    directives.push({
      field: 'execution.workloadCompressionRatio',
      suggestedValue: level >= 2 ? 0.5 : 0.7,
      reason: 'reduce visible load to match sustainable capacity',
    })
    directives.push({
      field: 'environmental.interfaceDensity',
      suggestedValue: level >= 2 ? 30 : 50,
      reason: 'calm interface density during overload',
    })
  }

  if (type === 'AVOIDANCE_INTERRUPTION') {
    directives.push({
      field: 'guidance.emotionalPressureLevel',
      suggestedValue: 10,
      reason: 'reduce pressure — avoidance amplifies under pressure',
    })
    directives.push({
      field: 'execution.visibleTaskLimit',
      suggestedValue: 1,
      reason: 'surface one task to reduce choice paralysis',
    })
  }

  if (type === 'FRAGMENTATION_REDUCTION') {
    directives.push({
      field: 'execution.focusProtectionStrength',
      suggestedValue: 80,
      reason: 'protect continuity windows from fragmentation',
    })
  }

  if (type === 'DEEP_WORK_PROTECTION') {
    directives.push({
      field: 'environmental.deepWorkProtectionEnabled',
      suggestedValue: true,
      reason: 'enable deep work protection mode',
    })
  }

  if (type === 'RECOVERY_ENFORCEMENT') {
    directives.push({
      field: 'execution.recoveryWeighting',
      suggestedValue: 0.8,
      reason: 'prioritize recovery-compatible tasks',
    })
  }

  return directives
}

const EMPTY_RESULT: InterventionEvaluationResult = {
  interventions: [],
  evaluationNotes: [],
  restraintApplied: false,
}

export function evaluateInterventions(
  input: InterventionEvaluationInput,
): InterventionEvaluationResult {
  const { state, signalSnapshot, sequencing, context } = input
  const { recentInterventions, activeReentryProtocol, flowPhase } = context

  // Stage 1 — Candidates
  const candidates = buildCandidates(INTERVENTION_TRIGGERS, signalSnapshot)
  if (candidates.length === 0) return EMPTY_RESULT

  // Stage 2 — Eligibility
  const assessments = assessEligibility(candidates, state, sequencing)
  const eligibleCandidates = filterEligible(candidates, assessments)
  if (eligibleCandidates.length === 0) {
    return {
      ...EMPTY_RESULT,
      evaluationNotes: ['all candidates failed eligibility gates'],
      restraintApplied: true,
    }
  }

  // Stage 3 — Cooldown
  const cooldownVerdicts = evaluateCooldown(eligibleCandidates, recentInterventions)
  const postCooldown = filterCooldownBlocked(eligibleCandidates, cooldownVerdicts)
  const cooldownBlocked = eligibleCandidates.length > postCooldown.length

  if (postCooldown.length === 0) {
    return {
      ...EMPTY_RESULT,
      evaluationNotes: buildEvaluationNotes([], cooldownVerdicts, []),
      restraintApplied: true,
    }
  }

  // Stage 4 — Suppression
  const suppressionResults = evaluateSuppression(
    postCooldown,
    assessments,
    state,
    signalSnapshot,
    sequencing,
    recentInterventions,
    activeReentryProtocol,
  )
  const surviving = filterSuppressed(suppressionResults)
  const hardVerdicts = suppressionResults.map(s => s.hardVerdict)
  const suppressionApplied = surviving.length < postCooldown.length

  if (surviving.length === 0) {
    return {
      ...EMPTY_RESULT,
      evaluationNotes: buildEvaluationNotes(hardVerdicts, cooldownVerdicts, []),
      restraintApplied: true,
    }
  }

  // Stage 5 — Priority
  const priority = resolvePriority(surviving)
  if (!priority.winner) {
    return {
      ...EMPTY_RESULT,
      evaluationNotes: buildEvaluationNotes(hardVerdicts, cooldownVerdicts, priority.suppressed),
      restraintApplied: true,
    }
  }

  // Stage 6 — Level
  const winnerCombined = surviving.find(s => s.candidate.type === priority.winner)!
  const winnerAssessment = assessments.find(a => a.candidateType === priority.winner)!
  const level = resolveLevel(priority.winner, winnerCombined, winnerAssessment, state)
  const restraintApplied = cooldownBlocked || suppressionApplied || level < winnerAssessment.maxAllowedLevel

  // Stage 7 — Adaptation directives
  const adaptationDirectives = buildAdaptationDirectives(priority.winner, level)

  // Stage 8 — Reasoning
  const triggerReasoning = buildTriggerReasoning(winnerCombined.candidate, priority.suppressed)
  const goals = getGoals(priority.winner)
  const evaluationNotes = buildEvaluationNotes(hardVerdicts, cooldownVerdicts, priority.suppressed)

  // Stage 9 — Assemble
  const intervention: Intervention = {
    id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `intervention-${Date.now()}`,
    type: priority.winner,
    level,
    triggerReasoning,
    emotionalGoal: goals.emotional,
    behavioralObjective: goals.behavioral,
    interventionMessage: level >= 1 ? triggerReasoning[0] : undefined,
    adaptationDirectives,
    suppressionEligible: level >= 1,
    cooldownDurationHours: COOLDOWN_DEFAULTS[priority.winner],
    generatedAt: new Date().toISOString(),
  }

  return {
    interventions: [intervention],
    evaluationNotes,
    restraintApplied,
  }
}
