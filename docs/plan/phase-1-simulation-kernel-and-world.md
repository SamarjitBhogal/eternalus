---
title: Phase 1 — Simulation kernel and world
description: Sprint checklists for the deterministic simulation kernel, the first entities, the config-generated map, the Canvas engine and the first playable placeholder; read this before starting any Phase 1 task.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-28
tags: [plan, phase-1, simulation, map, engine, input]
paths: ['packages/core/src/**', 'apps/client/src/game/**', 'apps/client/src/bridge/**']
related:
  [
    'docs/plan/README.md',
    'docs/architecture/03-game-model.md',
    'docs/architecture/06-map-and-minimap.md',
    'docs/architecture/08-game-engine.md',
  ]
---

# Phase 1 — Simulation kernel and world

## Purpose

Read this when you pick up a Phase 1 task or review the Phase 1 PR. Phase 1 builds the
foundation every later phase stands on: a deterministic `Simulation` stepped at 30 ticks/s
(D9), the `Entity` root with the first components and systems (D4), a `MapGenerator` that turns
`GameConfig` into a `MapDefinition` (D7), the L1 engine (`GameLoop`, `Canvas2dRenderer`,
`Camera`), the views including `MinimapView`, and input mapped to `Command`s so a placeholder
Legend can walk around the generated map. No combat, no AI, no structures beyond colliders.

- **Branch:** `phase/1-simulation-kernel-and-world` (from `main` after Phase 0 merges).
- **Weeks:** 1–3 (2026-10-05 → 2026-10-23). Sprints 1.1 and 1.3 start in week 1; 1.2 and 1.4
  in week 2; 1.5 in week 3. Sim lane: 1.1, 1.2; map owner: 1.3; client lane: 1.4, 1.5.
- **Requirement areas served:** "FR: config-driven map", "FR: map & minimap", "FR: controls &
  rebinding" (data model only), "FR: developer menu" (v0), "FR: runtime monitoring & logging"
  (first invariants), "NFR: determinism", "NFR: performance", "NFR: no hardcoding".
- **Depends on:** Phase 0 merged; INBOX answers for `TUNE` defaults are not needed yet (every
  number in this phase is a placeholder in `content/`).
- **API-first rule:** day 1 of sprint 1.1 publishes the `packages/core/src/index.ts` surface as
  TypeScript interfaces (no bodies) so sprints 1.3 and 1.4 can code against it.

## Sprint 1.1 — Simulation kernel

Owner: _ (sim lane). Week 1. Everything here is pure TypeScript in `packages/core/src/`
([03-game-model.md](../architecture/03-game-model.md)).

- [x] **`GameConfig` + `validateGameConfig()`** in `config/` (`numLanes`, `spawnTowersPerLane`,
      `buffTowersPerLane`, `campsPerSide`, `tickRate`, unit caps 10 Legends / 144 units per team,
      match timeline). Owner: _. Test: the default passes; `numLanes: 0` and a cap above 144 fail
      with a message naming the field. Done when: `Simulation` only accepts a validated config.
- [x] **`SeededRandom`** (sfc32, per
      [research §1](../research/game-architecture-and-performance-research.md#determinism-pitfalls-specific-to-javascript))
      and **deterministic math wrappers** in `utils/`. Owner: _. Test: known-answer sequence for
      seed 1; two instances with one seed agree for 10,000 draws; wrapped `sin/cos/atan2` agree
      run to run. Done when: lint bans `Math.sin/cos/atan2/pow/exp` in core outside `utils/`.
- [x] **`Vec2` and geometry helpers** (immutable API plus mutating variants for hot loops).
      Owner: _. Test: 1,000 seeded vectors through add/sub/scale/length/normalize/dot. Done when:
      no angle (`atan2`) is needed by any caller; steering works on vectors only.
- [x] **`GameState`** aggregate root + `Snapshot` types (previous and current position per
      entity, structured-clone-safe, D8). Owner: _. Test: `structuredClone(snapshot)` succeeds and
      equals the original. Done when: no class instance or function leaks into a snapshot.
- [x] **`Command` union + `CommandQueue` + `applyCommand()`** in `commands/` (discriminated
      union, commands stamped with tick and sequence). Owner: _. Test: exhaustive `switch`
      compile test; queue drains in (tick, sequence) order. Done when: a new command kind is one
      union member plus one `applyCommand` case and nothing else.
- [x] **`GameEvents`** typed channel with a ring buffer of the last 512 events. Owner: _. Test:
      handlers run in subscription order; `off()` stops delivery; ring buffer overwrites oldest.
      Done when: systems never hold references to each other (only to `GameEvents`).
- [x] **`Simulation` facade** (`enqueueCommand`, `step`, `snapshot`, `on`) + **`SystemPipeline`**
      (ordered registration). Owner: _. Test: `step()` advances the tick exactly once, drains the
      queue, runs systems in registration order. Done when: the step order in
      [03-game-model.md](../architecture/03-game-model.md) reads as a list in code.
- [x] **`StateHasher`** (FNV-1a over a canonical serialization, sorted keys). Owner: _. Test:
      equal states hash equal; one changed field changes the hash. Done when: `Simulation.hash()`
      is exposed for tests and the developer menu.
- [x] **Replay record and replay test harness** (`ReplayRecorder`: seed + command log + content
      version; `replay(fixture)` helper; seeded random command generator). Owner: _. Test: 10
      seeds × 3,000 ticks, hash every 100 ticks, two runs identical. Done when: the fixture format
      is documented in [15-diagnostics-and-runtime-testing.md](../architecture/15-diagnostics-and-runtime-testing.md).
- [x] **`Logger` port + `DiagnosticEvent` types** in `diagnostics/` (OpenTelemetry severity
      numbers, per [research C2](../research/persistence-input-diagnostics-research.md#c2-structured-logging-timing-memory-and-a-developer-overlay)).
      Owner: _. Test: a fake sink receives records with tick and attributes. Done when: core has
      no `console` and no sink.

**Success metric:** the replay test passes for 10 seeds × 3,000 ticks with identical hashes at
every checkpoint, twice in a row, in under 20 s on CI.

## Sprint 1.2 — Entities, components and first systems

Owner: _ (sim lane). Week 2. Depends on 1.1 (`GameState`, `GameEvents`, `SystemPipeline`).
Follows [04-entity-architecture.md](../architecture/04-entity-architecture.md).

- [x] **`Entity` root** (abstract: `id`, `kind`, `definitionId`, components; Template Method
      lifecycle hooks `onSpawn`/`onRemove`). Owner: _. Test: hooks fire in order for a subclass.
      Done when: depth below `Entity` is checked by a test that walks the class chain (max 3).
- [x] **Component catalogue v1**: `Transform`, `Health`, `Movement` (`speed`, `maxSpeed`,
      `acceleration`, `mass` — from the game doc's "Entity Class Specifics"), `Team`
      (`light | dark | neutral`, D10), `Collider` (circle). Owner: _. Test: `Health` clamps to
      `[0, max]`; `Movement` never exceeds `maxSpeed`. Done when: each component's invariants are
      asserted inside the component (data + invariants), not in systems.
- [ ] _(feat/entity-collider-and-concrete-kinds: done except the dangling-id test. Unit definitions name no other ids yet, so it is a `dev-spawn` rejection (`unknown-definition`) until the first rule that checks references lands with abilities)_ **Type Object definitions v1 + content** (`UnitDefinition`, `MobDefinition`; a
      `training-dummy` LightMob and a `placeholder-warrior` Legend definition; `satisfies Record<Id, Definition>`; `validateContent()`). Owner: _. Test: a dangling `definitionId`
      fails validation; definitions are frozen. Done when: no tuning number exists outside
      `content/` (all marked `// TUNE:`).
- [x] _(feat/entity-collider-and-concrete-kinds, pending merge)_ **`EntityFactory` + `EntityRegistry`** (kind → factory). Owner: _. Test: registering a
      fake kind in the test and spawning it works with one registry line; unknown kind throws.
      Done when: the product owner's litmus test holds ("new class + content entry + registry
      line, nothing else changes").
- [x] **`Unit` family roots**: `Unit` (abstract), `Mob` (abstract) + `LightMob`, `Legend`
      (abstract) + `Warrior` (placeholder, no abilities). Owner: _. Test: factory spawns each
      with the right components. Done when: `Warrior` is renamable by changing the class name,
      its imports and its content display name only.
- [x] **`MovementSystem`** (acceleration → velocity → position; velocity clamp). Owner: _.
      Test: a dummy reaches `maxSpeed` after `maxSpeed / acceleration` ticks; a `stop` command
      decelerates. Done when: no `atan2` and no allocation per unit per tick.
- [x] **`DeathSystem` with `RemovalCause`** (the only removal path; emits `entity-removed`
      with cause, D4). Owner: _. Test: removal without a cause does not compile; the event
      carries `cause` and `tick`. Done when: `GameState` has no public `remove()`.
- [ ] **First invariants + `InvariantSystem` + `DebugConfig`** (`assertLevel: off | light | heavy`, `heavyEvery`): unique ids; components reference live entities; health in bounds;
      removal has a cause; tick advanced once. Owner: _. Test: an injected corrupt state yields a
      violation record with tick, seed, entity id and the last commands. Done when: violations
      throw in tests and log through `Logger` in the browser.
- [ ] **`IdGenerator`, `RingBuffer`, `ObjectPool` base** in `utils/`. Owner: _. Test: pool
      resets fields on acquire and nulls references on release. Done when: `GameEvents` payloads
      for high-frequency events come from the pool.

**Success metric:** an added test that registers a new fake unit kind touches exactly three
places (class, content entry, registry line); coverage in `packages/core` ≥ 82% (raised from 80%,
`Recommendation:`).

## Sprint 1.3 — Map

Owner: _ (the `feat/map` author) with sholtzman. Weeks 1–2. Depends on `GameConfig`, `Vec2`,
`SeededRandom` from 1.1 (day-1 API). Follows [06-map-and-minimap.md](../architecture/06-map-and-minimap.md).

- [x] _(feat/map-generator, pending merge)_ **Reconcile `feat/map` with D7**: keep the `MapDefinition` types that survive (lanes as
      straight polylines per the game doc's MVP rule, structure slots, camp slots, capture zones,
      rift, bridges, bounds); turn hand-traced Map 1 coordinates into golden expectations with a
      tolerance, or drop them. Owner: _. Test: the generated three-lane map matches every kept
      coordinate within tolerance. Done when: `feat/map` is closed or merged into the phase
      branch with no hand-traced data as the source of truth (traced shapes only as a preset,
      ADR 0009).
- [x] _(feat/map-generator, pending merge)_ **`MapGenerator` (pure: `GameConfig` + seed → `MapDefinition`) with `MapBuilder`
      (Builder) and `LaneGeometry`** + mirror-symmetry helpers (light ↔ dark). Owner: _. Test:
      `numLanes` 3 → 5 yields 5 lanes and `5 × spawnTowersPerLane` SpawnerTower slots per team;
      every light slot has a dark mirror within epsilon; `campsPerSide` camps sit in the
      `numLanes - 1` gaps between lanes. Done when: no coordinate is hand-written in code.
- [ ] _(feat/map-generator: done except the cost grid and the grid resolution, which is content until B's `GameConfig` lands)_ **`WorldMap` runtime grid** (`Uint8Array` walkability/cost grid derived from the
      definition; footprint stamping/unstamping; bounds). Owner: _. Test: stamping a footprint
      blocks exactly its cells; unstamping restores them. Done when: the grid resolution is a
      config value, not a literal.
- [ ] **`SpatialHash`** in `physics/` (uniform grid, cell size = largest unit diameter,
      `Int32Array` storage rebuilt each tick, per
      [research §4](../research/game-architecture-and-performance-research.md#4-spatial-partitioning-and-collision)).
      Owner: _. Test: neighbour queries equal brute force for 1,000 seeded units; zero
      allocations per query (checked with a counter). Done when: the hash lives outside entities.
- [ ] **`CollisionSystem` v1**: circle–circle push-out in ID order; circle vs convex polygon
      (SAT) against a static index of unbreakable colliders (bounds, rift edges, structure
      footprints); **swept segment test** from previous to current position; emits
      `collision-anomaly`. Owner: _. Test: a unit at 10× `maxSpeed` cannot cross a wall segment;
      1,000 ticks of seeded random movement raise 0 anomalies. Done when: the anomaly listener
      logs entity id, tick, from/to and collider id.
- [x] **Map preset `map-1` in `content/maps/presets/`** (a lane profile, a rift width profile and
      out-of-bounds shapes; never counts, which stay in `GameConfig.map`, DEC-14).
      Owner: _. Test: preset validates. Done when: a second preset needs only content, no code.

**Success metric:** changing `numLanes` from 3 to 5 and `spawnTowersPerLane` from 1 to 2 in a
test regenerates lanes, slots, grid and symmetry with 0 code changes; anomalies in the random
movement soak = 0.

## Sprint 1.4 — Engine and rendering

Owner: _ (client lane). Week 2. Depends on the 1.1 API and `MapDefinition` types from 1.3.
Follows [08-game-engine.md](../architecture/08-game-engine.md),
[09-hardware-abstraction.md](../architecture/09-hardware-abstraction.md) and
[13-game-interface.md](../architecture/13-game-interface.md).

- [x] **`GameLoop` + `FrameScheduler` port + `RafFrameScheduler` + `Clock`** with the
      accumulator clamped at `5 × TICK_MS` (existing design). Owner: _. Test: a fake scheduler
      advancing 100 ms yields 3 ticks; a 1 s gap is clamped to 5 ticks; `alpha ∈ [0, 1)`. Done
      when: the loop never touches `requestAnimationFrame` directly.
- [ ] **`Renderer` port + `Canvas2dRenderer`** with three layers (terrain `alpha: false`,
      entities, overlay), DPR-aware sizing, integer draw coordinates. Owner: _. Test: a fake 2D
      context records draw calls; the ESLint rule fails a `getContext` call outside
      `Canvas2dRenderer`. Done when: it is the only file that names `CanvasRenderingContext2D`.
- [x] **`Camera`** (world ↔ screen, culling rectangle, follow target, zoom clamp). Owner: _.
      Test: world → screen → world round-trips; the culling rect excludes off-screen points.
      Done when: views never compute screen coordinates themselves.
- [x] **`SceneView` + `ViewRegistry` + `EntityView`** (draw order in one place; kind → view).
      Owner: _. Test: an unknown kind draws a debug glyph and logs once; adding a kind is one
      registry line. Done when: no `switch` on entity kind exists in `views/`.
- [ ] **`TerrainView`** (pre-rendered chunks from `MapDefinition`, dirty flags). Owner: _.
      Test: a chunk redraws only when flagged. Done when: the terrain layer is not cleared per
      frame.
- [x] **`MinimapView`** (same snapshot and definition, world → minimap scale, unit dots at a
      lower cadence). Owner: _. Test ("new feature appears on the minimap"): registering a new
      structure kind in `ViewRegistry` makes it appear on both the map and the minimap with zero
      minimap code changes; a `numLanes: 5` definition draws five lanes. Done when: the minimap
      has no per-kind code.
- [ ] _(feat/session-shell-home, pending merge: `TypedEventBus<BridgeEventMap>`, `matchSlice.clock` and the typed hook done; the every-6th-tick publish and its 30 → 5 test belong to `MatchBridge`, session H)_ _(feat/hud-and-character-select: the 30 → 5 test exists, `MatchBridge.test.ts` "publishes the clock and HUD every 6 ticks and the rosters every 30" (exactly five clock and five HUD publications in 30 ticks, each one dispatch through `connectBusToStore`); the `mm:ss` selector is tested in `selectMatchClockText.test.ts`; still open: no ESLint rule enforces "`ui/` imports only `bridge/`", because 02 §11's `ui/` block is not added yet (a scan finds no such import in a non-test file today; the test `SettingsScreen.rebind.test.tsx` imports `game/`, `data/` and core))_ **Bridge event bus + first Redux slice (match clock)**: `TypedEventBus<BridgeEventMap>`,
      `matchSlice` (its `clock` field), publish every 6th tick, typed hooks. Owner: _. Test: 30 ticks → 5
      dispatches; the selector formats `mm:ss`. Done when: `ui/` imports only `bridge/`.
- [x] _(feat/hud-and-character-select, pending merge: the test is `Match.lifecycle.test.ts` "stops the loop and its subscriptions on destroy: 0 scheduled frames, 0 listeners" and `MatchHost.test.ts` "leaves 0 listeners and destroys the match before its adapters, once"; done when: `main.tsx` mounts `<App/>` behind the `Provider` and `App` shows `MatchScreen` in `match`, `App.test.tsx` T-APP-3; `SessionController` owns the lifetime, DEC-50)_ **`Match` composition root + `MatchScreen` shell** (sim + loop + renderer + views +
      bridge; `destroy()` tears everything down). Owner: _. Test: create/destroy leaves 0 live
      listeners and 0 scheduled frames. Done when: `main.tsx` mounts `MatchScreen` behind the
      Redux `Provider`.
- [x] **Logger sinks**: `ConsoleSink` (the only `console` user, with a named `eslint-disable`
      reason) and `RingBufferSink`. Owner: _. Test: records route by severity. Done when: the
      overlay can read the ring buffer.

**Success metric:** with 300 dummies moving, the entity layer renders at a median ≤ 16.7 ms per
frame and no frame above 50 ms during a 60 s run on the reference laptop (`PerfOverlay`).

## Sprint 1.5 — Input and player

Owner: _ (client lane + one sim-lane reviewer). Week 3. Depends on 1.2 and 1.4.

- [x] **Keybindings data** in one file (`InputAction` ids, `Binding` keyed by
      `KeyboardEvent.code`, presets `wasd` and `arrows`). Owner: _. Test: every action has a
      default; no duplicate codes within a preset. Done when: no key name appears anywhere else.
- [x] **`KeyboardDevice` / `MouseDevice`** (engine adapters; clear held input on `blur` and
      hidden `visibilitychange`; `contextmenu` suppressed). Owner: _. Test: fake events set and
      clear device state. Done when: devices expose state only, never `Command`s.
- [ ] **`InputMapper` → `PlayerController`** (device state → `InputAction` → `Command`; the only
      producer of player commands). Owner: _. Test: W held → `move` with direction (0, −1);
      release → `stop`; rebinding W → ArrowUp in the data changes the mapping with no code
      change. Done when: bots and the player share the `Controller` interface.
- [ ] **Placeholder Legend on the generated map** (spawns at the light Stronghold slot, camera
      follows, collides with the rift and bounds). Owner: _. Test: headless scenario: 60 `move`
      ticks displace the Legend; a wall stops it; 0 anomalies. Done when: a human can walk the
      map with WASD in the browser.
- [ ] **`PerfOverlay` v1** (tick and frame histograms from `performance.mark/measure`,
      long-animation-frame observer, toggled by a debug action). Owner: _. Test: histogram
      bucket math. Done when: the overlay reads only from the bridge store.
- [ ] **`DeveloperMenu` v0** (gated by `?dev=1`): spawn N dummies at the cursor or a slot via a
      debug `Command` so it stays in the replay log. Owner: _. Test: spawning 300 dummies through
      the command path is replayable. Done when: cheats never bypass `Simulation`.
- [ ] **Headless bench `npm run bench`** (`Recommendation:` Node script in core: 300 dummies ×
      3,000 ticks, prints p50/p95 tick time). Owner: _. Test: the script runs in CI without
      asserting a time (times are asserted locally). Done when: the number is in PROGRESS.
- [x] **Coverage ratchet**: core 80 → 82, client 45/50 → 55/55 (`Recommendation:`). Owner: _.
      Test: `npm run test:coverage`. Done when: thresholds are committed in the same PR.

**Success metric:** p95 tick time ≤ 4 ms with 300 dummies in `npm run bench` on the reference
laptop; a teammate who did not write the code walks the map in the browser with WASD.

## Success metrics (phase level)

| Metric                                          | Target                                                   |
| ----------------------------------------------- | -------------------------------------------------------- |
| Replay determinism                              | 10 seeds × 3,000 ticks, identical hashes every 100 ticks |
| Tick time (`npm run bench`, 300 dummies)        | p95 ≤ 4 ms on the reference dev laptop                   |
| Frame rate (300 dummies on screen)              | median ≤ 16.7 ms, no frame > 50 ms over 60 s             |
| Config-driven map + minimap                     | `numLanes` 3 → 5 passes in tests with 0 code changes     |
| Collision anomalies in the random-movement soak | 0                                                        |
| Coverage                                        | core ≥ 82%, client ≥ 55% lines/functions/statements      |
| Lint, knip, docs check                          | green                                                    |

## Exit criteria

1. All five sprint metrics pass and are recorded in [PROGRESS.md](PROGRESS.md) with the machine
   they were measured on.
2. The demo script below runs end to end for a reviewer who did not build it.
3. `feat/map` is reconciled (merged or closed) and no hand-traced coordinate is the source of
   truth (traced shapes only as a preset, ADR 0009).
4. Architecture docs 03, 04, 06, 08, 09, 10, 13 and 15 are updated where the code deviated, or
   an ADR explains the deviation.
5. The phase PR into `main` is approved by sholtzman (architecture) and one lane reviewer
   (tests), CI green on three OSes, merged by SamarjitBhogal.

## Demo script

1. `npm run dev`, open `http://localhost:5173/?dev=1`: the generated three-lane map and minimap.
2. Walk the placeholder Legend with WASD; run into the rift edge; the overlay shows 0 anomalies.
3. Developer menu → spawn 300 dummies; `PerfOverlay` shows tick p95 ≤ 4 ms and 60 fps.
4. Edit `numLanes` to 5 in the default `GameConfig`, reload: five lanes on the map and the minimap.
5. `npm run test`: the replay determinism test and the "new feature appears on minimap" test.

## Risks

| Risk                                                  | Mitigation                                                                                                                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `feat/map` reconciliation drags on                    | Generator API and tests first, coordinates second; the product owner decides what to keep by end of week 1.                                                       |
| Client lane blocked on the kernel API                 | Day-1 API sketch in `index.ts`; views code against `Snapshot` types only.                                                                                         |
| Determinism traps (`Map` iteration, sort comparators) | Rules from [research §1](../research/game-architecture-and-performance-research.md#1-fixed-timestep-interpolation-and-determinism); ID-ordered arrays; lint bans. |
| Over-building physics before combat exists            | `CollisionSystem` v1 stops at push-out + swept test; SAT for polygons only against static colliders.                                                              |
| Canvas and React code hard to test in Node            | Fake 2D context, fake `FrameScheduler`, `react-dom/server` rendering; keep engine classes thin.                                                                   |

## Related

- [README.md](README.md)
- [phase-0-documentation-and-harness.md](phase-0-documentation-and-harness.md)
- [phase-2-structures-and-combat.md](phase-2-structures-and-combat.md)
- [PROGRESS.md](PROGRESS.md)
- [../architecture/03-game-model.md](../architecture/03-game-model.md)
- [../architecture/04-entity-architecture.md](../architecture/04-entity-architecture.md)
- [../architecture/06-map-and-minimap.md](../architecture/06-map-and-minimap.md)
- [../architecture/08-game-engine.md](../architecture/08-game-engine.md)
- [../architecture/10-physics.md](../architecture/10-physics.md)
- [../architecture/15-diagnostics-and-runtime-testing.md](../architecture/15-diagnostics-and-runtime-testing.md)
- [../research/game-architecture-and-performance-research.md](../research/game-architecture-and-performance-research.md)
