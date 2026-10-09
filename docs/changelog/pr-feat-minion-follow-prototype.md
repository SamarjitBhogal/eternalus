---
title: 'PR: feat/minion-follow-prototype'
description: The pull-request description for feat/minion-follow-prototype into phase/1-simulation-kernel-and-world - a demo prototype where light minions escort the player's Legend (PROTO-01), the deviations from the design it carries until Phase 3 replaces it, and the pre-PR gate results; read this when reviewing that PR or removing the prototype.
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-10-08
tags: [changelog, pull-request, ai, minions, prototype, phase-3]
related:
  [
    'docs/architecture/11-game-ai.md',
    'docs/plan/phase-3-minions-hordes-and-ai.md',
    'docs/reference/suggestions/balancing.md',
  ]
---

# PR: feat/minion-follow-prototype

**Purpose.** The description for the pull request from `feat/minion-follow-prototype` into
`phase/1-simulation-kernel-and-world`. It is a **prototype for the demo**: six light minions
escort the player's Legend. It is not the Phase 3 design and is meant to be replaced, not
extended.

## Summary

- Minions spawn around the player at the Light Stronghold, walk after the player's Warrior, keep a
  little space from it and from each other, and settle around it when it stops.
- Core: a `Controller` contract and `AiSystem` in `ai/` (decisions apply on the next tick, at the
  minion cadence of architecture 11 §6), `FollowLeaderController`, a `Brain` component added by
  `Unit` when a definition names a `controller`, `EntityStore.positionOf/teamOf/controllerOf/
isSteering` so `ai/` never imports `components/`, the `light-minion` definition and the
  `follow-leader` profile in `content/`.
- Client: `Match` spawns the escort through `dev-spawn` commands (replayable); `MobView` draws mobs
  on a dark outline, because the default view painted them in their team colour and they vanished
  on their own Stronghold.

## Why

The owner's goal for the demo was "minions move with the player". Option (b), minions following the
player's Legend, was chosen by SamarjitBhogal on 2026-10-08 as a **prototype decision to be
replaced** by the real Phase 3 systems. It is recorded as **PROTO-01** in `INBOX.md` for the
product owner (sholtzman) to confirm. No design document was changed.

## Finding the prototype code

All prototype code is temporary. Every piece carries the marker `PROTOTYPE(PROTO-01) TEMPORARY`,
followed by what replaces it; `git grep -n 'PROTOTYPE(PROTO-01)'` lists all of them: the follow
controller, its profile and tests, the light-minion definition, the escort spawn in `Match`, and
the interim shapes of `AiSystem`, `Brain`, the `EntityStore` read helpers, the `Unit` brain
attach, the `Simulation` controller list and `DefaultSystemPipeline`'s `decide` parameter. Agents
must not build on or extend marked code.

## What replaces it (PROTO-01)

| Prototype piece                                                     | Replaced by                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------- |
| `ai/FollowLeaderController.ts`, `content/ai/followLeaderProfile.ts` | `MinionController` FSM and aggro profiles (sprint 3.3)         |
| `PROTOTYPE_ESCORT` spawn in `apps/client/src/game/Match.ts`         | `SpawnSystem` and hordes (Phase 2, sprint 3.1)                 |
| Scan of every entity per decision                                   | `Perception` over `SpatialHash` (11 §3)                        |
| `Brain` component holding only a controller id                      | Plain data in `state.ai.brains` with memory and an RNG (11 §2) |

## How it was tested

- Core: `FollowLeaderController` rules (pull to the nearest allied Legend, separation from the
  Legend and other followers only, stop only while steering, cadence), `AiSystem` (store order,
  cadence spread, throws on an unknown controller), `Brain`, `LightMob` brain attach,
  `EntityStore` helpers, and a scenario test: a Warrior walks 5 s, four minions follow and settle
  within reach, and the same run gives the same state hash.
- Client: `MobView`, the view registry, the escort spawning and walking after the player, the
  exact default-view warning for a kind with no view, and no warning for mobs.
- Headless Chrome: Main menu → Start match → hold D: the escort trails the player and settles
  around it.

## Deviations from the design (the critic marked them acceptable)

1. **`AiSystem` lives in `ai/`** and `Simulation` passes it to `DefaultSystemPipeline`, because
   `systems/` may not import `ai/` (core `AGENTS.md`) while 02 §2 and 11 §1 call it a system. The
   tick order is therefore split across two files (02 §9). Asked in PROTO-01.
2. **Stagger by store position**, not `(tick + entityId)` (11 §6): ids are strings. Deterministic,
   but an entity's phase shifts when an earlier entity is removed. No per-tick decision budget or
   round-robin cursor yet (`ponytail:` note in `AiSystem.ts`).
3. **No `ai/defaultControllerRegistry.ts`**; `Simulation` builds the one-controller list, and
   `Controller.id` is a `string`, not a `ControllerId` union. Add both with the second controller.
4. **`Brain`** is a component, not hashed by `StateHasher` (its id follows from the hashed
   definition) and attached by `Unit`, not `EntityFactory`.
5. **O(n²) scan** instead of `Perception` (`ponytail:` note in `FollowLeaderController.ts`).
6. **Escort numbers in the client** (`PROTOTYPE_ESCORT`: count 6, radius 2 m) and an escort in
   every match, as a stand-in for `SpawnSystem`. Consider a flag before phase 1 merges to `main`.
7. **An unknown controller id fails on the first tick**, not at content load (02 wants it checked
   once at the boundary).
8. **Profile location and typing**: `content/ai/followLeaderProfile.ts` instead of
   `content/ai/profiles/<id>.ts`, no `satisfies` (its type lives in `ai/`, which `content/` cannot
   import). The scenario test is `ai/followLeader.scenario.test.ts`, not `ai/scenarios/`.
9. **Minion stats**: health 150 and radius 0.4 are `balancing.md`'s light-minion anchors; speed
   5.4 m/s (anchor 3.5) so the escort keeps up with a 6 m/s Warrior, and mass 0.5 (anchor 40 on
   the repo's Warrior = 1 scale). The owner is asked to confirm in PROTO-01.
10. **A Phase 3 prototype in the Phase 1 branch**: it ships in the phase-1 → `main` PR unless it is
    removed first.

## Notes for the reviewer

- `apps/client/src/game/Match.test.ts`: the test "logs once for each kind it has to draw with the
  default view" now uses an `obstacle` through test-injected content, because mobs have a view of
  their own. Its assertion is unchanged; a new test checks that mobs log no warning.
- `packages/core/src/index.ts` is unchanged: no public API change.

## Pre-PR gate (ADR 0010)

- **Critic** (`architecture-reviewer`, docs as of `44ef103`): pass 1 had one blocker (the test
  above had lost its exact assertion) and should-fix items (command volume, unknown controllers,
  `Math.hypot`, unsourced numbers, dates); all were fixed. Pass 2: **NO BLOCKERS**.
- **Ponytail** (`/ponytail-review`, level lite): one cut applied (`FollowLeaderController` stops
  copying the steering vector, −2 lines); two declined because the architecture keeps them (the
  `Brain` id guard is validation at a boundary; merging `MobView` into `LegendView` would rewrite
  merged code for no saving).
- **Final check** (Node 24.21.0, Linux): `npm run check` → `EXIT=0`: "All matched files use
  Prettier code style!"; core "Tests 459 passed (459)" (statements 99.03%, branches 93.55%);
  client "Tests 292 passed (292)" (statements 92.61%, branches 93.35%); "✓ built in 162ms";
  "Documentation check passed."

## Checklist

- [x] `npm run check` passes
- [x] Tests for every behaviour change
- [x] `PROGRESS.md` entry
- [x] Critic: no blockers
- [x] Ponytail review applied
- [ ] Product owner confirms PROTO-01

🤖 Generated with [Claude Code](https://claude.com/claude-code)
