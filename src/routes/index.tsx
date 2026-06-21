import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, Pill, Ring, ScreenHeader, StatLabel } from "@/components/ui-bits";
import {
  Check,
  Crown,
  Plus,
  RotateCcw,
  Sparkles,
  Sunrise,
  Sun,
  Moon,
  Calendar,
  Zap,
  Dumbbell,
  Wind,
  AlertTriangle,
  TrendingDown,
  BookOpen,
  Shield,
  X,
} from "lucide-react";
import {
  useApp,
  useConsistency,
  useExecutionScore,
  useMomentum,
  useLatestInsight,
  usePredictiveRecoveryAlert,
  useTomorrowBriefing,
  useTaskIntelligence,
  useBlockerPattern,
  useInsightEffectiveness,
  useScoreVelocity,
} from "@/lib/store";
import { useState, useEffect } from "react";
import { Stagger, StaggerItem, TapCard, FadeUp } from "@/lib/motion";
import { BehavioralNote } from "@/components/cards/BehavioralNote";
import { InterventionSurface } from "@/components/cards/InterventionSurface";
import { useBehavioralPipeline } from "@/hooks/useBehavioralPipeline";
import { useMorningCalibration } from "@/hooks/useMorningCalibration";
import { MorningCalibrationSheet } from "@/components/morning/MorningCalibrationSheet";
import type { BehavioralView } from "@/hooks/internal/contracts";
import { useFocusEnvironment } from "@/hooks/internal/useFocusEnvironment";
import type { FocusEnvironmentView } from "@/core/contracts/focus/environment";
import { useFocusInactivityTimer } from "@/hooks/useFocusInactivityTimer";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { MetricSurface } from "@/components/MetricSurface";
import { useDataReadiness } from "@/lib/maturity";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Cadence" },
      {
        name: "description",
        content: "Your execution score, momentum, and focus goals for today.",
      },
    ],
  }),
  component: Home,
});

const TREND_DAYS = 14;
const MAX_TASKS = 5;

function Home() {
  const onboarded = useApp((s) => s.onboarded);
  const navigate = useNavigate();
  useEffect(() => {
    if (!onboarded) navigate({ to: "/onboarding" });
  }, [onboarded, navigate]);

  const behavioral = useBehavioralPipeline();
  const { shell, heroTheme } = behavioral;

  const user = useApp((s) => s.user);
  const score = useExecutionScore();
  const { delta } = useMomentum();
  const consistency = useConsistency(TREND_DAYS);
  const tasks = useApp((s) => s.tasks);
  const toggleTask = useApp((s) => s.toggleTask);
  const dismissInsight = useApp((s) => s.dismissInsight);
  const recoveryMode = useApp((s) => s.recoveryMode);
  const recoveryReason = useApp((s) => s.recoveryReason);
  const recoveryPlan = useApp((s) => s.recoveryPlan);
  const history = useApp((s) => s.history);
  const { trend } = useMomentum();
  const aiAlert = usePredictiveRecoveryAlert();

  const completed = tasks.filter((t) => t.done).length;

  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const phase: "morning" | "midday" | "evening" =
    hour < 11 ? "morning" : hour < 17 ? "midday" : "evening";

  const subtitle = (() => {
    if (!behavioral.ready) return "Cadence learns from what you do. Today is a clean page.";
    const mode = behavioral.state.mode;
    const traj = behavioral.state.trajectory;
    if (mode === "RECOVERY")
      return "You're in recovery. Smaller surface, faster reps. Three things, then rest.";
    if (mode === "EXPANDING")
      return "You're in a peak window. Stretch into deeper work — protect sleep at all costs.";
    if (mode === "FOCUSED") {
      if (traj === "EXPANDING") return "Momentum is building. Protect depth today.";
      if (traj === "FRAGILE")  return "Hold the line. Consistency over ambition today.";
      if (traj === "CONTRACTING") return "Friction is up. One thing done well outweighs three started.";
      return "Steady hand today. Don't over-plan — execute three things well.";
    }
    // STABILIZING
    if (traj === "EXPANDING")   return "Rebuilding. Each completed task compounds forward.";
    if (traj === "FRAGILE")     return "Fragile ground. Prioritize finish over start today.";
    if (traj === "CONTRACTING") return "Hold capacity. Protect sleep and the smallest win.";
    return "Steady hand today. Show up, don't over-plan.";
  })();

  const momentumLabel = recoveryMode
    ? "In recovery"
    : trend === "up"
      ? "Building back"
      : trend === "down"
        ? "Slipping"
        : "Steady";

  const applyMorningInputs = useApp((s) => s.applyMorningInputs);
  const commitMorningTask = useApp((s) => s.commitMorningTask);
  const skipMorningCalibration = useApp((s) => s.skipMorningCalibration);
  const morningCal = useMorningCalibration();

  const focusEnv = useFocusEnvironment();
  const enterFocusEnvironment = useApp((s) => s.enterFocusEnvironment);
  const exitFocusEnvironment = useApp((s) => s.exitFocusEnvironment);
  useFocusInactivityTimer();

  // Held level-2 interventions surface after focus exits — persisted in store so they survive navigation
  const pendingPostFocusInterventions = useApp((s) => s.focusEnvironment.pendingPostFocusInterventions);
  const clearPostFocusInterventions = useApp((s) => s.clearPostFocusInterventions);

  const latestInsight = useLatestInsight();
  const tomorrowBriefing = useTomorrowBriefing();
  const acceptTomorrowPlan = useApp((s) => s.acceptTomorrowPlan);
  const checkIns = useApp((s) => s.checkIns);
  const insights = useApp((s) => s.insights);
  const blockerPattern = useBlockerPattern();
  const insightEffectiveness = useInsightEffectiveness();
  const velocity = useScoreVelocity();
  const todayScoreReadiness = useDataReadiness("todayScore");
  const momentumReadiness = useDataReadiness("momentum");
  const consistencyReadiness = useDataReadiness("consistency");

  // Yesterday's context for morning continuity
  const yesterdayCheckIn = checkIns.length >= 2 ? checkIns[checkIns.length - 2] : null;

  // Active committed insight with a verdict (working or too-early, not "not-working")
  const committedInsightCard = insightEffectiveness.find(
    (e) => e.verdict === "working" || e.verdict === "too-early",
  );
  const committedInsightData = committedInsightCard
    ? insights.find((i) => i.id === committedInsightCard.insightId)
    : null;

  const recoveryDay = recoveryPlan?.startedAt
    ? Math.floor((Date.now() - new Date(recoveryPlan.startedAt).getTime()) / 86400000) + 1
    : 1;

  // F-19/22: behavior-keyed date comparisons
  const todayDate = new Date().toISOString().slice(0, 10);
  const hasCheckedInToday = checkIns.some((c) => c.date === todayDate);

  // F-20: dismiss state for yesterday's signal card (ephemeral — session only)
  const [dismissedYesterday, setDismissedYesterday] = useState(false);

  // F-22: card budget
  // Level-3 intervention renders as modal overlay (separate from budget)
  // Level 1–2 intervention competes for priority-1 budget slot
  const budgetInterventionActive =
    !focusEnv.active &&
    behavioral.interventions.highestLevel >= 1 &&
    behavioral.interventions.highestLevel < 3;
  const modalInterventionActive = behavioral.interventions.highestLevel >= 3;

  // Priority-ordered candidates — first 3 active ones render
  const budgetPriority: Array<[string, boolean]> = [
    ["intervention", budgetInterventionActive],
    ["recovery",     !!(recoveryMode && !focusEnv.active)],
    ["aiAlert",      !!(aiAlert.detected && !focusEnv.active)],
    ["committedTask", !!(morningCal.isComplete && morningCal.committedTask)],
    ["briefing",     !!(shell.surfaceLevel !== "minimal" && phase === "morning" && tomorrowBriefing.hasPlan && !morningCal.isComplete && !focusEnv.active)],
    ["velocity",     !!(velocity.declining && behavioral.tasks.workload.guidance === "reduce" && shell.surfaceLevel !== "minimal" && !focusEnv.active)],
    ["insight",      !!(shell.surfaceLevel !== "minimal" && committedInsightData && committedInsightCard && !focusEnv.active)],
    ["blocker",      !!(shell.surfaceLevel === "full" && blockerPattern.streak && blockerPattern.streak.days >= 3 && !focusEnv.active)],
    ["yesterday",    !!(shell.surfaceLevel !== "minimal" && phase === "morning" && !morningCal.isComplete && !focusEnv.active && !dismissedYesterday && yesterdayCheckIn && (yesterdayCheckIn.reflection || yesterdayCheckIn.tomorrowFocus))],
  ];
  const budgetSlots = new Set(
    budgetPriority.filter(([, active]) => active).slice(0, 3).map(([key]) => key),
  );

  // Auto-exit focus environment when mode transitions to RECOVERY (§3.4)
  useEffect(() => {
    if (focusEnv.active && behavioral.state.mode === "RECOVERY" && focusEnv.primaryTask === null) {
      exitFocusEnvironment("state-transition", focusEnv.heldInterventions);
    }
  }, [focusEnv.active, behavioral.state.mode, focusEnv.primaryTask, focusEnv.heldInterventions, exitFocusEnvironment]);

  // Auto-exit focus environment when OVERLOAD fires while active (§9.2)
  useEffect(() => {
    if (focusEnv.active) {
      const hasOverload = behavioral.interventions.active.some(
        (i) => i.type === "OVERLOAD" && i.level >= 1,
      );
      if (hasOverload) exitFocusEnvironment("state-transition", focusEnv.heldInterventions);
    }
  }, [focusEnv.active, behavioral.interventions.active, focusEnv.heldInterventions, exitFocusEnvironment]);

  return (
    <div className="flex flex-col gap-5 pb-8 lg:gap-8 lg:pb-12">
      {/* Morning calibration sheet */}
      <AnimatePresence>
        {morningCal.shouldShow && (
          <MorningCalibrationSheet
            onInputsApplied={applyMorningInputs}
            onComplete={(committedTaskId, intentionText) => {
              commitMorningTask(committedTaskId, intentionText);
            }}
            onSkip={skipMorningCalibration}
          />
        )}
      </AnimatePresence>

      <ScreenHeader
        eyebrow={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}
        title={`${greeting}, ${user.split(" ")[0]}.`}
        subtitle={subtitle}
        right={
          <div className="flex items-center gap-2">
            {morningCal.isComplete && (
              <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-[11px] font-medium text-success">
                <Sunrise className="h-3 w-3" />
                Calibrated
              </div>
            )}
            {behavioral.ready && (
              <div className="hidden lg:flex items-center gap-2">
                <Pill tone={trajectoryTone(behavioral.state.trajectory)}>
                  {trajectoryLabel(behavioral.state.trajectory)}
                </Pill>
              </div>
            )}
            <Link
              to="/identity"
              className="hairline rounded-full px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Profile
            </Link>
          </div>
        }
      />

      <Stagger className="grid grid-cols-1 gap-4 px-5 lg:px-0 lg:grid-cols-12 lg:gap-6" gap={0.07}>
        <StaggerItem className="lg:col-span-12">
          {/* Hero card — full / compressed / absent based on focus environment state */}
          {focusEnv.active && !focusEnv.heroCompressed ? null : focusEnv.heroCompressed ? (
            /* Compressed hero bar: headline only, no ring, no sparkline */
            <div className="relative overflow-hidden rounded-2xl bg-secondary/60 px-5 py-3 hairline flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground truncate">
                {behavioral.ready && behavioral.state.interpretation.headline
                  ? behavioral.state.interpretation.headline
                  : "Execution in progress."}
              </p>
              <button
                onClick={() => exitFocusEnvironment("interruption", focusEnv.heldInterventions)}
                className="ml-4 flex-none text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Return to full view
              </button>
            </div>
          ) : (
            /* Full hero */
            <div className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${heroTheme} p-8 hairline shadow-elegant lg:p-12`}>
              <div className="bg-glow absolute inset-0 animate-pulse-glow" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${behavioral.state.guidance.tone}::${behavioral.state.interpretation.headline}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.35 }}
                  className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-10"
                >
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2.5 w-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_var(--accent)]`}
                      />
                      <StatLabel className="text-accent font-bold tracking-[0.2em] uppercase text-[11px]">
                        Active Phase: {phase}
                      </StatLabel>
                    </div>

                    <div>
                      <h1 className="text-4xl lg:text-5xl font-display font-semibold text-foreground tracking-tight leading-tight">
                        {behavioral.ready && behavioral.state.interpretation.headline
                          ? behavioral.state.interpretation.headline
                          : phase === "morning"
                            ? "Calibrate Your Day."
                            : phase === "midday"
                              ? "Deep Execution."
                              : "Reflect and Reset."}
                      </h1>
                      <p className="mt-4 text-muted-foreground text-base lg:text-lg max-w-[45ch] leading-relaxed">
                        {behavioral.ready && behavioral.state.interpretation.supporting.length > 0
                          ? behavioral.state.interpretation.supporting[0]
                          : subtitle}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-2">
                      {behavioral.ready && (
                        <Pill
                          tone={trajectoryTone(behavioral.state.trajectory)}
                          className="px-4 py-1.5 text-xs font-bold"
                        >
                          {trajectoryLabel(behavioral.state.trajectory)}
                        </Pill>
                      )}
                      {consistencyReadiness.hasMinimum && behavioral.execution.advancement.showConsistencyPill && (
                        <Pill tone="accent" className="px-4 py-1.5 text-xs font-bold">
                          {consistency}% Consistency
                        </Pill>
                      )}
                      {behavioral.shell.focusMode && (
                        <Pill tone="accent" className="px-4 py-1.5 text-xs font-bold">
                          Deep Work Active
                        </Pill>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center lg:items-end">
                    {todayScoreReadiness.hasMinimum ? (
                      <div className="relative">
                        <Ring value={score} size={200} stroke={16} label="Score" sub="Today" />
                        {delta !== 0 && momentumReadiness.hasMinimum && behavioral.execution.advancement.showMomentumDelta && (
                          <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className={`absolute -right-3 -top-3 flex h-14 w-14 items-center justify-center rounded-full hairline bg-card text-xs font-black shadow-2xl ${delta > 0 ? "text-success" : "text-danger"}`}
                          >
                            {delta > 0 ? "+" : ""}
                            {delta}
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div className="hairline rounded-3xl px-6 py-8 text-center max-w-[260px]">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">
                          Today's score
                        </p>
                        <p className="mt-3 text-sm text-foreground leading-relaxed">
                          Appears after tonight's reflection.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {momentumReadiness.hasMinimum && behavioral.execution.advancement.showSparkline && (
                <div className="mt-12 pt-8 border-t border-border relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                      Execution Trend · {TREND_DAYS}d
                    </span>
                    <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">
                      {Math.round((completed / Math.max(1, tasks.length)) * 100)}% Today
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-1.5 h-12">
                    {history.slice(-TREND_DAYS).map((d, i) => {
                      const v = d.executionScore;
                      const isToday = i === TREND_DAYS - 1;
                      const tone =
                        v >= 70
                          ? "var(--accent)"
                          : v >= 50
                            ? "color-mix(in oklab, var(--accent) 45%, transparent)"
                            : "color-mix(in oklab, var(--danger) 55%, transparent)";
                      return (
                        <motion.div
                          key={d.date}
                          initial={{ height: 4, opacity: 0 }}
                          animate={{ height: `${4 + (v / 100) * 36}px`, opacity: 1 }}
                          transition={{
                            duration: 0.6,
                            delay: 0.2 + i * 0.03,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className={`flex-1 rounded-full ${isToday ? "shadow-glow" : ""}`}
                          style={{
                            background: tone,
                            border: isToday ? "1.5px solid var(--accent)" : "none",
                          }}
                        />
                      );
                    })}
                  </div>

                  {tasks.length > 0 && (
                    <div className="mt-8 h-2.5 w-full rounded-full bg-secondary overflow-hidden hairline">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(completed / Math.max(1, tasks.length)) * 100}%` }}
                        transition={{ type: "spring", stiffness: 80, damping: 20 }}
                        className="h-full bg-gradient-accent shadow-glow"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </StaggerItem>

        {tasks.length > 0 && shell.surfaceLevel !== "minimal" && !focusEnv.active && (
          <StaggerItem className="lg:col-span-12">
            <Card className="hairline bg-card/50 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <StatLabel className="tracking-widest uppercase text-[10px] font-bold">
                  Today's Journey
                </StatLabel>
                <span className="text-[10px] text-accent font-bold uppercase tracking-widest">
                  {phase} Session Active
                </span>
              </div>
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <FlowRow
                  icon={<Sunrise className="h-4 w-4" />}
                  label="Morning Calibration"
                  desc="Set 3 priorities · energy check"
                  active={phase === "morning" && !morningCal.isComplete && !morningCal.wasSkipped}
                  done={morningCal.isComplete || morningCal.wasSkipped}
                  onClick={() => {
                    if (tasks.length === 0) {
                      toast("Ready to calibrate?", { description: "Add your first priority below." });
                    } else {
                      toast("Calibration complete", { description: "You have clear focus for the day." });
                    }
                  }}
                />
                <FlowRow
                  icon={<Sun className="h-4 w-4" />}
                  label="Deep Execution"
                  desc="High focus · zero distractions"
                  active={phase === "midday"}
                  done={phase === "evening"}
                  onClick={() => {
                    toast.success("Execution Window Active", {
                      description: "Protect this time from interruptions.",
                    });
                  }}
                />
                <FlowRow
                  icon={<Moon className="h-4 w-4" />}
                  label="Evening Reflection"
                  desc="Wins · recovery preparation"
                  active={phase === "evening" && !hasCheckedInToday}
                  done={hasCheckedInToday}
                  to="/check-in"
                />
              </div>
            </Card>
          </StaggerItem>
        )}
      </Stagger>

      {/* ── Card budget: max 3 informational cards ──────────────────────────────
          Priority order: intervention → recovery → aiAlert → committedTask →
          briefing → velocity → insight → blocker → yesterday.
          Only the first 3 active candidates render (budgetSlots Set).          */}

      {budgetSlots.has("intervention") && (
        <section className="px-5 lg:px-0">
          {/* Priority-tier resolution happened upstream; we display active[0]. */}
          <InterventionSurface
            surface={behavioral.interventions.ui.surface}
            intervention={behavioral.interventions.active[0]}
          />
        </section>
      )}

      {budgetSlots.has("recovery") && (
        <section className="px-5 lg:px-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Link to="/recovery" className="group block">
              <Card className="bg-gradient-surface border-warning/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <StatLabel>Recovery protocol active</StatLabel>
                      <Pill tone="warning" className="text-[9px] h-4 py-0">
                        {recoveryReason || "System reset"}
                      </Pill>
                    </div>
                    <p className="font-display mt-1 text-lg text-foreground">
                      {recoveryPlan?.protocol
                        ? `${recoveryPlan.protocol.charAt(0).toUpperCase()}${recoveryPlan.protocol.slice(1)}`
                        : "Tactical"}{" "}
                      stabilization in progress
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className={`h-1.5 w-6 rounded-full ${i < recoveryDay ? "bg-warning" : "bg-secondary"}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Day {Math.min(3, recoveryDay)}:{" "}
                        {recoveryPlan?.timeline[Math.min(2, recoveryDay - 1)]?.focus || "Stabilize"}
                      </span>
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning group-hover:bg-warning/20 transition-colors">
                    <RotateCcw className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        </section>
      )}

      {budgetSlots.has("aiAlert") && (
        <section className="px-5 lg:px-0">
          <BehavioralNote
            title={aiAlert.title || ""}
            body={aiAlert.body || ""}
            confidence={aiAlert.confidence}
          />
        </section>
      )}

      {budgetSlots.has("committedTask") && morningCal.committedTask && (
        <section className="px-5 lg:px-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="border-accent/20 bg-accent/5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/20 text-accent flex-none">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-accent font-bold">Committed start</p>
                  <p className="text-sm font-semibold text-foreground truncate mt-0.5">
                    {morningCal.committedTask.label}
                  </p>
                </div>
              </div>
              {morningCal.calibration?.intentionText && (
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed pl-11 italic">
                  "{morningCal.calibration.intentionText}"
                </p>
              )}
            </Card>
          </motion.div>
        </section>
      )}

      {budgetSlots.has("briefing") && (
        <section className="px-5 lg:px-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="border-success/20 bg-success/5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-success/20 text-success">
                    <Sunrise className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-success font-bold">Morning Briefing</p>
                    {tomorrowBriefing.northStar && (
                      <p className="font-display text-base text-foreground leading-snug mt-0.5">
                        "{tomorrowBriefing.northStar}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{tomorrowBriefing.insight}</p>
              {tomorrowBriefing.suggestedTasks.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {tomorrowBriefing.suggestedTasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                      <div className="h-1.5 w-1.5 rounded-full bg-success flex-none" />
                      {t.label}
                      <span className="text-muted-foreground/60 ml-auto text-[10px]">{t.estMin}m</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={acceptTomorrowPlan}
                className="w-full text-center text-xs font-semibold text-success py-2 rounded-xl bg-success/10 hover:bg-success/20 transition-colors"
              >
                Accept plan for today
              </button>
            </Card>
          </motion.div>
        </section>
      )}

      {budgetSlots.has("velocity") && (
        <section className="px-5 lg:px-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Card className="border-warning/30 bg-warning/5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-warning/20 text-warning">
                  <TrendingDown className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-warning font-bold mb-1">Momentum at risk</p>
                  <p className="text-sm text-foreground leading-relaxed">
                    Score has declined {velocity.dropPts} pts over {velocity.dayCount} days — a pattern worth watching.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>
      )}

      {budgetSlots.has("insight") && committedInsightData && committedInsightCard && (
        <section className="px-5 lg:px-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="border-accent/20 bg-accent/5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/20 text-accent">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] uppercase tracking-widest text-accent font-bold">Active rule</p>
                    <span className="text-[10px] text-muted-foreground">Day {committedInsightCard.daysSinceCommit + 1}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug mb-1">{committedInsightData.title}</p>
                  {committedInsightCard.verdict === "working" ? (
                    <p className="text-[11px] text-success">+{committedInsightCard.delta} pts avg since commit — this is working.</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Building baseline — check back in {7 - committedInsightCard.daysSinceCommit} days.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </section>
      )}

      {budgetSlots.has("blocker") && blockerPattern.streak && (
        <section className="px-5 lg:px-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="border-warning/20 bg-warning/5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-warning/20 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-warning font-bold mb-1">Pattern detected</p>
                  <p className="text-sm text-foreground leading-relaxed">
                    <span className="font-semibold capitalize">{blockerPattern.streak.type}</span>{" "}
                    has blocked tasks {blockerPattern.streak.days} days in a row.{" "}
                    {blockerPattern.recommendation}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>
      )}

      {budgetSlots.has("yesterday") && yesterdayCheckIn && (
        <section className="px-5 lg:px-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="border-foreground/8 bg-card/50">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                      Yesterday's note
                    </p>
                    <button
                      onClick={() => setDismissedYesterday(true)}
                      className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                      aria-label="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {yesterdayCheckIn.tomorrowFocus && (
                    <p className="text-sm text-foreground leading-snug">
                      You planned to focus on:{" "}
                      <span className="font-semibold">"{yesterdayCheckIn.tomorrowFocus}"</span>
                    </p>
                  )}
                  {yesterdayCheckIn.reflection && (
                    <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-border pl-3 italic">
                      "{yesterdayCheckIn.reflection}"
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </section>
      )}

      {/* Level-3 modal intervention — overlay, independent of card budget */}
      {modalInterventionActive && (
        <InterventionSurface
          surface="modal"
          intervention={behavioral.interventions.active.find((i) => i.level === 3)}
        />
      )}

      {/* Level-2 interventions held during focus — surfaced on exit, persisted across navigation */}
      {pendingPostFocusInterventions.length > 0 && (
        <section className="px-5 lg:px-0">
          <InterventionSurface
            surface="banner"
            intervention={pendingPostFocusInterventions[0]}
          />
          <button
            onClick={clearPostFocusInterventions}
            className="mt-2 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            Dismiss
          </button>
        </section>
      )}

      <section className="px-5 lg:px-0">
        <TasksSection
          tasks={tasks}
          toggleTask={toggleTask}
          completed={completed}
          behavioral={behavioral}
          focusEnv={focusEnv}
          onEnterFocus={() => enterFocusEnvironment("manual")}
          onExitFocus={() => exitFocusEnvironment("interruption", focusEnv.heldInterventions)}
        />
      </section>

      {shell.surfaceLevel !== "minimal" && latestInsight && !focusEnv.active && (
        <div className="px-5 lg:px-0">
          <BehavioralNote
            title={latestInsight.title}
            body={latestInsight.body}
            onDismiss={() => dismissInsight(latestInsight.id)}
          />
        </div>
      )}

      {shell.surfaceLevel === "full" && !focusEnv.active && <Stagger className="px-5 lg:px-0 grid grid-cols-2 gap-2.5 lg:grid-cols-4" gap={0.05}>
        {[
          { to: "/dashboard", label: "Command center", desc: "Deep analytics", icon: Sparkles },
          { to: "/weekly", label: "Weekly report", desc: "Patterns this week", icon: Sparkles },
          { to: "/circles", label: "Trusted circles", desc: "Proof-based", icon: Sparkles },
          { to: "/premium", label: "Cadence Pro", desc: "Adaptive coaching", icon: Crown },
        ].map((q) => {
          const Icon = q.icon;
          return (
            <StaggerItem key={q.to}>
              <Link to={q.to}>
                <TapCard>
                  <Card>
                    <Icon className="h-4 w-4 text-accent" />
                    <p className="mt-2 text-sm font-medium text-foreground">{q.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{q.desc}</p>
                  </Card>
                </TapCard>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>}

      {phase === "evening" && (
        <section className="px-5 lg:px-0">
          <Link to="/check-in">
            <motion.button
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.985 }}
              className="relative w-full overflow-hidden rounded-2xl bg-foreground py-4 text-sm font-semibold text-background lg:max-w-md"
            >
              <span className="relative z-10">Start evening check-in</span>
              <span className="absolute inset-0 animate-shimmer" />
            </motion.button>
          </Link>
        </section>
      )}
    </div>
  );
}

function FlowRow({
  icon,
  label,
  desc,
  active,
  done,
  to,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  active?: boolean;
  done?: boolean;
  to?: string;
  onClick?: () => void;
}) {
  const inner = (
    <div
      onClick={onClick}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
        onClick ? "cursor-pointer" : ""
      } ${
        active
          ? "bg-secondary text-foreground"
          : done
            ? "text-muted-foreground/60"
            : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span
        className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${active ? "bg-accent/15 text-accent" : done ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}
      >
        {done && !active ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] opacity-80">{desc}</p>
      </div>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />}
    </div>
  );
  return <li>{to ? <Link to={to}>{inner}</Link> : inner}</li>;
}

function TasksSection({
  tasks,
  toggleTask,
  completed,
  behavioral,
  focusEnv,
  onEnterFocus,
  onExitFocus,
}: {
  tasks: ReturnType<typeof useApp.getState>["tasks"];
  toggleTask: (id: string) => void;
  completed: number;
  behavioral: BehavioralView;
  focusEnv: FocusEnvironmentView;
  onEnterFocus: () => void;
  onExitFocus: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"deep" | "shallow" | "movement" | "wind-down">("deep");
  const addTask = useApp((s) => s.addTask);
  const rescheduleTask = useApp((s) => s.rescheduleTask);
  const resetDemo = useApp((s) => s.resetDemo);
  const acknowledgeIntervention = useApp((s) => s.acknowledgeIntervention);
  const taskIntel = useTaskIntelligence();
  const stretchOpp = behavioral.execution.stretchOpportunity;

  const surfaceLevel = behavioral.shell.surfaceLevel;
  const pipelineReady = behavioral.ready;
  const { visibleTaskIds: pipelineVisibleIds } = behavioral.tasks.visibility;
  const { visibleTaskLimit, overCapacity, guidance: workloadGuidance } = behavioral.tasks.workload;

  const incompleteTasks = tasks.filter((t) => !t.done);

  // Focus environment overrides task visibility
  const visibleIncompleteTasks = (() => {
    if (focusEnv.active) {
      const ids = [focusEnv.primaryTask?.id, focusEnv.secondaryTask?.id].filter(Boolean) as string[];
      return ids.length > 0
        ? incompleteTasks.filter((t) => ids.includes(t.id))
        : focusEnv.primaryTask
          ? incompleteTasks.filter((t) => t.id === focusEnv.primaryTask!.id)
          : [];
    }
    if (surfaceLevel === "minimal") {
      const pt = behavioral.tasks.primaryTask;
      return pt ? incompleteTasks.filter((t) => t.id === pt.id) : [];
    }
    if (pipelineReady) {
      const allowedSet = new Set(pipelineVisibleIds);
      const filtered = allowedSet.size > 0
        ? incompleteTasks.filter((t) => allowedSet.has(t.id))
        : incompleteTasks;
      return filtered.slice(0, visibleTaskLimit);
    }
    return incompleteTasks;
  })();

  const hiddenCount = focusEnv.active
    ? focusEnv.hiddenCount
    : Math.max(0, incompleteTasks.length - visibleIncompleteTasks.length);

  const visibleTaskIdSet = new Set([
    ...visibleIncompleteTasks.map((t) => t.id),
    // Done tasks always visible in standard view; hidden during focus
    ...(focusEnv.active ? [] : tasks.filter((t) => t.done).map((t) => t.id)),
  ]);

  const nextTask = visibleIncompleteTasks[0] ?? null;

  // Auto-exit focus when primary task is completed (§3.1)
  useEffect(() => {
    if (focusEnv.active && focusEnv.primaryTask && tasks.find((t) => t.id === focusEnv.primaryTask!.id)?.done) {
      onExitFocus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, focusEnv.active, focusEnv.primaryTask]);

  return (
    <div className="space-y-6">
      {/* Focus environment entry affordance — visible card when auto-suggested, subtle link otherwise */}
      {focusEnv.entryAllowed && !focusEnv.active && (
        focusEnv.entryAutoSuggested ? (
          <div className="hairline rounded-2xl px-4 py-3 flex items-center justify-between bg-card/60 backdrop-blur-sm">
            <p className="text-sm text-foreground">Clear the surface?</p>
            <button
              onClick={onEnterFocus}
              className="text-xs font-semibold text-accent hover:opacity-80 transition-opacity"
            >
              Begin
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end">
            <button
              onClick={onEnterFocus}
              className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Begin
            </button>
          </div>
        )
      )}

      {behavioral.execution.deepWorkNudge.show && !focusEnv.active && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/5 border border-accent/15">
            <Zap className="h-3.5 w-3.5 text-accent flex-none" />
            <p className="text-xs text-foreground flex-1">Deep work window active. Start your first task.</p>
            <button onClick={() => acknowledgeIntervention('DEEP_WORK_NUDGE')} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {nextTask && (
          <motion.div
            key="focus-mode"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-accent/5 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-500" />
            <Card className="relative bg-card/80 backdrop-blur-md border-accent/20 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent animate-pulse" />
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
                    Focusing on
                  </span>
                </div>
                <Pill tone="accent" className="text-[9px] px-2 py-0.5 uppercase tracking-tighter">
                  Current Priority
                </Pill>
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-4">
                {nextTask.label}
              </h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    toggleTask(nextTask.id);
                    toast.success(nextTask.label, { duration: 1800 });
                  }}
                  className="flex-1 bg-foreground text-background font-bold py-3.5 rounded-2xl text-sm transition-transform active:scale-95 shadow-xl shadow-foreground/10"
                >
                  Mark Complete
                </button>
                {/* Reschedule hidden during focus — only complete action remains */}
                {!focusEnv.active && (
                  <button
                    onClick={() => {
                      rescheduleTask(nextTask.id);
                      toast("Task Rescheduled", { description: "Momentum penalty applied." });
                    }}
                    className="px-4 py-3.5 rounded-2xl hairline text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Calendar className="h-5 w-5" />
                  </button>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {stretchOpp && !focusEnv.active && surfaceLevel !== 'minimal' && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-success/5 border border-success/15">
            <div className="h-7 w-7 rounded-xl bg-success/15 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-success font-bold">Stretch opportunity</p>
              <p className="text-xs text-foreground mt-0.5">{stretchOpp.prompt}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Secondary task compressed line — shown during focus in FOCUSED / EXPANDING modes */}
      {focusEnv.active && focusEnv.secondaryTask && (
        <div className="flex items-center gap-3 px-1 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 flex-none" />
          <p className="text-sm text-muted-foreground truncate flex-1">
            {focusEnv.secondaryTask.label}
          </p>
          <span className="text-[10px] text-muted-foreground/50 flex-none">
            {focusEnv.secondaryTask.estMin}m
          </span>
        </div>
      )}

      {/* Hidden task count during focus — static, no expansion */}
      {focusEnv.active && focusEnv.hiddenCount > 0 && (
        <p className="text-[11px] text-muted-foreground/40 text-center">
          +{focusEnv.hiddenCount} more
        </p>
      )}

      {surfaceLevel !== "minimal" && !focusEnv.active && <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-foreground uppercase opacity-60">
            Remaining Priorities
          </h2>
          <span className="text-[10px] font-bold text-muted-foreground num-tabular uppercase tracking-widest">
            {completed} / {tasks.length} Done
          </span>
        </div>

        {overCapacity && workloadGuidance !== "expand" && (
          <div className="mb-3 flex items-start gap-2 rounded-xl bg-warning/8 border border-warning/20 px-3 py-2.5">
            <Shield className="h-3.5 w-3.5 text-warning mt-0.5 flex-none" />
            <span className="text-warning text-[11px] font-semibold leading-relaxed">
              {workloadGuidance === "reduce"
                ? `System protecting your capacity.${hiddenCount > 0 ? ` (${hiddenCount} more hidden)` : ""}`
                : `Holding current load — protect your depth window.${hiddenCount > 0 ? ` (${hiddenCount} more hidden)` : ""}`}
            </span>
          </div>
        )}

        {!overCapacity &&
          taskIntel.todayLoadRisk === "overloaded" &&
          taskIntel.typeBalanceWarning && (
            <div className="mb-3 flex items-start gap-2 rounded-xl bg-warning/8 border border-warning/20 px-3 py-2.5">
              <span className="text-warning text-[11px] font-semibold leading-relaxed">
                {taskIntel.typeBalanceWarning}
              </span>
            </div>
          )}

        <div className="space-y-2.5">
          {tasks.map((t) => {
            const done = t.done;
            const isActive = nextTask?.id === t.id;
            if (isActive && !done) return null; // Already shown in focus mode
            if (!visibleTaskIdSet.has(t.id)) return null; // Hidden by pipeline cap

            return (
              <div key={t.id} className="group relative">
                <motion.button
                  layout
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    toggleTask(t.id);
                    if (!done)
                      toast.success("Logged · execution +", {
                        description: t.label,
                        duration: 1800,
                      });
                  }}
                  className={`hairline flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all ${done ? "bg-card/40 opacity-60" : "bg-card hover:bg-card/80"}`}
                >
                  <span
                    className={`flex h-6 w-6 flex-none items-center justify-center rounded-lg border transition-all ${done ? "border-success bg-success/15 text-success scale-100" : "border-border bg-secondary text-transparent"}`}
                  >
                    <motion.span
                      initial={false}
                      animate={done ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </motion.span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[15px] font-medium transition-colors flex items-center gap-1.5 ${done ? "text-muted-foreground line-through" : "text-foreground"}`}
                    >
                      {stretchOpp?.taskId === t.id && !done && (
                        <Sparkles className="h-3 w-3 text-success flex-none" />
                      )}
                      {t.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5 flex items-center gap-1.5">
                      {t.estMin > 0 ? `${t.estMin} min` : "—"} · {t.type}{" "}
                      {(t.rescheduled ?? 0) >= 2 && (
                        <span className="text-warning font-semibold">
                          · {t.rescheduled}x rescheduled — break it down?
                        </span>
                      )}
                      {(t.rescheduled ?? 0) === 1 && (
                        <span className="text-muted-foreground/50">· rescheduled once</span>
                      )}
                    </p>
                  </div>
                </motion.button>
              </div>
            );
          })}

          {adding ? (
            <div className="hairline space-y-4 rounded-3xl bg-card p-4 shadow-xl border-accent/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (label.trim()) {
                    addTask({ label: label.trim(), estMin: type === "deep" ? 90 : 30, type });
                    setLabel("");
                    setAdding(false);
                  }
                }}
              >
                <input
                  autoFocus
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="One thing that actually matters…"
                  className="w-full bg-transparent text-lg font-medium text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                />
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {[
                      { id: "deep", icon: Zap, label: "Deep" },
                      { id: "shallow", icon: Wind, label: "Shallow" },
                      { id: "movement", icon: Dumbbell, label: "Move" },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = type === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setType(item.id as typeof type)}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                            active
                              ? "bg-accent text-background"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-foreground px-5 py-2 text-xs font-bold text-background shadow-lg shadow-foreground/10"
                  >
                    Add Priority
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setAdding(true)}
                disabled={tasks.length >= MAX_TASKS}
                className="group hairline flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-card/50 transition-all disabled:opacity-40"
              >
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                Add Priority {tasks.length >= MAX_TASKS && "(cap reached)"}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => addTask({ label: "30m Deep Work", estMin: 30, type: "deep" })}
                  className="hairline py-3 px-4 rounded-xl text-[11px] font-bold text-muted-foreground hover:text-accent hover:bg-accent/5 transition-all text-left flex items-center gap-2"
                >
                  <Zap className="h-3 w-3" /> +30m Deep Work
                </button>
                <button
                  onClick={() =>
                    addTask({ label: "Movement Session", estMin: 20, type: "movement" })
                  }
                  className="hairline py-3 px-4 rounded-xl text-[11px] font-bold text-muted-foreground hover:text-success hover:bg-success/5 transition-all text-left flex items-center gap-2"
                >
                  <Dumbbell className="h-3 w-3" /> +Movement
                </button>
              </div>
            </div>
          )}
        </div>
      </div>}
    </div>
  );
}

function trajectoryTone(
  trajectory: "EXPANDING" | "STABLE" | "FRAGILE" | "CONTRACTING",
): "success" | "neutral" | "warning" | "danger" {
  switch (trajectory) {
    case "EXPANDING":   return "success";
    case "STABLE":      return "neutral";
    case "FRAGILE":     return "warning";
    case "CONTRACTING": return "danger";
  }
}

function trajectoryLabel(trajectory: "EXPANDING" | "STABLE" | "FRAGILE" | "CONTRACTING"): string {
  switch (trajectory) {
    case "EXPANDING":   return "Expanding";
    case "STABLE":      return "Stable";
    case "FRAGILE":     return "Fragile";
    case "CONTRACTING": return "Contracting";
  }
}
