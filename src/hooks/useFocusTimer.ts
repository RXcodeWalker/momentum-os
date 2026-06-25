import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";

export type FocusTimerState = {
  elapsedMs: number;
  windowMs: number | null;
  progress: number;
  pastWindow: boolean;
  elapsedMin: number;
};

export function useFocusTimer(): FocusTimerState {
  const enteredAt = useApp((s) => s.focusEnvironment.enteredAt);
  const windowMs = useApp((s) => s.focusEnvironment.sessionWindowMs);
  const active = useApp((s) => s.focusEnvironment.active);

  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!active || !enteredAt) {
      setElapsedMs(0);
      return;
    }

    function tick() {
      if (document.visibilityState !== "visible") return;
      setElapsedMs(Date.now() - new Date(enteredAt!).getTime());
    }

    tick();
    const id = setInterval(tick, 1000);

    function onVisible() {
      tick();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, enteredAt]);

  const progress = windowMs && windowMs > 0 ? Math.min(1, elapsedMs / windowMs) : 0;
  const pastWindow = windowMs !== null && elapsedMs >= windowMs;
  const elapsedMin = Math.floor(elapsedMs / 60000);

  return { elapsedMs, windowMs, progress, pastWindow, elapsedMin };
}
