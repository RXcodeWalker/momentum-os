import type { ConfidenceBand } from "../primitives";
import type { PatternExplanationCode } from "./template";

export type PatternHedge = "TENTATIVE" | "OBSERVED" | "CONSISTENT";

/**
 * Observational statement about a detected behavioral pattern.
 * Trust contract — identical constraints as StateExplanation, plus:
 *   - probabilistic ("tends to", "often", "in N of M such days")
 *   - non-diagnostic (no medical or psychological labels)
 *   - non-blaming (no performance judgements)
 *   - formula-free (no weights, scores, or coefficients)
 *   - NON-CAUSAL: association verbs only ("precedes", "coincides with",
 *     "tends to follow"). Forbidden: "causes", "because", "makes you".
 */
export type PatternExplanation = {
  code: PatternExplanationCode;
  observation: string;
  hedge: PatternHedge;
  basis: string;
  confidence: ConfidenceBand;
};
