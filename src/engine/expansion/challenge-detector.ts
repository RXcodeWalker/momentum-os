import type { UserMode, UserTrajectory } from '@/core/contracts/state/modes'
import type { ChallengeBaseline } from '@/core/contracts/expansion'

const MODE_CHALLENGE_BASELINES: Record<UserMode, number> = {
  RECOVERY: 10,
  STABILIZING: 30,
  FOCUSED: 60,
  EXPANDING: 80,
}

// Only EXPANDING trajectory adjusts challenge level (+10); mirrors trajectory-modulator config
const TRAJECTORY_CHALLENGE_ADJUSTMENTS: Record<UserTrajectory, number> = {
  CONTRACTING: 0,
  FRAGILE: 0,
  STABLE: 0,
  EXPANDING: 10,
}

export function detectChallengeBaseline(
  mode: UserMode,
  trajectory: UserTrajectory,
): ChallengeBaseline {
  const modeBaseline = MODE_CHALLENGE_BASELINES[mode]
  const trajectoryAdjustment = TRAJECTORY_CHALLENGE_ADJUSTMENTS[trajectory]
  return {
    modeBaseline,
    trajectoryAdjustment,
    currentLevel: modeBaseline + trajectoryAdjustment,
  }
}
