MOMENTUM OS — ARCHITECTURE FREEZE v1
Canonical System Architecture Specification
This document freezes the architectural foundation of Momentum OS before implementation.
Its purpose is to prevent:
	• AI-generated architectural drift
	• state fragmentation
	• duplicated logic
	• inconsistent adaptation behavior
	• “smart UI” without behavioral coherence
	• accidental productivity-app regression
This is the system-level contract that defines:
	• engine boundaries
	• authority hierarchy
	• state ownership
	• persistence rules
	• orchestration flow
	• adaptation layers
	• domain separation
	• behavioral intelligence containment
Once implementation begins:
	this architecture becomes law.
No feature should violate it without intentional architectural review.
This freeze is built from the behavioral engine, intervention system, state engine, task intelligence model, adaptation philosophy, and daily regulation loop already defined.

1. CORE ARCHITECTURAL PRINCIPLE
Momentum OS is NOT:
	• a UI-first application
	• a task CRUD app
	• a notification system
	• an analytics dashboard
It is:
	a behavioral regulation engine with a projected interface.
That means:
The behavioral engine is the product.
NOT:
	• React components
	• animations
	• charts
	• dashboards
	• productivity aesthetics
If the engine becomes weak:
the entire product collapses into generic productivity software.
Therefore:
PRIMARY ARCHITECTURAL LAW
UI NEVER owns behavioral logic.
Behavioral reasoning must exist:
	• centrally
	• deterministically
	• interpretably
	• independently from presentation

2. ARCHITECTURE PHILOSOPHY
The architecture must optimize for:
	• behavioral coherence
	• interpretability
	• deterministic reasoning
	• controlled adaptability
	• modular intelligence
	• engine isolation
	• long-term maintainability
	• AI-assisted implementation safety
The architecture must NOT optimize for:
	• rapid feature chaos
	• component convenience
	• hyper-abstraction
	• premature microservices
	• frontend intelligence duplication
	• uncontrolled AI-generated utilities

3. SYSTEM TOPOLOGY
                    ┌────────────────────┐
                    │   USER INPUTS      │
                    └────────┬───────────┘
                             │
                             ▼
                ┌─────────────────────────┐
                │  STATE INTERPRETER      │
                └────────┬────────────────┘
                         │
                         ▼
              ┌───────────────────────────┐
              │ BEHAVIORAL ENGINE CORE    │
              │                           │
              │ • trajectory analysis     │
              │ • task intelligence       │
              │ • intervention logic      │
              │ • adaptation engine       │
              │ • sequencing engine       │
              └────────┬──────────────────┘
                       │
                       ▼
             ┌────────────────────────────┐
             │ ADAPTATION PROJECTION      │
             │                            │
             │ • UI adaptation            │
             │ • execution adaptation     │
             │ • guidance adaptation      │
             └────────┬───────────────────┘
                      │
                      ▼
             ┌────────────────────────────┐
             │ PRESENTATION LAYER         │
             └────────────────────────────┘


4. CANONICAL FOLDER STRUCTURE (FROZEN)
This structure is intentionally opinionated.
Do NOT let AI generate random folders.
Do NOT mix:
	• behavioral logic
	• UI logic
	• persistence
	• orchestration
	• domain models

ROOT STRUCTURE
src/
│
├── app/
├── core/
├── engine/
├── domains/
├── orchestration/
├── persistence/
├── adaptation/
├── ui/
├── hooks/
├── services/
├── shared/
├── config/
├── testing/
└── types/


5. FOLDER RESPONSIBILITY FREEZE
/app
Framework entry layer only.
Contains:
	• route registration
	• providers
	• app bootstrapping
	• layout shells
	• navigation mounting
Must NOT contain:
	• behavioral logic
	• task intelligence
	• adaptation decisions
	• intervention logic

/core
Contains:
	• immutable domain primitives
	• enums
	• canonical contracts
	• foundational types
	• engine constants
Examples:
/core/state
/core/tasks
/core/interventions
/core/trajectory
/core/adaptation
This is:
	the language of the operating system.
This folder should change rarely.

/engine
The heart of the entire product.
Contains:
	• behavioral reasoning
	• state interpretation
	• sequencing
	• intervention decisions
	• adaptation computation
	• trajectory analysis
This is the:
	cognitive layer of Momentum OS.

/engine/state
Responsible for:
	• state derivation
	• state transitions
	• state confidence scoring
	• recovery modeling
	• overload detection
Must own:
UserState
ModeTransitions
RecoveryDebt
CognitiveStrain
ExecutionStability

/engine/tasks
Responsible for:
	• task intelligence
	• burden scoring
	• sequencing
	• meaningfulness weighting
	• resistance modeling
	• recovery compatibility
Must NOT:
	• store tasks
	• render tasks
	• mutate UI state

/engine/interventions
Responsible for:
	• intervention triggering
	• intervention suppression
	• cooldown logic
	• escalation logic
	• emotional pacing
Must remain:
	• restrained
	• deterministic
	• interpretable

/engine/adaptation
Responsible for:
	• environmental adaptation
	• execution adaptation
	• guidance adaptation
	• adaptation synthesis
This engine outputs:
AdaptationOutput
NOT:
	• React components
	• styles
	• CSS classes

/engine/trajectory
Responsible for:
	• long-term behavioral direction
	• resilience tracking
	• volatility analysis
	• contraction detection
Trajectory MUST remain independent from:
	• visible mode
	• UI state

/engine/reentry
Responsible for:
	• restart assistance
	• backlog compression
	• recovery-first re-entry
	• rhythm rebuilding
This system is strategically critical.
Most productivity apps psychologically punish inconsistency.
This engine exists to absorb instability intelligently.

6. /domains FREEZE
Domains contain:
	persistent business entities.
NOT behavioral intelligence.

/domains/tasks
Contains:
	• task entity definitions
	• repositories
	• serializers
	• task persistence mapping
NOT:
	• sequencing logic
	• burden analysis
	• avoidance detection

/domains/user
Contains:
	• preferences
	• onboarding profile
	• personalization settings
	• user metadata
NOT:
	• behavioral state interpretation

/domains/session
Contains:
	• daily check-ins
	• reflection records
	• execution logs
	• calibration sessions
This is:
	raw behavioral evidence storage.
NOT:
	interpreted truth.

7. /orchestration FREEZE
This layer coordinates engines.
It does NOT:
	• contain reasoning
	• compute behavioral intelligence
It orchestrates flows.

Example
MorningCalibrationFlow
Coordinates:
	1. fetch latest behavioral data
	2. run state interpreter
	3. run sequencing engine
	4. run adaptation engine
	5. produce UI-ready payload
This prevents:
	• behavioral logic leaking into screens

8. /adaptation FREEZE
This layer maps:
behavioral adaptation
→ UI projection

VERY IMPORTANT.
The engine should NEVER directly manipulate UI.
Instead:
Behavioral Engine
        ↓
Adaptation Projection
        ↓
UI Consumption


Example
Behavioral engine outputs:
{
  interfaceDensity: 0.2,
  visibleTaskLimit: 2,
  motionIntensity: 0.1
}
The adaptation layer translates that into:
	• spacing tokens
	• layout behavior
	• animation reduction
	• component density
This prevents:
	• behavioral coupling to frontend frameworks

9. /ui FREEZE
UI is:
	a projection layer.
NOT:
	a reasoning layer.
Contains:
	• components
	• design system
	• layouts
	• visual composition
	• animation systems
Must NEVER:
	• compute state
	• infer overload
	• determine interventions
	• evaluate meaningfulness

10. /services FREEZE
Services handle:
	• external systems
	• APIs
	• notifications
	• auth
	• analytics
	• sync
Services must remain:
	• behaviorally dumb
Critical principle:
Services fetch and persist.
Engines interpret.

11. STATE AUTHORITY MODEL (CRITICAL)
This is one of the most important freezes in the entire architecture.
If you fail this:
the app becomes incoherent.

SINGLE SOURCE OF TRUTH
Behavioral Engine owns behavioral state.
NOT:
	• frontend stores
	• React context
	• local UI state
	• components
	• services

STATE HIERARCHY
RAW INPUTS
    ↓
INTERPRETED STATE
    ↓
ADAPTATION OUTPUTS
    ↓
UI PROJECTION


RAW INPUTS
Examples:
	• sleep quality
	• overwhelm
	• completion integrity
	• fragmentation
These are:
	evidence
NOT:
	conclusions

INTERPRETED STATE
Generated ONLY by:
/engine/state
Contains:
	• recovery debt
	• execution stability
	• overload risk
	• trajectory
	• emotional friction
This is:
	computed behavioral interpretation

ADAPTATION OUTPUTS
Generated ONLY by:
/engine/adaptation
Contains:
	• visible task limits
	• density
	• pacing
	• guidance tone
	• workload compression

UI PROJECTION
Generated ONLY by:
/adaptation
The UI consumes:
	• projections
	• tokens
	• visual states
NOT:
raw behavioral state.
This separation is essential.

12. CANONICAL DATA FLOW
User Interaction
      ↓
Raw Session Capture
      ↓
Behavioral Interpretation
      ↓
Trajectory Analysis
      ↓
Task Intelligence
      ↓
Intervention Evaluation
      ↓
Adaptation Generation
      ↓
UI Projection
      ↓
Rendered Experience

NO SHORTCUTS.

13. PERSISTENCE MODEL FREEZE
Another critical freeze.
Do NOT persist:
derived behavioral interpretations unnecessarily.
Persist:
	• raw evidence
	• canonical entities
	• historical logs
Recompute:
	• behavioral intelligence
This prevents:
	• stale interpretation corruption
	• incoherent adaptation drift
	• invalid state persistence

WHAT SHOULD BE PERSISTED
Persist Raw Inputs
sleep quality
energy
overwhelm
task events
reflection responses
completion logs
focus sessions

Persist Domain Entities
tasks
projects
user preferences
sessions
daily records

Persist Historical Behavioral Events
interventions fired
mode transitions
trajectory shifts
re-entry activations
Important:
These are historical logs,
NOT authoritative current state.

WHAT SHOULD NOT BE PERSISTED AS AUTHORITY
NEVER persist as primary truth:
current overload state
current burnout classification
current adaptation output
current execution stability
These must remain:
	computed interpretations.

WHY THIS MATTERS
If you persist interpreted states directly:
you create:
	• stale behavioral reasoning
	• contradictory adaptation
	• broken transitions
	• false intelligence
The engine must recompute state from evidence.
Always.

14. EVENT MODEL FREEZE
Momentum OS should become:
	event-driven internally.
NOT:
CRUD-driven.

EXAMPLE EVENTS
TaskCompleted
FocusSessionStarted
ReflectionSubmitted
OverloadDetected
RecoveryDebtIncreased
ModeTransitioned
InterventionTriggered
ReentryProtocolStarted
This architecture allows:
	• replayability
	• explainability
	• debugging
	• future intelligence expansion

15. ENGINE BOUNDARY RULES
Engine Rules
Each engine:
	• receives inputs
	• computes interpretation
	• returns outputs
Engines must NOT:
	• mutate UI
	• fetch APIs directly
	• store persistence directly
	• trigger navigation

Example
BAD:
intervention engine → opens modal

GOOD:
intervention engine
    ↓
returns intervention contract
    ↓
UI decides rendering


16. AI GENERATION SAFETY RULES
This section exists because AI-assisted coding can silently destroy architecture.

NEVER ALLOW AI TO:
1. Put reasoning in components
BAD:
if (overwhelm > 7) {
  showRecoveryUI()
}
Reason:
Behavioral interpretation leaked into presentation.

2. Duplicate scoring logic
All scoring logic must exist:
ONCE.
Centralized.
Otherwise:
you create contradictory behavior.

3. Create parallel state systems
There must NEVER be:
	• frontend behavioral stores
	• backend behavioral stores
	• duplicated adaptation logic
One authority system only.

4. Invent new behavioral concepts casually
No random:
	• “focus score”
	• “discipline index”
	• “motivation meter”
Every behavioral construct must originate from:
	• canonical engine contracts

5. Persist UI-derived emotional interpretations
The UI must NEVER infer:
	• burnout
	• overload
	• avoidance
	• emotional state
Only engines may interpret behavior.

17. RECOMMENDED TECHNICAL STACK BOUNDARY
Do NOT overengineer this early.
You are building:
	• a behavioral operating system
NOT:
	• distributed infrastructure.

Recommended Shape
Frontend
Next.js / React

State Management
Zustand
ONLY for:
	• UI state
	• session cache
	• view state
NOT:
behavioral authority.

Backend
Supabase
Good fit because:
	• auth
	• relational storage
	• realtime support
	• rapid iteration

Engine Runtime
Keep engine:
pure TypeScript
No framework dependency.
Critical.

18. TESTING ARCHITECTURE FREEZE
You MUST test:
behavioral interpretation.
NOT just components.

Required Test Layers
Engine Unit Tests
Test:
	• state transitions
	• overload detection
	• sequencing logic
	• intervention suppression
	• recovery balancing

Simulation Tests
Feed:
	• synthetic behavioral timelines
Verify:
	• adaptation coherence
This is extremely important.
Your app’s intelligence is temporal.
Test time-based behavior.

Regression Tests
Protect against:
	• AI-generated logic drift
	• scoring inconsistency
	• intervention inflation

19. VERSIONING RULE
All behavioral logic should be versioned.
Example:
State Engine v1
Task Intelligence v1
Intervention Matrix v1
Because eventually:
you WILL evolve the engine.
Without versioning:
historical interpretation becomes incoherent.

20. FINAL ARCHITECTURAL LAW
Momentum OS must remain:
behavior-first
engine-centered
state-coherent
adaptation-driven
trustworthy
interpretable
emotionally restrained
If you violate:
	• engine boundaries
	• state authority
	• adaptation separation
the product will slowly collapse into:
	• feature sprawl
	• fake intelligence
	• UI-driven chaos
	• productivity aesthetic theater
The architecture exists to prevent that.

