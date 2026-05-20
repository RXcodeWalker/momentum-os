import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BarRow, Card, Pill, ScreenHeader, StatLabel } from "@/components/ui-bits";
import {
  Anchor,
  Activity,
  Shield,
  Focus,
  Compass,
  ArrowUpRight,
  TrendingUp,
  Zap,
  ChevronRight,
  Clock,
  Star,
  AlertTriangle,
  Plus,
  X,
  CheckCircle2,
  Brain,
  Layers,
  Sparkles,
  History,
  Target,
  LogOut,
  Flame,
  Dna,
} from "lucide-react";
import {
  useApp,
  useConsistency,
  useDeepWorkStats,
  useExecutionScore,
  useFakeProductivityFlags,
  useFocusAnalysis,
  useMaturityLevel,
  useMomentum,
  useResilience,
  useUserState,
  useStreakContext,
  useInsightEffectiveness,
} from "@/lib/store";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TapCard, Stagger, StaggerItem, FadeUp } from "@/lib/motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/identity")({
  head: () => ({
    meta: [
      { title: "Identity — Cadence" },
      {
        name: "description",
        content: "Your evolving operating profile: reliability, resilience, focus, discipline.",
      },
    ],
  }),
  component: Identity,
});

const MATURITY_ORDER = ["calibrating", "building", "consistent", "advanced", "resilient"] as const;

function Identity() {
  const navigate = useNavigate();
  const history = useApp((s) => s.history);
  const daysOnApp = useApp((s) => s.daysOnApp);
  const goals = useApp((s) => s.goals);
  const struggles = useApp((s) => s.struggles);
  const principles = useApp((s) => s.principles);
  const personalProofs = useApp((s) => s.personalProofs);
  const addPrinciple = useApp((s) => s.addPrinciple);
  const removePrinciple = useApp((s) => s.removePrinciple);
  const signOut = useApp((s) => s.signOut);

  const { level, label: maturityLabel, daysToNext, archetype } = useMaturityLevel();
  const { state, label: stateLabel, tone } = useUserState();
  const consistency28 = useConsistency(28);
  const score = useExecutionScore();
  const { delta } = useMomentum();
  const { score: resilience, avgRecoveryDays } = useResilience();
  const { flags } = useFakeProductivityFlags();
  const focusAnalysis = useFocusAnalysis();

  const [newPrinciple, setNewPrinciple] = useState("");
  const streakCtx = useStreakContext();
  const insightEffectiveness = useInsightEffectiveness();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const handleAddPrinciple = () => {
    if (newPrinciple.trim()) {
      addPrinciple(newPrinciple.trim());
      setNewPrinciple("");
    }
  };

  const { avgHours } = useDeepWorkStats();

  const traits = useMemo(() => {
    const h = history.slice(-28);
    const avgFocus = h.reduce((a, d) => a + d.focus, 0) / Math.max(1, h.length);
    const avgSleep = h.reduce((a, d) => a + d.sleepHours, 0) / Math.max(1, h.length);
    const disciplineDays = h.filter((d) => d.executionScore >= 65).length;

    const avgDeepMin = Math.round(avgHours * 60);

    return [
      {
        icon: Anchor,
        label: "Reliability",
        value: consistency28,
        note: `You follow through on commitments to yourself ${consistency28}% of the time.`,
        history: history.slice(-14).map((d) => d.executionScore),
      },
      {
        icon: Activity,
        label: "Execution",
        value: Math.round((disciplineDays / Math.max(1, h.length)) * 100),
        note: `${disciplineDays} high-execution days in the last 28.`,
        history: history.slice(-14).map((d) => d.executionScore),
      },
      {
        icon: Shield,
        label: "Resilience",
        value: resilience,
        note: `Average bounce-back after a setback is ${avgRecoveryDays} days.`,
        history: history.slice(-14).map((d) => (d.executionScore >= 50 ? 80 : 20)),
      },
      {
        icon: Focus,
        label: "Focus quality",
        value: Math.round(avgFocus * 10),
        note: `Average focus score is ${avgFocus.toFixed(1)}/10. Deep work average: ${avgDeepMin} min.`,
        history: history.slice(-14).map((d) => d.focus * 10),
      },
      {
        icon: Compass,
        label: "Sleep discipline",
        value: Math.round((avgSleep / 8) * 100),
        note: `Average ${avgSleep.toFixed(1)}h sleep. Regularity is your foundation.`,
        history: history.slice(-14).map((d) => Math.round((d.sleepHours / 8) * 100)),
      },
    ];
  }, [history, consistency28, resilience, avgRecoveryDays, avgHours]);

  const maturityIndex = MATURITY_ORDER.indexOf(level);

  const arcNarrative = {
    calibrating: {
      from: "motivated when inspired",
      to: "reliable when committed",
      action: "The foundation is forming. Every day you execute teaches the system who you are.",
    },
    building: {
      from: "reactive and overwhelmed",
      to: "proactive and focused",
      action: "Patterns are emerging. Reliability is becoming your competitive advantage.",
    },
    consistent: {
      from: "inconsistent but capable",
      to: "dependably consistent",
      action: "You've proven you can show up. Now the work is deepening quality over quantity.",
    },
    advanced: {
      from: "consistent under ideal conditions",
      to: "resilient under pressure",
      action:
        "The system is working. You're building the kind of discipline that compounds quietly.",
    },
    resilient: {
      from: "ambitious but fragile",
      to: "reliably execution-oriented",
      action: "You've built what most people only talk about. Keep going — it compounds from here.",
    },
  };
  const arc = arcNarrative[level];

  return (
    <div className="flex flex-col gap-8 pb-12">
      <ScreenHeader
        eyebrow={`Operating profile · Day ${daysOnApp}`}
        title="Identity"
        subtitle="Your evolution is measured by what you do, not what you feel."
        right={
          <div className="flex flex-col items-end">
            <Pill tone={tone}>{stateLabel}</Pill>
            <span className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wider">
              Score: {Math.round(score)}
            </span>
          </div>
        }
      />

      {/* Hero: Archetype & Status */}
      <section className="px-5">
        <FadeUp>
          <Card className="bg-gradient-to-br from-card to-secondary/30 relative overflow-hidden border-accent/10">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Brain className="h-24 w-24" />
            </div>
            <div className="relative flex flex-col gap-4">
              <div>
                <StatLabel>Current Archetype</StatLabel>
                <h2 className="font-display text-2xl text-foreground mt-1 flex items-center gap-2">
                  {archetype}
                  <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                </h2>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Maturity
                  </p>
                  <p className="text-sm font-medium text-accent">{maturityLabel}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Momentum
                  </p>
                  <p
                    className={`text-sm font-medium ${delta >= 0 ? "text-success" : "text-danger"}`}
                  >
                    {delta >= 0 ? "+" : ""}
                    {delta} pts
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </FadeUp>
      </section>

      {/* The Foundation: Goals & Struggles */}
      <section className="px-5 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Anchor className="h-4 w-4 text-accent" />
            The Foundation
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-secondary/10 p-4">
            <StatLabel className="mb-2">Building</StatLabel>
            <div className="flex flex-wrap gap-1.5">
              {goals.map((g) => (
                <span
                  key={g}
                  className="text-[11px] font-medium text-foreground bg-background/50 px-2 py-0.5 rounded-md border border-border/50"
                >
                  {g}
                </span>
              ))}
            </div>
          </Card>
          <Card className="bg-secondary/10 p-4">
            <StatLabel className="mb-2">Overcoming</StatLabel>
            <div className="flex flex-wrap gap-1.5">
              {struggles.map((s) => (
                <span
                  key={s}
                  className="text-[11px] font-medium text-muted-foreground bg-background/30 px-2 py-0.5 rounded-md border border-border/30"
                >
                  {s}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Biological Profile */}
      {focusAnalysis && (
        <section className="px-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Dna className="h-4 w-4 text-accent" />
              Biological Profile
            </h2>
          </div>
          <Card className="bg-gradient-to-br from-card to-accent/5 border-accent/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <StatLabel>Peak Execution Window</StatLabel>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-accent" />
                  <span className="font-display text-xl text-foreground">
                    {focusAnalysis.optimalWindow}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <StatLabel>Capacity</StatLabel>
                <p className="text-sm font-medium text-accent mt-0.5">{focusAnalysis.capacity}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-border/50 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Distraction Risk:{" "}
                <span
                  className={
                    focusAnalysis.distractionRisk.includes("High") ? "text-danger" : "text-success"
                  }
                >
                  {focusAnalysis.distractionRisk}
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                Biological Score:{" "}
                <span className="text-foreground font-medium">{focusAnalysis.score}</span>
              </span>
            </div>
          </Card>
        </section>
      )}

      {/* Evolution Arc */}
      <section className="px-5">
        <div className="mb-4 px-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Evolution Arc
          </h2>
        </div>
        <Card className="bg-gradient-surface">
          <div className="flex items-center justify-between mb-6">
            <StatLabel>Maturity Progression</StatLabel>
            {daysToNext > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {daysToNext} days to level-up
              </span>
            )}
          </div>

          <div className="relative flex items-center justify-between px-2">
            <div className="absolute top-4 left-4 right-4 h-px bg-border -z-10" />
            {MATURITY_ORDER.map((m, i) => {
              const reached = i <= maturityIndex;
              const current = i === maturityIndex;
              return (
                <div key={m} className="flex flex-col items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      current
                        ? "bg-accent text-accent-foreground ring-4 ring-accent/20"
                        : reached
                          ? "bg-accent/40 text-accent"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {reached && !current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-[9px] uppercase tracking-tighter font-medium ${current ? "text-accent" : "text-muted-foreground"}`}
                  >
                    {m}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Narrative Shift
            </p>
            <p className="font-display text-lg leading-snug text-foreground">
              From <span className="text-muted-foreground italic">"{arc.from}"</span> to{" "}
              <span className="text-accent italic font-semibold">"{arc.to}"</span>
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{arc.action}</p>
          </div>
        </Card>
      </section>

      {/* Operating Traits Grid */}
      <section className="px-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-tight text-foreground px-1 flex items-center gap-2">
          <Target className="h-4 w-4 text-accent" />
          Operating Traits
        </h2>
        <div className="grid gap-3">
          {traits.map((t, i) => {
            const Icon = t.icon;
            return (
              <TapCard key={i}>
                <Card className="bg-card/50">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-secondary text-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-foreground">{t.label}</span>
                        <span className="font-display text-xl text-accent">{t.value}</span>
                      </div>
                      <BarRow label="" value={t.value} tone="accent" />
                      <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                        {t.note}
                      </p>
                    </div>
                  </div>
                </Card>
              </TapCard>
            );
          })}
        </div>
      </section>

      {/* The Manifesto: Core Principles */}
      <section className="px-5 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent" />
            The Manifesto
          </h2>
          <Pill tone="neutral">{principles.length}</Pill>
        </div>
        <Card className="bg-secondary/10 border-dashed border-border/50">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {principles.map((p, i) => (
                <motion.div
                  key={p}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group flex items-center justify-between gap-3 bg-card p-3 rounded-xl hairline"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <p className="text-sm text-foreground leading-snug">{p}</p>
                  </div>
                  <button
                    onClick={() => removePrinciple(p)}
                    className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-danger"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
              <Input
                value={newPrinciple}
                onChange={(e) => setNewPrinciple(e.target.value)}
                placeholder="I do not negotiate with my alarm clock..."
                className="bg-background/50 border-none h-9 text-sm focus-visible:ring-1 focus-visible:ring-accent"
                onKeyDown={(e) => e.key === "Enter" && handleAddPrinciple()}
              />
              <Button
                size="icon"
                variant="secondary"
                onClick={handleAddPrinciple}
                className="h-9 w-9 flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Streak History */}
      <section className="px-5 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Flame className="h-4 w-4 text-warning" />
            Streak History
          </h2>
          {streakCtx.currentStreak >= 2 && (
            <Pill tone={streakCtx.atRisk ? "warning" : "success"}>
              {streakCtx.currentStreak}d active
            </Pill>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <Card className="text-center py-4">
            <p className="font-display text-2xl text-foreground">{streakCtx.execStreak}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Exec streak</p>
          </Card>
          <Card className="text-center py-4">
            <p className="font-display text-2xl text-foreground">{streakCtx.longest}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Best streak</p>
          </Card>
          <Card className="text-center py-4">
            <p className="font-display text-2xl text-foreground">{streakCtx.quickRecoveries}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Quick recoveries</p>
          </Card>
        </div>
        <Card className="bg-secondary/10">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {streakCtx.streakType === "resilience"
              ? `Resilience streak: ${streakCtx.resStreak} days without missing twice in a row. Never miss twice is your operating principle.`
              : streakCtx.milestoneNext <= 7
                ? `${streakCtx.milestoneLabel}. You're close.`
                : streakCtx.milestoneLabel}
          </p>
        </Card>
      </section>

      {/* Operating Protocols */}
      {insightEffectiveness.length > 0 && (
        <section className="px-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" />
              Operating Protocols
            </h2>
          </div>
          <div className="space-y-2.5">
            {insightEffectiveness.map((eff) => (
              <Card key={eff.insightId}>
                <p className="text-sm text-foreground leading-snug">"{eff.title}"</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      eff.verdict === "working"
                        ? "text-success bg-success/10"
                        : eff.verdict === "too-early"
                          ? "text-muted-foreground bg-secondary"
                          : eff.verdict === "not-working"
                            ? "text-danger bg-danger/10"
                            : "text-warning bg-warning/10"
                    }`}
                  >
                    {eff.verdict === "working"
                      ? "Working"
                      : eff.verdict === "too-early"
                        ? "Too early"
                        : eff.verdict === "not-working"
                          ? "Not working"
                          : "Plateau"}
                  </span>
                  {eff.verdict !== "too-early" && (
                    <span
                      className={`text-[10px] font-semibold ${eff.delta >= 0 ? "text-success" : "text-danger"}`}
                    >
                      {eff.delta >= 0 ? "+" : ""}
                      {eff.delta} pts
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    Day {eff.daysSinceCommit}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Execution Evidence (Read-only) */}
      <section className="px-5 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Execution Evidence
          </h2>
          <Link to="/dashboard" className="text-[11px] text-accent hover:underline">
            View all history
          </Link>
        </div>
        <Stagger>
          <div className="grid gap-2.5">
            {personalProofs.slice(0, 4).map((proof) => (
              <StaggerItem key={proof.id}>
                <Card className="py-3 px-4 flex items-center gap-3 hover:bg-secondary/20 transition-colors cursor-default">
                  <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center text-success">
                    <History className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{proof.text}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{proof.date}</span>
                      <span className="text-[10px] text-accent font-medium uppercase tracking-tighter">
                        {proof.trait}
                      </span>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </div>
        </Stagger>
      </section>

      {/* Shadow Profile */}
      {flags.length > 0 && (
        <section className="px-5">
          <div className="mb-3 px-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-danger" />
              Shadow Profile
            </h2>
            <Pill tone="danger">High Risk</Pill>
          </div>
          <div className="space-y-2">
            {flags.map((flag, i) => (
              <Card key={i} className="border-danger/10 bg-danger/5 py-3">
                <p className="text-xs leading-relaxed text-danger/90 font-medium">{flag}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <section className="px-5 pt-4 space-y-3">
        <Link
          to="/insights"
          className="group flex items-center justify-between hairline rounded-2xl bg-card px-4 py-4 hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-foreground">Behavioral Insights</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          to="/onboarding"
          className="group flex items-center justify-between hairline rounded-2xl bg-card px-4 py-4 hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
              <Target className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-foreground">Recalibrate Identity</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
        <button
          onClick={handleSignOut}
          className="group flex w-full items-center justify-between hairline rounded-2xl bg-card px-4 py-4 hover:bg-danger/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-danger/10 flex items-center justify-center text-danger">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-foreground">Sign Out</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      </section>
    </div>
  );
}
