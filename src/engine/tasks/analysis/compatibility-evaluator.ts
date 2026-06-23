import type { UserState } from "@/core/contracts/state/user-state";
import type { StateDimensions } from "@/core/contracts/state/dimensions";
import type { StateDynamicsProfile } from "@/core/contracts/state/dynamics";
import type { Task } from "@/core/contracts/tasks/task";
import { computeRecoveryBurden } from "./burden-calculator";
import { clampScalar, type CompatibilityAssessment } from "./types";
import {
  evaluateRecoveryCompatibility,
  tierToCompatibilityBand,
} from "./recovery-compatibility-engine";

// ---------------------------------------------------------------------------
// Compatibility assessment — dynamic tier evaluation via recovery-compatibility engine
// ---------------------------------------------------------------------------

export type { CompatibilityAssessment } from "./types";

export function evaluateCompatibility(
  task: Task,
  state: UserState,
  dynamicsProfile: StateDynamicsProfile,
  stateDimensions?: StateDimensions,
): CompatibilityAssessment {
  const rcResult = evaluateRecoveryCompatibility({
    task,
    userState: state,
    dynamicsProfile,
    stateDimensions,
  });

  const band = tierToCompatibilityBand(rcResult.tier);
  const burden = computeRecoveryBurden(task);
  const capacity = Math.max(state.recoveryCapacity, 1);
  const burdenRelativeToCapacity = clampScalar((burden.totalBurdenScore / capacity) * 100);

  return {
    taskId: task.id,
    mode: state.currentMode,
    band,
    burdenRelativeToCapacity,
    modeAppropriate: band !== "HARMFUL",
    recoveryCompatibility: rcResult,
  };
}
