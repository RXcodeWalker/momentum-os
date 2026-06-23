import { motion } from "framer-motion";
import { Ring } from "@/components/ui-bits";
import type { DayData } from "@/lib/store";

const TREND_DAYS = 14;

type Props = {
  score: number;
  delta: number;
  history: DayData[];
  completed: number;
  totalTasks: number;
  showScore: boolean;
  showSparkline: boolean;
  showMomentumDelta: boolean;
};

export function EvidenceStrip({
  score,
  delta,
  history,
  completed,
  totalTasks,
  showScore,
  showSparkline,
  showMomentumDelta,
}: Props) {
  if (!showScore && !showSparkline) return null;

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-10">
      {showScore && (
        <div className="relative flex-none">
          <Ring value={score} size={160} stroke={13} label="Score" sub="Today" />
          {delta !== 0 && showMomentumDelta && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              className={`absolute -right-2 -top-2 flex h-11 w-11 items-center justify-center rounded-full hairline bg-card text-[11px] font-black shadow-2xl ${delta > 0 ? "text-success" : "text-danger"}`}
            >
              {delta > 0 ? "+" : ""}
              {delta}
            </motion.div>
          )}
        </div>
      )}

      {showSparkline && (
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
              {TREND_DAYS}d Execution Trend
            </span>
            {totalTasks > 0 && (
              <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">
                {Math.round((completed / Math.max(1, totalTasks)) * 100)}% Today
              </span>
            )}
          </div>

          <div className="flex items-end justify-between gap-1 h-10">
            {history.slice(-TREND_DAYS).map((d, i) => {
              const v = d.executionScore;
              const isToday = i === Math.min(history.length, TREND_DAYS) - 1;
              const tone =
                v >= 70
                  ? "var(--accent)"
                  : v >= 50
                    ? "color-mix(in oklab, var(--accent) 45%, transparent)"
                    : "color-mix(in oklab, var(--danger) 55%, transparent)";
              return (
                <motion.div
                  key={d.date}
                  initial={{ height: 4, opacity: 0 }}
                  animate={{ height: `${4 + (v / 100) * 32}px`, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.025, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex-1 rounded-full ${isToday ? "shadow-glow" : ""}`}
                  style={{
                    background: tone,
                    border: isToday ? "1.5px solid var(--accent)" : "none",
                  }}
                />
              );
            })}
          </div>

          {totalTasks > 0 && (
            <div className="mt-4 h-2 w-full rounded-full bg-secondary overflow-hidden hairline">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completed / Math.max(1, totalTasks)) * 100}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 20 }}
                className="h-full bg-gradient-accent shadow-glow"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
