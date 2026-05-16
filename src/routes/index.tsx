import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Pill, Ring, ScreenHeader, Sparkline, StatLabel } from "@/components/ui-bits";
import { ArrowUpRight, Check, Crown, Plus, RotateCcw, Sparkles, Sunrise, Sun, Moon } from "lucide-react";
import { useApp, useConsistency, useExecutionScore, useMomentum, useResilience, useUserState, useLatestInsight } from "@/lib/store";
import { useMemo, useState } from "react";
import { Stagger, StaggerItem, TapCard, AnimatedNumber, FadeUp } from "@/lib/motion";
import { StateRibbon } from "@/components/cards/StateRibbon";
import { BehavioralNote } from "@/components/cards/BehavioralNote";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
  const { state, label: stateLabel, tone: stateTone } = useUserState();
  const { score: resilience, avgRecoveryDays } = useResilience();
  const tasks = useApp((s) => s.tasks);
  const toggleTask = useApp((s) => s.toggleTask);
  const recoveryMode = useApp((s) => s.recoveryMode);
  const history = useApp((s) => s.history);
  const trend14 = useMemo(() => history.slice(-14).map((d) => d.executionScore), [history]);

  const completed = tasks.filter((t) => t.done).length;

  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const phase: "morning" | "midday" | "evening" = hour < 11 ? "morning" : hour < 17 ? "midday" : "evening";

  const subtitle = (() => {
    if (state === "burnout") return "Burnout signals detected. Cut the surface area in half — sleep is the lever today.";
    if (state === "recovery") return "You're in recovery. Smaller surface, faster reps. Three things, then rest.";
    if (state === "peak") return "You're in a peak window. Stretch into deeper work — protect sleep at all costs.";
    if (state === "inconsistent") return "Variance is high. Anchor one keystone behavior before adding anything else.";
    return "Steady hand today. Don't over-plan — execute three things well.";
  })();

  const momentumLabel = recoveryMode
    ? "In recovery"
    : trend === "up"
    ? "Building back"
    : trend === "down"
    ? "Slipping"
    : "Steady";

  const latestInsight = useLatestInsight();

  return (
    <div className="flex flex-col gap-4 pb-6 lg:gap-6 lg:pb-8">
      <ScreenHeader
        eyebrow={new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        title={`${greeting}, Alex.`}
        subtitle={subtitle}
        right={
          <div className="hidden lg:flex items-center gap-2">
            <Pill tone={stateTone}>{stateLabel}</Pill>
            <Link to="/identity" className="hairline rounded-full px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground">
              Profile
            </Link>
          </div>
        }
      />

      <FadeUp delay={0.05}>
        <StateRibbon />
      </FadeUp>

      <Stagger className="grid grid-cols-1 gap-4 px-5 lg:px-0 lg:grid-cols-12 lg:gap-5" gap={0.07}>
        <StaggerItem className="lg:col-span-7">
          <TapCard>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-surface p-6 hairline shadow-elegant lg:p-7">
              <div className="bg-glow absolute inset-0 animate-pulse-glow" />
              <div className="relative flex items-center gap-6 lg:gap-8">
                <Ring value={score} size={140} stroke={11} label="Execution" sub="Today" />
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
                      <Pill tone="warning"><span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" /> Recovery mode</Pill>
                    ) : (
                      <Pill tone={stateTone}>{stateLabel}</Pill>
                    )}
                    <Pill tone="accent">{consistency}% consistent · 14d</Pill>
                    <Pill tone="neutral">Resilience {resilience}</Pill>
                  </div>
                </div>
              </div>
            </div>
          </TapCard>
        </StaggerItem>

        <StaggerItem className="lg:col-span-5">
          <Card className="h-full">
            <div className="mb-3 flex items-center justify-between">
              <StatLabel>Today's flow</StatLabel>
              <span className="text-[10px] text-muted-foreground capitalize">{phase}</span>
            </div>
            <ul className="space-y-1.5">
              <FlowRow icon={<Sunrise className="h-4 w-4" />} label="Morning" desc="Calibrate workload · 3 priorities" active={phase === "morning"} done={phase !== "morning"} />
              <FlowRow icon={<Sun className="h-4 w-4" />} label="Midday" desc="Distraction check · focus pulse" active={phase === "midday"} done={phase === "evening"} />
              <FlowRow icon={<Moon className="h-4 w-4" />} label="Evening" desc="Reflection · execution review" active={phase === "evening"} to="/check-in" />
            </ul>
          </Card>
        </StaggerItem>

        <StaggerItem className="lg:col-span-7">
          <Card>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <StatLabel>Execution trend · 14 days</StatLabel>
                <p className="font-display mt-1 text-2xl text-foreground">
                  <AnimatedNumber value={consistency} />
                  <span className="text-muted-foreground text-lg">%</span>
                </p>
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
        </StaggerItem>

        <StaggerItem className="lg:col-span-5">
          <Card className="h-full">
            <StatLabel>Resilience</StatLabel>
            <p className="font-display mt-1 text-2xl text-foreground">
              <AnimatedNumber value={resilience} />
              <span className="text-muted-foreground text-base"> / 100</span>
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">Average bounce-back · {avgRecoveryDays} days</p>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {history.slice(-7).map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0.4, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.45, delay: 0.2 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  className="aspect-[1/2] rounded-full origin-bottom"
                  style={{
                    background:
                      d.executionScore >= 70
                        ? "var(--accent)"
                        : d.executionScore >= 50
                        ? "color-mix(in oklab, var(--accent) 50%, transparent)"
                        : "color-mix(in oklab, var(--danger) 60%, transparent)",
                  }}
                />
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              All-or-nothing thinking destroys momentum. The system rewards how fast you return.
            </p>
          </Card>
        </StaggerItem>
      </Stagger>

      {latestInsight && (
        <div className="px-5 lg:px-0">
          <BehavioralNote title={latestInsight.title} body={latestInsight.body} />
        </div>
      )}

      <TasksSection tasks={tasks} toggleTask={toggleTask} completed={completed} />

      <AnimatePresence>
        {recoveryMode && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-5 lg:px-0"
          >
            <Link to="/recovery" className="group block">
              <Card className="bg-gradient-surface">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <StatLabel>Recovery protocol active</StatLabel>
                    <p className="font-display mt-1 text-lg text-foreground">Open today's minimum viable plan</p>
                    <p className="mt-1.5 max-w-[44ch] text-xs text-muted-foreground">
                      We've reduced load to rebuild momentum. Three things, then rest.
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </Card>
            </Link>
          </motion.section>
        )}
      </AnimatePresence>

      <Stagger className="px-5 lg:px-0 grid grid-cols-2 gap-2.5 lg:grid-cols-4" gap={0.05}>
        {[
          { to: "/dashboard", label: "Command center", desc: "Deep analytics", icon: Sparkles },
          { to: "/weekly", label: "Weekly report", desc: "Patterns this week", icon: Sparkles },
          { to: "/circles", label: "Trusted circles", desc: "Proof-based", icon: Sparkles },
          { to: "/premium", label: "Cadence Pro", desc: "Adaptive coaching", icon: Crown },
        ].map((q) => {
          const Icon = q.icon;
          return (
            <StaggerItem key={q.to}>
              <Link to={q.to}>
                <TapCard>
                  <Card>
                    <Icon className="h-4 w-4 text-accent" />
                    <p className="mt-2 text-sm font-medium text-foreground">{q.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{q.desc}</p>
                  </Card>
                </TapCard>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>

      <section className="px-5 lg:px-0">
        <Link to="/check-in">
          <motion.button
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.985 }}
            className="relative w-full overflow-hidden rounded-2xl bg-foreground py-4 text-sm font-semibold text-background lg:max-w-md"
          >
            <span className="relative z-10">Start evening check-in</span>
            <span className="absolute inset-0 animate-shimmer" />
          </motion.button>
        </Link>
      </section>
    </div>
  );
}

function FlowRow({
  icon,
  label,
  desc,
  active,
  done,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  active?: boolean;
  done?: boolean;
  to?: string;
}) {
  const inner = (
    <div
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
        active ? "bg-secondary text-foreground" : done ? "text-muted-foreground/60" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${active ? "bg-accent/15 text-accent" : done ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
        {done && !active ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] opacity-80">{desc}</p>
      </div>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />}
    </div>
  );
  return <li>{to ? <Link to={to}>{inner}</Link> : inner}</li>;
}

function TasksSection({ tasks, toggleTask, completed }: { tasks: ReturnType<typeof useApp.getState>["tasks"]; toggleTask: (id: string) => void; completed: number }) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const addTask = useApp((s) => s.addTask);
  const resetDemo = useApp((s) => s.resetDemo);

  return (
    <section className="px-5 lg:px-0">
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
