import { useMemo } from "react";
import { useApp } from "@/lib/store";

export type MetricKey =
  | "todayScore"
  | "heatmap"
  | "momentum"
  | "consistency"
  | "resilience"
  | "userState"
  | "sleepImpact"
  | "focusByHour"
  | "burnoutRisk"
  | "dayOfWeek"
  | "blockerPattern"
  | "distractionProfile"
  | "taskIntelligence"
  | "tomorrowPlan"
  | "thread"
  | "insightEffectiveness"
  | "interventionEffectiveness"
  | "stateDynamics"
  | "patternDetection"
  | "behavioralReplay";

export type DataReadiness = {
  hasMinimum: boolean;
  evidenceCount: number;
  windowDays: number;
  confidence: "low" | "medium" | "high";
  asOf: string | null;
  reason?: string;
};

export type UserStage = "fresh" | "exploring" | "establishing" | "established";

export type RouteKey =
  | "today"
  | "reflect"
  | "identity"
  | "this-week"
  | "patterns"
  | "circles"
  | "recovery"
  | "replay"
  | "demo";

const METRIC_THRESHOLDS: Record<MetricKey, { checkIns: number; window: number }> = {
  todayScore: { checkIns: 1, window: 1 },
  heatmap: { checkIns: 10, window: 28 },
  momentum: { checkIns: 14, window: 14 },
  consistency: { checkIns: 10, window: 28 },
  resilience: { checkIns: 14, window: 28 },
  userState: { checkIns: 5, window: 7 },
  sleepImpact: { checkIns: 10, window: 28 },
  focusByHour: { checkIns: Number.POSITIVE_INFINITY, window: 0 },
  burnoutRisk: { checkIns: 7, window: 14 },
  dayOfWeek: { checkIns: 14, window: 28 },
  blockerPattern: { checkIns: 5, window: 14 },
  distractionProfile: { checkIns: 5, window: 28 },
  taskIntelligence: { checkIns: 3, window: 7 },
  tomorrowPlan: { checkIns: 1, window: 1 },
  thread: { checkIns: 1, window: 1 },
  insightEffectiveness: { checkIns: 7, window: 14 },
  interventionEffectiveness: { checkIns: 14, window: 90 },
  stateDynamics: { checkIns: 14, window: 28 },
  patternDetection: { checkIns: 14, window: 56 },
  behavioralReplay: { checkIns: 21, window: 28 },
};

function confidenceFor(evidence: number, minimum: number): DataReadiness["confidence"] {
  if (evidence < minimum) return "low";
  if (evidence < minimum * 2) return "medium";
  return "high";
}

export function useDataReadiness(metric: MetricKey): DataReadiness {
  const checkIns = useApp((s) => s.checkIns);
  const dataIsSeeded = useApp((s) => s.dataIsSeeded);
  const firstCheckInAt = useApp((s) => s.firstCheckInAt);

  return useMemo(() => {
    const threshold = METRIC_THRESHOLDS[metric];
    // Seeded demo data should still render — that's the whole point of /demo.
    const evidence = dataIsSeeded ? Math.max(checkIns.length, threshold.checkIns) : checkIns.length;
    const hasMinimum = evidence >= threshold.checkIns;
    const lastCheckIn = checkIns[checkIns.length - 1];
    return {
      hasMinimum,
      evidenceCount: evidence,
      windowDays: threshold.window,
      confidence: confidenceFor(evidence, threshold.checkIns),
      asOf: lastCheckIn?.date ?? firstCheckInAt ?? null,
    };
  }, [checkIns, metric, dataIsSeeded, firstCheckInAt]);
}

export function useUserStage(): UserStage {
  const checkIns = useApp((s) => s.checkIns);
  const dataIsSeeded = useApp((s) => s.dataIsSeeded);

  return useMemo(() => {
    if (dataIsSeeded) return "established";
    const n = checkIns.length;
    if (n === 0) return "fresh";
    if (n < 7) return "exploring";
    if (n < 21) return "establishing";
    return "established";
  }, [checkIns.length, dataIsSeeded]);
}

export function useVisibleRoutes(): RouteKey[] {
  const stage = useUserStage();
  const dataIsSeeded = useApp((s) => s.dataIsSeeded);
  const checkInCount = useApp((s) => s.checkIns.length);

  return useMemo(() => {
    const always: RouteKey[] = ["today", "reflect", "identity"];
    if (dataIsSeeded) {
      return [...always, "this-week", "patterns", "circles", "replay", "recovery"];
    }
    const routes: RouteKey[] = [...always];
    if (checkInCount >= 7) routes.push("this-week");
    if (checkInCount >= 10) routes.push("patterns");
    if (checkInCount >= 7) routes.push("circles");
    if (checkInCount >= 21) routes.push("replay");
    // Recovery is always reachable but never auto-routed; surfaced as a destination from Today.
    routes.push("recovery");
    return routes;
    // stage included for downstream consumers that want to switch on it.
    void stage;
  }, [stage, dataIsSeeded, checkInCount]);
}

export function isRouteVisible(routes: RouteKey[], key: RouteKey): boolean {
  return routes.includes(key);
}
