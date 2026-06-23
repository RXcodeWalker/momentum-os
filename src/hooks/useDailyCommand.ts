/**
 * useDailyCommand — Adaptive Daily Command Engine
 *
 * Single orchestration hook for the Today screen. Composes the behavioral
 * pipeline, unified intelligence layer, morning calibration, and focus
 * environment into a single scored output: one directive + ranked signal cards.
 *
 * index.tsx should consume ONLY this hook (plus store actions for mutations).
 */

import { useMemo } from "react";
import {
  useApp,
  useScoreVelocity,
  usePredictiveRecoveryAlert,
  useTomorrowBriefing,
  useBlockerPattern,
  useInsightEffectiveness,
} from "@/lib/store";
import { useBehavioralPipeline } from "@/hooks/useBehavioralPipeline";
import { useBehavioralIntelligence } from "@/lib/behavioral-intelligence";
import { useMorningCalibration } from "@/hooks/useMorningCalibration";
import { useFocusEnvironment } from "@/hooks/internal/useFocusEnvironment";
import {
  selectPrimaryDirective,
  scoreAndRankCards,
  resolveBudget,
  type PrimaryDirective,
  type ScoredCard,
  type CardKey,
} from "@/lib/today-priority";

export type DailyCommandOutput = {
  /** The single primary action directive for this moment */
  directive: PrimaryDirective;
  /** Scored cards, limited to `budget` items */
  cards: ScoredCard[];
  /** Max number of Tier-2 signal cards to show */
  budget: number;
  /** Active card keys (Set for O(1) lookup in JSX) */
  activeCards: Set<CardKey>;
  /** Phase for copy tuning and time-sensitive tie-breaks */
  phase: "morning" | "midday" | "evening";
  /** Voice tone from behavioral state */
  voice: string;
  /** Whether to show the briefing card (requires hasPlan + eligible) */
  showBriefing: boolean;
  /** Whether to show the yesterday card */
  showYesterday: boolean;
  /** Whether to show the avoidance note */
  showAvoidance: boolean;
  /** Whether to show the expansion note */
  showExpansion: boolean;
};

export function useDailyCommand(): DailyCommandOutput {
  // ── Data sources ─────────────────────────────────────────────────────────
  const behavioral = useBehavioralPipeline();
  const intelligence = useBehavioralIntelligence();
  const morningCal = useMorningCalibration();
  const focusEnv = useFocusEnvironment();

  const aiAlert = usePredictiveRecoveryAlert();
  const tomorrowBriefing = useTomorrowBriefing();
  const blockerPattern = useBlockerPattern();
  const insightEffectiveness = useInsightEffectiveness();
  const velocity = useScoreVelocity();

  const checkIns = useApp((s) => s.checkIns);
  const insights = useApp((s) => s.insights);

  // ── Phase ─────────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const phase: "morning" | "midday" | "evening" =
    hour < 11 ? "morning" : hour < 17 ? "midday" : "evening";

  // ── Derived ───────────────────────────────────────────────────────────────
  const todayDate = new Date().toISOString().slice(0, 10);
  const hasCheckedInToday = checkIns.some((c) => c.date === todayDate);
  const yesterdayCheckIn = checkIns.length >= 2 ? checkIns[checkIns.length - 2] : null;

  const committedInsightCard = insightEffectiveness.find(
    (e) => e.verdict === "working" || e.verdict === "too-early",
  );
  const hasCommittedInsight = !!(
    committedInsightCard && insights.find((i) => i.id === committedInsightCard.insightId)
  );

  const hasBlockerStreak = !!(blockerPattern.streak && blockerPattern.streak.days >= 3);
  const blockerStreakDays = blockerPattern.streak?.days ?? 0;

  // ── Build context (stable shape for pure functions) ───────────────────────
  return useMemo(() => {
    const ctx = {
      behavioral,
      intelligence,
      morningCal,
      focusEnv,
      phase,
      hasCheckedInToday,
      dismissedYesterday: false, // managed externally in index.tsx; passed in via override below
      yesterdayCheckIn,
      aiAlert,
      velocityDeclining: velocity.declining,
      velocityDropPts: velocity.dropPts,
      velocityDayCount: velocity.dayCount,
      hasCommittedInsight,
      hasBlockerStreak,
      blockerStreakDays,
    };

    const directive = selectPrimaryDirective(ctx);
    const ranked = scoreAndRankCards(ctx);

    const mode = behavioral.state.mode;
    const surfaceLevel = behavioral.shell.surfaceLevel;
    const budget = resolveBudget(surfaceLevel, mode);

    // Apply briefing eligibility gate (requires a plan to exist)
    const withBriefingGate = ranked.filter((c) => {
      if (c.key === "briefing")
        return tomorrowBriefing.hasPlan && !morningCal.isComplete && !focusEnv.active;
      return true;
    });

    const cards = withBriefingGate.slice(0, budget);
    const activeCards = new Set(cards.map((c) => c.key));

    return {
      directive,
      cards,
      budget,
      activeCards,
      phase,
      voice: behavioral.state.guidance.tone,
      showBriefing: activeCards.has("briefing"),
      showYesterday: activeCards.has("yesterday"),
      showAvoidance: activeCards.has("avoidance"),
      showExpansion: activeCards.has("expansion"),
    };
  }, [
    behavioral,
    intelligence,
    morningCal,
    focusEnv,
    phase,
    hasCheckedInToday,
    yesterdayCheckIn,
    aiAlert,
    velocity.declining,
    velocity.dropPts,
    velocity.dayCount,
    hasCommittedInsight,
    hasBlockerStreak,
    blockerStreakDays,
    tomorrowBriefing.hasPlan,
  ]);
}

/**
 * Extended version that accepts the dismissedYesterday session state from the caller.
 * index.tsx passes this in so the hook stays pure/memoizable without useState inside.
 */
export function useDailyCommandWithOverrides(dismissedYesterday: boolean): DailyCommandOutput {
  const behavioral = useBehavioralPipeline();
  const intelligence = useBehavioralIntelligence();
  const morningCal = useMorningCalibration();
  const focusEnv = useFocusEnvironment();

  const aiAlert = usePredictiveRecoveryAlert();
  const tomorrowBriefing = useTomorrowBriefing();
  const blockerPattern = useBlockerPattern();
  const insightEffectiveness = useInsightEffectiveness();
  const velocity = useScoreVelocity();

  const checkIns = useApp((s) => s.checkIns);
  const insights = useApp((s) => s.insights);

  const hour = new Date().getHours();
  const phase: "morning" | "midday" | "evening" =
    hour < 11 ? "morning" : hour < 17 ? "midday" : "evening";

  const todayDate = new Date().toISOString().slice(0, 10);
  const hasCheckedInToday = checkIns.some((c) => c.date === todayDate);
  const yesterdayCheckIn = checkIns.length >= 2 ? checkIns[checkIns.length - 2] : null;

  const committedInsightCard = insightEffectiveness.find(
    (e) => e.verdict === "working" || e.verdict === "too-early",
  );
  const hasCommittedInsight = !!(
    committedInsightCard && insights.find((i) => i.id === committedInsightCard.insightId)
  );

  const hasBlockerStreak = !!(blockerPattern.streak && blockerPattern.streak.days >= 3);
  const blockerStreakDays = blockerPattern.streak?.days ?? 0;

  return useMemo(() => {
    const ctx = {
      behavioral,
      intelligence,
      morningCal,
      focusEnv,
      phase,
      hasCheckedInToday,
      dismissedYesterday,
      yesterdayCheckIn,
      aiAlert,
      velocityDeclining: velocity.declining,
      velocityDropPts: velocity.dropPts,
      velocityDayCount: velocity.dayCount,
      hasCommittedInsight,
      hasBlockerStreak,
      blockerStreakDays,
    };

    const directive = selectPrimaryDirective(ctx);
    const ranked = scoreAndRankCards(ctx);

    const mode = behavioral.state.mode;
    const surfaceLevel = behavioral.shell.surfaceLevel;
    const budget = resolveBudget(surfaceLevel, mode);

    const withBriefingGate = ranked.filter((c) => {
      if (c.key === "briefing")
        return tomorrowBriefing.hasPlan && !morningCal.isComplete && !focusEnv.active;
      return true;
    });

    const cards = withBriefingGate.slice(0, budget);
    const activeCards = new Set(cards.map((c) => c.key));

    return {
      directive,
      cards,
      budget,
      activeCards,
      phase,
      voice: behavioral.state.guidance.tone,
      showBriefing: activeCards.has("briefing"),
      showYesterday: activeCards.has("yesterday"),
      showAvoidance: activeCards.has("avoidance"),
      showExpansion: activeCards.has("expansion"),
    };
  }, [
    behavioral,
    intelligence,
    morningCal,
    focusEnv,
    phase,
    hasCheckedInToday,
    dismissedYesterday,
    yesterdayCheckIn,
    aiAlert,
    velocity.declining,
    velocity.dropPts,
    velocity.dayCount,
    hasCommittedInsight,
    hasBlockerStreak,
    blockerStreakDays,
    tomorrowBriefing.hasPlan,
  ]);
}
