import { Card, Pill, StatLabel } from "@/components/ui-bits";
import { useInterventionIntelligence } from "@/lib/store";
import { useDataReadiness } from "@/lib/maturity";
import type { ActiveInterventionType } from "@/core/contracts/interventions/types";

const INTERVENTION_PLAIN_NAMES: Record<ActiveInterventionType, string> = {
  BURNOUT_PREVENTION: "burnout risk alerts",
  RECOVERY_ENFORCEMENT: "recovery enforcement",
  OVERLOAD: "workload reduction nudges",
  AVOIDANCE_INTERRUPTION: "pattern interruption prompts",
  FRAGMENTATION_REDUCTION: "focus depth prompts",
  DEEP_WORK_PROTECTION: "deep work protection",
  RESTART_ASSISTANCE: "restart assistance",
};

export function InterventionEffectivenessPanel() {
  const { hasMinimum } = useDataReadiness("interventionEffectiveness");
  const report = useInterventionIntelligence();

  if (!hasMinimum) return null;

  const actionableRows = report.effectiveness.filter(
    (e) =>
      (e.verdict === "WORKING" || e.verdict === "NOT_WORKING") &&
      (e.confidence === "MEDIUM" || e.confidence === "HIGH"),
  );

  if (actionableRows.length === 0) return null;

  return (
    <Card>
      <StatLabel className="mb-4 block">Intervention Effectiveness</StatLabel>
      <div className="space-y-3">
        {actionableRows.map((row) => {
          const name = INTERVENTION_PLAIN_NAMES[row.type as ActiveInterventionType] ?? row.type;
          const isDemoted = report.suppressionAdvisories.some(
            (a) => a.type === row.type && a.action === "DEMOTE",
          );
          const fatigueSignal = report.fatigue.find((f) => f.type === row.type);
          const hasHighFatigue = fatigueSignal?.level === "HIGH";

          return (
            <div key={row.type} className="space-y-1">
              <div className="flex items-start gap-2">
                {row.verdict === "WORKING" ? (
                  <Pill tone="success" className="text-[9px] flex-none mt-0.5">
                    working
                  </Pill>
                ) : (
                  <Pill tone="warning" className="text-[9px] flex-none mt-0.5">
                    not working
                  </Pill>
                )}
                <p className="text-sm text-foreground leading-snug">
                  {row.verdict === "WORKING" ? (
                    <>
                      <span className="capitalize">{name}</span> is producing results
                      {row.medianDelta !== null && (
                        <span className="text-success font-semibold">
                          {" "}
                          (+{row.medianDelta} pts median)
                        </span>
                      )}
                    </>
                  ) : isDemoted ? (
                    <>
                      <span className="capitalize">{name}</span> hasn't moved your score — showing
                      it less often now
                    </>
                  ) : (
                    <>
                      <span className="capitalize">{name}</span> hasn't moved your score yet
                    </>
                  )}
                </p>
              </div>
              {hasHighFatigue && (
                <p className="pl-2 text-[11px] text-muted-foreground/70 leading-snug">
                  We've adjusted {name} frequency based on your response pattern.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
