# North — Product Language System

> **Scope:** This document is the single source of truth for all copy produced in or for North. Any string that appears in the product — headers, subtitles, CTAs, toasts, empty states, error messages, onboarding, help, notifications — must pass the rules in this spec before it ships. It supersedes any inconsistency in the existing codebase; inconsistencies are tracked in `product-language-audit.md`.

---

## 1. Messaging Philosophy

### The instrument principle

North is an instrument, not a coach. It surfaces what it observes about user behavior and adapts the interface accordingly. It does not cheerlead, diagnose the person, manufacture urgency, or predict outcomes with certainty.

The product's job is to make patterns visible. The user's job is to act on them. North never blurs that boundary.

### Four load-bearing beliefs

These underpin every copy decision. They come directly from the product's own help system and must never be contradicted by marketing or UI copy:

1. **Measure, don't manage.** North tracks signals; it doesn't prescribe a personality or a lifestyle. It reports what it sees.
2. **Patterns over individual days.** One dip is noise. Fourteen dips are a pattern. The system calibrates to trends, not moments.
3. **Recovery is designed in, not bolted on.** Dips are expected. The recovery system is a first-class feature, not a failure state.
4. **Small consistent wins compound.** The score system rewards completion and honesty, not ambition or effort volume.

### Anti-goals

These are permanent constraints. No copy in North may:

- Hype output volume or equate ambition with identity ("crush it," "beast mode," "unstoppable")
- Position the product as a therapist or intimate companion ("I'm here for you," "you've got this," "proud of you")
- Create artificial urgency or exploit loss-aversion ("don't lose your streak!", "last chance," "you'll regret this")
- Shame the user for a dip, missed day, or low score
- Claim to predict the future with certainty
- Show a metric before its data-readiness threshold is met

---

## 2. Tone Principles

Six principles govern every string. Each has a rule, a do/don't pair, and a grounded example.

### 2.1 Observational over evaluative

State what the data shows. Do not interpret what it means about the person.

| | Example |
|---|---|
| **Do** | "Phone pickups are up this week — focus depth is down 14%." |
| **Don't** | "You got distracted again. Focus is suffering." |

The first sentence reports two correlated signals. The second judges the person.

### 2.2 Restrained over emphatic

No exclamation marks in system-generated copy. No amplifiers ("amazing," "incredible," "powerful"). The system's authority comes from precision, not enthusiasm.

| | Example |
|---|---|
| **Do** | "Strong close. The pattern is holding." |
| **Don't** | "Amazing work today! You're on fire!" |

Restraint is what makes the rare moment of positive signal feel earned.

### 2.3 Specific over vague

When the data supports a number, use it. Vague adjectives ("a lot," "significant," "major") reduce credibility. Measured quantities build it.

| | Example |
|---|---|
| **Do** | "Score has declined 12 pts over 3 days — a pattern worth watching." |
| **Don't** | "Your momentum has dropped significantly recently." |

If the data is too thin to support a number, say so honestly (see §10).

### 2.4 Grounded over aspirational

Copy should reflect where the user is, not where they want to be. The gap between aspiration and reality is the system's data; it is never something to paper over with optimism.

| | Example |
|---|---|
| **Do** | "This is your starting point — not where you want to be. The gap is the work." |
| **Don't** | "You're on your way to becoming the best version of yourself!" |

### 2.5 Agency-preserving over directive

Surface the pattern and at most one option. The user decides. Commands are reserved for the two tactical contexts where they are correct: MVD task items (terse imperatives like "Open file. 5 min.") and the Recovery protocol timeline (time-boxed actions).

| | Example |
|---|---|
| **Do** | "Procrastination has blocked tasks 3 days in a row. Starting with a 5-minute version often breaks the loop." |
| **Don't** | "You need to stop procrastinating. Start your most important task right now." |

### 2.6 Calm about failure

Dips are data. The system never shames, never panic-signals, and never congratulates the user simply for not failing.

| | Example |
|---|---|
| **Do** | "Momentum drop detected. Let's understand what happened and create a tactical recovery plan." |
| **Don't** | "You've fallen behind. Don't let your hard work go to waste!" |

---

## 3. Vocabulary Rules

### 3.1 Canonical lexicon

Use these terms consistently. They are load-bearing: they define the product's epistemic frame and must not be swapped for synonyms that carry different implications.

| Term | Use for |
|---|---|
| **system** | The product (preferred over "North" or "I") |
| **signal** | Any data point the system observes |
| **pattern** | A trend across multiple signals or days |
| **execution** | Getting planned work done |
| **momentum** | The directional trend in execution score |
| **consistency** | The percentage of days scoring ≥ 60 |
| **resilience** | Speed of score recovery after a dip |
| **recovery** | The deliberate protocol for rebuilding after a dip |
| **protocol** | A structured set of actions (recovery, MVD, etc.) |
| **capacity** | The user's sustainable work volume |
| **calibrate** | The system adjusting to new data |
| **surface area** | The total planned work load |
| **honest / honesty** | Self-assessment quality (a score axis) |
| **observe / observation** | What the system does with signals |
| **drift** | Gradual degradation of a pattern |
| **window** | A time block (focus window, deep work window) |
| **load** | The quantity of planned tasks |

### 3.2 Brand

- Product name: **North**
- Tier name: **North Pro**
- Self-reference default: **the system** (not "I," not "North," not "we")
- When the product must name itself directly (onboarding, meta titles, premium page): use "North"
- "Cadence" is a legacy name. Every instance is flagged in `product-language-audit.md` for migration.

### 3.3 Banned phrases

| Banned | Why | Use instead |
|---|---|---|
| amazing, incredible, outstanding, exceptional | Hype; subjective superlatives | "Strong," "above baseline," specific delta |
| crush it, beast mode, unstoppable, dominate | Identity-conflation with output | Describe the execution pattern |
| you've got this, I'm here for you, proud of you | Therapy-intimacy the product cannot sustain | State the observed signal |
| journey of healing, emotional wellbeing | Therapeutic scope creep | "recovery," "rebuilding" |
| don't lose your streak! | Loss-aversion manipulation | State the streak fact; let the user decide |
| act now, last chance, you'll regret | Urgency manipulation | State the pattern; no urgency |
| penalty, you failed, you're failing, lazy | Shame framing | Neutral observation ("moved to tomorrow," "dip detected") |
| guarantee, will prevent, always, never (as a prediction) | Overclaim | "correlated with," "historically," "on this pattern" |
| We catch the crash X hours before it lands | Certainty overclaim | "Patterns consistent with burnout detected early" |
| Used by X ambitious people | Unverifiable social proof | Remove or replace with honest feature description |

### 3.4 Casing conventions

- **SCREAMING CAPS** eyebrow labels are intentional and canonical: `MORNING BRIEFING`, `ROOT CAUSE DIAGNOSTICS`, `RECOVERY PROTOCOL · ACTIVE`. Use them for section-level labels only, not for body copy.
- Headlines: sentence case.
- CTAs: sentence case.
- Metric labels (pills, stat rows): sentence case or Title Case for two-word labels; no all-caps in metric values.

---

## 4. Sentence Construction

### 4.1 Length ceilings

| Surface | Max length |
|---|---|
| Micro-labels, pills, eyebrows | ≤ 3 words |
| CTAs | ≤ 4 words |
| Card subtitles, state messages | ≤ 16 words |
| Toast notifications | ≤ 2 short clauses |
| Help / onboarding body | ≤ 2 sentences per paragraph |
| Everything else | ≤ 2 sentences per surface unless educational |

### 4.2 Structure patterns

**Insight / behavioral note** — three-part structure, in order:
1. **Observation** — what the signal shows
2. **Implication** — the measurable cost or benefit
3. **Option** — one action, framed as a choice (optional; omit at Level 0–1)

> "Phone pickups are up this week — focus depth is down 14%. Putting your phone in another room for one block is the highest-leverage fix."

**State messages (header subtitles)** — two-part:
1. **Signal** — what the system observes about the user's current state
2. **Adjustment** — what the surface is doing about it, or what the user can do

> "Friction is up. One thing done well outweighs three started."

**MVD / Recovery task items** — imperative only. No framing, no context. Terse.

> "Open file. 5 min."
> "Walk outside. 30 min."

### 4.3 Grammar rules

- **Person**: second person ("you/your") for user data and actions; "the system" (third person) for the product. Never first-person "I" for the product.
- **Tense**: present tense for observations ("patterns are up," "sleep is correlated"). Past tense for completed facts (toasts: "Check-in complete · Your behavioral signal has been logged.").
- **Rhetorical questions**: permitted only for the two sanctioned diagnostic headers — "Why is this happening?" (recovery root cause) and "Clear the surface?" (task overload prompt). No other rhetorical questions.
- **Punctuation**: em dashes (—) for observation-implication joins in body copy. Mid-dots (·) in toasts and pill pairs. No exclamation marks in system-generated copy.

---

## 5. State-Specific Tone

Maps `useUserState()` outputs and `messagingTone` values from `guidance.ts` to copy contracts.

### State × Tone matrix

| `useUserState()` | `messagingTone` | Register | Sentence length | What to emphasize | What to never say |
|---|---|---|---|---|---|
| `peak` | CHALLENGING | Light confidence | Standard | Depth opportunity, protection of sleep | Hype, celebration, "you're amazing" |
| `steady` | FOCUSED / STEADY | Neutral, grounded | Standard | Consistency pattern, one priority | Urgency, pressure |
| `building` | STEADY / OBSERVATIONAL | Patient, factual | Standard | Compounding signal, small wins as data | "You're doing great," any cheerleading |
| `burnout` | STABILIZING | Calm, reduced | Short (≤ 10 words per sentence) | Load reduction, signal detection | Any challenge language, any urgency |
| `recovery` | STABILIZING / CALM | Minimal, tactical | Short | Capacity preservation, one-task logic | Any language implying the user failed |

### Verbatim approved examples

These reconcile with `DISPLAY_HEADERS` (EveningResultScreen) and `CHECK_IN_TITLES/SUBTITLES/RESULTS` (constants.ts):

**Peak / CHALLENGING:**
- Header: "Excellent execution." Subtitle: "Conditions are right — keep pressing."
- State message: "You're in a peak window. Stretch into deeper work — protect sleep at all costs."

**Steady / FOCUSED:**
- Header: "Strong close." Subtitle: "The pattern is holding."
- State message: "Hold the line. Consistency over ambition today."

**Building / STEADY:**
- Header: "Day logged." Subtitle: "Consistency compounds — keep showing up."
- State message: "Momentum is building. Protect depth today."

**Burnout / STABILIZING:**
- Header: "Day closed." Subtitle: "Rest is part of the system working."
- State message: "Hold capacity. Protect sleep and the smallest win."

**Recovery / STABILIZING:**
- State message: "You're in recovery. Smaller surface, faster reps. Three things, then rest."
- Step subtitle: "Smaller surface area. Faster reps. Protect sleep above everything."

---

## 6. Intervention Wording

Interventions map to the `Intervention` contract (`core/contracts/interventions/intervention.ts`). The seven `ActiveInterventionType` values × four `InterventionLevel` values.

### Rules for intervention fields

**`triggerReasoning[]`** (user-visible when surfaced):
- Written in observational present tense
- Never contains raw scores or internal field names
- States the pattern, not the threshold that triggered it

**`interventionMessage`** (Level 1+ only):
- One sentence: pattern + cost
- Level 3 only: adds one recommended action, framed as a choice

**`behavioralObjective`** (fallback label):
- Noun phrase, ≤ 5 words

### Per-type approved examples

| Type | Approved `interventionMessage` |
|---|---|
| `BURNOUT_PREVENTION` | "Execution has declined 3 days in a row — a rest block now typically shortens the recovery arc." |
| `OVERLOAD` | "Planned tasks exceed historical completion capacity — reducing the list tends to improve finish rate." |
| `AVOIDANCE_INTERRUPTION` | "The highest-priority task has been moved two days running — a 5-minute start often breaks the pattern." |
| `FRAGMENTATION_REDUCTION` | "Short attention blocks are correlating with lower scores this week — consolidating into one longer block is available." |
| `DEEP_WORK_PROTECTION` | "Conditions for a deep focus session are present — protecting this window is the highest-leverage option." |
| `RECOVERY_ENFORCEMENT` | "Recovery protocol is active. Staying within the reduced load today supports the projected recovery arc." |
| `RESTART_ASSISTANCE` | "Returning after a gap resets the momentum baseline — one completed task re-establishes the signal." |

**Hard rule:** An intervention names the pattern and its cost, then offers at most one action. It never guilts, never predicts catastrophe, and never presents more than one recommended action regardless of severity.

---

## 7. CTA Language

### Rules

- Verb-first. The verb describes the user's intent, not the system's action.
- ≤ 4 words.
- Sentence case.
- Disabled state: append parenthetical reason in lower case — "(cap reached)," "(needs 3 check-ins)."

### Approved CTA inventory

| Surface | Approved CTA |
|---|---|
| Evening check-in launch | "Start evening check-in" |
| Morning plan acceptance | "Accept plan for today" |
| Insight commitment | "Commit to rule" |
| Recovery initiation | "Begin recovery" |
| Recovery exit | "Exit recovery mode" |
| Day close | "Close the day" |
| Onboarding final step | "Activate my system" |
| Check-in step advance | "Continue" / "Almost there" / "Final step" / "Review complete" |
| Sign-up | "Create account" / "Save & create account" |
| Demo clear | "Clear sample & start real" |
| North Pro trial | "Start 7-day free trial" |
| Recovery plan step | "Generate recovery plan" / "Accept this day" / "Complete setup" |
| Task limit reached | "Add Priority (cap reached)" |

### Banned CTAs

| Banned | Why |
|---|---|
| "Get started now!" | Urgency + exclamation mark |
| "Unlock your potential" | Aspiration copy; vague |
| "Let's go!" | Cheerleading |
| "Don't miss out" | Loss-aversion |
| "Try for free today!" | Urgency |

---

## 8. Notification Language

### Toasts

- Report a completed fact in past tense.
- Format: `{Short outcome} · {One-clause consequence or next state}.`
- ≤ 2 clauses. No exclamation marks. No celebration language.

**Approved examples:**

| Event | Approved toast |
|---|---|
| Check-in complete | "Check-in complete · Your behavioral signal has been logged." |
| Task rescheduled | "Moved to tomorrow · Rescheduled tasks are tracked automatically." |
| Surface area reduced | "Priorities pruned · Surface area reduced to sustainable levels." |
| Insight committed | "Rule committed · The system will track effectiveness from today." |

**Flagged toast (P1 — see audit):**
- "Momentum penalty applied." → Replace with "Moved to tomorrow · Rescheduled tasks are tracked automatically."

### Trust boundary for notifications

Notifications never claim a prediction as certainty. Pattern-based projections must hedge:

- Permitted: "Patterns consistent with early burnout detected."
- Not permitted: "We've detected you'll burn out in 36 hours."

---

## 9. Loading / Empty / Error / Success Copy

### Loading and empty states

Honest about why data is absent. Never coy ("Nothing to see here!"). Never apologetic.

**Pattern:** State the condition factually, then say when or how it resolves.

| State | Approved copy |
|---|---|
| Score not yet available | "Appears after tonight's reflection." |
| Insufficient data for metric | "Calibrating — more {metric} data appears after {N} check-ins." |
| No insights yet | "Insights unlock as patterns emerge — typically after 3 check-ins." |
| Tomorrow plan not generated | "Tomorrow's plan will become clearer with more data." |
| Empty task list | *(empty input with placeholder "One thing that actually matters…")* |

### Error states

Plain, non-blaming, actionable. Never expose raw exception text or stack traces.

**Pattern:** One sentence stating what happened; one sentence for the recovery action.

| Condition | Approved copy |
|---|---|
| Page load failure | "This page didn't load. Reload to try again." |
| Google sign-in failure | "Google sign-in failed. Please try again." |
| Catch-all auth error | "Something went wrong. Please try again." |
| Network error | "Unable to connect. Check your connection and retry." |

**Flagged (P1 — see audit):** `sign-in.tsx` displays the raw `error.message` from the catch block. Replace with the mapped messages above.

### Success states

State the outcome and the next adaptation. No praise.

| Event | Approved copy |
|---|---|
| First check-in | "Day 1 logged. The pattern starts here." |
| Check-in complete (stabilizing) | "Day logged. Consistency compounds — keep showing up." |
| Check-in complete (expanding) | "Excellent execution. Conditions are right — keep pressing." |
| Onboarding complete | "Your behavioral OS is ready. Personalized from your profile. Adaptive from day one." |

---

## 10. Trust Boundaries

What North may and may not claim — the integrity rules.

### 10.1 No certainty about the future

Predictive surfaces must hedge to observed-pattern framing. The pattern "tends to" produce a result. The system has "detected signals consistent with" an outcome. It does not "catch the crash," "guarantee recovery," or "prevent burnout."

- **Permitted:** "Patterns consistent with early burnout detected — a rest block now typically shortens the recovery arc."
- **Not permitted:** "We catch the crash 36 hours before it lands." *(see audit P0)*

### 10.2 No metric before its data-readiness threshold

`useDataReadiness(metric)` gates each `MetricKey`. The fallback copy contract for each metric key:

| MetricKey | Fallback copy |
|---|---|
| `distractionProfile` | "Appears after 7 check-ins." |
| `dayOfWeek` | "Appears after 14 check-ins." |
| `blockerPattern` | "Appears after 5 check-ins." |
| `taskIntelligence` | "Appears after 3 check-ins." |
| `streakContext` | "Appears after 3 check-ins." |
| `insightEffectiveness` | "Tracked after committing to a rule." |
| (generic) | "Calibrating — check back after more check-ins." |

### 10.3 No inference about feelings

The system knows signals. It does not know feelings.

- **Permitted:** "Low-sleep days correlate with a 14% execution drop on your data."
- **Not permitted:** "You must be exhausted." / "You seem stressed."

### 10.4 Confidence bands

When the system expresses a confidence level, surface it honestly using the house pattern: `"{N}% confidence · detected across {X} days"`. Do not suppress confidence bands to make a weak signal appear stronger.

### 10.5 Reciprocal honesty

The system asks users for honest self-assessment (the Effort Honesty slider; the "Did the most important work get closer?" question). It must itself never inflate signals, gamify scores against the user's interest, or apply guilt pressure. The system's honesty norm and the user's honesty norm are the same norm.

---

## 11. Banned Phrases — Quick Reference

Single lookup table. Check every new string against this before shipping.

| Phrase / pattern | Why banned | Approved replacement |
|---|---|---|
| amazing, incredible, exceptional, outstanding | Hype superlatives | "Strong," "above baseline," specific delta |
| crush it, beast mode, unstoppable | Identity-conflation | Describe the execution pattern |
| you've got this, I'm here for you | Therapy intimacy | State the signal; no persona |
| proud of you | Parental framing | Not applicable; omit |
| journey (of healing / of growth) | Aspirational therapy language | "recovery," "rebuilding" |
| don't lose your streak! | Loss-aversion manipulation | State the streak fact neutrally |
| act now, last chance, you'll regret | Urgency/scarcity manipulation | State the pattern; no urgency |
| Momentum penalty applied | Shame framing | "Moved to tomorrow." |
| you failed / you're failing | Shame | "Dip detected," "execution below baseline" |
| lazy | Character judgment | Not applicable; omit |
| guarantee / will prevent / always / never (as prediction) | Certainty overclaim | "correlated with," "typically," "on this pattern" |
| We catch the crash X hours before it lands | Certainty overclaim | "Patterns consistent with early [signal] detected" |
| Used by X ambitious people | Unverifiable social proof | Remove or replace with feature description |
| Start your behavioral evolution | Aspirational marketing | "Sync your behavioral data" / "Continue where you left off" |
| Cadence (as product name) | Legacy brand name | North |

---

## 12. Copy Decision Tree

Answer all six questions before writing any new string. If a string cannot pass all six, the surface design is wrong — not the wording.

1. **What is the user's goal on this surface right now?**
   Write to that. Not to the system's internal event, not to a conversion goal, not to engagement metrics.

2. **What does the system actually know here?**
   Only claim what the data and the contract support. Check `useDataReadiness()` thresholds (§10.2). Check the confidence band. Never write beyond the data.

3. **Is this an observation, an interpretation, or a recommendation?**
   Default to observation. Interpretation requires evidence in the string ("on your data," "this week," "over 14 days"). Recommendation is reserved for Level 3 interventions (§14).

4. **Can it be shorter?**
   Apply the length ceilings in §4.1. Cut adjectives before nouns. Cut qualifiers before verbs. If it still reads, ship the shorter version.

5. **Does it preserve the user's agency?**
   Surface the pattern and at most one option. Never issue a command outside tactical Recovery/MVD contexts.

6. **Will it still be believable after the 200th time the user reads it?**
   Reject anything that reads as a one-time pep talk, a rhetorical trick, or a persona the system cannot sustain across all states and all users. If it depends on novelty to land, it will not survive the second read.

---

## 13. Per-Screen Copy Examples

One subsection per route and key component. Each entry gives the surface's job, its tone constraints, and a verbatim approved copy block.

---

### 13.1 `/` — Today

**Job:** Daily dashboard. Show the execution score, task priorities, and the behavioral state context for today. The surface must be actionable without being prescriptive.

**Tone constraints:** Grounded, neutral-to-light (state-dependent). No urgency. No cheerleading. Score appears only after check-in; fallback is honest.

**Approved copy:**

```
Page title:       "Today — North"
Score fallback:   "Appears after tonight's reflection."
Score label:      "Today's score"

State subtitles:
  peak:           "You're in a peak window. Stretch into deeper work — protect sleep at all costs."
  steady:         "Hold the line. Consistency over ambition today."
  building:       "Momentum is building. Protect depth today."
  burnout:        "Hold capacity. Protect sleep and the smallest win."
  recovery:       "You're in recovery. Smaller surface, faster reps. Three things, then rest."

Friction sub:     "Friction is up. One thing done well outweighs three started."
Stable sub:       "Steady hand today. Don't over-plan — execute three things well."
Expanding sub:    "Strong momentum. Protect the conditions that got you here."
Rebuilding sub:   "Rebuilding. Each completed task compounds forward."
Fragile sub:      "Fragile ground. Prioritize finish over start today."

Signal cards:
  momentum risk:  "Score has declined {X} pts over {Y} days — a pattern worth watching."
  blocker:        "{Blocker} has blocked tasks {X} days in a row. {Recommendation}"
  active rule:    "Day {X} · +{delta} pts avg since commit — this is working."
  building:       "Building baseline — check back in {X} days."

Task section:
  header:         "Remaining Priorities"
  completion:     "{completed} / {total} Done"
  overload CTA:   "Clear the surface?"
  placeholder:    "One thing that actually matters…"
  cap reached:    "Add Priority (cap reached)"

Toasts:
  reschedule:     "Moved to tomorrow · Rescheduled tasks are tracked automatically."

Bottom nav:
  dashboard:      "Command center · Deep analytics"
  weekly:         "Weekly report · Patterns this week"
  circles:        "Trusted circles · Proof-based"
  premium:        "North Pro · Adaptive coaching"
```

---

### 13.2 `/dashboard` — Command Center

**Job:** Analytics overview. KPIs, heatmap, burnout risk, trend data. The surface is read-only observation.

**Tone constraints:** Purely observational. No recommendations at this level. Data should speak; labels should not interpret.

**Approved copy:**

```
Page title:       "Dashboard — North"
Section headers:  "EXECUTION TREND" / "CONSISTENCY" / "BURNOUT RISK" / "FOCUS PATTERN"
Empty state:      "Calibrating — patterns appear after 7 check-ins."
Heatmap label:    "28-day execution"
Metric labels:    "Avg score" / "Best day" / "Consistency" / "Resilience"
```

---

### 13.3 `/check-in` — Evening Check-in

**Job:** Capture the day's behavioral signals (task completion, mood, focus, sleep, distractions, tomorrow's intention). Accuracy is the product's core data source.

**Tone constraints:** Honest, calm. The wizard must not reward high scores or punish low ones. Every step should feel like an instrument panel, not a report card.

**Approved copy:**

```
Step 1 — Task review:
  Title:          "Reviewing your work."
  Subtitle:       "Honesty here is the foundation of the system."
  CTA:            "Review complete"

Step 2 — Mood:
  Title:          "The Vibe Check."
  Subtitle:       "How are you actually feeling right now?"
  Label:          "Core Mood"
  Slider label:   "Remaining Energy"
  Slider range:   "Drained → Charged"
  CTA:            "Continue"

Step 3 — Biological signals:
  Title:          "Biological signals."
  Subtitle:       "Focus, Sleep, and Honesty."
  Labels:         "Focus Quality" / "Sleep (Hours)" / "Effort Honesty"
  CTA:            "Almost there"

Step 4 — Distractions:
  Title:          "Clear the deck."
  Subtitle:       "What stole your attention today?"
  Question:       "Did the most important work get closer today?"
  CTA:            "Final step"

Step 5 — Tomorrow:
  Title:          "Tomorrow's Foundation."
  Subtitle:       "End the day by removing one tomorrow-morning decision."
  Reflection label: "Mindful Reflection"
  Reflection prompt: "What's the one thing you're avoiding telling yourself about today?"
  North star label: "Tomorrow's North Star"
  CTA:            "Close the day"

Re-entry banner: "Checking in after {X} day(s) away. That counts."
```

---

### 13.4 `/insights` — Behavioral Diagnostics

**Job:** Show behavioral patterns derived from accumulated data: distraction impact, blocker patterns, day-of-week profile, task intelligence, insight effectiveness.

**Tone constraints:** Observational only. Specific quantities wherever data supports them. Every metric gated behind `useDataReadiness()`.

**Approved copy:**

```
Page title:       "Insights — North"
Section headers:  "DISTRACTION PROFILE" / "BLOCKER PATTERNS" / "DAY-OF-WEEK PROFILE"
                  "TASK INTELLIGENCE" / "INSIGHT EFFECTIVENESS"
Empty state:      "Appears after {N} check-ins."
Confidence line:  "{N}% confidence · detected across {X} days"
Fallback:         "Calibrating — more data appears as you log."
```

---

### 13.5 `/weekly` — Weekly Patterns

**Job:** Week-over-week behavioral summary. Day-of-week bars, distraction mix, streak stats.

**Tone constraints:** Observational. Comparisons are factual (vs. last week, vs. avg). No judgment on whether the week was "good" or "bad."

**Approved copy:**

```
Page title:       "Weekly — North"
Section headers:  "THIS WEEK" / "DAY-OF-WEEK PROFILE" / "DISTRACTION MIX" / "STREAK"
Comparison label: "vs last week"
Streak label:     "{N}-day execution streak"
```

---

### 13.6 `/recovery` — Recovery Protocol

**Job:** Guide the user through a structured dip-response: state detection → root cause → MVD → roadmap → protocol commitment.

**Tone constraints:** Calm, tactical, short sentences. Drop all challenge language. No affirmations. Reinforcement copy must be observational, not motivational. The word "failure" does not appear.

**Approved copy:**

```
Page title:       "Recovery — North"
Meta description: "Tactical recovery system for rebuilding momentum."

Step 0 — Detection:
  Header:         "Momentum drop detected"
  Subtitle:       "Let's understand what happened and create a tactical recovery plan."
  Trend labels:   "Declining" / "Recovering" / "Fluctuating"
  Signal labels:  "Sleep debt · avg last 7 days"
                  "Distraction load · avg daily interruptions"
                  "Completion rate · planned vs done"
  CTA:            "Analyze root causes"

Step 1 — Root cause:
  Header:         "Understanding the pattern"
  Prompt:         "Select patterns you recognize."
  CTA:            "Generate recovery plan"

Step 2 — MVD:
  Header:         "Minimum viable day"
  Subtitle:       "Three things. Nothing else."
  Note:           "This isn't about doing less forever. It's about preserving momentum while you rebuild."
  Protected load: "Ambitious goals and weekly targets are muted for 48h while you rebuild. You can override anytime."
  CTA:            "Accept this day"

Step 3 — Roadmap:
  Header:         "Recovery roadmap"
  Estimate label: "Estimated recovery"
  Caveat:         "Based on your historical recovery speed and current signals. This adapts as you progress."
  CTA:            "Complete setup"

Step 4 — Reinforcement:
  Header:         "You're rebuilding"
  Stats:          "Recovery initiated · Start of rebuild cycle"
                  "Projected return · Based on your resilience"
  Recovery skill: "Recovery is a skill. Every protocol you complete teaches the system how you bounce back.
                   The system learns your recovery patterns and shortens future dips."
  CTA:            "Begin recovery"

Contextual detection messages:
  burnout signals:   "Multiple signals point to burnout. This isn't failure — it's data. Let's reduce surface area."
  already active:    "You're already in recovery mode. Let's refine the approach."
  significant dip:   "Significant momentum loss detected. A tactical reset is more effective than harder pushing."
  early warning:     "Early warning signals present. Catching this now prevents a deeper dip."
```

**Flagged reinforcement copy (P2 — see audit):** `recovery-data.ts` reinforcement affirmations drift toward motivational. Each protocol's reinforcement block must be rewritten to observational framing before shipping.

---

### 13.7 `/circles` — Trusted Circles

**Job:** Execution proof feed. Social accountability without social pressure.

**Tone constraints:** Neutral. Let the proof entries speak. System labels are minimal.

**Approved copy:**

```
Page title:       "Circles — North"
Section header:   "EXECUTION PROOF"
Empty state:      "Proof entries appear as you and your circle complete days."
```

---

### 13.8 `/identity` — Profile

**Job:** User profile, streak history, operating protocols with effectiveness ratings.

**Tone constraints:** Factual. Protocol effectiveness ratings are data, not judgments.

**Approved copy:**

```
Page title:       "Identity — North"
Section headers:  "OPERATING PROTOCOLS" / "STREAK HISTORY" / "BEHAVIORAL PROFILE"
Protocol label:   "{protocol name} · {effectiveness verdict}"
Effectiveness:    "working" / "too early" / "not working" / "plateau"
```

---

### 13.9 `/premium` — North Pro

**Job:** Present the Pro tier's capabilities and pricing. Convert free users without manipulation.

**Tone constraints:** Factual about capabilities. No overclaims. No urgency. No social proof unless verifiable.

**Approved copy:**

```
Page title:       "North Pro — Behavioral OS"
Eyebrow:          "North Pro"
Headline:         "Built for sustained execution."
Subtitle:         "Advanced analytics, adaptive protocols, and early pattern detection — unlocked."

Feature descriptions:
  Adaptive coaching:    "Daily protocols tuned to your patterns — not generic templates."
  Deep analytics:       "12-week trend analysis across focus, recovery, sleep, and consistency."
  Early detection:      "Patterns consistent with burnout detected before the crash — so you can act sooner."
  Execution plans:      "Weekly plans calibrated to your real capacity, not your ambition."
  Focus mapping:        "Hour-by-hour focus mapping. Find your peak window and protect it."

Pricing:
  Monthly:        "$9/mo · Cancel anytime"
  Annual:         "$72/yr · Save 33% · 2 months free"

CTA:              "Start 7-day free trial"
Trial note:       "No card required for trial. Cancel anytime."

Active state:
  Label:          "Pro active"
  Renewal:        "Renews · {$72/yr or $9/mo}"
  CTA:            "Manage"
```

**Flagged (P0 — see audit):** "We catch the crash 36 hours before it lands." → "Patterns consistent with burnout detected before the crash — so you can act sooner."
**Flagged (P2 — see audit):** "Used by 12,400 ambitious people" → Remove or replace with verifiable claim.

---

### 13.10 `/onboarding` — Setup Flow

**Job:** Calibrate the behavioral system with the user's profile: goals, struggles, energy patterns, capacity, starting baseline.

**Tone constraints:** Direct, honest. The system is calibrating — it asks for accuracy, not aspiration. Risk warnings ("high burnout risk") are factual, not alarming.

**Approved copy:**

```
Page title:       "Setup — North"
Meta:             "Calibrate your behavioral operating system."

Step 1 — Identity:
  Eyebrow:        "Identity & Ambition"
  Headline:       "What are you building toward?"
  Subtitle:       "Pick what matters this season. Multi-select — be honest."

Step 2 — Struggles:
  Eyebrow:        "Behavioral Struggles"
  Headline:       "Where do you tend to break?"
  Subtitle:       "Be precise. This helps the system catch patterns early."

Step 3 — Execution profile:
  Eyebrow:        "Execution Profile"
  Headline:       "How does your mind actually operate?"
  Subtitle:       "Not how you wish it did — how it actually does."

Step 4 — Reality calibration:
  Eyebrow:        "Reality Calibration"
  Headline:       "What does your actual execution look like?"
  Subtitle:       "Be honest. The system works better with accuracy than aspiration."

Step 5 — Baseline:
  Eyebrow:        "Momentum Baseline"
  Headline:       "Your behavioral starting point."
  Subtitle:       "This is where you actually are — not where you want to be. The gap is the work."

Step 6 — Activation:
  Eyebrow:        "System Activation"
  Headline:       "Your behavioral OS is ready."
  Subtitle:       "Personalized from your profile. Adaptive from day one."
  Note:           "The system adapts as you log. First insights appear after 3 check-ins."

CTAs:             "Skip" / "Back" / "Continue" / "Activate my system"
```

---

### 13.11 `/sign-in` — Auth

**Job:** Let existing users sign in or new users create an account. The upgrade variant preserves the user's existing data.

**Tone constraints:** Minimal. No marketing on this screen. The upgrade variant should state the user's data situation factually.

**Approved copy:**

```
Sign-in mode:
  Title:          "Welcome back"
  Subtitle:       "Continue where you left off."

Sign-up mode:
  Title:          "Get started"
  Subtitle:       "Your data stays on-device until you create an account."

Upgrade mode:
  Title:          "Save your progress"
  Subtitle:       "You have {X} day(s) of behavioral data{and Y check-in(s)}. Create an account to keep it."

Form labels:      "Email Address" / "Password"
Placeholders:     "name@example.com" / "••••••••"
CTAs:             "Continue with Google" / "Sign In" / "Create account" / "Save & create account"
Toggle:           "Already have an account? Sign in"
                  "No account? Start for free"
Guest option:     "Continue without an account"

Error messages:
  Google failure:  "Google sign-in failed. Please try again."
  Network:         "Unable to connect. Check your connection and retry."
  Catch-all:       "Something went wrong. Please try again."
```

**Flagged (P1 — see audit):** Raw `error.message` from catch block is displayed directly. Replace with the mapped messages above.

---

### 13.12 `/demo` — Demo Mode

**Job:** Read-only sample data view. Must be honest that the data is not the user's.

**Tone constraints:** Direct and unambiguous. The demo banner must not be dismissable without the user understanding what they are looking at.

**Approved copy:**

```
Page title:       "Sample data — North"
Banner label:     "Sample data"
Banner body:      "You're looking at example history. Your real North starts when you clear the sample and start fresh."
Body:             "Sample data populates the heatmap, momentum trend, insights, and circles feed
                   so the surface is fully rendered. None of it is yours."
Transition note:  "When you're ready, clear the sample to see the honest empty state — North will begin
                   learning from your real check-ins from there."
CTAs:             "Open Today" / "Clear sample & start real"
```

---

### 13.13 `CheckInWizard` (component)

See §13.3 (`/check-in`) for all wizard copy. Additional component-level rules:

- The blocker label on rescheduled tasks: `"Blocker:"` — present tense, no judgment.
- Re-entry after a gap: `"Checking in after {X} day(s) away. That counts."` — the phrase "That counts." is intentional; it is factual (the re-entry signal is captured), not motivational.

---

### 13.14 `SaveProgressBanner` (component)

**Job:** Prompt guests with data to create an account. Factual about the risk (data loss on browser clear).

**Approved copy:**

```
Body:   "You have {X} days of behavioral data stored locally. Create an account to keep it."
CTA:    "Save progress"
```

---

### 13.15 `BehavioralNote` (component)

**Job:** Display an unlocked behavioral insight with its confidence level and age.

**Approved copy:**

```
Label:      "Behavioral pattern"
Confidence: "{N}% confidence · detected across {X} days"
CTA:        "Take action" (or surface-specific label ≤ 4 words)
```

---

### 13.16 `FirstSessionBanner` / `MorningCalibrationSheet` (component)

**Job:** First-day context and morning check-in defaults.

**Approved copy:**

```
First session:  "Day 1. The system starts calibrating now."
Morning label:  "Morning Calibration"
Morning sub:    "Set 3 priorities · energy check"
```

---

### 13.17 `EveningResultScreen` (component)

See §13.3 and §5 (State-Specific Tone) for all result-screen copy. The display headers by state are canonical in §5. Additional rules:

- First-score context: `"This is your Day 1 signal. It will update every time you reflect."`
- Baseline comparison: `"+{X} above baseline"` / `"{X} below baseline"` / `"exactly on baseline"` — no judgment on direction.

---

### 13.18 `TomorrowCard` (component)

**Job:** Surface tomorrow's plan based on today's closing state.

**Approved copy:**

```
Label (recovery): "Tomorrow"
Workload light:   "Lighter load tomorrow"
Workload maintain: "Maintain tomorrow's pace"
Workload push:    "Room to push tomorrow"
Empty:            "Tomorrow's plan will become clearer with more data."
North star label: shown as-entered by user; no system framing
```

---

### 13.19 `help-content.ts` (help system)

**Job:** Teach the user how North works. The only surface where multi-paragraph explanation is appropriate.

**Tone constraints:** Instructional, honest. The help system is where the product's philosophy is explained directly. Use "North" (not "the system") here because the user is reading documentation, not observing a live signal.

**Approved copy:**

```
Positioning:   "North is not a to-do list. It is a behavioral operating system..."
Four truths:   use §1 load-bearing beliefs, rewritten with "North" as the subject
Mistakes:      frame each mistake as a pattern to observe, not a judgment
               e.g. "Overplanning: Plans expand to fill planning time. Execution stays shallow."
Recovery:      "Recovery is designed into the system. A dip is data, not a setback."
```

---

## 14. Copy Escalation Ladder

Defines how language scales with intervention severity, mapped to the four `InterventionLevel` values from `core/contracts/interventions/intervention.ts`.

Each level is strictly additive. A higher level contains the lower level's content plus exactly one more layer. The emotional volume never increases.

### Level 0 — Silent adaptation

No copy at all. The system adjusts the surface (task limit, density, pacing) without telling the user. Most adaptations live here.

**Copy produced:** None.

### Level 1 — Observation

One neutral statement of the pattern. No consequence, no advice.

**Example:** "Phone pickups are up this week."

**Copy rules:** Single sentence. Present tense. No implication. No recommendation.

### Level 2 — Observation + consequence

The pattern plus its measured cost. Still no instruction.

**Example:** "Phone pickups are up this week — focus depth is down about 14%."

**Copy rules:** Two clauses, joined by em dash. The cost must be a measured signal, not a vague warning.

### Level 3 — Observation + consequence + one recommended action

Adds exactly one option, framed as a choice.

**Example:** "Phone pickups are up this week — focus depth is down about 14%. Putting your phone in another room for one block is the highest-leverage fix."

**Copy rules:** Three parts, as above. The action is framed as available ("is available," "tends to break the loop," "is the highest-leverage fix") — not commanded. One action only, regardless of severity.

### Hard rules

- **Never present more than one recommended action.** Escalation increases specificity; it never increases the number of demands.
- **Burnout/recovery states cap at Level 1–2** unless the string is a tactical MVD/Recovery task item, where imperative-only is correct.
- **Higher severity = more evidence, not louder language.** Level 3 copy is not more emphatic than Level 1 — it is more specific.

---

## Appendix A — Behavioral Consistency Test

Apply to every new string before it ships. A string passes only if all eight are true.

Copy this checklist into a PR description or design review.

```
- [ ] 1. Observational — states what is, not what it means about the person.
- [ ] 2. Avoids certainty — no guaranteed predictions; hedged to observed patterns and confidence bands.
- [ ] 3. Avoids manipulation — no urgency, loss-aversion, streak-shaming, or guilt levers.
- [ ] 4. Avoids motivational language — no pep, hype, affirmations, or cheerleading.
- [ ] 5. Specific — concrete signal or quantity over vague adjectives where the data supports it.
- [ ] 6. Non-therapeutic — knows signals, not feelings; no intimacy or counselor persona.
- [ ] 7. Preserves autonomy — leaves the decision with the user; at most one recommended action.
- [ ] 8. Durably believable — still reads as honest and in-character after hundreds of repetitions.
```
