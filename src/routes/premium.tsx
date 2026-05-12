import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Pill, ScreenHeader, StatLabel } from "@/components/ui-bits";
import { ArrowLeft, Brain, Check, Crown, LineChart, Sparkles, Target, Zap } from "lucide-react";
import { useApp } from "@/lib/store";
import { useState } from "react";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Cadence Pro — Behavioral OS" },
      { name: "description", content: "Adaptive coaching, deep behavioral analytics, and predictive recovery." },
    ],
  }),
  component: Premium,
});

const features = [
  { icon: Brain, title: "Adaptive coaching", body: "Daily protocols tuned to your patterns — not generic templates." },
  { icon: LineChart, title: "Deep behavioral analytics", body: "12-week trend analysis across focus, recovery, sleep, and discipline." },
  { icon: Sparkles, title: "Predictive recovery alerts", body: "We catch the crash 36 hours before it lands." },
  { icon: Target, title: "Personalized execution plans", body: "Weekly plans calibrated to your real capacity, not your ambition." },
  { icon: Zap, title: "Focus pattern analysis", body: "Hour-by-hour focus mapping. Find your peak window and protect it." },
];

const plans = [
  { id: "monthly", price: "$9", per: "/mo", note: "Cancel anytime" },
  { id: "annual", price: "$72", per: "/yr", note: "Save 33% · 2 months free", best: true },
] as const;

function Premium() {
  const premium = useApp((s) => s.premium);
  const setPremium = useApp((s) => s.setPremium);
  const [plan, setPlan] = useState<"monthly" | "annual">("annual");

  return (
    <div className="flex flex-col gap-5 pb-6">
      <ScreenHeader
        eyebrow={premium ? "Pro · active" : "Cadence Pro"}
        title={premium ? "You're on Pro." : "Built for people who actually execute."}
        subtitle={premium
          ? "All advanced analytics, coaching, and predictive recovery are unlocked."
          : "Adaptive coaching, deep behavioral analytics, and predictive recovery."}
        right={
          <Link to="/" className="hairline flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      <section className="px-5">
        <Card className="relative overflow-hidden bg-gradient-surface">
          <div className="bg-glow absolute inset-0" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-2xl text-foreground leading-tight">Cadence Pro</p>
              <p className="text-xs text-muted-foreground">A behavioral coach that learns you.</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="px-5 space-y-2">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <Card key={i}>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{f.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      {!premium && (
        <>
          <section className="px-5 space-y-2">
            <StatLabel>Choose plan</StatLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`relative rounded-2xl border p-4 text-left transition ${
                    plan === p.id ? "border-accent bg-accent/10 shadow-glow" : "border-border bg-card hover:border-foreground/20"
                  }`}
                >
                  {p.best && (
                    <span className="absolute -top-2 right-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                      Best value
                    </span>
                  )}
                  <p className="font-display text-2xl num-tabular text-foreground">{p.price}<span className="text-sm text-muted-foreground">{p.per}</span></p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{p.note}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="px-5">
            <button onClick={() => setPremium(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background">
              <Crown className="h-4 w-4" /> Start 7-day free trial
            </button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">No card required for trial. Cancel anytime.</p>
          </section>
        </>
      )}

      {premium && (
        <section className="px-5">
          <Card className="bg-gradient-surface">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-foreground">Pro active</p>
                <p className="text-[11px] text-muted-foreground">Renews · {plan === "annual" ? "$72/yr" : "$9/mo"}</p>
              </div>
              <button onClick={() => setPremium(false)} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground">
                Manage
              </button>
            </div>
          </Card>
        </section>
      )}

      <section className="px-5">
        <Pill tone="neutral">Used by 12,400 ambitious people</Pill>
      </section>
    </div>
  );
}
