# GEMINI.md — Cadence Project Instructions

## Project Overview

**Cadence** (momentum-os) is a behavioral productivity app built as a "Psychologically Aware OS" for ambitious people. It focuses on recovering from inconsistency, preventing motivation crashes, and building reliable execution through metrics and adaptive coaching.

- **Architecture:** TanStack Start (SSR React meta-framework)
- **Deployment:** Cloudflare Workers (configured in `wrangler.jsonc`)
- **State Management:** Single Zustand store (`src/lib/store.ts`) with `localStorage` persistence.
- **Database:** None (purely client-side data, seeded with 28 days of synthetic history).
- **Styling:** Tailwind CSS 4.0
- **UI Components:** shadcn/ui (Radix UI) + custom primitives in `src/components/ui-bits.tsx`.
- **Motion:** Framer Motion with custom patterns in `src/lib/motion.tsx`.

## Commands

```bash
npm run dev        # Start dev server (Vite, http://localhost:5173)
npm run build      # Production build
npm run build:dev  # Development build
npm run preview    # Preview production build locally
npm run lint       # ESLint (flat config, ESLint 9.x)
npm run format     # Prettier format all files
```

_Note: There are currently no automated tests in this project._

## Development Conventions

### Routing

- File-based routing via TanStack Router in `src/routes/`.
- Root layout is in `src/routes/__root.tsx`.
- Key routes: `/` (Today), `/dashboard` (Analytics), `/check-in` (Daily Review), `/recovery` (System Reset).

### State Management (`src/lib/store.ts`)

- All app state lives in a single Zustand store.
- **Key Concepts:**
  - `Execution Score`: Weighted signal (tasks, focus, energy, sleep, distractions, honesty).
  - `Recovery Mode`: Triggers when score < 45; auto-exits > 70. Adjusts UI and coaching.
  - `Maturity Levels`: `calibrating` -> `building` -> `consistent` -> `advanced` -> `resilient`.
  - `Derived Selectors`: Use hooks like `useExecutionScore()`, `useMomentum()`, `useUserState()`, and `useResilience()` to access computed state.

### Component Layers

1.  **`src/components/ui/`**: Standard shadcn/ui components. Treat as a library.
2.  **`src/components/ui-bits.tsx`**: Custom project-specific primitives (`ScreenHeader`, `Card`, `StatLabel`, `Pill`, `Ring`, `Sparkline`, `BarRow`). **Prefer these over raw shadcn/ui for consistency.**
3.  **`src/components/cards/`**: Domain-specific cards like `StateRibbon` and `BehavioralNote`.

### Motion & Animation (`src/lib/motion.tsx`)

- Always follow these patterns to maintain the "alive" feel:
  - Use `<Stagger>` and `<StaggerItem>` for sequential list entrances.
  - Use `<FadeUp>` for scroll-triggered entrances.
  - Wrap cards in `<TapCard>` for hover (`y: -2`) and tap (`scale: 0.985`) interactions.
  - Use `<AnimatedNumber>` for metric transitions.

### Styling

- Uses Tailwind CSS 4.0.
- Custom colors and tokens are defined in `src/styles.css`.
- Uses `oklch` for color definitions.
- Responsive design: Mobile-first, with a dedicated `BottomNav` for mobile and `Sidebar` for desktop (configured in `__root.tsx`).

### Imports

- Use the `@/*` path alias for all imports from the `src` directory.

## Architecture Map

- `src/server.ts`: Entry point for Cloudflare Workers.
- `src/start.ts`: Client-side entry point.
- `src/router.tsx`: TanStack Router configuration.
- `src/lib/utils.ts`: Standard utility functions (cn, etc.).
- `src/lib/motion.tsx`: Animation primitives.
- `src/lib/store.ts`: The "brain" of the app (Zustand store + selectors).
