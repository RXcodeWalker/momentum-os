Implementation Summary — Behavioral Core

This file is a surface-level engineering audit. Each subsystem lists source files, responsibilities, test coverage, and status (Completed / Partial / Missing) based on repository inspection.

Signal System

- Files
  - src/engine/signals/index.ts
  - src/engine/signals/snapshot.ts
  - src/engine/signals/detection.ts
  - src/engine/signals/normalize.ts
  - src/engine/signals/averages.ts
  - src/engine/signals/evidence.ts
  - Tests: src/engine/signals/signals.test.ts

- Responsibilities
  - Normalize raw DailyInputs
  - Smooth timelines and compute trends
  - Detect behavioral signals (RISING_FRAGMENTATION, RECOVERY_COLLAPSE, DECLINING_EXECUTION_QUALITY, etc.)
  - Produce SignalSnapshot with strengths, durations and probabilistic confidence

- Maturity
  - Completed: Core detection, snapshot generation and trend utilities implemented with scenario tests.
  - Partial: No missing critical pieces discovered; additional signal types can be added via detection rules.

State Engine

- Files
  - src/engine/state/state-engine.ts
  - src/engine/state/state-dimensions.ts
  - src/engine/state/mode-classifier.ts
  - src/engine/state/transition-engine.ts
  - src/engine/state/state-confidence.ts
  - Tests: src/engine/state/state-engine.test.ts, state-replay.test.ts

- Responsibilities
  - Compute UserState from evidence and snapshots
  - Score state confidence and emit uncertainty factors
  - Classify operational mode and detect transitions
  - Produce lastUpdatedAt and versioned output

- Maturity
  - Completed: Dimension computation, classification, transition emission, and confidence scoring present and tested across scenarios.
  - Partial: None critical; extension points available for additional confidence heuristics.

Task Intelligence

- Files
  - src/engine/tasks/task-engine.ts
  - src/engine/tasks/analysis/task-scoring.ts
  - src/engine/tasks/analysis/burden-calculator.ts
  - src/engine/tasks/analysis/compatibility-evaluator.ts
  - src/engine/tasks/analysis/portfolio-observer.ts
  - src/engine/tasks/decision/task-sequencer.ts
  - src/engine/tasks/explainability/reasoning.ts
  - Tests: src/engine/tasks/task-intelligence.test.ts

- Responsibilities
  - Score individual tasks (execution weight, resistance, burden)
  - Evaluate compatibility against UserState
  - Observe portfolio patterns and compute confidence bands
  - Sequence tasks (suppression, compression, primary/secondary picks) with explainability

- Maturity
  - Completed: Scoring, burden calculation, compatibility assessment and sequencing implemented with rich scenario tests.
  - Partial: Domain-enrichment step (building engine-ready Task objects with all attributes) is outside the engine; pipeline-runner accepts an optional sequencing override. The orchestrator currently uses a NEUTRAL_SEQUENCING when domain enrichment is not provided, so end-to-end sequencing requires a domain wiring step.

Intervention Engine

- Files
  - src/engine/interventions/evaluate.ts
  - src/engine/interventions/matrix/intervention-matrix-v1.ts
  - src/engine/interventions/suppression/* (hard-rules.ts, soft-rules.ts)
  - src/engine/interventions/cooldown/*, eligibility/*, priority/*, escalation/*
  - Tests: src/engine/interventions/*.test.ts

- Responsibilities
  - Evaluate trigger rules, assemble candidate interventions
  - Apply hard and soft suppression rules
  - Enforce cooldowns and exhaustion gates
  - Resolve intervention level and priority
  - Produce adaptation blueprint directives per intervention

- Maturity
  - Completed: Full matrix, suppression and cooldown logic implemented; tests simulate cooldowns, saturation, restraint application.
  - Partial: Adaptation directives are generated as blueprints, but no Adaptation Engine consumes them (Adaptation Engine missing).

Pipeline / Orchestrator

- Files
  - src/engine/orchestrator/evidence-bridge.ts
  - src/engine/orchestrator/pipeline-runner.ts

- Responsibilities
  - Map DayData/CheckIn → SessionEvidence
  - Run Signal Engine → State Engine → (optional Task Engine) → Intervention Engine in order
  - Assemble BehavioralPipeline contract for UI/store consumption

- Maturity
  - Completed: Evidence mapping and pipeline orchestration implemented and exercised by store.saveCheckIn().
  - Partial: Task Engine integration is optional; in absence of domain enrichment the runner uses NEUTRAL_SEQUENCING. Adaptation generation is intentionally omitted.

Store Integration (Application)

- Files
  - src/lib/store.ts

- Responsibilities
  - Persist user CheckIns, DayData, history, insights, proofs
  - Compute a pragmatic executionScore heuristic for the UI
  - Build session evidence and invoke runBehavioralPipeline()
  - Persist lastPipelineResult for immediate UI projection

- Maturity
  - Completed: Full integration path from check-in to pipeline and persistence exists; sync hooks to Supabase included.
  - Partial / Tech debt: store contains lightweight score heuristics and tomorrowPlan logic — these are pragmatic and working but should be refactored into engine/orchestration modules to satisfy the architecture freeze.

Tests & Quality

- Unit and scenario tests present for signals, state, tasks and interventions (src/engine/*/*.test.ts). Coverage focuses on behavioral semantics, false-positive safeguards, and architecture compliance (engines return plain data).
- Engines include explicit version tags (v1) for auditability and migration.

Known Gaps (explicit)

- Adaptation Engine and Projection layer: MISSING (no src/engine/adaptation or src/adaptation present).
- Top-level orchestration folder expected by architecture-freeze.md (src/orchestration) is not present; orchestrator lives under src/engine/orchestrator.
- Domain enrichment for Task Engine and server-side scalable engine runtime are outside current scope.

Summary

The Behavioral Core is production-quality for interpretation and intervention logic: engines are versioned, unit-tested, and integrated into the store's check-in lifecycle. The main remaining work before the Experience Layer is the Adaptation Engine and the pipeline exposure layer that maps adaptation directives to UI tokens.