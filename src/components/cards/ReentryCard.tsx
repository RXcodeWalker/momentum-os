import { Link } from "@tanstack/react-router";
import { Card, Pill, StatLabel } from "@/components/ui-bits";
import { FadeUp } from "@/lib/motion";
import { RotateCcw } from "lucide-react";
import type { ReentryTier, MomentumMemory } from "@/lib/reentry";

interface ReentryCardProps {
  tier: ReentryTier;
  gapDays: number;
  taskCount: number;
  momentum: MomentumMemory | null;
  onAcknowledge: () => void;
  onRecovery?: () => void;
}

const MESSAGES = {
  short: {
    eyebrow: "Welcome Back",
    headline: "A brief pause. Let's keep it moving.",
    body: (gapDays: number) =>
      `You've been away for ${gapDays} day${gapDays !== 1 ? "s" : ""}. No catch-up needed — just pick up your next priority.`,
    cta: "Got it",
    pillTone: "neutral" as const,
  },
  medium: {
    eyebrow: "Re-entry",
    headline: (gapDays: number) => `${gapDays} days away. One step back in.`,
    body: (taskCount: number) =>
      `Your list has ${taskCount} item${taskCount !== 1 ? "s" : ""}. We've surfaced what matters most. Two priorities — nothing more.`,
    cta: "Start with these",
    pillTone: "accent" as const,
  },
  extended: {
    eyebrow: "Welcome back — really",
    headline: "Absence is part of the rhythm.",
    body: (gapDays: number) =>
      `You've been away for ${gapDays} days. One task is enough to restart your momentum.`,
    cta: "Got it",
    pillTone: "warning" as const,
  },
};

export function ReentryCard({
  tier,
  gapDays,
  taskCount,
  momentum,
  onAcknowledge,
  onRecovery,
}: ReentryCardProps) {
  const msg = MESSAGES[tier];

  const headline =
    tier === "medium"
      ? MESSAGES.medium.headline(gapDays)
      : tier === "short"
        ? MESSAGES.short.headline
        : MESSAGES.extended.headline;

  const body =
    tier === "medium" && !momentum
      ? MESSAGES.medium.body(taskCount)
      : tier === "short"
        ? MESSAGES.short.body(gapDays)
        : MESSAGES.extended.body(gapDays);

  return (
    <FadeUp>
      <Card
        className={
          tier === "medium"
            ? "border-accent/30 bg-accent/5"
            : tier === "extended"
              ? "border-warning/30 bg-warning/5"
              : "border-border bg-card/60"
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Pill
                tone={msg.pillTone}
                className="text-[9px] h-4 py-0 uppercase tracking-widest font-bold"
              >
                {msg.eyebrow}
              </Pill>
            </div>

            <p className="font-display text-base font-semibold text-foreground leading-snug">
              {headline}
            </p>

            {/* Momentum Memory — medium: quote block replacing body; short: appended line */}
            {tier === "medium" && momentum ? (
              <blockquote className="mt-2 border-l-2 border-accent/50 pl-3 text-sm italic text-foreground/70 leading-relaxed">
                "{momentum.statement.replace(/^Your (last north star|last intention): /, "")}"
              </blockquote>
            ) : (
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{body}</p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={onAcknowledge}
                className="rounded-xl bg-foreground/10 px-4 py-2 text-xs font-semibold text-foreground hover:bg-foreground/15 transition-colors"
              >
                {msg.cta}
              </button>
              {(tier === "medium" || tier === "extended") && onRecovery && (
                <Link
                  to="/recovery"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
                  onClick={onRecovery}
                >
                  {tier === "medium" ? "Feeling stuck? Recovery protocol" : "Start a recovery protocol"}
                </Link>
              )}
            </div>

            {/* Momentum Memory — short: tiny one-liner below CTA */}
            {tier === "short" && momentum && (
              <p className="mt-2.5 text-xs text-muted-foreground">
                Still pointed at: {momentum.statement.replace(/^Your (last north star|last intention): /, "")}
              </p>
            )}
          </div>

          <div
            className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${
              tier === "extended"
                ? "bg-warning/10 text-warning"
                : tier === "medium"
                  ? "bg-accent/10 text-accent"
                  : "bg-secondary text-muted-foreground"
            }`}
          >
            <RotateCcw className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </FadeUp>
  );
}
