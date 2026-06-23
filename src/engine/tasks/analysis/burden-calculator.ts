import type { Task } from "@/core/contracts/tasks/task";
import type { RecoveryBurden } from "@/core/contracts/tasks/scores";
import { weightedAverage } from "@/engine/shared";
import { BURDEN_WEIGHTS } from "../config";
import { clampScalar } from "./types";

// ---------------------------------------------------------------------------
// Recovery burden — task attributes only, no UserState
// ---------------------------------------------------------------------------

export function computeRecoveryBurden(task: Task): RecoveryBurden {
  const cognitiveBurden = clampScalar(task.cognitiveLoad);
  const depletionBurden = clampScalar(task.recoveryCost);
  const fragmentationBurden = clampScalar(task.fragmentationRisk);

  const totalBurdenScore = clampScalar(
    weightedAverage(
      [cognitiveBurden, depletionBurden, fragmentationBurden],
      [BURDEN_WEIGHTS.cognitive, BURDEN_WEIGHTS.depletion, BURDEN_WEIGHTS.fragmentation],
    ),
  );

  return { cognitiveBurden, depletionBurden, fragmentationBurden, totalBurdenScore };
}
