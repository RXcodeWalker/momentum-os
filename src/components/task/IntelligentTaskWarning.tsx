import { motion } from "framer-motion";
import { AlertTriangle, Shield, X } from "lucide-react";
import type { WarningKind } from "@/hooks/useTaskCreationIntelligence";

const WARNINGS: Record<
  WarningKind,
  { icon: typeof AlertTriangle; headline: string; copy: string }
> = {
  "recovery-conflict": {
    icon: AlertTriangle,
    headline: "Deep work in recovery mode",
    copy: "Your system is rebuilding. Deep tasks extend recovery — movement or shallow work compounds faster right now.",
  },
  overloaded: {
    icon: Shield,
    headline: "You're over capacity today",
    copy: "Your load already exceeds your 7-day completion baseline. Quality drops when depth is spread too thin.",
  },
};

export function IntelligentTaskWarning({
  kind,
  onDismiss,
}: {
  kind: WarningKind;
  onDismiss: () => void;
}) {
  const { icon: Icon, headline, copy } = WARNINGS[kind];

  return (
    <motion.div
      key={kind}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-2.5 rounded-xl bg-warning/8 border border-warning/20 px-3 py-2.5"
    >
      <Icon className="h-3.5 w-3.5 text-warning mt-0.5 flex-none" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-warning leading-tight">{headline}</p>
        <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-relaxed">{copy}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-muted-foreground/50 hover:text-muted-foreground transition-colors flex-none mt-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}
