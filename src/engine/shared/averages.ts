import type { Scalar } from "@/core/contracts/primitives";

/** Simple rolling mean; early positions use all available prior values. */
export function movingAverage(values: number[], windowSize: number): number[] {
  if (values.length === 0 || windowSize <= 0) return [];

  return values.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const window = values.slice(start, index + 1);
    return window.reduce((sum, value) => sum + value, 0) / window.length;
  });
}

/** Weighted mean; returns 0 when weights sum to zero or arrays are empty. */
export function weightedAverage(values: number[], weights: number[]): Scalar {
  if (values.length === 0 || values.length !== weights.length) return 0;

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = values.reduce((sum, value, index) => sum + value * weights[index], 0);
  return weightedSum / totalWeight;
}
