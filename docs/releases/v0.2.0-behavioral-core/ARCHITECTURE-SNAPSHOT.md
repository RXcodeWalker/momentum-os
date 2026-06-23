System Diagram (implemented)

Frontend (Routes / Components: src/routes/check-in.tsx, src/components/check-in/CheckInWizard.tsx)
↓
Zustand Store (src/lib/store.ts)
↓ (buildSessionEvidence)
Evidence Bridge (src/engine/orchestrator/evidence-bridge.ts)
↓ (DailyInputs / SessionEvidence)
Signal Engine (src/engine/signals/_)
↓ (SignalSnapshot)
State Engine (src/engine/state/state-engine.ts)
↓ (UserState + optional Transition)
Trajectory Analyzer (src/engine/state/trajectory-analyzer.ts)
↓
Task Intelligence (optional — src/engine/tasks/_) ← domain enrichment required for full use
↓
Intervention Engine (src/engine/interventions/\*)
↓
(Adaptation Engine — MISSING)
↓
Store receives BehavioralPipeline (stored as state.lastPipelineResult)

Engine Boundaries (as implemented)

- Signal Engine (src/engine/signals)
  - Owns: normalization, smoothing, trend detection, active signal detection, snapshot contract generation.
  - Must NOT: interpret trajectory or produce interventions.

- State Engine (src/engine/state)
  - Owns: computeDimensions, state confidence, mode classification, transition emission, trajectory derivation (via trajectory-analyzer).
  - Must NOT: sequence tasks or render UI.

- Task Intelligence (src/engine/tasks)
  - Owns: task scoring, burden calculations, compatibility evaluation, portfolio observation, sequencing decisions, explainability attachments.
  - Must NOT: persist domain entities, render UI, mutate store directly. Task Engine expects enriched Task objects; the orchestrator currently accepts an optional sequencing input.

- Intervention Engine (src/engine/interventions)
  - Owns: trigger evaluation, suppression (hard/soft), cooldown logic, eligibility gates, priority and level resolution, adaptation directives (blueprints).
  - Must NOT: perform UI rendering or persistence; it returns contracts and auditable directives.

- Orchestrator / Pipeline Runner (src/engine/orchestrator/pipeline-runner.ts)
  - Owns: canonical execution order (signals → state → [task] → interventions) and assembly of BehavioralPipeline.
  - Must NOT: include long-running I/O or framework objects; it accepts plain inputs and returns plain data.

- Evidence Bridge (src/engine/orchestrator/evidence-bridge.ts)
  - Owns: mapping DayData + CheckIn → SessionEvidence/DailyInputs, completeness scoring, configurable mapping parameters (BRIDGE_CONFIG).
  - Must NOT: classify state or fire interventions; it produces evidence only.

- Store (src/lib/store.ts)
  - Owns: persistence (localStorage via Zustand) and application lifecycle wiring; invokes the evidence bridge and pipeline runner on saveCheckIn().
  - Contains: migration/sync helpers, demo-data, and legacy heuristics (lightweight executionScore calculation and tomorrowPlan heuristics) that should be migrated to engines in future.

Data Flow (concrete file-level trace)

1. User completes check-in UI (src/components/check-in/CheckInWizard.tsx → src/routes/check-in.tsx uses useApp hook).
2. Routes call store.saveCheckIn(data) (src/lib/store.ts).
3. saveCheckIn updates DayData/CheckIn and builds session evidence via buildSessionEvidence() (src/engine/orchestrator/evidence-bridge.ts).
4. runBehavioralPipeline({ evidence, context, recentInterventions }) is invoked (src/engine/orchestrator/pipeline-runner.ts).
   - generateSignalSnapshot (src/engine/signals/snapshot.ts)
   - evaluateState (src/engine/state/state-engine.ts)
   - (optional) task sequencing if caller supplies Task Engine output
   - evaluateInterventions (src/engine/interventions/evaluate.ts)
5. pipeline-runner returns a BehavioralPipeline (contract: src/core/contracts/pipeline/behavioral-pipeline.ts) which is persisted in store.lastPipelineResult.

Contracts (source of truth)

- BehavioralPipeline: src/core/contracts/pipeline/behavioral-pipeline.ts
- UserState and state primitives: src/core/contracts/state/user-state.ts, src/core/contracts/state/transitions.ts
- Task contracts and scoring: src/core/contracts/tasks/\* (task.ts, scores.ts, sequencing.ts)
- Intervention contracts: src/core/contracts/interventions/\*
- Signal/Evidence contracts: src/core/contracts/signals/\*

Architectural Principles (as enforced and implemented)

- Engine-first: behavioral reasoning lives in pure TypeScript engine modules under src/engine.
- Single source of truth: raw evidence persisted (DayData/CheckIn); derived state is recomputed on pipeline runs — do not persist interpreted state as authority.
- Determinism and versioning: each engine exports a version tag (v1) and returns plain data objects with no framework types.
- Event-driven evidence model: SessionEvidence[] is the canonical input shape for the pipeline run; supports replayability and scenario testing.
- Explainability & restraint: engines return observational reasoning and adaptation directives; text avoids shaming/identity labels per policy.

Implementation Notes / Deviations

- Orchestrator location: pipeline-runner lives under src/engine/orchestrator (not at top-level src/orchestration). This is an implementation detail to normalize before Phase 2 if desired.
- Adaptation Engine and Projection (adaptation → UI tokens) are intentionally absent; pipeline currently sets adaptationGeneration omitted in BehavioralPipeline to make this explicit.
- The store contains a lightweight executionScore heuristic and tomorrowPlan generator; these are pragmatic integration points but represent technical debt relative to the architecture freeze (they should be migrated into engine/orchestration modules during the next phase).
