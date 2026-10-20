---
title: Phase 2 — Structures and combat
description: Sprint checklists for the Structure family, layered shields, the damage pipeline, projectiles and turrets, walls and gates, obstacles, capture points and the spawn schedule; read this before starting any Phase 2 task.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-06
tags: [plan, phase-2, structures, combat, projectiles, spawning]
paths:
  ['packages/core/src/combat/**', 'packages/core/src/entities/**', 'packages/core/src/systems/**']
related:
  [
    'docs/plan/README.md',
    'docs/architecture/07-structures-obstacles-and-destructibles.md',
    'docs/reference/game-design/03-structures-and-defenses.md',
  ]
---

# Phase 2 — Structures and combat

## Purpose

Read this when you pick up a Phase 2 task or review the Phase 2 PR. Phase 2 makes the world
fight back: the `Structure` family (Stronghold, SpawnerTower, BuffTower, WallSegment, Gate,
Turret, Camp, Cathedral) with the layered shield bars from the game doc, a single damage
pipeline with `DamageSource` tracking so every death has a killer, pooled swept projectiles,
turrets with ammo data, gate and wall state machines, destructible obstacles that update the
navigation grid, capture points with three checkpoints, and a `SpawnSystem` that follows the
match timeline. Units still move like dummies; hordes and AI arrive in Phase 3, Legend classes
in Phase 4. Every number below is `TUNE` from the game doc's "Stronghold Defenses" and
"Buildings" sections unless marked `Recommendation:`.

- **Branch:** `phase/2-structures-and-combat` (stacked on `phase/1-…` until it merges).
- **Weeks:** 4–5 (2026-10-26 → 2026-11-06). Week 4: sprints 2.1, 2.2, 2.6, 2.8; week 5:
  sprints 2.3, 2.4, 2.5, 2.7, 2.9.
- **Requirement areas served:** "FR: lanes & towers", "FR: strongholds & walls", "FR: capture
  points", "FR: hordes & spawning" (schedule), "FR: map & minimap" (structures on both), "FR:
  runtime monitoring & logging" (pass-through and unexplained-death checks), "NFR: no
  hardcoding" (ammo, multipliers and schedule in content).
- **Depends on:** Phase 1 (`Entity`, `CollisionSystem` v1, `WorldMap`, `ViewRegistry`).

## Sprint 2.1 — Structure family, layered shields and breakability

Owner: _ (sim lane A). Week 4. Follows
[07-structures-obstacles-and-destructibles.md](../architecture/07-structures-obstacles-and-destructibles.md).

- [ ] **`Structure` abstract + concrete kinds** (`Stronghold`, `SpawnerTower`, `BuffTower`,
      `WallSegment`, `Gate`, `Turret`, `Camp`, `Cathedral`) with `Health`, `Team`, polygon
      `Collider` footprint, `StructureDefinition` content and `EntityRegistry` lines. Owner: _.
      Test: the factory spawns each kind from the `MapDefinition` slots. Done when: a new
      structure kind is one class, one content entry and one registry line.
- [ ] **Layered shield bars in `Health`** (one bar per living allied `BuffTower`; damage drains
      bars before base health; bar removed when its tower dies). Owner: _. Test: the worked
      example — base 1000, three BuffTowers at 150% → 4500 total, 1000 damage leaves base intact
      and one bar at 500; a tower death removes its bar without touching base health. Done when:
      multipliers (`TUNE`: SpawnerTower 125%, BuffTower 150%, WallSegment 200% per living
      BuffTower) live only in `content/structures/`.
- [ ] **`BreakabilityRule` strategy + `StructureSystem`** (walls and gates unbreakable until at
      least 2 defending BuffTowers are down, `TUNE`; damage multipliers by attacker tag from
      data: heavy minions, Sentinels and Magus damage abilities do the most gate damage).
      Owner: _. Test: a wall takes 0 damage with 2 BuffTowers alive and full damage with 1;
      destroying a SpawnerTower drops the Stronghold's guard count and wall bars (game doc).
      Done when: rules are strategy objects selected by definition, not `if` chains.

**Success metric:** the shield-math test suite reproduces every number of the game doc's worked
example, and adding a fourth structure multiplier requires only a content change.

## Sprint 2.2 — Damage pipeline, status effects and killer tracking

Owner: _ (sim lane B). Week 4.

- [ ] **`DamagePipeline`** in `combat/` (source → modifiers → shields → health; physical and
      magical types; never negative; results emitted as `damage-applied`). Owner: _. Test:
      ordering of modifiers is deterministic; zero and over-kill damage clamp. Done when: no
      system writes `Health.current` except through the pipeline.
- [ ] **`DamageSource` tracking** (attacker id, ability/weapon id, tick) + **`DeathSystem`
      killer resolution** (`RemovalCause` gains `killed-by`, `structure-razed`, `despawned-by- timeline`, `debug`). Owner: _. Test: a death with no attributed source raises the
      "unexplained death" invariant. Done when: the requirements doc's "dies without another
      entity or a defensive tower killing it, log it" is a test.
- [ ] **`StatusEffects` component + `StatusEffectRuntime` + `StatusEffectSystem`** with the
      MVP effect set as content (`bleed`, `concussion`, `stun`, `blind`, `enraged`, `crushed`;
      duration in ticks, stacking rule per effect). Owner: _. Test: expiry on the exact tick;
      stacking rules; effects are pooled. Done when: a new effect is a content entry plus one
      `AbilityEffect`/modifier strategy.
- [ ] **`CombatSystem` v1 + `AttackStrategy` port** (melee reach and basic ranged via
      projectiles; `TargetingStrategy` port with a nearest-enemy default). Owner: _. Test: a
      dummy attacks the nearest enemy within reach every `attackIntervalTicks`. Done when: the
      strategies are chosen from definitions.

**Success metric:** 100% of deaths in a 3,000-tick seeded skirmish (dummies vs dummies) carry a
killer or a timeline cause; 0 negative-damage or out-of-range health values in invariants.

## Sprint 2.3 — Projectiles and turrets

Owner: _ (sim lane B). Week 5. Depends on 2.2.

- [ ] **`Projectile` entity (pooled, swept collision)** with `ProjectileDefinition` content
      (speed, damage, pierce, lifetime ticks). Owner: _. Test: a projectile at 40 cells/tick hits
      a 1-cell-thick wall (no tunnelling); the pool reuses instances. Done when: projectiles use
      only the swept test, never overlap-only.
- [ ] **`Turret` + `TurretController` + ammo data** (`TUNE`: heavy ammo 1 bolt / 10 s, default
      1 bolt / 5 s; auto ammo switch: heavy for Sentinels and heavy minions; predictive fire on
      auto; manual control by an Warrior Legend through `InputAction`s `turret-enter`,
      `turret-exit`, `turret-switch-ammo`, all rebindable). Owner: _. Test: cadence 300 / 150
      ticks at 30 TPS; ammo choice follows the target's definition tag; predictive aim hits a
      unit moving at constant velocity. Done when: changing ammo specifics is a content edit
      ("couple lines maybe" in the game doc).
- [ ] **Turret placement from `MapDefinition`** (wall turret slots generated by `MapGenerator`,
      not hand-placed). Owner: _. Test: `numLanes` change keeps a symmetric turret count. Done
      when: turrets appear on the minimap through the registry with no minimap change.

**Success metric:** 0 pass-through anomalies with 100 projectiles in flight for 18,000 ticks
(10-minute soak) at `heavy` invariant level.

## Sprint 2.4 — Walls, gates and the sprint-through rule

Owner: _ (sim lane A). Week 5. Depends on 2.1.

- [ ] **`WallSegment` state machine** (`shielded → breakable → breached`), driven by
      `BreakabilityRule`; breached segments unstamp their footprint. Owner: _. Test: state
      transitions on tower deaths; a breached segment is walkable in `WorldMap`. Done when: the
      state lives in a component, transitions in `StructureSystem`.
- [ ] **`Gate` state machine** (`closed → opening → open → closing`, slow; allies and hordes
      pass; an enemy inside an open, undestroyed gate takes fire damage, `TUNE` values in
      content). Owner: _. Test: an enemy crossing an open gate receives the fire status; an ally
      does not; a destroyed gate is permanently open. Done when: gate timing is content.
- [ ] **Sentinel sprint-through rule** as a `BreakabilityRule` strategy keyed by a definition
      flag (`canSprintThroughWalls`), tested with a flagged dummy until the Sentinel class exists
      (`TUNE`: only at full `maxSpeed`; costs 50% of the unit's total health; deals 50% of the
      segment's total health, e.g. 10,000 → 5,000; applies to Stronghold walls only). Owner: _.
      Test: below full speed the unit is blocked; at full speed both halves apply. Done when: the
      rule is one strategy class and one content flag.

**Success metric:** the wall/gate state-machine tests cover every transition, and the
sprint-through scenario reproduces the game doc's 10,000 → 5,000 example.

## Sprint 2.5 — Obstacles and destructible terrain

Owner: _ (map owner). Week 5. Depends on Phase 1 `WorldMap`.

- [ ] **`Obstacle` concrete entity with data-driven kinds** (`tree`, `rock`, `bridge-segment`;
      `breakable`/`unbreakable`; `Carry` weight class for Phase 4 pick-up, MVP-if-time). Owner:
      _. Test: kinds spawn from `MapDefinition` obstacle slots; unbreakable ones ignore damage.
      Done when: a new obstacle kind is a content entry.
- [ ] **Felled trees** (`TUNE`: falling damages units in the fall line, breaks the ground,
      stays felled). Owner: _. Test: units on the fall line take damage; the felled tree becomes a
      new collider. Done when: the felled state is data, not a subclass.
- [ ] **Destructible terrain → grid updates** (`WorldMap` unstamps or restamps cells and emits
      `terrain-changed` with the dirty rectangle for Phase 3 flow-field rebuilds). Owner: _.
      Test: destroying a bridge segment blocks its cells; a felled tree changes cost. Done when:
      the event carries only cell ranges, no entity references.

**Success metric:** every terrain change in a seeded 3,000-tick soak is reflected in the grid
within the same tick (asserted by the "no entity inside a solid cell" heavy invariant).

## Sprint 2.6 — Capture points

Owner: _ (map owner). Week 4.

- [ ] **`Zone` abstract + `CapturePoint`** (`Capturable` component: owner, progress, three
      checkpoints; the middle lane's point is the `Cathedral`). Owner: _. Test: capture
      progress rises with uncontested allied presence and stalls when contested. Done when: zone
      radii and rates are content.
- [ ] **`CaptureSystem`** (ownership changes emit `capture-point-owned`; checkpoints 1–3
      emit `checkpoint-reached` for Phase 3 spawns and Phase 4 XP; `cannotCaptureWhileBossAlive`
      flag reserved for Phase 3). Owner: _. Test: three checkpoints in order; loss of the zone
      resets per the content rule. Done when: no XP or spawn logic lives in the system (events
      only).

**Success metric:** a scripted scenario captures all three checkpoints of each point in both
directions with the expected event sequence.

## Sprint 2.7 — Spawner and the spawn schedule

Owner: _ (sim lane). Week 5. Depends on 2.1.

- [ ] **`Spawner` component + `SpawnSystem` v1** (`TUNE` from the requirements MVP list: 60 s
      countdown during which only the Stronghold spawns 3 groups of 16 = 48 units; towers spawn
      every 60 s after the countdown; camps activate after their cooldown; guards respawn every
      2 minutes). Owner: _. Test: tick 0 → 48 units; no tower spawn before tick 1,800; each tower
      spawns at 1,800-tick cadence; a dead tower stops. Done when: the schedule is a
      `MatchTimeline` content table consumed by the system.
- [ ] **Spawn origins from `MapDefinition`** (Stronghold gates, tower slots, camp slots) and the
      developer-menu "spawn from origin" command (≤ 144 units per team, cap from `GameConfig`).
      Owner: _. Test: spawning above the cap is refused with a diagnostic, never a crash. Done
      when: the cap is validated in `validateGameConfig`.

**Success metric:** the schedule test passes for `numLanes` 3 and 5 (spawns scale with lanes)
and the 144-per-team cap is never exceeded in a 10-minute soak.

## Sprint 2.8 — Structure views and minimap glyphs

Owner: _ (client lane). Weeks 4–5.

- [ ] **`EntityView`s for each structure kind** with shield bars drawn as stacked coloured
      segments (one per living BuffTower) and gate/wall states. Owner: _. Test: fake-context
      draw-call snapshot per state. Done when: views read `Snapshot` only.
- [ ] **Minimap glyphs through `ViewRegistry`** (glyph per definition, owner colour, capture progress
      ring). Owner: _. Test: the Phase 1 "new feature appears on the minimap" test extended to a
      structure and an obstacle. Done when: no minimap code names a kind.
- [ ] **HUD `HealthBar` for the selected structure and `Announcer` events** (tower razed, point
      captured) via the bridge. Owner: _. Test: bridge events reach the store throttled. Done
      when: `ui/` still imports only `bridge/`.

**Success metric:** every structure and obstacle kind renders on the map and minimap with 0
kind-specific code outside `ViewRegistry` entries.

## Sprint 2.9 — Structure invariants and soak

Owner: _ (each sprint adds its own; one person wires the soak). Week 5.

- [ ] **Invariants**: no entity inside an unbroken wall or unbreakable obstacle; no
      pass-through of an unbreakable collider (swept); no despawn without a cause; no death
      without an attributed killer or timeline cause; shield bar count equals living allied
      BuffTowers. Owner: _. Test: each invariant has a positive and a negative test. Done when:
      violations log tick, seed, entity id and the last 32 commands and events.
- [ ] **`npm run test:soak`** (`Recommendation:` a Vitest project with an explicit timeout:
      seeded skirmish with projectiles, 18,000 ticks, `heavy` every 30 ticks). Owner: _. Test:
      the soak itself. Done when: it runs on CI nightly or on demand, and locally before a phase
      PR.

**Success metric:** 0 invariant violations in the 10-minute soak on the phase branch tip.

## Success metrics (phase level)

| Metric                                  | Target                                                |
| --------------------------------------- | ----------------------------------------------------- |
| Shield math                             | matches the game doc's worked example exactly         |
| Pass-through anomalies (10-minute soak) | 0                                                     |
| Unexplained deaths / removals (soak)    | 0                                                     |
| Spawn schedule                          | 48 at tick 0, towers at 1,800-tick cadence, cap ≤ 144 |
| Tick time (300 units + 100 projectiles) | p95 ≤ 5 ms in `npm run bench` (`Recommendation:`)     |
| Coverage                                | core ≥ 85%, client ≥ 55%                              |
| Replay determinism                      | still green with structures and projectiles           |

## Exit criteria

1. All sprint metrics pass and are recorded in [PROGRESS.md](PROGRESS.md).
2. The soak is green on the branch tip; the replay fixtures from Phase 1 still pass and at least
   two new fixtures with structures exist.
3. Architecture doc 07 and reference doc 03 match the code, or an ADR records the deviation.
4. Demo: a reviewer razes a SpawnerTower with debug damage, watches wall bars drop on the HUD
   and the minimap, opens a gate, fires a turret manually and captures a checkpoint.
5. Phase PR approved (sholtzman + client lane lead), CI green on three OSes, merged by
   SamarjitBhogal.

## Risks

| Risk                                              | Mitigation                                                                                           |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Shield semantics misread (additive vs compounded) | The worked example is the test; product owner reviews the test before the code.                      |
| Combat tuning debates stall the sprint            | Every number is `TUNE` in content; balance is Phase 6; only the pipeline shape is decided here.      |
| Projectile tunnelling at high speeds              | Swept test mandatory; the anomaly invariant runs in the soak at `heavy`.                             |
| Too many concurrent sprints on shared files       | Only `SystemPipeline` registration and `EntityRegistry` are shared; both append-only, one line each. |
| Turret manual control eats time                   | Cut line 3 in the roadmap: keep auto-fire, leave the `TurretController` seam.                        |

## Related

- [README.md](README.md)
- [phase-1-simulation-kernel-and-world.md](phase-1-simulation-kernel-and-world.md)
- [phase-3-minions-hordes-and-ai.md](phase-3-minions-hordes-and-ai.md)
- [PROGRESS.md](PROGRESS.md)
- [phase-2-architecture.md](phase-2-architecture.md)
- [../architecture/07-structures-obstacles-and-destructibles.md](../architecture/07-structures-obstacles-and-destructibles.md)
- [../architecture/10-physics.md](../architecture/10-physics.md)
- [../architecture/15-diagnostics-and-runtime-testing.md](../architecture/15-diagnostics-and-runtime-testing.md)
- [../reference/game-design/03-structures-and-defenses.md](../reference/game-design/03-structures-and-defenses.md)
- [../reference/game-design/04-objectives-capture-points-and-bosses.md](../reference/game-design/04-objectives-capture-points-and-bosses.md)
