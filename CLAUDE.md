# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite, http://localhost:5173)
npm run build      # Production build
npm run build:dev  # Development build
npm run preview    # Preview production build locally
npm run lint       # ESLint (flat config, ESLint 9.x)
npm run format     # Prettier format all files
```

```bash
npm run test       # Run all Vitest tests (engine layer)
npm run test:watch # Watch mode
```

Tests live exclusively in `src/engine/` — the UI layer has no tests.

## Architecture

**North** (formerly Cadence) is a **behavioral regulation engine with a projected interface** — not a UI-first app. The engine is the product; React components project its output. Built on TanStack Start (SSR React meta-framework) deployed to Vercel.

### Routing

File-based routing via TanStack Router in `src/routes/`. The root layout (`__root.tsx`) wraps all pages with the sidebar, bottom nav, command palette, and aurora background. The 11 routes are:

| Route         | Purpose                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `/`           | Today — daily dashboard, execution score, task list, morning briefing, streak pill                                           |
| `/dashboard`  | Command center — analytics, heatmaps, KPIs, burnout risk                                                                     |
| `/check-in`   | Evening reflection form (focus, energy, mood, sleep, distractions, tomorrow forecast)                                        |
| `/insights`   | Behavioral diagnostics — distraction impact, blocker patterns, day-of-week profile, task intelligence, insight effectiveness |
| `/weekly`     | Weekly patterns, day-of-week bars, distraction mix, streak stats                                                             |
| `/recovery`   | Root cause analysis, personalized protocol matching, minimum viable day protocols                                            |
| `/circles`    | Trusted circles — execution proof feed                                                                                       |
| `/identity`   | User profile, streak history, operating protocols with effectiveness ratings                                                 |
| `/premium`    | Cadence Pro subscription page                                                                                                |
| `/onboarding` | New user onboarding flow                                                                                                     |
| `/sign-in`    | Auth page — email/password + Google OAuth; `?mode=upgrade` variant for guest-to-account migration                            |
| `/demo`       | Read-only demo mode — loads seeded history via `loadDemoData()`, sets `dataIsSeeded: true`                                   |

### Auth & Backend

The app uses **Supabase** for auth and cloud persistence. Required env vars (create a `.env.local`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The app is **guest-first**: users can use it without an account. Local state is persisted to localStorage. When a user signs up/in, `hydrateFromDB()` (`src/lib/sync.ts`) loads their cloud state and `buildMigrationPayload()` (`src/lib/migration.ts`) merges local guest state with cloud data (history: higher score wins; cloud wins on check-in conflicts; insights: most advanced state wins; dismissed is sticky).

Supabase tables: `profiles`, `day_logs`, `check_ins`, `tasks`, `insights`, `personal_proofs`, `circle_proofs`.

Auth actions on the store: `signIn(email, pw)`, `signUp(email, pw)`, `signInWithGoogle()`. All three trigger hydration + migration on success. The `SaveProgressBanner` component surfaces the upgrade prompt to guest users with existing data.

### State Management

All app state lives in a **single Zustand store** (`src/lib/store.ts`) persisted to localStorage under the key `"cadence-store-v1"`. On first load (no Supabase account), the store seeds 28 days of synthetic history via `src/lib/demo-data.ts`.

Key state shape:

- **User setup**: `onboarded`, `goals`, `struggles`, `profile` (OnboardingProfile)
- **Auth**: `currentUserId` (string | null — null = guest), `dataIsSeeded` (boolean — true when demo data is loaded)
- **Daily data**: `tasks` (Task[]), `checkIns` (CheckIn[]), `history` (DayData[] — 28d+)
- **Intelligence data**: `blockerHistory` (BlockerRecord[]), `distractionLog` (DistractionLogEntry[])
- **Streaks**: `streaks` (StreakState — exec streak, resilience streak, quick recoveries)
- **Cross-day planning**: `tomorrowPlan` (TomorrowPlan | null — generated at end of each check-in)
- **Recovery system**: `recoveryMode`, `recoveryReason`, `recoveryPlan`
- **Engagement**: `premium`, `insights` (BehavioralInsight[]), `daysOnApp`, `proofs` (ExecutionProof[]), `personalProofs` (personal proof-of-work entries)

**Core derived selector hooks** (computed real-time, not persisted):

- `useExecutionScore()` — today's weighted score (taskRatio 35%, focus 22%, sleep 14%, energy 12%, distractions 10%, honesty 7%), clamped 15–100
- `useMomentum()` — `{delta, trend}` comparing last 7d avg to prior 7d avg
- `useConsistency(days)` — % of days with score ≥ 60
- `useUserState()` — behavioral state machine: `"peak" | "steady" | "building" | "burnout" | "recovery"`
- `useResilience()` — bounce-back speed from dips
- `useMaturityLevel()` — progression level based on daysOnApp + consistency
- `useFakeProductivityFlags()` — detects plan-execute ratio issues, overplanning, sleep debt

**Intelligence selector hooks** (added in the logic enhancement pass):

- `useDistractionProfile()` — correlates each distraction type (phone, social, fatigue…) with execution score delta. Returns `topDistractors[{id, frequency, avgScoreImpact}]` and weekday pattern.
- `useDayOfWeekProfile()` — computes avg score/sleep/focus/planned per weekday from full history. Returns `byDay`, `bestDay`, `worstDay`, `overplanDays[]`.
- `useSmartCheckInDefaults()` — personalizes check-in slider defaults from 7d rolling avg sleep/focus. Carries last check-in's energy and `tomorrowFocus` forward.
- `useBlockerPattern()` — aggregates `blockerHistory` over 14d. Returns `dominantBlocker`, streak detection (3+ consecutive days same blocker), and contextual recommendation.
- `useStreakContext()` — tracks execution streak (consecutive days ≥60) and resilience streak (never missed twice in a row). Returns `atRisk`, `milestoneLabel`, `quickRecoveries`.
- `useTaskIntelligence()` — computes `todayLoadRisk` (overloaded/optimal/underloaded), `typeBalanceWarning`, `rescheduleAlerts` (tasks with `rescheduled ≥ 2`), and `suggestedCap`.
- `usePersonalizedRecoveryMatch()` — scores all 6 recovery protocols against onboarding struggles, dominant blocker, and recent history signals. Returns `recommendedProtocol` with `confidence` and `reasoning`.
- `useInsightEffectiveness()` — for each committed insight, compares avg score before vs after commitment. Returns `verdict: "working" | "too-early" | "not-working" | "plateau"` and `delta`.
- `useTomorrowBriefing()` — reads `tomorrowPlan` from store. Returns northStar, suggested tasks, capacity forecast, and a human-readable `insight` string for the morning card.

**Key actions:**

- `saveCheckIn(data)` — computes score, updates history, **captures blocker history**, **preserves distraction types**, **computes streaks**, **generates tomorrowPlan**
- `commitToInsight(id, rule)` — snapshots current 7d avg score as `preCommitAvgScore` for effectiveness tracking
- `acceptTomorrowPlan()` — copies `tomorrowPlan.suggestedTasks` into active `tasks[]` and clears the plan
- `rescheduleTask(id)` — increments `task.rescheduled` counter (feeds `useTaskIntelligence`)

**Recovery mode** auto-triggers when execution score < 45 and auto-exits when score > 70.

### Intelligence Data Flow

Understanding how new data flows through the system:

1. **Check-in → blockerHistory**: incomplete tasks with blocker tags in `CheckInWizard` are cross-referenced on `saveCheckIn()` and pushed to `blockerHistory[]`
2. **Check-in → distractionLog**: `distractions: string[]` is preserved in `distractionLog[]` before collapsing to a count in `DayData`
3. **Check-in → streaks**: `saveCheckIn()` recomputes both execution and resilience streaks against full history
4. **Check-in → tomorrowPlan**: day-of-week profile + rescheduled tasks → capacity-aware suggested task list, stored as `tomorrowPlan`
5. **commitToInsight → preCommitAvgScore**: 7d avg score is snapshotted at commit time, enabling future `useInsightEffectiveness()` comparisons

### Behavioral Engine (`src/engine/`)

The engine layer is pure TypeScript with no React dependencies. It runs in a defined pipeline sequence and is the only place behavioral logic lives. Sub-systems:

| Sub-system | Path | Responsibility |
|---|---|---|
| Signal Engine | `engine/signals/` | Builds `SignalSnapshot` from store data |
| State Engine | `engine/state/` | Classifies `UserMode` (peak/steady/building/burnout/recovery) + trajectory |
| Intervention Engine | `engine/interventions/` | Evaluates which interventions to fire; applies eligibility, cooldown, and suppression rules |
| Adaptation Engine | `engine/adaptation/` | Produces `AdaptationDirectives` (intensity, pacing, tone, expansion flags) |
| Guidance Engine | `engine/guidance/` | Generates surface-level copy (`hero-headline`, `morning-insight`, etc.) using tone vocabulary |
| Pattern Engine | `engine/patterns/` | Detects recurring behavioral patterns with confidence decay |
| Momentum Engine | `engine/momentum/` | Computes `MomentumModel` (trajectory, collapse risk) |
| Expansion Engine | `engine/expansion/` | Decides when to increase challenge level |
| Avoidance Engine | `engine/avoidance/` | Detects task-avoidance behavior patterns |
| Orchestrator | `engine/orchestrator/pipeline-runner.ts` | Sequences all engines; the single integration point between Zustand and engine layer |

**Pipeline order:** Signal Engine → State Engine → Task Engine → Intervention Engine → Adaptation Engine → Guidance Engine

The orchestrator receives plain data parameters (no Zustand imports) and returns a `BehavioralPipeline`. The `evidence-bridge.ts` converts store state to `SessionEvidence[]` before the pipeline runs.

**React integration:** `useBehavioralIntelligence()` in `src/lib/behavioral-intelligence.ts` is the primary hook that runs the pipeline from within React and returns a `BehavioralIntelligence` composite object for components to consume.

### Core Contracts Layer

`src/core/contracts/` is a pure TypeScript type system (no runtime logic) that defines the behavioral engine's domain model. It is re-exported from `src/core/index.ts`. Sub-domains:

- `state/` — `UserState` machine modes, dimensions, transitions, snapshots, historical, evaluation, confidence, explanation
- `signals/` — `BehavioralSignals`, `DailyInputs`, `SessionEvidence`, `SignalSnapshot`
- `tasks/` — task type, sequencing, reasoning, scores, compatibility
- `interventions/` — intervention types, triggers, evaluation, audit
- `adaptation/` — directives, environmental, execution, guidance, output, trace
- `patterns/` — pattern association, confidence, evidence, suppression, templates
- `momentum/` — `MomentumModel`
- `guidance/` — depth, messages, output, visibility
- `history/` — confidence, evidence, period, snapshot, trend
- `replay/` — attribution, forecast, narrative, transition
- `flow/` — morning, midday, evening, reflection check-in flow contracts
- `reentry/` — protocol contracts for returning after breaks
- `pipeline/` — `BehavioralPipeline`, insight pipeline contracts

Import from `@/core` (not the sub-paths) to get all contracts. Do not add runtime code here — this layer is types only.

### Progressive Disclosure (Maturity System)

`src/lib/maturity.ts` gates features by check-in count to avoid overwhelming new users:

- `useDataReadiness(metric)` — returns `{hasMinimum, evidenceCount, confidence}` per metric. Each `MetricKey` has a minimum check-in threshold before it shows real data.
- `useUserStage()` → `"fresh" | "exploring" | "establishing" | "established"` based on check-in count (0 / <7 / <21 / 21+). `dataIsSeeded` always returns `"established"`.
- `useVisibleRoutes()` — returns the subset of nav routes available at the user's stage. Always-visible: `today`, `reflect`, `identity`. Unlocked progressively: `this-week` (7+), `patterns` (10+), `circles` (7+). Recovery is always reachable.

When adding a new analytics feature, check `useDataReadiness()` and gate behind `hasMinimum` to avoid showing empty/misleading charts to new users.

### Component Layers

1. **`src/components/ui/`** — shadcn/ui components (radix-ui primitives). Treat as a library; don't modify unless adding a new primitive.
2. **`src/components/ui-bits.tsx`** — Custom composed primitives used across the app: `ScreenHeader`, `Card`, `StatLabel`, `Pill`, `Ring` (SVG circular progress), `Sparkline`, `BarRow`. Use these before reaching for raw shadcn/ui.
3. **`src/components/cards/`** — Domain cards: `StateRibbon`, `BehavioralNote`, `FocusWindow`.
4. **`src/components/atmosphere/`** — `AuroraBackground` decorative animated background.
5. **`src/components/command/`** — `CommandPalette` (cmd+k).
6. **`src/components/heatmap.tsx`** — Execution heatmap visualization.
7. **`src/components/check-in/CheckInWizard.tsx`** — 5-step wizard. Uses `useSmartCheckInDefaults()` for personalized slider starting values.
8. **`src/components/MetricSurface.tsx`** — Wrapper that handles data-readiness gating for analytics surfaces.
9. **`src/components/SaveProgressBanner.tsx`** — Prompt shown to guests with data to create an account (links to `/sign-in?mode=upgrade`).
10. **`src/components/help/`** — `HelpButton` + `HelpModal` + `help-content.ts` static help copy.

### Motion & Animation

Framer Motion is used throughout. Key patterns in `src/lib/motion.tsx`:

- `<Stagger>` / `<StaggerItem>` — sequential entrance animations for lists
- `<FadeUp>` — scroll-triggered fade entrance
- `<TapCard>` — hover (`y: -2`) + tap (`scale: 0.985`) micro-interactions
- `<AnimatedNumber>` — animated counter transitions

Always wrap new list-based UI in `Stagger`/`StaggerItem` and new cards in `TapCard` to stay consistent with the motion design.

### Insights System

`BehavioralInsight` objects have `unlocked`, `dismissed`, `committed`, `committedAt`, and `preCommitAvgScore` fields. The `refreshInsights()` action unlocks insights based on behavioral thresholds. After committing, `useInsightEffectiveness()` tracks whether the rule actually moved the score.

The `committedRules[]` array also stores `committedAt` and `preCommitAvgScore` for cross-referencing.

### Recovery Protocols

Six protocols defined in `src/lib/recovery-data.ts`: `burnout`, `procrastination`, `perfectionism`, `low-energy`, `distraction`, `sleep-debt`. Each has MVD tasks, a 24h timeline, and a 3-day roadmap.

`usePersonalizedRecoveryMatch()` scores these against user data and pre-selects the best one in `/recovery` Step 2. The protocol selector still shows all options with a dot indicator on the recommended one.

### Product Language System

`docs/product-language-system.md` is the canonical copy spec. All user-facing strings must conform to it. Core rules:

- **Observational, not evaluative** — report what the data shows; don't interpret what it means about the person
- **Restrained, not emphatic** — no exclamation marks in system-generated copy; no amplifiers ("amazing," "incredible")
- **No cheerleading** — forbidden phrases include "crush it," "proud of you," "you've got this," "don't lose your streak"
- **No certainty claims** — never predict outcomes with certainty
- **No shame** — never frame a dip, missed day, or low score as failure

The guidance engine (`src/engine/guidance/tone-system/`) enforces these rules programmatically via `ToneVocabulary` per tone mode and `enforce()` in `trust-boundaries.ts`.

`docs/product-language-audit.md` tracks known copy violations in the existing codebase.

### Path Alias

`@/*` maps to `src/*` — use this for all imports.

### Deployment

Vercel via `vercel.json`. Build outputs to `dist/client/` (static) and `dist/server/server.js` (SSR). The Vercel serverless adapter lives in `api/server.js` and bridges Vercel's Node.js `(req, res)` handler to TanStack Start's fetch-based server entry. The Vite config (`vite.config.ts`) uses `@lovable.dev/vite-tanstack-config` with `cloudflare: false` and redirects TanStack Start's SSR server entry to `src/server.ts` for custom error handling.
