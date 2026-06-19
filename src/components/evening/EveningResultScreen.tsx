import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Users, Zap, Lightbulb, Flame } from 'lucide-react'
import { Card, Pill, ScreenHeader, StatLabel } from '@/components/ui-bits'
import { Stagger, StaggerItem } from '@/lib/motion'
import { useApp } from '@/lib/store'
import { useEveningReflection } from '@/hooks/internal/useEveningReflection'
import { LearningCard } from './LearningCard'
import { ScoreContextCard } from './ScoreContextCard'
import { TomorrowCard } from './TomorrowCard'

interface EveningResultScreenProps {
  unlockedInsight?: string
}

const DISPLAY_HEADERS: Record<string, { title: string; subtitle: string }> = {
  recovery: {
    title: 'Day closed.',
    subtitle: 'Rest is part of the system working.',
  },
  stabilizing: {
    title: 'Day logged.',
    subtitle: 'Consistency compounds — keep showing up.',
  },
  focused: {
    title: 'Strong close.',
    subtitle: 'The pattern is holding.',
  },
  expanding: {
    title: 'Excellent execution.',
    subtitle: 'Conditions are right — keep pressing.',
  },
}

export function EveningResultScreen({ unlockedInsight }: EveningResultScreenProps) {
  const nav = useNavigate()
  const currentUserId = useApp((s) => s.currentUserId)
  const addProof = useApp((s) => s.addProof)
  const [sharedProof, setSharedProof] = useState(false)

  const view = useEveningReflection()

  const { displayMode, score, delta, observations, hasObservations, stateHeadline,
    attribution, northStar, workloadGuidance, workloadMessage, suggestedTasks,
    recoveryMessage, streakContext } = view

  const header = DISPLAY_HEADERS[displayMode]

  const primaryLearning = hasObservations
    ? observations[0].text
    : stateHeadline

  const secondObservation = hasObservations && observations.length > 1
    ? observations[1].text
    : null

  const handleShareProof = () => {
    addProof({
      memberId: currentUserId,
      text: `Completed evening check-in · Execution: ${score}% · Signal: ${displayMode}.`,
      type: score >= 70 ? 'milestone' : 'completion',
    })
    setSharedProof(true)
  }

  if (displayMode === 'recovery') {
    return (
      <div className="flex flex-col gap-5 pb-10">
        <ScreenHeader eyebrow="Check-in saved" title={header.title} subtitle={header.subtitle} />
        <Stagger className="flex flex-col gap-4 px-5">
          <StaggerItem>
            <LearningCard observation={primaryLearning} isObservation={hasObservations} />
          </StaggerItem>
          <StaggerItem>
            <TomorrowCard
              workloadMessage={workloadMessage}
              workloadGuidance={workloadGuidance}
              northStar={northStar}
              suggestedTasks={suggestedTasks}
              displayMode={displayMode}
            />
          </StaggerItem>
          <StaggerItem>
            <div className="opacity-40">
              <ScoreContextCard score={score} delta={delta} attribution={[]} ringSize="small" />
            </div>
          </StaggerItem>
          <StaggerItem>
            <button
              onClick={() => nav({ to: '/' })}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
            >
              Done for today
            </button>
          </StaggerItem>
        </Stagger>
      </div>
    )
  }

  const scoreRows = displayMode === 'stabilizing' ? 1 : attribution.length
  const ringSize = displayMode === 'stabilizing' ? 'small' : displayMode === 'focused' ? 'medium' : 'full'

  return (
    <div className="flex flex-col gap-5 pb-10">
      <ScreenHeader
        eyebrow="Check-in saved"
        title={header.title}
        subtitle={header.subtitle}
        right={recoveryMessage ? <Pill tone="warning">Recovery</Pill> : undefined}
      />

      <Stagger className="flex flex-col gap-4 px-5">
        {/* 1. Learning card — always first */}
        {primaryLearning && (
          <StaggerItem>
            <LearningCard observation={primaryLearning} isObservation={hasObservations} />
          </StaggerItem>
        )}

        {/* 2. Score ring + delta + attribution */}
        <StaggerItem>
          <ScoreContextCard
            score={score}
            delta={delta}
            attribution={attribution}
            maxRows={scoreRows}
            ringSize={ringSize}
          />
        </StaggerItem>

        {/* 3. Second observation (FOCUSED and EXPANDING) */}
        {secondObservation && displayMode !== 'stabilizing' && (
          <StaggerItem>
            <LearningCard observation={secondObservation} isObservation />
          </StaggerItem>
        )}

        {/* Insight unlock */}
        {unlockedInsight && (
          <StaggerItem>
            <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/30 hairline">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/20 text-accent">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-accent font-medium mb-1">
                    New insight unlocked
                  </p>
                  <p className="font-display text-base leading-snug text-foreground">
                    "{unlockedInsight}"
                  </p>
                </div>
              </div>
            </Card>
          </StaggerItem>
        )}

        {/* 4. Tomorrow card */}
        <StaggerItem>
          <TomorrowCard
            workloadMessage={workloadMessage}
            workloadGuidance={workloadGuidance}
            northStar={northStar}
            suggestedTasks={suggestedTasks}
            displayMode={displayMode}
          />
        </StaggerItem>

        {/* 5. Streak milestone (FOCUSED and EXPANDING) */}
        {streakContext && streakContext.milestone && displayMode !== 'stabilizing' && (
          <StaggerItem>
            <Card className="border-success/20 bg-success/5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-success/15 text-success">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <StatLabel className="text-success">Streak</StatLabel>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {streakContext.milestone}
                  </p>
                </div>
              </div>
            </Card>
          </StaggerItem>
        )}

        {/* Actions */}
        <StaggerItem>
          <div className="space-y-2">
            {!sharedProof && (
              <button
                onClick={handleShareProof}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                <Users className="h-4 w-4" /> Share proof to Circle
              </button>
            )}
            <button
              onClick={() => nav({ to: '/' })}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
            >
              <Zap className="h-4 w-4" /> Done for today
            </button>
          </div>
        </StaggerItem>
      </Stagger>
    </div>
  )
}
