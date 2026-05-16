
# Cadence — UI/UX Upgrade Plan

Goal: make the product feel alive, premium, and emotionally responsive — without touching business logic. All work is presentation-only: typography rhythm, motion, depth, micro-interactions, and a few new visual surfaces that make the existing data feel meaningful.

---

## 1. Motion & micro-interactions (highest impact)

Add `framer-motion` (presentation only — purely animation).

- **Page transitions**: subtle fade + 6px upward slide between routes via a `<MotionOutlet>` wrapper in `__root.tsx`.
- **Staggered entry**: cards on Today, Dashboard, Insights animate in sequence (40ms stagger, spring).
- **Number counters**: Execution Score, Resilience, %s count up on mount (`useMotionValue` + `animate`).
- **Ring progress**: animate `strokeDashoffset` from 0 → value with easing; pulse the ring softly when score changes.
- **Task check**: when a task is toggled, play a tactile check animation (ring fills, label strikes through with a sweep, row dims).
- **Tap feedback**: scale 0.97 on press for all interactive cards/buttons (`whileTap`).
- **Hover lift**: glass cards rise 2px + shadow deepens on hover (desktop).
- **Sparkline draw-on**: trend line draws left-to-right on mount.

## 2. Visual depth & atmosphere

- **Aurora background**: a soft, slow-drifting gradient blob layer behind the app shell (CSS `radial-gradient` + `@keyframes`), color-shifted per user state (peak = warm amber, burnout = cool blue, recovery = muted green).
- **Grain overlay**: 4% noise SVG over the background for a tactile, editorial feel.
- **Glass refinement**: tighten border (`1px solid color-mix(white 6%)`), add inner highlight (`inset 0 1px 0 white/8%`), and a stronger ambient shadow.
- **Section dividers**: replace hard borders with hairline gradient rules that fade at the edges.

## 3. Typography & rhythm

- Pair `Instrument Serif` (display) with `Geist Mono` for numbers/labels — gives metrics a "terminal/cockpit" feel.
- Introduce a clear scale: 56 / 32 / 20 / 15 / 13 / 11 with tightened letter-spacing on display sizes.
- Use italic `Instrument Serif` for emotional copy (greetings, recovery prompts) to add warmth.

## 4. New presentational surfaces

These are pure UI components — you wire data later.

- **State Ribbon (top of Today)**: a thin horizontal strip visualising the user's last 14 days as colored dots with today highlighted; click a dot to preview that day in a side drawer.
- **Focus Window card**: a clock-style radial showing today's protected deep-work windows vs distraction risk hours.
- **Behavioral Pattern card**: an editorial "AI note" with serif quote, e.g. *"You over-plan on Sundays. Consider committing to 3 priorities, not 6."* — with confidence chip and a "Dismiss / Save" row.
- **Identity Progress arc**: replace the flat identity bar with a layered arc + tier badge that fills smoothly.
- **Command Palette** (`⌘K`): visual-only overlay for quick nav between routes, with recent actions and keyboard hints. Adds a power-user feel.
- **Empty-state illustrations**: hand-drawn SVG line art for empty Insights, Circles, Weekly — instead of plain text.
- **Toast system**: minimal bottom-center toast for actions like "Priority added", "Recovery activated" (using `sonner`, already common).

## 5. Route-specific polish

- **Today**: hero block gets a soft animated gradient halo behind the score ring; "Today's Flow" becomes a connected timeline with a live indicator dot.
- **Dashboard**: KPI cards get sparkline backgrounds (ghosted), and the heatmap cells get a hover tooltip with the day's score breakdown.
- **Check-in**: full-screen step flow with progress dots, large serif questions, slider with haptic-style snap, and a closing "summary card" animation.
- **Recovery**: cinematic intro — dim the shell, fade in a centered protocol card with a breathing animation on the icon; protocol options as large tactile tiles.
- **Insights**: pattern cards reorganised into an editorial feed (image-less magazine layout) with category chips.
- **Identity**: tier card becomes a "passport" — layered card with embossed tier name, traits as chips, and a subtle parallax tilt on mouse-move.
- **Circles**: member rows get avatar rings reflecting their execution score; proof posts in a card-stack layout.
- **Premium**: hero with animated gradient mesh; feature list as alternating zigzag rows; clear "Upgrade" CTA with shimmer.

## 6. Responsive & desktop refinements

- Sidebar gets a collapsed (icon-only) mode on `md`, full on `lg`.
- Add a desktop top-right utility cluster: search, ⌘K hint, profile avatar.
- Mobile bottom nav gets an active-indicator pill that slides between items.
- Larger tap targets (min 44px) and safe-area padding on mobile.

## 7. Accessibility & feel

- Respect `prefers-reduced-motion`: disable spring/stagger, keep fades only.
- Focus rings: 2px offset accent ring on all interactive elements.
- Color contrast pass on muted text in light state modes.

---

## Technical notes

- Add deps: `framer-motion`, `sonner`, `cmdk` (for command palette).
- New components (all presentational):
  - `src/components/motion/MotionOutlet.tsx`
  - `src/components/motion/AnimatedNumber.tsx`, `AnimatedRing.tsx`
  - `src/components/atmosphere/AuroraBackground.tsx`, `Grain.tsx`
  - `src/components/cards/StateRibbon.tsx`, `FocusWindow.tsx`, `BehavioralNote.tsx`, `IdentityPassport.tsx`
  - `src/components/command/CommandPalette.tsx`
  - `src/components/empty/EmptyState.tsx`
- Extend `src/styles.css` tokens: add `--shadow-ambient`, `--shadow-lift`, `--ring-focus`, mono font face, aurora keyframes, grain data-URI.
- No changes to `src/lib/store.ts` (logic untouched). Components consume existing selectors and render richer visuals only.

---

## Suggested rollout order

1. Atmosphere + motion foundation (aurora, grain, MotionOutlet, AnimatedNumber/Ring, tap/hover primitives).
2. Today + Dashboard polish (highest visibility).
3. Check-in + Recovery cinematic flows (most emotional moments).
4. New surfaces: Command Palette, Behavioral Note, Identity Passport, State Ribbon.
5. Insights, Circles, Weekly, Premium polish.
6. Responsive + a11y pass.

Want me to start with **step 1 + 2** in the first build, or pick specific items from the list?
