import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sunrise } from "lucide-react";
import { TapCard, Stagger, StaggerItem } from "@/lib/motion";
import { useApp } from "@/lib/store";
import type { MorningCalibrationInput } from "@/lib/store";
import { useBehavioralPipeline } from "@/hooks/useBehavioralPipeline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = "arrive" | "orient" | "begin";

type CommitChoice = {
  taskId: string | null;
  taskLabel: string;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SleepTiles({
  value,
  onChange,
}: {
  value: MorningCalibrationInput["sleepQuality"];
  onChange: (v: MorningCalibrationInput["sleepQuality"]) => void;
}) {
  const options: { id: MorningCalibrationInput["sleepQuality"]; label: string }[] = [
    { id: "rough", label: "Rough" },
    { id: "decent", label: "Decent" },
    { id: "good", label: "Good" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((o) => (
        <TapCard key={o.id}>
          <button
            onClick={() => onChange(o.id)}
            className={`w-full rounded-2xl py-3 text-sm font-medium transition-all hairline ${
              value === o.id
                ? "bg-accent/15 text-accent border-accent/40"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        </TapCard>
      ))}
    </div>
  );
}

function EnergyDots({
  value,
  onChange,
}: {
  value: MorningCalibrationInput["bodyEnergy"] | null;
  onChange: (v: MorningCalibrationInput["bodyEnergy"]) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Low</span>
      <div className="flex flex-1 justify-center gap-5">
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <TapCard key={n}>
            <button
              onClick={() => onChange(n)}
              className={`h-8 w-8 rounded-full transition-all ${
                value !== null && n <= value
                  ? "bg-accent scale-110"
                  : "bg-secondary hover:bg-accent/30"
              }`}
            />
          </TapCard>
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">High</span>
    </div>
  );
}

function ResistancePills({
  value,
  onChange,
}: {
  value: MorningCalibrationInput["resistance"];
  onChange: (v: MorningCalibrationInput["resistance"]) => void;
}) {
  const options: { id: MorningCalibrationInput["resistance"]; label: string }[] = [
    { id: "ready", label: "Ready" },
    { id: "friction", label: "Some friction" },
    { id: "resistant", label: "Resistant" },
  ];
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((o) => (
        <TapCard key={o.id}>
          <button
            onClick={() => onChange(o.id)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-all hairline ${
              value === o.id
                ? "bg-accent/15 text-accent border-accent/40"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        </TapCard>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Breath ring — slow-pulse SVG circle; watch-only, reduced-motion aware
// ---------------------------------------------------------------------------

function BreathRing() {
  return (
    <div className="flex justify-center">
      <motion.div
        className="relative flex h-20 w-20 items-center justify-center"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ ["@media (prefers-reduced-motion: reduce)" as string]: { animation: "none" } }}
      >
        <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="1.5"
            strokeOpacity="0.3"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="226"
            animate={{ strokeDashoffset: [226, 0, 226] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
        <Sunrise className="h-7 w-7 text-accent" />
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Arrive — regulate
// ---------------------------------------------------------------------------

function ArriveStep({ onNext }: { onNext: (inputs: MorningCalibrationInput) => void }) {
  const [energy, setEnergy] = useState<MorningCalibrationInput["bodyEnergy"] | null>(null);
  // Pre-selected defaults; user can change them (optional)
  const [sleep, setSleep] = useState<MorningCalibrationInput["sleepQuality"]>("decent");
  const [resistance, setResistance] = useState<MorningCalibrationInput["resistance"]>("ready");

  const canContinue = energy !== null;

  return (
    <Stagger className="space-y-6" gap={0.09}>
      <StaggerItem>
        <BreathRing />
      </StaggerItem>

      <StaggerItem>
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
            Body energy right now
          </p>
          <EnergyDots value={energy} onChange={setEnergy} />
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
            Sleep felt like
          </p>
          <SleepTiles value={sleep} onChange={setSleep} />
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
            Resistance to starting
          </p>
          <ResistancePills value={resistance} onChange={setResistance} />
        </div>
      </StaggerItem>

      <StaggerItem>
        <motion.button
          whileHover={{ scale: canContinue ? 1.005 : 1 }}
          whileTap={{ scale: canContinue ? 0.985 : 1 }}
          disabled={!canContinue}
          onClick={() => {
            if (energy !== null) {
              onNext({ sleepQuality: sleep, bodyEnergy: energy, resistance });
            }
          }}
          className={`w-full rounded-2xl py-4 text-sm font-semibold transition-all ${
            canContinue
              ? "bg-foreground text-background"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          }`}
        >
          I'm ready
        </motion.button>
      </StaggerItem>
    </Stagger>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Orient + Commit — clarity
// ---------------------------------------------------------------------------

function OrientCommitStep({
  inputs,
  onCommit,
}: {
  inputs: MorningCalibrationInput;
  onCommit: (choice: CommitChoice, intentionText: string) => void;
}) {
  const tomorrowPlan = useApp((s) => s.tomorrowPlan);
  const behavioral = useBehavioralPipeline();
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [intention, setIntention] = useState(tomorrowPlan?.northStar ?? "");
  const addTask = useApp((s) => s.addTask);

  const mode = behavioral.ready ? behavioral.state.mode : "FOCUSED";
  const workloadGuidance = behavioral.tasks.workload.guidance;

  // Orientation header copy
  const continuityLine = tomorrowPlan?.northStar
    ? `Yesterday you pointed at "${tomorrowPlan.northStar}."`
    : null;

  const capacityLine = (() => {
    if (!behavioral.ready) return null;
    if (workloadGuidance === "reduce")
      return "Today reads like a protect-capacity day — one solid block beats three half-ones.";
    if (workloadGuidance === "expand")
      return "Energy's high today — a strong output session is within reach.";
    return "Today looks balanced — maintain your rhythm and pick one anchor.";
  })();

  // Pipeline task resolution with tomorrowPlan fallback
  const pipelinePrimary = behavioral.tasks.primaryTask;
  const pipelineSecondary = behavioral.tasks.secondaryTask;

  const fallbackPrimary = tomorrowPlan?.suggestedTasks[0]
    ? {
        taskId: tomorrowPlan.suggestedTasks[0].originalTaskId ?? null,
        taskLabel: tomorrowPlan.suggestedTasks[0].label,
      }
    : null;
  const fallbackSecondary = tomorrowPlan?.suggestedTasks[1]
    ? {
        taskId: tomorrowPlan.suggestedTasks[1].originalTaskId ?? null,
        taskLabel: tomorrowPlan.suggestedTasks[1].label,
      }
    : null;

  const resolvedPrimary = pipelinePrimary
    ? { taskId: pipelinePrimary.id, taskLabel: pipelinePrimary.label }
    : fallbackPrimary;
  const resolvedSecondary = pipelineSecondary
    ? { taskId: pipelineSecondary.id, taskLabel: pipelineSecondary.label }
    : fallbackSecondary;

  // Resistance-aware swap
  const primaryTask =
    inputs.resistance === "resistant" && resolvedSecondary ? resolvedSecondary : resolvedPrimary;
  const secondaryTask =
    inputs.resistance === "resistant" && resolvedSecondary ? resolvedPrimary : resolvedSecondary;

  const showSecondary = mode !== "RECOVERY" && secondaryTask !== null;

  if (!primaryTask) {
    const taskType = inputs.resistance === "ready" ? "deep" : "shallow";
    return (
      <Stagger className="space-y-5" gap={0.1}>
        {continuityLine && (
          <StaggerItem>
            <p className="text-xs text-muted-foreground/70 italic">{continuityLine}</p>
          </StaggerItem>
        )}
        {capacityLine && (
          <StaggerItem>
            <p className="text-sm text-muted-foreground leading-relaxed">{capacityLine}</p>
          </StaggerItem>
        )}
        <StaggerItem>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No tasks yet. Add one to anchor your morning.
          </p>
        </StaggerItem>
        <StaggerItem>
          <input
            value={newTaskLabel}
            onChange={(e) => setNewTaskLabel(e.target.value)}
            placeholder="What's the one thing?"
            className="w-full rounded-2xl bg-secondary px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none hairline focus:border-accent/40"
          />
        </StaggerItem>
        <StaggerItem>
          <motion.button
            whileHover={{ scale: newTaskLabel.trim() ? 1.005 : 1 }}
            whileTap={{ scale: newTaskLabel.trim() ? 0.985 : 1 }}
            disabled={!newTaskLabel.trim()}
            onClick={() => {
              if (!newTaskLabel.trim()) return;
              addTask({ label: newTaskLabel.trim(), estMin: 30, type: taskType });
              onCommit({ taskId: null, taskLabel: newTaskLabel.trim() }, intention);
            }}
            className="w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background disabled:opacity-50"
          >
            Commit to this task
          </motion.button>
        </StaggerItem>
      </Stagger>
    );
  }

  return (
    <Stagger className="space-y-5" gap={0.08}>
      {/* Orientation header */}
      {(continuityLine || capacityLine) && (
        <StaggerItem>
          <div className="rounded-2xl bg-secondary/50 px-4 py-3.5 space-y-1.5">
            {continuityLine && (
              <p className="text-xs text-muted-foreground/70 italic leading-relaxed">
                {continuityLine}
              </p>
            )}
            {capacityLine && (
              <p className="text-sm text-foreground/80 leading-relaxed">{capacityLine}</p>
            )}
          </div>
        </StaggerItem>
      )}

      {/* Primary anchor */}
      <StaggerItem>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
          Start with
        </p>
        <TapCard>
          <button
            onClick={() => onCommit(primaryTask, intention)}
            className="w-full rounded-2xl bg-accent/10 border border-accent/30 px-5 py-5 text-left transition-all hover:bg-accent/15"
          >
            <p className="text-base font-semibold text-foreground">{primaryTask.taskLabel}</p>
            <p className="text-[11px] text-accent mt-1">Tap to commit</p>
          </button>
        </TapCard>
      </StaggerItem>

      {/* Secondary option */}
      {showSecondary && secondaryTask && (
        <StaggerItem>
          <TapCard>
            <button
              onClick={() => onCommit(secondaryTask, intention)}
              className="w-full rounded-2xl bg-secondary px-5 py-3.5 text-left hairline hover:border-foreground/20 transition-all"
            >
              <p className="text-sm text-muted-foreground">
                Start lighter instead →{" "}
                <span className="text-foreground font-medium">{secondaryTask.taskLabel}</span>
              </p>
            </button>
          </TapCard>
        </StaggerItem>
      )}

      {/* Intention field — de-emphasized, optional */}
      {mode !== "RECOVERY" && (
        <StaggerItem>
          <input
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Today's intention (optional)"
            className="w-full rounded-2xl bg-secondary/60 px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none hairline focus:border-accent/30"
          />
        </StaggerItem>
      )}
    </Stagger>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Begin — handoff
// ---------------------------------------------------------------------------

function BeginStep({
  committedTask,
  onStartNow,
  onLater,
}: {
  committedTask: CommitChoice;
  onStartNow: () => void;
  onLater: () => void;
}) {
  return (
    <Stagger className="space-y-5" gap={0.1}>
      <StaggerItem>
        <div className="rounded-3xl bg-accent/8 border border-accent/20 px-5 py-5 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-accent font-bold">Anchored</p>
          <p className="text-base font-semibold text-foreground">{committedTask.taskLabel}</p>
        </div>
      </StaggerItem>

      <StaggerItem>
        <motion.button
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.985 }}
          onClick={onStartNow}
          className="w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
        >
          Start now
        </motion.button>
      </StaggerItem>

      <StaggerItem>
        <button
          onClick={onLater}
          className="w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-2"
        >
          Later — take me to my day
        </button>
      </StaggerItem>
    </Stagger>
  );
}

// ---------------------------------------------------------------------------
// Main sheet
// ---------------------------------------------------------------------------

export function MorningCalibrationSheet({
  onInputsApplied,
  onComplete,
  onSkip,
}: {
  onInputsApplied: (inputs: MorningCalibrationInput) => void;
  onComplete: (
    committedTaskId: string | null,
    intentionText: string | null,
    opts?: { startNow?: boolean; workloadAtCalibration?: "reduce" | "hold" | "expand" },
  ) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState<Step>("arrive");
  const [inputs, setInputs] = useState<MorningCalibrationInput | null>(null);
  const [pendingCommit, setPendingCommit] = useState<{
    choice: CommitChoice;
    intentionText: string;
  } | null>(null);
  const behavioral = useBehavioralPipeline();

  const stepLabel: Record<Step, string> = {
    arrive: "Morning calibration",
    orient: "Your anchor",
    begin: "Begin",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onSkip}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg rounded-t-[2.5rem] bg-card hairline shadow-2xl pb-safe"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="px-6 pt-3 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-success/20 text-success">
                <Sunrise className="h-4 w-4" />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                {stepLabel[step]}
              </p>
            </div>
            <button
              onClick={onSkip}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Steps */}
          <AnimatePresence mode="wait">
            {step === "arrive" && (
              <motion.div
                key="arrive"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                <ArriveStep
                  onNext={(calibrationInputs) => {
                    setInputs(calibrationInputs);
                    onInputsApplied(calibrationInputs);
                    setStep("orient");
                  }}
                />
              </motion.div>
            )}

            {step === "orient" && inputs && (
              <motion.div
                key="orient"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                <OrientCommitStep
                  inputs={inputs}
                  onCommit={(choice, intentionText) => {
                    setPendingCommit({ choice, intentionText });
                    setStep("begin");
                  }}
                />
              </motion.div>
            )}

            {step === "begin" && pendingCommit && (
              <motion.div
                key="begin"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                <BeginStep
                  committedTask={pendingCommit.choice}
                  onStartNow={() => {
                    onComplete(pendingCommit.choice.taskId, pendingCommit.intentionText || null, {
                      startNow: true,
                      workloadAtCalibration: behavioral.ready
                        ? behavioral.tasks.workload.guidance
                        : undefined,
                    });
                  }}
                  onLater={() => {
                    onComplete(pendingCommit.choice.taskId, pendingCommit.intentionText || null, {
                      startNow: false,
                      workloadAtCalibration: behavioral.ready
                        ? behavioral.tasks.workload.guidance
                        : undefined,
                    });
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip link — only on arrive step */}
          {step === "arrive" && (
            <button
              onClick={onSkip}
              className="mt-4 w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-2"
            >
              Skip for today
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
