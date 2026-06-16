import type { InterventionEvaluationInput, InterventionEvaluationResult } from '@/core/contracts/interventions/evaluation'
import type { Intervention } from '@/core/contracts/interventions/intervention'
import { INTERVENTION_TRIGGERS, COOLDOWN_DEFAULTS, ADAPTATION_BLUEPRINTS, INTERVENTION_MATRIX_VERSION } from './matrix/intervention-matrix-v1'
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
// Factory for empty results — never return a shared mutable object.
// ---------------------------------------------------------------------------

function emptyResult(
  notes: string[] = [],
  restraint = false,
  candidatesFound = 0,
): InterventionEvaluationResult {
  return {
    interventions: [],
    evaluationNotes: notes,
    restraintApplied: restraint,
    candidatesFound,
    engineVersion: INTERVENTION_MATRIX_VERSION,
  }
}

export function evaluateInterventions(
  input: InterventionEvaluationInput,
): InterventionEvaluationResult {
  // Capture time once — all stages use this reference for determinism.
  const nowMs = Date.now()

  const { state, signalSnapshot, sequencing, context } = input
  const { recentInterventions, activeReentryProtocol } = context

  // Stage 1 — Candidates
  const candidates = buildCandidates(INTERVENTION_TRIGGERS, signalSnapshot)
  if (candidates.length === 0) return emptyResult()

  // Stage 2 — Eligibility
  const assessments = assessEligibility(candidates, state, sequencing)
  const eligibleCandidates = filterEligible(candidates, assessments)
  if (eligibleCandidates.length === 0) {
    return emptyResult(['all candidates failed eligibility gates'], true, candidates.length)
  }

  // Stage 3 — Cooldown
  const cooldownVerdicts = evaluateCooldown(eligibleCandidates, recentInterventions, nowMs)
  const postCooldown = filterCooldownBlocked(eligibleCandidates, cooldownVerdicts)
  const cooldownBlocked = eligibleCandidates.length > postCooldown.length

  if (postCooldown.length === 0) {
    return emptyResult(
      buildEvaluationNotes([], cooldownVerdicts, []),
      true,
      candidates.length,
    )
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
    nowMs,
  )
  const surviving = filterSuppressed(suppressionResults)
  const hardVerdicts = suppressionResults.map(s => s.hardVerdict)
  const suppressionApplied = surviving.length < postCooldown.length

  if (surviving.length === 0) {
    return emptyResult(
      buildEvaluationNotes(hardVerdicts, cooldownVerdicts, []),
      true,
      candidates.length,
    )
  }

  // Stage 5 — Priority
  const priority = resolvePriority(surviving)
  if (!priority.winner) {
    return emptyResult(
      buildEvaluationNotes(hardVerdicts, cooldownVerdicts, priority.suppressed),
      true,
      candidates.length,
    )
  }

  // Stage 6 — Level
  const winnerCombined = surviving.find(s => s.candidate.type === priority.winner)!
  const winnerAssessment = assessments.find(a => a.candidateType === priority.winner)!
  const level = resolveLevel(priority.winner, winnerCombined, winnerAssessment, state)
  const restraintApplied = cooldownBlocked || suppressionApplied || level < winnerAssessment.maxAllowedLevel

  // Stage 7 — Adaptation directives (from matrix blueprint — no type-switch here)
  const adaptationDirectives = ADAPTATION_BLUEPRINTS[priority.winner](level)

  // Stage 8 — Reasoning
  const triggerReasoning = buildTriggerReasoning(winnerCombined.candidate, priority.suppressed)
  const goals = getGoals(priority.winner)
  const evaluationNotes = buildEvaluationNotes(hardVerdicts, cooldownVerdicts, priority.suppressed)

  // Stage 9 — Assemble
  const intervention: Intervention = {
    id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `intervention-${nowMs}`,
    type: priority.winner,
    level,
    triggerReasoning,
    emotionalGoal: goals.emotional,
    behavioralObjective: goals.behavioral,
    interventionMessage: level >= 1 ? triggerReasoning[0] : undefined,
    adaptationDirectives,
    suppressionEligible: level >= 1,
    cooldownDurationHours: COOLDOWN_DEFAULTS[priority.winner],
    generatedAt: new Date(nowMs).toISOString(),
  }

  return {
    interventions: [intervention],
    evaluationNotes,
    restraintApplied,
    candidatesFound: candidates.length,
    engineVersion: INTERVENTION_MATRIX_VERSION,
  }
}
