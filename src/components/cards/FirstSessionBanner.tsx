import { X } from "lucide-react";
import { Card } from "@/components/ui-bits";
import { FadeUp } from "@/lib/motion";
import type { FirstSessionState } from "@/lib/first-session";

interface FirstSessionBannerProps {
  session: FirstSessionState;
  onDismiss: () => void;
}

export function FirstSessionBanner({ session, onDismiss }: FirstSessionBannerProps) {
  if (!session.active) return null;

  const focusLabel =
    session.focusDuration <= 30
      ? "short blocks (25 min)"
      : session.focusDuration <= 55
        ? "standard blocks (50 min)"
        : "deep blocks (90 min)";

  return (
    <FadeUp>
      <Card className="border-accent/20 bg-accent/5 relative">
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent/70 mb-1">
          Day 1 · System Active
        </p>
        <p className="text-sm font-semibold text-foreground leading-snug mb-2">
          Your system is calibrated. Here's your first day.
        </p>

        <div className="space-y-1 mb-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            · Task cap: <span className="text-foreground font-medium">{session.taskCap} tasks</span> — stay within it.
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            · Focus window: <span className="text-foreground font-medium">{focusLabel}</span>
          </p>
          {session.ctaText && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              · {session.ctaText}
            </p>
          )}
        </div>

        <p className="text-[11px] text-accent/80 font-medium">
          Tonight: complete your first reflection to unlock your execution score.
        </p>
      </Card>
    </FadeUp>
  );
}
