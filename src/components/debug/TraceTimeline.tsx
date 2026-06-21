import type { AdaptationTrace, AdaptationLayer } from '@/core/contracts/adaptation/trace'

const LAYER_COLORS: Record<AdaptationLayer, string> = {
  baseline: 'bg-neutral-500 text-white',
  trajectory: 'bg-blue-500 text-white',
  risk: 'bg-amber-500 text-black',
  signal: 'bg-purple-500 text-white',
  directive: 'bg-red-500 text-white',
}

type Props = {
  trace: AdaptationTrace
}

export function TraceTimeline({ trace }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 text-[10px] pb-2 border-b border-border">
        {(Object.entries(trace.layerSummary) as [AdaptationLayer, number][]).map(([layer, count]) => (
          <span key={layer} className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${LAYER_COLORS[layer]}`}>
            {layer}: {count}
          </span>
        ))}
      </div>
      <div className="max-h-48 overflow-y-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left pb-1 pr-2">field</th>
              <th className="text-right pb-1 pr-2">prev</th>
              <th className="text-right pb-1 pr-2">new</th>
              <th className="text-left pb-1">layer</th>
            </tr>
          </thead>
          <tbody>
            {trace.entries.map((entry, i) => (
              <tr key={i} className="border-t border-border/30">
                <td className="py-0.5 pr-2 text-foreground truncate max-w-[120px]" title={entry.field}>
                  {entry.field.split('.').pop()}
                </td>
                <td className="py-0.5 pr-2 text-right text-muted-foreground">
                  {String(entry.previousValue).slice(0, 8)}
                </td>
                <td className="py-0.5 pr-2 text-right text-foreground font-medium">
                  {String(entry.newValue).slice(0, 8)}
                </td>
                <td className="py-0.5">
                  <span className={`px-1 py-0.5 rounded text-[9px] ${LAYER_COLORS[entry.layer]}`}>
                    {entry.layer}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
