export type AdaptationLayer =
  | "baseline"
  | "trajectory"
  | "expansion"
  | "risk"
  | "signal"
  | "directive";

export type AdaptationTraceEntry = {
  field: string;
  previousValue: number | boolean | string;
  newValue: number | boolean | string;
  layer: AdaptationLayer;
  reason?: string;
};

export type AdaptationTrace = {
  entries: AdaptationTraceEntry[];
  layerSummary: Record<AdaptationLayer, number>;
  generatedAt: string;
};
