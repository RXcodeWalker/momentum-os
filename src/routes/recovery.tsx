import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, Pill, ScreenHeader, StatLabel } from "@/components/ui-bits";
import { ArrowRight, Brain, Heart, Leaf, Moon, ShieldCheck, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { useState } from "react";

export const Route = createFileRoute("/recovery")({
  head: () => ({
    meta: [
      { title: "Recovery — Cadence" },
      { name: "description", content: "When consistency breaks, we reduce the load. No streaks. No shame." },
    ],
  }),
  component: Recovery,
});

const protocols = {
  burnout: {
    label: "Burnout",
    sub: "You've pushed past your sustainable load. We're easing back.",
    plan: [
      { t: "20 min low-stakes review", est: "20m" },
      { t: "Walk · 30 min, no headphones", est: "30m" },
      { t: "In bed by 22:00, screens away", est: "—" },
    ],
  },
  procrastination: {
    label: "Procrastination",
    sub: "You're avoiding the hard thing. The protocol is one rep, then stop.",
    plan: [
      { t: "Open the file. Five minutes only.", est: "5m" },
      { t: "Do one tiny version of the hard task", est: "15m" },
      { t: "Log it. Don't escalate.", est: "—" },
    ],
  },
  perfectionism: {
    label: "Perfectionism",
    sub: "You're polishing past return. Ship something rough, learn from it.",
    plan: [
      { t: "Define 'good enough' in one sentence", est: "5m" },
      { t: "Ship the ugly version", est: "30m" },
      { t: "Note one thing you'd improve", est: "5m" },
    ],
  },
  "low-energy": {
    label: "Low-energy day",
    sub: "Don't fake intensity. Move the body, do the minimum.",
    plan: [
      { t: "10 min walk in daylight", est: "10m" },
      { t: "One easy admin task", est: "15m" },
      { t: "Sleep before 22:30", est: "—" },
    ],
  },
  distraction: {
    label: "Distraction overload",
    sub: "Your attention is fragmented. Cut inputs before adding output.",
    plan: [
      { t: "Phone in another room · 60 min", est: "60m" },
      { t: "Single task, single tab", est: "45m" },
      { t: "No notifications until evening check-in", est: "—" },
    ],
  },
  "sleep-debt": {
    label: "Sleep debt",
    sub: "Cognitive function drops sharply below 6h. We're protecting tomorrow.",
    plan: [
      { t: "20 min review · easiest subject", est: "20m" },
      { t: "Walk · 30 min, no headphones", est: "30m" },
      { t: "In bed by 22:00, screens away", est: "—" },
    ],
  },
} as const;

type ProtocolKey = keyof typeof protocols;

function Recovery() {
  const recoveryMode = useApp((s) => s.recoveryMode);
  const recoveryReason = useApp((s) => s.recoveryReason) as ProtocolKey | undefined;
  const enterRecovery = useApp((s) => s.enterRecovery);
  const exitRecovery = useApp((s) => s.exitRecovery);
  const acceptMVD = useApp((s) => s.acceptMinimumViableDay);
  const nav = useNavigate();

  const [picked, setPicked] = useState<ProtocolKey>(recoveryReason ?? "burnout");
  const proto = protocols[picked];

  return (
    <div className="flex flex-col gap-5 pb-6">
      <ScreenHeader
        eyebrow={recoveryMode ? "Recovery protocol · active" : "Recovery library"}
        title={recoveryMode ? "Let's bring the load down." : "Choose a protocol."}
        subtitle={recoveryMode
          ? "This isn't a streak loss — it's a signal. We've reduced your surface area."
          : "Pick the pattern you're in. We'll generate a minimum viable day."}
        right={recoveryMode ? <Pill tone="warning">Active</Pill> : undefined}
      />

      <section className="px-5">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {(Object.keys(protocols) as ProtocolKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setPicked(k)}
              className={`flex-none rounded-full px-3.5 py-2 text-[11px] font-medium transition ${
                picked === k ? "bg-foreground text-background" : "hairline bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {protocols[k].label}
            </button>
          ))}
        </div>
      </section>

      <section className="px-5">
        <Card className="relative overflow-hidden bg-gradient-surface">
          <div className="bg-glow absolute inset-0" />
          <div className="relative">
            <Pill tone="accent"><Leaf className="h-3 w-3" /> {proto.label} · minimum viable day</Pill>
            <p className="font-display mt-3 text-2xl leading-snug text-foreground">
              Three things. Nothing else. <span className="text-muted-foreground">{proto.sub}</span>
            </p>
            <div className="mt-4 space-y-2">
              {proto.plan.map((x, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-background/40 px-3.5 py-3 hairline">
                  <span className="text-sm text-foreground">{x.t}</span>
                  <span className="text-[11px] text-muted-foreground num-tabular">{x.est}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                if (!recoveryMode) enterRecovery(picked);
                acceptMVD();
                nav({ to: "/" });
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 text-sm font-semibold text-background"
            >
              Accept this day <ArrowRight className="h-4 w-4" />
            </button>
            {recoveryMode && (
              <button onClick={exitRecovery} className="mt-2 w-full rounded-2xl py-2 text-xs text-muted-foreground hover:text-foreground">
                Exit recovery mode
              </button>
            )}
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

      <section className="px-5">
        <Card className="bg-gradient-surface">
          <div className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-accent mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recovery is a skill. Every protocol you complete teaches Cadence how you bounce back — and shortens the next dip.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
