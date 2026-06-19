import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sunrise } from "lucide-react";
import { TapCard, Stagger, StaggerItem } from "@/lib/motion";
import { Card } from "@/components/ui-bits";
import { useApp } from "@/lib/store";
import type { MorningCalibrationInput } from "@/lib/store";
import { useBehavioralPipeline } from "@/hooks/useBehavioralPipeline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = "inputs" | "interpretation" | "commitment";

type CommitChoice = {
  taskId: string | null;
  taskLabel: string;
};

// ---------------------------------------------------------------------------
// Sub-renders (inline, not separate files)
// ---------------------------------------------------------------------------

function SleepTiles({
  value,
  onChange,
}: {
  value: MorningCalibrationInput["sleepQuality"] | null;
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
            className={`w-full rounded-2xl py-4 text-sm font-medium transition-all hairline ${
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
      <div className="flex flex-1 justify-center gap-4">
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <TapCard key={n}>
            <button
              onClick={() => onChange(n)}
              className={`h-6 w-6 rounded-full transition-all ${
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
  value: MorningCalibrationInput["resistance"] | null;
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
// Step 1: Inputs
// ---------------------------------------------------------------------------

function InputsStep({ onNext }: { onNext: (inputs: MorningCalibrationInput) => void }) {
  const [sleep, setSleep] = useState<MorningCalibrationInput["sleepQuality"] | null>(null);
  const [energy, setEnergy] = useState<MorningCalibrationInput["bodyEnergy"] | null>(null);
  const [resistance, setResistance] = useState<MorningCalibrationInput["resistance"] | null>(null);

  const canContinue = sleep !== null && energy !== null && resistance !== null;

  return (
    <Stagger className="space-y-7" gap={0.08}>
      <StaggerItem>
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
            How did sleep feel?
          </p>
          <SleepTiles value={sleep} onChange={setSleep} />
        </div>
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
            if (sleep && energy && resistance) {
              onNext({ sleepQuality: sleep, bodyEnergy: energy, resistance });
            }
          }}
          className={`w-full rounded-2xl py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            canContinue
              ? "bg-foreground text-background"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          }`}
        >
          See your orientation
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </StaggerItem>
    </Stagger>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Interpretation
// ---------------------------------------------------------------------------

function InterpretationStep({ onNext }: { onNext: () => void }) {
  const behavioral = useBehavioralPipeline();
  const observation = behavioral.ready
    ? behavioral.state.interpretation.supporting[0] || behavioral.state.interpretation.headline
    : "Calibrating your morning...";

  return (
    <Stagger className="space-y-6" gap={0.1}>
      <StaggerItem>
        <div className="rounded-3xl bg-secondary/50 p-6 space-y-2">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
            This morning
          </p>
          <p className="text-base text-foreground leading-relaxed font-display">{observation}</p>
        </div>
      </StaggerItem>

      <StaggerItem>
        <motion.button
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.985 }}
          onClick={onNext}
          className="w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background flex items-center justify-center gap-2"
        >
          Choose your first task
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </StaggerItem>
    </Stagger>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Commitment
// ---------------------------------------------------------------------------

function CommitmentStep({
  resistance,
  onCommit,
}: {
  resistance: MorningCalibrationInput["resistance"];
  onCommit: (choice: CommitChoice, intentionText: string) => void;
}) {
  const tomorrowPlan = useApp((s) => s.tomorrowPlan);
  const behavioral = useBehavioralPipeline();
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [intention, setIntention] = useState(tomorrowPlan?.northStar ?? "");
  const addTask = useApp((s) => s.addTask);

  const mode = behavioral.ready ? behavioral.state.mode : "FOCUSED";

  // Route task recommendations through the behavioral pipeline (Task Engine authority).
  // resistance-aware display: if 'resistant', offer secondary as the lighter start option.
  const pipelinePrimary = behavioral.tasks.primaryTask;
  const pipelineSecondary = behavioral.tasks.secondaryTask;

  // Fall back to tomorrowPlan if pipeline has no task recommendation yet
  const fallbackPrimary = tomorrowPlan?.suggestedTasks[0]
    ? { taskId: tomorrowPlan.suggestedTasks[0].originalTaskId ?? null, taskLabel: tomorrowPlan.suggestedTasks[0].label }
    : null;
  const fallbackSecondary = tomorrowPlan?.suggestedTasks[1]
    ? { taskId: tomorrowPlan.suggestedTasks[1].originalTaskId ?? null, taskLabel: tomorrowPlan.suggestedTasks[1].label }
    : null;

  const resolvedPrimary = pipelinePrimary
    ? { taskId: pipelinePrimary.id, taskLabel: pipelinePrimary.label }
    : fallbackPrimary;
  const resolvedSecondary = pipelineSecondary
    ? { taskId: pipelineSecondary.id, taskLabel: pipelineSecondary.label }
    : fallbackSecondary;

  // Resistance-aware display swap: 'resistant' users see the lighter task first
  const primaryTask = resistance === "resistant" && resolvedSecondary ? resolvedSecondary : resolvedPrimary;
  const secondaryTask = resistance === "resistant" && resolvedSecondary ? resolvedPrimary : resolvedSecondary;

  const showIntentionField = mode !== "RECOVERY";
  const showSecondary = mode !== "RECOVERY" && secondaryTask !== null;

  if (!primaryTask) {
    // Empty state — inline add-task
    const taskType = resistance === "ready" ? "deep" : "shallow";
    return (
      <Stagger className="space-y-5" gap={0.1}>
        <StaggerItem>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No tasks yet. Add one to start your day with intention.
          </p>
        </StaggerItem>
        <StaggerItem>
          <input
            autoFocus
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
              // The task won't have an ID yet — we commit with null and the
              // hook will find it by label in tasks[] after the set resolves.
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
    <Stagger className="space-y-4" gap={0.08}>
      <StaggerItem>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold mb-3">
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

      {showIntentionField && (
        <StaggerItem>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
              Today's focus (optional)
            </p>
            <input
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="What matters most today?"
              className="w-full rounded-2xl bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none hairline focus:border-accent/40"
            />
          </div>
        </StaggerItem>
      )}
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
  /** Called at end of step 1 — triggers pipeline run before InterpretationStep renders. */
  onInputsApplied: (inputs: MorningCalibrationInput) => void;
  onComplete: (committedTaskId: string | null, intentionText: string | null) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState<Step>("inputs");
  const [inputs, setInputs] = useState<MorningCalibrationInput | null>(null);

  const stepLabel: Record<Step, string> = {
    inputs: "Morning check-in",
    interpretation: "Your orientation",
    commitment: "First task",
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
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  {stepLabel[step]}
                </p>
              </div>
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
            {step === "inputs" && (
              <motion.div
                key="inputs"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                <InputsStep
                  onNext={(calibrationInputs) => {
                    setInputs(calibrationInputs);
                    onInputsApplied(calibrationInputs); // runs pipeline before interpretation renders
                    setStep("interpretation");
                  }}
                />
              </motion.div>
            )}

            {step === "interpretation" && (
              <motion.div
                key="interpretation"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                <InterpretationStep onNext={() => setStep("commitment")} />
              </motion.div>
            )}

            {step === "commitment" && inputs && (
              <motion.div
                key="commitment"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                <CommitmentStep
                  resistance={inputs.resistance}
                  onCommit={(choice, intentionText) => {
                    onComplete(choice.taskId, intentionText || null);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip link */}
          {step === "inputs" && (
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
