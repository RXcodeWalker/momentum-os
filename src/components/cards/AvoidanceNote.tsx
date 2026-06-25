import { motion } from "framer-motion";
import { Card, StatLabel } from "@/components/ui-bits";
import { Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { AvoidanceProfile } from "@/core/contracts/avoidance";

type Props = {
  avoidance: AvoidanceProfile;
  showInsightsLink?: boolean;
};

export function AvoidanceNote({ avoidance, showInsightsLink }: Props) {
  const isHighConfidence =
    avoidance.confidence === "HIGH" &&
    avoidance.patterns.some((p) => p.severity === "HIGH" || p.severity === "CRITICAL");

  const label = avoidance.confidence === "LOW" ? "Pattern observed" : "Attention pattern";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card
        className={
          isHighConfidence
            ? "border-warning/30 bg-card/60"
            : "border-muted-foreground/15 bg-card/60"
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-secondary text-muted-foreground">
            <Eye className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <StatLabel className="mb-1 text-muted-foreground">{label}</StatLabel>
            <p className="text-sm text-foreground leading-relaxed">
              {avoidance.observationalSummary}
            </p>
            {showInsightsLink && (
              <Link
                to="/insights"
                className="mt-2 inline-block text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                See what we're tracking →
              </Link>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
