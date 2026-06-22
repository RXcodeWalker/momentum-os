export type PatternObservation = {
  date: string;
  antecedentPresent: boolean;
  consequentPresent: boolean;
  magnitude: number | null;
};

export type PatternEvidence = {
  supportingCount: number;
  contradictingCount: number;
  antecedentOccurrences: number;
  totalObservations: number;
  recurrenceSpread: number;
  observations: PatternObservation[];
  lastConfirmationDate: string | null;
  lastContradictionDate: string | null;
};
