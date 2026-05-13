import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Pill, Ring, ScreenHeader, Sparkline, StatLabel } from "@/components/ui-bits";
import { ArrowUpRight, Check, Crown, Plus, RotateCcw, Sparkles, Sunrise, Sun, Moon } from "lucide-react";
import { useApp, useConsistency, useExecutionScore, useMomentum, useResilience, useUserState } from "@/lib/store";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Cadence" },
      { name: "description", content: "Your execution score, momentum, and focus goals for today." },
    ],
  }),
  component: Home,
});

function Home() {
  const score = useExecutionScore();
  const { delta, trend } = useMomentum();
  const consistency = useConsistency(14);
  const tasks = useApp((s) => s.tasks);
  const toggleTask = useApp((s) => s.toggleTask);
  const recoveryMode = useApp((s) => s.recoveryMode);
  const history = useApp((s) => s.history);
  const trend14 = useMemo(() => history.slice(-14).map((d) => d.executionScore), [history]);

  const completed = tasks.filter((t) => t.done).length;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 11) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const momentumLabel = recoveryMode
    ? "In recovery"
    : trend === "up"
    ? "Building back"
    : trend === "down"
    ? "Slipping"
    : "Steady";

  return (
    <div className="flex flex-col gap-4 pb-6">
      <ScreenHeader
        eyebrow={new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        title={`${greeting}, Alex.`}
        subtitle={
          recoveryMode
            ? "You're in recovery. Smaller surface area, faster reps."
            : trend === "up"
            ? "Momentum is building. Protect it — keep today small and finishable."
            : "Steady hand today. Don't over-plan; execute three things well."
        }
        right={
          <Link to="/identity" className="hairline rounded-full px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground">
            Profile
          </Link>
        }
      />

      <section className="px-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-surface p-6 hairline shadow-elegant">
          <div className="bg-glow absolute inset-0" />
          <div className="relative flex items-center gap-6">
            <Ring value={score} label="Execution" sub="Today" />
            <div className="flex-1 space-y-3">
              <div>
                <StatLabel>Momentum</StatLabel>
                <p className="mt-1 text-lg font-medium text-foreground">{momentumLabel}</p>
                <div className={`mt-1 flex items-center gap-1.5 text-xs ${delta >= 0 ? "text-success" : "text-danger"}`}>
                  <ArrowUpRight className={`h-3.5 w-3.5 ${delta < 0 ? "rotate-90" : ""}`} />
                  <span className="num-tabular">{delta >= 0 ? "+" : ""}{delta} pts vs last week</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recoveryMode ? (
                  <Pill tone="warning"><span className="h-1.5 w-1.5 rounded-full bg-warning" /> Recovery mode</Pill>
                ) : (
                  <Pill tone="success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> On track</Pill>
                )}
                <Pill tone="accent">{consistency}% consistent · 14d</Pill>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5">
        <Card>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <StatLabel>Execution trend · 14 days</StatLabel>
              <p className="font-display mt-1 text-2xl text-foreground">{consistency}<span className="text-muted-foreground text-lg">%</span></p>
            </div>
            <Pill tone={trend === "up" ? "success" : trend === "down" ? "danger" : "neutral"}>
              {trend === "up" ? "Trending up" : trend === "down" ? "Slipping" : "Holding"}
            </Pill>
          </div>
          <Sparkline data={trend14} accent />
          <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
            <span>2 weeks ago</span><span>1 week ago</span><span>Today</span>
          </div>
        </Card>
      </section>

      <TasksSection tasks={tasks} toggleTask={toggleTask} completed={completed} />

      {recoveryMode && (
        <section className="px-5">
          <Link to="/recovery" className="group block">
            <Card className="bg-gradient-surface">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <StatLabel>Recovery protocol active</StatLabel>
                  <p className="font-display mt-1 text-lg text-foreground">Open today's minimum viable plan</p>
                  <p className="mt-1.5 max-w-[28ch] text-xs text-muted-foreground">
                    We've reduced load to rebuild momentum. Three things, then rest.
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </Card>
          </Link>
        </section>
      )}

      <section className="px-5 grid grid-cols-2 gap-2.5">
        <Link to="/weekly">
          <Card>
            <Sparkles className="h-4 w-4 text-accent" />
            <p className="mt-2 text-sm font-medium text-foreground">Weekly report</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Patterns from week 19</p>
          </Card>
        </Link>
        <Link to="/premium">
          <Card>
            <Crown className="h-4 w-4 text-accent" />
            <p className="mt-2 text-sm font-medium text-foreground">Cadence Pro</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Adaptive coaching</p>
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

function TasksSection({ tasks, toggleTask, completed }: { tasks: ReturnType<typeof useApp.getState>["tasks"]; toggleTask: (id: string) => void; completed: number }) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const addTask = useApp((s) => s.addTask);
  const resetDemo = useApp((s) => s.resetDemo);

  return (
    <section className="px-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Today's priorities</h2>
        <span className="text-[11px] text-muted-foreground num-tabular">{completed} of {tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => {
          const done = t.done;
          return (
            <button
              key={t.id}
              onClick={() => toggleTask(t.id)}
              className={`hairline flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left transition-all active:scale-[0.99]`}
            >
              <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-lg border transition ${done ? "border-success bg-success/15 text-success" : "border-border bg-secondary text-transparent"}`}>
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t.estMin > 0 ? `${t.estMin} min` : "—"} · {t.type}
                </p>
              </div>
            </button>
          );
        })}
        {adding ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (label.trim()) {
                addTask({ label: label.trim(), estMin: 30, type: "deep" });
                setLabel("");
                setAdding(false);
              }
            }}
            className="hairline flex items-center gap-2 rounded-2xl bg-card px-3 py-2"
          >
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="One thing that actually matters…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />
            <button type="submit" className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background">Add</button>
          </form>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setAdding(true)}
              disabled={tasks.length >= 5}
              className="hairline flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[12px] text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> Add priority {tasks.length >= 5 && "(cap reached)"}
            </button>
            <button
              onClick={resetDemo}
              className="hairline flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-[12px] text-muted-foreground hover:text-foreground"
              title="Reset demo data"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {tasks.length >= 5 && (
          <p className="px-1 text-[11px] text-warning">More than 5 priorities is overplanning. Cut something.</p>
        )}
      </div>
    </section>
  );
}
