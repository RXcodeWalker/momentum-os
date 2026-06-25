import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui-bits";
import { motion } from "framer-motion";
import type { FirstSessionState } from "@/lib/first-session";

interface FirstCheckInNudgeProps {
  session: FirstSessionState;
}

export function FirstCheckInNudge({ session }: FirstCheckInNudgeProps) {
  if (!session.active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="border-accent/25 bg-gradient-to-br from-accent/10 to-transparent">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent/70 mb-1">
          First Reflection
        </p>
        <p className="text-base font-display text-foreground leading-snug mb-1">
          {session.ctaText || "Time to log your first day."}
        </p>
        <p className="text-[11px] text-muted-foreground mb-4">
          Your baseline estimate is ~{session.baselineScore}. Tonight you'll see your real score.
        </p>
        <Link to="/check-in">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 active:scale-[0.98]">
            Start first check-in
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </Card>
    </motion.div>
  );
}
