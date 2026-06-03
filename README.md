## Cadence (momentum-os)

A client-first behavioral productivity app focused on measurement, intelligent check-ins, and recovery protocols to help users build consistent execution.

## Features
- Weighted daily Execution Score and momentum tracking (derived selectors in [src/lib/store.ts](src/lib/store.ts)).
- Five-step Smart Check-In wizard that computes scores, captures blockers, and generates a `tomorrowPlan` ([src/components/check-in/CheckInWizard.tsx](src/components/check-in/CheckInWizard.tsx)).
- Streaks, resilience, and recovery-mode logic (store & selectors in [src/lib/store.ts](src/lib/store.ts)).
- Behavioral Insights system with commit tracking and effectiveness analysis ([src/lib/store.ts](src/lib/store.ts)).
- Six recovery protocols with 24-hour + 3-day roadmaps ([src/lib/recovery-data.ts](src/lib/recovery-data.ts)).
- Tomorrow planning (capacity-aware task suggestions) and task intelligence.
- 28-day demo data seeding for first-run exploration ([src/lib/demo-data.ts](src/lib/demo-data.ts)).
- Heatmap and analytics visualizations ([src/components/heatmap.tsx](src/components/heatmap.tsx)).
- Optional Supabase sync for cloud persistence ([src/lib/supabase.ts](src/lib/supabase.ts)).
- SSR-ready with a Vercel adapter ([api/server.js](api/server.js), [src/server.ts](src/server.ts), [vercel.json](vercel.json)).

## Demo / Example
Quick local demo using seeded demo data:

```bash
git clone <repo-url> momentum-os
cd momentum-os
npm install
npm run dev
# Open http://localhost:5173
```

In the running app you'll see the Today dashboard (Execution Score, Momentum, Streaks), the Check-In flow (evening reflection), and the Recovery protocols when a low score is detected. Demo data is seeded on first load so the analytics and insights panels are populated automatically ([src/lib/demo-data.ts](src/lib/demo-data.ts)).

## Installation
Prerequisites:
- Node.js and npm (no `engines` field is declared in `package.json`; Node 18+ is recommended but not strictly specified).

Steps:

```bash
npm install
npm run dev      # development server (Vite) → http://localhost:5173
npm run build    # production build (outputs to dist/)
npm run preview  # preview production build locally
```

Code quality / tooling:

```bash
npm run lint
npm run format
```

## Usage
- Open the app at `http://localhost:5173` while running `npm run dev`.
- Use the sidebar or the command palette (Cmd/Ctrl+K) to navigate to **Today**, **Dashboard**, **Check-in**, **Recovery**, and **Insights**.
- Complete an evening check-in to exercise the `saveCheckIn()` flow: it recalculates the day's Execution Score, persists history to the local store, captures blockers, computes streaks, and generates a `tomorrowPlan` ([src/lib/store.ts](src/lib/store.ts)).
- Optionally connect Supabase (see Configuration) to persist across devices.

## Project Structure (important files)
- [src/lib/store.ts](src/lib/store.ts) — central Zustand store, selectors, and core actions (check-ins, insights, recovery).
- [src/components/check-in/CheckInWizard.tsx](src/components/check-in/CheckInWizard.tsx) — the multi-step check-in flow.
- [src/lib/recovery-data.ts](src/lib/recovery-data.ts) — the six recovery protocols and roadmaps.
- [src/lib/demo-data.ts](src/lib/demo-data.ts) — demo history, insights, and members seeded on first load.
- [src/components/heatmap.tsx](src/components/heatmap.tsx) — visual heatmap of execution history.
- [src/routes/__root.tsx](src/routes/__root.tsx) — root layout, command palette, and global UI shells.
- [src/server.ts](src/server.ts) and [api/server.js](api/server.js) — SSR entry and Vercel adapter.
- [vite.config.ts](vite.config.ts) — Vite + TanStack Start configuration.

## Technologies Used
- React 19 with TanStack Start/TanStack Router
- Zustand for client state with localStorage persistence
- Vite for local dev and builds
- Tailwind CSS and Radix UI primitives (shadcn-style components)
- Framer Motion for UI motion/animation
- Recharts for charts/analytics
- Supabase JS SDK (optional) for cloud sync

## Configuration
Optional environment variables (only needed for Supabase features):

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

These are read by [src/lib/supabase.ts](src/lib/supabase.ts). Without these variables the app remains fully functional locally (localStorage-backed). Deployment to Vercel uses [vercel.json](vercel.json) and the build output is emitted under `dist/`.

## Future Improvements
- Add automated tests (unit + e2e) and CI.
- Add CONTRIBUTING.md and issue/PR templates.
- Add screenshots and a short demo video in `docs/`.
- Improve onboarding customization and add account migration tools for Supabase users.
- Add analytics & telemetry opt-in (if desired).

## Learning Outcomes
- Building an offline-first single-page app with an opinionated centralized store (Zustand).
- Designing metrics and derived selectors (Execution Score, Momentum, Resilience).
- Implementing SSR and serverless adapters for deployment (TanStack Start + Vercel).
- Creating a data-driven user experience: demo seeding, insights, and recovery automation.
- UI composition using Radix primitives, Tailwind, and motion patterns with Framer Motion.

## Contributing
- Open an issue for a bug or feature request.
- Fork the repo, create a feature branch, and open a pull request.
- Run `npm run lint` and `npm run format` before submitting.
- There are currently no automated tests; please add tests for non-trivial changes.

## License
This repository is available under the Apache License, Version 2.0. See [LICENSE](LICENSE) for the full text.

## Why I Built This
Cadence is designed to be a compact, evidence-informed productivity OS that helps people recover from dips in execution and build consistent habits. Engineering decisions prioritized:

- Offline-first UX (localStorage + demo seeding) so users can get value immediately without signing up.
- A single source of truth (`src/lib/store.ts`) to make derived metrics and cross-feature intelligence reliable.
- Optional cloud sync (Supabase) to keep client-first design while enabling persistence when desired.

## Challenges Solved
- Measuring and synthesizing noisy behavioral signals into a single Execution Score, while keeping the calculation interpretable (selectors in [src/lib/store.ts](src/lib/store.ts)).
- Designing a check-in flow that both captures qualitative blockers and produces actionable, capacity-aware tomorrow plans ([src/components/check-in/CheckInWizard.tsx](src/components/check-in/CheckInWizard.tsx)).
- Enabling graceful SSR failure handling and robust serverless deployment via the adapter ([api/server.js](api/server.js), [src/server.ts](src/server.ts)).

---

Missing / Ambiguous information
- Project metadata: repository `author` and public demo URL were provided manually and included in this README; if you want them shown differently please edit the top-level heading.
- No tests or CI configuration present; adding a test runner and CI pipeline is recommended.

If you want this file updated (add screenshots, change tone, or include more examples), tell me which sections to expand and I will update the repo README.

---

Author: Om Jhamvar — omjhamvar29@gmail.com
