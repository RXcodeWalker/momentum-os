import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useVisibleRoutes } from "@/lib/maturity";
import { BarRow, Card, ScreenHeader, Sparkline, StatLabel } from "@/components/ui-bits";
import { MetricSurface } from "@/components/MetricSurface";
import { StateDynamicsCard } from "@/components/cards/StateDynamicsCard";
import { PatternCard } from "@/components/cards/PatternCard";
import { AvoidanceBreakdownCard } from "@/components/cards/AvoidanceBreakdownCard";
import { InterventionEffectivenessPanel } from "@/components/cards/InterventionEffectivenessPanel";
import { ExecutionHeatmap } from "@/components/heatmap";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Eye,
  Lightbulb,
  Lock,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import {
  useApp,
  useActiveInsights,
  useFakeProductivityFlags,
  useConsistency,
  useUserState,
  useResilience,
  useMomentum,
  useRootCauseAnalysis,
  useDeepWorkStats,
  useDistractionStats,
  useDistractionProfile,
  useDayOfWeekProfile,
  useBlockerPattern,
  useInsightEffectiveness,
  useTaskIntelligence,
  useAvoidanceProfile,
} from "@/lib/store";
import { motion } from "framer-motion";
import { Stagger, StaggerItem } from "@/lib/motion";
import { toast } from "sonner";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Cadence" },
      {
        name: "description",
        content: "Root cause analysis, distraction attribution, and behavioral patterns.",
      },
    ],
  }),
  component: Insights,
});

function CurrentStateBanner() {
  const { label, tone, state } = useUserState();

  const config = {
    peak: {
      icon: Sparkles,
      bg: "bg-success/10",
      border: "border-success/20",
      text: "text-success",
    },
    steady: { icon: Check, bg: "bg-accent/10", border: "border-accent/20", text: "text-accent" },
    building: {
      icon: TrendingUp,
      bg: "bg-accent/10",
      border: "border-accent/20",
      text: "text-accent",
    },
    burnout: {
      icon: AlertTriangle,
      bg: "bg-danger/10",
      border: "border-danger/20",
      text: "text-danger",
    },
    recovery: {
      icon: Lightbulb,
      bg: "bg-warning/10",
      border: "border-warning/20",
      text: "text-warning",
    },
  }[state] || {
    icon: Eye,
    bg: "bg-secondary/10",
    border: "border-secondary/20",
    text: "text-muted-foreground",
  };

  const Icon = config.icon;

  // #3 — Today owns the state headline. Here we only *reference* it as a compact
  // chip that links back to Today, rather than re-declaring state as a hero.
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 mb-2"
    >
      <Link
        to="/"
        className={`inline-flex items-center gap-2 rounded-full border ${config.border} ${config.bg} px-3 py-1.5 ${config.text} transition-opacity hover:opacity-80`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">
          Diagnosing while <span className="font-semibold">{label}</span>
        </span>
        <ArrowRight className="h-3 w-3 opacity-60" />
      </Link>
    </motion.div>
  );
}

function RootCauseDiagnostics() {
  const analysis = useRootCauseAnalysis();
  const { sleepImpact } = useDeepWorkStats();

  const cards = [
    analysis.sleep.detected && {
      title: "Biological Debt",
      body: analysis.sleep.observation,
      meta: `${sleepImpact}% execution drop detected on low-sleep days.`,
      icon: Eye,
      tone: "danger" as const,
    },
    analysis.overplanning.detected && {
      title: "Ambition Paradox",
      body: analysis.overplanning.observation,
      meta: "Plan exceeds historical execution capacity.",
      icon: AlertTriangle,
      tone: "warning" as const,
    },
    analysis.workload.detected && {
      title: "Capacity Mismatch",
      body: analysis.workload.observation,
      meta: "Deep work demands exceed available window.",
      icon: TrendingDown,
      tone: "warning" as const,
    },
    analysis.distraction.detected && {
      title: "Attention Fragmentation",
      body: analysis.distraction.observation,
      meta: "Phone pickups are degrading focus depth.",
      icon: Zap,
      tone: "danger" as const,
    },
  ].filter(Boolean) as {
    title: string;
    body: string;
    meta: string;
    icon: typeof Eye;
    tone: "danger" | "warning";
  }[];

  if (cards.length === 0) {
    return (
      <Card className="bg-success/5 border-success/10">
        <div className="flex items-start gap-3">
          <Check className="h-4 w-4 text-success flex-none mt-0.5" />
          <p className="text-sm leading-snug text-foreground/90">
            No behavioral bottlenecks detected. You are operating within your sustainable capacity.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card
            className={`${card.tone === "danger" ? "bg-danger/5 border-danger/10" : "bg-warning/5 border-warning/20"}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full ${card.tone === "danger" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"}`}
              >
                <card.icon className="h-3.5 w-3.5" />
              </div>
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest ${card.tone === "danger" ? "text-danger" : "text-warning"}`}
                >
                  {card.title}
                </p>
                <p className="mt-1 text-sm leading-snug text-foreground/90">{card.body}</p>
                <p className="mt-2 text-[11px] text-muted-foreground italic">{card.meta}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function Insights() {
  const navigate = useNavigate();
  const visibleRoutes = useVisibleRoutes();
  const isUnlocked = visibleRoutes.includes("patterns");
  useEffect(() => {
    if (!isUnlocked) navigate({ to: "/" });
  }, [isUnlocked, navigate]);

  const history = useApp((s) => s.history);
  const allInsights = useApp((s) => s.insights);
  const dismissInsight = useApp((s) => s.dismissInsight);
  const commitToInsight = useApp((s) => s.commitToInsight);
  const flags = useFakeProductivityFlags();
  const activeInsights = useActiveInsights();
  const lockedInsights = allInsights.filter((i) => !i.unlocked);
  const distractionProfile = useDistractionProfile();
  const dowProfile = useDayOfWeekProfile();
  const blockerPattern = useBlockerPattern();
  const avoidanceProfile = useAvoidanceProfile();
  const insightEffectiveness = useInsightEffectiveness();
  const taskIntel = useTaskIntelligence();
  const { sleepImpact } = useDeepWorkStats();
  const { avg: avgDist, peakWindow, reduction } = useDistractionStats();

  const last28 = history.slice(-28);

  const trendData = useMemo(() => last28.map((d) => d.executionScore), [last28]);
  const sleepData = useMemo(() => last28.map((d) => Math.round(d.sleepHours * 10)), [last28]);
  const distractionData = useMemo(() => last28.map((d) => d.distractions), [last28]);

  const avgSleep = useMemo(
    () => last28.reduce((a, d) => a + d.sleepHours, 0) / Math.max(1, last28.length),
    [last28],
  );
  const avgSleep7 = history.slice(-7).reduce((a, d) => a + d.sleepHours, 0) / Math.max(1, 7);

  const consistency = useConsistency(28);
  const { score: resilienceScore, avgRecoveryDays } = useResilience();
  const { delta: momentumDelta, trend: momentumTrend } = useMomentum();

  const planExecuteColor =
    flags.planExecuteRatio < 60 ? "danger" : flags.planExecuteRatio < 75 ? "warning" : "accent";

  // Insight type metadata
  const insightMeta: Record<string, { icon: typeof Sparkles; toneClass: string; label: string }> = {
    pattern: { icon: TrendingUp, toneClass: "bg-accent/15 text-accent", label: "Pattern" },
    breakthrough: {
      icon: Sparkles,
      toneClass: "bg-success/15 text-success",
      label: "Breakthrough",
    },
    warning: { icon: AlertTriangle, toneClass: "bg-warning/15 text-warning", label: "Warning" },
    identity: { icon: Lightbulb, toneClass: "bg-accent/15 text-accent", label: "Identity" },
  };

  const handleCommit = (insight: (typeof allInsights)[0]) => {
    const rule = insight.title.replace("You ", "I will ").replace("Your ", "My ");
    commitToInsight(insight.id, rule);
    toast.success("Behavioral rule committed", {
      description: `New rule: "${rule}"`,
    });
  };

  if (!isUnlocked) return null;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <ScreenHeader
        eyebrow="Behavioral Diagnostics"
        title="Why is this happening?"
        subtitle="Root cause analysis, distraction attribution, and behavioral patterns."
        right={
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="hairline rounded-full px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              ← Execution Status
            </Link>
            <Link
              to="/weekly"
              className="hairline rounded-full px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Weekly →
            </Link>
          </div>
        }
      />

      {/* Section 1 — CurrentStateBanner */}
      <CurrentStateBanner />

      <Stagger>
        {/* Section 2 — Trajectory Snapshot */}
        <StaggerItem>
          <section className="px-5 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-1 w-1 rounded-full bg-accent" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Trajectory Snapshot
              </h3>
            </div>
            <Card>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Momentum
                  </p>
                  <p className="font-display text-2xl num-tabular text-foreground">
                    {momentumDelta > 0 ? "+" : ""}
                    {momentumDelta}
                    <span className="text-base text-muted-foreground">pts</span>
                  </p>
                  <div
                    className={`mt-1 flex items-center gap-1 text-[10px] ${momentumTrend === "down" ? "text-danger" : momentumTrend === "up" ? "text-success" : "text-muted-foreground"}`}
                  >
                    {momentumTrend === "down" ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : (
                      <TrendingUp className="h-3 w-3" />
                    )}
                    {momentumTrend === "down"
                      ? "losing steam"
                      : momentumTrend === "up"
                        ? "gaining traction"
                        : "holding steady"}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Consistency
                  </p>
                  <p className="font-display text-2xl num-tabular text-foreground">
                    {consistency}
                    <span className="text-base text-muted-foreground">%</span>
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">28-day average</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Resilience
                  </p>
                  <p className="font-display text-2xl num-tabular text-foreground">
                    {resilienceScore}
                    <span className="text-base text-muted-foreground">/100</span>
                  </p>
                  <p className="mt-1 text-[10px] text-success">{avgRecoveryDays}d avg recovery</p>
                </div>
              </div>
              <div className="mt-5">
                <ExecutionHeatmap weeks={4} />
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>
            </Card>
          </section>
        </StaggerItem>

        {/* Section 3 — Root Cause Diagnostics */}
        <StaggerItem>
          <section className="px-5 mt-4 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-1 w-1 rounded-full bg-warning" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Root Cause Diagnostics
              </h3>
            </div>

            {/* Root cause leads */}
            <RootCauseDiagnostics />

            {/* Planning Accuracy BarRows */}
            <Card>
              <div className="space-y-4">
                <BarRow
                  label="Planning Accuracy"
                  value={flags.planExecuteRatio}
                  tone={planExecuteColor as "neutral" | "accent" | "danger"}
                />
                <BarRow label="Sleep Regularity" value={flags.sleepRegularity} />
                <BarRow
                  label="Focus Depth"
                  value={flags.deepWorkRatio}
                  tone={flags.deepWorkRatio < 40 ? "danger" : "accent"}
                />
              </div>
            </Card>

            {/* Avoidance Pattern Breakdown */}
            {avoidanceProfile && avoidanceProfile.activePatterns.length > 0 && (
              <MetricSurface metric="distractionProfile">
                {() => (
                  <AvoidanceBreakdownCard
                    avoidance={avoidanceProfile}
                    showEvidenceDetail={avoidanceProfile.confidence === "HIGH"}
                  />
                )}
              </MetricSurface>
            )}

            {/* Distraction Attribution */}
            {distractionProfile.topDistractors.length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <StatLabel>Distraction Impact</StatLabel>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-warning/10 text-warning">
                    <AlertTriangle className="h-3 w-3" />
                  </div>
                </div>
                <div className="space-y-2.5">
                  {distractionProfile.topDistractors.slice(0, 4).map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground capitalize">{d.id.replace("-", " ")}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{d.frequency}d</span>
                        <span
                          className={`text-xs font-semibold ${d.avgScoreImpact < -3 ? "text-danger" : d.avgScoreImpact < 0 ? "text-warning" : "text-success"}`}
                        >
                          {d.avgScoreImpact > 0 ? "+" : ""}
                          {d.avgScoreImpact} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {distractionProfile.scoreImpactText && (
                  <p className="mt-3 text-[11px] text-muted-foreground italic border-t border-border/50 pt-2">
                    {distractionProfile.scoreImpactText}
                  </p>
                )}
              </Card>
            )}

            {/* Blocker Pattern Analysis */}
            {blockerPattern.dominantBlocker && (
              <Card className="bg-warning/5 border-warning/10">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-warning/10 text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-warning">
                      Blocker Pattern
                    </p>
                    <p className="mt-1 text-sm leading-snug text-foreground/90 capitalize">
                      Primary blocker: <strong>{blockerPattern.dominantBlocker}</strong>
                      {blockerPattern.streak &&
                        ` — detected ${blockerPattern.streak.days}+ consecutive days`}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {blockerPattern.recommendation}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Day-of-Week Profile */}
            {dowProfile.bestDay && dowProfile.worstDay && (
              <Card>
                <StatLabel className="mb-3 block">Day-of-Week Profile</StatLabel>
                <div className="flex items-end gap-1 h-16">
                  {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
                    const stats = dowProfile.byDay[dow];
                    const score = stats?.avgScore ?? 0;
                    const isBest = dowProfile.bestDay?.dow === dow;
                    const isWorst = dowProfile.worstDay?.dow === dow;
                    return (
                      <div key={dow} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t-sm transition-all ${isBest ? "bg-success" : isWorst ? "bg-danger/60" : "bg-accent/40"}`}
                          style={{ height: `${Math.max(8, score)}%` }}
                        />
                        <span
                          className={`text-[9px] ${isBest ? "text-success font-bold" : isWorst ? "text-danger/80 font-bold" : "text-muted-foreground"}`}
                        >
                          {dowProfile.dayNames[dow].slice(0, 1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="text-success font-semibold">
                    Best: {dowProfile.bestDay.dayName} (~{dowProfile.bestDay.avgScore})
                  </span>
                  <span className="text-danger/80 font-semibold">
                    Hardest: {dowProfile.worstDay.dayName} (~{dowProfile.worstDay.avgScore})
                  </span>
                </div>
                {dowProfile.overplanDays.length > 0 && (
                  <p className="mt-2 text-[11px] text-warning/80 italic">
                    Overplanning detected on{" "}
                    {dowProfile.overplanDays.map((d) => dowProfile.dayNames[d]).join(", ")}
                  </p>
                )}
              </Card>
            )}

            {/* Task Mix Analysis */}
            {taskIntel.typeBalanceWarning && (
              <Card className="bg-warning/5 border-warning/10">
                <StatLabel className="mb-2 block">Task Load Intelligence</StatLabel>
                <p className="text-sm text-foreground/90">{taskIntel.typeBalanceWarning}</p>
                {taskIntel.rescheduleAlerts.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                      Stuck tasks
                    </p>
                    {taskIntel.rescheduleAlerts.map((a) => (
                      <p key={a.taskId} className="text-xs text-warning/80">
                        "{a.label.slice(0, 40)}
                        {a.label.length > 40 ? "…" : ""}" rescheduled {a.count}x
                      </p>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </section>
        </StaggerItem>

        {/* Section 4 — Historical Trends */}
        <StaggerItem>
          <section className="px-5 mt-4 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-1 w-1 rounded-full bg-accent/60" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Historical Trends
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <StatLabel>Sleep · 28d</StatLabel>
                <p className="font-display mt-1 text-2xl text-foreground">
                  {avgSleep.toFixed(1)}
                  <span className="text-muted-foreground text-base">h avg</span>
                </p>
                <div className="mt-3 h-[80px]">
                  <Sparkline data={sleepData} height={80} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Days under 6.5h are followed by a {sleepImpact}% drop in execution capacity.
                </p>
              </Card>
              <Card>
                <StatLabel>Distractions · 28d</StatLabel>
                <p className="font-display mt-1 text-2xl text-foreground">
                  {avgDist.toFixed(1)}
                  <span className="text-muted-foreground text-base"> /day</span>
                </p>
                <div className="mt-3 h-[80px]">
                  <Sparkline data={distractionData} height={80} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Peak distraction window: {peakWindow}. Wind-down protocol cuts this ~{reduction}%.
                </p>
              </Card>
            </div>
          </section>
        </StaggerItem>

        {/* Section 5 — Behavioral Breakthroughs */}
        <StaggerItem>
          <section className="px-5 mt-4 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-1 w-1 rounded-full bg-success" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Behavioral Breakthroughs
              </h3>
            </div>

            {/* Committed Rules with Effectiveness */}
            {allInsights.filter((i) => i.committed).length > 0 && (
              <div className="space-y-3">
                <div className="px-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-success">
                    Active Protocols
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {allInsights.filter((i) => i.committed).length} Rules
                  </span>
                </div>
                {allInsights
                  .filter((i) => i.committed)
                  .map((insight) => {
                    const eff = insightEffectiveness.find((e) => e.insightId === insight.id);
                    const verdictConfig = eff
                      ? {
                          working: { label: "Working", cls: "text-success bg-success/10" },
                          "too-early": {
                            label: "Too early to tell",
                            cls: "text-muted-foreground bg-secondary",
                          },
                          "not-working": { label: "Not working", cls: "text-danger bg-danger/10" },
                          plateau: { label: "Plateau", cls: "text-warning bg-warning/10" },
                        }[eff.verdict]
                      : null;
                    return (
                      <Card key={insight.id} className="bg-success/5 border-success/10 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-success/10 text-success">
                            <Check className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-base text-foreground">
                              "{insight.title}"
                            </p>
                            {eff && verdictConfig && (
                              <div className="mt-2 flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${verdictConfig.cls}`}
                                >
                                  {verdictConfig.label}
                                </span>
                                {eff.verdict !== "too-early" && (
                                  <span
                                    className={`text-[10px] font-semibold ${eff.delta >= 0 ? "text-success" : "text-danger"}`}
                                  >
                                    {eff.delta >= 0 ? "+" : ""}
                                    {eff.delta} pts since commit
                                  </span>
                                )}
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                  Day {eff.daysSinceCommit}
                                </span>
                              </div>
                            )}
                            {eff?.verdict === "not-working" && eff.daysSinceCommit >= 14 && (
                              <p className="mt-1.5 text-[11px] text-warning/80 italic">
                                This rule may need revisiting — no score improvement after{" "}
                                {eff.daysSinceCommit} days.
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            )}

            {/* Intervention Effectiveness */}
            <MetricSurface metric="interventionEffectiveness">
              {() => <InterventionEffectivenessPanel />}
            </MetricSurface>

            {/* Earned behavioral insights (Not committed) */}
            <div className="space-y-4">
              {activeInsights
                .filter((i) => !i.committed)
                .map((insight) => {
                  const meta = insightMeta[insight.type];
                  const Icon = meta.icon;
                  return (
                    <Card key={insight.id} className="relative overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 w-1 ${meta.toneClass.split(" ")[1]}`}
                      />
                      <button
                        onClick={() => dismissInsight(insight.id)}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Dismiss insight"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${meta.toneClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 pr-6">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              {meta.label}
                            </span>
                          </div>
                          <p className="font-display text-lg leading-tight text-foreground">
                            "{insight.title}"
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {insight.body}
                          </p>

                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => handleCommit(insight)}
                              className="flex items-center gap-2 rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-transform active:scale-95"
                            >
                              Commit to rule
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>

            {/* Locked insights */}
            {lockedInsights.length > 0 && (
              <div className="space-y-2">
                <div className="px-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    Emerging Patterns
                  </span>
                </div>
                {lockedInsights.slice(0, 2).map((insight) => (
                  <div
                    key={insight.id}
                    className="flex items-center gap-3 hairline rounded-2xl bg-secondary/10 px-4 py-3 opacity-60"
                  >
                    <Lock className="h-3.5 w-3.5 text-muted-foreground flex-none" />
                    <p className="text-xs text-muted-foreground">
                      Insufficient data for behavioral diagnosis...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </StaggerItem>

        {/* Section 6 — Behavioral Growth */}
        <StaggerItem>
          <section className="px-5 mt-4 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-1 w-1 rounded-full bg-accent" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Behavioral Growth
              </h3>
            </div>
            <BehavioralGrowth />
          </section>
        </StaggerItem>

        {/* Section 7 — Long-Run Dynamics */}
        <StaggerItem>
          <section className="px-5 mt-4 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-1 w-1 rounded-full bg-accent/60" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Long-Run Dynamics
              </h3>
            </div>
            <MetricSurface metric="stateDynamics">{() => <StateDynamicsCard />}</MetricSurface>
            <MetricSurface
              metric="patternDetection"
              fallback={
                <div className="hairline rounded-2xl bg-secondary/10 px-4 py-3 text-xs text-muted-foreground">
                  Patterns appear after 14+ check-ins — keep building history.
                </div>
              }
            >
              {() => <PatternCard />}
            </MetricSurface>
          </section>
        </StaggerItem>

        {/* Section 8 — Execution Trend 28d */}
        <StaggerItem>
          <section className="px-5 mt-4 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-1 w-1 rounded-full bg-accent" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Execution Trend
              </h3>
            </div>
            <Card>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <StatLabel>Execution trend · 28 days</StatLabel>
                  <p className="font-display mt-1 text-3xl text-foreground">
                    {Math.round(
                      trendData.reduce((a, b) => a + b, 0) / Math.max(1, trendData.length),
                    )}
                    <span className="text-muted-foreground text-lg"> avg</span>
                  </p>
                </div>
              </div>
              <div className="h-[200px] lg:h-[240px]">
                <Sparkline data={trendData} accent height={240} />
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
                <span>4 weeks ago</span>
                <span>3 weeks ago</span>
                <span>2 weeks ago</span>
                <span>1 week ago</span>
                <span>Today</span>
              </div>
            </Card>
          </section>
        </StaggerItem>
      </Stagger>

      {/* Section 9 — Weekly Report CTA */}
      <section className="px-5 mt-2">
        <Link to="/weekly" className="group block">
          <Card className="bg-foreground text-background border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                  Next Step
                </p>
                <p className="font-display mt-1 text-lg">Generate Weekly Performance Review</p>
              </div>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </div>
          </Card>
        </Link>
      </section>
    </div>
  );
}

function Evolution({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-medium text-foreground num-tabular">{value}</span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-accent"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function BehavioralGrowth() {
  const history = useApp((s) => s.history);
  const checkIns = useApp((s) => s.checkIns);
  const consistency = useConsistency(28);
  const { score: resilience } = useResilience();

  const last28 = history.slice(-28);
  const avgFocus = useMemo(
    () => last28.reduce((a, d) => a + d.focus, 0) / Math.max(1, last28.length),
    [last28],
  );
  const avgSleep = useMemo(
    () => last28.reduce((a, d) => a + d.sleepHours, 0) / Math.max(1, last28.length),
    [last28],
  );
  const avgHonesty = useMemo(() => {
    if (checkIns.length === 0) return 85;
    return Math.round(checkIns.reduce((a, c) => a + c.honesty, 0) / Math.max(1, checkIns.length));
  }, [checkIns]);

  return (
    <Card>
      <StatLabel className="mb-3 block">5-Dimension Evolution</StatLabel>
      <div className="space-y-3">
        <Evolution label="Reliability" value={consistency} />
        <Evolution label="Focus quality" value={Math.round(avgFocus * 10)} />
        <Evolution label="Recovery speed" value={resilience} />
        <Evolution label="Sleep discipline" value={Math.round((avgSleep / 8) * 100)} />
        <Evolution label="Honesty" value={avgHonesty} />
      </div>
    </Card>
  );
}
