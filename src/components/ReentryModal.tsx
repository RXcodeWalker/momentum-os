import { motion, AnimatePresence } from "framer-motion";
import { StatLabel } from "@/components/ui-bits";
import { X } from "lucide-react";
import type { MomentumMemory } from "@/lib/reentry";
import type { Task } from "@/lib/store";

interface ReentryModalProps {
  gapDays: number;
  momentum: MomentumMemory | null;
  primaryTask: Pick<Task, "label" | "estMin"> | null;
  onAcknowledge: () => void;
  onRecovery: () => void;
}

export function ReentryModal({
  gapDays,
  momentum,
  primaryTask,
  onAcknowledge,
  onRecovery,
}: ReentryModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-5"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md rounded-3xl bg-card border border-warning/20 shadow-2xl p-8 space-y-6"
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-warning/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-warning">
              Welcome back — really
            </span>
          </div>

          {/* Headline */}
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground leading-tight">
              Absence is part of the rhythm.
            </h2>
          </div>

          {/* Momentum Memory — primary anchor */}
          {momentum && (
            <div className="space-y-1">
              <StatLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Where you left off
              </StatLabel>
              <p className="border-l-2 border-warning/50 pl-4 text-base font-medium text-foreground leading-relaxed">
                {momentum.statement}
              </p>
            </div>
          )}

          {/* Gap acknowledgment */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              You've been away for{" "}
              <span className="text-foreground font-medium">
                {gapDays} day{gapDays !== 1 ? "s" : ""}
              </span>
              . That's allowed. You don't need to rebuild everything today. One task is enough to
              restart your momentum.
            </p>
            <p className="text-xs text-muted-foreground/60">
              The rest waits. Your only job right now is to finish one thing.
            </p>
          </div>

          {/* Single task surface */}
          {primaryTask && (
            <div className="rounded-2xl bg-secondary/60 border border-border/50 px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5">
                Your one thing
              </p>
              <p className="text-sm font-semibold text-foreground">{primaryTask.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{primaryTask.estMin} min</p>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-3 pt-1">
            <button
              onClick={onAcknowledge}
              className="w-full rounded-2xl bg-foreground text-background py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Show me my one thing
            </button>
            <button
              onClick={onRecovery}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Start a recovery protocol instead
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
