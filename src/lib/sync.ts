import { supabase } from "@/lib/supabase";
import type { DayData, CheckIn, Task, BehavioralInsight, OnboardingProfile } from "@/lib/store";

// ─── helpers ─────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── profile ─────────────────────────────────────────────────────────────────

export async function syncProfile(
  userId: string,
  data: {
    display_name?: string;
    goals?: string[];
    struggles?: string[];
    profile_json?: OnboardingProfile | null;
    days_on_app?: number;
    premium?: boolean;
    check_in_style?: string;
    principles?: string[];
    committed_rules?: unknown;
  },
) {
  await supabase.from("profiles").upsert({ id: userId, ...data }, { onConflict: "id" });
}

// ─── day logs ────────────────────────────────────────────────────────────────

export async function syncDayLog(userId: string, entry: DayData) {
  await supabase.from("day_logs").upsert(
    {
      user_id: userId,
      date: entry.date,
      execution_score: entry.executionScore,
      focus: entry.focus,
      sleep_hours: entry.sleepHours,
      distractions: entry.distractions,
      planned: entry.planned,
      completed: entry.completed,
      recovery: entry.recovery,
    },
    { onConflict: "user_id,date" },
  );
}

// ─── check-ins ───────────────────────────────────────────────────────────────

export async function syncCheckIn(userId: string, entry: CheckIn) {
  await supabase.from("check_ins").upsert(
    {
      user_id: userId,
      date: entry.date ?? todayStr(),
      honesty: entry.honesty,
      focus: entry.focus,
      sleep_hours: entry.sleepHours,
      energy: entry.energy,
      mood: entry.mood,
      completed: entry.completed,
      planned: entry.planned,
      distractions: entry.distractions,
      blockers: entry.blockers,
      tomorrow_focus: entry.tomorrowFocus,
    },
    { onConflict: "user_id,date" },
  );
}

// ─── tasks ───────────────────────────────────────────────────────────────────

export async function syncTasks(userId: string, tasks: Task[], date: string) {
  // Delete existing tasks for that date then re-insert to avoid complex diffs
  await supabase.from("tasks").delete().match({ user_id: userId, date });
  if (tasks.length === 0) return;
  await supabase.from("tasks").insert(
    tasks.map((t, i) => ({
      id: t.id,
      user_id: userId,
      date,
      label: t.label,
      est_min: t.estMin,
      done: t.done,
      type: t.type,
      rescheduled: t.rescheduled ?? 0,
      sort_order: i,
    })),
  );
}

// ─── insights ────────────────────────────────────────────────────────────────

export async function syncInsightState(
  userId: string,
  insightKey: string,
  updates: { unlocked?: boolean; unlocked_at?: string; dismissed?: boolean; committed?: boolean },
) {
  await supabase
    .from("insights")
    .upsert(
      { user_id: userId, insight_key: insightKey, ...updates },
      { onConflict: "user_id,insight_key" },
    );
}

// ─── personal proofs ─────────────────────────────────────────────────────────

export async function syncPersonalProof(
  userId: string,
  proof: { id: string; text: string; trait: string; date: string },
) {
  await supabase
    .from("personal_proofs")
    .upsert(
      { id: proof.id, user_id: userId, text: proof.text, trait: proof.trait, date: proof.date },
      { onConflict: "id" },
    );
}

// ─── circle proofs ───────────────────────────────────────────────────────────

export async function syncCircleProof(
  userId: string,
  proof: { id: string; text: string; type: string },
) {
  await supabase
    .from("circle_proofs")
    .upsert(
      { id: proof.id, user_id: userId, text: proof.text, type: proof.type, circle_id: "default" },
      { onConflict: "id" },
    );
}

// ─── hydrate from DB ─────────────────────────────────────────────────────────
// Returns a partial store state that replaces seeded data on sign-in.
// Returns null if no data exists yet (new user).

export async function hydrateFromDB(userId: string) {
  const [profileRes, logsRes, checkInsRes, tasksRes, insightsRes, personalProofsRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("day_logs")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true }),
      supabase
        .from("check_ins")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true }),
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("date", todayStr())
        .order("sort_order", { ascending: true }),
      supabase.from("insights").select("*").eq("user_id", userId),
      supabase
        .from("personal_proofs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

  // New user — no profile row yet
  if (profileRes.error || !profileRes.data) return null;

  const profile = profileRes.data;

  const history: DayData[] = (logsRes.data ?? []).map((row) => ({
    date: row.date,
    executionScore: row.execution_score,
    focus: row.focus,
    sleepHours: parseFloat(row.sleep_hours),
    distractions: row.distractions,
    planned: row.planned,
    completed: row.completed,
    recovery: row.recovery,
  }));

  const checkIns: CheckIn[] = (checkInsRes.data ?? []).map((row) => ({
    date: row.date,
    honesty: row.honesty,
    focus: row.focus,
    sleepHours: parseFloat(row.sleep_hours),
    energy: row.energy,
    mood: row.mood,
    completed: row.completed,
    planned: row.planned,
    distractions: row.distractions ?? [],
    blockers: row.blockers ?? {},
    tomorrowFocus: row.tomorrow_focus,
  }));

  const tasks: Task[] = (tasksRes.data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    estMin: row.est_min,
    done: row.done,
    type: row.type,
    rescheduled: row.rescheduled,
  }));

  // Merge DB insight states into the static insight definitions
  // (insight content stays in the store; only unlocked/dismissed/committed come from DB)
  const insightOverrides = new Map((insightsRes.data ?? []).map((r) => [r.insight_key, r]));

  const personalProofs = (personalProofsRes.data ?? []).map((row) => ({
    id: row.id,
    text: row.text,
    trait: row.trait,
    date: row.date,
  }));

  // Calculate daysOnApp from profile created_at
  const createdAt = new Date(profile.created_at);
  const daysOnApp = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 86400000));

  return {
    user: profile.display_name || "",
    currentUserId: userId,
    onboarded: !!profile.goals?.length,
    goals: profile.goals ?? [],
    struggles: profile.struggles ?? [],
    profile: profile.profile_json ?? null,
    premium: profile.premium ?? false,
    checkInStyle: (profile.check_in_style ?? "wizard") as "wizard" | "quick",
    principles: profile.principles?.length ? profile.principles : undefined,
    committedRules: profile.committed_rules ?? [],
    daysOnApp,
    history,
    checkIns,
    tasks: tasks.length > 0 ? tasks : undefined, // undefined = keep store default tasks
    personalProofs: personalProofs.length > 0 ? personalProofs : undefined,
    _insightOverrides: insightOverrides, // consumed by store's hydrateStore action
  };
}
