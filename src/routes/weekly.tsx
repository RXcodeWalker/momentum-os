import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Pill, Ring, ScreenHeader, Sparkline, StatLabel } from "@/components/ui-bits";
import { ExecutionHeatmap } from "@/components/heatmap";
import { useApp, useFakeProductivityFlags } from "@/lib/store";
import { ArrowLeft, Brain, Crown, Quote, Sparkles, Target, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/weekly")({
  head: () => ({
    meta: [
      { title: "Weekly report — Cadence" },
      { name: "description", content: "A behavioral report card. Patterns, wins, and next-week leverage." },
    ],
  }),
  component: Weekly,
});

function Weekly() {
  const history = useApp((s) => s.history);
  const flags = useFakeProductivityFlags();
  const week = history.slice(-7);
  const prev = history.slice(-14, -7);

  const avg = (arr: { executionScore: number }[]) =>
    arr.length ? Math.round(arr.reduce((a, d) => a + d.executionScore, 0) / arr.length) : 0;

  const wkAvg = avg(week);
  const prevAvg = avg(prev);
  const delta = wkAvg - prevAvg;

  const totalDeep = week.reduce((a, d) => a + d.completed, 0);
  const bestDay = week.reduce((b, d) => (d.executionScore > b.executionScore ? d : b), week[0]);
  const worstDay = week.reduce((b, d) => (d.executionScore < b.executionScore ? d : b), week[0]);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <ScreenHeader
        eyebrow="Sunday · weekly debrief"
        title="Week in review."
        subtitle="A behavioral snapshot — not a scoreboard."
        right={
          <Link to="/insights" className="hairline flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      <section className="px-5">
        <Card className="bg-gradient-surface">
          <div className="flex items-center gap-5">
            <Ring value={wkAvg} label="Avg score" />
            <div>
              <StatLabel>vs last week</StatLabel>
              <p className={`font-display mt-1 text-3xl num-tabular ${delta >= 0 ? "text-success" : "text-danger"}`}>
                {delta >= 0 ? "+" : ""}{delta}
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-[22ch]">
                {delta >= 0 ? "Reliable upward drift." : "Pulled down by mid-week dip."}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="px-5 grid grid-cols-3 gap-2.5">
        <Stat label="Deep tasks" value={totalDeep} unit="" />
        <Stat label="Best day" value={bestDay.executionScore} unit="" sub={new Date(bestDay.date).toLocaleDateString("en-US", { weekday: "short" })} />
        <Stat label="Worst day" value={worstDay.executionScore} unit="" sub={new Date(worstDay.date).toLocaleDateString("en-US", { weekday: "short" })} />
      </section>

      <section className="px-5">
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
      </section>

      <section className="px-5">
        <Card>
          <StatLabel>Heatmap · 4 weeks</StatLabel>
          <div className="mt-4">
            <ExecutionHeatmap weeks={4} />
          </div>
        </Card>
      </section>

      <section className="px-5 space-y-3">
        <h2 className="px-1 text-sm font-semibold tracking-tight text-foreground">This week's behavioral signals</h2>
        {[
          { icon: TrendingUp, title: "Sleep is your top lever", body: `Days you slept >7h averaged ${Math.round(wkAvg + 8)} execution. Below 6h: ${Math.max(20, wkAvg - 18)}.`, tone: "success" as const },
          { icon: Brain, title: "You overplanned twice this week", body: "Tuesday and Thursday: 6+ priorities each. Both days dropped completion to <50%.", tone: "warning" as const },
          { icon: Sparkles, title: "Mornings are sacred", body: "9–11 AM is your highest-focus window. 73% of your deep work landed here.", tone: "accent" as const },
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
                  <p className="text-sm font-medium text-foreground">{x.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{x.body}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="px-5">
        <Card className="bg-gradient-surface">
          <div className="flex items-start gap-3">
            <Quote className="h-5 w-5 text-accent flex-none mt-0.5" />
            <p className="font-display text-lg leading-snug text-foreground">
              You're getting more <span className="text-gradient">predictable</span> — and that's the entire game. Reliability compounds.
            </p>
          </div>
        </Card>
      </section>

      <section className="px-5 space-y-2">
        <h2 className="px-1 text-sm font-semibold tracking-tight text-foreground">Next week · leverage</h2>
        <Card>
          <div className="space-y-3">
            {[
              { t: "Cap daily priorities at 3", note: "Projected execution lift: +18%" },
              { t: "Protect 9–11 AM as deep-work block", note: "Aligns with your peak focus window" },
              { t: "One non-negotiable: 7h sleep minimum", note: "Single biggest predictor of next-day score" },
            ].map((x, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md bg-accent/20 text-accent text-[10px] font-bold num-tabular">{i + 1}</div>
                <div>
                  <p className="text-sm text-foreground">{x.t}</p>
                  <p className="text-[11px] text-muted-foreground">{x.note}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="px-5">
        <Link to="/premium">
          <Card className="bg-gradient-surface">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Pill tone="accent"><Crown className="h-3 w-3" /> Pro</Pill>
                <p className="font-display mt-2 text-lg text-foreground">Unlock adaptive coaching</p>
                <p className="mt-1 max-w-[28ch] text-xs text-muted-foreground">
                  Personalized weekly protocols, focus pattern analysis, and predictive recovery alerts.
                </p>
              </div>
              <Target className="h-5 w-5 text-accent" />
            </div>
          </Card>
        </Link>
      </section>
    </div>
  );
}

function Stat({ label, value, unit, sub }: { label: string; value: number | string; unit: string; sub?: string }) {
  return (
    <Card>
      <StatLabel>{label}</StatLabel>
      <p className="font-display mt-1 text-2xl num-tabular text-foreground">{value}<span className="text-sm text-muted-foreground">{unit}</span></p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  );
}
