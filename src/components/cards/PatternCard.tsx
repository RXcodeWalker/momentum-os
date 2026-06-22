"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Shield, AlertTriangle, Minus } from "lucide-react";
import { Card, Pill, StatLabel } from "@/components/ui-bits";
import { Stagger, StaggerItem, TapCard } from "@/lib/motion";
import { usePatternDetection } from "@/lib/store";
import type { DetectedPattern } from "@/core/contracts/patterns";

const POLARITY_CONFIG = {
  RISK: {
    pillTone: "warning" as const,
    label: "Risk pattern",
    Icon: AlertTriangle,
    iconClass: "text-warning",
    borderClass: "border-warning/20",
  },
  PROTECTIVE: {
    pillTone: "success" as const,
    label: "Protective pattern",
    Icon: Shield,
    iconClass: "text-success",
    borderClass: "border-success/20",
  },
  NEUTRAL: {
    pillTone: "neutral" as const,
    label: "Observed pattern",
    Icon: Minus,
    iconClass: "text-muted-foreground",
    borderClass: "border-border/40",
  },
} as const;

const BAND_CLASS: Record<string, string> = {
  HIGH: "bg-accent/15 text-accent",
  MEDIUM: "bg-secondary text-foreground/70",
  LOW: "bg-secondary text-muted-foreground",
};

const HEDGE_LABEL: Record<string, string> = {
  CONSISTENT: "Consistent",
  OBSERVED: "Observed",
  TENTATIVE: "Tentative",
};

function PatternRow({ pattern }: { pattern: DetectedPattern }) {
  const [open, setOpen] = useState(false);
  const cfg = POLARITY_CONFIG[pattern.polarity];
  const Icon = cfg.Icon;

  const intervalLow = Math.round(pattern.confidence.rateInterval.low * 100);
  const intervalHigh = Math.round(pattern.confidence.rateInterval.high * 100);
  const baseRatePct = Math.round(pattern.association.baseRate * 100);

  return (
    <TapCard>
      <Card className={`${cfg.borderClass}`}>
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-background/50 ${cfg.iconClass}`}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <Pill tone={cfg.pillTone} className="text-[9px]">
                {cfg.label}
              </Pill>
              <span
                className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${BAND_CLASS[pattern.confidence.band]}`}
              >
                {HEDGE_LABEL[pattern.explanation.hedge]} · {pattern.confidence.band}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground leading-snug">{pattern.label}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/80">
              {pattern.explanation.observation}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground italic">
              {pattern.explanation.basis}
            </p>

            <button
              onClick={() => setOpen((v) => !v)}
              className="mt-2.5 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Why we're cautious
            </button>

            {open && (
              <div className="mt-2 rounded-xl bg-secondary/30 border border-border/40 px-3 py-2.5 space-y-1.5">
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest">
                  Confidence caveats
                </p>
                <p className="text-[11px] text-foreground/70">
                  True rate likely {intervalLow}–{intervalHigh}% (95% interval). Base rate across
                  all days: {baseRatePct}%.
                </p>
                {pattern.association.confounders.map((c, i) => (
                  <p key={i} className="text-[11px] text-foreground/70">
                    · {c.note}
                  </p>
                ))}
                {pattern.association.confounders.length === 0 && (
                  <p className="text-[11px] text-foreground/70">
                    No additional confounders detected for this pattern.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </TapCard>
  );
}

export function PatternCard() {
  const profile = usePatternDetection();

  if (profile.activePatterns.length === 0) {
    return (
      <Card className="bg-secondary/10 border-border/40">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Still watching for repeatable patterns — they appear once a relationship holds up over
          several weeks.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="px-1 flex items-center justify-between">
        <StatLabel>Detected patterns</StatLabel>
        <span className="text-[10px] text-muted-foreground">
          {profile.activePatterns.length} active · {profile.windowDays}d window
        </span>
      </div>
      <Stagger>
        {profile.activePatterns.map((pattern) => (
          <StaggerItem key={pattern.patternId}>
            <PatternRow pattern={pattern} />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
