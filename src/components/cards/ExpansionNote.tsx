import { motion } from "framer-motion";
import { Card, StatLabel } from "@/components/ui-bits";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { ExpansionDecision } from "@/core/contracts/expansion";

type Props = {
  expansion: ExpansionDecision;
};

export function ExpansionNote({ expansion }: Props) {
  const isIncrease =
    expansion.directive === "increase" || expansion.directive === "gradual_increase";
  const Icon = isIncrease ? TrendingUp : TrendingDown;
  const tone = isIncrease ? "text-success" : "text-warning";
  const bg = isIncrease ? "bg-success/10" : "bg-warning/10";
  const label = isIncrease ? "Capacity window open" : "Reduce challenge load";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card
        className={`border-${isIncrease ? "success" : "warning"}/20 bg-${isIncrease ? "success" : "warning"}/5`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${bg} ${tone}`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <StatLabel className={`mb-1 ${tone}`}>{label}</StatLabel>
            <p className="text-sm text-foreground leading-relaxed">{expansion.rationale}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
