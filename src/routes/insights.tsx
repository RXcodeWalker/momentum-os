import { createFileRoute, Link } from "@tanstack/react-router";
import { BarRow, Card, Pill, ScreenHeader, Sparkline, StatLabel } from "@/components/ui-bits";
import { ExecutionHeatmap } from "@/components/heatmap";
import { AlertTriangle, ArrowRight, Eye, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useApp, useFakeProductivityFlags } from "@/lib/store";
import { useMemo } from "react";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Cadence" },
      { name: "description", content: "Behavioral patterns, anti-fake-productivity signals, and weekly analysis." },
    ],
  }),
  component: Insights,
});

function Insights() {
  const history = useApp((s) => s.history);
  const flags = useFakeProductivityFlags();
  const last14 = history.slice(-14);

  const focusByHour = useMemo(() => {
    // synthesized from history; bias by avg focus
    const avgFocus = last14.reduce((a, d) => a + d.focus, 0) / Math.max(1, last14.length);
    const base = [40, 55, 72, 85, 78, 62, 50, 58, 65, 68, 55, 38, 28];
    return base.map((v) => Math.round(v * (avgFocus / 7)));
  }, [last14]);

  const recoverySpeed = useMemo(() => {
    let dips = 0, recovers = 0, days = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i - 1].executionScore < 50) {
        dips++;
        for (let j = i; j < history.length; j++) {
          days++;
          if (history[j].executionScore >= 65) { recovers++; break; }
        }
      }
    }
    return dips ? (days / dips).toFixed(1) : "—";
  }, [history]);

  const insights = [
    { icon: Sparkles, q: "You lose focus after 8 PM.", body: "Tasks logged after 20:00 have 41% lower focus quality. Move deep work to mornings.", tone: "accent" as const },
    { icon: TrendingUp, q: "Your best days follow exercise.", body: "Days after a Z2 run average 87 execution vs 64 baseline. The signal is consistent across 6 weeks.", tone: "success" as const },
    { icon: AlertTriangle, q: "You overestimate daily workload.", body: `You plan ${(last14.reduce((a,d)=>a+d.planned,0)/last14.length).toFixed(1)} priorities/day on average; you complete ${(last14.reduce((a,d)=>a+d.completed,0)/last14.length).toFixed(1)}. Cap at 3 to raise execution by ~18%.`, tone: "warning" as const },
    { icon: Sparkles, q: "You recover faster with shorter task lists.", body: "After a miss, days with ≤3 priorities recover momentum 2.1× faster than days with 5+.", tone: "accent" as const },
  ];

  return (
    <div className="flex flex-col gap-5 pb-6">
      <ScreenHeader
        eyebrow={`Week ${getWeekNum()} · ${formatRange()}`}
        title="What your behavior is telling us."
        subtitle="Patterns, not performance. The goal is self-knowledge."
        right={
          <Link to="/weekly" className="hairline rounded-full px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground">
            Weekly →
          </Link>
        }
      />

      <section className="px-5">
        <div className="grid grid-cols-2 gap-2.5">
          <Card>
            <StatLabel>Plan vs execute</StatLabel>
            <p className="font-display mt-1 text-3xl num-tabular text-foreground">{flags.planExecuteRatio}<span className="text-base text-muted-foreground">%</span></p>
            <div className={`mt-1 flex items-center gap-1 text-[11px] ${flags.planExecuteRatio < 60 ? "text-danger" : "text-success"}`}>
              {flags.planExecuteRatio < 60 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {flags.planExecuteRatio < 60 ? "overplanning trend" : "executing well"}
            </div>
          </Card>
          <Card>
            <StatLabel>Recovery speed</StatLabel>
            <p className="font-display mt-1 text-3xl num-tabular text-foreground">{recoverySpeed}<span className="text-base text-muted-foreground">d</span></p>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-success">
              <TrendingUp className="h-3 w-3" /> faster than last cycle
            </div>
          </Card>
        </div>
      </section>

      <section className="px-5">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <StatLabel>Execution heatmap · 4 weeks</StatLabel>
            <span className="text-[10px] text-muted-foreground">Today →</span>
          </div>
          <ExecutionHeatmap weeks={4} />
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Low</span>
            <div className="flex gap-1">
              {[25, 50, 65, 80, 92].map((v) => (
                <span key={v} className="h-2 w-3 rounded-sm" style={{
                  background: v < 40 ? "oklch(0.68 0.18 25 / 0.55)" :
                             v < 55 ? "oklch(0.78 0.14 75 / 0.30)" :
                             v < 70 ? "oklch(0.78 0.14 75 / 0.55)" :
                             v < 85 ? "oklch(0.85 0.16 80 / 0.75)" :
                                      "oklch(0.78 0.14 155 / 0.80)"
                }} />
              ))}
            </div>
            <span>High</span>
          </div>
        </Card>
      </section>

      <section className="px-5 space-y-3">
        <h2 className="px-1 text-sm font-semibold tracking-tight text-foreground">AI behavioral insights</h2>
        {insights.map((x, i) => {
          const Icon = x.icon;
          return (
            <Card key={i}>
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${
                  x.tone === "warning" ? "bg-warning/15 text-warning" : x.tone === "success" ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-display text-base leading-snug text-foreground">"{x.q}"</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{x.body}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="px-5">
        <Card>
          <StatLabel>Focus quality by hour</StatLabel>
          <div className="mt-4 flex h-32 items-end gap-1">
            {focusByHour.map((v, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-foreground/80 transition-all hover:bg-accent" style={{ height: `${Math.min(100, v)}%` }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>8a</span><span>12p</span><span>4p</span><span>8p</span><span>12a</span>
          </div>
        </Card>
      </section>

      <section className="px-5 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Anti-fake-productivity</h2>
          <Pill tone="warning"><Eye className="h-3 w-3" /> {flags.flags.length} flags</Pill>
        </div>
        <Card>
          <div className="space-y-4">
            <BarRow label="Plans created vs executed" value={flags.planExecuteRatio} tone={flags.planExecuteRatio < 60 ? "danger" : "accent"} />
            <BarRow label="Deep work : shallow work" value={32} tone="danger" />
            <BarRow label="Sleep regularity" value={61} />
            <BarRow label="Phone pickups during deep work" value={84} tone="danger" />
          </div>
        </Card>
        {flags.flags.map((f, i) => (
          <Card key={i} className="bg-gradient-surface">
            <p className="font-display text-base leading-snug text-foreground">{f}</p>
          </Card>
        ))}
      </section>

      <section className="px-5">
        <Card>
          <StatLabel>Consistency · 4 weeks</StatLabel>
          <div className="mt-3">
            <Sparkline data={history.slice(-28).map(d => d.executionScore)} accent />
          </div>
        </Card>
      </section>

      <section className="px-5">
        <Link to="/weekly" className="group block">
          <Card className="bg-gradient-surface">
            <div className="flex items-center justify-between">
              <div>
                <StatLabel>Weekly behavioral report</StatLabel>
                <p className="font-display mt-1 text-lg text-foreground">Open this week's analysis</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
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
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const f = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${f(monday)}–${f(sunday).split(" ")[1]}`;
}
