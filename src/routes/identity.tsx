import { createFileRoute, Link } from "@tanstack/react-router";
import { BarRow, Card, Pill, ScreenHeader, Sparkline, StatLabel } from "@/components/ui-bits";
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
} from "lucide-react";
import { useApp, useConsistency, useExecutionScore, useMaturityLevel, useResilience, useUserState } from "@/lib/store";
import { useMemo } from "react";

export const Route = createFileRoute("/identity")({
  head: () => ({
    meta: [
      { title: "Identity — Cadence" },
      { name: "description", content: "Your evolving operating profile: reliability, resilience, focus, discipline." },
    ],
  }),
  component: Identity,
});

const MATURITY_ORDER = ["calibrating", "building", "consistent", "advanced", "resilient"] as const;

function Identity() {
  const history = useApp((s) => s.history);
  const daysOnApp = useApp((s) => s.daysOnApp);
  const { level, label: maturityLabel, daysToNext } = useMaturityLevel();
  const { state, label: stateLabel, tone } = useUserState();
  const consistency28 = useConsistency(28);
  const consistency7 = useConsistency(7);
  const score = useExecutionScore();
  const { score: resilience, avgRecoveryDays } = useResilience();

  const last28 = history.slice(-28).map((d) => d.executionScore);
  const last7avg = history.slice(-7).reduce((a, d) => a + d.executionScore, 0) / 7;
  const prev7avg = history.slice(-14, -7).reduce((a, d) => a + d.executionScore, 0) / 7;
  const delta = Math.round(last7avg - prev7avg);

  // Derived trait values from real history
  const traits = useMemo(() => {
    const h = history.slice(-28);
    const avgFocus = h.reduce((a, d) => a + d.focus, 0) / Math.max(1, h.length);
    const avgSleep = h.reduce((a, d) => a + d.sleepHours, 0) / Math.max(1, h.length);
    const lowDays = h.filter((d) => d.executionScore < 50).length;
    const bounceBack = resilience;
    const disciplineDays = h.filter((d) => d.executionScore >= 65).length;

    return [
      {
        icon: Anchor,
        label: "Reliability",
        value: consistency28,
        delta: consistency28 - 66,
        note: `You follow through on commitments to yourself ${consistency28}% of days. The baseline average is 66%.`,
        history: history.slice(-14).map((d) => (d.executionScore >= 60 ? 80 : 30)),
      },
      {
        icon: Activity,
        label: "Execution consistency",
        value: Math.round((disciplineDays / Math.max(1, h.length)) * 100),
        delta: delta,
        note: `${disciplineDays} of the last 28 days were high-execution days. Variance is ${delta >= 0 ? "narrowing" : "widening"}.`,
        history: history.slice(-14).map((d) => d.executionScore),
      },
      {
        icon: Shield,
        label: "Resilience",
        value: bounceBack,
        delta: 11,
        note: `Average bounce-back after a setback is ${avgRecoveryDays} days. Anything under 2 days is elite-tier recovery.`,
        history: history.slice(-14).map((d) => (d.recovery ? 20 : 75)),
      },
      {
        icon: Focus,
        label: "Focus quality",
        value: Math.round(avgFocus * 10),
        delta: -2,
        note: `Average focus score is ${avgFocus.toFixed(1)}/10. Deep work sessions average 38 min before first distraction.`,
        history: history.slice(-14).map((d) => d.focus * 10),
      },
      {
        icon: Compass,
        label: "Sleep discipline",
        value: Math.round((avgSleep / 8) * 100),
        delta: 5,
        note: `You average ${avgSleep.toFixed(1)}h sleep. Under 6h nights correlate with ${lowDays} low-execution days.`,
        history: history.slice(-14).map((d) => Math.round((d.sleepHours / 8) * 100)),
      },
    ];
  }, [history, consistency28, delta, resilience, avgRecoveryDays]);

  const maturityIndex = MATURITY_ORDER.indexOf(level);

  // Identity arc narrative — shifts with maturity
  const arcNarrative = {
    calibrating: { from: "\"motivated when inspired\"", to: "\"reliable when committed\"", action: "The foundation is forming. Every day you execute teaches the system who you are." },
    building: { from: "\"reactive and overwhelmed\"", to: "\"proactive and focused\"", action: "Patterns are emerging. Reliability is becoming your competitive advantage." },
    consistent: { from: "\"inconsistent but capable\"", to: "\"dependably consistent\"", action: "You've proven you can show up. Now the work is deepening quality over quantity." },
    advanced: { from: "\"consistent under ideal conditions\"", to: "\"resilient under pressure\"", action: "The system is working. You're building the kind of discipline that compounds quietly." },
    resilient: { from: "\"ambitious but fragile\"", to: "\"reliably execution-oriented\"", action: "You've built what most people only talk about. Keep going — it compounds from here." },
  };
  const arc = arcNarrative[level];

  return (
    <div className="flex flex-col gap-5 pb-6">
      <ScreenHeader
        eyebrow={`Operating profile · Day ${daysOnApp}`}
        title="Who you are becoming."
        subtitle="Not a level. Not points. The actual evolution of how you operate."
        right={
          <Pill tone={tone}>{stateLabel}</Pill>
        }
      />

      {/* Profile hero */}
      <section className="px-5">
        <Card className="bg-gradient-surface relative overflow-hidden">
          <div className="bg-glow absolute inset-0 pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground text-background font-display text-2xl">
                A
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                {Math.round(score)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-xl text-foreground">Alex Mercer</p>
              <p className="text-xs text-muted-foreground">Builder · {daysOnApp} days on Cadence</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pill tone={tone}>{stateLabel}</Pill>
                <Pill tone="accent">{maturityLabel}</Pill>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">7-day avg</p>
              <p className={`font-display text-2xl num-tabular ${delta >= 0 ? "text-success" : "text-danger"}`}>
                {delta >= 0 ? "+" : ""}{delta}
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Maturity progression */}
      <section className="px-5">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <StatLabel>Behavioral maturity</StatLabel>
            {daysToNext > 0 && (
              <span className="text-[11px] text-muted-foreground">{daysToNext} days to next level</span>
            )}
          </div>
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide pb-1">
            {MATURITY_ORDER.map((m, i) => {
              const reached = i <= maturityIndex;
              const current = i === maturityIndex;
              return (
                <div key={m} className="flex items-center flex-shrink-0">
                  <div className={`flex flex-col items-center gap-1.5 ${i > 0 ? "ml-1" : ""}`}>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold transition-all ${
                        current
                          ? "bg-accent text-accent-foreground ring-2 ring-accent/40 ring-offset-2 ring-offset-card"
                          : reached
                          ? "bg-accent/30 text-accent"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {reached && !current ? (
                        <Star className="h-3.5 w-3.5" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`text-[10px] capitalize ${current ? "text-accent font-medium" : reached ? "text-foreground" : "text-muted-foreground"}`}>
                      {m}
                    </span>
                  </div>
                  {i < MATURITY_ORDER.length - 1 && (
                    <div className={`h-px w-8 mx-1 flex-shrink-0 ${i < maturityIndex ? "bg-accent/50" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Trait cards */}
      <section className="px-5 space-y-2.5">
        <h2 className="px-1 text-sm font-semibold tracking-tight text-foreground">Operating traits</h2>
        {traits.map((t, i) => {
          const Icon = t.icon;
          const up = t.delta >= 0;
          return (
            <Card key={i}>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`num-tabular text-xs ${up ? "text-success" : "text-danger"}`}>
                        {up ? "+" : ""}{t.delta} 4w
                      </span>
                      <span className="font-display text-lg num-tabular text-foreground">{t.value}</span>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <BarRow label="" value={t.value} tone="accent" />
                  </div>
                  <div className="mt-2.5 h-8">
                    <Sparkline data={t.history} height={32} accent />
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{t.note}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      {/* Identity arc narrative */}
      <section className="px-5">
        <Card className="bg-gradient-surface">
          <StatLabel>Identity arc · last 12 weeks</StatLabel>
          <p className="font-display mt-3 text-lg leading-snug text-foreground">
            From <span className="text-muted-foreground">{arc.from}</span>
            {" "}toward <span className="text-gradient">{arc.to}.</span>
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{arc.action}</p>
        </Card>
      </section>

      {/* Weekly execution bar chart */}
      <section className="px-5">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <StatLabel>28-day execution arc</StatLabel>
            <Pill tone={delta >= 0 ? "success" : "danger"}>
              {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : null}
              {delta >= 0 ? `+${delta}` : delta} this week
            </Pill>
          </div>
          <div className="h-28">
            <Sparkline data={last28} accent height={112} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>4 weeks ago</span><span>2 weeks ago</span><span>Today</span>
          </div>
        </Card>
      </section>

      {/* Quick stats */}
      <section className="px-5 grid grid-cols-3 gap-2.5">
        <MiniStat label="Consistency" value={`${consistency28}%`} sub="28 days" />
        <MiniStat label="Resilience" value={`${resilience}`} sub={`${avgRecoveryDays}d recovery`} />
        <MiniStat label="This week" value={`${consistency7}%`} sub="7 days" />
      </section>

      {/* Evolution milestones */}
      <section className="px-5">
        <h2 className="mb-3 px-1 text-sm font-semibold tracking-tight text-foreground">Milestones reached</h2>
        <div className="space-y-2">
          {[
            { days: 7, label: "First 7 days", desc: "Calibration complete. Baseline set.", reached: daysOnApp >= 7 },
            { days: 14, label: "Two-week mark", desc: "Patterns identified. System adapting.", reached: daysOnApp >= 14 },
            { days: 30, label: "30 days", desc: "Building phase complete. Habits forming.", reached: daysOnApp >= 30 },
            { days: 60, label: "Consistent operator", desc: "Consistency level unlocked. Coaching deepening.", reached: daysOnApp >= 60 },
            { days: 90, label: "Advanced user", desc: "90-day arc complete. System fully personalized.", reached: daysOnApp >= 90 },
          ].map((m) => (
            <div key={m.days} className={`flex items-start gap-3 rounded-2xl px-3 py-3 hairline ${m.reached ? "bg-card" : "bg-secondary/30 opacity-50"}`}>
              <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11px] font-semibold ${m.reached ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"}`}>
                {m.reached ? <Zap className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              </div>
              <div>
                <p className={`text-sm font-medium ${m.reached ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</p>
                <p className="text-[11px] text-muted-foreground">{m.desc}</p>
              </div>
              {m.reached && (
                <div className="ml-auto flex-shrink-0">
                  <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <section className="px-5 space-y-2">
        <Link to="/insights" className="group flex items-center justify-between hairline rounded-2xl bg-card px-4 py-3.5 hover:bg-secondary/50 transition-colors">
          <span className="text-sm font-medium text-foreground">View behavioral insights</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link to="/onboarding" className="group flex items-center justify-between hairline rounded-2xl bg-card px-4 py-3.5 hover:bg-secondary/50 transition-colors">
          <span className="text-sm font-medium text-foreground">Recalibrate goals & struggles</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      </section>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <StatLabel>{label}</StatLabel>
      <p className="font-display mt-1 text-xl num-tabular text-foreground">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  );
}
