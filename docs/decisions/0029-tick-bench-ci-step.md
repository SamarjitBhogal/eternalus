---
title: 0029. CI runs the headless tick bench
description: CI runs `npm run bench` as one extra step after the `npm run check` steps, with no time assertion, and the root takes `vite` as a devDependency for it (DEC-351); read this before changing the bench step, its dependency or the CI gate row.
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-24
tags: [adr, ci, guardrail, process, performance]
related:
  [
    '.github/workflows/ci.yml',
    'eslint.config.js',
    'docs/process/guardrails.md',
    'docs/reference/game-design/13-owner-decisions-log.md',
    'docs/requirements/06-mvp-requirements.md',
  ]
---

# 0029. CI runs the headless tick bench

- Status: proposed. It records DEC-351 (product owner, swholtzman, 2026-11-23, relayed on PR #83)
  and is accepted when the product owner approves PR #83.
- Date: 2026-11-24

## Context

NFR-021 sets a simulation budget per tick at the unit cap. `npm run bench` (`scripts/bench/`)
fills every lane horde and prints the tick time headlessly. A script that only runs by hand breaks
silently when the core API it drives changes. Changing the CI workflow and the ESLint config is a
guardrail change (`docs/process/guardrails.md` §4), so it needs an ADR.

## Decision

1. CI runs `npm run bench` as one named step after the steps that mirror `npm run check`. It
   prints times and never asserts them, so a slow runner does not fail the build; a bench script
   that no longer runs does.
2. The root `package.json` takes `vite` as a devDependency, at the client's version, because the
   bench loads core through Vite. The `scripts/**/*.mjs` ESLint block comment names the bench as
   the one script that imports a package.
3. The reference machine for NFR-021 is the CI runner (`ubuntu-latest`), and the fill to 144 units
   per team is the measured load (DEC-351).

Options considered: run the bench by hand only (no cost, breaks unseen); assert a time budget in
CI (catches regressions, but shared runners are too noisy for a hard limit).

## Consequences

- Each CI run takes the bench's run time on top of `npm run check`.
- A change that breaks the bench fails CI on the PR that makes it.
- Tick-time regressions are still found by reading the printed numbers, not by a red check. A
  hard limit needs a new decision.
