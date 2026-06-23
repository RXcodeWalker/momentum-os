import type { SafetyConstraint } from "@/core/contracts/expansion";
import type { StateDynamics, StateDynamicsProfile } from "@/core/contracts/state/dynamics";

export type SafetyGateInput = {
  stateDynamics: StateDynamics;
  dynamicsProfile: StateDynamicsProfile;
  avoidancePressure: number;
  recoveryMode: boolean;
  streakAtRisk: boolean;
  recoveryDebtAccumulating: boolean;
};

export function evaluateSafetyGates(input: SafetyGateInput): SafetyConstraint[] {
  const {
    stateDynamics,
    dynamicsProfile,
    avoidancePressure,
    recoveryMode,
    streakAtRisk,
    recoveryDebtAccumulating,
  } = input;

  const hotspotTriggered = dynamicsProfile.instabilityHotspots.some(
    (h) => h.predecessorState === stateDynamics.currentPeriod && h.riskSignal === "high",
  );

  return [
    {
      id: "VOLATILITY_GATE",
      triggered: stateDynamics.volatility.score > 65,
      severity: "blocking",
      description: `Volatility score ${stateDynamics.volatility.score.toFixed(1)} exceeds threshold of 65`,
    },
    {
      id: "RECOVERY_DEBT_GATE",
      triggered: recoveryDebtAccumulating,
      severity: "blocking",
      description: "Recovery debt is accumulating — reported capacity is overstated",
    },
    {
      id: "AVOIDANCE_GATE",
      triggered: avoidancePressure >= 65,
      severity: "blocking",
      description: `Avoidance pressure ${avoidancePressure} (≥65) masks true execution capacity`,
    },
    {
      id: "OSCILLATION_GATE",
      triggered: stateDynamics.oscillation.isOscillating,
      severity: "blocking",
      description:
        "Behavioral oscillation detected — expansion would be premature and destabilizing",
    },
    {
      id: "RECOVERY_MODE_GATE",
      triggered: recoveryMode,
      severity: "blocking",
      description: "Active recovery mode — challenge expansion suspended until exit",
    },
    {
      id: "HOTSPOT_RISK",
      triggered: hotspotTriggered,
      severity: "dampening",
      description: `Current state is a high-risk instability predecessor — expansion pace dampened`,
    },
    {
      id: "STREAK_FRAGILITY_GATE",
      triggered: streakAtRisk,
      severity: "dampening",
      description: "Execution streak is at risk — pace dampened to protect streak continuity",
    },
  ];
}

export function hasBlockingGate(constraints: SafetyConstraint[]): boolean {
  return constraints.some((c) => c.triggered && c.severity === "blocking");
}
