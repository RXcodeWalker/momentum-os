import { createFileRoute, Link } from "@tanstack/react-router";
import { BarRow, Card, Pill, Ring, ScreenHeader, Sparkline, StatLabel } from "@/components/ui-bits";
import { ExecutionHeatmap } from "@/components/heatmap";
import {
  useApp,
  useConsistency,
  useExecutionScore,
  useFakeProductivityFlags,
  useMomentum,
  useResilience,
  useUserState,
} from "@/lib/store";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Crown,
  Flame,
  Moon,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
  Lightbulb,
  Rocket,
} from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Center — Cadence" },
      { name: "description", content: "Behavioral analytics, execution trends, focus heatmaps, and resilience curves." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const score = useExecutionScore();
  const { delta, trend } = useMomentum();
  const consistency = useConsistency(28);
  const consistency7 = useConsistency(7);
  const history = useApp((s) => s.history);
  const { state, label, tone } = useUserState();
  const { score: resilience, avgRecoveryDays } = useResilience();
  const flags = useFakeProductivityFlags();

  const last28 = history.slice(-28);
  const trendData = useMemo(() => last28.map((d) => d.executionScore), [last28]);
  const focusData = useMemo(() => last28.map((d) => d.focus * 10), [last28]);
  const sleepData = useMemo(() => last28.map((d) => Math.round(d.sleepHours * 10)), [last28]);
  const distractionData = useMemo(() => last28.map((d) => d.distractions), [last28]);

  const avgSleep = useMemo(
    () => last28.reduce((a, d) => a + d.sleepHours, 0) / Math.max(1, last28.length),
    [last28],
  );
  const avgFocus = useMemo(
    () => last28.reduce((a, d) => a + d.focus, 0) / Math.max(1, last28.length),
    [last28],
  );
  const avgDistraction = useMemo(
    () => last28.reduce((a, d) => a + d.distractions, 0) / Math.max(1, last28.length),
    [last28],
  );

  // Hourly focus heatmap (synthesized from focus avg, biased)
  const hourlyFocus = useMemo(() => {
    const base = [10, 18, 35, 60, 82, 88, 78, 55, 48, 62, 70, 60, 42, 30, 40, 55, 48, 35, 22, 15];
    const factor = avgFocus / 7;
    return base.map((v, i) => ({ hour: i + 5, value: Math.round(v * factor) }));
  }, [avgFocus]);

  const burnoutRisk = useMemo(() => {
    const lowSleep = last28.slice(-7).filter((d) => d.sleepHours < 6).length;
    const lowDays = last28.slice(-7).filter((d) => d.executionScore < 50).length;
    const distractions = last28.slice(-7).reduce((a, d) => a + d.distractions, 0);
    return Math.min(100, lowSleep * 14 + lowDays * 12 + distractions * 4);
  }, [last28]);

  return (
    <div className="flex flex-col gap-5 pb-12 lg:gap-7 lg:pb-8">
      <ScreenHeader
        eyebrow="Command center"
        title="Behavioral overview"
        subtitle="Real-time execution metrics, momentum tracking, and adaptive recovery guidance."
        right={
          <div className="hidden lg:flex items-center gap-2">
            <Pill tone={tone}>{label}</Pill>
            <Link to="/premium" className="hairline rounded-full px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5 text-accent" /> Pro
            </Link>
          </div>
        }
      />

      {/* Premium Execution Score Card - Centerpiece */}
      <section className="px-5 lg:px-0">
        <Card className="lg:col-span-12 bg-gradient-to-br from-secondary/50 to-secondary/20 border-accent/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="flex-1">
              <StatLabel>Execution score</StatLabel>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-6xl lg:text-7xl text-foreground">{Math.round(score)}</span>
                <div className="flex flex-col gap-1">
                  <Pill tone={trend === "up" ? "success" : trend === "down" ? "danger" : "neutral"}>
                    {trend === "up" ? <TrendingUp className="h-3 w-3" /> : trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
                    {trend === "up" ? "Building momentum" : trend === "down" ? "Recovering" : "Stable"}
                  </Pill>
                  <p className="text-[11px] text-muted-foreground">{trend === "up" ? "+" : ""}{delta} from last week</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 lg:gap-6">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Momentum</p>
                  <p className="font-display text-2xl text-foreground">{Math.round(score * 0.85)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Consistency</p>
                  <p className="font-display text-2xl text-foreground">{consistency}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Resilience</p>
                  <p className="font-display text-2xl text-foreground">{resilience}</p>
                </div>
              </div>
            </div>
            <div className="mt-8 lg:mt-0 flex-shrink-0">
              <Ring value={score} size={200} stroke={14} label="Today" />
            </div>
          </div>
        </Card>
      </section>

      {/* Top KPI strip */}
      <section className="px-5 lg:px-0">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KPI
            icon={<Target className="h-4 w-4" />}
            label="Daily focus"
            value={`${Math.round(avgFocus * 10)}`}
            sub={`${Math.round(avgFocus * 10 * 0.9)} hours deep work`}
            tone="accent"
          />
          <KPI
            icon={<Shield className="h-4 w-4" />}
            label="Recovery speed"
            value={`${avgRecoveryDays}d`}
            sub={`Avg bounce-back time`}
            tone="success"
          />
          <KPI
            icon={<Moon className="h-4 w-4" />}
            label="Sleep quality"
            value={`${avgSleep.toFixed(1)}h`}
            sub={`${avgSleep > 7.5 ? "Optimal" : avgSleep > 6 ? "Good" : "Needs work"}`}
            tone={avgSleep > 7.5 ? "success" : avgSleep > 6 ? "accent" : "warning"}
          />
          <KPI
            icon={<Flame className="h-4 w-4" />}
            label="Burnout risk"
            value={`${burnoutRisk}%`}
            sub={burnoutRisk > 60 ? "High — slow down" : burnoutRisk > 35 ? "Elevated" : "Low"}
            tone={burnoutRisk > 60 ? "danger" : burnoutRisk > 35 ? "warning" : "success"}
          />
        </div>
      </section>

      {/* Main grid */}
      <section className="px-5 lg:px-0">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          {/* Momentum Status */}
          <Card className="lg:col-span-6">
            <div className="mb-4 flex items-center justify-between">
              <StatLabel>Momentum status</StatLabel>
              <Rocket className="h-4 w-4 text-accent" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-foreground">Current momentum</span>
                  <span className="text-sm font-medium text-accent">{trend === "up" ? "Ascending" : trend === "down" ? "Recovering" : "Stable"}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-accent" style={{ width: `${Math.min(100, score)}%` }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-3">Recovery progression</p>
                <div className="flex gap-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className={`h-8 flex-1 rounded-lg ${i < Math.ceil(consistency7 / 20) ? "bg-gradient-accent" : "bg-secondary"}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2">You're in your {Math.ceil(consistency7 / 30)}rd week of progression. Maintain consistency to unlock adaptive insights.</p>
            </div>
          </Card>

          {/* Daily Focus Panel */}
          <Card className="lg:col-span-6">
            <div className="mb-4 flex items-center justify-between">
              <StatLabel>Daily focus & workload</StatLabel>
              <Target className="h-4 w-4 text-accent" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-2 text-sm text-foreground">Top priorities</div>
                <div className="space-y-2">
                  {["Complete deep work session", "Review execution metrics", "Rest & recovery"].map((p, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-secondary/50 p-2.5">
                      <div className="h-4 w-4 rounded-full bg-accent/40 flex-shrink-0 mt-0.5" />
                      <span className="text-[13px] text-foreground">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-[11px] text-muted-foreground mb-2">Recommended workload</p>
                <Pill tone="accent">Calibrated for {state === "peak" ? "high intensity" : state === "recovery" ? "rebuilding" : "steady execution"}</Pill>
              </div>
            </div>
          </Card>

          {/* Execution trend — large */}
          <Card className="lg:col-span-7">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <StatLabel>Execution trend · 28 days</StatLabel>
                <p className="font-display mt-1 text-3xl text-foreground">
                  {Math.round(trendData.reduce((a, b) => a + b, 0) / Math.max(1, trendData.length))}
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

          {/* Behavioral Insights */}
          <Card className="lg:col-span-5">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              <StatLabel>Behavioral insights</StatLabel>
            </div>
            <div className="space-y-3">
              <InsightCard 
                insight="Your focus drops after 8 PM"
                impact="correlated with low execution next day"
                suggestion="Try wind-down protocol at 8:30 PM"
              />
              <InsightCard 
                insight="Mondays show 23% workload overestimation"
                impact="leads to midweek crashes"
                suggestion="Plan 20% lighter on Mondays"
              />
              <InsightCard 
                insight="Exercise improves consistency by 18%"
                impact="strongest behavior-execution link"
                suggestion="Anchor morning movement routine"
              />
            </div>
          </Card>

          {/* Heatmap */}
          <Card className="lg:col-span-5">
            <div className="mb-4 flex items-center justify-between">
              <StatLabel>Execution heatmap · 4 weeks</StatLabel>
              <span className="text-[10px] text-muted-foreground">low · mid · high</span>
            </div>
            <ExecutionHeatmap weeks={4} />
            <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
            </div>
          </Card>

          {/* Focus by hour */}
          <Card className="lg:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <StatLabel>Focus quality by hour</StatLabel>
              <Pill tone="accent">Peak window · 9–11 AM</Pill>
            </div>
            <div className="flex h-[160px] items-end gap-1">
              {hourlyFocus.map((h) => (
                <div key={h.hour} className="group relative flex flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-accent transition-opacity"
                    style={{ height: `${h.value}%`, opacity: 0.4 + (h.value / 100) * 0.6 }}
                    title={`${h.hour}:00 · ${h.value}`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>5a</span><span>9a</span><span>1p</span><span>5p</span><span>9p</span><span>12a</span>
            </div>
          </Card>

          {/* Anti-fake productivity */}
          <Card className="lg:col-span-5">
            <div className="mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-warning" />
              <StatLabel>Anti-fake productivity</StatLabel>
            </div>
            <BarRow label="Plan → execute ratio" value={flags.planExecuteRatio} tone="accent" />
            <div className="mt-4 space-y-2">
              {flags.flags.length === 0 && (
                <p className="text-xs text-muted-foreground">No signals detected. Execution is genuine.</p>
              )}
              {flags.flags.map((f, i) => (
                <p key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 flex-none text-warning mt-0.5" />
                  <span>{f}</span>
                </p>
              ))}
            </div>
          </Card>

          {/* Sleep & energy */}
          <Card className="lg:col-span-4">
            <StatLabel>Sleep · 28d</StatLabel>
            <p className="font-display mt-1 text-2xl text-foreground">
              {avgSleep.toFixed(1)}<span className="text-muted-foreground text-base">h avg</span>
            </p>
            <div className="mt-3 h-[80px]">
              <Sparkline data={sleepData} height={80} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Days under 6h are followed by a {Math.round(35 + Math.random() * 10)}% drop in execution.
            </p>
          </Card>

          {/* Distractions */}
          <Card className="lg:col-span-4">
            <StatLabel>Distractions · 28d</StatLabel>
            <p className="font-display mt-1 text-2xl text-foreground">
              {avgDistraction.toFixed(1)}<span className="text-muted-foreground text-base"> /day</span>
            </p>
            <div className="mt-3 h-[80px]">
              <Sparkline data={distractionData} height={80} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Peak distraction window: 8–10 PM. Wind-down protocol cuts this ~40%.
            </p>
          </Card>

          {/* Behavioral evolution */}
          <Card className="lg:col-span-4">
            <StatLabel>Behavioral growth</StatLabel>
            <div className="mt-3 space-y-3">
              <Evolution label="Reliability" value={Math.min(100, consistency + 8)} />
              <Evolution label="Focus quality" value={Math.round(avgFocus * 10)} />
              <Evolution label="Recovery speed" value={resilience} />
              <Evolution label="Sleep discipline" value={Math.round((avgSleep / 8) * 100)} />
              <Evolution label="Honesty" value={78} />
            </div>
          </Card>

          {/* Resilience curve */}
          <Card className="lg:col-span-7">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <StatLabel>Resilience curve</StatLabel>
                <p className="font-display mt-1 text-2xl text-foreground">
                  {resilience}<span className="text-muted-foreground text-base"> / 100</span>
                </p>
              </div>
              <Pill tone="success">
                <Zap className="h-3 w-3" /> {avgRecoveryDays}d avg recovery
              </Pill>
            </div>
            <div className="h-[120px]">
              <Sparkline data={focusData} height={120} accent />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Recovered from {Math.max(2, Math.round(28 / 6))} behavioral dips. System reinforces fast bounce-back over rigid streaks.
            </p>
          </Card>

          {/* Recovery Mode Card - Key Differentiator */}
          {state === "recovery" || state === "burnout" ? (
            <Card className="lg:col-span-5 bg-gradient-to-br from-success/5 to-transparent border-success/20">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-success/15">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <StatLabel>Recovery mode active</StatLabel>
                  <p className="mt-2 text-sm text-foreground font-medium">Minimum viable day approach</p>
                  <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <p>• Reduce surface area by 50%</p>
                    <p>• Focus on 1 keystone habit</p>
                    <p>• Sleep anchor: 10:30 PM</p>
                  </div>
                  <Link to="/recovery" className="mt-3 inline-block text-xs font-medium text-success hover:text-success/80">
                    View protocols →
                  </Link>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Burnout alert */}
          {burnoutRisk > 35 && (
            <Card className={`lg:col-span-${state === "recovery" || state === "burnout" ? "7" : "12"} ${burnoutRisk > 60 ? "bg-danger/5 border-danger/20" : "bg-warning/5 border-warning/20"}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${burnoutRisk > 60 ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"}`}>
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`font-display text-lg ${burnoutRisk > 60 ? "text-danger" : "text-warning"}`}>
                      {burnoutRisk > 60 ? "High burnout risk" : "Early burnout signals detected"}
                    </p>
                    <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">
                      Weighted from sleep debt, distraction load, low-execution days, and reschedule patterns.
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
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "success" | "danger" | "warning" | "accent" | "neutral";
}) {
  const ring: Record<string, string> = {
    success: "text-success",
    danger: "text-danger",
    warning: "text-warning",
    accent: "text-accent",
    neutral: "text-muted-foreground",
  };
  return (
    <div className="hairline rounded-2xl bg-card p-4 lg:p-5">
      <div className="flex items-center justify-between">
        <StatLabel>{label}</StatLabel>
        <span className={ring[tone]}>{icon}</span>
      </div>
      <p className="font-display mt-2 text-3xl text-foreground num-tabular">{value}</p>
      <p className={`mt-1 inline-flex items-center gap-1 text-[11px] ${ring[tone]}`}>
        {tone === "danger" ? <ArrowDownRight className="h-3 w-3" /> : tone === "success" ? <ArrowUpRight className="h-3 w-3" /> : null}
        <span>{sub}</span>
      </p>
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
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-accent" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

function InsightCard({ insight, impact, suggestion }: { insight: string; impact: string; suggestion: string }) {
  return (
    <div className="rounded-2xl bg-secondary/40 border border-border/50 p-3">
      <p className="text-sm font-medium text-foreground">{insight}</p>
      <p className="mt-1 text-xs text-muted-foreground">{impact}</p>
      <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-accent font-medium">
        <Lightbulb className="h-3 w-3" />
        {suggestion}
      </p>
    </div>
  );
}
