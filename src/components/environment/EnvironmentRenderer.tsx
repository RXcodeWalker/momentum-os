"use client";
import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";
import { resolveEnvironment } from "@/engine/environment";
import type { CommittedEnvironmentSnapshot } from "@/engine/environment";

export function EnvironmentRenderer() {
  const lastPipelineResult = useApp((s) => s.lastPipelineResult);
  const environmentOverrides = useApp((s) => s.environmentOverrides);
  const committedEnvironment = useApp((s) => s.committedEnvironment);
  const setCommittedEnvironment = useApp((s) => s.setCommittedEnvironment);
  const clearExpiredEnvironmentOverrides = useApp((s) => s.clearExpiredEnvironmentOverrides);
  const focusActive = useApp((s) => s.focusEnvironment.active);

  const prefersReducedMotionRef = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    clearExpiredEnvironmentOverrides();

    const snapshot: CommittedEnvironmentSnapshot = resolveEnvironment({
      adaptationGeneration: lastPipelineResult?.adaptationGeneration ?? null,
      activeOverrides: environmentOverrides,
      prefersReducedMotion: prefersReducedMotionRef.current,
      previousSnapshot: committedEnvironment,
    });

    if (!snapshot.changed) return;

    setCommittedEnvironment(snapshot);

    const root = document.documentElement;
    const { tokens, dataEnvAttributes } = snapshot;

    // Write spacing and density first, motion 100ms later so layout settles before animations
    root.style.setProperty("--env-density", tokens.density.toString());
    root.style.setProperty("--env-spacing", tokens.spacing.toString());
    root.style.setProperty("--env-hierarchy", tokens.hierarchy.toString());
    root.style.setProperty("--env-pressure", tokens.pressure.toString());

    setTimeout(() => {
      root.style.setProperty("--env-motion", tokens.motion.toString());
    }, 100);

    // Write data attributes
    root.dataset.envDensity = dataEnvAttributes["data-env-density"];
    root.dataset.envSpacing = dataEnvAttributes["data-env-spacing"];
    root.dataset.envMotion = dataEnvAttributes["data-env-motion"];
    root.dataset.envHierarchy = dataEnvAttributes["data-env-hierarchy"];
    root.dataset.envPressure = dataEnvAttributes["data-env-pressure"];
    root.dataset.mode = dataEnvAttributes["data-mode"];
  }, [lastPipelineResult, environmentOverrides]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus environment: suppress entrance animations via CSS data attribute
  useEffect(() => {
    const root = document.documentElement;
    if (focusActive) {
      root.dataset.focusEnv = "active";
    } else {
      delete root.dataset.focusEnv;
    }
  }, [focusActive]);

  return null;
}
