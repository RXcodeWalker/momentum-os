import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, Pill, Ring, ScreenHeader, StatLabel } from "@/components/ui-bits";
import {
  ArrowRight,
  Sparkles,
  Users,
  Zap,
  Lightbulb,
  TrendingUp,
  Target,
  Calendar,
  TrendingDown,
} from "lucide-react";
import {
  useApp,
  useLatestInsight,
  useUserState,
  useTomorrowBriefing,
  useScoreAttribution,
  type CheckIn,
} from "@/lib/store";
import {
  CHECK_IN_MESSAGES,
  CHECK_IN_TITLES,
  CHECK_IN_SUBTITLES,
  CHECK_IN_RESULTS,
} from "@/lib/constants";
import { toast } from "sonner";
import { CheckInForm } from "@/components/check-in/CheckInForm";
import { CheckInWizard } from "@/components/check-in/CheckInWizard";

export const Route = createFileRoute("/check-in")({
  head: () => ({
    meta: [
      { title: "Check-in — Cadence" },
      { name: "description", content: "Reflect efficiently. We use this to keep you honest." },
    ],
  }),
  component: CheckInPage,
});

function CheckInPage() {
  const nav = useNavigate();
  const tasks = useApp((s) => s.tasks);
  const toggleTask = useApp((s) => s.toggleTask);
  const rescheduleTask = useApp((s) => s.rescheduleTask);
  const saveCheckIn = useApp((s) => s.saveCheckIn);
  const unlockInsight = useApp((s) => s.unlockInsight);
  const addProof = useApp((s) => s.addProof);
  const recoveryMode = useApp((s) => s.recoveryMode);
  const checkInStyle = useApp((s) => s.checkInStyle);
  const insights = useApp((s) => s.insights);
  const currentUserId = useApp((s) => s.currentUserId);
  const { state } = useUserState();
  const newInsight = useLatestInsight();

  const tomorrowBriefing = useTomorrowBriefing();
  const attribution = useScoreAttribution();

  const [result, setResult] = useState<{
    newScore: number;
    delta: number;
    unlockedInsight?: string;
    tomorrowFocus?: string;
  } | null>(null);
  const [sharedProof, setSharedProof] = useState(false);

  const completed = tasks.filter((t) => t.done).length;
  const planned = tasks.length;
  const completionRatio = planned > 0 ? completed / planned : 1;

  const handleSave = (data: Omit<CheckIn, "date"> & { tomorrowFocus?: string }) => {
    const r = saveCheckIn(data);

    // Variable insight reward
    let unlockedInsight: string | undefined;
    if (r.newScore >= 70 && data.focus >= 7 && data.sleepHours >= 7) {
      unlockInsight("i6");
      unlockedInsight = insights.find((i) => i.id === "i6")?.title;
    } else if (r.newScore >= 55 && data.distractions.length <= 1) {
      unlockInsight("i5");
      unlockedInsight = insights.find((i) => i.id === "i5")?.title;
    }

    setResult({ ...r, unlockedInsight, tomorrowFocus: data.tomorrowFocus });
    toast.success("Check-in complete", { description: "Your behavioral signal has been logged." });
  };

  const shareProof = () => {
    if (!result) return;
    addProof({
      memberId: currentUserId,
      text: `Completed evening check-in · Execution: ${result.newScore}% · ${completed}/${planned} tasks done.`,
      type: result.newScore >= 70 ? "milestone" : "recovery",
    });
    setSharedProof(true);
    toast.success("Proof shared", { description: "Your circle has been notified." });
  };

  if (result) {
    const triggeredRecovery = result.newScore < 45;
    const resultType = triggeredRecovery
      ? "recovery"
      : result.delta >= 5
        ? "strong"
        : result.delta >= 0
          ? "improving"
          : "mixed";

    return (
      <div className="flex flex-col gap-5 pb-10">
        <ScreenHeader
          eyebrow="Check-in saved"
          title={CHECK_IN_RESULTS[resultType].title}
          subtitle={CHECK_IN_RESULTS[resultType].subtitle}
        />

        <section className="px-5">
          <Card className="bg-gradient-surface">
            <div className="flex items-center gap-5">
              <Ring value={result.newScore} label="Execution" sub="Today" />
              <div>
                <StatLabel>Change vs yesterday</StatLabel>
                <p
                  className={`font-display mt-1 text-3xl num-tabular ${result.delta >= 0 ? "text-success" : "text-danger"}`}
                >
                  {result.delta >= 0 ? "+" : ""}
                  {result.delta}
                </p>
                <p className="mt-1 text-xs text-muted-foreground max-w-[22ch]">
                  Driven by sleep, focus, and {Math.round(completionRatio * 100)}% completion rate.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {result.tomorrowFocus && (
          <section className="px-5">
            <Card className="border-success/30 bg-success/5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-success/20 text-success">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <StatLabel className="text-success">Tomorrow's North Star</StatLabel>
                  <p className="font-display text-base text-foreground mt-0.5">
                    {result.tomorrowFocus}
                  </p>
                </div>
              </div>
            </Card>
          </section>
        )}

        {result.unlockedInsight && (
          <section className="px-5">
            <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/30 hairline">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/20 text-accent">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-accent font-medium mb-1">
                    New insight unlocked
                  </p>
                  <p className="font-display text-base leading-snug text-foreground">
                    "{result.unlockedInsight}"
                  </p>
                </div>
              </div>
            </Card>
          </section>
        )}

        {attribution && attribution.deviations.length > 0 && (
          <section className="px-5">
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-secondary">
                  <TrendingDown className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <StatLabel>What drove today's score</StatLabel>
                  <p className="text-xs text-muted-foreground mt-0.5">vs your personal baseline</p>
                </div>
              </div>
              <div className="space-y-2">
                {attribution.deviations.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{d.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground/60">{d.baseline}</span>
                      <span
                        className={`font-semibold ${d.direction === "boost" ? "text-success" : "text-danger"}`}
                      >
                        {d.direction === "boost" ? "▲" : "▼"} {d.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}

        <section className="px-5">
          <Card>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-secondary">
                <TrendingUp className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <StatLabel>Behavioral signal</StatLabel>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                  {result.newScore >= 70
                    ? CHECK_IN_MESSAGES.high
                    : result.newScore >= 50
                      ? CHECK_IN_MESSAGES.mid
                      : CHECK_IN_MESSAGES.low}
                </p>
              </div>
            </div>
          </Card>
        </section>

        {tomorrowBriefing.hasPlan && tomorrowBriefing.capacityForecast && (
          <section className="px-5">
            <Card className="border-accent/20 bg-accent/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/20 text-accent">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <StatLabel className="text-accent">Tomorrow's Forecast</StatLabel>
                  <p className="font-display text-base text-foreground mt-0.5">
                    ~{tomorrowBriefing.capacityForecast.predictedScore} predicted score
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tomorrowBriefing.insight}
              </p>
              {tomorrowBriefing.suggestedTasks.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                    Suggested priorities
                  </p>
                  {tomorrowBriefing.suggestedTasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent flex-none" />
                      {t.label}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>
        )}

        <section className="px-5 space-y-2">
          {!sharedProof && (
            <button
              onClick={shareProof}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              <Users className="h-4 w-4" /> Share proof to Circle
            </button>
          )}

          <button
            onClick={() => nav({ to: "/" })}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
          >
            Done for today
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <ScreenHeader
        eyebrow={`Evening · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        title={
          state === "burnout"
            ? CHECK_IN_TITLES.burnout
            : state === "recovery"
              ? CHECK_IN_TITLES.recovery
              : CHECK_IN_TITLES.default
        }
        subtitle={state === "burnout" ? CHECK_IN_SUBTITLES.burnout : CHECK_IN_SUBTITLES.default}
        right={recoveryMode ? <Pill tone="warning">Recovery</Pill> : undefined}
      />

      {checkInStyle === "wizard" ? (
        <CheckInWizard
          tasks={tasks}
          state={state}
          onSave={handleSave}
          toggleTask={toggleTask}
          rescheduleTask={rescheduleTask}
        />
      ) : (
        <CheckInForm
          tasks={tasks}
          state={state}
          recoveryMode={recoveryMode}
          onSave={handleSave}
          toggleTask={toggleTask}
          rescheduleTask={rescheduleTask}
        />
      )}
    </div>
  );
}
