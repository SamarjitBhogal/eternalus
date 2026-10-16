---
title: Extension recipes
description: One recipe per kind of addition, from a Legend class to a port and adapter, giving the files to create, the one registry line to add, the tests to write and the docs to update, plus the anti-recipes that show a design is wrong; read this before adding anything to core or the client.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-16
tags: [architecture, recipes, extension-points, ocp, registries]
paths:
  [
    'packages/core/src/**/default*.ts',
    'packages/core/src/content/**/*Catalogue.ts',
    'packages/core/src/commands/Command.types.ts',
    'packages/core/src/state/GameEvents.types.ts',
    'apps/client/src/game/views/defaultViewRegistry.ts',
    'apps/client/src/game/views/SceneView.ts',
    'apps/client/src/game/input/keybindings.ts',
    'apps/client/src/bridge/store.ts',
    'apps/client/src/bridge/events.ts',
    'apps/client/src/data/persistence/schema/migrations.ts',
    'apps/client/src/ui/App.tsx',
  ]
related:
  [
    'docs/architecture/02-code-structure.md',
    'docs/architecture/04-entity-architecture.md',
    'docs/architecture/05-abilities-weapons-and-loadouts.md',
    'docs/architecture/16-agentic-harness.md',
    'docs/plan/backlog-post-mvp.md',
  ]
---

# Extension recipes

**Purpose.** Read this when you are about to add something to the game and want the smallest
correct diff: the files to create, the one registry line that makes the new thing reachable, the
tests that prove it and the docs that move with it. Every recipe is the product owner's litmus
test applied to one kind of addition: **new idea? add a class (and a content entry, and a
registry line); nothing else changes** (CP-10 in
[../requirements/02-coding-principles.md](../requirements/02-coding-principles.md)). If a recipe
needs a fourth kind of change to existing code, a seam is missing: fix the seam, not the
feature, then update the recipe. Paths follow the planned tree of
[02-code-structure.md](02-code-structure.md); a file named below that is not in the tree yet is a
**sketch**. `core/` means `packages/core/src/`, `client/` means `apps/client/src/`.

## 1. How to read a recipe

Six lines each. **When**: the situation, and the neighbouring recipe for the look-alike.
**Files**: what you create, content first, a class only when behaviour is unique; field lists
are in the linked doc. **Registry line**: the single place of change from
[02 §9](02-code-structure.md#9-single-place-of-change); "none" means the catalogue line is the
whole change. **Tests**: per [02 §8](02-code-structure.md#8-where-tests-go). **Docs**: what moves
in the same PR, always plus a `docs/plan/PROGRESS.md` entry. **Skill**: the
`.claude/skills/<name>/SKILL.md` procedure and the doc section behind it. Numbers are stable
because other docs cite them (`17 R8`); OG-05 in
[../requirements/03-organization-guidelines.md](../requirements/03-organization-guidelines.md)
calls R1–R7 "new entity kind", R8–R10 "new ability", R11 "new system", R12 "new component",
R14 "new view" and R16 "new command".

| Skill                                                          | Recipes it walks                          | Follows       |
| -------------------------------------------------------------- | ----------------------------------------- | ------------- |
| [`new-entity`](../../.claude/skills/new-entity/SKILL.md)       | R1–R7, R14                                | 04, 06, 07    |
| [`new-content`](../../.claude/skills/new-content/SKILL.md)     | R2, R3, R6, R15, R26 (display names)      | 03 §10, 04 §5 |
| [`new-ability`](../../.claude/skills/new-ability/SKILL.md)     | R8, R9, R10                               | 05            |
| [`new-system`](../../.claude/skills/new-system/SKILL.md)       | R11, R12, R13, R16, R17, R18, R23         | 03, 04, 11    |
| [`new-screen`](../../.claude/skills/new-screen/SKILL.md)       | R19, R20, R21, R24                        | 09, 13        |
| [`pr-review`](../../.claude/skills/pr-review/SKILL.md)         | asks "what else changed?" of every recipe | checklists    |
| [`verify`](../../.claude/skills/verify/SKILL.md)               | the last step of every recipe             | 16 §8         |
| [`doc-gardening`](../../.claude/skills/doc-gardening/SKILL.md) | the **Docs** line when a PR skipped it    | 16 §5         |
| [`adr`](../../.claude/skills/adr/SKILL.md)                     | when a recipe would need a fourth change  | 01 §7         |

## 2. Entities and content (R1–R7)

### R1. Add a Legend class

- **When:** a playable class whose behaviour no existing class has (`flying`, **post-MVP**,
  needs an altitude layer). Numbers, abilities or a skin alone: R2 or plain content.
  `Entity → Unit → Legend → <Name>` is the last allowed level (04 §9).
- **Files:** `core/content/legends/<id>.ts` (`LegendDefinition` with `kind`, stats, ability
  ids, `pickUp`, `defaultLoadout`, `minimapGlyph`) + `legendCatalogue.ts` line; its abilities
  (R8); `core/entities/legends/<Name>.ts` (`extends Legend`, overrides `attachComponents`) +
  `.test.ts`; a strategy if movement or pick-up is new (R13); sprites in `AssetManifest.ts`.
- **Registry line:** `core/entities/defaultEntityRegistry.ts`:
  `registry.register('<kind>', (id, def) => new <Name>(id, def));`
- **Tests:** `legendCatalogue.test.ts`; the factory spawns it with the `Legend` component set;
  one test per unique behaviour; replay fixtures unchanged (Phase 4.1's litmus metric).
- **Docs:** `../reference/game-design/01-classes-and-subclasses.md` status; the changelog.
- **Skill:** `new-entity` · [04 §12](04-entity-architecture.md#12-worked-example-adding-a-fourth-legend-class).
  Untouched: every system, `LoadoutScreen`, `LegendView`, the minimap, keybindings, the store.

### R2. Add a Legend specialization (post-MVP)

- **When:** Assassin/Knight/Paladin, Colossus, Necromancer/Druid/Mage, Hover/Strafe (D11): stat
  modifiers, ability overrides, a pick-up id and a skin the existing class consumes. Behaviour no
  strategy can express becomes a **sibling** kind under `Legend` (R1), never a fourth level.
- **Files:** `core/content/legends/specs/<id>.ts` (`LegendSpecDefinition`; the folder is a
  `Recommendation:`) + a catalogue line. `Loadout.specId` already exists (05 §12);
  `Legend.attachComponents` applies the spec over the class definition.
- **Registry line:** none: the catalogue line is the change.
- **Tests:** `validateContent()` accepts an empty spec (the Phase 4.1 done-when); a spec changes
  exactly the documented stat at spawn; a `LoadoutRule` rejects a spec of another class.
- **Docs:** the backlog row moves into a phase doc; `01-classes-and-subclasses.md` status.
- **Skill:** `new-content`, or `new-entity` for a sibling class · [04 §9](04-entity-architecture.md#9-sub-classes-and-specialisations-d11-post-mvp).

### R3. Add a mob type

- **When:** a lane, guard or camp unit. A flavour of an existing weight class is content only
  (`extends: 'light-mob'`); a new weight class with its own lifecycle is a class.
- **Files:** `core/content/mobs/<id>.ts` (`MobDefinition`: `weightClass`, stats, `aggro` as
  data, `controller`) + `mobCatalogue.ts` line; a new weight class adds a `GameConfig.match.hordeSizes`
  key (validated) and, only if lifecycle differs, `core/entities/mobs/<Name>.ts` + `.test.ts`.
- **Registry line:** none for a flavour; `defaultEntityRegistry.ts` for a class.
- **Tests:** content validation; a `SpawnSystem` scenario spawns a horde of it at the configured
  size; a `MinionController` scenario (attacks within N ticks); determinism.
- **Docs:** `../reference/game-design/02-entities-and-units.md`; `TUNE` values in `balancing.md`.
- **Skill:** `new-content` or `new-entity` · [04 §1](04-entity-architecture.md#1-the-family-tree), [11 §4.3](11-game-ai.md#43-minioncontroller-mvp).

### R4. Add a boss

- **When:** a new boss kind (corner-camp bosses, **post-MVP**) or a new move set for `MiniBoss`
  or `GreaterBoss` (**MVP-if-time**, content only). Moves are abilities (R8) sequenced by the
  FSM in `BossController`.
- **Files:** `core/content/bosses/<id>.ts` (`BossDefinition`: `moves: BossMoveDefinition[]`,
  `zoneRestriction`, `rewards`, `controller: 'boss'`) + `bossCatalogue.ts` line (`Recommendation:`
  a `bosses/` family beside `mobs/`); a class only if lifecycle differs; its timed appearance
  is a `GameConfig.match.timeline` entry.
- **Registry line:** `defaultEntityRegistry.ts` for a class; a new timeline **action** kind is one
  handler class plus one `core/match/defaultTimelineActions.ts` line (12 §3).
- **Tests:** every move names a registered ability; table-driven FSM transitions; a match
  scenario reaching the mark spawns it and applies `rewards` on death; the mirror test (R14).
- **Docs:** `../reference/game-design/04-objectives-capture-points-and-bosses.md`; 12 §7.
- **Skill:** `new-entity` (+ `new-ability` for moves) · [11 §4.6](11-game-ai.md#46-bosscontroller-miniboss-mvp-greaterboss-mvp-corner-camp-bosses-post-mvp), [12 §3](12-game-story-and-match-director.md#3-matchtimeline-as-data).

### R5. Add a structure type

- **When:** a new building, wall piece or emplacement. Numbers, shields, breakability, spawn
  table or aura alone are a definition on an existing class.
- **Files:** `core/content/structures/<id>.ts` (`StructureDefinition`: `footprint`,
  `breakableWhen`, `damageMultipliers`, `spawnTable?`, `aura?`, `minimapGlyph`) +
  `structureCatalogue.ts` line; a class only if lifecycle differs:
  `core/entities/structures/<Name>.ts` + `.test.ts`; the map feature that places it (R14).
- **Registry line:** `defaultEntityRegistry.ts` (feature kind → factory).
- **Tests:** the definition validates; `MapGenerator.test.ts` mirror and counts still pass;
  `MinimapView.test.ts` counts one more glyph per placed feature with no view code.
- **Docs:** the table in 07 §1; `../reference/game-design/03-structures-and-defenses.md`.
- **Skill:** `new-entity` · [07 §13](07-structures-obstacles-and-destructibles.md#13-extension-recipe-a-new-structure-type).
  Untouched: `StructureSystem`, `DamagePipeline`, `SpawnSystem`, `MinimapView`.

### R6. Add an obstacle kind

- **When:** a scattered or placed obstacle (a fence, a statue). `Obstacle` is a concrete class
  and kinds are data; felling, burning and throwing are **MVP-if-time** interactions.
- **Files:** `core/content/obstacles/<id>.ts` (`ObstacleDefinition`: `kind`, `footprint`,
  `health` (`null` = unbreakable), `weight`, `fell?`, `minimapGlyph`) + `obstacleCatalogue.ts`
  line; a scatter entry in the `MapLayout` obstacle rules (`core/content/maps/`; a preset never
  places features, DEC-14) or a placed feature (R14). A new
  `kind` is one union member and no `switch` on it may exist (A1); a new interaction is a
  `PickUpStrategy` (R13) or an effect kind (R8), never an `Obstacle` subclass.
- **Registry line:** none: `obstacle` is already registered.
- **Tests:** the definition validates; `scatterObstacles` is reproducible per seed; unbreakable
  ones pass the swept-collision test; `Carry.canCarry` respects `weight`; the glyph test.
- **Docs:** 07 §9; `../reference/game-design/05-map.md`.
- **Skill:** `new-content` · [07 §9](07-structures-obstacles-and-destructibles.md#9-obstacles).

### R7. Add a zone or capture-point variant

- **When:** an area entity without a collider. A capture-point variant (checkpoint count, a
  summoning point) is `GameConfig.match.capturePoints` plus a definition; a new area behaviour is a
  new concrete `Zone` kind at depth 2, beside `CapturePoint` and the `EffectZone` of 05 §3.
- **Files:** a definition with a `minimapGlyph` (`Recommendation:` `core/content/zones/<id>.ts`
  - a catalogue line); `core/entities/zones/<Name>.ts` (`extends Zone`; `attachComponents` adds
    `Capturable`, `AreaEffect` or a new component, R12) + `.test.ts`; the feature that places it
    (R14). Per-tick logic belongs to `CaptureSystem`, `AbilitySystem` or a new system (R11).
- **Registry line:** `defaultEntityRegistry.ts`.
- **Tests:** a `CaptureSystem` scenario (progress, contest, `capture-progress`,
  `capture-point-owner-changed`); the glyph colour follows `Capturable.ownerTeam`; the mirror test.
- **Docs:** 07 §7; `../reference/game-design/04-objectives-capture-points-and-bosses.md`.
- **Skill:** `new-entity` · [07 §7](07-structures-obstacles-and-destructibles.md#7-capture-points).

## 3. Abilities, status effects and gear (R8–R10)

### R8. Add an ability

- **When:** any ability, ultimate, passive, gadget mode or boss move. All are content; a class
  appears only when no effect kind of 05 §3 can express a step, or when a new restriction
  **rule** (not a new use of one) is needed.
- **Files:** `core/content/abilities/<camelId>.ts` exporting `<SCREAMING_ID>` (`satisfies
AbilityAuthoring`: `classId`, `slot`, `targeting`, `effects[]`, `varieties[]`, `restrictions[]`)
  - `abilityCatalogue.ts` line; the `LegendDefinition` slot that names it. Only if needed:
    `core/abilities/effects/<Kind>Effect.ts` or `restrictions/<Rule>Restriction.ts` + `.test.ts`.
- **Registry line:** none for content; one `core/abilities/defaultAbilityRegistry.ts` line for a
  new class (`registry.registerEffect(new <Kind>Effect());`).
- **Tests:** `abilityCatalogue.test.ts` (`validateContent()`);
  `core/abilities/scenarios/<id>.test.ts` drives a `Simulation`: cast, effects, cooldown and
  aether accounting, `command-rejected` reasons.
- **Docs:** `../reference/game-design/06-abilities-and-progression.md`; values in `balancing.md`.
- **Skill:** `new-ability` · [05 §14](05-abilities-weapons-and-loadouts.md#14-abilityregistry-the-single-place-of-change), [05 §17](05-abilities-weapons-and-loadouts.md#17-recipes-and-mvp-status).
  Untouched: `AbilitySystem`, `applyCommand`, `AbilityBar` (it reads slots and `<KeyGlyph/>`).

### R9. Add a status effect

- **When:** a buff, debuff or form (bleed, burn, stun, ascended). Content only: it is referenced
  by `buff`/`debuff` specs, weapon `onHit` lists, `grants` and `periodic` ticks.
- **Files:** `core/content/status-effects/<camelId>.ts` (`StatusEffectDefinition`: `polarity`,
  `stacking`, `modifiers[]`, `flags[]`, `periodic`, `onExpire`) + `statusEffectCatalogue.ts` line.
  Apply it through `combat/StatusEffectApplier`.
- **Registry line:** none. A new **stacking mode** is one `StatusStacking` member plus one `case`
  in `StatusEffectRuntime.reapply` (the one closed switch, 05 §8); a new **flag** or modifier
  **stat** is one union member read by the system or damage step that owns the stat. A new
  **periodic behaviour** (what a tick does) is one `StatusTickEffect` class, one
  `StatusTickEffectId` member and one line in `combat/defaultStatusTickEffects.ts`.
- **Tests:** content validation (ids resolve); the table-driven stacking test if a mode was
  added; a scenario: apply, modifier table, `status-applied` / `status-expired`.
- **Docs:** the status table in `../reference/suggestions/more-abilities.md` §7; reference 06.
- **Skill:** `new-ability` · [05 §8](05-abilities-weapons-and-loadouts.md#8-status-effects).

### R10. Add a weapon or artifact

- **When:** a weapon for any class (or `uniqueTo` one), or an artifact for the gadget slots
  (slots **MVP**; Mortar and Soul Orb **MVP-if-time**). Both are content; only a new attack
  **pattern** is code (an `AttackStrategy`, R13).
- **Files:** weapon: `core/content/weapons/<camelId>.ts` (`WeaponDefinition`: `attacks[]` with
  `strategy` and `onHit`, `damageMultipliers`, `allowedClasses`, `uniqueTo`) +
  `weaponCatalogue.ts` line. Artifact: `core/content/artifacts/<camelId>.ts` (an
  `AbilityDefinition` with `slot: 'gadget'`, modes as `varieties`) + `artifactCatalogue.ts` line
  and the `LegendDefinition.allowedArtifactIds` entries.
- **Registry line:** none; `defaultStrategyRegistry.ts` only for a new `AttackStrategy`.
- **Tests:** content validation; the attack strategy test with `onHit`; the loadout fixtures
  (`WeaponAllowedRule`, `ArtifactClassRule`); an artifact cast through
  `cast-ability { slot: 'gadget-1' }`.
- **Docs:** `../reference/game-design/07-weapons-and-artifacts.md`; `more-weapons.md`.
- **Skill:** `new-ability` · [05 §10](05-abilities-weapons-and-loadouts.md#10-weapons), [05 §11](05-abilities-weapons-and-loadouts.md#11-artifacts-gadgets-z-and-c).

## 4. Systems, components and strategies (R11–R13)

### R11. Add a system

- **When:** logic that runs every tick over many entities. Not for behaviour that varies by kind
  (R13), a reaction to one event (a listener in the system that owns the state) or a rule on
  one entity's data (R12).
- **Files:** `core/systems/<Name>System.ts` (only the class; implements `System`, receives a
  `SystemContext`, subscribes to `GameEvents` in its constructor and defers state changes to its
  own pass) + `.test.ts`; the events it emits (R17); an invariant for the state it can corrupt
  (R23).
- **Registry line:** `core/systems/defaultSystemPipeline.ts`, at its position in the tick order
  of [03 §1](03-game-model.md#1-one-tick-end-to-end).
- **Tests:** a minimal `GameState` with a fixed seed, step N ticks, assert state and events; the
  same seed and commands twice give equal `hash()`; the pipeline-order test reads the list.
- **Docs:** the order list in 03 §1 and the `systems/` row in 02 §2.
- **Skill:** `new-system` · [03 §4](03-game-model.md#4-gameevents-the-typed-channel). Never:
  import a sibling `*System`, call another system, read `Date`, timers or `Math.random`.

### R12. Add a component

- **When:** per-entity state with its own invariants (`Altitude` for the Flying class, an
  `Interactable` for form-change stations). Logic goes in a system (R11), tunables in content.
- **Files:** `core/components/<Name>.ts` (a class: private state, methods, invariants that
  throw) + `.types.ts` + `.test.ts`; the definition field that seeds it; the
  `attachComponents(ctx)` call in the owning family class (04 §2); `state/Snapshot.types.ts`
  fields only if a view or the HUD needs them (`SnapshotSystem` copies them).
- **Registry line:** none: components are looked up by class in the entity's `ComponentSet`
  (`entity.get(<Name>)`); the `attachComponents` call is the one line.
- **Tests:** a unit test per invariant; the factory test proves the family installs it;
  `structuredClone(snapshot)` still succeeds (D8).
- **Docs:** the component table in 04 §3; the `components/` row in 02 §2.
- **Skill:** `new-system` (step 4) · [04 §3](04-entity-architecture.md#3-components-data-plus-invariants).

### R13. Add a strategy

- **When:** behaviour that varies by kind: a new `TargetingStrategy`, `AttackStrategy`,
  `MovementStrategy` or `PickUpStrategy` implementation, or a new strategy **interface** the
  moment a system starts branching on `kind` (A1).
- **Files:** `core/entities/strategies/<Behaviour><Family>Strategy.ts` (stateless, shared; uses
  the context `Rng` and vectors, never angles) + `.test.ts`; the definition field that selects it
  by id (`definition.movement`, `weapon.attack`, `definition.pickUp`, `definition.targeting`).
- **Registry line:** `core/entities/strategies/defaultStrategyRegistry.ts`: one entry in the
  behaviour's record (`attack: { melee: new MeleeAttackStrategy(), <id>: new <Name>Strategy() }`)
  plus the id in its union (`AttackStrategyId`); a missing entry does not compile.
- **Tests:** a unit test with a stub state; the content test proves every strategy id used in
  content is registered; the calling system's tests do not change.
- **Docs:** the table in 04 §4; naming in 02 §4.
- **Skill:** `new-system` (step 4) or `new-entity` · [04 §4](04-entity-architecture.md#4-strategies-behaviour-that-varies-by-kind).

### R13a. Add a damage rule

- **When:** something changes every hit before it reaches `Health`: a status (`sundered`,
  `enraged`), a structure multiplier, breakability, a resistance. Not for a new way of attacking
  (R13) or for an effect that applies damage (it calls the pipeline).
- **Files:** `core/combat/<Name>Step.ts` (implements `DamageStep`: `adjust(hit, state)` returns
  the new amount, 0 blocks the hit; reads state through `state.entities`, numbers from content)
  - `.test.ts`.
- **Registry line:** `core/combat/defaultDamageSteps.ts`, at its position in the order.
- **Tests:** the step alone with a small `GameState`; one `DamagePipeline` test if the order
  matters.
- **Docs:** 05 §9 (the step and its place in the order).
- **Skill:** `new-system` · [05 §9](05-abilities-weapons-and-loadouts.md#9-combat-pipeline-combat).

## 5. Map and config (R14–R15)

### R14. Add a map feature kind

- **When:** something the generator must place (a new structure, zone or fixed obstacle). This
  is also OG-05's "new view" recipe, because seeing it needs no view code.
- **Files:** `core/content/maps/maps.types.ts`: one `MapFeatureKind` member (`MapFeature` stays
  flat, integration contract §2.2, so new data goes on the definition it names);
  `core/map/MapBuilder.ts`: a step, placed for `light` and mirrored through `symmetry.ts` (a
  preset never places features, DEC-14); the definition it spawns (R5, R6, R7) with a
  `minimapGlyph`.
- **Registry line:** `defaultEntityRegistry.ts`: `EntityFactory.fromFeature` is the only reader
  of feature kinds and asks the registry for `definition.kind`.
- **Tests:** `MapGenerator.test.ts` (mirror, counts follow config, determinism, containment);
  `MinimapView.test.ts`: the glyph count rises by the placed count and the `'beacon'` test draws
  it with **no `EntityView` registered** (the base `EntityView.drawGlyph` reads the glyph). A
  bespoke main-canvas look is optional: `client/game/views/<Name>View.ts` plus a
  `defaultViewRegistry.ts` line.
- **Docs:** the kind table in 06 §4; `../reference/game-design/05-map.md`.
- **Skill:** `new-entity` · [06 §4](06-map-and-minimap.md#4-mapdefinition-types), [06 §8](06-map-and-minimap.md#8-minimap).

### R15. Change `numLanes`, `spawnTowersPerLane` or `buffTowersPerLane`

- **When:** the shape of the world changes (the requirements doc's acceptance test). The same
  recipe covers `campsPerSide`, `cornerCamps`, the unit caps and the timeline.
- **Files:** no code. Change the default in `core/config/createDefaultGameConfig()` or a
  developer-menu override that `Match` merges before `validateGameConfig()` (a preset carries no
  counts, DEC-14). A new **field** is one `GameConfig.types.ts` line, one
  validation rule and one `MapBuilder` reader. (03 §10 and 06 §2 nest the fields under
  `GameConfig.map`, `GameConfig.match` and `GameConfig.limits`.)
- **Registry line:** none.
- **Tests:** `MapGenerator.test.ts` "counts follow config" (`numLanes: 5, spawnTowersPerLane: 2`
  gives 10 spawner towers per team, 5 gates, 5 capture points); `validateGameConfig` rejects an
  even lane count; the `MinimapView.test.ts` glyph count; the default-config replays unchanged.
- **Docs:** the default table in 03 §10 if a default moved; `../reference/game-design/05-map.md`.
- **Skill:** `new-content` · [06 §2](06-map-and-minimap.md#2-map-configuration-gameconfigmap), [03 §10](03-game-model.md#10-gameconfig).

## 6. Commands, events and AI (R16–R18)

### R16. Add a Command

- **When:** a new way to change intent: a player action, a bot decision or a developer cheat.
  Every change of intent is a command so that the log replays (03 §3).
- **Files:** `core/commands/Command.types.ts`: one `CommandPayloads` line for `'<kebab>'` (its
  fields, usually `readonly actorId: EntityId` first; serialisable, ids only);
  `core/commands/handlers/<Name>Handler.ts`: a class implementing `CommandHandler<'<kebab>'>`
  that validates, applies and returns `null`, or returns a `CommandRejectReason` (DEC-20); one
  producer: `PlayerController` from an `InputIntent` field (R21), another controller (R18) or the
  `DeveloperMenu` (R24).
- **Registry line:** the handler in `core/commands/defaultCommandHandlers.ts`: the registry's type
  fails to compile until every command type has one, which is the point.
- **Tests:** `<Name>Handler.test.ts` (the accepted path and every rejection reason); the
  registry compile test in `defaultCommandHandlers.test.ts`; a replay fixture that contains the
  command.
- **Docs:** the union sketch in 03 §3; `../reference/game-design/09-controls.md` if a player
  can issue it.
- **Skill:** `new-system` (core) or `new-screen` (developer menu) · [03 §3](03-game-model.md#3-commands).

### R17. Add a GameEvent

- **When:** a fact that other systems, views, the HUD or an invariant must react to. Payloads
  carry ids and numbers, never entities or definitions (rule F in 01 §4).
- **Files:** `core/state/GameEvents.types.ts`: one `GameEventMap` entry; one emitter (a system, a
  component or the `DamagePipeline`); listeners subscribe in their constructors and defer state
  changes to their own pass. If React needs it: `client/bridge/events.ts` + a slice field (R19).
- **Registry line:** the `GameEventMap` entry.
- **Tests:** the emitter test asserts the payload; each listener test hand-emits the event; the
  `recentEvents` ring buffer shows it in invariant reports.
- **Docs:** the event table in 03 §4 (07 §11 for structure events).
- **Skill:** `new-system` · [03 §4](03-game-model.md#4-gameevents-the-typed-channel).

### R18. Add an AI controller

- **When:** a new way for a non-player entity to decide (a jungler tree, a mounted unit,
  **post-MVP**). A new aggro rule or cadence is content only; a new BT node or utility
  consideration is a class plus a test, with no registry.
- **Files:** `core/ai/<Name>Controller.ts` implementing `Controller` (stateless; memory as plain
  data in `state.ai.brains`) + `<Name>Controller.types.ts` (its `AiMemory`) + `.test.ts`;
  `core/content/ai/profiles/<name>.ts` (`AiProfileDefinition`: every number); the definition
  field `controller: '<id>'`; one `ControllerId` union member.
- **Registry line:** `ControllerRegistry` (`Recommendation:` populated in
  `core/ai/defaultControllerRegistry.ts` per the `default<Registry>.ts` convention of 02 §4; add
  the row to 02 §9).
- **Tests:** a unit test with `ai/testing/buildTestState()`; table-driven FSM transitions; a
  sim-mode scenario in `ai/scenarios/`; the same seed twice gives identical command logs.
- **Docs:** a subsection in 11 §4; the reference doc of the unit it drives.
- **Skill:** `new-system` · [11 §2](11-game-ai.md#2-the-controller-contract), [11 §9](11-game-ai.md#9-extension-recipe-a-new-controller).

## 7. Client: HUD, screens and input (R19–R21)

### R19. Add a HUD element

- **When:** a new in-match overlay (a boss health bar, an objective timer). The HUD reads the
  store, never core objects (05 §15); `ui/` imports only `bridge/`, `ui/`, `styles/` (rule 5).
- **Files:** `client/ui/hud/<Name>.tsx` + `<Name>.module.css` + `<Name>.test.tsx`; a selector in
  `client/bridge/selectors/`; if the data is new: a `Snapshot` field filled by `SnapshotSystem`,
  a `BridgeEventMap` entry in `bridge/events.ts` and a `bridge/slices/` field, published
  throttled by `MatchBridge` (13 §5); control prompts through `<KeyGlyph action="..."/>`.
- **Registry line:** `client/ui/screens/MatchScreen.tsx` mounts it (one place); a new slice is
  one `combineSlices` line in `bridge/store.ts`.
- **Tests:** server-render with a store holding the state under test (`react-dom/server`); the
  selector; the `MatchBridge` publish test when an event was added.
- **Docs:** the HUD table in 13 §3; `../reference/game-design/09-controls.md` if it shows a binding.
- **Skill:** `new-screen` · [13 §3](13-game-interface.md#3-screens-and-hud), [13 §9](13-game-interface.md#9-recipe-a-screen-a-hud-element-an-action), [05 §15](05-abilities-weapons-and-loadouts.md#15-hud-contract).

### R20. Add a screen

- **When:** a full-screen layout in the session flow (a rematch screen, a replay browser). A
  menu sub-screen is a `MenuRoute` literal; a new session phase is a `SessionPhase` value with
  its `SessionState` class (13 §2).
- **Files:** `client/ui/screens/<Name>Screen.tsx` + `.module.css` + `.test.tsx`; the selectors
  it reads; its `ui-intent`s (a `UiIntent` member each, handled by `SessionController` or
  `Match`); for a phase, a `SessionState` class beside `game/SessionController.ts`, named in
  `defaultSessionStates.ts`. Nothing in `ui/` imports `game/` or core values.
- **Registry line:** `client/ui/App.tsx` (phase or route → screen); `defaultSessionStates.ts`
  for a phase.
- **Tests:** a render test per state; the `SessionController` transition test; the
  `MainMenuScreen` navigation test.
- **Docs:** the screen table in 13 §3; `../reference/game-design/11-mvp-scope.md` (boot menu).
- **Skill:** `new-screen` · [13 §2](13-game-interface.md#2-sessioncontroller), [13 §9](13-game-interface.md#9-recipe-a-screen-a-hud-element-an-action), [02 §3](02-code-structure.md#3-appsclientsrc-l4-l3-and-l1).

### R21. Add a keybinding action

- **When:** a new player action (a ping, a camera toggle). Ability slots are already actions:
  `ability-1` … `ability-4`, `gadget-1`, `gadget-2` share their ids with the slots, so a new
  ability needs nothing here.
- **Files:** one id in `INPUT_ACTIONS` and one `DEFAULT_CHORDS` entry in
  `client/game/input/keybindings.ts` (13 §6.1, 09 §3); an `InputIntent` field set by `InputMapper.toIntent`
  and read by `PlayerController` (or a `clientActions` case for a client-only action); the
  prompt through `<KeyGlyph action="<id>"/>`. The settings screen lists actions from the same
  table, so rebinding needs no change.
- **Registry line:** the `keybindings.ts` entry.
- **Tests:** `InputMapper.test.ts` with `FakeInputDevice`: chord → action → intent, held versus
  pressed edges, conflict detection; a rebinding round-trip through the settings DTO.
- **Docs:** the controls table in `../reference/game-design/09-controls.md`.
- **Skill:** `new-screen` or `new-system` · [13 §6](13-game-interface.md#6-keybindings), [09 §3](09-hardware-abstraction.md#3-the-mapping-pipeline-device--inputaction--command).

## 8. Persistence, diagnostics, developer menu and ports (R22–R25)

### R22. Add a persisted record type

- **When:** something that must survive a reload (a replay, an achievement, a stats record);
  one facade, repositories and DTOs over the `StorageAdapter` port (D3).
- **Files:** `client/data/persistence/dto/<Name>Dto.ts` (`schemaVersion`, structured-clone-safe,
  with `validate`, `upgrade` and `to`/`from` mappers); `repositories/<Name>Repository.ts` (the
  `interface`) + `Storage<Name>Repository.ts` (the one implementation over `StorageAdapter`,
  returning DTOs mapped at the boundary) + `.test.ts`; one `Migration` entry in
  `schema/migrations.ts` (store and indexes at `DB_VERSION + 1`); one `PersistenceController`
  property.
- **Registry line:** the `MIGRATIONS` entry (the only file that alters stores) and the property.
- **Tests:** the repository against `MemoryStorageAdapter` (and an IndexedDB fake); open at v(n),
  seed, reopen at v(n+1): every record survives and a downgrade fails with a typed error;
  `structuredClone` of every stored value; an invalid record lands in `quarantine`.
- **Docs:** the record catalogue in 14 §7; the Phase 5 checklist.
- **Skill:** none yet (`Recommendation:` a `new-record` skill when Phase 5 starts; the
  `test-writer` subagent for the suite) · [14 §5](14-persistence-and-resources.md#5-schema-versioning-and-migrations), [14 §13](14-persistence-and-resources.md#13-recipes).

### R23. Add an invariant

- **When:** a fact about state that a bug could silently break ("nothing despawns without a
  cause"). `tick` cadence is light (every tick); `periodic` is heavy (every `heavyEvery` ticks,
  always in soak tests).
- **Files:** `core/diagnostics/invariants/<Fact>Invariant.ts` implementing `Invariant` (a
  kebab-case `id`, `severity`, `cadence`, a pure `check(state)` that reads `recentEvents` and
  never mutates or throws) + `.test.ts` with the holds case and a deliberately broken case; if
  it reads a new event, that event exists in `GameEventMap` (R17).
- **Registry line:** `core/diagnostics/defaultInvariants.ts`.
- **Tests:** the broken fixture reports a `Violation` (`invariant-violated`); the clean fixture
  is silent; the soak test runs it at `heavy`.
- **Docs:** the catalogue in 15 §3 (05 §16 or 07 §11 for the theme). Class names carry the
  `<Fact>Invariant` suffix (02 §4, 15 §3).
- **Skill:** `new-system` (step 5) · [15 §12](15-diagnostics-and-runtime-testing.md#12-recipe-a-new-invariant), [15 §2](15-diagnostics-and-runtime-testing.md#2-invariant-invariantrunner-invariantsystem).

### R24. Add a developer-menu action

- **When:** a cheat or inspection for testing (spawn, remove, re-team, set phase, assert level).
  Cheats never bypass `Simulation`: they are `dev-*` commands, so they respect the caps, appear
  in the replay log and share the tests (03 §3).
- **Files:** the `dev-*` `Command` and its `applyCommand` case (R16); one button in
  `client/ui/hud/DeveloperMenu.tsx` emitting `ui-intent { kind: 'dev-command' }`, which `Match`
  enqueues only while the menu is enabled (`settings.developer.menuEnabled` or `?dev=1`). A
  change to how the client shows or paces the simulation (overlay, time scale, pause) is a
  `DevToggle` member instead, deliberately outside the log (13 §4).
- **Registry line:** the `Command` union member (or the `DevToggle` member).
- **Tests:** the command replays (300 dummies through the command path); the menu's spy test
  expects exactly one `Simulation.enqueueCommand` per gameplay button; `Match` drops it while
  the menu is disabled.
- **Docs:** the control table in 13 §4; 03 §3; `../reference/suggestions/mechanics-ideas.md` §9
  (`dev-set-controller` per DISC-56, `dev-set-phase`).
- **Skill:** `new-system` + `new-screen` · [03 §3](03-game-model.md#3-commands), [13 §4](13-game-interface.md#4-the-developer-menu).

### R25. Add a port and adapter

- **When:** a new platform capability (haptics, a second storage backend, a server, a Worker).
  Core defines only `Rng` and `Logger`; everything else is an L1 port owned by its consumer.
- **Files:** the port `interface` beside its consumer (`client/game/engine/<area>/<Port>.ts`,
  `client/data/persistence/StorageAdapter.ts`, `core/diagnostics/Logger.types.ts`); the adapter
  `<Tech><Port>.ts`, the only file touching the API; a test double (`Fake`, `Null`, `Memory` or
  `Recording` + port) as a real class in `src/`; the contract suite `<Port>.contract.ts` exporting
  `describe<Port>(name, factory)` (02 §8, 09 §9, 14 §4) imported by every adapter test; the
  constructor parameter in the composition root
  (`Match`, `main.tsx`).
- **Registry line:** none: the composition root's constructor argument is the single place; no
  Service Locator, no singleton (rule D).
- **Tests:** the contract suite passes for the adapter and the double (LSP); DOM-backed adapters
  run it under jsdom or happy-dom (`Recommendation:` needs dependency approval).
- **Docs:** the port table in 01 §3; 09 §1 and §9; `apps/client/AGENTS.md` boundaries.
- **Skill:** none dedicated (`pr-review` checks the boundary) · [01 §3](01-layered-oop-model.md#3-ports-and-adapters-on-top-of-the-layers), [09 §9](09-hardware-abstraction.md#9-contract-tests-one-suite-per-port).

## 9. Renames (R26)

### R26. Rename a class or a display name

- **When:** a placeholder is decided (`Warrior (formerly Assault)`, `Flying`, the bow) or a class
  name reads badly. Three different things: a display name, a class identifier, a content id.
- **Files:** display name: the `displayName` line in the content file, nothing else. Class: an
  IDE rename of the symbol and its file, its imports and the `extends` clauses of subclasses.
  Content id (`'warrior'`): **never** once used, because replays, loadouts and match history
  reference it (a persistence migration plus new replay fixtures if the team insists;
  `Recommendation:` do not).
- **Registry line:** the one registry line that names the class (the rename tool updates it).
- **Tests:** none new; `npm run check` (typecheck follows the imports, knip flags a stale export).
- **Docs:** the pick in `../reference/suggestions/naming.md`; the "(rename pending)" note in the
  reference doc.
- **Skill:** `new-content` for a display name; a class rename is a plain refactor reviewed with
  `pr-review` · [04 §10](04-entity-architecture.md#10-renaming-is-cheap-by-rule).

## 10. Post-MVP seams (D12)

Every deferred feature already has a recipe path, so building the MVP keeps its seam open
([../plan/backlog-post-mvp.md](../plan/backlog-post-mvp.md)): the Flying class is R1 + R12
(`Altitude`) + R13 (`AirborneMovementStrategy`); mounts are R13 (a `MovementStrategy`) + R12;
anti-air is R13 (a `TargetingStrategy` filter on altitude) + content; form change
(Ascendance/Enchantment) is R2 (a spec swap) + R12 (`Interactable`) + R16; the ability tree is
R8 (`AbilityUpgradeDefinition` patches applied like a variety) + R16 (`upgrade-ability`);
controller support is R21 on the existing `GamepadDevice` adapter; first-person is R25 (a new
`Renderer` and `Camera` adapter, the domain untouched).

## 11. Anti-recipes: signs the design is wrong

Stop and report (the `new-entity` skill says so at its step 4) when a task makes you do any of
the following. Each row is a missing seam; the fix is the seam, not the feature.

| #   | Sign                                                                                                          | What it means                                       | The seam to use instead                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | A `switch` or `if` chain on `kind`, `family`, `classId`, `variant` or `team` in a system, view or controller  | Behaviour that varies by kind is not a strategy     | A `Strategy` chosen by a definition field (R13) or a registry (R14); the only closed switches are `applyCommand` and `StatusEffectRuntime.apply` |
| A2  | Editing three files to add one variant                                                                        | The variant is code that should be data             | A content entry (R2, R3, R6, R9, R10) with at most one class and one registry line                                                               |
| A3  | A number in gameplay code (`0.7`, `60`, `16`)                                                                 | Tuning or world shape hidden from the content tests | Content with `// TUNE:` (rule 11) or `GameConfig` (R15)                                                                                          |
| A4  | A system importing or calling a sibling system                                                                | Hidden ordering coupling; the pipeline order lies   | A `GameEvent` (R17) plus a deferred pass in the listener; the order in `defaultSystemPipeline.ts`                                                |
| A5  | `ui/` importing core values, `game/` or an entity class                                                       | Two sources of truth; React re-renders at 60 Hz     | A `Snapshot` field, a bridge event and a selector (R19)                                                                                          |
| A6  | A second registry for the same concept (a `Map<kind, ...>` in a system, a list of classes in a view)          | The single place of change was duplicated           | The one registry of 02 §9; delete the copy                                                                                                       |
| A7  | A fourth inheritance level (`Assassin extends Warrior`) or a subclass for a data-only difference              | Taxonomy used for behaviour                         | A sibling kind whose definition `extends` the parent's data (R2), a component (R12), a strategy (R13)                                            |
| A8  | `new Warrior(...)` outside `defaultEntityRegistry.ts`; `new Canvas2dRenderer()` outside `Match` or `main.tsx` | The factory or the composition root was bypassed    | `EntityFactory.spawn` (R1–R7); constructor injection from the root (R25)                                                                         |
| A9  | A cheat, test hook or bot that mutates state without a `Command`                                              | The replay log no longer replays                    | A `dev-*` command (R24) or a controller (R18)                                                                                                    |
| A10 | `Math.random`, `Date`, timers or `Math.atan2` in core; an `onTick` method on an entity                        | Determinism or the system/entity split is broken    | The seeded `Rng`, tick counts, `deterministicMath.ts`; a component (R12) plus a system (R11)                                                     |

The review checklists ask "what else changed?" for every PR
([../agents/checklists.md](../agents/checklists.md) §3); the recipe's expected diff is the answer.

## Related

- [02-code-structure.md](02-code-structure.md): the tree, the naming rules and the registry table these recipes index.
- [04-entity-architecture.md](04-entity-architecture.md), [05-abilities-weapons-and-loadouts.md](05-abilities-weapons-and-loadouts.md), [06-map-and-minimap.md](06-map-and-minimap.md), [07-structures-obstacles-and-destructibles.md](07-structures-obstacles-and-destructibles.md), [11-game-ai.md](11-game-ai.md): the designs each recipe instantiates.
- [16-agentic-harness.md](16-agentic-harness.md): the skills and reviewers that run the recipes.
- [../requirements/02-coding-principles.md](../requirements/02-coding-principles.md) CP-10 and [../requirements/03-organization-guidelines.md](../requirements/03-organization-guidelines.md) OG-05: the rules the recipes satisfy.
- [../plan/backlog-post-mvp.md](../plan/backlog-post-mvp.md): the deferred features and the seams reserved for them.
- [../reference/suggestions/naming.md](../reference/suggestions/naming.md): the pending renames R26 applies.
- [../agents/checklists.md](../agents/checklists.md): the architecture review that checks a recipe was followed.
