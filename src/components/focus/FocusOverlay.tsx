"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { useFocusEnvironment } from "@/hooks/internal/useFocusEnvironment";
import { useFocusTimer } from "@/hooks/useFocusTimer";
import { useFocusInactivityTimer } from "@/hooks/useFocusInactivityTimer";
import type { FocusSessionQuality } from "@/core/contracts/focus/session";

const TASK_TYPE_LABEL: Record<string, string> = {
  deep: "Deep Work",
  shallow: "Shallow",
  admin: "Admin",
  movement: "Movement",
  "wind-down": "Wind-down",
};

function ElapsedDisplay({ minutes }: { minutes: number }) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0)
    return (
      <span>
        {hrs}h {mins}m
      </span>
    );
  return <span>{mins}m</span>;
}

function TimerRing({
  progress,
  elapsedMin,
  size = 180,
  stroke = 10,
}: {
  progress: number;
  elapsedMin: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, progress);
  const offset = c - pct * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="focusRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-glow)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--ring-track)"
          strokeWidth={stroke}
          fill="none"
          opacity={0.3}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#focusRingGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        <span className="font-display text-5xl text-foreground num-tabular tabular-nums">
          <ElapsedDisplay minutes={elapsedMin} />
        </span>
        <span className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          of focus
        </span>
      </div>
    </div>
  );
}

type QualityOption = { id: FocusSessionQuality; label: string; desc: string };
const QUALITY_OPTIONS: QualityOption[] = [
  { id: "deep", label: "Deep", desc: "Fully absorbed" },
  { id: "done", label: "Done", desc: "Got it finished" },
  { id: "scattered", label: "Scattered", desc: "Hard to stay on it" },
];

function MicroReflection({ onDone }: { onDone: (quality: FocusSessionQuality) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-6 text-center"
    >
      <p className="text-[13px] text-muted-foreground uppercase tracking-[0.16em]">
        How did that feel?
      </p>
      <div className="flex gap-3">
        {QUALITY_OPTIONS.map((q) => (
          <button
            key={q.id}
            onClick={() => onDone(q.id)}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-5 py-4 text-sm transition-all hover:border-accent/50 hover:bg-accent/5 active:scale-[0.97]"
          >
            <span className="font-medium text-foreground">{q.label}</span>
            <span className="text-[11px] text-muted-foreground">{q.desc}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => onDone("done")}
        className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        Skip
      </button>
    </motion.div>
  );
}

export function FocusOverlay() {
  const focusEnv = useFocusEnvironment();
  const exitFocusEnvironment = useApp((s) => s.exitFocusEnvironment);
  const toggleTask = useApp((s) => s.toggleTask);
  const { elapsedMin, progress, pastWindow } = useFocusTimer();
  const [phase, setPhase] = useState<"active" | "reflect">("active");

  useFocusInactivityTimer();

  if (!focusEnv.active) return null;

  const { primaryTask, secondaryTask, hiddenCount, suppressionLevel, mode } = focusEnv;

  function handleDone() {
    if (primaryTask) toggleTask(primaryTask.id);
    if (mode === "RECOVERY" || suppressionLevel === "full") {
      exitFocusEnvironment("completion", focusEnv.heldInterventions, {
        primaryCompleted: true,
        taskId: primaryTask?.id ?? null,
        taskType: primaryTask?.type ?? null,
        mode,
      });
    } else {
      setPhase("reflect");
    }
  }

  function handleReflect(quality: FocusSessionQuality) {
    exitFocusEnvironment("completion", focusEnv.heldInterventions, {
      primaryCompleted: true,
      taskId: primaryTask?.id ?? null,
      taskType: primaryTask?.type ?? null,
      mode,
      quality,
    });
  }

  function handleStepAway() {
    exitFocusEnvironment("interruption", focusEnv.heldInterventions, {
      primaryCompleted: false,
      taskId: primaryTask?.id ?? null,
      taskType: primaryTask?.type ?? null,
      mode,
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        key="focus-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/97 backdrop-blur-sm"
        style={{ backdropFilter: "blur(12px)" }}
      >
        {/* Dismiss corner */}
        <button
          onClick={handleStepAway}
          aria-label="Step away from focus"
          className="absolute top-5 right-5 flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Step away
        </button>

        <AnimatePresence mode="wait">
          {phase === "active" ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-8 px-8 text-center max-w-sm w-full"
            >
              {/* Timer ring */}
              <TimerRing progress={progress} elapsedMin={elapsedMin} />

              {/* Past-window nudge */}
              <AnimatePresence>
                {pastWindow && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[12px] text-muted-foreground -mt-4"
                  >
                    Good depth — pause when ready.
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Task anchor */}
              {primaryTask && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Focusing on
                  </p>
                  <p className="text-lg font-medium text-foreground leading-snug">
                    {primaryTask.label}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
                    {primaryTask.type && (
                      <span>{TASK_TYPE_LABEL[primaryTask.type] ?? primaryTask.type}</span>
                    )}
                    {primaryTask.estMin > 0 && (
                      <>
                        <span>·</span>
                        <span>~{primaryTask.estMin}m</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Secondary task (not in RECOVERY) */}
              {secondaryTask && suppressionLevel !== "full" && (
                <p className="text-[12px] text-muted-foreground/50 -mt-2">
                  Then: {secondaryTask.label}
                  {hiddenCount > 0 && <span className="ml-1 opacity-60">+{hiddenCount} held</span>}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={handleDone}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-accent/15 border border-accent/30 px-6 py-3.5 text-sm font-medium text-accent transition-all hover:bg-accent/25 active:scale-[0.98]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Done
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="reflect"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MicroReflection onDone={handleReflect} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
