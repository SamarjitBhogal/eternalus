---
title: Simulation kernel pull request body
description: The ready-to-paste pull-request description for feat/sim-kernel into phase/1-simulation-kernel-and-world (Sprint 1 session B), with the kernel API summary for sessions A, C and H, every difference from the design and the pre-PR gate results; read this when opening, reviewing or building on the simulation kernel PR.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-07
tags: [changelog, phase-1, sprint-1, pull-request, simulation]
related:
  [
    'docs/agents/prompts/2026-10-03-ultracode-sessions.md',
    'docs/plan/phase-1-simulation-kernel-and-world.md',
    'docs/architecture/03-game-model.md',
    'docs/architecture/15-diagnostics-and-runtime-testing.md',
  ]
---

# Simulation kernel pull request body

**Purpose.** Copy everything below the line into the PR from `feat/sim-kernel` into
`phase/1-simulation-kernel-and-world`. Reviewer: Sam picks (a core-minded teammate). Title:

`feat(core): deterministic simulation kernel (sprint 1.1)`

---

## Summary

Sprint 1.1, session B of the Sprint 1 prompts: the deterministic simulation kernel in
`packages/core`. `GameConfig` with defaults and validation, `SeededRandom` and the kernel utils,
`GameState`/`EntityStore`/`GameEvents`/snapshots/`StateHasher`, the `Command` union with a
handler registry, the `Logger` port, and the `Simulation` facade with a `SystemPipeline` and a
replay harness. Pure TypeScript, no new dependencies. The first commit (`config/`) can merge
early to unblock session A.

Follow-ups pushed after the PR opened (owner decisions of 2026-10-07, DEC-17…DEC-20 in the
decisions log): the two better-than-design items are signed off and folded into 03 §5 and
15 §4; the determinism lint is added (ADR 0012) with an `exp` wrapper; in-place `Vec2` variants,
`DiagnosticEvent` types and the replay fixture format (15 §7) finish sprint 1.1; the kernel's
design differences are folded into 01, 02, 03, 10, 15 and 17, each doc's interim gaps in one
"Implementation status" section; `validateGameConfig` gains 03 §10's initial-hordes cap rule;
`INBOX.md` hands session C its follow-ups.

## Why

Every later Sprint 1 session codes against this surface: session A swaps its map stand-ins for
`GameConfig`/`SeededRandom`, session C builds entities and systems on `GameState`, `GameEvents`
and `SystemPipeline`, session H drives `Simulation` from the client. Determinism (same seed and
commands, same match) is the NFR the replay tests prove.

## API summary for sessions A, C and H

New exports of `@eternalus/core` (an API change; `index.test.ts` pins the runtime ones):

| Export                                                                               | Kind     | Notes                                                                                                             |
| ------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `createDefaultGameConfig(overrides?)`                                                | function | Deep merge over the MVP defaults; the result is frozen and **not** validated.                                     |
| `validateGameConfig(unknown)`, `ConfigValidationError`                               | function | Throws on the first bad field with `path` (`map.numLanes`) and `rule`.                                            |
| `GameConfig`, `MapConfig`, `MatchConfig`, `LimitsConfig`, `DeepPartial`              | types    | §2.2 exactly, plus `map.navCellSize`.                                                                             |
| `Simulation`                                                                         | class    | `new Simulation(config, seed, logger, systems = [])`; `enqueueCommand`, `step`, `snapshot`, `on`, `hash`, `tick`. |
| `Command`, `CommandType`, `CommandRejectReason`, `AbilitySlot`, `Aim`, `InputIntent` | types    | `Command<'move'>` picks one member.                                                                               |
| `Snapshot`, `EntitySnapshot`, `MatchPhase`, `EntityId`, `RemovalCause`               | types    | Structured-clone-safe.                                                                                            |
| `GameEventMap`, `GameEventType`, `GameEventHandler`, `Unsubscribe`                   | types    | The full 03 §4 catalogue.                                                                                         |
| `SeededRandom`, `SeededRandomState`                                                  | class    | sfc32; `nextFloat()`, `nextInt(min, max)` (both inclusive), `fork(name)`, `getState()`, `fromState()`.            |
| `StateHasher`                                                                        | class    | Named by §2.2; `Simulation.hash()` is the usual entry.                                                            |
| `Logger`, `LogRecord`, `LogAttributes`, `SeverityText`, `SEVERITY`, `makeLogRecord`  | port     | OpenTelemetry severities; `makeLogRecord(level, scope, body, { tick, attributes } \| { tick, event })`.           |
| `DiagnosticEvent`, `DiagnosticEventMap`, `DiagnosticEventName`                       | types    | The structured diagnostics core logs (`command-rejected`, `invariant-violated`); `LogRecord.eventName` is typed.  |
| `MemoryLogger`, `NullLogger`                                                         | class    | Test and benchmark doubles.                                                                                       |
| `runReplay`, `Replay`, `ReplayOutcome`, `ReplayTarget`, `ReplayTargetFactory`        | function | `runReplay(replay, (config, seed) => new Simulation(...))`.                                                       |

**Session A (map):** PR #8 is merged into the phase branch and this branch has merged it in
(see "Re-sync with the phase branch" below). What is left for you is the `INBOX.md` request
"Session A (from session B)": swap `DEFAULT_MAP_CONFIG`, `MapRandom` / `map/Rng.types.ts`,
`validateMapConfig` and `DEFAULT_MAP_LAYOUT.navCellSize` for `createDefaultGameConfig().map`,
`SeededRandom` / `utils/Rng.types.ts` (`next()` is `nextFloat()`), `validateGameConfig` and
`config.map.navCellSize`, then delete the local `MapConfig`. `utils/vec2.ts` has `add`, `sub`,
`scale`, `normalize` (each with an in-place `*Into` form), `dot` and `length`.

**Session C (entities):** the owner-approved `INBOX.md` request "Session C (from session B)"
lists your follow-ups and the B-owned lines you may change for them (DEC-20): the entity
registry and default pipeline in `Simulation.ts`, `move`/`stop` handlers, removal through
`DeathSystem`, `StateHasher.fieldsOf`, `IdGenerator` ids, `recentCommands` and
`LogRecord.context`. Also useful: systems implement `System` (`systems/System.types.ts`: `name`,
`update({ state, logger })`) and draw randomness only from `state.rng`; `dev-spawn` hands the
factory the spawn context `{ team, position }`; `GameEventMap` already declares `entity-died`,
`invariant-violated`, `team-changed` and the rest of 03 §4.

**Session H (match):** build `new Simulation(createDefaultGameConfig(), seed, logger)`, call
`enqueueCommand` then `step()` once per tick, and keep the previous and current `snapshot()` for
interpolation (03 §5). Entity ids are strings in insertion order (`entity-10` sorts before
`entity-2`), so match the two snapshots by id, not by a sorted merge.

## Differences from the design

Judged against the docs at the base commit (`27e7e12`).

**Decided on 2026-10-07, now the design** (DEC-17…DEC-20, folded into the docs in this PR): the
grouped, nullable `EntitySnapshot` (03 §5); `makeLogRecord`'s options object with typed
`DiagnosticEvent`s (15 §4); the determinism lint (ADR 0012); command dispatch through a handler
registry and a queue drained once per step (03 §3, 17 R16); a store iterating in creation order
with string ids (03 §2); `StateHasher` serialising state itself, velocity included (03 §9); the
replay harness in `diagnostics/` with a target factory and typed `.ts` fixtures (15 §7; 15 §1
and 02 §2 allow `diagnostics/` the types of `commands/` and `config/`); ports in `.types.ts` files
(01 §3); `GameConfig` in the integration contract's shape with `map.navCellSize` (03 §10).

**Interim, recorded in 03 §12 and 15 §13** (critic: acceptable):

- `Simulation` is positional `(config, seed, logger, systems)` per the brief; no
  `SimulationOptions`, `exportReplay()` or `dispose()` yet; it applies queued commands itself
  until `CommandApplySystem` exists; its entity registry is empty until session C wires one.
- `move`, `stop`, `attack-target`, `cast-ability`, `intent` and `dev-set-controller` reject
  `not-supported` until their systems exist.
- Dev handlers spawn and remove directly until `SpawnSystem`/`DeathSystem` exist. `dev-spawn`
  caps: Legends count toward `maxUnitsPerTeam` too (glossary: a unit is a Legend, Mob or Boss),
  and a spawn that would pass a cap is rejected whole (03 §3), not clipped.
- `GameEventMap` ids without a type yet are strings; `command-rejected` and `ability-cast` type
  `command`/`slot` structurally because `state/` sits below `commands/`; `DamageSource` and
  `ShieldBar` are local to `GameEvents.types.ts` until `combat/` and C's shields exist.
- `GameState.snapshot()` stands in for `SnapshotSystem`; `Snapshot` and `EntitySnapshot` carry
  only the groups that exist; `MatchPhase` sits in `state/` and stays `countdown`.
- `GameState` has no `world`, `teams`, `hordes` or `recentCommands`; `MatchConfig` has no
  `hordeSpawnIntervalSeconds`, `capturePoints` or `timeline`; `Replay` has no `versions`,
  `ReplayOutcome` no `ok` or `violations`; no `LogRecord.context` yet.
- `campsPerSide` need not divide by the corridors (DEC-14); `validateGameConfig` enforces the
  other map rules of 06 §2.
- `IdGenerator`, `vec2.ts` and `deterministicMath.ts` are reachable only from tests until
  sessions A and C adopt them. `map/` keeps its own `MapConfig`, `DEFAULT_MAP_CONFIG`,
  `MapRandom` and `validateMapConfig` until session A's swap; the public API exports only
  `config/`'s `MapConfig`.
- The golden fixture's checkpoint hashes were regenerated once in this PR when `StateHasher`
  started hashing velocity (same seed, config and command log; 15 §7 allows it for an intended
  change). `systems/` holds `SystemPipeline.test.ts` besides the two files the brief names.

## Re-sync with the phase branch (2026-10-07)

After PR #8 merged, `phase/1-simulation-kernel-and-world` was merged into this branch:

- Kernel files and tests use `Team` from `teams/teams.types.ts` instead of `FeatureOwner`
  (removed from `maps.types.ts` by #8; `index.ts` keeps #8's deprecated aliases).
- `index.ts` exports both sides' API, `MapConfig` only from `config/`, and drops `MAP_1` (#8
  deleted it); `index.test.ts` pins the union and checks that the default `GameConfig` generates
  the same map as the map's stand-in config.
- The determinism lint (ADR 0012) now covers #8's code: `polarPoint` in `utils/geometry.ts` and
  one wall-ring test call `utils/deterministicMath.ts` (the change its own `TODO` asked for).
- Session B's decisions are renumbered DEC-17…DEC-20: #8's open INBOX items already use DEC-15 and
  DEC-16.
- Docs: both sides' edits kept in 01, 02, 03, 10, 15, 17, `packages/core/AGENTS.md`, the
  decisions log (both batches), `INBOX.md` (session A's requests to B moved to Done) and this
  log; 03 §10 cites DEC-14 for camp division; 03 §12 and 06 §10 drop the rows the merge resolved.

## How it was tested

- 295 core tests after the re-sync (statements 98.78%, branches 91.48%, functions 99.1%, lines
  98.69%, the map code included); the kernel's own files are at 100%; threshold raised 80 → 85.
- Determinism: 10 seeds × 3,000 ticks of seeded random commands with a test `WanderSystem`
  (spawns, jitters, 32+ live entities), recorded twice and replayed, identical at every 100-tick
  checkpoint: 356–377 ms over four runs on an Apple M4 Pro (24 GB, Node 24.21.0). A golden replay
  (`diagnostics/__fixtures__/wanderSeed7.replay.ts`) pins the hash format; a tampered
  checkpoint and a dropped command are both detected.
- `SeededRandom` seed-1 output cross-checked against an independent Python sfc32/splitmix32;
  FNV-1a against the reference vectors; config rules one test each; compile-time tests prove an
  unknown event, an unknown diagnostic event, mixed log attributes and an incomplete handler
  registry do not type-check; in-place vector forms agree bit for bit with the immutable ones over
  1,000 seeded vectors, including when `out` is an input. The lint was probed with code calling
  each banned function (destructuring included): every call is reported with ADR 0012 named, and
  `deterministicMath.ts` alone is exempt, still without `Math.random`.

## Checklist

- [x] `npm run check` passes locally
- [x] Tests added or updated (bug fixes include a test that failed before the fix)
- [x] No guardrail changes, **or** justified here with a link to the ADR: coverage threshold
      raised 80 → 85 (ratchet up only; session B brief); determinism lint added,
      [ADR 0012](../decisions/0012-determinism-lint-for-transcendental-math.md) (DEC-19)
- [x] No new dependencies, **or** each one justified here in one line and approved by a human
- [x] Changes stay within the scope of the task
- [x] Docs updated where behaviour or workflow changed (`packages/core/AGENTS.md`; architecture
      01, 02, 03, 10, 15, 17; ADR 0012; guardrails; decisions log DEC-17…DEC-20; `INBOX.md`)

### Pre-PR gate (`AGENTS.md`, ADR 0010), after everything above

- [x] Architecture critic run against the base commit's design docs: verdict and any
      better-than-design items (signed off and folded into the docs) noted below
- [x] `/ponytail-review` + `/ponytail` run on the diff: cuts applied and net lines noted below
- [x] `npm run check` re-run on the post-ponytail code and passes (result pasted below)

**Critic.** The `architecture-reviewer` subagent ran three passes against the docs at base
`27e7e12`, seeing only the branch and those docs.

- Pass 1: one blocker (Definition-of-done docs missing) and eleven violations: incomplete 03 §4
  event catalogue, no `Rng` port, no caps on `dev-spawn`, hash missing velocity, duplicated
  ceilings, missing sibling and compile-time tests, and doc nits. Reworked in
  `1b3990c`..`75608be`.
- Pass 2: one blocker (knip failed on two exported local types) and minor notes
  (`commands/` importing `components/`, PR wording). Fixed in `97ae286`..`bba76b0`.
- Pass 3: **NO BLOCKERS**. Its last notes are applied: `EntityFamily` renamed to `EntityClass`,
  and PR body corrections. The critic said the rename needs no further pass.
- Better than the design: the nested, nullable `EntitySnapshot` fields and `makeLogRecord`'s
  options object, raised in `INBOX.md`, signed off by the owner on 2026-10-07 (DEC-17, DEC-18)
  and folded into 03 §5 and 15 §4 in this PR.
- Pass 4 (on the post-sign-off follow-ups `abd2c07`..`6316809`): one blocker (this PR body and
  PROGRESS were stale) and minor items: 03 §10 had dropped base's initial-hordes cap rule and
  the divisibility Recommendation without a decision; recent events, port file names and entity
  order were described two ways across docs; session C's handoff had five gaps. Fixed in
  `70a8efc`, `16ad292` and the commit that updates this body.
- Pass 5: **NO BLOCKERS**; every pass-4 item resolved. Its last notes are applied in the commit
  that fills this line: the 03 §10 block relabelled as a sketch, the full merge-conflict list for
  session A, the provenance of two map rules, one citation, and valid configs in the cap tests.

**Ponytail.** `/ponytail-review` on the core diff found two cuts, both applied in `e821994`:

- the `RingBuffer.size` and `CommandQueue.size` getters, which only tests read;
- net −14 lines (10 source, 4 test assertions on the removed getters; the same behaviour is
  still asserted through `toArray()` and `drain()`).

On the follow-ups (in-place `Vec2` forms, `exp`, the lint config, `DiagnosticEvent`): nothing to
cut; the immutable vector forms already delegate to the in-place ones.

Kept because the architecture outranks ponytail:

- `IdGenerator`, `SystemPipeline` and the `StateHasher` class (named by the brief, 02 and §2.2);
- `SeededRandom.fromState` (the brief asks for a saveable state);
- `NullLogger`, `GameEvents.recentEvents` and `EntityStore.get`.

**Final check** (`npm run check` at the head of the branch, `EXIT=0`):

```text
All matched files use Prettier code style!
> eslint --max-warnings 0 .
> tsc -b
> knip            (no issues; one configuration hint about apps/client ignoreDependencies)
 Test Files  42 passed (42)
      Tests  295 passed (295)
Statements   : 98.78% ( 979/991 )
Branches     : 91.48% ( 451/493 )
Functions    : 99.1% ( 332/335 )
Lines        : 98.69% ( 907/919 )
 Test Files  7 passed (7)
      Tests  36 passed (36)
✓ built in 79ms
Checked 97 Markdown files under docs/.
Documentation check passed.
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)
