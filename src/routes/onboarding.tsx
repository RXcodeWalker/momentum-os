import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — Cadence" },
      { name: "description", content: "Tell us what you're building toward and where you tend to break." },
    ],
  }),
  component: Onboarding,
});

const goals = [
  { id: "fitness", label: "Fitness", desc: "Train consistently" },
  { id: "studying", label: "Studying", desc: "Learn deeply, retain more" },
  { id: "coding", label: "Coding", desc: "Ship real projects" },
  { id: "creativity", label: "Creativity", desc: "Make things often" },
  { id: "social", label: "Social confidence", desc: "Show up, speak up" },
  { id: "sleep", label: "Sleep", desc: "Recover properly" },
  { id: "discipline", label: "Discipline", desc: "Do hard things daily" },
];

const struggles = [
  { id: "inconsistency", label: "Inconsistency", desc: "I start strong, then fade" },
  { id: "procrastination", label: "Procrastination", desc: "I delay what matters most" },
  { id: "burnout", label: "Burnout", desc: "I push until I crash" },
  { id: "overplanning", label: "Overplanning", desc: "I plan more than I execute" },
  { id: "distraction", label: "Distraction", desc: "My attention scatters" },
  { id: "perfectionism", label: "Perfectionism", desc: "I won't ship until it's perfect" },
];

function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [pickedGoals, setG] = useState<string[]>([]);
  const [pickedStruggles, setS] = useState<string[]>([]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, id: string) =>
    setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const steps = [
    {
      eyebrow: "Step 1 of 3",
      title: "What are you building toward?",
      sub: "Pick what matters in this season. You can change this anytime.",
      content: (
        <ChipGrid items={goals} selected={pickedGoals} onToggle={(id) => toggle(pickedGoals, setG, id)} />
      ),
      canNext: pickedGoals.length >= 1,
    },
    {
      eyebrow: "Step 2 of 3",
      title: "Where do you tend to break?",
      sub: "Be honest — this is how we'll catch you before the crash.",
      content: (
        <ChipGrid items={struggles} selected={pickedStruggles} onToggle={(id) => toggle(pickedStruggles, setS, id)} />
      ),
      canNext: pickedStruggles.length >= 1,
    },
    {
      eyebrow: "Step 3 of 3",
      title: "We'll watch for the patterns.",
      sub: "Cadence learns when you're at risk and reduces load before you collapse. No streaks. No shame.",
      content: (
        <div className="space-y-3">
          {[
            "We'll detect early-warning behaviors specific to you.",
            "When you slip, you'll get a recovery protocol — not a guilt trip.",
            "Weekly insights get sharper the more you log.",
          ].map((t, i) => (
            <div key={i} className="hairline flex items-start gap-3 rounded-2xl bg-card p-4">
              <div className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent/15 text-accent">
                <Check className="h-3 w-3" strokeWidth={3} />
              </div>
              <p className="text-sm text-foreground">{t}</p>
            </div>
          ))}
        </div>
      ),
      canNext: true,
    },
  ];

  const cur = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-5 pt-8">
        <div className="mb-6 flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-accent" : "bg-secondary"}`} />
          ))}
        </div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{cur.eyebrow}</p>
        <h1 className="font-display text-[32px] leading-tight text-foreground">{cur.title}</h1>
        <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-muted-foreground">{cur.sub}</p>
      </div>

      <div key={step} className="flex-1 px-5 pt-6 animate-fade-up">{cur.content}</div>

      <div className="sticky bottom-0 mt-auto border-t border-border bg-background/80 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="hairline rounded-full px-5 py-3 text-sm text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
          )}
          <button
            disabled={!cur.canNext}
            onClick={() => (isLast ? nav({ to: "/" }) : setStep(step + 1))}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-background transition disabled:opacity-30"
          >
            {isLast ? "Enter Cadence" : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ChipGrid({ items, selected, onToggle }: { items: { id: string; label: string; desc: string }[]; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map((it) => {
        const on = selected.includes(it.id);
        return (
          <button
            key={it.id}
            onClick={() => onToggle(it.id)}
            className={`relative rounded-2xl border p-3.5 text-left transition-all ${
              on
                ? "border-accent/60 bg-accent/10 shadow-glow"
                : "border-border bg-card hover:border-foreground/20"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm font-medium ${on ? "text-foreground" : "text-foreground"}`}>{it.label}</p>
              {on && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Check className="h-2.5 w-2.5" strokeWidth={4} />
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{it.desc}</p>
          </button>
        );
      })}
    </div>
  );
}
