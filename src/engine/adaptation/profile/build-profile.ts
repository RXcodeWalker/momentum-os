import type { UserState } from "@/core/contracts/state/user-state";
import type { SignalSnapshot } from "@/core/contracts/signals/signal-snapshot";
import type { InterventionEvaluationResult } from "@/core/contracts/interventions/evaluation";
import type { AdaptationDirective } from "@/core/contracts/adaptation/directives";
import type { AdaptationContext } from "../types/internal";

export function buildContext(
  state: UserState,
  signalSnapshot: SignalSnapshot,
  interventionResult: InterventionEvaluationResult,
): AdaptationContext {
  const directives: AdaptationDirective[] = interventionResult.interventions.flatMap(
    (i) => i.adaptationDirectives,
  );

  return Object.freeze({
    mode: state.currentMode,
    trajectory: state.currentTrajectory,
    burnoutRisk: state.burnoutRisk,
    overloadRisk: state.overloadRisk,
    avoidanceRisk: state.avoidanceRisk,
    collapseRisk: state.collapseRisk,
    adaptationReadiness: state.adaptationReadiness,
    recoveryDebt: state.recoveryDebt,
    cognitiveStrain: state.cognitiveStrain,
    executionStability: state.executionStability,
    emotionalFriction: state.emotionalFriction,
    activeSignalStrengths: signalSnapshot.signalStrengths,
    resolvedDirectives: directives,
    stateConfidence: state.confidence,
  });
}
