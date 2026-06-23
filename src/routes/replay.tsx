import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useVisibleRoutes } from "@/lib/maturity";
import { MetricSurface } from "@/components/MetricSurface";
import { Card, Pill, ScreenHeader, StatLabel } from "@/components/ui-bits";
import { Stagger, StaggerItem, TapCard, FadeUp } from "@/lib/motion";
import { useReplayAnalysis } from "@/lib/store";
import type { ReplayWindowScope } from "@/core/contracts/replay";
import type { AttributionDirection } from "@/core/contracts/replay/attribution";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Clock,
  Info,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { REPLAY_WINDOW_CONFIG } from "@/core/contracts/replay/window";

export const Route = createFileRoute("/replay")({
  head: () => ({
    meta: [
      { title: "Replay — Cadence" },
      {
        name: "description",
        content: "Behavioral replay — what happened, why, what changed, and what usually follows.",
      },
    ],
  }),
  component: ReplayPage,
});

const SCOPES: ReplayWindowScope[] = ["W7", "W14", "W28"];

function ScopeTab({
  scope,
  active,
  onClick,
}: {
  scope: ReplayWindowScope;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
    >
      {REPLAY_WINDOW_CONFIG[scope].label}
    </button>
  );
}

function SuppressedCard({ reason }: { reason: string | null }) {
  return (
    <Card className="flex items-center gap-3 opacity-50 border-dashed">
      <Info className="h-4 w-4 text-muted-foreground shrink-0" />
      <p className="text-sm text-muted-foreground">
        {reason ?? "Not enough data for this section yet."}
      </p>
    </Card>
  );
}

function SignificanceBadge({ sig }: { sig: "HIGH" | "MEDIUM" | "LOW" }) {
  const colors = {
    HIGH: "bg-accent/15 text-accent",
    MEDIUM: "bg-secondary text-foreground",
    LOW: "bg-secondary/50 text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${colors[sig]}`}>{sig}</span>
  );
}

function DirectionIcon({ direction }: { direction: AttributionDirection }) {
  if (direction === "SUPPORTIVE") return <TrendingUp className="h-4 w-4 text-success shrink-0" />;
  if (direction === "LIMITING") return <TrendingDown className="h-4 w-4 text-danger shrink-0" />;
  return <Minus className="h-4 w-4 text-muted-foreground shrink-0" />;
}

function TransitionArrow({ direction }: { direction: "UPWARD" | "DOWNWARD" | "LATERAL" }) {
  if (direction === "UPWARD") return <ArrowUp className="h-4 w-4 text-success" />;
  if (direction === "DOWNWARD") return <ArrowDown className="h-4 w-4 text-danger" />;
  return <ArrowRight className="h-4 w-4 text-muted-foreground" />;
}

function HedgePill({ hedge }: { hedge: "TENTATIVE" | "OBSERVED" | "CONSISTENT" }) {
  const map = {
    TENTATIVE: "bg-warning/15 text-warning",
    OBSERVED: "bg-accent/15 text-accent",
    CONSISTENT: "bg-success/15 text-success",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[hedge]}`}>
      {hedge}
    </span>
  );
}

function NarrativeSection({ scope }: { scope: ReplayWindowScope }) {
  const replay = useReplayAnalysis(scope);
  if (!replay) return <SuppressedCard reason="At least 5 check-ins needed to build a timeline." />;
  const { narrative } = replay;
  if (narrative.suppressed) return <SuppressedCard reason={narrative.suppressionReason} />;

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <StatLabel
            label="Avg score"
            value={narrative.windowSummary.avgExecutionScore.toFixed(0)}
          />
          <div className="flex items-center gap-2">
            <Pill
              label={narrative.windowSummary.momentumDirection}
              tone={
                narrative.windowSummary.momentumDirection === "RISING"
                  ? "success"
                  : narrative.windowSummary.momentumDirection === "DECLINING"
                    ? "danger"
                    : "neutral"
              }
            />
            <Pill label={`${narrative.windowSummary.evidenceDays}d data`} tone="neutral" />
          </div>
        </div>
      </Card>
      {narrative.entries.length === 0 ? (
        <Card className="opacity-50">
          <p className="text-sm text-muted-foreground">
            No significant events to surface in this window.
          </p>
        </Card>
      ) : (
        <Stagger>
          {narrative.entries.map((entry) => (
            <StaggerItem key={entry.entryId}>
              <TapCard>
                <Card className="flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {entry.headline}
                    </p>
                    <SignificanceBadge sig={entry.significance} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted-foreground">{entry.sessionDate}</span>
                    {entry.numericContext != null && (
                      <span className="text-[11px] text-muted-foreground">
                        · {entry.numericContext}
                      </span>
                    )}
                  </div>
                  {entry.detail && <p className="text-xs text-muted-foreground">{entry.detail}</p>}
                </Card>
              </TapCard>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}

function AttributionSection({ scope }: { scope: ReplayWindowScope }) {
  const replay = useReplayAnalysis(scope);
  if (!replay) return <SuppressedCard reason="At least 7 check-ins needed for factor analysis." />;
  const { attribution } = replay;
  if (attribution.suppressed) return <SuppressedCard reason={attribution.suppressionReason} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Association-based · not causal</p>
        <HedgePill hedge={attribution.sectionHedge} />
      </div>
      <Stagger>
        {attribution.factors.map((factor) => (
          <StaggerItem key={factor.kind}>
            <TapCard>
              <Card
                className={`flex flex-col gap-2 ${
                  attribution.primaryFactor?.kind === factor.kind
                    ? "border-accent/40 bg-accent/5"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <DirectionIcon direction={factor.direction} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {factor.kind.replace("_", " ")}
                  </span>
                  {attribution.primaryFactor?.kind === factor.kind && (
                    <span className="ml-auto text-[10px] text-accent font-medium">PRIMARY</span>
                  )}
                </div>
                <p className="text-sm text-foreground leading-snug">{factor.observation}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {factor.scoreDelta != null && (
                    <span
                      className={`text-[11px] font-medium ${
                        factor.scoreDelta > 0
                          ? "text-success"
                          : factor.scoreDelta < 0
                            ? "text-danger"
                            : "text-muted-foreground"
                      }`}
                    >
                      {factor.scoreDelta > 0 ? "+" : ""}
                      {factor.scoreDelta.toFixed(0)} pts
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {factor.evidenceDays}d evidence · {factor.confidence} conf
                  </span>
                </div>
              </Card>
            </TapCard>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

function TransitionSection({ scope }: { scope: ReplayWindowScope }) {
  const replay = useReplayAnalysis(scope);
  if (!replay)
    return <SuppressedCard reason="At least 10 check-ins needed to detect transitions." />;
  const { transitionSummary } = replay;
  if (transitionSummary.suppressed)
    return <SuppressedCard reason={transitionSummary.suppressionReason} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TransitionArrow direction={transitionSummary.netDirection} />
          <span className="text-sm text-foreground font-medium">
            Net direction: {transitionSummary.netDirection.toLowerCase()}
          </span>
        </div>
        <HedgePill hedge={transitionSummary.sectionHedge} />
      </div>
      {transitionSummary.scoreDeltaTotal != null && (
        <Card>
          <div className="flex gap-4">
            <StatLabel
              label="Score change (vs prior week)"
              value={`${transitionSummary.scoreDeltaTotal > 0 ? "+" : ""}${transitionSummary.scoreDeltaTotal.toFixed(0)}`}
            />
          </div>
        </Card>
      )}
      {transitionSummary.transitions.length === 0 ? (
        <Card className="opacity-50">
          <p className="text-sm text-muted-foreground">
            No period transitions detected in this window.
          </p>
        </Card>
      ) : (
        <Stagger>
          {transitionSummary.transitions.map((t) => (
            <StaggerItem key={t.transitionId}>
              <TapCard>
                <Card className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <TransitionArrow direction={t.direction} />
                    <span className="text-sm font-medium text-foreground">
                      {t.fromPeriodType} → {t.toPeriodType}
                    </span>
                    <span className="ml-auto text-[11px] text-muted-foreground">{t.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">{t.observation}</p>
                </Card>
              </TapCard>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}

function ForecastSection({ scope }: { scope: ReplayWindowScope }) {
  const replay = useReplayAnalysis(scope);
  if (!replay)
    return <SuppressedCard reason="At least 21 check-ins needed for pattern-based forecasting." />;
  const { forecast } = replay;
  if (forecast.suppressed) return <SuppressedCard reason={forecast.suppressionReason} />;

  const probColor = {
    LIKELY: "text-success bg-success/15",
    POSSIBLE: "text-accent bg-accent/15",
    UNLIKELY: "text-muted-foreground bg-secondary",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Based on {forecast.sourceTransitionCount} historical transition
          {forecast.sourceTransitionCount !== 1 ? "s" : ""}
        </p>
        <HedgePill hedge={forecast.sectionHedge} />
      </div>
      <Stagger>
        {forecast.outcomes.map((outcome) => (
          <StaggerItem key={outcome.outcomeId}>
            <TapCard>
              <Card
                className={`flex flex-col gap-2 ${outcome.isPrimary ? "border-accent/30" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${probColor[outcome.probability]}`}
                  >
                    {outcome.probability}
                  </span>
                  {outcome.targetPeriodType && (
                    <span className="text-sm font-medium text-foreground">
                      → {outcome.targetPeriodType}
                    </span>
                  )}
                  {outcome.isPrimary && (
                    <span className="ml-auto text-[10px] text-accent font-medium">MOST LIKELY</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-snug">{outcome.observation}</p>
                {outcome.estimatedDaysRange && (
                  <p className="text-[11px] text-muted-foreground">
                    Estimated {outcome.estimatedDaysRange.min}–{outcome.estimatedDaysRange.max} days
                    · based on {outcome.evidenceCount} transitions
                  </p>
                )}
              </Card>
            </TapCard>
          </StaggerItem>
        ))}
      </Stagger>
      <p className="text-[11px] text-muted-foreground text-center px-2">
        These patterns reflect historical frequencies, not predictions. They are observational, not
        diagnostic.
      </p>
    </div>
  );
}

function ReplayPage() {
  const navigate = useNavigate();
  const visible = useVisibleRoutes();
  const [scope, setScope] = useState<ReplayWindowScope>("W7");

  useEffect(() => {
    if (!visible.includes("replay")) {
      navigate({ to: "/" });
    }
  }, [visible, navigate]);

  return (
    <MetricSurface
      metric="behavioralReplay"
      fallback={
        <div className="px-5 py-10 text-center">
          <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Replay unlocks at 21 check-ins</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Keep checking in — your behavioral history will surface meaningful patterns here.
          </p>
        </div>
      }
    >
      {() => (
        <div className="flex flex-col gap-6 px-5 py-6">
          <ScreenHeader
            title="Behavioral Replay"
            subtitle="What happened, why, and what tends to follow"
          />

          {/* Window scope tabs */}
          <div className="flex gap-2 flex-wrap">
            {SCOPES.map((s) => (
              <ScopeTab key={s} scope={s} active={scope === s} onClick={() => setScope(s)} />
            ))}
          </div>

          {/* Section 1: What happened */}
          <FadeUp>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">What happened</h2>
              </div>
              <NarrativeSection scope={scope} />
            </div>
          </FadeUp>

          {/* Section 2: Why */}
          <FadeUp>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Why</h2>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </div>
              <AttributionSection scope={scope} />
            </div>
          </FadeUp>

          {/* Section 3: What changed */}
          <FadeUp>
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-foreground">What changed</h2>
              <TransitionSection scope={scope} />
            </div>
          </FadeUp>

          {/* Section 4: What usually follows */}
          <FadeUp>
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-foreground">What usually follows</h2>
              <ForecastSection scope={scope} />
            </div>
          </FadeUp>
        </div>
      )}
    </MetricSurface>
  );
}
