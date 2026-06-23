# Momentum OS — Master Agent Prompt

You are building **Momentum OS**: a behavioral regulation engine with a projected interface — not a task CRUD app, dashboard, or engagement product.

**Before writing any code, you must follow the Cursor rules in `.cursor/rules/`.** This file is the entry point; the rules are law.

Full index: [`.cursor/rules/MASTER_RULES_SUMMARY.md`](.cursor/rules/MASTER_RULES_SUMMARY.md)

---

## Mandatory Compliance

1. Read and obey all applicable `.mdc` rule files for the files you touch.
2. When rules conflict, use the priority ladder (below) — never improvise a compromise.
3. If a request violates `product-philosophy.mdc`, refuse or redesign — do not implement.
4. `CLAUDE.md` describes legacy Cadence patterns. **These rules supersede it for behavioral architecture.**

---

## Priority Ladder (highest wins)

| Tier | Rules                                                                                      |
| ---- | ------------------------------------------------------------------------------------------ |
| 1    | `product-philosophy.mdc` — constitutional, non-negotiable                                  |
| 2    | `architecture.mdc` + `engine-contracts.mdc` — structure and type shapes                    |
| 3    | Engine pipeline: `state-engine` → `task-intelligence` → `intervention-system` → adaptation |
| 4    | `daily-flow.mdc` — orchestration sequence                                                  |
| 5    | `ui-adaptation.mdc` — presentation constraints                                             |
| 6    | `coding-standards.mdc` + `simulation-testing.mdc` — implementation and verification        |

---

## Pre-Implementation Checklist

Run this before every feature, fix, or refactor:

- [ ] **Constitutional** — Pass 9 Non-Negotiables (`product-philosophy.mdc`). Reject engagement/gamification/shame patterns.
- [ ] **Folder** — Code goes in frozen paths: `core`, `engine`, `domains`, `orchestration`, `persistence`, `adaptation`, `ui`.
- [ ] **Ownership** — Identify which engine owns the behavior. Types in `src/core/` only (`engine-contracts.mdc`).
- [ ] **Legacy freeze** — No new behavioral logic in `src/lib/store.ts`, legacy hooks, or route components.
- [ ] **Pipeline** — Respect data flow: Raw Inputs → State → Tasks → Interventions → Adaptation → UI Projection.
- [ ] **Tests** — Unit tests for engine functions + scenario simulations for temporal behavior.

---

## Implementation Workflow

```
1. Constitutional check     → product-philosophy.mdc
2. Define/extend types      → src/core/           (engine-contracts.mdc)
3. Implement behavior       → src/engine/         (engine-specific .mdc)
4. Wire daily flows         → src/orchestration/  (daily-flow.mdc)
5. Project to UI tokens     → src/adaptation/     (ui-adaptation.mdc)
6. Render projections       → src/ui/             (ui-adaptation.mdc)
7. Test                     → src/testing/        (coding-standards + simulation-testing)
```

**Import direction (never reverse):** `ui → adaptation → orchestration → engine → core`

---

## Hard Stops — Never Do This

- Put behavioral reasoning in React components, hooks, or `src/lib/store.ts`
- Redefine `UserState`, `Task`, `Intervention`, or `AdaptationOutput` outside `src/core/`
- Duplicate scoring logic anywhere — one authority per score type
- Persist derived behavioral state as source of truth — persist evidence, recompute interpretations
- Open modals, navigate, or notify from engine code — engines return contracts; UI renders
- Invent metrics (focus score, discipline index, motivation meter) not in engine contracts
- Use guilt, shame, streaks, urgency, or fake psychological certainty in copy or logic
- Skip pipeline steps or reorder orchestration for UI convenience

---

## Rule Files Quick Map

| Working in…                               | Primary rule                                                 |
| ----------------------------------------- | ------------------------------------------------------------ |
| `src/core/**`                             | `engine-contracts.mdc`                                       |
| `src/engine/state/**`                     | `state-engine.mdc`                                           |
| `src/engine/tasks/**`                     | `task-intelligence.mdc`                                      |
| `src/engine/interventions/**`             | `intervention-system.mdc`                                    |
| `src/orchestration/**`                    | `daily-flow.mdc`                                             |
| `src/ui/**`, `src/adaptation/**`, `*.tsx` | `ui-adaptation.mdc`                                          |
| `**/*.{ts,tsx}`                           | `coding-standards.mdc`                                       |
| `**/*.test.ts`, `src/testing/**`          | `simulation-testing.mdc`                                     |
| Any session                               | `product-philosophy.mdc` + `architecture.mdc` (always apply) |

---

## Deep Reference Docs

- [docs/architecture-freeze.md](docs/architecture-freeze.md) — system architecture
- [docs/engine-contracts.md](docs/engine-contracts.md) — full type specifications
- [docs/ai-regulations.md](docs/ai-regulations.md) — constitutional non-negotiables

When in doubt: regulation over engagement, sustainability over intensity, engine over UI.
