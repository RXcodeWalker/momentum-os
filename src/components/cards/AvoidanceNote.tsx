import { motion } from "framer-motion";
import { Card, StatLabel } from "@/components/ui-bits";
import { Eye } from "lucide-react";
import type { AvoidanceProfile } from "@/core/contracts/avoidance";

type Props = {
  avoidance: AvoidanceProfile;
};

export function AvoidanceNote({ avoidance }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="border-muted-foreground/15 bg-card/60">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-secondary text-muted-foreground">
            <Eye className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <StatLabel className="mb-1 text-muted-foreground">Noticed something</StatLabel>
            <p className="text-sm text-foreground leading-relaxed">
              {avoidance.observationalSummary}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
