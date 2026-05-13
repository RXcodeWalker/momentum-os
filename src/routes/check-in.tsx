import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, Pill, Ring, ScreenHeader, StatLabel } from "@/components/ui-bits";
import {
  ArrowRight,
  Bell,
  Brain,
  Check,
  Coffee,
  Phone,
  Sparkles,
  Tv,
  Users,
  Zap,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { useApp, useLatestInsight, useUserState } from "@/lib/store";

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

// Adaptive reflective prompts — vary by state, completion ratio, and mood
function getReflectivePrompt(
  state: string,
  completionRatio: number,
  mood: number,
  missed: number
): string {
  if (state === "burnout") {
    return "What's the one thing you're avoiding telling yourself about your current load?";
  }
  if (state === "recovery") {
    return "Did you protect your energy today, or did you try to prove yourself anyway?";
  }
  if (completionRatio >= 1.0 && mood >= 3) {
    return "You executed well. What made today different — environment, sleep, or decisions?";
  }
  if (completionRatio >= 1.0 && mood < 2) {
    return "You completed everything but felt drained. That's a load problem, not a discipline problem. What needs trimming?";
  }
  if (missed > 0 && mood >= 3) {
    return `You left ${missed} task${missed > 1 ? "s" : ""} undone but felt sharp. Were those tasks actually important, or just planned by a more anxious version of you?`;
  }
  if (missed > 0 && mood < 2) {
    return "What was the actual reason — not the story you'll tell yourself tomorrow?";
  }
  return "What would today look like if you rated your honesty a 10 instead of what you actually rated it?";
}

function CheckIn() {
  const nav = useNavigate();
  const tasks = useApp((s) => s.tasks);
  const saveCheckIn = useApp((s) => s.saveCheckIn);
  const unlockInsight = useApp((s) => s.unlockInsight);
  const recoveryMode = useApp((s) => s.recoveryMode);
  const { state } = useUserState();
  const newInsight = useLatestInsight();

  const [focus, setFocus] = useState(7);
  const [mood, setMood] = useState(2);
  const [energy, setEnergy] = useState(60);
  const [sleep, setSleep] = useState(6.5);
  const [honesty, setHonesty] = useState(8);
  const [picked, setPicked] = useState<string[]>(["phone"]);
  const [reflection, setReflection] = useState("");
  const [result, setResult] = useState<{ newScore: number; delta: number; unlockedInsight?: string } | null>(null);

  const completed = tasks.filter((t) => t.done).length;
  const planned = tasks.length;
  const missed = planned - completed;
  const completionRatio = planned > 0 ? completed / planned : 1;

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const reflectivePrompt = useMemo(
    () => getReflectivePrompt(state, completionRatio, mood, missed),
    [state, completionRatio, mood, missed]
  );

  const save = () => {
    const r = saveCheckIn({
      focus, mood, energy, sleepHours: sleep, honesty,
      distractions: picked, reflection, completed, planned,
    });

    // Variable insight reward — unlock a new insight if score is high and behavior is solid
    let unlockedInsight: string | undefined;
    if (r.newScore >= 70 && focus >= 7 && sleep >= 7) {
      unlockInsight("i6");
      unlockedInsight = "Your 9–11 AM window is neurologically optimal.";
    } else if (r.newScore >= 55 && picked.length <= 1) {
      unlockInsight("i5");
      unlockedInsight = "Shorter task lists lead to faster recoveries.";
    }

    setResult({ ...r, unlockedInsight });
  };

  if (result) {
    const triggeredRecovery = result.newScore < 45;
    return (
      <div className="flex flex-col gap-5 pb-6">
        <ScreenHeader
          eyebrow="Check-in saved"
          title={
            triggeredRecovery
              ? "We're easing the load."
              : result.delta >= 5
              ? "Strong session logged."
              : result.delta >= 0
              ? "Score is climbing."
              : "Mixed signal — it's fine."
          }
          subtitle={
            triggeredRecovery
              ? "Recovery mode is active. Tomorrow's plan is reduced automatically."
              : result.delta >= 0
              ? "We logged the honest signal. Tomorrow calibrates to it."
              : "A down day is data, not failure. The system accounts for it."
          }
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
                <p className="mt-1 text-xs text-muted-foreground max-w-[22ch]">
                  Driven by sleep, focus, and {Math.round(completionRatio * 100)}% completion rate.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Variable insight reward — the earned moment */}
        {result.unlockedInsight && (
          <section className="px-5">
            <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/30 hairline">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/20 text-accent">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-accent font-medium mb-1">New insight unlocked</p>
                  <p className="font-display text-base leading-snug text-foreground">"{result.unlockedInsight}"</p>
                  <p className="mt-1 text-xs text-muted-foreground">Earned through consistent execution and low distraction. View it in Insights.</p>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Identity reinforcement — always shown */}
        <section className="px-5">
          <Card>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-secondary">
                <TrendingUp className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <StatLabel>Behavioral signal</StatLabel>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                  {result.newScore >= 70
                    ? "You're reinforcing the identity of someone who follows through. That compounds."
                    : result.newScore >= 50
                    ? "Solid effort logged. Consistency across weeks — not perfection in single days — is what builds."
                    : triggeredRecovery
                    ? "Recovery isn't failure. The fastest operators know when to pull back. You're doing that now."
                    : "One honest day — even a hard one — is more valuable than ten performed days."}
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
            See behavioral insights <Sparkles className="h-4 w-4" />
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
        title={
          state === "burnout"
            ? "Gentle check-in."
            : state === "recovery"
            ? "Recovery check-in."
            : "Tonight's check-in."
        }
        subtitle={
          state === "burnout"
            ? "No pressure. Just log what happened. The system adjusts."
            : state === "recovery"
            ? "Did you protect your energy today? That's the only metric that matters."
            : "Two minutes of honesty beats an hour of planning."
        }
        right={recoveryMode ? <Pill tone="warning">Recovery</Pill> : undefined}
      />

      <section className="px-5 space-y-4">

        {/* Task completion review */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <StatLabel>Tasks completed today</StatLabel>
            <span className={`text-xs num-tabular ${completionRatio >= 1 ? "text-success" : "text-muted-foreground"}`}>
              {completed} of {planned}
            </span>
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
          {missed > 0 && (
            <p className="mt-3 text-[11px] text-warning">
              {missed} task{missed > 1 ? "s" : ""} left undone. The honest reason matters more than the number.
            </p>
          )}
        </Card>

        <SliderCard label="Focus quality" value={focus} unit="/10" min={1} max={10} onChange={setFocus} left="Scattered" right="Locked" />

        {/* Mood selector — state-adaptive labels */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <StatLabel>How did today feel?</StatLabel>
            <Pill tone={mood >= 3 ? "success" : mood >= 2 ? "accent" : "warning"}>{moods[mood]}</Pill>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {moods.map((m, i) => (
              <button
                key={m}
                onClick={() => setMood(i)}
                className={`rounded-xl py-2.5 text-[11px] font-medium transition ${
                  mood === i
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </Card>

        <SliderCard label="Energy remaining" value={energy} unit="%" min={0} max={100} onChange={setEnergy} left="Empty" right="Full" />
        <SliderCard label="Sleep last night" value={sleep} unit="h" min={3} max={10} step={0.5} onChange={setSleep} left="3h" right="10h" />

        {/* Low sleep adaptive warning */}
        {sleep < 6 && (
          <div className="rounded-2xl bg-warning/10 border border-warning/20 px-4 py-3">
            <p className="text-[12px] text-warning leading-relaxed">
              Under 6h sleep correlates with a 35–40% drop in execution quality. This signals the system automatically.
            </p>
          </div>
        )}

        {/* Distractions */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <StatLabel>Distractions today</StatLabel>
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
                    on
                      ? "bg-accent/15 text-accent ring-1 ring-accent/40"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {d.label}
                </button>
              );
            })}
          </div>
          {picked.length >= 4 && (
            <p className="mt-3 text-[11px] text-warning">
              Heavy distraction load flagged. Wind-down protocol reduces this pattern by ~40%.
            </p>
          )}
        </Card>

        <SliderCard label="How honest was today's effort?" value={honesty} unit="/10" min={1} max={10} onChange={setHonesty} left="Performative" right="True" />

        {/* Adaptive reflective prompt */}
        <Card className="bg-gradient-surface">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <StatLabel>Reflective prompt</StatLabel>
              <p className="font-display mt-2 text-base leading-snug text-foreground">
                {reflectivePrompt}
              </p>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={3}
                placeholder="Type freely. Nothing is shared."
                className="mt-3 w-full resize-none rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* New insight teaser — if one is available from prior sessions */}
        {newInsight && (
          <Card className="hairline border-accent/20">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-accent flex-none mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-accent font-medium mb-1">Recent pattern detected</p>
                <p className="text-sm text-foreground">{newInsight.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Available in Insights after this check-in.</p>
              </div>
            </div>
          </Card>
        )}

        <button
          onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
        >
          <Zap className="h-4 w-4" /> Save check-in
        </button>
      </section>
    </div>
  );
}

function SliderCard({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
  left,
  right,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  left?: string;
  right?: string;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <StatLabel>{label}</StatLabel>
        <span className="font-display text-2xl text-foreground num-tabular">
          {value}<span className="text-sm text-muted-foreground">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full accent-[oklch(0.85_0.16_80)]"
      />
      {(left || right) && (
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{left}</span><span>{right}</span>
        </div>
      )}
    </Card>
  );
}
