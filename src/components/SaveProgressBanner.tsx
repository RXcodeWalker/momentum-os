import { useApp } from "@/lib/store";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, X } from "lucide-react";
import { useMemo } from "react";

export function SaveProgressBanner() {
  const sessionType = useApp((s) => s.sessionType);
  const onboarded = useApp((s) => s.onboarded);
  const dismissed = useApp((s) => s.upgradePromptDismissed);
  const dismissedAt = useApp((s) => s.upgradePromptDismissedAt);
  const guestSince = useApp((s) => s.guestSince);
  const historyLength = useApp((s) => s.history.length);
  const dismissUpgradePrompt = useApp((s) => s.dismissUpgradePrompt);
  const navigate = useNavigate();

  // Re-show after 7 days if dismissed
  const shouldShow = useMemo(() => {
    if (sessionType !== "guest" || !onboarded) return false;
    if (!dismissed) return true;
    if (!dismissedAt) return false;
    const dismissedMs = new Date(dismissedAt).getTime();
    return Date.now() - dismissedMs > 7 * 86400000;
  }, [sessionType, onboarded, dismissed, dismissedAt]);

  const daysOfData = useMemo(() => {
    if (guestSince) {
      const days = Math.floor((Date.now() - new Date(guestSince).getTime()) / 86400000);
      return Math.max(days, historyLength > 0 ? 1 : 0);
    }
    return historyLength > 0 ? 1 : 0;
  }, [guestSince, historyLength]);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="glass mb-4 flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-accent/15">
              <Cloud className="h-4 w-4 text-accent" strokeWidth={1.5} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-snug">
                {daysOfData > 0
                  ? `${daysOfData} day${daysOfData !== 1 ? "s" : ""} of data stored locally only`
                  : "Your progress lives here only"}
              </p>
              <p className="text-xs text-muted-foreground">
                Save to sync across devices
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate({ to: "/sign-in", search: { mode: "upgrade", redirect: "/" } })}
              className="flex-none rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
            >
              Save Progress
            </button>

            <button
              type="button"
              onClick={dismissUpgradePrompt}
              className="flex-none rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
