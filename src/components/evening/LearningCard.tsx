import { Brain } from "lucide-react";
import { Card, StatLabel } from "@/components/ui-bits";
import { TapCard } from "@/lib/motion";

interface LearningCardProps {
  observation: string | null;
  isObservation: boolean;
}

export function LearningCard({ observation, isObservation }: LearningCardProps) {
  if (!observation) return null;

  return (
    <TapCard>
      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Brain className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            {isObservation && (
              <p className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1.5">
                Today's pattern
              </p>
            )}
            <p className="text-sm leading-relaxed text-foreground">{observation}</p>
          </div>
        </div>
      </Card>
    </TapCard>
  );
}
