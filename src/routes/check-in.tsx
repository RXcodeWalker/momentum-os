import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pill, ScreenHeader } from "@/components/ui-bits";
import { useApp, useLatestInsight, useUserState, type CheckIn } from "@/lib/store";
import { CHECK_IN_TITLES, CHECK_IN_SUBTITLES } from "@/lib/constants";
import { toast } from "sonner";
import { CheckInForm } from "@/components/check-in/CheckInForm";
import { CheckInWizard } from "@/components/check-in/CheckInWizard";
import { EveningResultScreen } from "@/components/evening/EveningResultScreen";

export const Route = createFileRoute("/check-in")({
  head: () => ({
    meta: [
      { title: "Check-in — Cadence" },
      { name: "description", content: "Reflect efficiently. We use this to keep you honest." },
    ],
  }),
  component: CheckInPage,
});

function CheckInPage() {
  const tasks = useApp((s) => s.tasks);
  const toggleTask = useApp((s) => s.toggleTask);
  const rescheduleTask = useApp((s) => s.rescheduleTask);
  const saveCheckIn = useApp((s) => s.saveCheckIn);
  const unlockInsight = useApp((s) => s.unlockInsight);
  const recoveryMode = useApp((s) => s.recoveryMode);
  const checkInStyle = useApp((s) => s.checkInStyle);
  const insights = useApp((s) => s.insights);
  const checkIns = useApp((s) => s.checkIns);
  const profile = useApp((s) => s.profile);
  const { state } = useUserState();
  useLatestInsight(); // keep insight system warm

  const isFirstCheckIn = checkIns.length === 0;
  const firstBaselineScore = profile?.baselineScore ?? null;

  const [unlockedInsight, setUnlockedInsight] = useState<string | undefined>();
  const [saveResult, setSaveResult] = useState<{ newScore: number; delta: number } | null>(null);

  const handleSave = (data: Omit<CheckIn, "date">) => {
    const r = saveCheckIn(data);

    // Variable insight reward
    let insight: string | undefined;
    if (r.newScore >= 70 && data.focus >= 7 && data.sleepHours >= 7) {
      unlockInsight("i6");
      insight = insights.find((i) => i.id === "i6")?.title;
    } else if (r.newScore >= 55 && data.distractions.length <= 1) {
      unlockInsight("i5");
      insight = insights.find((i) => i.id === "i5")?.title;
    }

    setUnlockedInsight(insight);
    setSaveResult(r);
    toast.success("Check-in complete", { description: "Your behavioral signal has been logged." });
  };

  if (saveResult) {
    return (
      <EveningResultScreen
        unlockedInsight={unlockedInsight}
        isFirstCheckIn={isFirstCheckIn}
        firstBaselineScore={firstBaselineScore}
        newScore={saveResult.newScore}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <ScreenHeader
        eyebrow={`Evening · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        title={
          state === "burnout"
            ? CHECK_IN_TITLES.burnout
            : state === "recovery"
              ? CHECK_IN_TITLES.recovery
              : CHECK_IN_TITLES.default
        }
        subtitle={state === "burnout" ? CHECK_IN_SUBTITLES.burnout : CHECK_IN_SUBTITLES.default}
        right={recoveryMode ? <Pill tone="warning">Recovery</Pill> : undefined}
      />

      {checkInStyle === "wizard" ? (
        <CheckInWizard
          tasks={tasks}
          state={state}
          onSave={handleSave}
          toggleTask={toggleTask}
          rescheduleTask={rescheduleTask}
        />
      ) : (
        <CheckInForm
          tasks={tasks}
          state={state}
          recoveryMode={recoveryMode}
          onSave={handleSave}
          toggleTask={toggleTask}
          rescheduleTask={rescheduleTask}
        />
      )}
    </div>
  );
}
