import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Check,
  BookOpen,
  Dumbbell,
  Code2,
  Palette,
  Shield,
  Users,
  Moon,
  Crosshair,
  HeartPulse,
  Zap,
  AlertTriangle,
  Brain,
  TrendingDown,
  RefreshCw,
  Clock,
  Target,
  Flame,
  Layers,
  Sun,
  Sunset,
  BedDouble,
  Wind,
  ChevronRight,
} from "lucide-react";
import { useApp, type OnboardingProfile } from "@/lib/store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Setup — Cadence" },
      { name: "description", content: "Calibrate your behavioral operating system." },
    ],
  }),
  component: Onboarding,
});

// ─── Data ────────────────────────────────────────────────────────────────────

const GOALS = [
  { id: "studying", label: "Studying", desc: "Learn deeply, retain more", icon: BookOpen },
  { id: "fitness", label: "Fitness", desc: "Train consistently, recover fast", icon: Dumbbell },
  { id: "coding", label: "Coding", desc: "Ship real projects", icon: Code2 },
  { id: "creativity", label: "Creativity", desc: "Make things more often", icon: Palette },
  { id: "discipline", label: "Discipline", desc: "Do hard things daily", icon: Shield },
  { id: "social", label: "Social confidence", desc: "Show up and speak up", icon: Users },
  { id: "sleep", label: "Sleep", desc: "Recover properly every night", icon: Moon },
  { id: "focus", label: "Focus", desc: "Sustain deep attention", icon: Crosshair },
  {
    id: "emotional",
    label: "Emotional stability",
    desc: "Regulate under pressure",
    icon: HeartPulse,
  },
];

const STRUGGLES = [
  {
    id: "inconsistency",
    label: "Inconsistency",
    desc: "You start strong but struggle to sustain momentum.",
    icon: TrendingDown,
  },
  {
    id: "procrastination",
    label: "Procrastination",
    desc: "What matters most gets pushed until it's urgent.",
    icon: Clock,
  },
  {
    id: "burnout",
    label: "Burnout",
    desc: "You push hard until something forces you to stop.",
    icon: Flame,
  },
  {
    id: "perfectionism",
    label: "Perfectionism",
    desc: "You spend too much time optimizing instead of executing.",
    icon: Target,
  },
  {
    id: "distraction",
    label: "Distraction addiction",
    desc: "Your attention fractures across too many inputs.",
    icon: Zap,
  },
  {
    id: "overplanning",
    label: "Overplanning",
    desc: "Plans get elaborate. Execution stays shallow.",
    icon: Layers,
  },
  {
    id: "motivation",
    label: "Motivation crashes",
    desc: "Energy is high then gone — no middle ground.",
    icon: RefreshCw,
  },
  {
    id: "goals",
    label: "Unrealistic goals",
    desc: "Missing one day often becomes a reset spiral.",
    icon: AlertTriangle,
  },
];

const ENERGY_PEAKS = [
  { id: "early", label: "Early morning", desc: "5–9 AM", icon: Sun },
  { id: "morning", label: "Morning", desc: "9 AM–12", icon: Sun },
  { id: "midday", label: "Midday", desc: "12–3 PM", icon: Sunset },
  { id: "evening", label: "Evening", desc: "5–9 PM", icon: Sunset },
  { id: "night", label: "Late night", desc: "9 PM+", icon: Moon },
];

const SLEEP_PATTERNS = [
  { id: "solid", label: "Solid (7–9h)", desc: "Consistent and protective" },
  { id: "variable", label: "Variable", desc: "Good nights and bad nights" },
  { id: "short", label: "Short (5–7h)", desc: "Functioning but running lean" },
  { id: "collapsed", label: "Collapsed", desc: "Often under 5h or irregular" },
];

const FOCUS_DURATIONS = [
  { id: "15", label: "15–30 min", desc: "Hard to go longer" },
  { id: "45", label: "45–60 min", desc: "Standard block" },
  { id: "90", label: "90+ min", desc: "Deep flow is accessible" },
  { id: "varies", label: "Varies", desc: "Depends on the day" },
];

const WORKLOADS = [
  { id: "light", label: "Light", desc: "1–2 real tasks/day" },
  { id: "moderate", label: "Moderate", desc: "3–4 tasks/day" },
  { id: "heavy", label: "Heavy", desc: "5+ tasks/day" },
  { id: "unclear", label: "Unclear", desc: "I often over- or under-plan" },
];

const RECOVERY_SPEEDS = [
  { id: "fast", label: "Fast", desc: "Back on track in 1–2 days" },
  { id: "medium", label: "Medium", desc: "Takes 3–5 days to recover" },
  { id: "slow", label: "Slow", desc: "Needs a week or more" },
  { id: "spiral", label: "I spiral", desc: "One bad day resets everything" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toggle(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

function pickOne(arr: string[], id: string): string[] {
  return arr.includes(id) ? [] : [id];
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

// Derives a workload recommendation from goal count + struggles
function deriveWorkloadWarning(goalCount: number, workload: string, struggles: string[]) {
  const overloaded = goalCount >= 5 || workload === "heavy";
  const hasPerfectionism = struggles.includes("perfectionism");
  const hasOverplanning = struggles.includes("overplanning");
  const hasBurnout = struggles.includes("burnout");

  if (overloaded && (hasBurnout || hasPerfectionism)) {
    return {
      level: "high" as const,
      headline: "High ambition + burnout risk detected.",
      body: "Long-term consistency collapses under this load. Your system will calibrate a sustainable cap.",
    };
  }
  if (overloaded) {
    return {
      level: "elevated" as const,
      headline: "Ambitious workload selected.",
      body: "Sustained output requires protected recovery. We'll build guardrails in automatically.",
    };
  }
  if (hasOverplanning || hasPerfectionism) {
    return {
      level: "caution" as const,
      headline: "Planning pattern detected.",
      body: "Your profile shows tendency to plan more than execute. The system will prompt execution before planning.",
    };
  }
  return null;
}

// Derives a momentum baseline score from all profile inputs
function deriveBaselineScore(profile: Profile): number {
  const sleepBonus =
    { solid: 18, variable: 10, short: 4, collapsed: 0 }[profile.sleep[0] ?? "variable"] ?? 8;
  const workloadPenalty =
    { light: 0, moderate: 5, heavy: 12, unclear: 8 }[profile.workload[0] ?? "moderate"] ?? 5;
  const recoveryBonus =
    { fast: 20, medium: 12, slow: 5, spiral: 0 }[profile.recovery[0] ?? "medium"] ?? 10;
  const focusBonus = { "15": 5, "45": 12, "90": 20, varies: 8 }[profile.focus[0] ?? "45"] ?? 10;
  const strugglePenalty = clamp(profile.struggles.length * 4, 0, 25);
  const base = 42 + sleepBonus + recoveryBonus + focusBonus - workloadPenalty - strugglePenalty;
  return clamp(Math.round(base), 28, 82);
}

function deriveRiskFactors(profile: Profile): string[] {
  const risks: string[] = [];
  if (profile.sleep[0] === "collapsed") risks.push("Sleep debt accumulation");
  if (profile.sleep[0] === "short") risks.push("Running lean on recovery");
  if (profile.struggles.includes("burnout")) risks.push("Burnout vulnerability");
  if (profile.struggles.includes("inconsistency")) risks.push("Momentum loss cycles");
  if (profile.struggles.includes("distraction")) risks.push("Attention fragmentation");
  if (profile.workload[0] === "heavy") risks.push("Overload ceiling risk");
  if (profile.recovery[0] === "spiral") risks.push("Reset spiral pattern");
  return risks.slice(0, 4);
}

function deriveSystemSetup(profile: Profile) {
  const hasBurnout = profile.struggles.includes("burnout");
  const hasPerfectionism = profile.struggles.includes("perfectionism");
  const hasDistraction = profile.struggles.includes("distraction");
  const hasInconsistency = profile.struggles.includes("inconsistency");
  const hasSpiral = profile.recovery[0] === "spiral";

  const focusDuration =
    { "15": 20, "45": 50, "90": 90, varies: 45 }[profile.focus[0] ?? "45"] ?? 50;
  const maxTasks = profile.workload[0] === "heavy" ? 4 : profile.workload[0] === "light" ? 2 : 3;

  return {
    focusSystem: hasPerfectionism
      ? `Timed execution blocks (${focusDuration}min) — shipping over perfecting`
      : `Adaptive focus blocks (${focusDuration}min) calibrated to your energy window`,
    recovery:
      hasBurnout || hasSpiral
        ? "Mandatory recovery days built in — no streak pressure"
        : "Dynamic recovery triggers after low-execution signals",
    workload: `Max ${maxTasks} real tasks/day — protected against overloading`,
    mvd:
      hasInconsistency || hasSpiral
        ? "Minimum Viable Day protocol — 1 anchor task on hard days"
        : "Minimum Viable Day protocol ready when signals drop",
    distraction: hasDistraction
      ? "Distraction log + wind-down protocol at 8:30 PM"
      : "Distraction monitoring with weekly pattern reports",
    guardrail: hasBurnout
      ? "Anti-burnout guardrail: system reduces load before you crash"
      : "Resilience scoring — bounce-back speed over streak length",
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Profile = {
  goals: string[];
  struggles: string[];
  energyPeak: string[];
  sleep: string[];
  focus: string[];
  workload: string[];
  recovery: string[];
};

// ─── Main Component ───────────────────────────────────────────────────────────

function Onboarding() {
  const nav = useNavigate();
  const setOnboardingProfile = useApp((s) => s.setOnboardingProfile);

  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<Profile>({
    goals: [],
    struggles: [],
    energyPeak: [],
    sleep: [],
    focus: [],
    workload: [],
    recovery: [],
  });

  const TOTAL_STEPS = 6;

  function advance() {
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setAnimating(false);
      containerRef.current?.scrollTo({ top: 0, behavior: "instant" });
    }, 220);
  }

  function back() {
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setAnimating(false);
    }, 220);
  }

  function finish() {
    const fullProfile: OnboardingProfile = {
      ...profile,
      baselineScore: deriveBaselineScore(profile),
    };
    setOnboardingProfile(fullProfile);
    nav({ to: "/" });
  }

  const warning =
    step === 3
      ? deriveWorkloadWarning(profile.goals.length, profile.workload[0] ?? "", profile.struggles)
      : null;

  const baselineScore = step >= 4 ? deriveBaselineScore(profile) : 0;
  const risks = step >= 4 ? deriveRiskFactors(profile) : [];
  const setup = step >= 5 ? deriveSystemSetup(profile) : null;

  const canNext =
    [
      profile.goals.length >= 1,
      profile.struggles.length >= 1,
      profile.energyPeak.length >= 1 && profile.sleep.length >= 1 && profile.focus.length >= 1,
      profile.workload.length >= 1 && profile.recovery.length >= 1,
      true,
      true,
    ][step] ?? false;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-accent/6 blur-[120px]" />
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 inset-x-0 z-20 h-[2px] bg-secondary">
        <div
          className="h-full bg-gradient-accent transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* Step dots + label */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 pb-3 pt-6 lg:px-10">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === step
                  ? "h-[6px] w-6 bg-accent"
                  : i < step
                    ? "h-[6px] w-[6px] bg-accent/40"
                    : "h-[6px] w-[6px] bg-secondary"
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {step + 1} / {TOTAL_STEPS}
        </span>
      </div>

      {/* Content area */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-y-auto px-5 pb-36 pt-2 lg:px-10 lg:pt-4 transition-opacity duration-200 ${
          animating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
        style={{ transition: "opacity 0.22s ease, transform 0.22s ease" }}
      >
        {step === 0 && (
          <Step1Identity
            profile={profile}
            onChange={(goals) => setProfile((p) => ({ ...p, goals }))}
          />
        )}
        {step === 1 && (
          <Step2Struggles
            profile={profile}
            onChange={(struggles) => setProfile((p) => ({ ...p, struggles }))}
          />
        )}
        {step === 2 && (
          <Step3ExecutionProfile
            profile={profile}
            onChange={(partial) => setProfile((p) => ({ ...p, ...partial }))}
          />
        )}
        {step === 3 && (
          <Step4Calibration
            profile={profile}
            warning={warning}
            onChange={(partial) => setProfile((p) => ({ ...p, ...partial }))}
          />
        )}
        {step === 4 && (
          <Step5Baseline profile={profile} baselineScore={baselineScore} risks={risks} />
        )}
        {step === 5 && (
          <Step6Activation profile={profile} setup={setup!} baselineScore={baselineScore} />
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-20">
        <div className="pointer-events-none h-8 bg-gradient-to-t from-background to-transparent" />
        <div className="bg-background/85 px-5 pb-8 pt-3 backdrop-blur-xl lg:px-10">
          <div className="mx-auto flex max-w-[480px] items-center gap-3 lg:max-w-none">
            {step > 0 && (
              <button
                onClick={back}
                className="hairline rounded-full px-5 py-3 text-sm text-muted-foreground transition hover:text-foreground"
              >
                Back
              </button>
            )}
            <button
              disabled={!canNext}
              onClick={step === TOTAL_STEPS - 1 ? finish : advance}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-semibold text-background transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
            >
              {step === TOTAL_STEPS - 1 ? "Activate my system" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Identity & Ambition ─────────────────────────────────────────────

function Step1Identity({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (goals: string[]) => void;
}) {
  return (
    <div>
      <Eyebrow>Identity & Ambition</Eyebrow>
      <Headline>What are you building toward?</Headline>
      <Sub>Pick what matters this season. Multi-select — be honest.</Sub>

      <div className="mt-8 grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-3">
        {GOALS.map((g) => {
          const Icon = g.icon;
          const on = profile.goals.includes(g.id);
          return (
            <SelectCard
              key={g.id}
              on={on}
              onClick={() => onChange(toggle(profile.goals, g.id))}
              icon={<Icon className="h-5 w-5" strokeWidth={1.5} />}
              label={g.label}
              desc={g.desc}
            />
          );
        })}
      </div>

      {profile.goals.length >= 5 && (
        <ObservationBanner tone="warning">
          <Brain className="h-4 w-4 flex-none" />
          <span>Ambitious. We&apos;ll build guardrails to prevent overload collapse.</span>
        </ObservationBanner>
      )}
    </div>
  );
}

// ─── Step 2: Behavioral Struggles ────────────────────────────────────────────

function Step2Struggles({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (struggles: string[]) => void;
}) {
  return (
    <div>
      <Eyebrow>Behavioral Struggles</Eyebrow>
      <Headline>Where do you tend to break?</Headline>
      <Sub>Be precise. This is how we catch you before the crash — not after.</Sub>

      <div className="mt-8 grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-2.5">
        {STRUGGLES.map((s) => {
          const Icon = s.icon;
          const on = profile.struggles.includes(s.id);
          return (
            <SelectCard
              key={s.id}
              on={on}
              onClick={() => onChange(toggle(profile.struggles, s.id))}
              icon={<Icon className="h-5 w-5" strokeWidth={1.5} />}
              label={s.label}
              desc={s.desc}
              wide
            />
          );
        })}
      </div>

      {profile.struggles.length >= 3 && (
        <ObservationBanner tone="accent">
          <Brain className="h-4 w-4 flex-none" />
          <span>
            Pattern cluster detected:{" "}
            {profile.struggles.includes("burnout") && profile.struggles.includes("perfectionism")
              ? "high-drive burnout profile."
              : profile.struggles.includes("inconsistency") &&
                  profile.struggles.includes("motivation")
                ? "motivation-crash loop."
                : "multi-vector instability."}{" "}
            System will prioritize recovery architecture.
          </span>
        </ObservationBanner>
      )}
    </div>
  );
}

// ─── Step 3: Execution Profile ────────────────────────────────────────────────

function Step3ExecutionProfile({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (partial: Partial<Profile>) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <Eyebrow>Execution Profile</Eyebrow>
        <Headline>How does your mind actually operate?</Headline>
        <Sub>Not how you wish it did — how it actually does.</Sub>
      </div>

      <ProfileSection label="When is your energy highest?">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {ENERGY_PEAKS.map((e) => {
            const Icon = e.icon;
            const on = profile.energyPeak.includes(e.id);
            return (
              <SelectCard
                key={e.id}
                on={on}
                onClick={() => onChange({ energyPeak: pickOne(profile.energyPeak, e.id) })}
                icon={<Icon className="h-4 w-4" strokeWidth={1.5} />}
                label={e.label}
                desc={e.desc}
              />
            );
          })}
        </div>
      </ProfileSection>

      <ProfileSection label="How is your sleep?">
        <div className="grid grid-cols-2 gap-2">
          {SLEEP_PATTERNS.map((s) => {
            const on = profile.sleep.includes(s.id);
            return (
              <SelectCard
                key={s.id}
                on={on}
                onClick={() => onChange({ sleep: pickOne(profile.sleep, s.id) })}
                label={s.label}
                desc={s.desc}
              />
            );
          })}
        </div>
      </ProfileSection>

      <ProfileSection label="How long can you sustain focus?">
        <div className="grid grid-cols-2 gap-2">
          {FOCUS_DURATIONS.map((f) => {
            const on = profile.focus.includes(f.id);
            return (
              <SelectCard
                key={f.id}
                on={on}
                onClick={() => onChange({ focus: pickOne(profile.focus, f.id) })}
                label={f.label}
                desc={f.desc}
              />
            );
          })}
        </div>
      </ProfileSection>

      {profile.energyPeak.length > 0 && profile.sleep.length > 0 && profile.focus.length > 0 && (
        <ObservationBanner tone="accent">
          <Brain className="h-4 w-4 flex-none" />
          <span>
            {profile.energyPeak[0] === "night" && profile.sleep[0] === "short"
              ? "Night-owl with short sleep — high burnout risk. Recovery buffer added."
              : profile.focus[0] === "90" && profile.sleep[0] === "solid"
                ? "Deep focus + solid sleep. Strong execution profile. Stretching recommended."
                : profile.focus[0] === "15"
                  ? "Short focus windows detected. System will use micro-blocks and high-frequency check-ins."
                  : "Profile calibrated. Adaptive schedule generating."}
          </span>
        </ObservationBanner>
      )}
    </div>
  );
}

// ─── Step 4: Reality Calibration ─────────────────────────────────────────────

function Step4Calibration({
  profile,
  warning,
  onChange,
}: {
  profile: Profile;
  warning: ReturnType<typeof deriveWorkloadWarning>;
  onChange: (partial: Partial<Profile>) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <Eyebrow>Reality Calibration</Eyebrow>
        <Headline>What does your actual execution look like?</Headline>
        <Sub>Be honest. The system works better with accuracy than aspiration.</Sub>
      </div>

      <ProfileSection label="Daily workload tolerance">
        <div className="grid grid-cols-2 gap-2">
          {WORKLOADS.map((w) => {
            const on = profile.workload.includes(w.id);
            return (
              <SelectCard
                key={w.id}
                on={on}
                onClick={() => onChange({ workload: pickOne(profile.workload, w.id) })}
                label={w.label}
                desc={w.desc}
              />
            );
          })}
        </div>
      </ProfileSection>

      <ProfileSection label="How fast do you recover after a bad day?">
        <div className="grid grid-cols-2 gap-2">
          {RECOVERY_SPEEDS.map((r) => {
            const on = profile.recovery.includes(r.id);
            return (
              <SelectCard
                key={r.id}
                on={on}
                onClick={() => onChange({ recovery: pickOne(profile.recovery, r.id) })}
                label={r.label}
                desc={r.desc}
              />
            );
          })}
        </div>
      </ProfileSection>

      {warning && (
        <div
          className={`rounded-2xl border p-4 ${
            warning.level === "high"
              ? "border-danger/30 bg-danger/8"
              : warning.level === "elevated"
                ? "border-warning/30 bg-warning/8"
                : "border-accent/30 bg-accent/8"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`h-4 w-4 flex-none mt-0.5 ${
                warning.level === "high"
                  ? "text-danger"
                  : warning.level === "elevated"
                    ? "text-warning"
                    : "text-accent"
              }`}
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{warning.headline}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{warning.body}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Momentum Baseline ────────────────────────────────────────────────

function Step5Baseline({
  profile,
  baselineScore,
  risks,
}: {
  profile: Profile;
  baselineScore: number;
  risks: string[];
}) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 1200;
    const raf = requestAnimationFrame(function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * baselineScore));
      if (progress < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [baselineScore]);

  const scoreColor =
    baselineScore >= 65 ? "text-success" : baselineScore >= 45 ? "text-accent" : "text-warning";

  const focusLabel =
    { "15": "Short blocks", "45": "Standard blocks", "90": "Deep flow", varies: "Variable" }[
      profile.focus[0] ?? "45"
    ] ?? "Standard";
  const sleepLabel =
    { solid: "Optimal", variable: "Variable", short: "Running lean", collapsed: "Needs work" }[
      profile.sleep[0] ?? "variable"
    ] ?? "Variable";
  const recoveryLabel =
    { fast: "High", medium: "Moderate", slow: "Low", spiral: "Critical" }[
      profile.recovery[0] ?? "medium"
    ] ?? "Moderate";

  return (
    <div>
      <Eyebrow>Momentum Baseline</Eyebrow>
      <Headline>Your behavioral starting point.</Headline>
      <Sub>This is where you actually are — not where you want to be. The gap is the work.</Sub>

      {/* Score hero */}
      <div className="mt-8 mb-6 flex flex-col items-center gap-1">
        <div className="relative flex h-44 w-44 items-center justify-center">
          <ScoreRing value={baselineScore} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-display text-5xl leading-none ${scoreColor}`}>{displayed}</span>
            <span className="mt-1 text-[11px] text-muted-foreground uppercase tracking-widest">
              Starting score
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground text-center max-w-[30ch]">
          {baselineScore >= 65
            ? "Strong baseline. You have execution capacity — focus is the lever."
            : baselineScore >= 45
              ? "Moderate baseline. Consistency will compound fast from here."
              : "Low baseline. Rebuilding from first principles. Recovery is the first priority."}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <MetricCard label="Focus style" value={focusLabel} />
        <MetricCard label="Sleep quality" value={sleepLabel} />
        <MetricCard label="Resilience" value={recoveryLabel} />
      </div>

      {/* Risk factors */}
      {risks.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Behavioral risk factors
          </p>
          <div className="space-y-2">
            {risks.map((r, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-warning flex-none" />
                <span className="text-sm text-foreground">{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 6: System Activation ────────────────────────────────────────────────

function Step6Activation({
  profile,
  setup,
  baselineScore,
}: {
  profile: Profile;
  setup: ReturnType<typeof deriveSystemSetup>;
  baselineScore: number;
}) {
  const topGoal = GOALS.find((g) => g.id === profile.goals[0]);
  const TopIcon = topGoal?.icon ?? Target;

  const systemItems = [
    { label: "Focus system", value: setup.focusSystem, icon: Crosshair },
    { label: "Recovery", value: setup.recovery, icon: Wind },
    { label: "Daily workload", value: setup.workload, icon: Layers },
    { label: "Minimum viable day", value: setup.mvd, icon: BedDouble },
    { label: "Distraction protocol", value: setup.distraction, icon: Zap },
    { label: "Anti-burnout guardrail", value: setup.guardrail, icon: Shield },
  ] as const;

  return (
    <div>
      <Eyebrow>System Activation</Eyebrow>
      <Headline>Your behavioral OS is ready.</Headline>
      <Sub>Personalized from your profile. Adaptive from day one.</Sub>

      {/* Identity header */}
      <div className="mt-8 mb-6 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 to-transparent p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
            <TopIcon className="h-5 w-5 text-accent" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {profile.goals.length} area{profile.goals.length !== 1 ? "s" : ""} tracked
            </p>
            <p className="text-xs text-muted-foreground">
              {profile.struggles.length} pattern{profile.struggles.length !== 1 ? "s" : ""}{" "}
              monitored
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-display text-3xl text-foreground">{baselineScore}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">baseline</p>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-gradient-accent rounded-full"
            style={{ width: `${baselineScore}%` }}
          />
        </div>
      </div>

      {/* System setup items */}
      <div className="space-y-2.5">
        {systemItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-secondary">
                <Icon className="h-4 w-4 text-accent" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm text-foreground leading-snug">{item.value}</p>
              </div>
              <Check className="h-4 w-4 flex-none text-success mt-0.5" strokeWidth={2.5} />
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed max-w-[38ch] mx-auto">
        The system adapts as you log. First insights appear after 3 check-ins.
      </p>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          to="/sign-in"
          search={{ mode: "upgrade", redirect: "/" }}
          className="text-accent hover:underline font-medium"
        >
          Sign in to sync your data
        </Link>
      </p>
    </div>
  );
}

// ─── UI Primitives ────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-display mt-2 text-[30px] leading-tight text-foreground lg:text-[36px] text-balance">
      {children}
    </h1>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">{children}</p>
  );
}

function ProfileSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-foreground">{label}</p>
      {children}
    </div>
  );
}

function SelectCard({
  on,
  onClick,
  icon,
  label,
  desc,
  wide = false,
}: {
  on: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  desc: string;
  wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full flex-col rounded-2xl border p-3.5 text-left transition-all duration-200 ${
        on
          ? "border-accent/50 bg-accent/10 shadow-[0_0_0_1px_oklch(0.78_0.14_75/0.3)]"
          : "border-border bg-card hover:border-foreground/15 hover:bg-secondary/50"
      } ${wide ? "" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {icon && (
            <span
              className={`${on ? "text-accent" : "text-muted-foreground group-hover:text-foreground"} transition-colors`}
            >
              {icon}
            </span>
          )}
          <p className="text-sm font-medium text-foreground leading-snug">{label}</p>
        </div>
        <span
          className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border transition-all ${
            on ? "border-accent bg-accent" : "border-border"
          }`}
        >
          {on && <Check className="h-2.5 w-2.5 text-accent-foreground" strokeWidth={3} />}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{desc}</p>
    </button>
  );
}

function ObservationBanner({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "accent" | "warning" | "success";
}) {
  const colors = {
    accent: "border-accent/25 bg-accent/8 text-accent",
    warning: "border-warning/25 bg-warning/8 text-warning",
    success: "border-success/25 bg-success/8 text-success",
  };
  return (
    <div className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${colors[tone]}`}>
      <div className="flex items-start gap-2.5 text-xs leading-relaxed">{children}</div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const size = 176;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  const [dash, setDash] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 1200;
    const raf = requestAnimationFrame(function tick() {
      const progress = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDash(eased * filled);
      if (progress < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [filled]);

  const scoreColor =
    value >= 65
      ? "oklch(0.78 0.14 155)"
      : value >= 45
        ? "oklch(0.78 0.14 75)"
        : "oklch(0.82 0.14 60)";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="oklch(0.24 0.008 270)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={scoreColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
      />
    </svg>
  );
}
