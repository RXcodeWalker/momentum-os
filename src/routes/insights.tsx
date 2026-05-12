import { createFileRoute } from "@tanstack/react-router";
import { BarRow, Card, Pill, ScreenHeader, Sparkline, StatLabel } from "@/components/ui-bits";
import { AlertTriangle, Eye, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Cadence" },
      { name: "description", content: "Behavioral patterns, anti-fake-productivity signals, and weekly analysis." },
    ],
  }),
  component: Insights,
});

const focusByHour = [40, 55, 72, 85, 78, 62, 50, 58, 65, 68, 55, 38, 28];

function Insights() {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <ScreenHeader
        eyebrow="Week 19 · May 5–11"
        title="What your behavior is telling us."
        subtitle="Patterns, not performance. The goal is self-knowledge."
      />

      <section className="px-5">
        <div className="grid grid-cols-2 gap-2.5">
          <Card>
            <StatLabel>Plan vs execute</StatLabel>
            <p className="font-display mt-1 text-3xl num-tabular text-foreground">54<span className="text-base text-muted-foreground">%</span></p>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-danger">
              <TrendingDown className="h-3 w-3" /> overplanning trend
            </div>
          </Card>
          <Card>
            <StatLabel>Recovery speed</StatLabel>
            <p className="font-display mt-1 text-3xl num-tabular text-foreground">1.4<span className="text-base text-muted-foreground">d</span></p>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-success">
              <TrendingUp className="h-3 w-3" /> faster than last week
            </div>
          </Card>
        </div>
      </section>

      <section className="px-5 space-y-3">
        <h2 className="px-1 text-sm font-semibold tracking-tight text-foreground">AI behavioral insights</h2>
        {[
          { icon: Sparkles, q: "You lose focus after 8 PM.", body: "Tasks logged after 20:00 have 41% lower focus quality. Move deep work to mornings.", tone: "accent" as const },
          { icon: TrendingUp, q: "Your best days follow exercise.", body: "Days after a Z2 run average 87 execution vs 64 baseline. The signal is consistent across 6 weeks.", tone: "success" as const },
          { icon: AlertTriangle, q: "You overestimate daily workload.", body: "You plan 6.4 priorities/day on average; you complete 3.1. Cap at 3 to raise execution score by ~18%.", tone: "warning" as const },
          { icon: Sparkles, q: "You recover faster with shorter task lists.", body: "After a miss, days with ≤3 priorities recover momentum 2.1× faster than days with 5+.", tone: "accent" as const },
        ].map((x, i) => {
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
              <div key={i} className="flex-1 rounded-t-md bg-foreground/80 transition-all hover:bg-accent" style={{ height: `${v}%` }} />
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
          <Pill tone="warning"><Eye className="h-3 w-3" /> 3 flags</Pill>
        </div>
        <Card>
          <div className="space-y-4">
            <BarRow label="Plans created vs executed" value={54} tone="danger" />
            <BarRow label="Deep work : shallow work" value={32} tone="danger" />
            <BarRow label="Sleep regularity" value={61} />
            <BarRow label="Phone pickups during deep work" value={84} tone="danger" />
          </div>
        </Card>
        <Card className="bg-gradient-surface">
          <p className="font-display text-base leading-snug text-foreground">
            You spent <span className="text-gradient">3h17 organizing</span> tasks this week and <span className="text-gradient">1h49 doing deep work</span>. That ratio is the pattern to watch.
          </p>
        </Card>
      </section>

      <section className="px-5">
        <Card>
          <StatLabel>Consistency · 8 weeks</StatLabel>
          <div className="mt-3">
            <Sparkline data={[55, 62, 48, 70, 65, 72, 68, 81]} accent />
          </div>
        </Card>
      </section>
    </div>
  );
}
