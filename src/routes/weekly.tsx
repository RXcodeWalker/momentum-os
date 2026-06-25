import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useVisibleRoutes, useUserStage } from "@/lib/maturity";
import { BarRow, Card, Pill, Ring, ScreenHeader, Sparkline, StatLabel } from "@/components/ui-bits";
import { ExecutionHeatmap } from "@/components/heatmap";
import {
  useActiveInsights,
  useApp,
  useConsistency,
  useFakeProductivityFlags,
  useMomentum,
  useResilience,
  useStreakContext,
  useDayOfWeekProfile,
  useDistractionProfile,
  useBlockerPattern,
  useWeeklyAdaptation,
} from "@/lib/store";
import {
  ArrowLeft,
  Brain,
  Crown,
  Quote,
  Sparkles,
  Target,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle2,
  Lock,
  ChevronRight,
  CalendarCheck,
} from "lucide-react";
import { Stagger, StaggerItem, TapCard, FadeUp } from "@/lib/motion";
import { WeeklyReviewWizard } from "@/components/weekly/WeeklyReviewWizard";

export const Route = createFileRoute("/weekly")({
  head: () => ({
    meta: [
      { title: "Weekly report — Cadence" },
      {
        name: "description",
        content: "A behavioral report card. Patterns, wins, and next-week leverage.",
      },
    ],
  }),
  component: Weekly,
});

function Weekly() {
  const navigate = useNavigate();
  const visibleRoutes = useVisibleRoutes();
  const userStage = useUserStage();
  const isUnlocked = visibleRoutes.includes("this-week");
  useEffect(() => {
    if (!isUnlocked) navigate({ to: "/" });
  }, [isUnlocked, navigate]);

  const [showWizard, setShowWizard] = useState(false);
  const weeklyPlan = useApp((s) => s.weeklyPlan);
  const weeklyAdaptation = useWeeklyAdaptation();

  const history = useApp((s) => s.history);
  const principles = useApp((s) => s.principles);
  const flags = useFakeProductivityFlags();
  const momentum = useMomentum();
  const consistency = useConsistency(14);
  const resilience = useResilience();
  const activeInsights = useActiveInsights();

  const streakCtx = useStreakContext();
  const dowProfile = useDayOfWeekProfile();
  const distractionProfile = useDistractionProfile();
  const blockerPattern = useBlockerPattern();

  const week = history.slice(-7);

  const wkAvg = Math.round(
    week.length ? week.reduce((a, d) => a + d.executionScore, 0) / week.length : 0,
  );
  const delta = momentum.delta;

  const worstDay = week.reduce((b, d) => (d.executionScore < b.executionScore ? d : b), week[0]);
  const bestDay = week.reduce((b, d) => (d.executionScore > b.executionScore ? d : b), week[0]);

  // Task breakdown (derived from focus and recovery historical data)
  const totalCompleted = week.reduce((a, d) => a + d.completed, 0);
  const avgFocus = week.reduce((a, d) => a + d.focus, 0) / Math.max(1, week.length);
  const recoveryDays = week.filter((d) => d.recovery).length;

  const deepCount = Math.round((avgFocus / 10) * totalCompleted);
  const movementCount = Math.round((recoveryDays / Math.max(1, week.length)) * totalCompleted);
  const remaining = Math.max(0, totalCompleted - deepCount - movementCount);
  const shallowCount = Math.round(remaining * 0.7);
  const windDownCount = remaining - shallowCount;

  const taskMix = {
    deep: deepCount,
    shallow: shallowCount,
    movement: movementCount,
    windDown: windDownCount,
  };

  const quote = principles[week.length % principles.length] || "Reliability compounds.";

  if (!isUnlocked) return null;

  if (showWizard) {
    return (
      <div className="flex flex-col">
        <WeeklyReviewWizard onClose={() => setShowWizard(false)} />
      </div>
    );
  }

  const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Stagger className="flex flex-col gap-5 pb-6">
      <ScreenHeader
        eyebrow="Sunday · weekly debrief"
        title="Week in review."
        subtitle="A behavioral snapshot — not a scoreboard."
        right={
          <Link
            to="/insights"
            className="hairline flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      {/* Active weekly plan banner */}
      {weeklyAdaptation && weeklyPlan && (
        <StaggerItem className="px-5">
          <Card className="bg-gradient-surface border-accent/20">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Lock className="h-3 w-3 text-accent" />
                  <StatLabel>This week's commitment</StatLabel>
                </div>
                <p className="text-sm font-medium text-foreground">{weeklyPlan.northStar}</p>
              </div>
              <Pill
                tone={weeklyAdaptation.weekMomentum === "building" ? "success" : weeklyAdaptation.weekMomentum === "declining" ? "danger" : "muted"}
                className="text-[9px] flex-none capitalize"
              >
                {weeklyAdaptation.weekMomentum}
              </Pill>
            </div>
            <div className="space-y-1.5">
              {weeklyAdaptation.outcomeProgress.map((outcome, i) => (
                outcome.text ? (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`flex h-4 w-4 flex-none items-center justify-center rounded-full text-[9px] font-bold mt-0.5 ${outcome.progressSignal === "complete" ? "bg-success/20 text-success" : outcome.progressSignal === "on-track" ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"}`}>
                      {outcome.progressSignal === "complete" ? "✓" : i + 1}
                    </div>
                    <p className="text-xs text-muted-foreground flex-1">{outcome.text}</p>
                  </div>
                ) : null
              ))}
            </div>
            {(weeklyPlan.blockerGuard || weeklyPlan.distractionGuard) && (
              <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap gap-1.5">
                {weeklyPlan.blockerGuard && (
                  <Pill tone="warning" className="text-[9px] capitalize">
                    <Shield className="h-2.5 w-2.5 mr-0.5" />
                    {weeklyPlan.blockerGuard.blockerType}
                  </Pill>
                )}
                {weeklyPlan.distractionGuard && (
                  <Pill tone="accent" className="text-[9px] capitalize">
                    <Zap className="h-2.5 w-2.5 mr-0.5" />
                    {weeklyPlan.distractionGuard.distractionType}
                  </Pill>
                )}
              </div>
            )}
          </Card>
        </StaggerItem>
      )}

      {/* Week tracking card */}
      {weeklyAdaptation && (
        <StaggerItem className="px-5">
          <Card>
            <StatLabel className="mb-3 block">Week capacity · today's view</StatLabel>
            <div className="flex gap-1.5 mb-2">
              {[1, 2, 3, 4, 5].map((dow) => {
                const cap = weeklyAdaptation.dayCapacities[dow];
                const todayDow = new Date().getDay();
                const isToday = dow === todayDow;
                return (
                  <div key={dow} className={`flex-1 rounded-xl px-1 py-2 text-center ${isToday ? "bg-accent/10 ring-1 ring-accent/30" : "bg-secondary/40"}`}>
                    <p className={`text-[9px] font-medium mb-1 ${isToday ? "text-accent" : "text-muted-foreground"}`}>
                      {DAY_NAMES_SHORT[dow].slice(0, 1)}
                    </p>
                    <p className={`font-display text-lg ${isToday ? "text-accent" : "text-foreground"}`}>{cap?.adaptedTaskCap ?? "—"}</p>
                    {cap?.warningFlags[0] && (
                      <p className="text-[8px] text-warning/80 leading-tight mt-0.5">{cap.warningFlags[0].slice(0, 12)}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">
                Remaining capacity: ~{Math.round(weeklyAdaptation.remainingCapacityMin / 45)} task slots
              </span>
              <span className={`font-medium ${weeklyAdaptation.todayFocusEmphasis === "deep" ? "text-accent" : weeklyAdaptation.todayFocusEmphasis === "recovery" ? "text-warning" : "text-muted-foreground"}`}>
                Today: {weeklyAdaptation.todayFocusEmphasis}
              </span>
            </div>
          </Card>
        </StaggerItem>
      )}

      {/* CTA to start weekly review — gated to establishing+ */}
      {!weeklyAdaptation && (userStage === "establishing" || userStage === "established") && (
        <StaggerItem className="px-5">
          <button onClick={() => setShowWizard(true)} className="w-full">
            <TapCard className="bg-gradient-surface p-5 hairline rounded-3xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <CalendarCheck className="h-4 w-4 text-accent" />
                    <StatLabel>Weekly plan</StatLabel>
                  </div>
                  <p className="font-display text-lg text-foreground">Start weekly review</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-[30ch]">
                    Set your north star, lock in 3 outcomes, and shape your capacity for the week.
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-accent flex-none" />
              </div>
            </TapCard>
          </button>
        </StaggerItem>
      )}

      {/* Revise plan CTA when plan is active */}
      {weeklyAdaptation && (
        <StaggerItem className="px-5">
          <button
            onClick={() => setShowWizard(true)}
            className="w-full text-center text-xs text-muted-foreground py-1"
          >
            Revise this week's plan
          </button>
        </StaggerItem>
      )}

      {/* Maturity gate nudge for fresh/exploring users */}
      {!weeklyAdaptation && userStage !== "establishing" && userStage !== "established" && (
        <StaggerItem className="px-5">
          <Card className="border-dashed">
            <p className="text-xs text-muted-foreground text-center">
              Weekly planning unlocks after 7 check-ins. Keep going.
            </p>
          </Card>
        </StaggerItem>
      )}

      <StaggerItem className="px-5">
        <Card className="bg-gradient-surface">
          <div className="flex items-center gap-5">
            <Ring value={wkAvg} label="Avg score" />
            <div>
              <StatLabel>vs last week</StatLabel>
              <p
                className={`font-display mt-1 text-3xl num-tabular ${delta >= 0 ? "text-success" : "text-danger"}`}
              >
                {delta >= 0 ? "+" : ""}
                {delta}
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-[22ch]">
                {momentum.trend === "up"
                  ? "Reliable upward drift."
                  : momentum.trend === "down"
                    ? "Execution velocity is cooling."
                    : "Maintaining baseline momentum."}
              </p>
            </div>
          </div>
        </Card>
      </StaggerItem>

      <StaggerItem className="px-5">
        <Card>
          <StatLabel className="mb-4 block">Execution Mix</StatLabel>
          <div className="space-y-4">
            <BarRow label="Deep Work" value={taskMix.deep} max={totalCompleted} tone="accent" />
            <BarRow label="Shallow / Admin" value={taskMix.shallow} max={totalCompleted} />
            <BarRow label="Movement" value={taskMix.movement} max={totalCompleted} tone="accent" />
            <BarRow label="Wind-down" value={taskMix.windDown} max={totalCompleted} />
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground leading-relaxed">
            Your execution is{" "}
            {taskMix.deep > taskMix.shallow
              ? "weighted towards high-leverage deep work."
              : "heavily split by admin tasks."}
          </p>
        </Card>
      </StaggerItem>

      <StaggerItem className="px-5 grid grid-cols-3 gap-2.5">
        <Stat label="Tasks done" value={totalCompleted} unit="" />
        <Stat
          label="Best day"
          value={bestDay.executionScore}
          unit=""
          sub={new Date(bestDay.date).toLocaleDateString("en-US", { weekday: "short" })}
        />
        <Stat
          label="Worst day"
          value={worstDay.executionScore}
          unit=""
          sub={new Date(worstDay.date).toLocaleDateString("en-US", { weekday: "short" })}
        />
      </StaggerItem>

      <StaggerItem className="px-5 grid grid-cols-3 gap-2.5">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-3 w-3 text-accent" />
            <StatLabel>Resilience</StatLabel>
          </div>
          <p className="font-display text-2xl num-tabular text-foreground">
            {resilience.score}
            <span className="text-xs text-muted-foreground ml-1">pts</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {resilience.avgRecoveryDays}d avg recovery
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-3 w-3 text-success" />
            <StatLabel>Consistency</StatLabel>
          </div>
          <p className="font-display text-2xl num-tabular text-foreground">
            {consistency}
            <span className="text-xs text-muted-foreground ml-1">%</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Last 14 days</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-3 w-3 text-warning" />
            <StatLabel>Streak</StatLabel>
          </div>
          <p className="font-display text-2xl num-tabular text-foreground">
            {streakCtx.currentStreak}
            <span className="text-xs text-muted-foreground ml-1">d</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {streakCtx.streakType === "resilience" ? "resilience" : "exec"} · best{" "}
            {streakCtx.longest}d
          </p>
        </Card>
      </StaggerItem>

      {/* Day-of-week performance */}
      {dowProfile.bestDay && (
        <StaggerItem className="px-5">
          <Card>
            <StatLabel className="mb-3 block">Day-of-Week Performance</StatLabel>
            <div className="flex items-end gap-1.5 h-16">
              {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
                const stats = dowProfile.byDay[dow];
                const score = stats?.avgScore ?? 0;
                const isBest = dowProfile.bestDay?.dow === dow;
                const isWorst = dowProfile.worstDay?.dow === dow;
                return (
                  <div key={dow} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-sm ${isBest ? "bg-success" : isWorst ? "bg-danger/60" : "bg-accent/40"}`}
                      style={{ height: `${Math.max(8, score)}%` }}
                    />
                    <span
                      className={`text-[9px] font-medium ${isBest ? "text-success" : isWorst ? "text-danger/80" : "text-muted-foreground"}`}
                    >
                      {dowProfile.dayNames[dow].slice(0, 1)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="text-success font-semibold">
                {dowProfile.bestDay.dayName}: ~{dowProfile.bestDay.avgScore}
              </span>
              {dowProfile.worstDay && (
                <span className="text-danger/80 font-semibold">
                  {dowProfile.worstDay.dayName}: ~{dowProfile.worstDay.avgScore}
                </span>
              )}
            </div>
          </Card>
        </StaggerItem>
      )}

      {/* This Week's Friction */}
      {(() => {
        const topFriction = distractionProfile.topDistractors.find((d) => d.avgScoreImpact < -3);
        const hasBlockerStreak = !!blockerPattern.streak;
        if (!topFriction && !hasBlockerStreak) return null;
        return (
          <StaggerItem className="px-5">
            <Card className="border-warning/15 bg-warning/5">
              <StatLabel className="mb-3 block text-warning">This Week's Friction</StatLabel>
              <div className="space-y-2.5">
                {topFriction && (
                  <div className="flex items-center gap-2">
                    <Pill tone="warning" className="text-[9px]">
                      distraction
                    </Pill>
                    <span className="text-sm text-foreground capitalize flex-1">
                      {topFriction.id.replace("-", " ")}
                    </span>
                    <span className="text-xs font-semibold text-danger">
                      {topFriction.avgScoreImpact} pts avg
                    </span>
                  </div>
                )}
                {hasBlockerStreak && blockerPattern.streak && (
                  <div className="flex items-center gap-2">
                    <Pill tone="warning" className="text-[9px]">
                      blocker
                    </Pill>
                    <span className="text-sm text-foreground capitalize flex-1">
                      {blockerPattern.streak.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {blockerPattern.streak.days}d in a row
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </StaggerItem>
        );
      })()}

      {/* Distraction mix */}
      {distractionProfile.topDistractors.length > 0 && (
        <StaggerItem className="px-5">
          <Card>
            <StatLabel className="mb-3 block">Distraction Mix · This Week</StatLabel>
            <div className="space-y-2.5">
              {distractionProfile.topDistractors.slice(0, 4).map((d) => (
                <div key={d.id} className="flex items-center gap-2">
                  <span className="text-sm text-foreground capitalize flex-1">
                    {d.id.replace("-", " ")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{d.frequency}d</span>
                  <span
                    className={`text-xs font-semibold ${d.avgScoreImpact < -3 ? "text-danger" : d.avgScoreImpact < 0 ? "text-warning" : "text-muted-foreground"}`}
                  >
                    {d.avgScoreImpact > 0 ? "+" : ""}
                    {d.avgScoreImpact} pts
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </StaggerItem>
      )}

      <StaggerItem className="px-5">
        <Card>
          <StatLabel>Daily execution · this week</StatLabel>
          <div className="mt-4 flex h-32 items-end gap-2">
            {week.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-accent/60 to-accent transition-all"
                    style={{ height: `${d.executionScore}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">
                  {new Date(d.date).toLocaleDateString("en-US", { weekday: "narrow" })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </StaggerItem>

      <StaggerItem className="px-5">
        <Card>
          <StatLabel>Heatmap · 4 weeks</StatLabel>
          <div className="mt-4">
            <ExecutionHeatmap weeks={4} />
          </div>
        </Card>
      </StaggerItem>

      <StaggerItem className="px-5 space-y-3">
        <h2 className="px-1 text-sm font-semibold tracking-tight text-foreground">
          Behavioral insights
        </h2>
        {activeInsights.length > 0 ? (
          activeInsights.slice(-3).map((x, i) => (
            <Card key={x.id}>
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${
                    x.type === "warning"
                      ? "bg-warning/15 text-warning"
                      : x.type === "breakthrough"
                        ? "bg-success/15 text-success"
                        : "bg-accent/15 text-accent"
                  }`}
                >
                  {x.type === "warning" ? (
                    <Brain className="h-4 w-4" />
                  ) : x.type === "breakthrough" ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{x.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{x.body}</p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <p className="px-1 text-xs text-muted-foreground">
            No behavioral patterns identified yet. Keep logging to unlock.
          </p>
        )}
      </StaggerItem>

      <StaggerItem className="px-5">
        <Card className="bg-gradient-surface">
          <div className="flex items-start gap-3">
            <Quote className="h-5 w-5 text-accent flex-none mt-0.5" />
            <p className="font-display text-lg leading-snug text-foreground">{quote}</p>
          </div>
        </Card>
      </StaggerItem>

      <StaggerItem className="px-5 space-y-2">
        <h2 className="px-1 text-sm font-semibold tracking-tight text-foreground">
          Next week · leverage
        </h2>
        <Card>
          <div className="space-y-3">
            {flags.flags.length > 0 ? (
              flags.flags.map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md bg-accent/20 text-accent text-[10px] font-bold num-tabular">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{t}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md bg-success/20 text-success text-[10px] font-bold num-tabular">
                  !
                </div>
                <div>
                  <p className="text-sm text-foreground">Perfect execution rhythm detected.</p>
                  <p className="text-[11px] text-muted-foreground">Maintain current protocols.</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </StaggerItem>

      <StaggerItem className="px-5">
        <Link to="/premium">
          <TapCard className="bg-gradient-surface p-5 hairline rounded-3xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Pill tone="accent">
                  <Crown className="h-3 w-3" /> Pro
                </Pill>
                <p className="font-display mt-2 text-lg text-foreground">
                  Unlock adaptive coaching
                </p>
                <p className="mt-1 max-w-[28ch] text-xs text-muted-foreground">
                  Personalized weekly protocols, focus pattern analysis, and predictive recovery
                  alerts.
                </p>
              </div>
              <Target className="h-5 w-5 text-accent" />
            </div>
          </TapCard>
        </Link>
      </StaggerItem>
    </Stagger>
  );
}

function Stat({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: number | string;
  unit: string;
  sub?: string;
}) {
  return (
    <Card>
      <StatLabel>{label}</StatLabel>
      <p className="font-display mt-1 text-2xl num-tabular text-foreground">
        {value}
        <span className="text-sm text-muted-foreground">{unit}</span>
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  );
}
