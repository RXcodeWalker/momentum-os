import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Pill, Ring, ScreenHeader, Sparkline, StatLabel } from "@/components/ui-bits";
import { ArrowUpRight, Flame, MoonStar, Target, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Cadence" },
      { name: "description", content: "Your execution score, momentum, and focus goals for today." },
    ],
  }),
  component: Home,
});

const trend = [42, 51, 48, 60, 58, 67, 72, 70, 78, 74, 81, 86, 83, 88];

function Home() {
  const score = 78;
  return (
    <div className="flex flex-col gap-4 pb-6">
      <ScreenHeader
        eyebrow="Tuesday · May 12"
        title="Good evening, Alex."
        subtitle="You're in a recovery upswing. Keep the surface area small today."
        right={
          <Link to="/onboarding" className="hairline rounded-full px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground">
            Setup
          </Link>
        }
      />

      <section className="px-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-surface p-6 hairline shadow-elegant">
          <div className="bg-glow absolute inset-0" />
          <div className="relative flex items-center gap-6">
            <Ring value={score} label="Execution" sub="Last 7 days" />
            <div className="flex-1 space-y-3">
              <div>
                <StatLabel>Momentum</StatLabel>
                <p className="mt-1 text-lg font-medium text-foreground">Building back</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-success">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span className="num-tabular">+12 pts vs last week</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Pill tone="success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Recovered</Pill>
                <Pill tone="accent">Day 3 streak</Pill>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5">
        <Card>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <StatLabel>Consistency · 14 days</StatLabel>
              <p className="font-display mt-1 text-2xl text-foreground">81<span className="text-muted-foreground text-lg">%</span></p>
            </div>
            <Pill tone="accent">Trending up</Pill>
          </div>
          <Sparkline data={trend} accent />
          <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
            <span>Apr 28</span><span>May 5</span><span>Today</span>
          </div>
        </Card>
      </section>

      <section className="px-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Daily focus</h2>
          <span className="text-[11px] text-muted-foreground">3 of 4 priorities</span>
        </div>
        <div className="space-y-2">
          {[
            { icon: Target, label: "Deep work — Linear algebra problem set", time: "90 min", state: "done" },
            { icon: Zap, label: "Ship signup screen", time: "45 min", state: "active" },
            { icon: Flame, label: "Run · Zone 2", time: "30 min", state: "done" },
            { icon: MoonStar, label: "Wind down · screens off by 22:30", time: "—", state: "todo" },
          ].map((t, i) => {
            const Icon = t.icon;
            const done = t.state === "done";
            const active = t.state === "active";
            return (
              <div key={i} className={`hairline flex items-center gap-3 rounded-2xl bg-card px-4 py-3 ${active ? "shadow-glow" : ""}`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${done ? "bg-success/15 text-success" : active ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.label}</p>
                  <p className="text-[11px] text-muted-foreground">{t.time}</p>
                </div>
                {active && <Pill tone="accent">In progress</Pill>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-5">
        <Link to="/recovery" className="group block">
          <Card className="bg-gradient-surface">
            <div className="flex items-start justify-between gap-3">
              <div>
                <StatLabel>Recovery protocol</StatLabel>
                <p className="font-display mt-1 text-lg text-foreground">Minimum viable day available</p>
                <p className="mt-1.5 max-w-[28ch] text-xs text-muted-foreground">
                  You missed 2 of 4 priorities yesterday. We've drafted a lighter day to rebuild momentum.
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
          </Card>
        </Link>
      </section>

      <section className="px-5">
        <Link to="/check-in">
          <button className="w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background transition-transform active:scale-[0.99]">
            Start evening check-in
          </button>
        </Link>
      </section>
    </div>
  );
}
