import { useState } from "react";
import { Card, Pill, StatLabel } from "@/components/ui-bits";
import {
  Check,
  CalendarDays,
  Zap,
  ArrowRight,
  ArrowLeft,
  Moon,
  Battery,
  Brain,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Target,
} from "lucide-react";
import { Task, CheckIn, useSmartCheckInDefaults } from "@/lib/store";
import { MOODS, DISTRACTIONS, CHECK_IN_PLACEHOLDERS, CHECK_IN_DEFAULTS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface CheckInWizardProps {
  tasks: Task[];
  state: string;
  onSave: (data: Omit<CheckIn, "date">) => void;
  toggleTask: (id: string) => void;
  rescheduleTask: (id: string) => void;
}

export function CheckInWizard({
  tasks,
  state,
  onSave,
  toggleTask,
  rescheduleTask,
}: CheckInWizardProps) {
  const smartDefaults = useSmartCheckInDefaults();
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState(smartDefaults.focus ?? CHECK_IN_DEFAULTS.focus);
  const [mood, setMood] = useState(CHECK_IN_DEFAULTS.mood);
  const [energy, setEnergy] = useState(smartDefaults.energy ?? CHECK_IN_DEFAULTS.energy);
  const [sleep, setSleep] = useState(smartDefaults.sleepHours ?? CHECK_IN_DEFAULTS.sleep);
  const [honesty, setHonesty] = useState(CHECK_IN_DEFAULTS.honesty);
  const [picked, setPicked] = useState<string[]>([]);
  const [reflection, setReflection] = useState("");
  const [tomorrowFocus, setTomorrowFocus] = useState(smartDefaults.tomorrowFocusSuggestion ?? "");
  const [blockers, setBlockers] = useState<Record<string, "time" | "energy" | "focus" | "other">>(
    {},
  );
  const [meaningfulProgress, setMeaningfulProgress] = useState<
    "yes" | "partial" | "no" | null
  >(null);

  const completed = tasks.filter((t) => t.done).length;

  const planned = tasks.length;

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const save = () => {
    onSave({
      focus,
      mood,
      energy,
      sleepHours: sleep,
      honesty,
      distractions: picked,
      reflection,
      completed,
      planned,
      blockers,
      tomorrowFocus,
      ...(meaningfulProgress != null ? { meaningfulProgress } : {}),
    });
  };

  const steps = [
    {
      title: "Reviewing your work.",
      subtitle: "Honesty here is the foundation of the system.",
      content: (
        <div className="space-y-4">
          {tasks.map((t) => (
            <Card key={t.id} className="relative overflow-hidden">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    toggleTask(t.id);
                    if (!t.done) toast.success("Task completed");
                  }}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${t.done ? "border-success bg-success text-background" : "border-border"}`}
                  >
                    {t.done && <Check className="h-3.5 w-3.5" strokeWidth={4} />}
                  </div>
                  <span
                    className={`text-sm font-medium ${t.done ? "text-muted-foreground line-through" : "text-foreground"}`}
                  >
                    {t.label}
                  </span>
                </button>
                {!t.done && (
                  <button
                    onClick={() => {
                      rescheduleTask(t.id);
                      toast.info("Moved to tomorrow");
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground"
                  >
                    <CalendarDays className="h-4 w-4" />
                  </button>
                )}
              </div>
              {!t.done && (
                <div className="mt-3 flex gap-2 pl-9">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center mr-1">
                    Blocker:
                  </p>
                  {(["time", "energy", "focus"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setBlockers({ ...blockers, [t.id]: type })}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium capitalize transition ${
                        blockers[t.id] === type
                          ? "bg-accent/20 text-accent ring-1 ring-accent/40"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}
          <button
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background mt-6"
          >
            Review complete <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ),
    },
    {
      title: "The Vibe Check.",
      subtitle: "How are you actually feeling right now?",
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <StatLabel>Core Mood</StatLabel>
            <div className="grid grid-cols-1 gap-2">
              {MOODS.map((m, i) => (
                <button
                  key={m}
                  onClick={() => setMood(i)}
                  className={`flex items-center justify-between rounded-2xl px-5 py-4 transition ${
                    mood === i
                      ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                      : "bg-card hairline text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="font-medium">{m}</span>
                  {mood === i && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <StatLabel>Remaining Energy</StatLabel>
              <span className="font-display text-xl text-accent">{energy}%</span>
            </div>
            <input
              type="range"
              value={energy}
              onChange={(e) => setEnergy(+e.target.value)}
              className="w-full accent-accent h-2 rounded-lg bg-secondary appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
              <span>Drained</span>
              <span>Charged</span>
            </div>
          </div>
          <button
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ),
    },
    {
      title: "Biological signals.",
      subtitle: "Focus, Sleep, and Honesty.",
      content: (
        <div className="space-y-8 py-4">
          <MetricRow
            label="Focus Quality"
            value={focus}
            max={10}
            onChange={setFocus}
            icon={<Brain className="h-5 w-5 text-accent" />}
          />
          <MetricRow
            label="Sleep (Hours)"
            value={sleep}
            max={10}
            step={0.5}
            onChange={setSleep}
            icon={<Moon className="h-5 w-5 text-indigo-400" />}
          />
          <MetricRow
            label="Effort Honesty"
            value={honesty}
            max={10}
            onChange={setHonesty}
            icon={<ShieldAlert className="h-5 w-5 text-warning" />}
          />
          <button
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background mt-4"
          >
            Almost there <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ),
    },
    {
      title: "Clear the deck.",
      subtitle: "What stole your attention today?",
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Did the most important work get closer today?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["yes", "partial", "no"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setMeaningfulProgress(v === meaningfulProgress ? null : v)}
                  className={`rounded-2xl py-3 text-sm font-medium capitalize transition ${
                    meaningfulProgress === v
                      ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                      : "bg-card hairline text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v === "yes" ? "Yes" : v === "partial" ? "Partially" : "Not today"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {DISTRACTIONS.slice(0, 6).map((d) => {
              const Icon = d.icon;
              const on = picked.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() =>
                    setPicked((prev) => (on ? prev.filter((x) => x !== d.id) : [...prev, d.id]))
                  }
                  className={`flex flex-col items-center gap-2 rounded-2xl py-6 transition ${
                    on
                      ? "bg-accent/20 text-accent ring-2 ring-accent/40"
                      : "bg-card hairline text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${on ? "text-accent" : "text-muted-foreground/50"}`} />
                  <span className="text-xs font-medium">{d.label}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
          >
            Final step <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ),
    },
    {
      title: "Tomorrow's Foundation.",
      subtitle: "End the day by removing one tomorrow-morning decision.",
      content: (
        <div className="space-y-6">
          <Card className="bg-gradient-surface border-accent/20">
            <StatLabel className="mb-2 flex items-center gap-1.5 text-accent">
              <Sparkles className="h-3.5 w-3.5" /> Mindful Reflection
            </StatLabel>
            <p className="text-sm text-foreground mb-3 leading-relaxed">
              What's the one thing you're avoiding telling yourself about today?
            </p>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full rounded-xl bg-background/50 border border-border p-3 text-sm focus:outline-none focus:border-accent/50 min-h-[100px]"
              placeholder={CHECK_IN_PLACEHOLDERS.reflection}
            />
          </Card>

          <div className="space-y-3">
            <StatLabel className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-success" /> Tomorrow's North Star
            </StatLabel>
            <input
              type="text"
              value={tomorrowFocus}
              onChange={(e) => setTomorrowFocus(e.target.value)}
              className="w-full rounded-xl bg-card hairline p-4 text-sm focus:outline-none focus:border-accent/50"
              placeholder={CHECK_IN_PLACEHOLDERS.tomorrowFocus}
            />
          </div>

          <button
            onClick={save}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-success py-4 text-sm font-semibold text-success-foreground shadow-lg shadow-success/20 transition-transform active:scale-[0.98]"
          >
            <Zap className="h-4 w-4" /> Close the day
          </button>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div className="px-5 pb-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step ? "w-8 bg-accent" : i < step ? "w-4 bg-accent/40" : "w-4 bg-secondary"
              }`}
            />
          ))}
        </div>
        {step > 0 && (
          <button
            onClick={back}
            className="text-xs font-medium text-muted-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div>
            <h1 className="font-display text-2xl text-foreground tracking-tight">
              {current.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{current.subtitle}</p>
          </div>
          {current.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MetricRow({
  label,
  value,
  max,
  step = 1,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/50">
            {icon}
          </div>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="font-display text-2xl text-foreground">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full accent-accent h-2 rounded-lg bg-secondary appearance-none cursor-pointer"
      />
    </div>
  );
}
