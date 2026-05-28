# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CLAUDE.md`** at the repo root — this is the **primary context** for this project (used instead of `CONTEXT.md`). Contains team setup, tech stack, conventions, and Phase 1 plan.
- **`PHASE_1_PROJECT.md`** at the repo root — current production hardening plan with task ownership matrix.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in. Currently empty; ADRs will be created lazily by `/grill-with-docs` as decisions crystallise.

If `docs/adr/` doesn't exist yet, **proceed silently**. Don't flag absence; don't suggest creating ADRs upfront.

## File structure

Single-context repo:

```
/
├── CLAUDE.md                ← primary context (Thai + English)
├── PHASE_1_PROJECT.md       ← current plan + owner matrix
├── docs/
│   ├── adr/                 ← architecture decision records (lazy)
│   └── agents/              ← this folder (skill config)
└── backend/ + frontend/
```

## Use the existing vocabulary

When your output names a domain concept (issue title, refactor proposal, hypothesis, test name), use terminology already established in `CLAUDE.md` and `PHASE_1_PROJECT.md`:

- **wallet** (not "balance" or "credit")
- **idle fee** (not "parking fee")
- **outstanding debt** (not "negative balance")
- **booking** vs **charging session** (distinct concepts — see Phase 1 plan)
- **admin / tech / user** roles

If the concept you need isn't documented yet — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-XXXX — but worth reopening because…_
