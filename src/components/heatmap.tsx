import { useApp } from "@/lib/store";

export function ExecutionHeatmap({ weeks = 4 }: { weeks?: number }) {
  const history = useApp((s) => s.history).slice(-weeks * 7);
  // Pad to fit grid
  const cells: (number | null)[] = [];
  const pad = weeks * 7 - history.length;
  for (let i = 0; i < pad; i++) cells.push(null);
  history.forEach((d) => cells.push(d.executionScore));

  const colorFor = (v: number | null) => {
    if (v == null) return "oklch(1 0 0 / 0.04)";
    if (v < 40) return "oklch(0.68 0.18 25 / 0.55)";
    if (v < 55) return "oklch(0.78 0.14 75 / 0.30)";
    if (v < 70) return "oklch(0.78 0.14 75 / 0.55)";
    if (v < 85) return "oklch(0.85 0.16 80 / 0.75)";
    return "oklch(0.78 0.14 155 / 0.80)";
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
