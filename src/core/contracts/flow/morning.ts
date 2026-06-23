import type { Scalar } from "../primitives";
import type { UserState } from "../state/user-state";
import type { Task } from "../tasks/task";
import type { AdaptationOutput } from "../adaptation/output";
import type { Intervention } from "../interventions/intervention";

export type MorningCalibrationOutput = {
  interpretedState: UserState;
  recommendedPrimaryFocus?: Task;
  recommendedSecondaryFocus?: Task;
  orientationMessage: string;
  workloadRecommendation: Scalar;
  adaptationOutput: AdaptationOutput;
  intervention?: Intervention;
};
