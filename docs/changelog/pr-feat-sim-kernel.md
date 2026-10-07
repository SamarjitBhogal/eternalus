---
title: Simulation kernel pull request body
description: The ready-to-paste pull-request description for feat/sim-kernel into phase/1-simulation-kernel-and-world (Sprint 1 session B), with the kernel API summary for sessions A, C and H, every difference from the design and the pre-PR gate results; read this when opening, reviewing or building on the simulation kernel PR.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-06
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
| `Logger`, `LogRecord`, `LogAttributes`, `SeverityText`, `SEVERITY`, `makeLogRecord`  | port     | OpenTelemetry severities; core never logs to a sink itself.                                                       |
| `MemoryLogger`, `NullLogger`                                                         | class    | Test and benchmark doubles.                                                                                       |
| `runReplay`, `Replay`, `ReplayOutcome`, `ReplayTarget`, `ReplayTargetFactory`        | function | `runReplay(replay, (config, seed) => new Simulation(...))`.                                                       |

**Session A (map):** see `INBOX.md` "Requests for the agent". Short form: `createDefaultGameConfig().map` has your
field names plus `navCellSize: 5` and `presetId: 'map-1'`; `validateGameConfig` carries every
`validateMapConfig` rule; `SeededRandom.nextFloat()` replaces `MapRandom.next()` and
`utils/Rng.types.ts` replaces `map/Rng.types.ts`; `utils/deterministicMath.ts` has `sin`, `cos`,
`atan2`, `sqrt`, `pow`; `utils/vec2.ts` has `add`, `sub`, `scale`, `dot`, `length`,
`normalize` (your `distance`/`lerpPoint` stay in `geometry.ts`). Keep `FeatureOwner` exported
from `content/maps/maps.types.ts`: `commands/Command.types.ts`, `state/GameEvents.types.ts`,
`state/Snapshot.types.ts`, `commands/handlers/DevSpawnHandler.ts` (and C's `TeamMembership`)
import it. Merging both branches conflicts in `index.ts`, `index.test.ts`,
`packages/core/AGENTS.md`, `PROGRESS.md` and `INBOX.md`, and exports `MapConfig` twice until
your local type is deleted.

**Session C (entities):** one line in `Simulation.ts` (marked `TODO`) passes your
`createDefaultEntityRegistry()`; until then `dev-spawn` through `Simulation` rejects
`unknown-kind`. `dev-spawn` hands the factory the spawn context `{ team, position }` and counts
`Unit` / `Legend` instances per team for the caps (`EntityStore.countOnTeam`). `move`, `stop`, `attack-target`,
`cast-ability`, `intent` and `dev-set-controller` reject `not-supported` through the shared
`UnsupportedCommandHandler`; replace their lines in `commands/defaultCommandHandlers.ts` with
real handlers as their systems land (the registry type forces one handler per type). Systems
implement `System` (`systems/System.types.ts`: `name`, `update({ state, logger })`) and draw
randomness only from `state.rng`. `GameEventMap` already declares `entity-died`,
`invariant-violated`, `team-changed` and the rest of 03 §4. `EntityStore.remove(id, cause)`
retires the entity; the dev handlers spawn and remove directly until `SpawnSystem` /
`DeathSystem` exist (`TODO`s mark both). `utils/IdGenerator` is ready for `EntityFactory`'s
counter. `StateHasher` hashes `Transform`, `Health`, `TeamMembership` and `Movement`; a new
component with simulation state needs its fields in `StateHasher.fieldsOf`, which is in `state/`
(B's), so ask through `INBOX.md` "Requests for the agent".

**Session H (match):** build `new Simulation(createDefaultGameConfig(), seed, logger)`, call
`enqueueCommand` then `step()` once per tick, and keep the previous and current `snapshot()` for
interpolation (03 §5). Entity ids are strings in insertion order (`entity-10` sorts before
`entity-2`), so match the two snapshots by id, not by a sorted merge.

## Differences from the design (critic: acceptable)

Judged against the docs at the base commit; each is forced by the session brief or the §2
contract, or is an interim stand-in.

- `GameConfig` follows §2.2, not 03 §10 (no timeline, no `mapPreset`); `map.navCellSize` is
  added at session A's request; validation throws on the first problem (brief) and adds A's map
  rules (odd lanes, even corner camps, no camps with one lane; 06 §2). 06 §2's divisibility
  recommendation is not implemented (06 §2 marks it a Recommendation; session A's unmerged
  DEC-14 splits camps unevenly instead).
- `Simulation` is positional `(config, seed, logger, systems)` per the brief; no
  `SimulationOptions`, `exportReplay()` or `dispose()` yet.
- Commands: names per the brief (`dev-spawn`, `dev-remove-entity`); a typed registry object
  instead of 03 §3's exhaustive `switch`; `CommandQueue` drains once per step instead of
  stamping tick and sequence (same next-tick, enqueue-order semantics, tested).
- `EntityStore` iterates in insertion order with the base branch's string ids, not ascending
  numeric slots.
- Dev handlers spawn and remove directly (03 §4/§8 give that to `SpawnSystem`/`DeathSystem`,
  session C). `dev-spawn` caps: Legends count toward `maxUnitsPerTeam` too (glossary: a unit is
  a Legend, Mob or Boss), and a spawn that would pass a cap is rejected whole (03 §3), not
  clipped.
- `GameEventMap` payloads use strings for ids without a type yet; `command-rejected` and
  `ability-cast` type `command`/`slot` loosely because `state/` sits below `commands/`;
  `DamageSource` (until `combat/` exists) and `ShieldBar` (until C's `Health.types.ts` has
  shields) are local types of `GameEvents.types.ts`.
- The snapshot holds the current tick only; the client keeps previous and current (03 §5).
  `snapshot()` sits on `GameState` (no `SnapshotSystem` yet); `MatchPhase` sits in `state/`.
- `GameState` has no `teams` or `recentCommands` yet (nothing to hold).
- Replay: `diagnostics/replay.ts` (brief) with `recordReplay`/`runReplay` and a target factory
  (keeps `diagnostics/` from importing `Simulation`); no versions, `configHash`, `ok` or
  `violations` yet; the golden fixture is a typed `.ts` file. Its checkpoint hashes were
  regenerated once in this PR when `StateHasher` started hashing velocity (same seed, config and
  command log; 15 §7 allows it for an intended change). `diagnostics/` imports types from
  `commands/` and `config/`, beyond 02 §2's `state/` and `utils/` (forced by the replay format).
- Logger port in `Logger.types.ts` (brief); no `LogRecord.context` or `DiagnosticEvent` types
  (they arrive with the invariants).
- The `Math.sin/cos/atan2/exp/pow` lint ban is not added (`eslint.config.js` is outside this
  session; see `INBOX.md`). `exp` is not wrapped (the brief's list omits it).
- `IdGenerator`, `vec2.ts` and `deterministicMath.ts` are reachable only from tests until
  sessions A and C adopt them.
- `CONTRIBUTING.md` and `docs/process/guardrails.md` carry a copy of the coverage threshold and
  were updated with it.
- `systems/` holds `SystemPipeline.test.ts` besides the two files the brief names (tests sit
  next to their file).

Better than the design, awaiting sign-off (`INBOX.md`): the nested, nullable `EntitySnapshot`
fields and `makeLogRecord`'s options object.

## How it was tested

- 197 core tests, 100% statements/branches/functions/lines; threshold raised 80 → 85 (brief).
- Determinism: 10 seeds × 3,000 ticks of seeded random commands with a test `WanderSystem`
  (spawns, jitters, 32+ live entities), recorded twice and replayed, identical at every 100-tick
  checkpoint: 367–377 ms on an Apple M4 Pro (24 GB, Node 24.21.0). A golden replay
  (`diagnostics/__fixtures__/wanderSeed7.replay.ts`) pins the hash format; a tampered
  checkpoint and a dropped command are both detected.
- `SeededRandom` seed-1 output cross-checked against an independent Python sfc32/splitmix32;
  FNV-1a against the reference vectors; config rules one test each; compile-time tests prove an
  unknown event and an incomplete handler registry do not type-check.

## Checklist

- [x] `npm run check` passes locally
- [x] Tests added or updated (bug fixes include a test that failed before the fix)
- [x] No guardrail changes, **or** justified here with a link to the ADR: coverage threshold
      raised 80 → 85 (ratchet up only; session B brief)
- [x] No new dependencies, **or** each one justified here in one line and approved by a human
- [x] Changes stay within the scope of the task
- [x] Docs updated where behaviour or workflow changed (`packages/core/AGENTS.md`; design-doc
      deltas listed above and requested in `INBOX.md`)

### Pre-PR gate (`AGENTS.md`, ADR 0010), after everything above

- [ ] Architecture critic run against the base commit's design docs: verdict and any
      better-than-design items (signed off and folded into the docs) noted below
- [ ] `/ponytail-review` + `/ponytail` run on the diff: cuts applied and net lines noted below
- [ ] `npm run check` re-run on the post-ponytail code and passes (result pasted below)

**Critic.** _pending_

**Ponytail.** _pending_

**Final check.** _pending_

🤖 Generated with [Claude Code](https://claude.com/claude-code)
