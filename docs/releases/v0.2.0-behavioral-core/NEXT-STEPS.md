Roadmap: next logical phases after Behavioral Core

Context

Phase 0–1 (Behavioral Core) is complete: signals, state interpreter, task intelligence, intervention engine, trajectory analysis, evidence bridge and a pipeline runner are implemented and tested. The next phases focus on exposing pipeline outputs to users, building the Behavioral Experience Layer, and expanding adaptation and longitudinal intelligence.

Phase 2 — Behavioral Experience Layer (Priority)

Objectives
- Surface deterministic engine outputs to the UI in a state-aware, interpretable way.

Deliverables
- Pipeline Exposure Layer
  - Implement a thin adapter that transforms BehavioralPipeline → AdaptationInput for UI consumers.
  - Contract: src/core/contracts/pipeline/behavioral-pipeline.ts stays authoritative.
- State-Aware Today Screen
  - Today view consumes lastPipelineResult and adjusts visible tasks, pacing, and messaging.
  - Replace in-component heuristics with pipeline-driven tokens.
- Morning Calibration v2
  - Use pipeline outputs + day-of-week profiles to offer a guided calibration flow; store previousMode for hysteresis and re-evaluation.
- Evening Reflection Loop
  - Surface insights, commit-to-rule UX, and capture reflections as evidence for next-day pipeline runs.
- Focus Environment
  - UI patterns for focus protection (task limits, reduced density, deep-work toggles) wired to adaptation directives.

Acceptance Criteria
- All UI adjustments driven by AdaptationProjection tokens from the pipeline exposure layer (no behavioral logic in components).
- UX copy uses engine-supplied observational reasoning (no identity/shame language).

Phase 3 — Adaptation Engine

Objectives
- Synthesize adaptation directives into concrete UI tokens and runtime behavior.

Deliverables
- Environmental Adaptation (interface density, spacing, motion intensity)
- Execution Adaptation (visibleTaskLimit, workloadCompression, pacing recommendations)
- Guidance Adaptation (messaging tone, reflection depth)
- Adaptation API: deterministic, versioned transform from BehavioralPipeline → AdaptationOutput

Acceptance Criteria
- Adaptation Engine runs as pure TypeScript module; returns AdaptationOutput (src/core/contracts/adaptation/output.ts).
- Orchestrator attaches adaptationGeneration to BehavioralPipeline.

Phase 4 — Longitudinal Intelligence

Objectives
- Build system memory and replay capabilities to improve personalization and auditability.

Deliverables
- Behavioral Timeline (UI + persisted history of pipeline results)
- Intervention Memory (audit records, cooldown history, efficacy tracking)
- State History & Replay tools (replay evidence → pipeline runs for regression tests)
- Batch simulation harness for scenario testing and regression

Acceptance Criteria
- Versioned pipeline outputs persisted for 90+ days; replay produces identical outputs for the same evidence and engine versions.

Phase 5 — Advanced Behavioral Intelligence

Objectives
- Improve detection and compatibility models; extend capability growth safely.

Deliverables
- Avoidance Detection v2 (clustered avoidance detection and sequence-aware interruption)
- Recovery Compatibility v2 (task-level recovery impact modeling with richer evidence)
- Capability Expansion Engine (safe stretch planning using longitudinal signals)

Phase 6+ — Platform & Scale (high-level)

- Engine Runtime Scaling: server-side runtime for periodic pipeline runs, long-replay jobs, and heavy batch processing.
- Intervention Personalization: A/B safety framework, offline simulation to validate intervention efficacy.
- Governance & Monitoring: drift detection, model versioning dashboard, audit trails for interventions.

Immediate Next Actions (first 90 days)

1. Implement Pipeline Exposure Layer (adapter + small transform tests).
2. Build minimal Adaptation Engine contract and wire adaptationGeneration in pipeline-runner.
3. Refactor store.saveCheckIn: migrate executionScore and tomorrowPlan heuristics into orchestrator/engines as formal engine modules.
4. Deliver State-Aware Today Screen consuming AdaptationProjection tokens and run end-to-end UX tests.
5. Create replay harness for deterministic reproducibility of BehavioralPipeline runs.

Notes

- Respect architecture freeze: no behavioral logic in UI components; engines are the single authority for interpretation.
- Keep engines pure TypeScript with explicit versioning and comprehensive scenario tests.

This roadmap is intended to be actionable from the current codebase snapshot and to guide the transition from the Behavioral Core to the Behavioral Experience Layer.