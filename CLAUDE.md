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

There are no tests in this project.

## Architecture

**Cadence** is a behavioral productivity app built on TanStack Start (SSR React meta-framework) deployed to Cloudflare Workers.

### Routing

File-based routing via TanStack Router in `src/routes/`. The root layout (`__root.tsx`) wraps all pages with the sidebar, bottom nav, command palette, and aurora background. The 11 routes are:

| Route         | Purpose                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------- |
| `/`           | Today — daily dashboard, execution score, task list, morning briefing, streak pill       |
| `/dashboard`  | Command center — analytics, heatmaps, KPIs, burnout risk                                 |
| `/check-in`   | Evening reflection form (focus, energy, mood, sleep, distractions, tomorrow forecast)    |
| `/insights`   | Behavioral diagnostics — distraction impact, blocker patterns, day-of-week profile, task intelligence, insight effectiveness |
| `/weekly`     | Weekly patterns, day-of-week bars, distraction mix, streak stats                         |
| `/recovery`   | Root cause analysis, personalized protocol matching, minimum viable day protocols        |
| `/circles`    | Trusted circles — execution proof feed                                                   |
| `/identity`   | User profile, streak history, operating protocols with effectiveness ratings             |
| `/premium`    | Cadence Pro subscription page                                                            |
| `/onboarding` | New user onboarding flow                                                                 |

### State Management

All app state lives in a **single Zustand store** (`src/lib/store.ts`) persisted to localStorage under the key `"cadence-store-v1"`. There is no backend or API — all data is client-side, seeded with 28 days of synthetic history on first load.

Key state shape:

- **User setup**: `onboarded`, `goals`, `struggles`, `profile` (OnboardingProfile)
- **Daily data**: `tasks` (Task[]), `checkIns` (CheckIn[]), `history` (DayData[] — 28d+)
- **Intelligence data**: `blockerHistory` (BlockerRecord[]), `distractionLog` (DistractionLogEntry[])
- **Streaks**: `streaks` (StreakState — exec streak, resilience streak, quick recoveries)
- **Cross-day planning**: `tomorrowPlan` (TomorrowPlan | null — generated at end of each check-in)
- **Recovery system**: `recoveryMode`, `recoveryReason`, `recoveryPlan`
- **Engagement**: `premium`, `insights` (BehavioralInsight[]), `daysOnApp`, `proofs` (ExecutionProof[])

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

### Component Layers

1. **`src/components/ui/`** — shadcn/ui components (radix-ui primitives). Treat as a library; don't modify unless adding a new primitive.
2. **`src/components/ui-bits.tsx`** — Custom composed primitives used across the app: `ScreenHeader`, `Card`, `StatLabel`, `Pill`, `Ring` (SVG circular progress), `Sparkline`, `BarRow`. Use these before reaching for raw shadcn/ui.
3. **`src/components/cards/`** — Domain cards: `StateRibbon`, `BehavioralNote`.
4. **`src/components/atmosphere/`** — `AuroraBackground` decorative animated background.
5. **`src/components/command/`** — `CommandPalette` (cmd+k).
6. **`src/components/heatmap.tsx`** — Execution heatmap visualization.
7. **`src/components/check-in/CheckInWizard.tsx`** — 5-step wizard. Uses `useSmartCheckInDefaults()` for personalized slider starting values.

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

### Path Alias

`@/*` maps to `src/*` — use this for all imports.

### Deployment

Cloudflare Workers via `wrangler.jsonc`. The Vite config (`vite.config.ts`) uses `@lovable.dev/vite-tanstack-config` and redirects TanStack Start's SSR server entry to `src/server.ts` for custom error handling.
