import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";

const INACTIVITY_MS = 35 * 60 * 1000; // 35 minutes
const MIN_PROTECTION_MS = 10 * 60 * 1000; // 10 minute minimum before exit can fire

/**
 * Tracks user inactivity while the focus environment is active.
 * Exits focus environment after 35 minutes of no interaction, but never
 * within the first 10 minutes of entry (protects genuinely deep work).
 */
export function useFocusInactivityTimer() {
  const focusEnv = useApp((s) => s.focusEnvironment);
  const exitFocusEnvironment = useApp((s) => s.exitFocusEnvironment);

  const enteredAtRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!focusEnv.active) {
      // Clean up when focus exits
      enteredAtRef.current = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Track entry time
    enteredAtRef.current = focusEnv.enteredAt ? new Date(focusEnv.enteredAt).getTime() : Date.now();
    lastActivityRef.current = Date.now();

    function onActivity() {
      lastActivityRef.current = Date.now();
    }

    function scheduleCheck() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(
        () => {
          const now = Date.now();
          const enteredAt = enteredAtRef.current ?? now;
          const sinceEntry = now - enteredAt;
          const sinceActivity = now - lastActivityRef.current;

          if (sinceEntry < MIN_PROTECTION_MS) {
            // Still within protection window — reschedule for when it expires
            scheduleCheck();
            return;
          }

          if (sinceActivity >= INACTIVITY_MS) {
            exitFocusEnvironment("inactivity");
          } else {
            // Activity happened — reschedule for when inactivity window expires
            timerRef.current = setTimeout(scheduleCheck, INACTIVITY_MS - sinceActivity);
          }
        },
        Math.max(0, MIN_PROTECTION_MS - (Date.now() - (enteredAtRef.current ?? Date.now()))),
      );
    }

    // Tab switch away is read/reference work — don't reset timer. Returning IS activity.
    function onVisibilityChange() {
      if (document.visibilityState === "visible") onActivity();
    }

    window.addEventListener("click", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity);
    window.addEventListener("visibilitychange", onVisibilityChange);

    scheduleCheck();

    return () => {
      window.removeEventListener("click", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("visibilitychange", onVisibilityChange);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [focusEnv.active, focusEnv.enteredAt, exitFocusEnvironment]);
}
