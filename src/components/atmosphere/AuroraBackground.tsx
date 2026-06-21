"use client";
import { useEnvironment } from "@/hooks/useEnvironment";

// Drift duration scales inversely with motion: fast at high motion, slow at low motion.
// Formula: 22s / (env.motion + 0.2) — range ~9s (motion=1) to ~38s (motion=0).
function driftDuration(base: number, motion: number): string {
  return `${Math.round(base / (motion + 0.2))}s`
}

export function AuroraBackground() {
  const env = useEnvironment()
  const motion = env.tokens.motion
  const pressure = env.tokens.pressure

  // Opacity scales with pressure (more pressure = more vivid aurora)
  const baseOpacity = 0.55 + pressure * 0.30

  const blob1Duration = driftDuration(22, motion)
  const blob2Duration = driftDuration(28, motion)
  const blob3Duration = driftDuration(34, motion)

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="aurora-blob aurora-1"
        style={{
          opacity: baseOpacity,
          animationDuration: blob1Duration,
        }}
      />
      <div
        className="aurora-blob aurora-2"
        style={{
          opacity: baseOpacity * 0.73,
          animationDuration: blob2Duration,
        }}
      />
      <div
        className="aurora-blob aurora-3"
        style={{
          opacity: baseOpacity * 0.55,
          animationDuration: blob3Duration,
        }}
      />
      <div className="grain-overlay" />
    </div>
  );
}
