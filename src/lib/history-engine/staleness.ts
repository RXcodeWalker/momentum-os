import type { AggregationSnapshot, WindowKey } from "@/core/contracts/history/snapshot";
import { SNAPSHOT_TTL_HOURS } from "@/core/contracts/history/snapshot";

export function isSnapshotStale(snapshot: AggregationSnapshot): boolean {
  if (snapshot.isStale) return true;
  const ttlMs = SNAPSHOT_TTL_HOURS[snapshot.windowKey] * 60 * 60 * 1000;
  return Date.now() - new Date(snapshot.computedAt).getTime() > ttlMs;
}

export function isSnapshotMissing(
  snapshots: Partial<Record<WindowKey, AggregationSnapshot>>,
  windowKey: WindowKey,
): boolean {
  return !snapshots[windowKey];
}

export function stalestWindowKey(
  snapshots: Partial<Record<WindowKey, AggregationSnapshot>>,
): WindowKey | null {
  const keys: WindowKey[] = ["W7", "W7_PRIOR", "W14", "W28"];
  let stalest: WindowKey | null = null;
  let oldest = Infinity;
  for (const key of keys) {
    const s = snapshots[key];
    if (!s) return key;
    const age = Date.now() - new Date(s.computedAt).getTime();
    if (s.isStale || age > oldest) {
      oldest = age;
      stalest = key;
    }
  }
  return stalest;
}
