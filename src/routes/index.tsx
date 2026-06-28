import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Pill, StatLabel } from "@/components/ui-bits";
import { Check, Crown, Plus, RotateCcw, Sparkles, Sunrise, Sun, Moon, Calendar, Zap, Dumbbell, Wind, TriangleAlert as AlertTriangle, TrendingDown, BookOpen, Shield, X, ArrowRight, ChevronRight } from "lucide-react";
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
  useInterventionIntelligence,
  useWeeklyBriefing,
} from "@/lib/store";
import { useState, useEffect } from "react";
import { Stagger, StaggerItem, TapCard, AnimatedNumber } from "@/lib/motion";
import { BehavioralNote } from "@/components/cards/BehavioralNote";
import { InterventionSurface } from "@/components/cards/InterventionSurface";
import { PrimaryDirective } from "@/components/cards/PrimaryDirective";
import { EvidenceStrip } from "@/components/cards/EvidenceStrip";
import { AvoidanceNote } from "@/components/cards/AvoidanceNote";
import { ExpansionNote } from "@/components/cards/ExpansionNote";
import { useBehavioralPipeline } from "@/hooks/useBehavioralPipeline";
import { useMorningCalibration } from "@/hooks/useMorningCalibration";
import { useDailyCommandWithOverrides } from "@/hooks/useDailyCommand";
import { MorningCalibrationSheet } from "@/components/morning/MorningCalibrationSheet";
import type { BehavioralView } from "@/hooks/internal/contracts";
import { useFocusEnvironment } from "@/hooks/internal/useFocusEnvironment";
import type { FocusEnvironmentView } from "@/core/contracts/focus/environment";
import { useBehavioralIntelligence } from "@/lib/behavioral-intelligence";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useDataReadiness } from "@/lib/maturity";
import { useTaskCreationIntelligence } from "@/hooks/useTaskCreationIntelligence";
import { IntelligentTaskWarning } from "@/components/task/IntelligentTaskWarning";
import { CapacityDots } from "@/components/task/CapacityDots";
import { useDormancyDetection, useMomentumMemory } from "@/lib/reentry";
import { ReentryCard } from "@/components/cards/ReentryCard";
import { ReentryModal } from "@/components/ReentryModal";
import { useFirstSession } from "@/lib/first-session";
import { FirstSessionBanner } from "@/components/cards/FirstSessionBanner";
import { FirstCheckInNudge } from "@/components/cards/FirstCheckInNudge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — North" },
      {
        name: "description",
        content: "Your execution score, momentum, and focus goals for today.",
      },
    ],
  }),
  component: Home,
});

const TREND_DAYS = 14;

function Home() {
  const onboarded = useApp((s) => s.onboarded);
  const navigate = useNavigate();
  useEffect(() => {
    if (!onboarded) navigate({ to: "/onboarding" });
  }, [onboarded, navigate]);

  const behavioral = useBehavioralPipeline();
  const intelligence = useBehavioralIntelligence();
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

  const completed = tasks.filter((t) => t.done).length;
  const aiAlert = usePredictiveRecoveryAlert();

  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const subtitle = (() => {
    if (!behavioral.ready) return "Cadence learns from what you do. Today is a clean page.";
    const mode = behavioral.state.mode;
    const traj = behavioral.state.trajectory;
    if (mode === "RECOVERY")
      return "You're in recovery. Smaller surface, faster reps. Three things, then rest.";
    if (mode === "EXPANDING")
      return "Peak window. Stretch into deeper work — protect sleep at all costs.";
    if (mode === "FOCUSED") {
      if (traj === "EXPANDING") return "Momentum is building. Protect depth today.";
      if (traj === "FRAGILE") return "Hold the line. Consistency over ambition today.";
      if (traj === "CONTRACTING") return "Friction is up. One thing done well outweighs three started.";
      return "Steady hand today. Execute three things well.";
    }
    if (traj === "EXPANDING") return "Rebuilding. Each completed task compounds forward.";
    if (traj === "FRAGILE") return "Fragile ground. Prioritize finish over start today.";
    if (traj === "CONTRACTING") return "Hold capacity. Protect sleep and the smallest win.";
    return "Steady hand today. Show up, don't over-plan.";
  })();

  const applyMorningInputs = useApp((s) => s.applyMorningInputs);
  const commitMorningTask = useApp((s) => s.commitMorningTask);
  const skipMorningCalibration = useApp((s) => s.skipMorningCalibration);
  const morningCal = useMorningCalibration();

  const focusEnv = useFocusEnvironment();
  const enterFocusEnvironment = useApp((s) => s.enterFocusEnvironment);
  const exitFocusEnvironment = useApp((s) => s.exitFocusEnvironment);

  const pendingPostFocusInterventions = useApp(
    (s) => s.focusEnvironment.pendingPostFocusInterventions,
  );
  const clearPostFocusInterventions = useApp((s) => s.clearPostFocusInterventions);

  const latestInsight = useLatestInsight();
  const tomorrowBriefing = useTomorrowBriefing();
  const acceptTomorrowPlan = useApp((s) => s.acceptTomorrowPlan);
  const checkIns = useApp((s) => s.checkIns);
  const insights = useApp((s) => s.insights);
  const blockerPattern = useBlockerPattern();
  const insightEffectiveness = useInsightEffectiveness();
  const velocity = useScoreVelocity();
  const interventionIntelligence = useInterventionIntelligence();
  const todayScoreReadiness = useDataReadiness("todayScore");
  const momentumReadiness = useDataReadiness("momentum");
  const consistencyReadiness = useDataReadiness("consistency");

  const yesterdayCheckIn = checkIns.length >= 2 ? checkIns[checkIns.length - 2] : null;

  const committedInsightCard = insightEffectiveness.find(
    (e) => e.verdict === "working" || e.verdict === "too-early",
  );
  const committedInsightData = committedInsightCard
    ? insights.find((i) => i.id === committedInsightCard.insightId)
    : null;

  const recoveryDay = recoveryPlan?.startedAt
    ? Math.floor((Date.now() - new Date(recoveryPlan.startedAt).getTime()) / 86400000) + 1
    : 1;

  const weeklyBriefing = useWeeklyBriefing();

  const todayDate = new Date().toISOString().slice(0, 10);
  const hasCheckedInToday = checkIns.some((c) => c.date === todayDate);

  const firstSession = useFirstSession();
  const dismissFirstSessionBanner = useApp((s) => s.dismissFirstSessionBanner);
  const firstSessionBannerDismissed = useApp((s) => s.firstSessionBannerDismissed);

  const dormancy = useDormancyDetection();
  const momentumMemory = useMomentumMemory();
  const acknowledgeReentry = useApp((s) => s.acknowledgeReentry);
  const showReentryModal = dormancy.tier === "extended" && !recoveryMode;
  const showReentryCard =
    (dormancy.tier === "short" || dormancy.tier === "medium") && !recoveryMode;
  const reentryTaskCap =
    dormancy.tier === "extended"
      ? 1
      : dormancy.tier === "medium"
        ? 2
        : dormancy.tier === "short"
          ? 3
          : undefined;

  const [dismissedYesterday, setDismissedYesterday] = useState(false);

  const command = useDailyCommandWithOverrides(dismissedYesterday);
  const { activeCards, directive, phase } = command;

  const modalInterventionActive = behavioral.interventions.highestLevel >= 3;

  useEffect(() => {
    if (focusEnv.active && behavioral.state.mode === "RECOVERY" && focusEnv.primaryTask === null) {
      exitFocusEnvironment("state-transition", focusEnv.heldInterventions);
    }
  }, [focusEnv.active, behavioral.state.mode, focusEnv.primaryTask, focusEnv.heldInterventions, exitFocusEnvironment]);

  useEffect(() => {
    if (focusEnv.active) {
      const hasOverload = behavioral.interventions.active.some(
        (i) => i.type === "OVERLOAD" && i.level >= 1,
      );
      if (hasOverload) exitFocusEnvironment("state-transition", focusEnv.heldInterventions);
    }
  }, [focusEnv.active, behavioral.interventions.active, focusEnv.heldInterventions, exitFocusEnvironment]);

  const firstName = user.split(" ")[0];

  return (
    <div className="flex flex-col pb-10 lg:pb-16">
      {showReentryModal && (
        <ReentryModal
          gapDays={dormancy.gapDays}
          momentum={momentumMemory}
          primaryTask={tasks.find((t) => !t.done) ?? null}
          onAcknowledge={acknowledgeReentry}
          onRecovery={() => {
            acknowledgeReentry();
            navigate({ to: "/recovery" });
          }}
        />
      )}

      <AnimatePresence>
        {morningCal.shouldShow && (
          <MorningCalibrationSheet
            onInputsApplied={applyMorningInputs}
            onComplete={(committedTaskId, intentionText, opts) => {
              commitMorningTask(committedTaskId, intentionText, opts);
            }}
            onSkip={skipMorningCalibration}
          />
        )}
      </AnimatePresence>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <HeroSection
        greeting={greeting}
        firstName={firstName}
        subtitle={subtitle}
        behavioral={behavioral}
        focusEnv={focusEnv}
        heroTheme={heroTheme}
        directive={directive}
        phase={phase}
        morningCal={morningCal}
        score={score}
        delta={delta}
        history={history}
        tasks={tasks}
        completed={completed}
        consistency={consistency}
        todayScoreReadiness={todayScoreReadiness}
        momentumReadiness={momentumReadiness}
        consistencyReadiness={consistencyReadiness}
        weeklyBriefing={weeklyBriefing}
        exitFocusEnvironment={exitFocusEnvironment}
      />

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 px-5 lg:px-0 mt-5 lg:mt-6">

        {/* First session */}
        {firstSession.active && !firstSessionBannerDismissed && !focusEnv.active && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FirstSessionBanner session={firstSession} onDismiss={dismissFirstSessionBanner} />
          </motion.div>
        )}

        {/* Re-entry card */}
        {showReentryCard && dormancy.tier && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <ReentryCard
              tier={dormancy.tier}
              gapDays={dormancy.gapDays}
              taskCount={tasks.filter((t) => !t.done).length}
              momentum={momentumMemory}
              onAcknowledge={acknowledgeReentry}
              onRecovery={() => { acknowledgeReentry(); navigate({ to: "/recovery" }); }}
            />
          </motion.div>
        )}

        {/* Task section — primary action center */}
        <TasksSection
          tasks={tasks}
          toggleTask={toggleTask}
          completed={completed}
          behavioral={behavioral}
          focusEnv={focusEnv}
          reentryTaskCap={reentryTaskCap}
          onEnterFocus={() => {
            const windowMin = behavioral.tasks.sequencing.focusWindowMinutes;
            enterFocusEnvironment("manual", windowMin ? windowMin * 60_000 : null);
          }}
          onExitFocus={() => exitFocusEnvironment("interruption", focusEnv.heldInterventions)}
        />

        {/* ── Signal Cards ─────────────────────────────────────────────── */}
        <Stagger className="flex flex-col gap-3" gap={0.06}>

          {activeCards.has("intervention") && (
            <StaggerItem>
              <InterventionSurface
                surface={behavioral.interventions.ui.surface}
                intervention={behavioral.interventions.active[0]}
                isDemoted={
                  !!behavioral.interventions.active[0] &&
                  interventionIntelligence.suppressionAdvisories.some(
                    (a) => a.type === behavioral.interventions.active[0]?.type && a.action === "DEMOTE",
                  )
                }
              />
            </StaggerItem>
          )}

          {activeCards.has("recovery") && (
            <StaggerItem>
              <Link to="/recovery" className="group block">
                <SignalCard tone="warning">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="section-label text-warning">Recovery protocol</span>
                        {recoveryReason && (
                          <Pill tone="warning" className="text-[9px]">{recoveryReason}</Pill>
                        )}
                      </div>
                      <p className="text-[15px] font-semibold text-foreground leading-snug">
                        {recoveryPlan?.protocol
                          ? `${recoveryPlan.protocol.charAt(0).toUpperCase()}${recoveryPlan.protocol.slice(1)}`
                          : "Tactical"}{" "}
                        stabilization in progress
                      </p>
                      <div className="mt-2.5 flex items-center gap-2.5">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className={`h-1 w-5 rounded-full transition-colors ${i < recoveryDay ? "bg-warning" : "bg-border"}`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Day {Math.min(3, recoveryDay)} ·{" "}
                          {recoveryPlan?.timeline[Math.min(2, recoveryDay - 1)]?.focus || "Stabilize"}
                        </span>
                      </div>
                    </div>
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-warning/15 text-warning group-hover:bg-warning/25 transition-colors">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                  </div>
                </SignalCard>
              </Link>
            </StaggerItem>
          )}

          {activeCards.has("aiAlert") && (
            <StaggerItem>
              <BehavioralNote
                title={aiAlert.title || ""}
                body={aiAlert.body || ""}
                confidence={aiAlert.confidence}
              />
            </StaggerItem>
          )}

          {activeCards.has("avoidance") && intelligence.avoidance && (
            <StaggerItem>
              <AvoidanceNote
                avoidance={intelligence.avoidance}
                showInsightsLink={checkIns.length >= 10}
              />
            </StaggerItem>
          )}

          {activeCards.has("velocity") && (
            <StaggerItem>
              <SignalCard tone="warning">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-warning/15 text-warning">
                    <TrendingDown className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="section-label text-warning mb-1">Momentum at risk</p>
                    <p className="text-[13px] text-foreground leading-relaxed">
                      Score has declined {velocity.dropPts} pts over {velocity.dayCount} days.
                    </p>
                  </div>
                </div>
              </SignalCard>
            </StaggerItem>
          )}

          {activeCards.has("blocker") && blockerPattern.streak && (
            <StaggerItem>
              <SignalCard tone="warning">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-warning/15 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="section-label text-warning mb-1">Pattern detected</p>
                    <p className="text-[13px] text-foreground leading-relaxed">
                      <span className="font-semibold capitalize">{blockerPattern.streak.type}</span>{" "}
                      has blocked tasks {blockerPattern.streak.days} days in a row.{" "}
                      {blockerPattern.recommendation}
                    </p>
                  </div>
                </div>
              </SignalCard>
            </StaggerItem>
          )}

          {activeCards.has("expansion") && intelligence.expansion && (
            <StaggerItem>
              <ExpansionNote expansion={intelligence.expansion} />
            </StaggerItem>
          )}

          {activeCards.has("committedTask") && morningCal.committedTask && (
            <StaggerItem>
              <SignalCard tone="accent">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Zap className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="section-label text-accent mb-1">Committed start</p>
                    <p className="text-[14px] font-semibold text-foreground leading-snug truncate">
                      {morningCal.committedTask.label}
                    </p>
                    {morningCal.calibration?.intentionText && (
                      <p className="mt-1.5 text-[12px] text-muted-foreground leading-relaxed italic">
                        "{morningCal.calibration.intentionText}"
                      </p>
                    )}
                  </div>
                </div>
              </SignalCard>
            </StaggerItem>
          )}

          {activeCards.has("briefing") && (
            <StaggerItem>
              <SignalCard tone="success">
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-success/15 text-success">
                    <Sunrise className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="section-label text-success mb-1">Morning briefing</p>
                    {tomorrowBriefing.northStar && (
                      <p className="text-[14px] font-semibold text-foreground leading-snug">
                        "{tomorrowBriefing.northStar}"
                      </p>
                    )}
                  </div>
                </div>
                {tomorrowBriefing.insight && (
                  <p className="text-[12px] text-muted-foreground leading-relaxed mb-3 pl-12">
                    {tomorrowBriefing.insight}
                  </p>
                )}
                {tomorrowBriefing.suggestedTasks.length > 0 && (
                  <div className="space-y-1.5 mb-4 pl-12">
                    {tomorrowBriefing.suggestedTasks.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-[12px] text-foreground/80">
                        <div className="h-1 w-1 rounded-full bg-success/60 flex-none" />
                        {t.label}
                        <span className="text-muted-foreground/50 ml-auto text-[11px]">{t.estMin}m</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={acceptTomorrowPlan}
                  className="w-full text-center text-[12px] font-semibold text-success py-2.5 rounded-xl bg-success/10 hover:bg-success/18 transition-colors"
                >
                  Accept plan for today
                </button>
              </SignalCard>
            </StaggerItem>
          )}

          {activeCards.has("insight") && committedInsightData && committedInsightCard && (
            <StaggerItem>
              <SignalCard tone="accent">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Shield className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="section-label text-accent">Active rule</p>
                      <span className="text-[11px] text-muted-foreground">
                        Day {committedInsightCard.daysSinceCommit + 1}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium text-foreground leading-snug mb-1">
                      {committedInsightData.title}
                    </p>
                    {committedInsightCard.verdict === "working" ? (
                      <p className="text-[11px] text-success">
                        +{committedInsightCard.delta} pts avg since commit
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        Building baseline · {7 - committedInsightCard.daysSinceCommit}d remaining
                      </p>
                    )}
                  </div>
                </div>
              </SignalCard>
            </StaggerItem>
          )}

          {activeCards.has("yesterday") && yesterdayCheckIn && !dismissedYesterday && (
            <StaggerItem>
              <SignalCard tone="neutral">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="section-label">Yesterday's note</p>
                      <button
                        onClick={() => setDismissedYesterday(true)}
                        className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {yesterdayCheckIn.tomorrowFocus && (
                      <p className="text-[13px] text-foreground leading-snug">
                        You planned:{" "}
                        <span className="font-semibold">"{yesterdayCheckIn.tomorrowFocus}"</span>
                      </p>
                    )}
                    {yesterdayCheckIn.reflection && (
                      <p className="text-[12px] text-muted-foreground leading-relaxed border-l-2 border-border pl-3 italic">
                        "{yesterdayCheckIn.reflection}"
                      </p>
                    )}
                  </div>
                </div>
              </SignalCard>
            </StaggerItem>
          )}

          {shell.surfaceLevel !== "minimal" && latestInsight && !focusEnv.active && (
            <StaggerItem>
              <BehavioralNote
                title={latestInsight.title}
                body={latestInsight.body}
                onDismiss={() => dismissInsight(latestInsight.id)}
              />
            </StaggerItem>
          )}

        </Stagger>

        {/* Post-focus pending interventions */}
        {pendingPostFocusInterventions.length > 0 && (
          <div className="flex flex-col gap-2">
            <InterventionSurface surface="banner" intervention={pendingPostFocusInterventions[0]} />
            <button
              onClick={clearPostFocusInterventions}
              className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors text-center"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* L3 modal intervention */}
        {modalInterventionActive && (
          <InterventionSurface
            surface="modal"
            intervention={behavioral.interventions.active.find((i) => i.level === 3)}
          />
        )}

        {/* Evening check-in CTA */}
        {phase === "evening" && !hasCheckedInToday && directive.kind !== "check-in" && (
          <div className="pt-1">
            {firstSession.active ? (
              <FirstCheckInNudge session={firstSession} />
            ) : (
              <Link to="/check-in">
                <motion.button
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.985 }}
                  className="relative w-full overflow-hidden rounded-2xl bg-foreground py-4 text-[14px] font-semibold text-background"
                >
                  <span className="relative z-10">Start evening check-in</span>
                  <span className="absolute inset-0 animate-shimmer" />
                </motion.button>
              </Link>
            )}
          </div>
        )}

        {/* Quick navigation — full surface only */}
        {shell.surfaceLevel === "full" && !focusEnv.active && (
          <Stagger className="grid grid-cols-2 gap-2 pt-1 lg:grid-cols-4" gap={0.05}>
            {[
              { to: "/dashboard", label: "Command center", desc: "Deep analytics", icon: Sparkles },
              { to: "/weekly", label: "Weekly report", desc: "Patterns this week", icon: Calendar },
              { to: "/circles", label: "Trusted circles", desc: "Proof-based", icon: Shield },
              { to: "/premium", label: "Cadence Pro", desc: "Adaptive coaching", icon: Crown },
            ].map((q) => {
              const Icon = q.icon;
              return (
                <StaggerItem key={q.to}>
                  <Link to={q.to}>
                    <TapCard>
                      <div className="card-base group flex flex-col gap-2 hover:border-border/80 transition-colors">
                        <Icon className="h-4 w-4 text-accent" />
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{q.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{q.desc}</p>
                        </div>
                      </div>
                    </TapCard>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </div>
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection({
  greeting,
  firstName,
  subtitle,
  behavioral,
  focusEnv,
  heroTheme,
  directive,
  phase,
  morningCal,
  score,
  delta,
  history,
  tasks,
  completed,
  consistency,
  todayScoreReadiness,
  momentumReadiness,
  consistencyReadiness,
  weeklyBriefing,
  exitFocusEnvironment,
}: {
  greeting: string;
  firstName: string;
  subtitle: string;
  behavioral: BehavioralView;
  focusEnv: FocusEnvironmentView;
  heroTheme: string;
  directive: ReturnType<typeof useDailyCommandWithOverrides>["directive"];
  phase: string;
  morningCal: ReturnType<typeof useMorningCalibration>;
  score: number;
  delta: number;
  history: ReturnType<typeof useApp.getState>["history"];
  tasks: ReturnType<typeof useApp.getState>["tasks"];
  completed: number;
  consistency: number;
  todayScoreReadiness: ReturnType<typeof useDataReadiness>;
  momentumReadiness: ReturnType<typeof useDataReadiness>;
  consistencyReadiness: ReturnType<typeof useDataReadiness>;
  weeklyBriefing: ReturnType<typeof useWeeklyBriefing>;
  exitFocusEnvironment: ReturnType<typeof useApp.getState>["exitFocusEnvironment"];
}) {
  if (focusEnv.active && !focusEnv.heroCompressed) return null;

  if (focusEnv.heroCompressed) {
    return (
      <div className="px-5 pt-6 lg:px-0">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card/60 px-5 py-3 backdrop-blur-sm">
          <p className="text-[14px] font-semibold text-foreground truncate">
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
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 lg:px-0">
      {/* Date + greeting row */}
      <div className="mb-5 flex items-start justify-between gap-3 animate-fade-up">
        <div>
          <p className="section-label text-muted-foreground/60 mb-1.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
          <h1 className="font-display text-[30px] leading-[1.06] tracking-tight text-foreground lg:text-[34px]">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-1.5 max-w-[38ch] text-[14px] leading-[1.6] text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 flex-none pt-0.5">
          {morningCal.isComplete && (
            <div className="flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-2.5 py-1 text-[11px] font-medium text-success">
              <Sunrise className="h-3 w-3" />
              Calibrated
            </div>
          )}
          {behavioral.ready && (
            <Pill tone={trajectoryTone(behavioral.state.trajectory)}>
              {trajectoryLabel(behavioral.state.trajectory)}
            </Pill>
          )}
        </div>
      </div>

      {/* State-mode hero card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${behavioral.state.guidance?.tone ?? "default"}::${behavioral.state.interpretation?.headline ?? "loading"}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${heroTheme} p-6 hairline shadow-elegant lg:p-8`}
          >
            {/* Ambient glow layer */}
            <div className="bg-glow absolute inset-0 pointer-events-none" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
              {/* Left: state signal + headline + directive */}
              <div className="flex-1 space-y-4">
                {/* Mode indicator */}
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)] animate-pulse" />
                  <StatLabel className="text-accent tracking-[0.18em]">
                    {behavioral.state.mode} · {phase}
                  </StatLabel>
                </div>

                {/* Headline */}
                <div>
                  <h2 className="text-[26px] font-display font-semibold text-foreground tracking-tight leading-[1.1] lg:text-[30px]">
                    {behavioral.ready && behavioral.state.interpretation.headline
                      ? behavioral.state.interpretation.headline
                      : directive.label}
                  </h2>
                  {behavioral.ready && behavioral.state.interpretation.supporting.length > 0 && (
                    <p className="mt-2.5 text-[14px] text-muted-foreground leading-relaxed max-w-[42ch]">
                      {behavioral.state.interpretation.supporting[0]}
                    </p>
                  )}
                </div>

                {/* Trait pills */}
                <div className="flex flex-wrap gap-2">
                  {consistencyReadiness.hasMinimum &&
                    behavioral.execution.advancement.showConsistencyPill && (
                      <Pill tone="accent" className="text-[11px]">
                        {consistency}% Consistency
                      </Pill>
                    )}
                  {behavioral.shell.focusMode && (
                    <Pill tone="accent" className="text-[11px]">Deep Work Active</Pill>
                  )}
                </div>

                {/* Primary directive */}
                <PrimaryDirective
                  directive={directive}
                  onCalibrate={() => {}}
                  onFocusTask={() => {}}
                />
              </div>

              {/* Right: score / evidence */}
              <div className="lg:flex-none lg:w-52">
                {todayScoreReadiness.hasMinimum ? (
                  <EvidenceStrip
                    score={score}
                    delta={delta}
                    history={history}
                    completed={completed}
                    totalTasks={tasks.length}
                    showScore={true}
                    showSparkline={false}
                    showMomentumDelta={
                      momentumReadiness.hasMinimum &&
                      behavioral.execution.advancement.showMomentumDelta
                    }
                  />
                ) : (
                  <div className="rounded-2xl border border-border/50 bg-card/30 px-5 py-5 text-center backdrop-blur-sm">
                    <p className="section-label mb-2">Today's score</p>
                    <p className="text-[13px] text-foreground/70 leading-relaxed">
                      Appears after tonight's reflection.
                    </p>
                  </div>
                )}

                {momentumReadiness.hasMinimum && behavioral.execution.advancement.showSparkline && (
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <EvidenceStrip
                      score={score}
                      delta={delta}
                      history={history}
                      completed={completed}
                      totalTasks={tasks.length}
                      showScore={false}
                      showSparkline={true}
                      showMomentumDelta={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Weekly north star banner (below hero, above tasks) */}
      {weeklyBriefing.active && weeklyBriefing.northStar && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mt-3"
        >
          <div
            className={`flex items-center justify-between rounded-2xl px-4 py-3 border gap-3 ${
              weeklyBriefing.recoveryOverlay
                ? "bg-warning/6 border-warning/20"
                : "bg-accent/6 border-accent/20"
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="section-label text-accent/70 mb-0.5">This week</p>
              <p className="text-[13px] font-medium text-foreground leading-snug truncate">
                {weeklyBriefing.northStar}
              </p>
              {weeklyBriefing.recoveryOverlay && (
                <p className="text-[11px] text-warning/80 mt-0.5">
                  Recovery day — load reduced
                </p>
              )}
            </div>
            {weeklyBriefing.todayFocusEmphasis && (
              <span className={`flex-none text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                weeklyBriefing.todayFocusEmphasis === "deep"
                  ? "bg-accent/15 text-accent"
                  : weeklyBriefing.todayFocusEmphasis === "recovery"
                    ? "bg-warning/15 text-warning"
                    : "bg-secondary text-muted-foreground"
              }`}>
                {weeklyBriefing.todayFocusEmphasis}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── SignalCard ────────────────────────────────────────────────────────────────
function SignalCard({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "warning" | "success" | "danger";
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`card-base signal-${tone} ${className}`}>{children}</div>
    </motion.div>
  );
}

// ─── TasksSection ─────────────────────────────────────────────────────────────
function TasksSection({
  tasks,
  toggleTask,
  completed,
  behavioral,
  focusEnv,
  reentryTaskCap,
  onEnterFocus,
  onExitFocus,
}: {
  tasks: ReturnType<typeof useApp.getState>["tasks"];
  toggleTask: (id: string) => void;
  completed: number;
  behavioral: BehavioralView;
  focusEnv: FocusEnvironmentView;
  reentryTaskCap?: number;
  onEnterFocus: () => void;
  onExitFocus: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [labelFocused, setLabelFocused] = useState(false);
  const [type, setType] = useState<"deep" | "shallow" | "movement" | "admin" | "wind-down">("deep");
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const [avoidanceDismissed, setAvoidanceDismissed] = useState(false);
  const addTask = useApp((s) => s.addTask);
  const rescheduleTask = useApp((s) => s.rescheduleTask);
  const acknowledgeIntervention = useApp((s) => s.acknowledgeIntervention);
  const taskIntel = useTaskIntelligence();
  const creationIntel = useTaskCreationIntelligence({ type, labelFocused });
  const stretchOpp = behavioral.execution.stretchOpportunity;

  const surfaceLevel = behavioral.shell.surfaceLevel;
  const pipelineReady = behavioral.ready;
  const { visibleTaskIds: pipelineVisibleIds } = behavioral.tasks.visibility;
  const { visibleTaskLimit, overCapacity, guidance: workloadGuidance } = behavioral.tasks.workload;

  const incompleteTasks = tasks.filter((t) => !t.done);

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
    if (reentryTaskCap !== undefined) return incompleteTasks.slice(0, reentryTaskCap);
    if (pipelineReady) {
      const allowedSet = new Set(pipelineVisibleIds);
      const filtered =
        allowedSet.size > 0 ? incompleteTasks.filter((t) => allowedSet.has(t.id)) : incompleteTasks;
      return filtered.slice(0, visibleTaskLimit);
    }
    return incompleteTasks;
  })();

  const hiddenCount = focusEnv.active
    ? focusEnv.hiddenCount
    : Math.max(0, incompleteTasks.length - visibleIncompleteTasks.length);

  const visibleTaskIdSet = new Set([
    ...visibleIncompleteTasks.map((t) => t.id),
    ...(focusEnv.active ? [] : tasks.filter((t) => t.done).map((t) => t.id)),
  ]);

  const nextTask = visibleIncompleteTasks[0] ?? null;

  useEffect(() => {
    if (focusEnv.active && focusEnv.primaryTask && tasks.find((t) => t.id === focusEnv.primaryTask!.id)?.done) {
      onExitFocus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, focusEnv.active, focusEnv.primaryTask]);

  return (
    <div className="space-y-4">
      {/* Focus entry affordance */}
      {focusEnv.entryAllowed && !focusEnv.active && (
        focusEnv.entryAutoSuggested ? (
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur-sm">
            <p className="text-[14px] text-foreground">Clear the surface?</p>
            <button
              onClick={onEnterFocus}
              className="text-[12px] font-semibold text-accent hover:opacity-80 transition-opacity"
            >
              Begin
            </button>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={onEnterFocus}
              className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Begin
            </button>
          </div>
        )
      )}

      {/* Deep work nudge */}
      {behavioral.execution.deepWorkNudge.show && !focusEnv.active && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-accent/6 border border-accent/15">
            <Zap className="h-3.5 w-3.5 text-accent flex-none" />
            <p className="text-[12px] text-foreground flex-1">Deep work window active. Start your first task.</p>
            <button
              onClick={() => acknowledgeIntervention("DEEP_WORK_NUDGE")}
              className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Primary task card — the most prominent element on the page */}
      <AnimatePresence mode="wait">
        {nextTask && (
          <motion.div
            key={nextTask.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <PrimaryTaskCard
              task={nextTask}
              onComplete={() => {
                toggleTask(nextTask.id);
                toast.success(nextTask.label, { duration: 1800 });
              }}
              onReschedule={
                !focusEnv.active
                  ? () => {
                      rescheduleTask(nextTask.id);
                      toast("Moved to tomorrow", {
                        description: "Rescheduled tasks are tracked automatically.",
                      });
                    }
                  : undefined
              }
              stretchOpp={stretchOpp?.taskId === nextTask.id ? stretchOpp : null}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stretch opportunity */}
      {stretchOpp && !focusEnv.active && surfaceLevel !== "minimal" && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-success/6 border border-success/15">
            <span className="h-7 w-7 rounded-xl bg-success/15 flex items-center justify-center flex-none">
              <Sparkles className="h-3.5 w-3.5 text-success" />
            </span>
            <div>
              <p className="section-label text-success mb-0.5">Stretch opportunity</p>
              <p className="text-[12px] text-foreground">{stretchOpp.prompt}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Secondary task during focus */}
      {focusEnv.active && focusEnv.secondaryTask && (
        <div className="flex items-center gap-3 px-1 py-1 opacity-50">
          <span className="h-1 w-1 rounded-full bg-muted-foreground/50 flex-none" />
          <p className="text-[13px] text-muted-foreground truncate flex-1">
            {focusEnv.secondaryTask.label}
          </p>
          <span className="text-[11px] text-muted-foreground/50 flex-none">
            {focusEnv.secondaryTask.estMin}m
          </span>
        </div>
      )}

      {focusEnv.active && focusEnv.hiddenCount > 0 && (
        <p className="text-[11px] text-muted-foreground/30 text-center">
          +{focusEnv.hiddenCount} more
        </p>
      )}

      {/* Remaining tasks list */}
      {surfaceLevel !== "minimal" && !focusEnv.active && (
        <div>
          {/* Section header */}
          {(tasks.length > 0 || adding) && (
            <div className="mb-3 flex items-center justify-between">
              <p className="section-label">
                Priorities
              </p>
              <span className="section-label text-muted-foreground/50 num-tabular">
                {completed} / {tasks.length}
              </span>
            </div>
          )}

          {/* Capacity / load warnings */}
          {reentryTaskCap !== undefined && hiddenCount > 0 && (
            <div className="mb-3 flex items-start gap-2 rounded-xl bg-secondary/50 border border-border/60 px-3 py-2.5">
              <Shield className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-none" />
              <span className="text-muted-foreground text-[12px] leading-relaxed">
                +{hiddenCount} more hidden during re-entry — one step at a time.
              </span>
            </div>
          )}

          {!reentryTaskCap && overCapacity && workloadGuidance !== "expand" && (
            <div className="mb-3 flex items-start gap-2 rounded-xl bg-warning/6 border border-warning/20 px-3 py-2.5">
              <Shield className="h-3.5 w-3.5 text-warning mt-0.5 flex-none" />
              <span className="text-warning text-[12px] leading-relaxed">
                {workloadGuidance === "reduce"
                  ? `Protecting your capacity.${hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ""}`
                  : `Holding current load — protect depth.${hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ""}`}
              </span>
            </div>
          )}

          {!overCapacity && taskIntel.todayLoadRisk === "overloaded" && taskIntel.typeBalanceWarning && (
            <div className="mb-3 flex items-start gap-2 rounded-xl bg-warning/6 border border-warning/20 px-3 py-2.5">
              <span className="text-warning text-[12px] leading-relaxed">
                {taskIntel.typeBalanceWarning}
              </span>
            </div>
          )}

          {/* Task rows */}
          <div className="space-y-2">
            {tasks.map((t) => {
              const done = t.done;
              const isActiveTask = nextTask?.id === t.id;
              if (isActiveTask && !done) return null;
              if (!visibleTaskIdSet.has(t.id)) return null;

              return (
                <motion.button
                  key={t.id}
                  layout
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    toggleTask(t.id);
                    if (!done)
                      toast.success("Logged", { description: t.label, duration: 1800 });
                  }}
                  className={`group flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-all ${
                    done
                      ? "border-border/40 bg-card/40 opacity-50"
                      : "border-border bg-card hover:bg-card/80 hover:border-border/80"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border transition-all ${
                      done
                        ? "border-success bg-success/15 text-success"
                        : "border-border bg-secondary/50"
                    }`}
                  >
                    <motion.span
                      initial={false}
                      animate={done ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </motion.span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[14px] font-medium leading-snug flex items-center gap-1.5 ${
                      done ? "text-muted-foreground line-through" : "text-foreground"
                    }`}>
                      {stretchOpp?.taskId === t.id && !done && (
                        <Sparkles className="h-3 w-3 text-success flex-none" />
                      )}
                      <span className="truncate">{t.label}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                      {t.estMin > 0 ? `${t.estMin}m` : "—"}
                      <span className="text-border">·</span>
                      {t.type}
                      {(t.rescheduled ?? 0) >= 2 && (
                        <span className="text-warning font-medium ml-1">
                          · {t.rescheduled}x rescheduled
                        </span>
                      )}
                    </p>
                  </div>
                </motion.button>
              );
            })}

            {/* Add task */}
            {adding ? (
              <div className="rounded-3xl border border-accent/25 bg-card p-4 shadow-elegant">
                <AnimatePresence>
                  {creationIntel.avoidancePrompt && !avoidanceDismissed && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="mb-3 flex items-start gap-2 rounded-xl bg-muted/40 border border-border/40 px-3 py-2"
                    >
                      <p className="text-[11px] text-muted-foreground/70 flex-1 leading-relaxed">
                        {creationIntel.avoidancePrompt}
                      </p>
                      <button
                        type="button"
                        onClick={() => setAvoidanceDismissed(true)}
                        className="text-muted-foreground/40 hover:text-muted-foreground transition-colors flex-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (label.trim()) {
                      addTask({ label: label.trim(), estMin: type === "deep" ? 90 : 30, type });
                      setLabel("");
                      setAdding(false);
                      setDismissedWarnings(new Set());
                      setAvoidanceDismissed(false);
                      setLabelFocused(false);
                    }
                  }}
                >
                  <input
                    autoFocus
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onFocus={() => setLabelFocused(true)}
                    onBlur={() => setLabelFocused(false)}
                    placeholder="One thing that actually matters…"
                    className="w-full bg-transparent text-[17px] font-medium text-foreground placeholder:text-muted-foreground/35 focus:outline-none"
                  />

                  <div className="mt-3.5">
                    <CapacityDots
                      fill={creationIntel.capacityFill}
                      cap={creationIntel.suggestedCap}
                      taskCount={tasks.length}
                    />
                  </div>

                  <div className="mt-3 flex gap-1.5 flex-wrap">
                    {creationIntel.orderedTypes.map((id) => {
                      const META: Record<string, { icon: typeof Zap; label: string }> = {
                        deep: { icon: Zap, label: "Deep" },
                        shallow: { icon: Wind, label: "Shallow" },
                        movement: { icon: Dumbbell, label: "Move" },
                        admin: { icon: BookOpen, label: "Admin" },
                        "wind-down": { icon: Moon, label: "Wind" },
                      };
                      const meta = META[id];
                      if (!meta) return null;
                      const Icon = meta.icon;
                      const active = type === id;
                      const degraded = creationIntel.degradedTypes.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setType(id as typeof type)}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all ${
                            active
                              ? "bg-accent text-background"
                              : degraded
                                ? "bg-secondary text-muted-foreground/35 border border-border/30"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    {(creationIntel.positiveSignal || creationIntel.guidanceSignal) && (
                      <motion.p
                        key={creationIntel.positiveSignal ?? creationIntel.guidanceSignal}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[11px] text-muted-foreground mt-2"
                      >
                        {creationIntel.positiveSignal ?? creationIntel.guidanceSignal}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {creationIntel.activeWarning && !dismissedWarnings.has(creationIntel.activeWarning) && (
                      <div className="mt-2.5">
                        <IntelligentTaskWarning
                          kind={creationIntel.activeWarning}
                          onDismiss={() =>
                            setDismissedWarnings((prev) => new Set([...prev, creationIntel.activeWarning!]))
                          }
                        />
                      </div>
                    )}
                  </AnimatePresence>

                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setAdding(false);
                        setLabel("");
                        setDismissedWarnings(new Set());
                        setAvoidanceDismissed(false);
                        setLabelFocused(false);
                      }}
                      className="text-[12px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-foreground px-5 py-2 text-[12px] font-bold text-background shadow-md"
                    >
                      Add priority
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setAdding(true);
                    setDismissedWarnings(new Set());
                    setAvoidanceDismissed(false);
                  }}
                  disabled={creationIntel.atHardCap}
                  className="group flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 py-3.5 text-[13px] font-medium text-muted-foreground/60 hover:text-foreground hover:border-border transition-all disabled:opacity-30"
                >
                  <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                  {creationIntel.atHardCap ? "Cap reached" : "Add priority"}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  {creationIntel.orderedTypes[0] !== "movement" ? (
                    <button
                      onClick={() => addTask({ label: "30m Deep Work", estMin: 30, type: "deep" })}
                      className="flex items-center gap-2 rounded-xl border border-border/60 px-3.5 py-2.5 text-[11px] font-semibold text-muted-foreground hover:text-accent hover:border-accent/30 hover:bg-accent/4 transition-all"
                    >
                      <Zap className="h-3 w-3 flex-none" /> +30m Deep Work
                    </button>
                  ) : (
                    <div />
                  )}
                  <button
                    onClick={() => addTask({ label: "Movement Session", estMin: 20, type: "movement" })}
                    className="flex items-center gap-2 rounded-xl border border-border/60 px-3.5 py-2.5 text-[11px] font-semibold text-muted-foreground hover:text-success hover:border-success/30 hover:bg-success/4 transition-all"
                  >
                    <Dumbbell className="h-3 w-3 flex-none" /> +Movement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PrimaryTaskCard ──────────────────────────────────────────────────────────
function PrimaryTaskCard({
  task,
  onComplete,
  onReschedule,
  stretchOpp,
}: {
  task: { id: string; label: string; estMin: number; type: string };
  onComplete: () => void;
  onReschedule?: () => void;
  stretchOpp: { prompt: string } | null;
}) {
  return (
    <div className="group relative">
      {/* Ambient glow under the card */}
      <div className="absolute -inset-1 rounded-[2.25rem] bg-gradient-to-br from-accent/18 to-accent/4 blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none" />
      <div className="relative card-base border-accent/20 bg-card/85 backdrop-blur-md overflow-hidden">
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent/60 via-accent to-accent/20 rounded-t-[1.5rem]" />

        <div className="flex items-center justify-between mb-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_6px_var(--accent)]" />
            <span className="section-label text-accent">Now</span>
          </div>
          <Pill tone="accent" className="text-[10px]">Priority</Pill>
        </div>

        <h3 className="text-[20px] font-display font-semibold text-foreground leading-snug mb-4 lg:text-[22px]">
          {task.label}
        </h3>

        <div className="text-[11px] text-muted-foreground/60 mb-5 flex items-center gap-1.5">
          {task.estMin > 0 && <span>{task.estMin}m</span>}
          <span className="text-border">·</span>
          <span className="capitalize">{task.type}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onComplete}
            className="flex-1 bg-foreground text-background font-semibold py-3.5 rounded-2xl text-[14px] transition-all active:scale-95 shadow-lg shadow-foreground/10 hover:opacity-90"
          >
            Mark complete
          </button>
          {onReschedule && (
            <button
              onClick={onReschedule}
              className="px-4 py-3.5 rounded-2xl border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
              title="Move to tomorrow"
            >
              <Calendar className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function trajectoryTone(
  trajectory: "EXPANDING" | "STABLE" | "FRAGILE" | "CONTRACTING",
): "success" | "neutral" | "warning" | "danger" {
  switch (trajectory) {
    case "EXPANDING": return "success";
    case "STABLE": return "neutral";
    case "FRAGILE": return "warning";
    case "CONTRACTING": return "danger";
  }
}

function trajectoryLabel(trajectory: "EXPANDING" | "STABLE" | "FRAGILE" | "CONTRACTING"): string {
  switch (trajectory) {
    case "EXPANDING": return "Expanding";
    case "STABLE": return "Stable";
    case "FRAGILE": return "Fragile";
    case "CONTRACTING": return "Contracting";
  }
}
