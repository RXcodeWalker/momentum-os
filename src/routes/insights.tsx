import { createFileRoute, Link } from "@tanstack/react-router";
import { BarRow, Card, Pill, ScreenHeader, Sparkline, StatLabel } from "@/components/ui-bits";
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
  useMaturityLevel,
  useConsistency,
  useUserState,
  useResilience,
  useMomentum,
  useRootCauseAnalysis,
  useDeepWorkStats,
  useDistractionProfile,
  useDayOfWeekProfile,
  useBlockerPattern,
  useInsightEffectiveness,
  useTaskIntelligence,
} from "@/lib/store";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stagger, StaggerItem, TapCard } from "@/lib/motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Cadence" },
      {
        name: "description",
        content: "Behavioral patterns, earned insights, and anti-fake-productivity analysis.",
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
    inconsistent: {
      icon: TrendingDown,
      bg: "bg-warning/10",
      border: "border-warning/20",
      text: "text-warning",
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

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 mb-2"
    >
      <div
        className={`flex items-center gap-3 rounded-2xl border ${config.border} ${config.bg} px-4 py-3`}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-background/50 ${config.text}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
            Current Biological State
          </p>
          <p className={`font-display text-lg ${config.text}`}>{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ArchetypeCard() {
  const { archetype, level, daysToNext } = useMaturityLevel();
  const consistency = useConsistency(14);

  const progress = Math.min(100, Math.max(5, ((30 - daysToNext) / 30) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-5"
    >
      <TapCard className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-accent">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <StatLabel>Behavioral Archetype</StatLabel>
              <span className="text-[10px] font-medium text-accent uppercase tracking-tighter">
                {level}
              </span>
            </div>
            <h2 className="font-display text-2xl text-foreground">{archetype}</h2>
            <div className="mt-1 flex items-center gap-2">
              <Pill tone="accent">{consistency}% Consistency</Pill>
              <span className="text-xs text-muted-foreground">14d window</span>
            </div>
          </div>
        </div>

        {daysToNext > 0 && (
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              <span>Evolution Progress</span>
              <span>{daysToNext} days to next level</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        )}
      </TapCard>
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
  const insightEffectiveness = useInsightEffectiveness();
  const taskIntel = useTaskIntelligence();
  const last14 = history.slice(-14);

  const focusByHour = useMemo(() => {
    const avgFocus = last14.reduce((a, d) => a + d.focus, 0) / Math.max(1, last14.length);
    const avgSleep = last14.reduce((a, d) => a + d.sleepHours, 0) / Math.max(1, last14.length);
    const startHour = avgSleep > 7.5 ? 8 : 10;
    // Indices 0-12 represent 8am to 8pm (1 hour increments)
    const base = Array.from({ length: 13 }, (_, i) => {
      const hour = i + 8;
      // Bell curve centered at startHour + 1.5 with some evening secondary peak
      const morningPeak = 100 * Math.exp(-Math.pow(hour - (startHour + 1.5), 2) / 8);
      const eveningBump = 40 * Math.exp(-Math.pow(hour - 17, 2) / 4);
      return Math.max(20, morningPeak + eveningBump);
    });
    return base.map((v) => Math.round(v * (avgFocus / 7)));
  }, [last14]);

  const consistencyTrend = useMemo(() => {
    const firstHalf = history.slice(-28, -14);
    const secondHalf = history.slice(-14);
    const avg = (arr: typeof history) =>
      arr.reduce((a, b) => a + b.executionScore, 0) / Math.max(1, arr.length);
    const diff = avg(secondHalf) - avg(firstHalf);
    if (diff > 5) return "Rising trend";
    if (diff < -5) return "Declining trend";
    return "Stable trend";
  }, [history]);

  const { score: resilienceScore, avgRecoveryDays } = useResilience();
  const { delta: momentumDelta, trend: momentumTrend } = useMomentum();

  // Dynamic window info
  const avgSleep = history.slice(-7).reduce((a, d) => a + d.sleepHours, 0) / Math.max(1, 7);
  const startHour = avgSleep > 7.5 ? 8 : 10;
  const endHour = startHour + 3;
  const primeWindowStr = `${startHour}:00 AM – ${endHour}:30 AM`;

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

  return (
    <div className="flex flex-col gap-6 pb-12">
      <ScreenHeader
        eyebrow={`Week ${getWeekNum()} · ${formatRange()}`}
        title="Diagnostic"
        subtitle="Moving from passive tracking to active behavioral engineering."
        right={
          <Link
            to="/weekly"
            className="hairline rounded-full px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Weekly &rarr;
          </Link>
        }
      />

      <CurrentStateBanner />
      <ArchetypeCard />

      <Stagger>
        {/* CHAPTER 1: THE PULSE */}
        <StaggerItem>
          <section className="px-5 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-1 w-1 rounded-full bg-accent" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Phase 1: Momentum & Resilience
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Card>
                <StatLabel>Momentum</StatLabel>
                <p className="font-display mt-1 text-3xl num-tabular text-foreground">
                  {momentumDelta > 0 ? "+" : ""}
                  {momentumDelta}
                  <span className="text-base text-muted-foreground">pts</span>
                </p>
                <div
                  className={`mt-1 flex items-center gap-1 text-[11px] ${momentumTrend === "down" ? "text-danger" : momentumTrend === "up" ? "text-success" : "text-muted-foreground"}`}
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
              </Card>
              <Card>
                <StatLabel>Resilience</StatLabel>
                <p className="font-display mt-1 text-3xl num-tabular text-foreground">
                  {resilienceScore}
                  <span className="text-base text-muted-foreground">/100</span>
                </p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-success">
                  <TrendingUp className="h-3 w-3" /> {avgRecoveryDays}d avg recovery
                </div>
              </Card>
            </div>
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <StatLabel>Consistency · 28 Days</StatLabel>
                <span className="text-[10px] text-muted-foreground">{consistencyTrend}</span>
              </div>
              <Sparkline data={history.slice(-28).map((d) => d.executionScore)} accent />
              <div className="mt-4">
                <ExecutionHeatmap weeks={4} />
              </div>
            </Card>
          </section>
        </StaggerItem>

        {/* CHAPTER 2: ROOT CAUSE ANALYSIS */}
        <StaggerItem>
          <section className="px-5 mt-4 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-1 w-1 rounded-full bg-warning" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Phase 2: Root Cause Diagnostics
              </h3>
            </div>

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

            <RootCauseDiagnostics />

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

        {/* CHAPTER 3: DEEP PATTERNS */}
        <StaggerItem>
          <section className="px-5 mt-4 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-1 w-1 rounded-full bg-success" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Phase 3: Behavioral Breakthroughs
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

            {/* Focus by hour */}
            <Card>
              <div className="flex items-center justify-between">
                <StatLabel>Neurological Prime Window</StatLabel>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Zap className="h-3 w-3" />
                </div>
              </div>
              <div className="mt-4 flex h-24 items-end gap-1">
                {focusByHour.map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-accent/30 transition-all hover:bg-accent"
                    style={{
                      height: `${Math.min(100, v)}%`,
                      opacity: v > 70 ? 1 : 0.4,
                    }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground uppercase tracking-tighter">
                <span>8a</span>
                <span>12p</span>
                <span>4p</span>
                <span>8p</span>
                <span>12a</span>
              </div>
              <div className="mt-4 rounded-xl bg-accent/5 p-3 border border-accent/10">
                <p className="text-xs leading-relaxed text-foreground/80">
                  <span className="font-bold text-accent">{primeWindowStr}</span> is your optimal
                  cognitive window. Deep work output is significantly higher during this block.
                </p>
              </div>
            </Card>
          </section>
        </StaggerItem>
      </Stagger>

      {/* Weekly report CTA */}
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

function getWeekNum() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((+now - +start) / 86400000 + start.getDay() + 1) / 7);
}
function formatRange() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const f = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${f(monday)}–${f(sunday).split(" ")[1]}`;
}
