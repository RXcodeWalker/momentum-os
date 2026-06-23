// Fix-4: AdaptationDirective moved here from interventions/intervention.ts.
// AdaptationDirective is an adaptation-domain concept (a partial hint about adaptation fields).
// interventions/ imports it from here — correct direction: interventions → adaptation.

/** Engine-safe partial adaptation hint produced by the Intervention Engine. */
export type AdaptationDirective = {
  field: string;
  suggestedValue: number | boolean | string;
  reason: string;
};
