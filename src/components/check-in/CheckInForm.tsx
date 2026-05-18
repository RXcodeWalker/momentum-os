import { useState, useMemo } from "react";
import { Card, Pill, StatLabel } from "@/components/ui-bits";
import {
  Check,
  CalendarDays,
  Lightbulb,
  Zap,
  Phone,
  Users,
  Tv,
  Bell,
  Coffee,
  Brain,
  Sparkles,
  Clock,
  Battery,
  ShieldAlert,
} from "lucide-react";
import { Task, CheckIn } from "@/lib/store";
import { MOODS, DISTRACTIONS, CHECK_IN_PLACEHOLDERS, CHECK_IN_DEFAULTS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface CheckInFormProps {
  tasks: Task[];
  state: string;
  recoveryMode: boolean;
  onSave: (data: Omit<CheckIn, "date">) => void;
  toggleTask: (id: string) => void;
  rescheduleTask: (id: string) => void;
}

export function CheckInForm({
  tasks,
  state,
  recoveryMode,
  onSave,
  toggleTask,
  rescheduleTask,
}: CheckInFormProps) {
  const [focus, setFocus] = useState(CHECK_IN_DEFAULTS.focus);
  const [mood, setMood] = useState(CHECK_IN_DEFAULTS.mood);
  const [energy, setEnergy] = useState(CHECK_IN_DEFAULTS.energy);
  const [sleep, setSleep] = useState(CHECK_IN_DEFAULTS.sleep);
  const [honesty, setHonesty] = useState(CHECK_IN_DEFAULTS.honesty);
  const [picked, setPicked] = useState<string[]>(CHECK_IN_DEFAULTS.distractions);
  const [reflection, setReflection] = useState("");
  const [tomorrowFocus, setTomorrowFocus] = useState("");
  const [blockers, setBlockers] = useState<Record<string, "time" | "energy" | "focus" | "other">>(
    {},
  );
  const [showAdvice, setShowAdvice] = useState(false);

  const completed = tasks.filter((t) => t.done).length;
  const planned = tasks.length;
  const missed = planned - completed;
  const completionRatio = planned > 0 ? completed / planned : 1;

  const toggleDistraction = (id: string) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    setShowAdvice(false);
  };

  const setBlocker = (taskId: string, type: "time" | "energy" | "focus" | "other") => {
    setBlockers((prev) => ({ ...prev, [taskId]: type }));
  };

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
    });
  };

  return (
    <div className="space-y-4 px-5">
      {/* Tactical Task Review */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <StatLabel>Task Review</StatLabel>
          <span
            className={`text-xs num-tabular ${completionRatio >= 1 ? "text-success" : "text-muted-foreground"}`}
          >
            {completed}/{planned} Done
          </span>
        </div>
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    toggleTask(t.id);
                    if (!t.done) toast.success("Task completed", { description: t.label });
                  }}
                  className="flex flex-1 items-center gap-2 text-left text-sm"
                >
                  <span
                    className={`flex h-4 w-4 flex-none items-center justify-center rounded border transition-colors ${t.done ? "border-success bg-success/20 text-success" : "border-border"}`}
                  >
                    {t.done && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                  </span>
                  <span
                    className={`truncate ${t.done ? "text-muted-foreground line-through" : "text-foreground"}`}
                  >
                    {t.label}
                  </span>
                </button>
                {!t.done && (
                  <button
                    onClick={() => {
                      rescheduleTask(t.id);
                      toast.info("Task rescheduled", { description: "Moved to tomorrow." });
                    }}
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {!t.done && (
                <div className="flex flex-wrap gap-1 pl-6">
                  {(["time", "energy", "focus", "other"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setBlocker(t.id, type)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize transition ${
                        blockers[t.id] === type
                          ? "bg-accent/20 text-accent ring-1 ring-accent/30"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Grid Metrics — Reduced Friction */}
      <div className="grid grid-cols-2 gap-3">
        <SliderCardMini
          label="Focus"
          value={focus}
          unit="/10"
          icon={<Brain className="h-3.5 w-3.5" />}
          onChange={setFocus}
          min={1}
          max={10}
        />
        <SliderCardMini
          label="Energy"
          value={energy}
          unit="%"
          icon={<Battery className="h-3.5 w-3.5" />}
          onChange={setEnergy}
          min={0}
          max={100}
        />
        <SliderCardMini
          label="Sleep"
          value={sleep}
          unit="h"
          icon={<Clock className="h-3.5 w-3.5" />}
          onChange={setSleep}
          min={3}
          max={10}
          step={0.5}
        />
        <SliderCardMini
          label="Honesty"
          value={honesty}
          unit="/10"
          icon={<ShieldAlert className="h-3.5 w-3.5" />}
          onChange={setHonesty}
          min={1}
          max={10}
        />
      </div>

      {/* Mood Selector */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <StatLabel>Overall Mood</StatLabel>
          <Pill tone={mood >= 3 ? "success" : mood >= 2 ? "accent" : "warning"}>{MOODS[mood]}</Pill>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {MOODS.map((m, i) => (
            <button
              key={m}
              onClick={() => setMood(i)}
              className={`flex-none rounded-xl px-4 py-2.5 text-[11px] font-medium transition ${
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

      {/* Distractions */}
      <Card>
        <StatLabel className="mb-3">Distractions flagged</StatLabel>
        <div className="grid grid-cols-3 gap-2">
          {DISTRACTIONS.map((d) => {
            const Icon = d.icon;
            const on = picked.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleDistraction(d.id)}
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
      </Card>

      {/* Reflection & Next Day */}
      <Card className="bg-gradient-surface">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <StatLabel>Reflection</StatLabel>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={2}
                placeholder={CHECK_IN_PLACEHOLDERS.reflection}
                className="mt-2 w-full resize-none rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-border/50 pt-4">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-success/15 text-success">
              <Zap className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <StatLabel>Tomorrow's North Star</StatLabel>
              <input
                type="text"
                value={tomorrowFocus}
                onChange={(e) => setTomorrowFocus(e.target.value)}
                placeholder={CHECK_IN_PLACEHOLDERS.tomorrowFocus}
                className="mt-2 w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </Card>

      <button
        onClick={save}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background transition-transform active:scale-[0.98]"
      >
        <Zap className="h-4 w-4" /> Save Tactical Check-in
      </button>
    </div>
  );
}

function SliderCardMini({
  label,
  value,
  unit,
  icon,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <Card className="px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
        </div>
        <span className="font-display text-sm text-foreground">
          {value}
          <span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full accent-accent h-1.5 rounded-lg appearance-none bg-secondary cursor-pointer"
      />
    </Card>
  );
}
