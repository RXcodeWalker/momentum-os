import type {
  AdaptationLayer,
  AdaptationTrace,
  AdaptationTraceEntry,
} from "@/core/contracts/adaptation/trace";

export interface TraceRecorder {
  record(
    field: string,
    previousValue: number | boolean | string,
    newValue: number | boolean | string,
    layer: AdaptationLayer,
    reason?: string,
  ): void;
  flush(): AdaptationTrace | undefined;
}

class DevTraceRecorder implements TraceRecorder {
  private entries: AdaptationTraceEntry[] = [];

  record(
    field: string,
    previousValue: number | boolean | string,
    newValue: number | boolean | string,
    layer: AdaptationLayer,
    reason?: string,
  ): void {
    if (previousValue === newValue) return;
    this.entries.push({ field, previousValue, newValue, layer, reason });
  }

  flush(): AdaptationTrace {
    const layerSummary: Record<AdaptationLayer, number> = {
      baseline: 0,
      trajectory: 0,
      expansion: 0,
      risk: 0,
      signal: 0,
      directive: 0,
    };
    for (const e of this.entries) {
      layerSummary[e.layer]++;
    }
    return {
      entries: this.entries,
      layerSummary,
      generatedAt: new Date().toISOString(),
    };
  }
}

const NOOP_RECORDER: TraceRecorder = {
  record: () => {},
  flush: () => undefined,
};

export function createTraceRecorder(): TraceRecorder {
  if (import.meta.env.PROD) return NOOP_RECORDER;
  return new DevTraceRecorder();
}
