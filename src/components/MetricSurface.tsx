import { type ReactNode } from "react";
import { useDataReadiness, type DataReadiness, type MetricKey } from "@/lib/maturity";

type Props = {
  metric: MetricKey;
  fallback?: ReactNode;
  children: (readiness: DataReadiness) => ReactNode;
};

export function MetricSurface({ metric, fallback = null, children }: Props) {
  const readiness = useDataReadiness(metric);
  if (!readiness.hasMinimum) return <>{fallback}</>;
  return <>{children(readiness)}</>;
}

export function EvidenceLine({ readiness }: { readiness: DataReadiness }) {
  if (!readiness.hasMinimum) return null;
  const days = readiness.evidenceCount;
  const conf = readiness.confidence;
  return (
    <span className="text-xs text-muted-foreground">
      Based on {days} {days === 1 ? "day" : "days"} · {conf} confidence
    </span>
  );
}
