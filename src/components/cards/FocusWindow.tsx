"use client";
import { StatLabel } from "@/components/ui-bits";
import { Brain, Clock, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

export function FocusWindow({
  window,
  risk,
  capacity,
  score,
  premium = false,
}: {
  window?: string;
  risk?: string;
  capacity?: string;
  score?: number;
  premium?: boolean;
}) {
  if (!premium) {
    return (
      <div className="relative overflow-hidden rounded-3xl hairline bg-card/50 p-6 flex flex-col items-center justify-center text-center min-h-[240px]">
        <div className="absolute inset-0 bg-secondary/10 backdrop-blur-[2px]" />
        <div className="relative z-10">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Lock className="h-6 w-6" />
          </div>
          <p className="font-display text-xl text-foreground">AI Focus Analysis</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-[200px]">
            Unlock hour-by-hour focus mapping with Cadence Pro.
          </p>
          <Link
            to="/premium"
            className="mt-5 inline-block rounded-2xl bg-foreground px-6 py-2 text-xs font-semibold text-background transition hover:opacity-90"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-3xl hairline bg-card p-6"
    >
      <div className="bg-glow absolute -right-12 -top-12 h-40 w-40 opacity-40" />
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          <StatLabel>AI Focus Window</StatLabel>
        </div>
        <div className="text-[11px] font-medium text-accent px-2 py-0.5 rounded-full bg-accent/10">
          {score}% Quality
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative h-40 w-40">
          <svg className="h-full w-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-secondary/30"
            />
            {/* Active window arc */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="282.7"
              initial={{ strokeDashoffset: 282.7 }}
              animate={{ strokeDashoffset: 282.7 - (282.7 * (score || 0)) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="text-accent"
              transform="rotate(-90 50 50)"
            />
            <foreignObject x="0" y="0" width="100" height="100">
              <div className="flex h-full w-full flex-col items-center justify-center text-center">
                <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="font-display text-xl text-foreground">
                  {window?.split(" – ")[0]}
                </span>
                <span className="text-[10px] uppercase tracking-tighter text-muted-foreground">
                  Start Peak
                </span>
              </div>
            </foreignObject>
          </svg>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-secondary/40 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Risk</p>
          <p className="text-sm font-medium text-foreground">{risk}</p>
        </div>
        <div className="rounded-2xl bg-secondary/40 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
            Capacity
          </p>
          <p className="text-sm font-medium text-foreground">{capacity}</p>
        </div>
      </div>
    </motion.div>
  );
}
