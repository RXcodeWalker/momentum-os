import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Lock, Target, Zap, Shield, Calendar } from "lucide-react";
import { Card, Pill, StatLabel } from "@/components/ui-bits";
import {
  useApp,
  useBlockerPattern,
  useDistractionProfile,
  useDayOfWeekProfile,
  useMomentum,
  WeeklyPlan,
  WeeklyOutcome,
  buildWeeklyPlanDraft,
} from "@/lib/store";
import { FadeUp } from "@/lib/motion";

interface WeeklyReviewWizardProps {
  onClose: () => void;
}

const BLOCKER_OPTIONS = ["time", "energy", "focus", "environment", "motivation", "clarity"];
const DISTRACTION_OPTIONS = ["phone", "social", "fatigue", "environment", "notifications", "people"];
const COUNTERMEASURE_OPTIONS: Record<string, string[]> = {
  time: ["Block 2h morning focus slot", "Ruthlessly defer non-essential", "Cap meetings to afternoons"],
  energy: ["Protect 7h sleep non-negotiable", "Move before deep work", "Cap load on low-energy days"],
  focus: ["Phone in other room during deep work", "25-min Pomodoro blocks", "Single-task rule"],
  environment: ["Designated deep work space", "Noise-cancelling headphones", "Clear desk before starting"],
  motivation: ["Connect work to weekly north star", "Start with smallest possible step", "Celebrate completions"],
  clarity: ["Write 3 outcomes every morning", "End each day with next-day plan", "Weekly intention before Monday"],
  phone: ["Phone in drawer during focus blocks", "App limits on social", "No phone first hour of day"],
  social: ["Social media 1x/day window", "Mute non-critical notifications", "Batch check at fixed times"],
  fatigue: ["Protect sleep above all", "Strategic caffeine timing", "Recovery activity mid-day"],
  notifications: ["DND during deep work", "Batch notifications to 2x/day", "Email 2x/day only"],
  people: ["Close-door signal for deep work", "Hold-my-calls block on calendar", "Async-first communication"],
};

function getISOWeekMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function WeeklyReviewWizard({ onClose }: WeeklyReviewWizardProps) {
  const acceptWeeklyPlan = useApp((s) => s.acceptWeeklyPlan);
  const tasks = useApp((s) => s.tasks);
  const history = useApp((s) => s.history);
  const aggregationSnapshots = useApp((s) => s.aggregationSnapshots);
  const dowProfile = useDayOfWeekProfile();
  const distractionProfile = useDistractionProfile();
  const blockerPattern = useBlockerPattern();
  const momentum = useMomentum();
  const week = history.slice(-7);
  const wkAvg = week.length
    ? Math.round(week.reduce((a, d) => a + d.executionScore, 0) / week.length)
    : 0;

  const w14RecoveryDebt = !!(aggregationSnapshots.W14?.metrics as Record<string, unknown> | undefined)?.recoveryDebtAccumulating;
  const topDistractor = distractionProfile.topDistractors[0];
  const topBlocker = blockerPattern.dominantBlocker;

  const draft = buildWeeklyPlanDraft(
    dowProfile.byDay,
    w14RecoveryDebt,
    topBlocker ?? undefined,
    topDistractor?.id ?? undefined,
  );

  const [step, setStep] = useState(0);

  // Step 2 state
  const [selectedBlocker, setSelectedBlocker] = useState<string>(topBlocker ?? "");
  const [blockerCountermeasure, setBlockerCountermeasure] = useState("");
  const [selectedDistractor, setSelectedDistractor] = useState<string>(topDistractor?.id ?? "");
  const [distractorCountermeasure, setDistractorCountermeasure] = useState("");

  // Step 3 state
  const [northStar, setNorthStar] = useState("");
  const [outcomes, setOutcomes] = useState<[string, string, string]>(["", "", ""]);
  const [linkedTaskIds, setLinkedTaskIds] = useState<Record<number, string[]>>({ 0: [], 1: [], 2: [] });
  const [showLinkPicker, setShowLinkPicker] = useState<number | null>(null);

  // Step 4 state
  const [nudges, setNudges] = useState<Record<number, number>>({});

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Enforce deep work ceiling: Mon–Fri sum ≤ 10
  const totalDeepWork = [1, 2, 3, 4, 5].reduce((sum, i) => {
    const base = draft.baseCapacities[i]?.deepWorkCap ?? 0;
    return sum + Math.max(0, base);
  }, 0);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  function handleNudge(day: number, delta: number) {
    const base = draft.baseCapacities[day] ?? { taskCap: 2, deepWorkCap: 1 };
    const current = nudges[day] ?? 0;
    const nextNudge = Math.max(-base.taskCap + 1, Math.min(2, current + delta));
    setNudges({ ...nudges, [day]: nextNudge });
  }

  function buildFinalPlan(): Omit<WeeklyPlan, "acceptedAt" | "revisions"> {
    const keyOutcomes: [WeeklyOutcome, WeeklyOutcome, WeeklyOutcome] = [
      { text: outcomes[0], linkedTaskIds: linkedTaskIds[0] },
      { text: outcomes[1], linkedTaskIds: linkedTaskIds[1] },
      { text: outcomes[2], linkedTaskIds: linkedTaskIds[2] },
    ];
    return {
      weekStartDate: getISOWeekMonday(new Date()),
      northStar,
      keyOutcomes,
      blockerGuard:
        selectedBlocker && blockerCountermeasure
          ? { blockerType: selectedBlocker, countermeasure: blockerCountermeasure }
          : null,
      distractionGuard:
        selectedDistractor && distractorCountermeasure
          ? { distractionType: selectedDistractor, countermeasure: distractorCountermeasure }
          : null,
      baseCapacities: draft.baseCapacities,
      capacityNudges: nudges,
      generatedAt: new Date().toISOString(),
    };
  }

  const steps = [
    // Step 0: Week Scorecard
    {
      title: "Last week's scorecard.",
      subtitle: "Setting context before you plan forward.",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2.5">
            <Card>
              <StatLabel>Avg score</StatLabel>
              <p className="font-display text-2xl text-foreground mt-1">{wkAvg}</p>
            </Card>
            <Card>
              <StatLabel>vs prior week</StatLabel>
              <p className={`font-display text-2xl mt-1 ${momentum.delta >= 0 ? "text-success" : "text-danger"}`}>
                {momentum.delta >= 0 ? "+" : ""}{momentum.delta}
              </p>
            </Card>
            <Card>
              <StatLabel>Trend</StatLabel>
              <p className="font-display text-2xl text-foreground mt-1 capitalize">{momentum.trend}</p>
            </Card>
          </div>
          {dowProfile.bestDay && (
            <Card>
              <StatLabel className="mb-3 block">Day-of-week pattern</StatLabel>
              <div className="flex items-end gap-1.5 h-14">
                {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
                  const stats = dowProfile.byDay[dow];
                  const score = stats?.avgScore ?? 0;
                  const isBest = dowProfile.bestDay?.dow === dow;
                  const isWorst = dowProfile.worstDay?.dow === dow;
                  return (
                    <div key={dow} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t-sm ${isBest ? "bg-success" : isWorst ? "bg-danger/60" : "bg-accent/30"}`}
                        style={{ height: `${Math.max(6, score)}%` }}
                      />
                      <span className={`text-[9px] font-medium ${isBest ? "text-success" : isWorst ? "text-danger/70" : "text-muted-foreground"}`}>
                        {DAY_NAMES[dow].slice(0, 1)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Best: <span className="text-success font-semibold">{dowProfile.bestDay.dayName}</span>
                {dowProfile.worstDay && (
                  <> · Worst: <span className="text-danger/80 font-semibold">{dowProfile.worstDay.dayName}</span></>
                )}
              </p>
            </Card>
          )}
          <button
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
          >
            See patterns <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ),
    },

    // Step 1: Pattern Recognition
    {
      title: "Where friction lives.",
      subtitle: "Patterns from your last 14 days.",
      content: (
        <div className="space-y-4">
          {distractionProfile.topDistractors.length > 0 && (
            <Card>
              <StatLabel className="mb-3 block">Top distractors</StatLabel>
              <div className="space-y-2.5">
                {distractionProfile.topDistractors.slice(0, 3).map((d) => (
                  <div key={d.id} className="flex items-center gap-2">
                    <span className="text-sm text-foreground capitalize flex-1">{d.id.replace("-", " ")}</span>
                    <span className="text-[10px] text-muted-foreground">{d.frequency}d</span>
                    <span className={`text-xs font-semibold ${d.avgScoreImpact < -3 ? "text-danger" : "text-warning"}`}>
                      {d.avgScoreImpact} pts
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {topBlocker && (
            <Card>
              <StatLabel className="mb-2 block">Dominant blocker</StatLabel>
              <div className="flex items-center gap-2">
                <Pill tone="warning" className="text-[10px] capitalize">{topBlocker}</Pill>
                {blockerPattern.streak && (
                  <span className="text-[10px] text-muted-foreground">{blockerPattern.streak.days}d streak</span>
                )}
              </div>
              {blockerPattern.recommendation && (
                <p className="mt-2 text-xs text-muted-foreground">{blockerPattern.recommendation}</p>
              )}
            </Card>
          )}
          {!topBlocker && distractionProfile.topDistractors.length === 0 && (
            <Card>
              <p className="text-sm text-muted-foreground">No clear friction patterns yet. Keep logging check-ins.</p>
            </Card>
          )}
          <button
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
          >
            Set countermeasures <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ),
    },

    // Step 2: Friction Audit
    {
      title: "Commit to countermeasures.",
      subtitle: "One blocker guard. One distraction guard.",
      content: (
        <div className="space-y-5">
          <div>
            <StatLabel className="mb-2 block flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-warning" /> Blocker guard
            </StatLabel>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {BLOCKER_OPTIONS.map((b) => (
                <button
                  key={b}
                  onClick={() => { setSelectedBlocker(b); setBlockerCountermeasure(""); }}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${selectedBlocker === b ? "bg-warning/20 text-warning ring-1 ring-warning/40" : "bg-secondary text-muted-foreground"}`}
                >
                  {b}
                </button>
              ))}
            </div>
            {selectedBlocker && (
              <FadeUp>
                <div className="space-y-1.5">
                  {(COUNTERMEASURE_OPTIONS[selectedBlocker] ?? []).map((cm) => (
                    <button
                      key={cm}
                      onClick={() => setBlockerCountermeasure(cm)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 text-sm transition ${blockerCountermeasure === cm ? "bg-accent/15 text-accent ring-1 ring-accent/30" : "bg-secondary/60 text-muted-foreground"}`}
                    >
                      {cm}
                    </button>
                  ))}
                </div>
              </FadeUp>
            )}
          </div>

          <div>
            <StatLabel className="mb-2 block flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-accent" /> Distraction guard
            </StatLabel>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {DISTRACTION_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => { setSelectedDistractor(d); setDistractorCountermeasure(""); }}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${selectedDistractor === d ? "bg-accent/20 text-accent ring-1 ring-accent/40" : "bg-secondary text-muted-foreground"}`}
                >
                  {d}
                </button>
              ))}
            </div>
            {selectedDistractor && (
              <FadeUp>
                <div className="space-y-1.5">
                  {(COUNTERMEASURE_OPTIONS[selectedDistractor] ?? []).map((cm) => (
                    <button
                      key={cm}
                      onClick={() => setDistractorCountermeasure(cm)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 text-sm transition ${distractorCountermeasure === cm ? "bg-accent/15 text-accent ring-1 ring-accent/30" : "bg-secondary/60 text-muted-foreground"}`}
                    >
                      {cm}
                    </button>
                  ))}
                </div>
              </FadeUp>
            )}
          </div>

          <button
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
          >
            Set intentions <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ),
    },

    // Step 3: Weekly Intentions
    {
      title: "What this week is for.",
      subtitle: "One focus. Three outcomes.",
      content: (
        <div className="space-y-5">
          <div>
            <StatLabel className="mb-2 block">Week's north star</StatLabel>
            <textarea
              value={northStar}
              onChange={(e) => setNorthStar(e.target.value)}
              placeholder="One sentence — what does winning this week look like?"
              className="w-full rounded-2xl bg-secondary/60 border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none h-16 focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </div>

          <div className="space-y-3">
            <StatLabel>Three key outcomes</StatLabel>
            {([0, 1, 2] as const).map((i) => (
              <div key={i} className="space-y-2">
                <input
                  type="text"
                  value={outcomes[i]}
                  onChange={(e) => {
                    const next = [...outcomes] as [string, string, string];
                    next[i] = e.target.value;
                    setOutcomes(next);
                  }}
                  placeholder={`Outcome ${i + 1} — plain intent statement`}
                  className="w-full rounded-2xl bg-secondary/60 border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
                />
                {outcomes[i] && tasks.filter((t) => !t.done).length > 0 && (
                  <button
                    onClick={() => setShowLinkPicker(showLinkPicker === i ? null : i)}
                    className="text-[10px] text-accent/80 flex items-center gap-1"
                  >
                    <Target className="h-3 w-3" />
                    {linkedTaskIds[i].length > 0 ? `${linkedTaskIds[i].length} task(s) linked` : "Link tasks (optional)"}
                  </button>
                )}
                {showLinkPicker === i && (
                  <FadeUp className="space-y-1.5 pl-2">
                    {tasks.filter((t) => !t.done).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          const current = linkedTaskIds[i];
                          const updated = current.includes(t.id)
                            ? current.filter((id) => id !== t.id)
                            : [...current, t.id];
                          setLinkedTaskIds({ ...linkedTaskIds, [i]: updated });
                        }}
                        className={`w-full text-left rounded-xl px-3 py-2 text-xs transition flex items-center gap-2 ${linkedTaskIds[i].includes(t.id) ? "bg-accent/15 text-accent" : "bg-secondary/60 text-muted-foreground"}`}
                      >
                        {linkedTaskIds[i].includes(t.id) && <Check className="h-3 w-3 flex-none" />}
                        {t.label}
                      </button>
                    ))}
                  </FadeUp>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={next}
            disabled={!northStar.trim() || outcomes.filter((o) => o.trim()).length < 1}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background disabled:opacity-40"
          >
            Plan capacity <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ),
    },

    // Step 4: Day Capacity Plan
    {
      title: "Shape the week.",
      subtitle: "Base caps from your history. Nudge ±1 if needed.",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <span>Deep work budget used: {totalDeepWork}/10</span>
            {totalDeepWork > 10 && <span className="text-danger font-semibold">Ceiling reached</span>}
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((dow) => {
              const base = draft.baseCapacities[dow] ?? { taskCap: 2, deepWorkCap: 1 };
              const nudge = nudges[dow] ?? 0;
              const adapted = Math.max(1, base.taskCap + nudge);
              const isBuffer = w14RecoveryDebt && dow === 3;
              return (
                <Card key={dow} className={isBuffer ? "border-warning/20 bg-warning/5" : ""}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground w-8">{DAY_NAMES[dow]}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: adapted }).map((_, i) => (
                          <div key={i} className={`h-2 w-2 rounded-full ${i < base.deepWorkCap ? "bg-accent" : "bg-secondary"}`} />
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-1">{adapted} tasks</span>
                        {isBuffer && <Pill tone="warning" className="text-[8px]">buffer</Pill>}
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{base.deepWorkCap} deep work slots</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleNudge(dow, -1)}
                        className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground hover:bg-secondary/80"
                      >
                        −
                      </button>
                      <span className={`text-[10px] w-4 text-center font-semibold ${nudge > 0 ? "text-success" : nudge < 0 ? "text-danger" : "text-muted-foreground"}`}>
                        {nudge > 0 ? `+${nudge}` : nudge < 0 ? nudge : "·"}
                      </span>
                      <button
                        onClick={() => handleNudge(dow, 1)}
                        className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground hover:bg-secondary/80"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground px-1">
            <span className="inline-block h-2 w-2 rounded-full bg-accent mr-1 align-middle" />
            Blue = deep work slots
          </p>
          <button
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
          >
            Review & lock <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ),
    },

    // Step 5: Confirm & Lock
    {
      title: "Lock in this week.",
      subtitle: "Commitments stay fixed. Execution adapts.",
      content: (
        <div className="space-y-4">
          <Card className="bg-gradient-surface">
            <StatLabel className="mb-1 block">North star</StatLabel>
            <p className="text-sm font-medium text-foreground">{northStar || "—"}</p>
          </Card>

          <Card>
            <StatLabel className="mb-3 block">Three outcomes</StatLabel>
            <div className="space-y-2">
              {outcomes.map((o, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex h-5 w-5 flex-none items-center justify-center rounded-md bg-accent/15 text-accent text-[10px] font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm text-foreground">{o || <span className="text-muted-foreground italic">empty</span>}</p>
                </div>
              ))}
            </div>
          </Card>

          {(selectedBlocker && blockerCountermeasure) || (selectedDistractor && distractorCountermeasure) ? (
            <Card>
              <StatLabel className="mb-3 block">Behavioral guards</StatLabel>
              <div className="space-y-2">
                {selectedBlocker && blockerCountermeasure && (
                  <div className="flex items-start gap-2">
                    <Pill tone="warning" className="text-[9px] flex-none capitalize">{selectedBlocker}</Pill>
                    <p className="text-xs text-muted-foreground">{blockerCountermeasure}</p>
                  </div>
                )}
                {selectedDistractor && distractorCountermeasure && (
                  <div className="flex items-start gap-2">
                    <Pill tone="accent" className="text-[9px] flex-none capitalize">{selectedDistractor}</Pill>
                    <p className="text-xs text-muted-foreground">{distractorCountermeasure}</p>
                  </div>
                )}
              </div>
            </Card>
          ) : null}

          <Card>
            <StatLabel className="mb-3 block flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Week capacity
            </StatLabel>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((dow) => {
                const base = draft.baseCapacities[dow] ?? { taskCap: 2 };
                const nudge = nudges[dow] ?? 0;
                const adapted = Math.max(1, base.taskCap + nudge);
                return (
                  <div key={dow} className="flex-1 text-center">
                    <p className="text-[9px] text-muted-foreground">{DAY_NAMES[dow].slice(0, 1)}</p>
                    <p className="font-display text-base text-foreground">{adapted}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <button
            onClick={() => {
              acceptWeeklyPlan(buildFinalPlan());
              onClose();
            }}
            disabled={!northStar.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-semibold text-accent-foreground disabled:opacity-40 shadow-lg shadow-accent/25"
          >
            <Lock className="h-4 w-4" /> Lock in this week
          </button>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div className="flex flex-col gap-5 pb-6 pt-2">
      {/* Progress + back */}
      <div className="flex items-center justify-between px-5">
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${i === step ? "w-8 bg-accent" : i < step ? "w-4 bg-accent/40" : "w-4 bg-secondary"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={back}
              className="text-xs font-medium text-muted-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground"
          >
            Cancel
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6 px-5"
        >
          <div>
            <h1 className="font-display text-2xl text-foreground tracking-tight">{current.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{current.subtitle}</p>
          </div>
          {current.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
