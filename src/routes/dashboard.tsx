import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useVisibleRoutes } from "@/lib/maturity";
import { BarRow, Card, Pill, Ring, ScreenHeader, StatLabel } from "@/components/ui-bits";
import {
  useActiveInsights,
  useApp,
  useConsistency,
  useExecutionScore,
  useFakeProductivityFlags,
  useMomentum,
  useResilience,
  useTaskIntelligence,
  useUserState,
} from "@/lib/store";
import {
  AlertTriangle,
  Brain,
  Crown,
  Lightbulb,
  Moon,
  Shield,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Execution Status — Cadence" },
      {
        name: "description",
        content: "Your capacity, priorities, and focus window for today.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const visibleRoutes = useVisibleRoutes();
  const isUnlocked = visibleRoutes.includes("this-week");
  useEffect(() => {
    if (!isUnlocked) navigate({ to: "/" });
  }, [isUnlocked, navigate]);

  const score = useExecutionScore();
  const { delta, trend } = useMomentum();
  const consistency = useConsistency(28);
  const history = useApp((s) => s.history);
  const tasks = useApp((s) => s.tasks);
  const activeInsights = useActiveInsights();
  const recoveryPlan = useApp((s) => s.recoveryPlan);
  const { state, label, tone } = useUserState();
  const { score: resilience } = useResilience();
  const flags = useFakeProductivityFlags();
  const taskIntel = useTaskIntelligence();

  const last28 = history.slice(-28);

  const avgSleep = useMemo(
    () => last28.reduce((a, d) => a + d.sleepHours, 0) / Math.max(1, last28.length),
    [last28],
  );
  const avgFocus = useMemo(
    () => last28.reduce((a, d) => a + d.focus, 0) / Math.max(1, last28.length),
    [last28],
  );

  const burnoutRisk = useMemo(() => {
    const lowSleep = last28.slice(-7).filter((d) => d.sleepHours < 6).length;
    const lowDays = last28.slice(-7).filter((d) => d.executionScore < 50).length;
    const distractions = last28.slice(-7).reduce((a, d) => a + d.distractions, 0);
    return Math.min(100, lowSleep * 14 + lowDays * 12 + distractions * 4);
  }, [last28]);

  // 8am–8pm (13 bars)
  const hourlyFocus = useMemo(() => {
    const startHour = avgSleep > 7.5 ? 8 : 10;
    return Array.from({ length: 13 }, (_, i) => {
      const hour = i + 8;
      const morningPeak = 100 * Math.exp(-Math.pow(hour - (startHour + 1.5), 2) / 8);
      const eveningBump = 40 * Math.exp(-Math.pow(hour - 17, 2) / 4);
      return { hour, value: Math.round(Math.max(15, morningPeak + eveningBump) * (avgFocus / 7)) };
    });
  }, [avgFocus, avgSleep]);

  const primeWindowStr = useMemo(() => {
    const startHour = avgSleep > 7.5 ? 8 : 10;
    const endHour = startHour + 2;
    const fmt = (h: number) => `${h > 12 ? h - 12 : h}${h < 12 ? "AM" : "PM"}`;
    return `${fmt(startHour)}–${fmt(endHour)}`;
  }, [avgSleep]);

  if (!isUnlocked) return null;

  return (
    <div className="flex flex-col gap-5 pb-12 lg:gap-7 lg:pb-8">
      <ScreenHeader
        eyebrow={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        title="Execution Status"
        subtitle="Your capacity, priorities, and focus window for today."
        right={
          <div className="hidden lg:flex items-center gap-2">
            <Pill tone={tone}>{label}</Pill>
            <Link
              to="/premium"
              className="hairline rounded-full px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            >
              <Crown className="h-3.5 w-3.5 text-accent" /> Pro
            </Link>
          </div>
        }
      />

      {/* Section 1 — Status */}
      <section className="px-5 lg:px-0">
        <Card className="bg-gradient-to-br from-secondary/50 to-secondary/20 border-accent/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="flex-1">
              <StatLabel>Execution score</StatLabel>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-6xl lg:text-7xl text-foreground">
                  {Math.round(score)}
                </span>
                <div className="flex flex-col gap-1">
                  <Pill tone={trend === "up" ? "success" : trend === "down" ? "danger" : "neutral"}>
                    {trend === "up" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : trend === "down" ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : null}
                    {trend === "up"
                      ? "Building momentum"
                      : trend === "down"
                        ? "Recovering"
                        : "Stable"}
                  </Pill>
                  <p className="text-[11px] text-muted-foreground">
                    {trend === "up" ? "+" : ""}
                    {delta} from last week
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 lg:gap-6">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Momentum
                  </p>
                  <p
                    className={`font-display text-2xl ${trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-foreground"}`}
                  >
                    {delta > 0 ? "+" : ""}
                    {delta}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Consistency
                  </p>
                  <p className="font-display text-2xl text-foreground">{consistency}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Resilience
                  </p>
                  <p className="font-display text-2xl text-foreground">{resilience}</p>
                </div>
              </div>
            </div>
            <div className="mt-8 lg:mt-0 flex-shrink-0">
              <Ring value={score} size={160} stroke={12} label="Today" />
            </div>
          </div>
        </Card>
      </section>

      {/* Section 2 — Prime Focus Window */}
      <section className="px-5 lg:px-0">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <StatLabel>Prime Focus Window</StatLabel>
            <Pill tone="accent">Peak · {primeWindowStr}</Pill>
          </div>
          <div className="flex h-[140px] items-end gap-1">
            {hourlyFocus.map((h) => (
              <div
                key={h.hour}
                className="group relative flex flex-1 flex-col items-center justify-end"
              >
                <div
                  className="w-full rounded-t-md bg-gradient-accent transition-opacity"
                  style={{ height: `${h.value}%`, opacity: 0.4 + (h.value / 100) * 0.6 }}
                  title={`${h.hour}:00 · ${h.value}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>8a</span>
            <span>10a</span>
            <span>12p</span>
            <span>2p</span>
            <span>4p</span>
            <span>6p</span>
            <span>8p</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Your highest-output window is {primeWindowStr}. Schedule your deepest task here.{" "}
            <Link to="/insights" className="text-accent hover:underline">
              See your full pattern breakdown in Insights →
            </Link>
          </p>
        </Card>
      </section>

      {/* Section 3 — Workload Intelligence */}
      <section className="px-5 lg:px-0">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <StatLabel>Active priorities</StatLabel>
              {taskIntel.todayLoadRisk && (
                <Pill
                  tone={
                    taskIntel.todayLoadRisk === "overloaded"
                      ? "danger"
                      : taskIntel.todayLoadRisk === "underloaded"
                        ? "warning"
                        : "success"
                  }
                >
                  {taskIntel.todayLoadRisk}
                </Pill>
              )}
            </div>
            <div className="space-y-2">
              {tasks
                .filter((t) => !t.done)
                .slice(0, 5)
                .map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-2 rounded-lg bg-secondary/50 p-2.5"
                  >
                    <div className="h-4 w-4 rounded-full bg-accent/40 flex-shrink-0 mt-0.5" />
                    <span className="text-[13px] text-foreground">{t.label}</span>
                  </div>
                ))}
              {tasks.filter((t) => !t.done).length === 0 && (
                <p className="text-xs text-muted-foreground italic p-2.5">
                  No active tasks. Time for recovery or planning.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <StatLabel className="mb-4 block">Workload Intelligence</StatLabel>
            <div className="space-y-3">
              {taskIntel.suggestedCap && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Suggested cap
                  </p>
                  <p className="text-sm text-foreground">{taskIntel.suggestedCap} tasks today</p>
                </div>
              )}
              {taskIntel.typeBalanceWarning && (
                <p className="text-xs text-warning/90">{taskIntel.typeBalanceWarning}</p>
              )}
              {taskIntel.rescheduleAlerts.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                    Stuck tasks
                  </p>
                  {taskIntel.rescheduleAlerts.slice(0, 2).map((a) => (
                    <p key={a.taskId} className="text-xs text-warning/80">
                      "{a.label.slice(0, 36)}
                      {a.label.length > 36 ? "…" : ""}" rescheduled {a.count}x
                    </p>
                  ))}
                </div>
              )}
              {!taskIntel.typeBalanceWarning && taskIntel.rescheduleAlerts.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Task mix looks balanced for today.
                </p>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Section 4 — Anti-Fake Productivity */}
      <section className="px-5 lg:px-0">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-warning" />
            <StatLabel>Anti-fake productivity</StatLabel>
          </div>
          <BarRow label="Plan → execute ratio" value={flags.planExecuteRatio} tone="accent" />
          <div className="mt-4 space-y-2">
            {flags.flags.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No signals detected. Execution is genuine.
              </p>
            )}
            {flags.flags.map((f, i) => (
              <p key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 flex-none text-warning mt-0.5" />
                <span>{f}</span>
              </p>
            ))}
          </div>
        </Card>
      </section>

      {/* Section 5 — Behavioral Insights teaser */}
      <section className="px-5 lg:px-0">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" />
            <StatLabel>Behavioral insights</StatLabel>
          </div>
          <div className="space-y-3">
            {activeInsights.slice(0, 3).map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight.title}
                impact={insight.body.split(".")[0] + "."}
                suggestion={insight.body.split(".").slice(1).join(".").trim()}
              />
            ))}
            {activeInsights.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                Calibrating... more insights will appear as you log data.
              </p>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-border/50">
            <Link to="/insights" className="text-xs font-medium text-accent hover:underline">
              See full diagnostic →
            </Link>
          </div>
        </Card>
      </section>

      {/* Section 6 — Active Alerts */}
      {(state === "recovery" || state === "burnout" || burnoutRisk > 35) && (
        <section className="px-5 lg:px-0">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {(state === "recovery" || state === "burnout") && (
              <Card className="bg-gradient-to-br from-success/5 to-transparent border-success/20">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-success/15">
                    <Shield className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <StatLabel>Recovery mode active</StatLabel>
                    <p className="mt-2 text-sm text-foreground font-medium">
                      {recoveryPlan?.protocol || "Minimum viable day approach"}
                    </p>
                    <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                      {recoveryPlan?.tasks.slice(0, 3).map((t, i) => <p key={i}>• {t.t}</p>) || (
                        <>
                          <p>• Reduce surface area by 50%</p>
                          <p>• Focus on 1 keystone habit</p>
                          <p>• Sleep anchor: 10:30 PM</p>
                        </>
                      )}
                    </div>
                    <Link
                      to="/recovery"
                      className="mt-3 inline-block text-xs font-medium text-success hover:text-success/80"
                    >
                      View protocols →
                    </Link>
                  </div>
                </div>
              </Card>
            )}

            {burnoutRisk > 35 && (
              <Card
                className={
                  burnoutRisk > 60
                    ? "bg-danger/5 border-danger/20"
                    : "bg-warning/5 border-warning/20"
                }
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${burnoutRisk > 60 ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"}`}
                    >
                      <Moon className="h-5 w-5" />
                    </div>
                    <div>
                      <p
                        className={`font-display text-lg ${burnoutRisk > 60 ? "text-danger" : "text-warning"}`}
                      >
                        {burnoutRisk > 60 ? "High burnout risk" : "Early burnout signals detected"}
                      </p>
                      <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">
                        Weighted from sleep debt, distraction load, low-execution days, and
                        reschedule patterns.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/recovery"
                    className={`self-start lg:self-auto rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
                      burnoutRisk > 60
                        ? "bg-danger/20 text-danger hover:bg-danger/30"
                        : "bg-warning/20 text-warning hover:bg-warning/30"
                    }`}
                  >
                    Recovery protocols
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function InsightCard({
  insight,
  impact,
  suggestion,
}: {
  insight: string;
  impact: string;
  suggestion: string;
}) {
  return (
    <div className="rounded-2xl bg-secondary/40 border border-border/50 p-3">
      <p className="text-sm font-medium text-foreground">{insight}</p>
      <p className="mt-1 text-xs text-muted-foreground">{impact}</p>
      {suggestion && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-accent font-medium">
          <Lightbulb className="h-3 w-3" />
          {suggestion}
        </p>
      )}
    </div>
  );
}
