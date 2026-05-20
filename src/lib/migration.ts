import type { State, DayData, CheckIn, BehavioralInsight } from "@/lib/store";

/**
 * Merges local guest state with cloud data when a guest signs into an existing account.
 * Pure function — no side effects.
 *
 * Merge rules:
 * - history: union by date, keep entry with higher executionScore on conflict
 * - checkIns: union by date, cloud wins on conflict (already synced)
 * - tasks: local wins (ephemeral/today-scoped)
 * - profile/goals/struggles: local wins if onboarded, else cloud wins
 * - insights: most advanced state wins (committed > unlocked > locked; dismissed is sticky)
 * - personalProofs: union by id
 * - daysOnApp: take max of both
 */
export function buildMigrationPayload(
  local: State,
  cloud: Partial<State>,
): Partial<State> {
  // History: merge by date, take higher executionScore on conflict
  const historyMap = new Map<string, DayData>();
  (cloud.history ?? []).forEach((d) => historyMap.set(d.date, d));
  (local.history ?? []).forEach((d) => {
    const existing = historyMap.get(d.date);
    if (!existing || d.executionScore > existing.executionScore) {
      historyMap.set(d.date, d);
    }
  });
  const mergedHistory = Array.from(historyMap.values()).sort((a, b) =>
    a.date < b.date ? -1 : 1,
  );

  // CheckIns: merge by date, cloud wins on conflict
  const checkInMap = new Map<string, CheckIn>();
  (local.checkIns ?? []).forEach((c) => checkInMap.set(c.date, c));
  (cloud.checkIns ?? []).forEach((c) => checkInMap.set(c.date, c)); // cloud overwrites
  const mergedCheckIns = Array.from(checkInMap.values()).sort((a, b) =>
    a.date < b.date ? -1 : 1,
  );

  // Profile: local wins if already onboarded as guest, else fall back to cloud
  const useLocalProfile = local.onboarded;
  const mergedProfile = useLocalProfile ? local.profile : (cloud.profile ?? local.profile);
  const mergedGoals = useLocalProfile ? local.goals : (cloud.goals ?? local.goals);
  const mergedStruggles = useLocalProfile
    ? local.struggles
    : (cloud.struggles ?? local.struggles);

  // Insights: take the most advanced state per insight id
  // Order: committed > unlocked > base; dismissed is sticky
  const insightRank = (i: BehavioralInsight) => {
    if (i.committed) return 3;
    if (i.unlocked) return 2;
    return 1;
  };
  const cloudInsightMap = new Map<string, BehavioralInsight>();
  (cloud.insights ?? []).forEach((i) => cloudInsightMap.set(i.id, i));
  const mergedInsights = (local.insights ?? []).map((localIns) => {
    const cloudIns = cloudInsightMap.get(localIns.id);
    if (!cloudIns) return localIns;
    const winner = insightRank(localIns) >= insightRank(cloudIns) ? localIns : cloudIns;
    return {
      ...winner,
      dismissed: localIns.dismissed || cloudIns.dismissed, // dismissed is sticky
    };
  });

  // Personal proofs: union by id
  const proofMap = new Map<string, { id: string; text: string; trait: string; date: string }>();
  (cloud.personalProofs ?? []).forEach((p) => proofMap.set(p.id, p));
  (local.personalProofs ?? []).forEach((p) => proofMap.set(p.id, p));
  const mergedPersonalProofs = Array.from(proofMap.values());

  // daysOnApp: take max
  const mergedDaysOnApp = Math.max(local.daysOnApp ?? 0, cloud.daysOnApp ?? 0);

  return {
    history: mergedHistory,
    checkIns: mergedCheckIns,
    tasks: local.tasks, // local always wins for tasks
    profile: mergedProfile,
    goals: mergedGoals,
    struggles: mergedStruggles,
    onboarded: local.onboarded || (cloud.onboarded ?? false),
    insights: mergedInsights,
    personalProofs: mergedPersonalProofs,
    daysOnApp: mergedDaysOnApp,
    // Pass through other cloud fields that local wouldn't have
    premium: cloud.premium ?? local.premium,
    committedRules: local.committedRules?.length
      ? local.committedRules
      : (cloud.committedRules ?? []),
    principles: local.principles?.length ? local.principles : (cloud.principles ?? []),
    checkInStyle: local.checkInStyle ?? cloud.checkInStyle ?? "wizard",
  };
}
