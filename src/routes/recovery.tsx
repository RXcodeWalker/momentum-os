import { createFileRoute } from "@tanstack/react-router";
import { Card, Pill, ScreenHeader, StatLabel } from "@/components/ui-bits";
import { ArrowRight, Brain, Heart, Leaf, Moon, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/recovery")({
  head: () => ({
    meta: [
      { title: "Recovery — Cadence" },
      { name: "description", content: "When consistency breaks, we reduce the load. No streaks. No shame." },
    ],
  }),
  component: Recovery,
});

function Recovery() {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <ScreenHeader
        eyebrow="Recovery protocol · day 1"
        title="Let's bring the load down."
        subtitle="You missed 2 of 4 priorities yesterday and slept 5h12. This isn't a streak loss — it's a signal."
      />

      <section className="px-5">
        <Card className="relative overflow-hidden bg-gradient-surface">
          <div className="bg-glow absolute inset-0" />
          <div className="relative">
            <Pill tone="accent"><Leaf className="h-3 w-3" /> Minimum viable day</Pill>
            <p className="font-display mt-3 text-2xl leading-snug text-foreground">
              Three things. Nothing else. <span className="text-muted-foreground">Rebuilds momentum without overload.</span>
            </p>
            <div className="mt-4 space-y-2">
              {[
                { t: "20 min review · linear algebra", est: "20m" },
                { t: "Walk · 30 min, no headphones", est: "30m" },
                { t: "In bed by 22:30, screens away", est: "—" },
              ].map((x, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-background/40 px-3.5 py-3 hairline">
                  <span className="text-sm text-foreground">{x.t}</span>
                  <span className="text-[11px] text-muted-foreground num-tabular">{x.est}</span>
                </div>
              ))}
            </div>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 text-sm font-semibold text-background">
              Accept this day <ArrowRight className="h-4 w-4" />
            </button>
            <button className="mt-2 w-full rounded-2xl py-2 text-xs text-muted-foreground hover:text-foreground">
              Customize instead
            </button>
          </div>
        </Card>
      </section>

      <section className="px-5">
        <h2 className="mb-3 px-1 text-sm font-semibold tracking-tight text-foreground">What likely went wrong</h2>
        <div className="space-y-2">
          {[
            { icon: Moon, title: "Sleep debt accumulating", body: "Avg 5h47 last 4 nights. Decision quality drops sharply below 6h.", tone: "warning" as const },
            { icon: Brain, title: "Cognitive load too high", body: "Your task list yesterday required ~7h of deep work. You have ~3.5h available on weekdays.", tone: "danger" as const },
            { icon: Heart, title: "Recovery skipped", body: "No exercise or downtime in 5 days. Your best execution days follow movement.", tone: "neutral" as const },
          ].map((x, i) => {
            const Icon = x.icon;
            return (
              <div key={i} className="hairline flex items-start gap-3 rounded-2xl bg-card p-4">
                <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${
                  x.tone === "danger" ? "bg-danger/15 text-danger" : x.tone === "warning" ? "bg-warning/15 text-warning" : "bg-secondary text-muted-foreground"
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{x.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{x.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-5">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-success/15 text-success">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <StatLabel>Protected for 48h</StatLabel>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                We've muted ambitious goals and weekly targets while you rebuild. You can override at any time — we just don't recommend it.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
