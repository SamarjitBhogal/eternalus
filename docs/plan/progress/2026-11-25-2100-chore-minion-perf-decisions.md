---
title: 'Progress 2026-11-25: chore/minion-perf-decisions'
description: 'Phase 3 / minion plan "Unit-cap performance", SamarjitBhogal + Claude Code: measured AiSystem, PathingSystem and HordeSystem per tick and the deferred decisions against DEC-181 maxDecisionsPerTick at the Phase 3 target and at the unit cap; no miss.'
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-25
tags: [plan, progress, log, performance]
---

# Progress 2026-11-25: chore/minion-perf-decisions

Phase 3 / minion plan §1.2 "Unit-cap performance" · chore/minion-perf-decisions ·
SamarjitBhogal + Claude Code

- What was done: measured the minion plan's last open performance item, "pathing plus steering
  against DEC-181's `maxDecisionsPerTick`", on `phase/3-sprint-3-work` at `da524343`. Method: the
  `npm run bench` scenario (`scripts/bench/hordes.mjs`: generated 3-lane map, seed 1, the shipped
  bot roster, each team filled to 144 mobs and to the cap, 900 ticks timed from the first death),
  with a throwaway copy that wraps `update` of `AiSystem`, `PathingSystem`, `HordeSystem`,
  `StuckSystem`, `SpaceSystem` and `MovementSystem` in timers and reads `state.ai.deferred`
  after each tick. Not committed: per-system times belong to the `Profiler` port (15 §6,
  Phase 6). Node 24.21.0, a developer laptop (Linux); times are evidence, not the CI result
  (DEC-351). Results:

  | Case (mobs per team + 10 Legends) | Whole tick p50 / p95 / max (ms) | AI + pathing + steering p50 / p95 / max (ms) | `PathingSystem` p95 | `HordeSystem` p95 | Brains (p50 / max) | Deferred decisions per tick (p50 / p95 / max) | Ticks with a deferral | Longest wait (ticks) |
  | --------------------------------- | ------------------------------- | -------------------------------------------- | ------------------- | ----------------- | ------------------ | --------------------------------------------- | --------------------- | -------------------- |
  | 144 (Phase 3 target)              | 1.88 / 3.67 / 4.75              | 1.07–1.09 / 2.95–3.29 / 3.88–7.43            | 0.17                | 0.02              | 306 / 357          | 0 / 0 / 0                                     | 0 of 900              | 0                    |
  | 290 (the cap)                     | 2.53 / 4.05 / 5.77              | 1.24–2.26 / 2.79–5.41 / 4.25–11.24           | 0.35                | 0.02–0.03         | 587 / 649          | 348 / 456 / 496                               | 801 of 900            | 6                    |

  Ranges are over two runs; `AiSystem` is most of the AI + pathing + steering time (p95 2.5–2.8
  ms), `PathingSystem` and `HordeSystem` stay under 0.4 ms at p95.

- Findings against the Phase 3 targets and DEC-181:
  - At the Phase 3 target nothing is deferred, and the whole tick meets the 8 ms p95 budget
    (NFR-021).
  - At the cap the budget of 96 decisions is spent on most ticks and about 350 to 500 brains
    wait, but the backlog is bounded (it does not grow over the 900 ticks) and the longest wait
    is 6 ticks: `floor((649 − 1) / 96)`, the bound `content/ai/cadence.ts` states and the guard
    leash tolerance covers (DEC-181 (H2)). So DEC-181 holds as measured; no miss to take to the
    owner. A max of 11 ms for AI + pathing + steering in one tick of one run is a single spike,
    not the p95; the whole-tick budget at the cap has no target yet (`INBOX.md` DEC-137 (1)).
  - The minion plan's "Unit-cap performance" row is closed: the whole-tick p95 runs in CI on
    every push (DEC-351), and this entry records the decision-budget check.
- Checks run: `npm run docs:check` (docs only; no code changed).
- Next step: Phase 6 adds the `Profiler` port, which makes the per-system split a CI number.
