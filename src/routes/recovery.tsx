import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, Pill, Ring, ScreenHeader, Sparkline, StatLabel } from "@/components/ui-bits";
import {
  ArrowLeft,
  ArrowRight,
  Battery,
  Brain,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Leaf,
  Lightbulb,
  Moon,
  Rocket,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  useApp,
  useExecutionScore,
  useMomentum,
  useResilience,
  useUserState,
  useRootCauseAnalysis,
  useDeepWorkStats,
  usePersonalizedRecoveryMatch,
  useWeeklyBriefing,
} from "@/lib/store";
import {
  mvdProtocols,
  protocolRoadmaps,
  reinforcements,
  type ProtocolKey,
} from "@/lib/recovery-data";

export const Route = createFileRoute("/recovery")({
  head: () => ({
    meta: [
      { title: "Recovery — Cadence" },
      {
        name: "description",
        content: "Tactical recovery system for rebuilding momentum. No streaks. No shame.",
      },
    ],
  }),
  component: Recovery,
});

function Recovery() {
  const nav = useNavigate();
  const recoveryMode = useApp((s) => s.recoveryMode);
  const recoveryReason = useApp((s) => s.recoveryReason) as ProtocolKey | undefined;
  const enterRecovery = useApp((s) => s.enterRecovery);
  const exitRecovery = useApp((s) => s.exitRecovery);
  const setRecoveryPlan = useApp((s) => s.setRecoveryPlan);
  const acceptMVD = useApp((s) => s.acceptMinimumViableDay);
  const addProof = useApp((s) => s.addProof);
  const history = useApp((s) => s.history);

  const score = useExecutionScore();
  const { trend } = useMomentum();
  const { state } = useUserState();
  const { score: resilience, avgRecoveryDays } = useResilience();
  const analysis = useRootCauseAnalysis();
  const deepWorkStats = useDeepWorkStats();
  const protocolMatch = usePersonalizedRecoveryMatch();
  const weeklyBriefing = useWeeklyBriefing();

  const rootCauses = useMemo(
    () => [
      {
        id: "workload",
        icon: Target,
        label: "Unrealistic workload",
        observation: analysis.workload.observation,
        impact: "Leads to chronic incompletion and guilt cycles",
        detected: analysis.workload.detected,
      },
      {
        id: "sleep",
        icon: Moon,
        label: "Sleep inconsistency",
        observation: analysis.sleep.observation,
        impact: `${deepWorkStats.sleepImpact}% execution drop on low-sleep days`,
        detected: analysis.sleep.detected,
      },
      {
        id: "distraction",
        icon: Smartphone,
        label: "Distraction overload",
        observation: analysis.distraction.observation,
        impact: "Context switching fragments focus capacity",
        detected: analysis.distraction.detected,
      },
      {
        id: "overplanning",
        icon: Calendar,
        label: "Overplanning",
        observation: analysis.overplanning.observation,
        impact: "Planning becomes avoidance behavior",
        detected: analysis.overplanning.detected,
      },
      {
        id: "recovery",
        icon: Battery,
        label: "Lack of recovery",
        observation: analysis.recovery.observation,
        impact: "Energy debt compounds daily",
        detected: analysis.recovery.detected,
      },
    ],
    [analysis, deepWorkStats],
  );

  // Step management
  const [step, setStep] = useState(recoveryMode ? 2 : 0);
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolKey>(
    (recoveryReason as ProtocolKey | undefined) ?? protocolMatch.recommendedProtocol,
  );
  const [sharedToCircle, setSharedToCircle] = useState(false);

  // Computed data
  const last7 = history.slice(-7);
  const last14 = history.slice(-14);
  const weekDrop = useMemo(() => {
    const recent = last7.reduce((a, d) => a + d.executionScore, 0) / Math.max(1, last7.length);
    const prev = last14.slice(0, 7).reduce((a, d) => a + d.executionScore, 0) / 7;
    const drop = Math.round(prev - recent);
    return Math.max(0, drop);
  }, [last7, last14]);

  const trendData = history.slice(-14).map((d) => d.executionScore);
  const estimatedRecovery = Math.max(2, Math.min(7, Math.ceil(weekDrop / 12) + 1));

  // Step navigation
  const nextStep = () => setStep((s) => Math.min(4, s + 1));
  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  const roadmap = protocolRoadmaps[selectedProtocol];

  const handleAcceptPlan = () => {
    if (!recoveryMode) enterRecovery(selectedProtocol);

    // Set protocol-specific tasks
    acceptMVD(mvdProtocols[selectedProtocol].tasks);

    // Set recovery plan in store
    setRecoveryPlan({
      protocol: selectedProtocol,
      tasks: mvdProtocols[selectedProtocol].tasks,
      timeline: roadmap.next3d,
      startedAt: new Date().toISOString(),
    });

    nextStep();
  };

  const handleShareToCircle = () => {
    addProof({
      memberId: "u1",
      text: `Initiated ${mvdProtocols[selectedProtocol].label.toLowerCase()} protocol. Focus: ${roadmap.next3d[0].focus.toLowerCase()}.`,
      type: "recovery",
    });
    setSharedToCircle(true);
  };

  const handleComplete = () => {
    nav({ to: "/" });
  };

  // Step indicator
  const steps = ["Detected", "Root cause", "Minimum viable day", "Recovery plan", "Reinforcement"];

  return (
    <div className="flex flex-col gap-5 pb-12">
      {/* Header */}
      <ScreenHeader
        eyebrow={recoveryMode ? "Recovery protocol · active" : "Recovery system"}
        title={
          step === 0
            ? "Momentum drop detected"
            : step === 1
              ? "Understanding the pattern"
              : step === 2
                ? "Minimum viable day"
                : step === 3
                  ? "Recovery roadmap"
                  : "You're rebuilding"
        }
        subtitle={
          step === 0
            ? "Let's understand what happened and create a tactical recovery plan."
            : undefined
        }
        right={recoveryMode ? <Pill tone="warning">Active</Pill> : undefined}
      />

      {/* Weekly commitment note */}
      {weeklyBriefing.active && weeklyBriefing.northStar && (
        <section className="px-5">
          <div className="rounded-2xl bg-accent/8 border border-accent/20 px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-accent/60 mb-1">
              Your commitment stands
            </p>
            <p className="text-sm text-foreground font-medium leading-snug">{weeklyBriefing.northStar}</p>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Entering recovery doesn't reset your intentions — it adjusts how you execute them.
            </p>
          </div>
        </section>
      )}

      {/* Step indicator */}
      <section className="px-5">
        <div className="flex items-center justify-between gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                  i < step ? "bg-success" : i === step ? "bg-gradient-accent" : "bg-secondary"
                }`}
              />
              <span
                className={`hidden lg:block text-[10px] ${i <= step ? "text-foreground" : "text-muted-foreground"}`}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Step 0: Detected State */}
      {step === 0 && (
        <section className="px-5 space-y-4 animate-fade-up">
          {/* Main alert card */}
          <Card className="bg-gradient-to-br from-warning/5 to-transparent border-warning/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-5 w-5 text-warning" />
                  <StatLabel>Execution decline detected</StatLabel>
                </div>
                <p className="font-display text-4xl lg:text-5xl text-foreground">
                  -{weekDrop}%
                  <span className="text-muted-foreground text-2xl lg:text-3xl"> this week</span>
                </p>
                <p className="mt-3 text-sm text-muted-foreground max-w-[50ch]">
                  {state === "burnout"
                    ? "Multiple signals point to burnout. This isn't failure — it's data. Let's reduce surface area."
                    : state === "recovery"
                      ? "You're already in recovery mode. Let's refine the approach."
                      : weekDrop > 25
                        ? "Significant momentum loss detected. This calls for a tactical reset, not harder pushing."
                        : "Early warning signs present. Catching this now prevents a deeper dip."}
                </p>
              </div>
              <div className="mt-6 lg:mt-0">
                <Ring value={score} size={140} stroke={12} label="Current" />
              </div>
            </div>
          </Card>

          {/* Trend visualization */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <StatLabel>14-day execution trend</StatLabel>
              <Pill tone={trend === "down" ? "danger" : trend === "up" ? "success" : "neutral"}>
                {trend === "down" ? "Declining" : trend === "up" ? "Recovering" : "Fluctuating"}
              </Pill>
            </div>
            <div className="h-[120px]">
              <Sparkline data={trendData} height={120} />
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
              <span>2 weeks ago</span>
              <span>1 week ago</span>
              <span>Today</span>
            </div>
          </Card>

          {/* Warning signals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <SignalCard
              icon={Moon}
              label="Sleep debt"
              value={`${(last7.reduce((a, d) => a + d.sleepHours, 0) / 7).toFixed(1)}h`}
              sub="avg last 7 days"
              tone={last7.reduce((a, d) => a + d.sleepHours, 0) / 7 < 6.5 ? "danger" : "neutral"}
            />
            <SignalCard
              icon={Smartphone}
              label="Distraction load"
              value={`${Math.round(last7.reduce((a, d) => a + d.distractions, 0) / 7)}`}
              sub="avg daily interruptions"
              tone={last7.reduce((a, d) => a + d.distractions, 0) / 7 > 4 ? "warning" : "neutral"}
            />
            <SignalCard
              icon={Target}
              label="Completion rate"
              value={`${Math.round(
                (last7.reduce((a, d) => a + d.completed, 0) /
                  Math.max(
                    1,
                    last7.reduce((a, d) => a + d.planned, 0),
                  )) *
                  100,
              )}%`}
              sub="planned vs done"
              tone={
                last7.reduce((a, d) => a + d.completed, 0) /
                  Math.max(
                    1,
                    last7.reduce((a, d) => a + d.planned, 0),
                  ) <
                0.6
                  ? "warning"
                  : "neutral"
              }
            />
          </div>

          {/* CTA */}
          <button
            onClick={nextStep}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
          >
            Analyze root causes <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      )}

      {/* Step 1: Root Cause Analysis */}
      {step === 1 && (
        <section className="px-5 space-y-4 animate-fade-up">
          <Card className="bg-gradient-surface">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Select patterns you recognize</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The system has detected potential causes. Select the ones that resonate most.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {rootCauses.map((cause) => {
              const Icon = cause.icon;
              const selected = selectedCauses.includes(cause.id);
              return (
                <button
                  key={cause.id}
                  onClick={() =>
                    setSelectedCauses((prev) =>
                      selected ? prev.filter((c) => c !== cause.id) : [...prev, cause.id],
                    )
                  }
                  className={`text-left rounded-2xl p-4 transition-all duration-300 ${
                    selected
                      ? "bg-accent/10 border border-accent/30"
                      : "hairline bg-card hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl transition-colors ${
                        selected ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{cause.label}</p>
                          {cause.detected && (
                            <Pill tone="warning" className="text-[8px] h-3 px-1 py-0 uppercase">
                              Detected
                            </Pill>
                          )}
                        </div>
                        {selected && <Check className="h-4 w-4 text-accent" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{cause.observation}</p>
                      <p className="mt-2 text-[11px] text-warning/80">{cause.impact}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* AI observation */}
          {selectedCauses.length > 0 && (
            <Card className="bg-secondary/30">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-4 w-4 text-accent mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground">Pattern analysis</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedCauses.length === 1
                      ? "Single-cause dips recover fastest. Focus all energy here."
                      : selectedCauses.length === 2
                        ? "Two interconnected causes. Addressing the sleep/recovery axis often resolves both."
                        : "Multiple causes compound quickly. Prioritize sleep and reduce surface area first."}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={prevStep}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl hairline bg-card py-4 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={nextStep}
              disabled={selectedCauses.length === 0}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background disabled:opacity-50"
            >
              Generate recovery plan <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* Step 2: Minimum Viable Day */}
      {step === 2 && (
        <section className="px-5 space-y-4 animate-fade-up">
          {/* Protocol selector */}
          {protocolMatch.confidence !== "low" && (
            <div className="flex items-start gap-2 rounded-xl bg-accent/5 border border-accent/15 px-3 py-2.5">
              <Sparkles className="h-4 w-4 text-accent flex-none mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
                  Personalized recommendation
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{protocolMatch.reasoning}</p>
              </div>
            </div>
          )}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {(Object.keys(mvdProtocols) as ProtocolKey[]).map((k) => {
              const isRecommended =
                k === protocolMatch.recommendedProtocol && protocolMatch.confidence !== "low";
              return (
                <button
                  key={k}
                  onClick={() => setSelectedProtocol(k)}
                  className={`flex-none rounded-full px-3.5 py-2 text-[11px] font-medium transition relative ${
                    selectedProtocol === k
                      ? "bg-foreground text-background"
                      : "hairline bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mvdProtocols[k].label}
                  {isRecommended && selectedProtocol !== k && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent border-2 border-background" />
                  )}
                </button>
              );
            })}
          </div>

          {/* MVD Card */}
          <Card className="relative overflow-hidden bg-gradient-surface">
            <div className="bg-glow absolute inset-0" />
            <div className="relative">
              <Pill tone="success">
                <Leaf className="h-3 w-3" /> Minimum viable day
              </Pill>
              <p className="font-display mt-4 text-2xl lg:text-3xl leading-snug text-foreground">
                Three things. Nothing else.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                This isn't about doing less forever. It's about preserving momentum while you
                rebuild.
              </p>

              <div className="mt-6 space-y-3">
                {mvdProtocols[selectedProtocol].tasks.map((task, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-background/40 px-4 py-3.5 hairline"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent text-sm font-semibold">
                        {i + 1}
                      </div>
                      <span className="text-sm text-foreground">{task.t}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground num-tabular">
                      {task.est}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-success/5 border border-success/20">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Protected load</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ambitious goals and weekly targets are muted for 48h while you rebuild. You
                      can override anytime.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={prevStep}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl hairline bg-card py-4 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={handleAcceptPlan}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
            >
              Accept this day <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* Step 3: Recovery Plan */}
      {step === 3 && (
        <section className="px-5 space-y-4 animate-fade-up">
          {/* Recovery timeline estimate */}
          <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <div>
                <StatLabel>Estimated recovery</StatLabel>
                <p className="font-display mt-2 text-4xl text-foreground">
                  {estimatedRecovery}
                  <span className="text-muted-foreground text-xl"> days</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground max-w-[40ch]">
                  Based on your historical recovery speed and current signals. This adapts as you
                  progress.
                </p>
              </div>
              <div className="mt-4 lg:mt-0 flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Resilience
                  </p>
                  <p className="font-display text-2xl text-foreground">{resilience}</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Avg recovery
                  </p>
                  <p className="font-display text-2xl text-foreground">{avgRecoveryDays}d</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Next 24 hours */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-accent" />
              <StatLabel>Next 24 hours</StatLabel>
            </div>
            <div className="space-y-2">
              {roadmap.next24h.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground w-20">{item.time}</span>
                    <span className="text-sm text-foreground">{item.action}</span>
                  </div>
                  <Pill
                    tone={
                      item.priority === "critical"
                        ? "danger"
                        : item.priority === "high"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {item.priority}
                  </Pill>
                </div>
              ))}
            </div>
          </Card>

          {/* 3-day plan */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-accent" />
              <StatLabel>3-day stabilization</StatLabel>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {roadmap.next3d.map((day, i) => (
                <div key={i} className="rounded-xl bg-secondary/30 p-4">
                  <p className="text-[11px] font-medium text-accent uppercase tracking-wider">
                    {day.day}
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">{day.focus}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{day.metric}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Rebuilding phases */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-success" />
              <StatLabel>Momentum rebuilding</StatLabel>
            </div>
            <div className="space-y-3">
              {roadmap.rebuilding.map((phase, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div
                    className={`h-3 w-3 rounded-full ${i === 0 ? "bg-warning" : i === 1 ? "bg-accent" : "bg-success"}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{phase.phase}</p>
                      <span className="text-[11px] text-muted-foreground">{phase.duration}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{phase.goal}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress visualization */}
            <div className="mt-6">
              <RecoveryTimeline phases={roadmap.rebuilding} />
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground text-center">
              Progress updates as you check in daily
            </p>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={prevStep}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl hairline bg-card py-4 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={nextStep}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
            >
              Complete setup <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* Step 4: Identity Reinforcement */}
      {step === 4 && (
        <section className="px-5 space-y-4 animate-fade-up">
          {/* Main reinforcement */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-success/5 to-transparent border-success/20">
            <div className="bg-glow absolute inset-0 opacity-50" />
            <div className="relative text-center py-6 lg:py-10">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-success/15 mb-6">
                <Rocket className="h-8 w-8 text-success" />
              </div>
              <p className="font-display text-3xl lg:text-4xl text-foreground leading-tight max-w-[20ch] mx-auto">
                {reinforcements[0].message}
              </p>
              <p className="mt-4 text-sm text-muted-foreground max-w-[40ch] mx-auto">
                {reinforcements[0].sub}
              </p>
            </div>
          </Card>

          {/* Recovery stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <StatLabel>Recovery initiated</StatLabel>
              <p className="font-display mt-2 text-2xl text-foreground">
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Start of rebuild cycle</p>
            </Card>
            <Card>
              <StatLabel>Projected return</StatLabel>
              <p className="font-display mt-2 text-2xl text-foreground">
                {new Date(Date.now() + estimatedRecovery * 24 * 60 * 60 * 1000).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" },
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Based on your resilience</p>
            </Card>
          </div>

          {/* Circle Commitment */}
          <Card className="bg-gradient-surface border-accent/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Commit to your circle</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sharing your recovery protocol reduces accountability pressure and signals your
                    team to support you.
                  </p>
                </div>
              </div>
              <button
                onClick={handleShareToCircle}
                disabled={sharedToCircle}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  sharedToCircle ? "bg-success text-background" : "bg-accent text-accent-foreground"
                }`}
              >
                {sharedToCircle ? <Check className="h-3.5 w-3.5" /> : "Share"}
              </button>
            </div>
          </Card>

          {/* Additional reinforcements */}
          <div className="space-y-3">
            {reinforcements.slice(1).map((r, i) => (
              <Card key={i} className="bg-secondary/30">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-4 w-4 text-accent mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.sub}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Final insight */}
          <Card className="bg-gradient-surface">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Recovery is a skill</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Every protocol you complete teaches Cadence how you bounce back. The system learns
                  your recovery patterns and shortens future dips. This isn't about avoiding failure
                  — it's about building antifragility.
                </p>
              </div>
            </div>
          </Card>

          {/* Complete button */}
          <button
            onClick={handleComplete}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-success py-4 text-sm font-semibold text-background"
          >
            Begin recovery <ChevronRight className="h-4 w-4" />
          </button>

          {recoveryMode && (
            <button
              onClick={() => {
                exitRecovery();
                nav({ to: "/" });
              }}
              className="w-full rounded-2xl py-3 text-xs text-muted-foreground hover:text-foreground"
            >
              Exit recovery mode
            </button>
          )}
        </section>
      )}
    </div>
  );
}

// Signal card component
function SignalCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone: "neutral" | "warning" | "danger";
}) {
  return (
    <Card
      className={
        tone === "danger"
          ? "bg-danger/5 border-danger/20"
          : tone === "warning"
            ? "bg-warning/5 border-warning/20"
            : ""
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${
            tone === "danger"
              ? "bg-danger/15 text-danger"
              : tone === "warning"
                ? "bg-warning/15 text-warning"
                : "bg-secondary text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="font-display text-xl text-foreground mt-0.5">{value}</p>
          <p className="text-[11px] text-muted-foreground">{sub}</p>
        </div>
      </div>
    </Card>
  );
}

// Visual timeline component
function RecoveryTimeline({
  phases,
}: {
  phases: { phase: string; duration: string; goal: string }[];
}) {
  return (
    <div className="relative h-12 w-full flex items-center">
      {/* Background line */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-secondary -translate-y-1/2 rounded-full" />

      {/* Active progress line */}
      <div className="absolute top-1/2 left-0 w-1/6 h-1 bg-gradient-to-r from-warning to-accent -translate-y-1/2 rounded-full z-10" />

      {/* Nodes */}
      <div className="relative w-full flex justify-between px-1 z-20">
        {phases.map((p, i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              className={`h-4 w-4 rounded-full border-4 border-background ${
                i === 0
                  ? "bg-warning scale-110 shadow-lg shadow-warning/20"
                  : i === 1
                    ? "bg-accent"
                    : "bg-success"
              }`}
            />
            <span className="absolute -bottom-6 text-[9px] font-medium text-muted-foreground whitespace-nowrap uppercase tracking-tighter">
              {p.phase}
            </span>
          </div>
        ))}
        {/* End node */}
        <div className="flex flex-col items-center">
          <div className="h-4 w-4 rounded-full border-4 border-background bg-secondary" />
          <span className="absolute -bottom-6 text-[9px] font-medium text-muted-foreground whitespace-nowrap uppercase tracking-tighter">
            Steady
          </span>
        </div>
      </div>
    </div>
  );
}
