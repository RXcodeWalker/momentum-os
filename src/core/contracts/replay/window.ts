export type ReplayWindowScope = "W7" | "W14" | "W28";

export type ReplayWindowConfig = {
  label: string;
  minimumCheckIns: number;
  minimumEvidenceDays: number;
};

export const REPLAY_WINDOW_CONFIG: Record<ReplayWindowScope, ReplayWindowConfig> = {
  W7: { label: "Last 7 days", minimumCheckIns: 5, minimumEvidenceDays: 4 },
  W14: { label: "Last 14 days", minimumCheckIns: 10, minimumEvidenceDays: 8 },
  W28: { label: "Last 28 days", minimumCheckIns: 21, minimumEvidenceDays: 18 },
};

export type ReplayWindow = {
  scope: ReplayWindowScope;
  startDate: string;
  endDate: string;
  daysIncluded: number;
};
