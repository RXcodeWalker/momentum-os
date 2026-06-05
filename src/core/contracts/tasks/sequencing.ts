// Fix-5: Full Task objects replaced with taskId string references.
// Downstream engines (Intervention, Adaptation, Flow) receive task IDs only —
// they do not receive raw task intelligence fields (emotionalResistance, ambiguity, etc.).
// The domain/orchestration layer resolves IDs back to full Task objects for UI rendering.

import type { Scalar } from '../primitives'

export type SequencingDecision = {
  recommendedPrimaryTaskId?: string
  recommendedSecondaryTaskId?: string
  suppressedTaskIds: string[]
  compressedTaskIds: string[]
  sequencingReasoning: string[]
  expectedRecoveryImpact: Scalar
  expectedMomentumImpact: Scalar
  recommendedFocusWindow?: number
  sequencingConfidence: Scalar
  // NOTE: No Task imports — engine boundary enforced at contract level.
}

