"use client";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { useMemo } from "react";

// Horizontal strip of last 14 days as colored pills. Today highlighted.
export function StateRibbon() {
  const history = useApp((s) => s.history);
  const days = useMemo(() => history.slice(-14), [history]);

  return (
    <div className="px-5 lg:px-0">
      <div className="hairline rounded-2xl bg-card/60 px-3 py-2.5 backdrop-blur-sm">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Last 14 days
          </span>
          <span className="text-[10px] text-muted-foreground num-tabular">
            today {days[days.length - 1]?.executionScore ?? 0}
          </span>
        </div>
        <div className="flex items-end justify-between gap-[3px]">
          {days.map((d, i) => {
            const v = d.executionScore;
            const isToday = i === days.length - 1;
            const tone =
              v >= 70
                ? "var(--accent)"
                : v >= 50
                  ? "color-mix(in oklab, var(--accent) 55%, transparent)"
                  : "color-mix(in oklab, var(--danger) 65%, transparent)";
            return (
              <motion.div
                key={d.date}
                initial={{ height: 4, opacity: 0 }}
                animate={{ height: 6 + (v / 100) * 22, opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.025, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 rounded-full"
                style={{
                  background: tone,
                  outline: isToday ? "1.5px solid var(--accent-glow)" : "none",
                  outlineOffset: 2,
                }}
                title={`${d.date} · ${v}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
