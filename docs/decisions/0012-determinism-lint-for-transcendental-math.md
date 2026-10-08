---
title: 0012. Determinism lint for transcendental Math
description: ESLint bans Math.sin, cos, atan2, exp and pow in packages/core except in utils/deterministicMath.ts, so every engine-dependent function has one replaceable home; read this before using trigonometry or powers in core or before touching the core ESLint block.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-07
tags: [adr, guardrail, determinism, eslint, core]
related:
  [
    'docs/architecture/03-game-model.md',
    'docs/architecture/02-code-structure.md',
    'docs/process/guardrails.md',
    'eslint.config.js',
  ]
---

# 0012. Determinism lint for transcendental Math

- Status: accepted (product owner decision, 2026-10-07, DEC-19)
- Date: 2026-10-07

## Context

A match must replay bit for bit from its seed and command log (architecture 03 §8). `+ - * /`
and `Math.sqrt` are IEEE 754 operations and give identical bits everywhere. `Math.sin`, `cos`,
`atan2`, `exp` and `pow` are implementation-defined: one browser on one machine agrees with
itself, but engines and CPUs may differ in the last bits (research §1, "Determinism pitfalls").
The design already routes these functions through `packages/core/src/utils/deterministicMath.ts`
(03 §8, 02 §11, rule 8) so they can be replaced by table or polynomial approximations in one
place if cross-browser replays ever matter. Until now only `Math.random` was enforced by ESLint;
the transcendental rule relied on review, and the sprint 1.1 plan makes the lint a done-when for
`SeededRandom` and the math wrappers.

## Decision

The `packages/core/src/**/*.ts` block of `eslint.config.js` restricts `Math.sin`, `Math.cos`,
`Math.atan2`, `Math.exp` and `Math.pow` with `no-restricted-properties` (destructuring included),
next to the existing `Math.random` ban. One override for
`packages/core/src/utils/deterministicMath.ts` lifts the five, keeping `Math.random` banned.
Core code calls `sin`, `cos`, `atan2`, `exp` and `pow` from `deterministicMath.ts`; steering
prefers vectors (`utils/vec2.ts`) to angles.

## Consequences

- A core change that calls one of the five directly fails `npm run check`, the git hooks and CI
  with a message naming this ADR and the wrapper file.
- Code outside core (the client, views) is not affected.
- A new transcendental function needed in core is added as a wrapper in `deterministicMath.ts`
  and to the banned list in the same change.
- Code written before this rule must switch to the wrappers when it merges (session A's
  `utils/geometry.ts` `polarPoint`, see `INBOX.md`).
- The `**` operator is not covered; reviewers treat it like `Math.pow`.
