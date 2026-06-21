import { motion, AnimatePresence } from 'framer-motion'
import { Card, StatLabel } from '@/components/ui-bits'
import { useApp } from '@/lib/store'
import type { BehavioralInterventionsView } from '@/hooks/internal/contracts'

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

type Props = {
  surface: BehavioralInterventionsView['ui']['surface']
  // Priority-tier resolution must happen at the call site; component displays exactly one intervention.
  intervention: BehavioralInterventionsView['active'][number] | undefined
}

export function InterventionSurface({ surface, intervention: primary }: Props) {
  const acknowledgedInterventions = useApp((s) => s.acknowledgedInterventions)
  const acknowledgeIntervention = useApp((s) => s.acknowledgeIntervention)
  const isAcknowledged = primary
    ? acknowledgedInterventions.some(
        (r) =>
          r.type === primary.type &&
          Date.now() - new Date(r.acknowledgedAt).getTime() < TWENTY_FOUR_HOURS_MS,
      )
    : false

  return (
    <AnimatePresence mode="wait">
      {surface === 'inline' && primary && (
        <motion.div
          key="inline"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className="border-l-2 border-amber-500/40 pl-3 py-1"
        >
          <StatLabel>{primary.message}</StatLabel>
        </motion.div>
      )}

      {surface === 'banner' && primary && (
        <motion.div
          key="banner"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="border-amber-500/30 bg-amber-950/20">
            <p className="text-sm font-medium text-foreground leading-snug">{primary.message}</p>
            {primary.intent && (
              <p className="mt-1 text-xs text-muted-foreground">{primary.intent}</p>
            )}
          </Card>
        </motion.div>
      )}

      {surface === 'modal' && primary && !isAcknowledged && (
        <motion.div
          key="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="max-w-sm border-amber-500/30 bg-card">
              <p className="text-base font-semibold text-foreground leading-snug mb-2">
                {primary.message}
              </p>
              {primary.intent && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {primary.intent}
                </p>
              )}
              <button
                onClick={() => acknowledgeIntervention(primary.type)}
                className="w-full rounded-2xl bg-foreground py-3 text-sm font-bold text-background"
              >
                Got it
              </button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
