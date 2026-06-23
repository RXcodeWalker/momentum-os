import type { SequencingDecision } from "@/core/contracts/tasks/sequencing";

/**
 * Returns true when task sequencing has already applied enough load reduction
 * that an additional intervention would be redundant.
 *
 * Rule: ≥50% of the combined suppressed+compressed task pool is suppressed.
 * This is intentionally stricter than the eligibility Gate 3 (which also requires
 * high expectedRecoveryImpact). The soft rule downgrades to level 0 instead of
 * eliminating, so a slightly lower bar is appropriate here.
 */
export function sequencingIsSaturated(sequencing: SequencingDecision): boolean {
  const suppressed = sequencing.suppressedTaskIds.length;
  const compressed = sequencing.compressedTaskIds.length;
  const total = suppressed + compressed;
  if (total === 0) return false;
  return suppressed / total >= 0.5;
}
