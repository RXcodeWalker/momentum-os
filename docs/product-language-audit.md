# North — Product Language Audit

> **Scope:** This is the remediation backlog for strings in the current codebase that violate the rules in `product-language-system.md`. No code is changed here. Entries are prioritized P0/P1/P2 and ordered by severity within each category. Implement in a separate pass.

**Priority definitions:**
- **P0** — Trust boundary or shame violation. Ships a claim the product cannot support, or actively damages the user relationship. Fix before next release.
- **P1** — Measurable voice inconsistency. Wrong brand name, raw error exposure, or guilt framing. Fix in next sprint.
- **P2** — Tone drift or motivational language. Does not break trust, but dilutes the instrument voice over time. Fix when touching the file.

---

## Category 1 — Trust Boundary Violations

### P0 — Certainty overclaim: predictive recovery

| Field | Value |
|---|---|
| **File:Line** | `src/routes/premium.tsx:86` (feature description) |
| **Current string** | `"We catch the crash 36 hours before it lands."` |
| **Principle violated** | §10.1 — No certainty about the future. The system cannot guarantee it will detect every crash, and the time-bound claim ("36 hours") implies a precision the model does not have. |
| **Suggested rewrite** | `"Patterns consistent with burnout detected before the crash — so you can act sooner."` |
| **Priority** | P0 |

---

## Category 2 — Shame and Guilt Framing

### P1 — Shame framing: reschedule toast

| Field | Value |
|---|---|
| **File:Line** | `src/routes/index.tsx` (reschedule task toast) |
| **Current string** | `"Momentum penalty applied."` |
| **Principle violated** | §3.3 (banned phrases: "penalty"), §2.6 (calm about failure), §8 (toast rules: no guilt). The word "penalty" frames a neutral system event as punishment. |
| **Suggested rewrite** | `"Moved to tomorrow · Rescheduled tasks are tracked automatically."` |
| **Priority** | P1 |

---

## Category 3 — Raw Error Exposure

### P1 — Raw catch-block error text in sign-in

| Field | Value |
|---|---|
| **File:Line** | `src/routes/sign-in.tsx` (error state render) |
| **Current string** | Raw `error.message` from the catch block is rendered directly in the error box |
| **Principle violated** | §9 (error states: never expose raw exception text). Raw errors expose internal implementation details, may contain confusing technical strings, and are not actionable for the user. |
| **Suggested rewrite** | Map to these approved messages: Google failure → `"Google sign-in failed. Please try again."` / Network → `"Unable to connect. Check your connection and retry."` / Catch-all → `"Something went wrong. Please try again."` |
| **Priority** | P1 |

---

## Category 4 — Unverifiable Social Proof

### P2 — Social proof inflation: premium user count

| Field | Value |
|---|---|
| **File:Line** | `src/routes/premium.tsx` (social proof section) |
| **Current string** | `"Used by 12,400 ambitious people"` |
| **Principle violated** | §3.3 (banned: unverifiable social proof), §10.5 (reciprocal honesty). If this number is hardcoded and not sourced from a live count, it violates the product's own honesty norm. "Ambitious" also frames the user's identity in a way the system cannot verify. |
| **Suggested rewrite** | Remove entirely, or replace with a verifiable feature description. If a real user count is available via an API, render it dynamically with no adjective: `"Joined by {N} users"` |
| **Priority** | P2 |

---

## Category 5 — Brand Migration (Cadence → North)

All 37 occurrences of "Cadence" must be migrated to "North" or "North Pro." Listed individually with file:line. Where "the system" is the more natural voice, that is the preferred replacement over "North" (per §3.2).

### P1 — Meta titles and OG tags

| File:Line | Current string | Suggested rewrite |
|---|---|---|
| `src/routes/__root.tsx:87` | `"Cadence — Behavioral OS for ambitious people"` | `"North — Behavioral OS"` |
| `src/routes/__root.tsx:94` | `"Cadence — Behavioral OS"` | `"North — Behavioral OS"` |
| `src/routes/insights.tsx:49` | `"Insights — Cadence"` | `"Insights — North"` |
| `src/routes/weekly.tsx:40` | `"Weekly report — Cadence"` | `"Weekly report — North"` |
| `src/routes/index.tsx:69` | `"Today — Cadence"` | `"Today — North"` |
| `src/routes/identity.tsx:176` | `"Identity — Cadence"` | `"Identity — North"` |
| `src/routes/replay.tsx:26` | `"Replay — Cadence"` | `"Replay — North"` |
| `src/routes/demo.tsx:8` | `"Sample data — Cadence"` | `"Sample data — North"` |
| `src/routes/recovery.tsx:47` | `"Recovery — Cadence"` | `"Recovery — North"` |
| `src/routes/dashboard.tsx:30` | `"Execution Status — Cadence"` | `"Execution Status — North"` |
| `src/routes/premium.tsx:10` | `"Cadence Pro — Behavioral OS"` | `"North Pro — Behavioral OS"` |
| `src/routes/circles.tsx:32` | `"Circles — Cadence"` | `"Circles — North"` |
| `src/routes/onboarding.tsx:36` | `"Setup — Cadence"` | `"Setup — North"` |
| `src/routes/check-in.tsx:14` | `"Check-in — Cadence"` | `"Check-in — North"` |

### P1 — UI chrome (sidebar, command palette)

| File:Line | Current string | Suggested rewrite |
|---|---|---|
| `src/routes/__root.tsx:369` | Sidebar logo text: `"Cadence"` | `"North"` |
| `src/routes/__root.tsx:465` | Premium badge: `"Cadence Pro"` | `"North Pro"` |
| `src/components/command/CommandPalette.tsx:28` | Route label: `"Cadence Pro"` | `"North Pro"` |
| `src/components/command/CommandPalette.tsx:111` | Logo span: `"Cadence"` | `"North"` |

### P1 — In-product body copy (user-visible strings)

| File:Line | Current string | Suggested rewrite |
|---|---|---|
| `src/routes/index.tsx:113` | `"Cadence learns from what you do. Today is a clean page."` | `"The system starts calibrating as you log. Today is a clean page."` |
| `src/routes/index.tsx:918` | Nav label: `"Cadence Pro"` | `"North Pro"` |
| `src/routes/identity.tsx:137` | `"Your profile is set. Cadence will adapt as real execution patterns emerge."` | `"Your profile is set. The system adapts as real execution patterns emerge."` |
| `src/routes/identity.tsx:295` | `subtitle="What Cadence has noticed about how you actually work."` | `subtitle="What the system has noticed about how you actually work."` |
| `src/routes/identity.tsx:388` | `"These patterns initialize the system. Cadence adapts as real execution data…"` | `"These patterns initialize the system. It adapts as real execution data…"` |
| `src/routes/demo.tsx:11` | `"A read-only demo loaded with example history so you can see how Cadence feels."` | `"A read-only demo loaded with example history so you can see how North works."` |
| `src/routes/demo.tsx:34` | `"Your real Cadence starts when you…"` | `"Your real North starts when you…"` |
| `src/routes/demo.tsx:59` | `"Cadence will begin learning from your real check-ins from there."` | `"North will begin learning from your real check-ins from there."` |
| `src/routes/recovery.tsx:770` | `"Every protocol you complete teaches Cadence how you bounce back."` | `"Every protocol you complete teaches the system how you bounce back."` |
| `src/routes/premium.tsx:61` | `eyebrow={premium ? "Pro · active" : "Cadence Pro"}` | `eyebrow={premium ? "Pro · active" : "North Pro"}` |
| `src/routes/premium.tsx:86` | `"Cadence Pro"` (heading) | `"North Pro"` |
| `src/lib/store.ts:1056` | `"Cadence can switch to a smaller-surface recovery mode…"` | `"The system can switch to a smaller-surface recovery mode…"` |
| `src/components/cards/FocusWindow.tsx:30` | `"Unlock hour-by-hour focus mapping with Cadence Pro."` | `"Unlock hour-by-hour focus mapping with North Pro."` |

### P1 — Help system body copy

All 17 occurrences in `src/components/help/help-content.ts` and `src/components/help/HelpModal.tsx`. The help system is the one surface where using the product name directly is permitted (§13.19), so "Cadence" → "North" is the correct replacement throughout (not "the system").

| File:Line | Current string | Suggested rewrite |
|---|---|---|
| `help-content.ts:220` | `"Cadence is not a to-do list…"` | `"North is not a to-do list…"` |
| `help-content.ts:225` | `"Cadence tracks how consistently you execute…"` | `"North tracks how consistently you execute…"` |
| `help-content.ts:231` | `"Cadence finds those patterns."` | `"North finds those patterns."` |
| `help-content.ts:243` | `"Cadence is built around this truth."` | `"North is built around this truth."` |
| `help-content.ts:262` | `"tasks Cadence suggested based on last night's check-in."` | `"tasks North suggested based on last night's check-in."` |
| `help-content.ts:288` | `"Cadence tracks task-start patterns."` | `"North tracks task-start patterns."` |
| `help-content.ts:304` | `"everything Cadence learns."` | `"everything North learns."` |
| `help-content.ts:317` | `"let Cadence generate tomorrow's suggested plan."` | `"let North generate tomorrow's suggested plan."` |
| `help-content.ts:335` | `"Cadence flags days where your plan-to-execution ratio…"` | `"North flags days where your plan-to-execution ratio…"` |
| `help-content.ts:349` | `"Cadence's entire intelligence layer…"` | `"North's entire intelligence layer…"` |
| `help-content.ts:383` | `"Cadence cannot surface distraction patterns…"` | `"North cannot surface distraction patterns…"` |
| `help-content.ts:397` | `"Cadence tracks whether your score improves…"` | `"North tracks whether your score improves…"` |
| `help-content.ts:439` | `"Cadence tracks your distraction patterns…"` | `"North tracks your distraction patterns…"` |
| `help-content.ts:463` | `"Cadence was designed with failure in mind."` | `"North was designed with failure in mind."` |
| `help-content.ts:470` | `"Cadence tracks resilience separately…"` | `"North tracks resilience separately…"` |
| `help-content.ts:484` | `"Cadence does not penalize gaps."` | `"North does not penalize gaps."` |
| `help-content.ts:562` | `"Cadence will generate a suggested task plan…"` | `"North will generate a suggested task plan…"` |
| `help-content.ts:577` | `title: "What is Cadence?"` | `title: "What is North?"` |
| `HelpModal.tsx:117` | `"Cadence builds an accurate picture"` | `"North builds an accurate picture"` |
| `HelpModal.tsx:361` | `"Cadence is built for keyboard-first navigation."` | `"North is built for keyboard-first navigation."` |

### P2 — CSS comment (non-user-visible, low priority)

| File:Line | Current string | Suggested rewrite |
|---|---|---|
| `src/styles.css:75` | `"Cadence's editorial signature"` | `"North's editorial signature"` |

---

## Category 6 — Motivational Drift in Recovery Reinforcement

### P2 — Reinforcement copy in `recovery-data.ts`

The recovery protocol reinforcement messages in `src/lib/recovery-data.ts` were not extracted in the exploration pass for individual line numbers. The following is a pattern-level audit of the issue; a grep for the `reinforcement` field key will surface the exact strings.

**Issue:** Recovery reinforcement messages are written in an affirmation/motivational register that drifts from the instrument voice. Examples of the pattern to fix:

| Pattern to find | Principle violated | Rewrite direction |
|---|---|---|
| Motivational affirmations ("You have what it takes", "You've done this before") | §2.6 (calm about failure), §3.3 (banned: therapy intimacy) | Replace with observational framing: what the system has detected, what the protocol is designed to do |
| Forward-looking certainty ("you will recover", "this will work") | §10.1 (no certainty about the future) | Replace with: "this protocol is designed to," "historically this pattern," "the system adapts based on your check-ins" |
| Identity-level framing ("you are resilient") | §2.1 (observational over evaluative) | Replace with: "resilience score is above average" / "your recovery speed historically…" |

**Recommended approach for each protocol's reinforcement block:**
1. State the detected signals that triggered recovery.
2. State what the MVD protocol is designed to do.
3. State how the system will track progress.
4. Omit all identity claims, certainty claims, and emotional encouragement.

---

## Category 7 — Aspirational Marketing Copy

### P2 — Sign-in page subtitle

| File:Line | Current string | Suggested rewrite |
|---|---|---|
| `src/routes/sign-in.tsx` (sign-up subtitle) | `"Start your behavioral evolution."` | `"Your data stays on-device until you create an account."` |
| `src/routes/sign-in.tsx` (sign-in subtitle) | `"Continue your behavioral evolution."` | `"Continue where you left off."` |

**Principle violated:** §2.4 (grounded over aspirational). "Behavioral evolution" is aspirational framing; the sign-in page's job is purely functional.

### P2 — Demo meta description

| File:Line | Current string | Suggested rewrite |
|---|---|---|
| `src/routes/demo.tsx:11` | `"A read-only demo loaded with example history so you can see how Cadence feels."` | `"A read-only demo loaded with example history so you can see how North works."` |

**Note:** "how it feels" is a brand/marketing frame; "how it works" is observational and accurate.

---

## Summary Table

| # | File | Priority | Category | One-line description |
|---|---|---|---|---|
| 1 | `premium.tsx:86` | **P0** | Trust boundary | "catch the crash 36 hours" certainty overclaim |
| 2 | `index.tsx` (toast) | **P1** | Shame framing | "Momentum penalty applied" → "Moved to tomorrow" |
| 3 | `sign-in.tsx` (errors) | **P1** | Raw error exposure | Catch-block message rendered directly |
| 4 | `__root.tsx:87,94` | **P1** | Brand migration | Page title + OG tag "Cadence" → "North" |
| 5 | `__root.tsx:369,465` | **P1** | Brand migration | Sidebar logo + premium badge |
| 6 | `CommandPalette.tsx:28,111` | **P1** | Brand migration | Logo + nav label |
| 7 | `index.tsx:113,918` | **P1** | Brand migration | In-product body + nav |
| 8 | `identity.tsx:137,176,295,388` | **P1** | Brand migration | Page title + body copy (4 strings) |
| 9 | `demo.tsx:8,11,34,59` | **P1** | Brand migration | Page title + meta + body (4 strings) |
| 10 | `recovery.tsx:47,770` | **P1** | Brand migration | Page title + body |
| 11 | `dashboard.tsx:30` | **P1** | Brand migration | Page title |
| 12 | `premium.tsx:10,61,86` | **P1** | Brand migration | Page title + eyebrow + heading |
| 13 | `circles.tsx:32` | **P1** | Brand migration | Page title |
| 14 | `onboarding.tsx:36` | **P1** | Brand migration | Page title |
| 15 | `check-in.tsx:14` | **P1** | Brand migration | Page title |
| 16 | `weekly.tsx:40` | **P1** | Brand migration | Page title |
| 17 | `insights.tsx:49` | **P1** | Brand migration | Page title |
| 18 | `replay.tsx:26` | **P1** | Brand migration | Page title |
| 19 | `store.ts:1056` | **P1** | Brand migration | Recovery pattern message |
| 20 | `FocusWindow.tsx:30` | **P1** | Brand migration | Upsell copy |
| 21 | `help-content.ts` (17 strings) | **P1** | Brand migration | Help system throughout |
| 22 | `HelpModal.tsx:117,361` | **P1** | Brand migration | Help modal body |
| 23 | `premium.tsx` (social proof) | **P2** | Unverifiable claim | "12,400 ambitious people" |
| 24 | `recovery-data.ts` (reinforcement) | **P2** | Motivational drift | Affirmation/certainty language in reinforcement blocks |
| 25 | `sign-in.tsx` (subtitles) | **P2** | Aspirational copy | "behavioral evolution" → functional framing |
| 26 | `styles.css:75` | **P2** | Brand migration | CSS comment only |

---

## Implementation Notes

**Brand migration (items 4–22):** Can be handled in a single find-and-replace pass. Suggested approach:
1. Global replace `"Cadence Pro"` → `"North Pro"` (exact match, case-sensitive).
2. Global replace `"— Cadence"` → `"— North"` in page title strings.
3. Global replace remaining `"Cadence"` → `"North"` with a review pass to catch cases where `"the system"` is preferred (identity.tsx:295, identity.tsx:388, store.ts:1056, recovery.tsx:770).
4. Remove `src/styles.css:75` comment or update wording.

**P0 trust boundary (item 1):** Single string replacement in `premium.tsx`. High visibility — fix first.

**P1 shame framing (item 2):** Single toast string in `index.tsx`. Locate the `rescheduleTask` call that triggers the toast and update the message argument.

**P1 raw error (item 3):** `sign-in.tsx` — add an error-mapping function that converts known error codes/messages to the approved strings, with a catch-all fallback. Do not render `error.message` directly.

**P2 reinforcement (item 24):** Requires a careful rewrite of each `reinforcement` string in `recovery-data.ts`. Apply the Behavioral Consistency Test (Appendix A of the spec) to each rewrite before committing.
