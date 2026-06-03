import { useApp } from "@/lib/store";

export function ExecutionHeatmap({ weeks = 4 }: { weeks?: number }) {
  const history = useApp((s) => s.history).slice(-weeks * 7);
  // Pad to fit grid
  const cells: (number | null)[] = [];
  const pad = weeks * 7 - history.length;
  for (let i = 0; i < pad; i++) cells.push(null);
  history.forEach((d) => cells.push(d.executionScore));

  const colorFor = (v: number | null) => {
    if (v == null)
      return "var(--heatmap-empty, color-mix(in oklab, var(--foreground) 6%, transparent))";
    if (v < 40) return "color-mix(in oklab, var(--danger) 55%, transparent)";
    if (v < 55) return "color-mix(in oklab, var(--accent) 28%, transparent)";
    if (v < 70) return "color-mix(in oklab, var(--accent) 52%, transparent)";
    if (v < 85) return "color-mix(in oklab, var(--accent-glow) 72%, transparent)";
    return "color-mix(in oklab, var(--success) 78%, transparent)";
  };

  // 7 rows (days) x weeks columns
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: weeks }).map((_, w) => (
        <div key={w} className="flex flex-1 flex-col gap-1.5">
          {Array.from({ length: 7 }).map((_, d) => {
            const v = cells[w * 7 + d];
            return (
              <div
                key={d}
                title={v != null ? `Score ${v}` : ""}
                className="aspect-square rounded-[5px] transition-colors"
                style={{ background: colorFor(v) }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
