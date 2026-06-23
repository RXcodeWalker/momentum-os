Release Name

Momentum OS v0.2.0 — Behavioral Core

Mission

Deliver a frozen, tested, and production-ready Behavioral Core: the signal pipeline, state interpreter, task intelligence, intervention engine, trajectory analysis, evidence bridge, and the behavioral pipeline integration point wired into the application store. This release provides the deterministic, versioned engine foundation required before building the Behavioral Experience Layer.

Major Systems Completed

- Signal System
  - Purpose: Convert raw daily inputs into probabilistic behavioral signals and a snapshot that summarizes active signals, strengths, durations and confidence.
  - Key responsibilities: normalization, smoothing, trend detection, signal-duration accounting, snapshot generation.
  - Current implementation status: Implemented in src/engine/signals (normalize.ts, detection.ts, snapshot.ts, averages.ts, evidence.ts). Covered by unit tests in src/engine/signals/signals.test.ts.

- State Engine
  - Purpose: Derive canonical UserState (recoveryDebt, cognitiveStrain, executionStability, emotionalFriction, trends, readiness) from evidence and signals; emit mode transitions and confidence.
  - Key responsibilities: computeDimensions, computeStateConfidence, classifyMode, detectTransition, emit StateTransition, versioning.
  - Current implementation status: Implemented in src/engine/state (state-engine.ts, state-dimensions.ts, mode-classifier.ts, transition-engine.ts, state-confidence.ts) with scenario tests in src/engine/state/state-engine.test.ts.

- Task Intelligence
  - Purpose: Score tasks, evaluate compatibility with current state, observe portfolio patterns, and produce sequencing decisions with reasoning.
  - Key responsibilities: task scoring, burden calculation, compatibility evaluation, portfolio observation, sequencing (suppression/compression), explainability.
  - Current implementation status: Implemented in src/engine/tasks (analysis/, decision/, task-engine.ts). Unit and scenario tests in src/engine/tasks/task-intelligence.test.ts. Note: Task Engine is implemented as an enrichable component — pipeline integration requires enriched domain Task objects.

- Intervention Engine
  - Purpose: Evaluate intervention triggers, apply suppression and cooldowns, resolve priority/levels, and produce adaptation directives.
  - Key responsibilities: intervention matrix, trigger evaluation, suppression (hard/soft), cooldowns, eligibility, adaptation blueprints.
  - Current implementation status: Implemented in src/engine/interventions (matrix, eligibility, suppression, cooldown, evaluate.ts). Extensive tests in src/engine/interventions/\*.test.ts. Adaptation directives are produced but the Adaptation Engine itself is not implemented.

- Trajectory Analysis
  - Purpose: Compute long-window behavioral trajectory (EXPANDING, STABLE, FRAGILE, CONTRACTING) independently from operational mode.
  - Key responsibilities: daily deduplication, smoothing, trend calculation, conservative heuristics for limited data.
  - Current implementation status: Implemented in src/engine/state/trajectory-analyzer.ts and exercised via state tests.

- Evidence Bridge
  - Purpose: Map store DayData and CheckIn records to SessionEvidence and DailyInputs used by the Signal and State engines.
  - Key responsibilities: normalization parameters (BRIDGE_CONFIG), sleep->sleepQuality, fragmentation mapping, avoidance pressure, completeness flags.
  - Current implementation status: Implemented in src/engine/orchestrator/evidence-bridge.ts and used by the store; exercised in engine tests via fixtures.

- Behavioral Pipeline
  - Purpose: Orchestrate engine execution: Signal Engine → State Engine → (optional Task Engine) → Intervention Engine and assemble a BehavioralPipeline object consumed by the UI/store.
  - Key responsibilities: snapshot generation, state evaluation, sequencing passthrough, intervention evaluation, pipeline assembly.
  - Current implementation status: Implemented in src/engine/orchestrator/pipeline-runner.ts and invoked from src/lib/store.ts (saveCheckIn path). Adaptation generation is intentionally omitted (Adaptation Engine missing).

- Store Integration
  - Purpose: Application-level integration point for check-ins and the behavioral pipeline; persists evidence and pipeline results for UI consumption.
  - Key responsibilities: persist CheckIn/DayData, compute simple executionScore heuristic, buildSessionEvidence, invoke runBehavioralPipeline, persist lastPipelineResult, manage tomorrowPlan and insight lifecycle.
  - Current implementation status: Implemented in src/lib/store.ts. saveCheckIn() runs the evidence bridge + pipeline and stores the result; legacy score/plan heuristics exist in the store and are noted as migration candidates.

Key Achievements

- Complete, versioned engine implementations for signals, state, tasks, and interventions.
- End-to-end pipeline runner (signal → state → interventions) integrated into store.saveCheckIn().
- Comprehensive unit and scenario tests covering state interpretation, signal detection, task sequencing and intervention evaluation.
- Intervention matrix v1 with cooldowns, suppression rules, priority tiers and adaptation blueprints.
- Evidence Bridge standardises mapping from UI-checkins to engine-ready SessionEvidence.

What Is Explicitly Not Included

- Adaptation Engine (engine/adaptation) — NOT IMPLEMENTED.
- Adaptation Projection / UI adaptation layer (src/adaptation) — NOT IMPLEMENTED.
- Behavioral Experience Layer (state-aware Today UI, Morning Calibration v2, Evening Reflection Loop) — not implemented beyond store heuristics and component placeholders.
- Morning Calibration v2 — not present.
- Full Reflection Loop orchestration and persistence beyond basic check-in handling — not present.
- AI-driven runtime adaptation (no LLM integration in engine code).
- Server-side, horizontally scalable engine runtime orchestration beyond client-invoked pipeline runs and simple Supabase sync.

This release freezes the Behavioral Core to enable focused work on the Behavioral Experience Layer. See ARCHITECTURE-SNAPSHOT.md, IMPLEMENTATION-SUMMARY.md and NEXT-STEPS.md for detailed engineering context and the recommended roadmap.
