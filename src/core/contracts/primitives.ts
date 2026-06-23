/** Behavioral magnitude normalized 0–100. Validated at engine boundaries. */
export type Scalar = number;

/** Ratio 0–1. Used for coverage, compression, weighting. */
export type Percentage = number;

/** ISO-8601 UTC timestamp. */
export type Timestamp = string;

export type TrendDirection = "RISING" | "STABLE" | "DECLINING";

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type ConfidenceBand = "LOW" | "MEDIUM" | "HIGH";
