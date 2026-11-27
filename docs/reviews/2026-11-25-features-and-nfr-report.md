---
title: Features and non-functional requirements report (2026-11-25)
description: Dated report of the features added in Sprint 3 (phase/3-sprint-3-work) and the state of every non-functional requirement NFR-001 to NFR-034 - what each feature does, how it is built, its pull requests and tests, and for each NFR whether it is met, partly met or not yet met, with the evidence; read this for a one-stop account of what the game does and how well it does it at the end of Sprint 3.
audience: [humans]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-27
tags: [review, features, nfr, requirements, sprint-3, report]
related:
  - docs/requirements/06-mvp-requirements.md
  - docs/requirements/05-engineering-standards.md
  - docs/plan/README.md
  - docs/plan/game-loop-and-results-plan.md
  - docs/plan/minion-system-plan.md
  - docs/plan/multiplayer-and-scalability-plan.md
---

# Features and non-functional requirements report (2026-11-25)

## Purpose

Read this for one account of what Eternalus does at the end of Sprint 3 and how well it does
it. Part 1 describes the features added in Sprint 3: what the player sees, how each feature is
built, and where its pull requests and tests are. Part 2 goes through every non-functional
requirement (NFR-001 to NFR-034) from
[06-mvp-requirements](../requirements/06-mvp-requirements.md#non-functional-requirements) and
says whether it is met, with the evidence. This is a dated report: it records the state on
2026-11-25 (`phase/3-sprint-3-work` at `67dbae61`). Two changes came from the PR review: the
NFR-021 row cites a CI run from 2026-11-26, and on 2026-11-27 every status was checked again
against the Acceptance column of 06 (see the status key in Part 2).

## Summary

- **Game.** Eternalus is a browser-only lane-battle game: two teams (`light` and `dark`) march
  minion hordes down lanes, Legends (hero units) fight alongside them, and a team loses when its
  Sovereign (King) falls. The player controls one Legend; bots control the rest. A second mode,
  the online 1v1 **Duel**, pits two human players against each other through a match server.
- **Sprint 3** (work merged into `phase/3-sprint-3-work` from 2026-11-02 to 2026-11-25, plan
  sprints S3 and S4) turned the Sprint 2 simulation (combat, hordes, flow fields, bot laners)
  into a full match: a match director with a win condition and scoring, objectives (camps,
  capture points, bosses), Legend progression and respawn, a complete HUD, the online Duel with
  matchmaking, and the developer menu.
- **NFRs.** Of 34 NFRs, 5 are met, 28 are partly met and 1 is not yet met (CSP and unsafe-sink
  lint rules, NFR-014). A status is Met only when the Acceptance check in 06 passes; most Partly
  rows are in place but lack the check that 06 names. The largest open item for maintainability is
  `Simulation.ts` (761 lines), which breaks the project's own size limits (NFR-001, NFR-003).

## Part 1: Features added in Sprint 3

Most features follow the same build pattern (NFR-005): a content entry in
`packages/core/src/content/`, a strategy or system in `packages/core/src/`, one registry line,
and tests next to the code. Some also edit `Simulation.ts` and existing systems (see NFR-005 in
Part 2). Pull request numbers refer to the GitHub repository.

### 1.1 Match director, Sovereign win and match flow

**What the player sees.** A match starts with a 3-2-1 countdown overlay, runs through timed
phases, and ends the moment a team's Sovereign dies, going straight to a win/lose screen with
verdict lines. The match clock counts from the end of the countdown.

**How it is built.** `MatchDirector` (`packages/core/src/match/`) owns the match phases and runs
a `MatchTimeline` of scheduled marks. Win conditions are `VictoryCondition` strategies
(`defaultVictoryConditions.ts`); the Sovereign rule is the only MVP one
([ADR 0021](../decisions/0021-sovereign-is-the-win-objective.md)). The director listens to
`GameEvents` rather than being called by systems.

**Pull requests.** #74 (director, Sovereign win, the human's roster slot), #94 (win/lose screen),
#138 (countdown overlay, match time from its end).

**Tests.** `MatchDirector.test.ts`, `MatchTimeline.test.ts`, `defaultVictoryConditions.test.ts`,
`defaultMatchPhases.test.ts`.

### 1.2 Scoring

**What the player sees.** Points for kills, assists, destroyed structures, reached checkpoints
and held capture points, shown in the HUD and on the results screen.

**How it is built.** `Scoring` and a `ScoreBook` keep one row per Legend and per team; each way
of scoring is a `ScoringRule` strategy (`defaultScoringRules.ts`). Score windows (for example how
long after a hit an assist still counts) are content values loaded once and converted to ticks
at load (#125, #139).

**Pull requests.** #93, #95, #139.

**Tests.** `Scoring.test.ts`, `defaultScoringRules.test.ts`, `Simulation.scoring.test.ts`.

### 1.3 Lane minions: objectives, camps, defenders and level-up

**What the player sees.** Minion hordes march their lanes in formation, hold gates, guard towers
and attack the next enemy structure. Neutral forest camps can be cleared. Checkpoints spawn
defenders, and lane minions level up when their team holds a zone.

**How it is built.** Minion brains are behaviour strategies chosen by unit class; hordes path on
shared flow fields (Sprint 2) and pick targets through aggro rules in content. The work followed
the [minion system plan](../plan/minion-system-plan.md) milestones M2c, M5b, M6, M6b and M10.

**Pull requests.** #56 (lane objectives, gate holding, tower guards), #57 (minion XP, ghosted
first wave), #58 (forest camps), #66 (bot laners push structures), #85 (playtest fixes), #130
(checkpoint defenders), #131 (zone level-up).

**Tests.** `Simulation.hordes.test.ts`, `Simulation.flowFields.test.ts`, the `SpawnSystem` and
AI tests under `packages/core/src/ai/`.

### 1.4 Capture points and bosses

**What the player sees.** Capture points on the map that a team captures by standing in them, a
mini-boss guarding each capture point, a boss guarding each corner camp ring, and the Cathedral
gem, a hittable objective at the centre of the map.

**How it is built.** Capture points are `Zone` entities with a capture rule (DEC-86); bosses are
entity kinds added through the entity registry, each with its content definition.

**Pull requests.** #64 (capture points), #91 (corner camp boss), #99 (capture point mini-boss),
#132 (Cathedral gem).

**Tests.** `Simulation.capture.test.ts`, `Simulation.cornerBoss.test.ts`,
`Simulation.bossFight.test.ts`.

### 1.5 Legend progression, healing and respawn

**What the player sees.** The Legend gains XP (including from structures, shared with the whole
team), levels up, heals out of combat, and when killed respawns at its Stronghold after a fixed
10 seconds.

**How it is built.** `ProgressionSystem` levels Legends along level curves from content, with XP
sources in content. Healing and respawn are systems driven by tick counts, never timers (NFR-018).

**Pull requests.** #78 (structure XP, XP rework), #86 (out-of-combat healing), #88 (level and XP
in the HUD), #100 (respawn after 10 s).

**Tests.** The progression, healing and respawn system tests in `packages/core/src/systems/`.

### 1.6 HUD and in-match feedback

**What the player sees.** Character select and a HUD built from the product owner's Figma frames,
a live aether (mana) bar, health bars on units that have fought, a gold chevron showing which way
each unit faces, and a minimap centred on the player with unit dots. Zoom and minimap keys work.

**How it is built.** React components in `apps/client/src/ui/hud/` read throttled snapshots
from the store (architecture rule 10); the game views draw through the `Renderer` port. One
snapshot class with a player-only `PlayerSnapshot` keeps the HUD from seeing data it should not
(#92).

**Pull requests.** #68, #77, #79, #89, #92, #101, #143.

**Tests.** Server-rendered component tests next to each component, and view tests in
`apps/client/src/game/views/`.

### 1.7 Online 1v1 Duel

**What the player sees.** A Duel mode in the menu: join a queue, get paired with an opponent of
similar rating, see a VERSUS screen and a 3-2-1-START, and fight in the closed Cathedral arena
with only the two Legends, both at max level. First to 10 kills wins; a player who stays when the
other leaves wins. The game tells the player what is happening (queued, opponent left,
disconnected).

**How it is built.** A server-authoritative match server in `apps/server/`
([ADR 0016](../decisions/0016-multiplayer-server-authoritative-duel.md)) runs the same
`@eternalus/core` simulation as the browser, so both sides agree tick for tick. Players get a
guest identity and a reconnect window; the queue pairs by Glicko-2 rating
(`apps/server/src/rating/`). Duel rules (kill target, arena, max level) live in content.

**Pull requests.** #97 (Duel server), #102 (Duel rules and start), #103 (queue tests and load
mode), #104 and #105 (guest identity, reconnect, Glicko-2, deploy files), #118 (player
messaging), #126 (the player who stays wins), #142 (max level), #145 (arena with only the two
Legends).

**Tests.** Server tests for the queue, gateway and host (111 after #103), `duelArena.test.ts`,
`duelStartPoints.test.ts`, and the `npm run duel:bots` load runner.

### 1.8 Developer menu

**What the player sees.** With `?dev=1` in the URL, F1 opens a developer menu that spawns mobs
and Legends and removes entities.

**How it is built.** Every menu action is a `Command`, like player input, so it is applied on
the next tick and recorded in the replay (architecture rule 9).

**Pull requests.** #107, #109.

**Tests.** Command handler tests and `Simulation.devLegends.test.ts`.

### 1.9 Supporting engineering work in Sprint 3

- **Object pool** (`packages/core/src/utils/ObjectPool.ts`, #51) for allocation-free hot paths
  (NFR-023).
- **Headless tick bench** (`npm run bench`, #83) and its CI step
  ([ADR 0029](../decisions/0029-tick-bench-ci-step.md)).
- **Content durations become ticks at load** (#125, #139), so no system converts seconds at run
  time.
- **Shared geometry and A\* limits** (#120, #121).

## Part 2: Non-functional requirements

Status key: **Met**: the Acceptance check in the 06 table passes. **Partly**: some of it is in
place, and the row names the missing part. **Not yet**: none of it is in place. Many gaps are due
in a later phase (the Phase column of 06), so Partly does not always mean late. The next update
of this report adds that phase to each row as a Due column (owner, 2026-11-27). The full statement
of each NFR is in
[06-mvp-requirements](../requirements/06-mvp-requirements.md#non-functional-requirements).

### 2.1 Maintainability

| NFR     | Requirement (short)                                 | Status | Evidence and gaps                                                                                                                                                                                                                                                                                                                                                       |
| ------- | --------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-001 | OOP, SOLID, DRY; no monoliths, no tight coupling    | Partly | Layered model ([architecture 01](../architecture/01-layered-oop-model.md)), strategies and registries, systems talk through `GameEvents`. Gap: `packages/core/src/Simulation.ts` (761 lines) is a monolith to split.                                                                                                                                                    |
| NFR-002 | No hardcoding or magic numbers                      | Partly | Tuning lives in `packages/core/src/content/` and `config/`, validated by `validateGameConfig()`; review rejects numbers in code. Gap: no lint rule flags numeric literals in `systems/`, `ai/` and `views/`.                                                                                                                                                            |
| NFR-003 | Files ~300 lines, functions ~60, inheritance ≤ 3    | Partly | One class per file holds. Over the size limit: `Simulation.ts` (761, with a ~165-line constructor), `SessionController.ts` (443), `ui/strings.ts` (399), `DuelSession.ts` (328) and a few files just over 300. ESLint has no `max-lines` or `max-lines-per-function` rule; the depth test exists (`defaultEntityRegistry.test.ts`).                                     |
| NFR-004 | Renaming a class touches only its file and imports  | Partly | Behaviour is keyed by kebab-case content id and display names live in content ([ADR 0023](../decisions/0023-content-ids-renamable-until-saved.md)). Gap: the rename check from a scratch branch is not recorded.                                                                                                                                                        |
| NFR-005 | New feature = class + content entry + registry line | Partly | Many Part 1 features add a content entry, a strategy or system and a registry line; recipes in [architecture 17](../architecture/17-extension-recipes.md). Gap: features still edit `Simulation.ts` and existing systems (for example, #99 changed `Simulation.ts`, `CaptureSystem`, `ProgressionSystem` and `SpawnSystem`), and no recipe test adds a throw-away kind. |
| NFR-006 | Layering enforced mechanically                      | Partly | TypeScript project references and ESLint restricted imports keep core free of React/DOM. Gap: no automatic check for import cycles, for `ui/` imports of `game/`, or for Canvas calls outside `Canvas2dRenderer`; review checks these (AGENTS.md).                                                                                                                      |

### 2.2 Scalability

| NFR     | Requirement (short)                                      | Status | Evidence and gaps                                                                                                                                                                                                                                  |
| ------- | -------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-007 | 144 units per team, engineered for hundreds              | Partly | The tick bench fills each team to 144 and to 290 (see NFR-021); caps live in `GameConfig`; `ObjectPool` and typed arrays in hot systems. Gap: the 30-minute soak at cap is not automated.                                                          |
| NFR-008 | Map, spawns, flow fields and minimap scale with config   | Met    | Config-driven `MapGenerator` ([ADR 0009](../decisions/0009-config-driven-map-generation.md)); `numLanes` and towers per lane come from config.                                                                                                     |
| NFR-034 | A server for hundreds or thousands of concurrent players | Partly | Duel server with matchmaking. Measured (#103; Ryzen 9 9950X3D, Node 24, loopback): 300 queued bots, 750 matches, time-to-match p50 ≈ 250 ms, none lost or duplicated; 400 bots failed, probably at the connection cap. Thousands is not yet shown. |

### 2.3 Process (SDLC) and traceability

| NFR     | Requirement (short)                                           | Status | Evidence                                                                                                                                                                                                                                                                                                                                                               |
| ------- | ------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-009 | Phases, sprints, task branches, reviewed PRs, ADRs, changelog | Partly | `phase/<n>-<name>` branches ([ADR 0007](../decisions/0007-phase-branching-model.md)), 119 merged PRs, 26 ADRs, progress entries in `docs/plan/progress/`. Gap: of the 119 merged PRs, 20 cite an `FR-`, `NFR-`, `AP-` or `ES-` id, and 23 merged without a team approval in force (13 with no approval, 7 approved only by CodeRabbit, 3 with an open change request). |
| NFR-010 | Requirements traceability                                     | Partly | Traceability matrix in [06-mvp-requirements](../requirements/06-mvp-requirements.md#traceability-matrix); PRs cite DEC and SCRUM ids. Gap: no docs check finds the FR and NFR ids that plan docs cite, and only 1 of 119 PR titles cites an FR id (#100).                                                                                                              |

### 2.4 Persistence and security

| NFR     | Requirement (short)                                              | Status  | Evidence and gaps                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------- | ---------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-011 | One persistence door, versioned schema, migrations               | Partly  | `PersistenceController` with repositories, DTOs and a `StorageAdapter` contract suite. Gap: only `MemoryStorageAdapter` exists; the IndexedDB adapter of [ADR 0005](../decisions/0005-indexeddb-persistence.md) is not built.                                                                                                                                                                                                                                                |
| NFR-012 | Persistence failure never crashes the game                       | Partly  | `main.tsx` builds `MemoryStorageAdapter` directly, so no storage failure can occur yet. Gap: no fallback logic and no notice that progress will not be saved; quota eviction and `navigator.storage.persist()` wait for the IndexedDB adapter.                                                                                                                                                                                                                               |
| NFR-013 | Every persisted or imported record validated on read             | Partly  | DTO schemas in `data/persistence/`: the validators reject wrong field types with a named reason (`GuestDto.test.ts`), and corrupt records go to quarantine (`readOrQuarantine.test.ts`). Gap: no profile record exists yet, so no test shows a refused profile with the previous one intact, and no fuzz test runs 1,000 malformed DTOs.                                                                                                                                     |
| NFR-014 | Content Security Policy without `unsafe-eval`; no unsafe sinks   | Not yet | No `innerHTML`, `dangerouslySetInnerHTML` or `eval` in app code today, but nothing checks it. Gap: no `no-eval`, `no-new-func` or unsafe-sink lint rule, and `apps/client/index.html` has no Content Security Policy. `@typescript-eslint/no-implied-eval` is on (through `strictTypeChecked`) and flags `new Function` and string timers, but it is not one of the checks that 06 names and it does not cover `eval`, unsafe sinks or the CSP, so the status stays Not yet. |
| NFR-015 | Supply chain: audit, exact versions, lockfile, branch protection | Partly  | `.npmrc` sets `save-exact`, `engine-strict` and `audit-level=high`; committed lockfile; protected `main`; dependency bump #113 cleared the high audit findings. Gap: `npm audit` is not a step of `npm run check`.                                                                                                                                                                                                                                                           |

### 2.5 Reliability and determinism

| NFR     | Requirement (short)                                        | Status | Evidence                                                                                                                                                                                                                                                                                   |
| ------- | ---------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-016 | Invariants, error boundaries, crash popup and error report | Met    | `DefaultInvariantRunner` in dev builds and tests; `ui/components/ErrorBoundary.tsx`; error reports with the replay go to the dev server ([ADR 0025](../decisions/0025-error-reports-through-the-local-dev-server.md)).                                                                     |
| NFR-017 | No tick storm after a background tab; held input cleared   | Met    | `GameLoop` clamps the frame to `maxFrameMs`; `MatchHost` clears held input on `visibilitychange` and `blur`.                                                                                                                                                                               |
| NFR-018 | Deterministic simulation                                   | Met    | Seeded RNG, fixed 30 ticks/s, no wall clock in core, a lint rule for transcendental math ([ADR 0012](../decisions/0012-determinism-lint-for-transcendental-math.md)); `Simulation.replay.test.ts` checks same seed + commands → same hash.                                                 |
| NFR-019 | Reproducible builds and tests                              | Partly | Committed lockfile with `npm ci`, exact versions, pinned Node (`.nvmrc`), the same `npm run check` in CI on Linux and Windows ([ADR 0019](../decisions/0019-ci-matrix-linux-and-windows.md)). Gap: no lint rule or test guard fails a test that calls `Date.now()` or reaches the network. |

### 2.6 Caching and performance

| NFR     | Requirement (short)                                       | Status | Evidence and gaps                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------- | --------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-020 | Every cache explicit, with an owner and invalidation rule | Partly | Content definitions load once (#125, #139) and are frozen (`ContentCatalogue.test.ts` checks `Object.isFrozen`); memoised store selectors. Gap: not audited across the whole client, no invalidation test for each cache, and no `terrain-changed` event exists, so no test shows that a flow field is rebuilt only after it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| NFR-021 | Tick ≤ 8 ms p95 at 144 per team + Legends                 | Partly | Budget met (the CI bench decides, DEC-351 (1)) on the reference machine: CI `ubuntu-latest`, Node 24.21, run 45758097070 (head `78f5e0e4`, 2026-11-26), `npm run bench`, generated 3-lane match with all structures: 144 mobs per team (143/144 at the start of the timed window, 109/95 at the end) + 10 Legends per team (20 in all) → p50 3.34 ms, **p95 5.26 ms**, max 8.91 ms. Stress case 290 per team (290/289 → 206/212) → p95 8.20 ms (no target, INBOX DEC-137 (1)). Extra evidence, AMD Ryzen AI 9 HX 370, Node 22.19: p95 2.59 ms at 144 per team. Gap: the bench times 30 s of match time (`scripts/bench/hordes.mjs`). The Phase 3 soak and the Phase 6 performance pass are not recorded in `docs/plan/progress/`, and no `performance.measure('tick')` entries exist. NFR-021's Acceptance check needs both; the Phase 6 pass is not due yet. |
| NFR-022 | Render ≤ 8 ms p95, 60 fps                                 | Partly | Layered canvases and interpolation between ticks are in place. Gap: render time is not measured.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| NFR-023 | No per-tick allocation in hot systems; bounded memory     | Partly | `ObjectPool` (#51), typed arrays in `PathingSystem`. Gap: no allocation profile and no 30-minute soak.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| NFR-024 | Main menu interactive within 3 s                          | Partly | Loading progress is byte-based (`loadingSlice.ts`, `ResourceController.ts`); `npm run build` prints the Vite bundle-size table in CI. Gap: no timing test from `BootScreen` mount to the interactive main menu (`BootScreen` is not built yet; Phase 5).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| NFR-025 | AI within 1.5 ms of the tick at cap                       | Partly | Bots run at a reduced, staggered cadence (`content/ai/cadence`). Gap: the per-system time split is not reported yet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### 2.7 Testability, portability and accessibility

| NFR     | Requirement (short)                                   | Status | Evidence and gaps                                                                                                                                                                                                                                                                                                                                                                                              |
| ------- | ----------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-026 | Headless simulation; every platform touchpoint a port | Partly | Core runs in Node (the bench and the Duel server both use it); ports with fakes and shared contract suites (`StorageAdapter.contract.ts`, `ReportWriter.contract.ts`). Gap: `Renderer`, `FrameScheduler`, `Logger` and the server `Clock` have no contract test.                                                                                                                                               |
| NFR-027 | Coverage thresholds only go up                        | Met    | Floors enforced by `npm run test:coverage`: core 85 %, client 55 % (lines, branches, functions, statements); about 650 test files.                                                                                                                                                                                                                                                                             |
| NFR-028 | Testing pyramid levels exist                          | Partly | Unit, system, simulation, replay-hash, contract, client, performance and invariant tests exist, and a 10 × 3,000-tick replay soak (`diagnostics/replay.test.ts`). Gap: no soak at the unit cap, and the soak and replay corpora do not run nightly.                                                                                                                                                            |
| NFR-029 | Core free of React, DOM, Canvas and Node              | Partly | Enforced by ESLint restricted imports and the core `tsconfig`; the same core runs in the browser and on the server. Gap: `StorageAdapter` has no browser adapter yet (IndexedDB, NFR-011); 06 asks for exactly one browser adapter per port.                                                                                                                                                                   |
| NFR-030 | Rebindable controls, contrast, pause, reduced motion  | Partly | Rebindable keys with presets, a pause overlay and a reduced-motion setting. `tokenContrast.test.ts` checks the HUD contrast pairs over both colour sets (the default Figma set has listed exceptions, DEC-55; the minimums set meets every pair). Gap: the accessible-name walk covers only the Settings screens (`SettingsScreen.test.tsx`), and no test checks that minimap glyphs differ by shape per team. |

### 2.8 Documentation and constraints

| NFR     | Requirement (short)                                          | Status | Evidence                                                                                                                                                                                                                                                                                                                         |
| ------- | ------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-031 | Every doc has frontmatter; docs check; docs change with code | Partly | `npm run docs:check` validates frontmatter, links and the index in CI ([ADR 0008](../decisions/0008-docs-structure-and-frontmatter.md)). Gap: no check flags a doc older than 90 days.                                                                                                                                           |
| NFR-032 | Agentic harness: one `AGENTS.md`, tool files point to it     | Partly | `AGENTS.md` with `CLAUDE.md` and `GEMINI.md` pointers, package-level `AGENTS.md`, skills and hooks ([ADR 0010](../decisions/0010-pre-pr-critic-and-ponytail-gate.md)). Gap: the `post-edit`, `session-start` and `stop-check` hooks and the `.githooks/pre-commit` and `pre-push` hooks have no must-block and must-allow tests. |
| NFR-033 | TypeScript, custom Canvas 2D engine, React + Redux + Vite    | Partly | `npm run check:no-js` rejects JavaScript files; the engine is in `apps/client/src/game/engine/`; no game framework. Gap: `ws` and `@eternalus/protocol` are runtime dependencies outside the 06 list; 06 marks this NFR as under revision (proposed ADR 0016), and they count only once that ADR and a 06 edit accept them.      |

### 2.9 What to do next

In order of impact:

1. Split `Simulation.ts` into focused modules (NFR-001, NFR-003); the replay-hash tests prove
   the split changes no behaviour.
2. Add the missing mechanical checks in one pass: lint rules for numeric literals (NFR-002),
   `max-lines` and `max-lines-per-function` (NFR-003), `no-eval`, `no-new-func` and unsafe sinks
   (NFR-014) and `Date.now()` and network access in tests (NFR-019); must-block and must-allow hook
   tests (NFR-032); a docs check for FR ids and doc age (NFR-010, NFR-031). Each one is small, and
   together they close most of the gaps of those rows.
3. Add a Content Security Policy to `apps/client/index.html` (NFR-014).
4. Add `npm audit` to `npm run check` (NFR-015) and an import-cycle check (NFR-006).
5. Build the IndexedDB storage adapter (NFR-011 to NFR-013, NFR-029).
6. Measure render time, startup time and AI time per system, and automate the soak (NFR-022 to
   NFR-025, NFR-007, NFR-028).

## Related

- [MVP requirements](../requirements/06-mvp-requirements.md): the full FR and NFR catalogue.
- [Engineering standards](../requirements/05-engineering-standards.md): how the NFRs are measured.
- [Delivery plan](../plan/README.md): sprints and metrics.
- [Game loop and results plan](../plan/game-loop-and-results-plan.md), [minion system plan](../plan/minion-system-plan.md),
  [multiplayer and scalability plan](../plan/multiplayer-and-scalability-plan.md): the plans behind Part 1.
