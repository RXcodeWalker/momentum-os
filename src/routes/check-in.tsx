import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Pill, Ring, ScreenHeader, StatLabel } from "@/components/ui-bits";
import { ArrowRight, Bell, Brain, Check, Coffee, Phone, Sparkles, Tv, Users, Zap } from "lucide-react";
import { useApp } from "@/lib/store";

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
  const nav = useNavigate();
  const tasks = useApp((s) => s.tasks);
  const saveCheckIn = useApp((s) => s.saveCheckIn);
  const recoveryMode = useApp((s) => s.recoveryMode);

  const [focus, setFocus] = useState(7);
  const [mood, setMood] = useState(2);
  const [energy, setEnergy] = useState(60);
  const [sleep, setSleep] = useState(6.5);
  const [honesty, setHonesty] = useState(8);
  const [picked, setPicked] = useState<string[]>(["phone"]);
  const [reflection, setReflection] = useState("");
  const [result, setResult] = useState<{ newScore: number; delta: number } | null>(null);

  const completed = tasks.filter((t) => t.done).length;
  const planned = tasks.length;

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const save = () => {
    const r = saveCheckIn({
      focus, mood, energy, sleepHours: sleep, honesty,
      distractions: picked, reflection, completed, planned,
    });
    setResult(r);
  };

  if (result) {
    const triggeredRecovery = result.newScore < 45;
    return (
      <div className="flex flex-col gap-5 pb-6">
        <ScreenHeader
          eyebrow="Check-in saved"
          title={triggeredRecovery ? "We're easing the load." : result.delta >= 0 ? "Score is climbing." : "Mixed signal — it's fine."}
          subtitle={triggeredRecovery
            ? "Recovery mode is on. Tomorrow's plan is reduced automatically."
            : "We logged the honest signal. Tomorrow adjusts to it."}
        />
        <section className="px-5">
          <Card className="bg-gradient-surface">
            <div className="flex items-center gap-5">
              <Ring value={result.newScore} label="Execution" sub="Today" />
              <div>
                <StatLabel>Change vs yesterday</StatLabel>
                <p className={`font-display mt-1 text-3xl num-tabular ${result.delta >= 0 ? "text-success" : "text-danger"}`}>
                  {result.delta >= 0 ? "+" : ""}{result.delta}
                </p>
                <p className="mt-1 text-xs text-muted-foreground max-w-[20ch]">
                  Driven by sleep, focus, and {Math.round((completed / Math.max(1, planned)) * 100)}% completion.
                </p>
              </div>
            </div>
          </Card>
        </section>
        <section className="px-5 space-y-2">
          {triggeredRecovery && (
            <button onClick={() => nav({ to: "/recovery" })} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background">
              Open recovery protocol <ArrowRight className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => nav({ to: "/insights" })} className="hairline flex w-full items-center justify-center gap-2 rounded-2xl bg-card py-4 text-sm text-foreground">
            See what changed <Sparkles className="h-4 w-4" />
          </button>
          <button onClick={() => nav({ to: "/" })} className="w-full rounded-2xl py-3 text-xs text-muted-foreground hover:text-foreground">
            Back to home
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <ScreenHeader
        eyebrow={`Evening · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        title="Tonight's check-in"
        subtitle="Two minutes of honesty beats an hour of planning."
        right={recoveryMode ? <Pill tone="warning">Recovery</Pill> : undefined}
      />

      <section className="px-5 space-y-4">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <StatLabel>Tasks completed today</StatLabel>
            <span className="text-xs text-muted-foreground num-tabular">{completed} of {planned}</span>
          </div>
          <div className="space-y-1.5">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <span className={`flex h-4 w-4 items-center justify-center rounded border ${t.done ? "border-success bg-success/20 text-success" : "border-border"}`}>
                  {t.done && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                </span>
                <span className={t.done ? "text-muted-foreground line-through" : "text-foreground"}>{t.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Adjust on the home screen if anything is wrong.</p>
        </Card>

        <SliderCard label="Focus quality" value={focus} unit="/10" min={1} max={10} onChange={setFocus} left="Scattered" right="Locked" />

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <StatLabel>Mood</StatLabel>
            <Pill tone="accent">{moods[mood]}</Pill>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {moods.map((m, i) => (
              <button key={m} onClick={() => setMood(i)} className={`rounded-xl py-2.5 text-[11px] font-medium transition ${mood === i ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {m}
              </button>
            ))}
          </div>
        </Card>

        <SliderCard label="Energy left" value={energy} unit="%" min={0} max={100} onChange={setEnergy} />
        <SliderCard label="Sleep last night" value={sleep} unit="h" min={3} max={10} step={0.5} onChange={setSleep} />

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
                <button key={d.id} onClick={() => toggle(d.id)} className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 text-[11px] font-medium transition ${on ? "bg-accent/15 text-accent ring-1 ring-accent/40" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  <Icon className="h-4 w-4" />
                  {d.label}
                </button>
              );
            })}
          </div>
        </Card>

        <SliderCard label="How honest was today's effort?" value={honesty} unit="/10" min={1} max={10} onChange={setHonesty} left="Performative" right="True" />

        <Card className="bg-gradient-surface">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <StatLabel>Reflective prompt</StatLabel>
              <p className="font-display mt-1 text-base leading-snug text-foreground">
                {completed < planned
                  ? `You skipped ${planned - completed}. What was the actual reason — not the story you'll tell tomorrow?`
                  : "You finished today. What did it cost you, and is that sustainable?"}
              </p>
              <textarea
                value={reflection} onChange={(e) => setReflection(e.target.value)}
                rows={3} placeholder="Type freely. Nothing is shared."
                className="mt-3 w-full resize-none rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        <button onClick={save} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background">
          <Zap className="h-4 w-4" /> Save check-in
        </button>
      </section>
    </div>
  );
}

function SliderCard({ label, value, unit, min, max, step = 1, onChange, left, right }: { label: string; value: number; unit: string; min: number; max: number; step?: number; onChange: (v: number) => void; left?: string; right?: string }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <StatLabel>{label}</StatLabel>
        <span className="font-display text-2xl text-foreground num-tabular">{value}<span className="text-sm text-muted-foreground">{unit}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[oklch(0.85_0.16_80)]" />
      {(left || right) && (
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{left}</span><span>{right}</span>
        </div>
      )}
    </Card>
  );
}
