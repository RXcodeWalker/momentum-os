import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, Ring, StatLabel } from '@/components/ui-bits'
import { TapCard } from '@/lib/motion'

interface AttributionRow {
  label: string
  value: string
  baseline: string
  direction: 'drag' | 'boost' | 'neutral'
}

interface ScoreContextCardProps {
  score: number
  delta: number
  attribution: AttributionRow[]
  maxRows?: number
  ringSize?: 'small' | 'medium' | 'full'
}

export function ScoreContextCard({
  score,
  delta,
  attribution,
  maxRows = 2,
  ringSize = 'medium',
}: ScoreContextCardProps) {
  const isRecovery = score < 45
  const ringOpacity = isRecovery ? 'opacity-40' : 'opacity-100'

  return (
    <TapCard>
      <Card>
        <div className={`flex items-center gap-5 ${ringOpacity} transition-opacity`}>
          <Ring value={score} label="Execution" sub="Today" />
          <div className="flex-1">
            <StatLabel>Change vs yesterday</StatLabel>
            <p
              className={`font-display mt-1 text-3xl num-tabular ${delta >= 0 ? 'text-success' : 'text-danger'}`}
            >
              {delta >= 0 ? '+' : ''}{delta}
            </p>
          </div>
        </div>

        {attribution.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-border/40 pt-3">
            <StatLabel className="text-muted-foreground/70">vs your baseline</StatLabel>
            {attribution.slice(0, maxRows).map((row, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground/60">{row.baseline}</span>
                  <span
                    className={`font-semibold flex items-center gap-0.5 ${
                      row.direction === 'boost' ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {row.direction === 'boost' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}{' '}
                    {row.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </TapCard>
  )
}
