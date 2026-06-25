import { BarRow, Card, Pill, StatLabel } from "@/components/ui-bits";
import type { AvoidanceProfile } from "@/core/contracts/avoidance";
import type { RiskLevel } from "@/core/contracts/primitives";

type Props = {
  avoidance: AvoidanceProfile;
  showEvidenceDetail: boolean;
};

function severityTone(severity: RiskLevel): "neutral" | "warning" | "danger" {
  if (severity === "HIGH" || severity === "CRITICAL") return "danger";
  if (severity === "MODERATE") return "warning";
  return "neutral";
}

export function AvoidanceBreakdownCard({ avoidance, showEvidenceDetail }: Props) {
  const activePatterns = avoidance.patterns.filter(
    (p) => p.detected && avoidance.activePatterns.includes(p.id),
  );

  if (activePatterns.length === 0) return null;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <StatLabel>Execution Pattern</StatLabel>
        <span className="text-[10px] text-muted-foreground">
          {avoidance.windowDays}d window · {avoidance.checkInsInWindow} check-ins
        </span>
      </div>

      <BarRow
        label="Execution friction pressure"
        value={Math.round(avoidance.overallAvoidancePressure * 100)}
        tone={avoidance.overallAvoidancePressure > 0.6 ? "danger" : "warning"}
      />

      <div className="mt-4 space-y-3">
        {activePatterns.map((pattern) => (
          <div key={pattern.id} className="hairline rounded-xl px-3 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {pattern.evidence.length > 0 && (
                  <p className="text-sm text-foreground leading-snug">
                    {pattern.evidence[0].description}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Detected over {pattern.durationDays} day{pattern.durationDays !== 1 ? "s" : ""}
                </p>
              </div>
              <Pill tone={severityTone(pattern.severity)} className="text-[9px] flex-none">
                {pattern.severity.toLowerCase()}
              </Pill>
            </div>

            {showEvidenceDetail && pattern.evidence.length > 1 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors select-none">
                  Evidence signals ({pattern.evidence.length})
                </summary>
                <ul className="mt-2 space-y-1 pl-2">
                  {pattern.evidence.map((ev, i) => (
                    <li key={i} className="text-[11px] text-muted-foreground leading-snug">
                      · {ev.description}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
