"use client";
import { Quote, Sparkles, X } from "lucide-react";
import { Pill, StatLabel } from "@/components/ui-bits";
import { motion } from "framer-motion";
import { useState } from "react";

export function BehavioralNote({
  title,
  body,
  confidence = 87,
}: {
  title: string;
  body: string;
  confidence?: number;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl hairline bg-card p-5 lg:p-6"
    >
      <div className="bg-glow absolute inset-x-0 -top-12 h-32 opacity-60" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-accent/12 text-accent">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <StatLabel>Behavioral pattern</StatLabel>
            <button
              onClick={() => setDismissed(true)}
              className="opacity-50 transition hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="relative">
            <Quote className="absolute -left-1 -top-1 h-4 w-4 text-accent/40" />
            <p className="font-display italic pl-5 text-[19px] leading-[1.35] text-foreground">
              {title}
            </p>
          </div>
          <p className="mt-2 pl-5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
          <div className="mt-3 flex items-center gap-2 pl-5">
            <Pill tone="accent">{confidence}% confidence</Pill>
            <span className="text-[11px] text-muted-foreground">· detected across 28 days</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
