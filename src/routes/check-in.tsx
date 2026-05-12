import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Pill, ScreenHeader, StatLabel } from "@/components/ui-bits";
import { Bell, Brain, Coffee, Phone, Sparkles, Tv, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/check-in")({
  head: () => ({
    meta: [
      { title: "Check-in — Cadence" },
      { name: "description", content: "Reflect efficiently. We use this to keep you honest." },
    ],
  }),
  component: CheckIn,
});

const moods = ["Drained", "Flat", "Steady", "Sharp", "Locked in"];
const distractions = [
  { id: "phone", label: "Phone", icon: Phone },
  { id: "social", label: "Social media", icon: Users },
  { id: "video", label: "Video", icon: Tv },
  { id: "noise", label: "Notifications", icon: Bell },
  { id: "snacks", label: "Snacking", icon: Coffee },
  { id: "thoughts", label: "Wandering mind", icon: Brain },
];

function CheckIn() {
  const [focus, setFocus] = useState(7);
  const [mood, setMood] = useState(2);
  const [energy, setEnergy] = useState(60);
  const [picked, setPicked] = useState<string[]>(["phone"]);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="flex flex-col gap-5 pb-6">
      <ScreenHeader
        eyebrow="Evening · 21:14"
        title="Tonight's check-in"
        subtitle="Two minutes of honesty beats an hour of planning."
      />

      <section className="px-5 space-y-4">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <StatLabel>Tasks completed</StatLabel>
            <span className="text-xs text-muted-foreground">3 of 4</span>
          </div>
          <div className="space-y-2">
            {[
              { t: "Linear algebra problem set", done: true },
              { t: "Ship signup screen", done: true },
              { t: "Run · Zone 2", done: true },
              { t: "Wind down · screens off by 22:30", done: false },
            ].map((x, i) => (
              <label key={i} className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" defaultChecked={x.done} className="peer sr-only" />
                <span className="flex h-5 w-5 items-center justify-center rounded-md border border-border bg-secondary peer-checked:border-accent peer-checked:bg-accent transition">
                  <svg className="h-3 w-3 opacity-0 peer-checked:opacity-100" viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" stroke="oklch(0.14 0.005 270)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <span className={`text-sm ${x.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{x.t}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <StatLabel>Focus quality</StatLabel>
            <span className="font-display text-2xl text-foreground num-tabular">{focus}<span className="text-sm text-muted-foreground">/10</span></span>
          </div>
          <input
            type="range" min={1} max={10} value={focus}
            onChange={(e) => setFocus(+e.target.value)}
            className="w-full accent-[oklch(0.85_0.16_80)]"
          />
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>Scattered</span><span>Locked</span>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <StatLabel>Mood</StatLabel>
            <Pill tone="accent">{moods[mood]}</Pill>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {moods.map((m, i) => (
              <button
                key={m}
                onClick={() => setMood(i)}
                className={`rounded-xl py-2.5 text-[11px] font-medium transition ${
                  mood === i ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <StatLabel>Energy left</StatLabel>
            <span className="font-display text-2xl num-tabular text-foreground">{energy}<span className="text-sm text-muted-foreground">%</span></span>
          </div>
          <input
            type="range" min={0} max={100} value={energy}
            onChange={(e) => setEnergy(+e.target.value)}
            className="w-full accent-[oklch(0.85_0.16_80)]"
          />
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <StatLabel>Distractions</StatLabel>
            <span className="text-xs text-muted-foreground">{picked.length} flagged</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {distractions.map((d) => {
              const Icon = d.icon;
              const on = picked.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => toggle(d.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 text-[11px] font-medium transition ${
                    on ? "bg-accent/15 text-accent ring-1 ring-accent/40" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {d.label}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="bg-gradient-surface">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <StatLabel>Reflective prompt</StatLabel>
              <p className="font-display mt-1 text-base leading-snug text-foreground">
                You skipped wind-down. What was the actual reason — not the story you'll tell yourself tomorrow?
              </p>
              <textarea
                rows={3}
                placeholder="Type freely. Nothing is shared."
                className="mt-3 w-full resize-none rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background">
          <Zap className="h-4 w-4" />
          Save check-in
        </button>
      </section>
    </div>
  );
}
