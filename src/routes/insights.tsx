import { createFileRoute, Link } from "@tanstack/react-router";
import { BarRow, Card, Pill, ScreenHeader, Sparkline, StatLabel } from "@/components/ui-bits";
import { ExecutionHeatmap } from "@/components/heatmap";
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  Lightbulb,
  Lock,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useApp, useActiveInsights, useFakeProductivityFlags } from "@/lib/store";
import { useMemo } from "react";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Cadence" },
      { name: "description", content: "Behavioral patterns, earned insights, and anti-fake-productivity analysis." },
    ],
  }),
  component: Insights,
});

function Insights() {
  const history = useApp((s) => s.history);
  const allInsights = useApp((s) => s.insights);
  const dismissInsight = useApp((s) => s.dismissInsight);
  const flags = useFakeProductivityFlags();
  const activeInsights = useActiveInsights();
  const lockedInsights = allInsights.filter((i) => !i.unlocked);
  const last14 = history.slice(-14);

  const focusByHour = useMemo(() => {
    const avgFocus = last14.reduce((a, d) => a + d.focus, 0) / Math.max(1, last14.length);
    const base = [40, 55, 72, 85, 78, 62, 50, 58, 65, 68, 55, 38, 28];
    return base.map((v) => Math.round(v * (avgFocus / 7)));
  }, [last14]);

  const recoverySpeed = useMemo(() => {
    let dips = 0, days = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i - 1].executionScore < 50) {
        for (let j = i; j < history.length; j++) {
          days++;
          if (history[j].executionScore >= 65) { dips++; break; }
        }
      }
    }
    return dips ? (days / dips).toFixed(1) : "—";
  }, [history]);

  const planExecuteColor = flags.planExecuteRatio < 60 ? "danger" : flags.planExecuteRatio < 75 ? "warning" : "accent";

  // Insight type metadata
  const insightMeta: Record<string, { icon: typeof Sparkles; toneClass: string; label: string }> = {
    pattern: { icon: TrendingUp, toneClass: "bg-accent/15 text-accent", label: "Pattern" },
    breakthrough: { icon: Sparkles, toneClass: "bg-success/15 text-success", label: "Breakthrough" },
    warning: { icon: AlertTriangle, toneClass: "bg-warning/15 text-warning", label: "Warning" },
    identity: { icon: Lightbulb, toneClass: "bg-accent/15 text-accent", label: "Identity" },
  };

  return (
    <div className="flex flex-col gap-5 pb-6">
      <ScreenHeader
        eyebrow={`Week ${getWeekNum()} · ${formatRange()}`}
        title="What your behavior is telling us."
        subtitle="Patterns, not performance. The goal is self-knowledge."
        right={
          <Link to="/weekly" className="hairline rounded-full px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground">
            Weekly &rarr;
          </Link>
        }
      />

      {/* Key metrics row */}
      <section className="px-5">
        <div className="grid grid-cols-2 gap-2.5">
          <Card>
            <StatLabel>Plan vs execute</StatLabel>
            <p className="font-display mt-1 text-3xl num-tabular text-foreground">
              {flags.planExecuteRatio}<span className="text-base text-muted-foreground">%</span>
            </p>
            <div className={`mt-1 flex items-center gap-1 text-[11px] ${flags.planExecuteRatio < 60 ? "text-danger" : "text-success"}`}>
              {flags.planExecuteRatio < 60 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {flags.planExecuteRatio < 60 ? "overplanning trend" : "executing well"}
            </div>
          </Card>
          <Card>
            <StatLabel>Recovery speed</StatLabel>
            <p className="font-display mt-1 text-3xl num-tabular text-foreground">
              {recoverySpeed}<span className="text-base text-muted-foreground">d</span>
            </p>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-success">
              <TrendingUp className="h-3 w-3" /> faster than last cycle
            </div>
          </Card>
        </div>
      </section>

      {/* Heatmap */}
      <section className="px-5">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <StatLabel>Execution heatmap · 4 weeks</StatLabel>
            <span className="text-[10px] text-muted-foreground">Today &rarr;</span>
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

      {/* Earned behavioral insights */}
      {activeInsights.length > 0 && (
        <section className="px-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Earned insights</h2>
            <Pill tone="accent"><Lightbulb className="h-3 w-3" /> {activeInsights.length} unlocked</Pill>
          </div>
          {activeInsights.map((insight) => {
            const meta = insightMeta[insight.type];
            const Icon = meta.icon;
            return (
              <Card key={insight.id} className="relative">
                <button
                  onClick={() => dismissInsight(insight.id)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Dismiss insight"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-start gap-3 pr-6">
                  <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${meta.toneClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{meta.label}</span>
                      {insight.unlockedAt && (
                        <span className="text-[10px] text-muted-foreground/60">
                          {new Date(insight.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <p className="font-display text-base leading-snug text-foreground">"{insight.title}"</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{insight.body}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>
      )}

      {/* Locked insights — creates anticipation */}
      {lockedInsights.length > 0 && (
        <section className="px-5">
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Insights in progress</h2>
            <span className="text-[11px] text-muted-foreground">{lockedInsights.length} emerging</span>
          </div>
          <div className="space-y-2">
            {lockedInsights.map((insight) => (
              <div key={insight.id} className="flex items-center gap-3 hairline rounded-2xl bg-secondary/30 px-4 py-3 opacity-60">
                <Lock className="h-3.5 w-3.5 text-muted-foreground flex-none" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Pattern accumulating...</p>
                  <p className="text-[11px] text-muted-foreground/70">Keep checking in to unlock this insight.</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Focus by hour */}
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
          <p className="mt-3 text-[11px] text-muted-foreground">Peak window: 9–11 AM. Guard it like a commitment you cannot break.</p>
        </Card>
      </section>

      {/* Anti-fake-productivity */}
      <section className="px-5 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Anti-fake-productivity</h2>
          <Pill tone={flags.flags.length > 0 ? "warning" : "success"}>
            <Eye className="h-3 w-3" /> {flags.flags.length} {flags.flags.length === 1 ? "flag" : "flags"}
          </Pill>
        </div>
        <Card>
          <div className="space-y-4">
            <BarRow label="Plans created vs executed" value={flags.planExecuteRatio} tone={planExecuteColor as "neutral" | "accent" | "danger"} />
            <BarRow label="Deep work : shallow work" value={32} tone="danger" />
            <BarRow label="Sleep regularity" value={61} />
            <BarRow label="Phone pickups during deep work" value={84} tone="danger" />
          </div>
        </Card>
        {flags.flags.length === 0 ? (
          <Card className="bg-gradient-surface">
            <p className="text-sm text-foreground">No fake-productivity signals this cycle. Your execution is genuine.</p>
          </Card>
        ) : (
          flags.flags.map((f, i) => (
            <Card key={i} className="bg-gradient-surface">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-warning flex-none mt-0.5" />
                <p className="font-display text-base leading-snug text-foreground">{f}</p>
              </div>
            </Card>
          ))
        )}
      </section>

      {/* 28-day consistency */}
      <section className="px-5">
        <Card>
          <StatLabel>Consistency · 4 weeks</StatLabel>
          <div className="mt-3">
            <Sparkline data={history.slice(-28).map((d) => d.executionScore)} accent />
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
            <span>4 weeks ago</span><span>2 weeks ago</span><span>Today</span>
          </div>
        </Card>
      </section>

      {/* Weekly report CTA */}
      <section className="px-5">
        <Link to="/weekly" className="group block">
          <Card className="bg-gradient-surface">
            <div className="flex items-center justify-between">
              <div>
                <StatLabel>Weekly behavioral report</StatLabel>
                <p className="font-display mt-1 text-lg text-foreground">Open this week&apos;s analysis</p>
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
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const f = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${f(monday)}–${f(sunday).split(" ")[1]}`;
}
