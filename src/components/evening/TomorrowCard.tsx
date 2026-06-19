import { Calendar, Target } from 'lucide-react'
import { Card, StatLabel } from '@/components/ui-bits'
import { TapCard } from '@/lib/motion'

interface TomorrowCardProps {
  workloadMessage: string
  workloadGuidance: 'reduce' | 'hold' | 'expand'
  northStar: string | null
  suggestedTasks: { label: string; type: string }[]
  displayMode: 'recovery' | 'stabilizing' | 'focused' | 'expanding'
}

const GUIDANCE_LABELS: Record<string, string> = {
  reduce: 'Lighter load tomorrow',
  hold: "Maintain tomorrow's pace",
  expand: 'Room to push tomorrow',
}

export function TomorrowCard({
  workloadMessage,
  workloadGuidance,
  northStar,
  suggestedTasks,
  displayMode,
}: TomorrowCardProps) {
  const accentClass =
    displayMode === 'recovery'
      ? 'border-warning/20 bg-warning/5'
      : displayMode === 'expanding'
        ? 'border-success/20 bg-success/5'
        : 'border-accent/20 bg-accent/5'

  const iconClass =
    displayMode === 'recovery'
      ? 'bg-warning/15 text-warning'
      : displayMode === 'expanding'
        ? 'bg-success/15 text-success'
        : 'bg-accent/15 text-accent'

  const labelClass =
    displayMode === 'recovery'
      ? 'text-warning'
      : displayMode === 'expanding'
        ? 'text-success'
        : 'text-accent'

  return (
    <TapCard>
      <Card className={accentClass}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${iconClass}`}>
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <StatLabel className={labelClass}>Tomorrow</StatLabel>
            <p className="text-xs text-muted-foreground mt-0.5">
              {GUIDANCE_LABELS[workloadGuidance]}
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-foreground">{workloadMessage}</p>

        {northStar && (
          <div className="mt-3 flex items-start gap-2">
            <Target className={`h-3.5 w-3.5 mt-0.5 flex-none ${labelClass}`} />
            <p className="text-sm font-medium text-foreground">{northStar}</p>
          </div>
        )}

        {suggestedTasks.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Suggested priorities
            </p>
            {suggestedTasks.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                <div className={`h-1.5 w-1.5 rounded-full flex-none ${labelClass.replace('text-', 'bg-')}`} />
                {t.label}
              </div>
            ))}
          </div>
        )}
      </Card>
    </TapCard>
  )
}
