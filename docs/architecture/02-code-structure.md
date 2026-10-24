---
title: Code structure
description: The planned folder tree of packages/core and apps/client with one line per folder, the file conventions, the registries that are the single place of change, and a decision table for where new code goes; read this before creating a file.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-24
tags: [architecture, code-structure, conventions, registries]
paths: ['packages/core/src/**', 'apps/client/src/**', 'eslint.config.js', 'knip.json']
related:
  [
    'docs/architecture/01-layered-oop-model.md',
    'docs/architecture/04-entity-architecture.md',
    'docs/architecture/17-extension-recipes.md',
  ]
---

# Code structure

**Purpose.** Read this when you are about to create a file and need to know which folder it goes
in, what that folder may import, how the file must be named and split, and which registry line
makes the new code reachable. The tree below is the **planned** layout (decided, D6 and ADR 0006);
folders are created when their first class arrives, so the source tree, not this list, shows what
exists today; the map slice's interim pieces are in
[06-map-and-minimap.md](06-map-and-minimap.md) §10.

## 1. Principles

- One folder = one responsibility, with an explicit may-import list (a subset of what its layer
  allows, see [01-layered-oop-model.md](01-layered-oop-model.md) §2). Lower folders never import
  higher ones; the only folder that imports everything is the composition root.
- One class per file, companion files for its types, constants and tests (§5).
- Exactly one public surface per package: `packages/core/src/index.ts` (§6). No other barrels.
- Data has four homes that are never mixed: content, config, constants and settings (§7).
- Anything that lists "all the X" lives in exactly one registry file (§9). Adding an X means adding
  a class (or a content entry) and one registry line.

## 2. `packages/core/src/` (L2 Domain)

```
core/src/
  index.ts             public API (the only import surface)
  Simulation.ts        facade: enqueueCommand(), step(), snapshot(), on(), hash()
  config/              GameConfig + validateGameConfig() + createDefaultGameConfig()
  content/             Type Object definitions by kebab-case ID, one subfolder per family
  utils/               Vec2, geometry, SeededRandom, deterministicMath, fnv1a, IdGenerator, RingBuffer
  teams/               PlayableTeam, Team (shared by every layer; contract §2.2, 2026-10-03)
  state/               GameState, EntityStore, GameEvents, Snapshot types, StateHasher
  commands/            Command union, CommandQueue, applyCommand() and its handler registry
  entities/            Entity root + families, EntityFactory, EntityRegistry, strategies, ProjectilePool
  components/          Transform, Health, Movement, Combat, Abilities, Progression, Team, Collider, StatusEffects (+ StatusEffectRuntime), ...
  systems/             System interface, one class per system, SystemPipeline, defaultSystemPipeline
  map/                 MapGenerator (+ MapBuilder), WorldMap, LaneGeometry, symmetry (types: content/maps)
  physics/             SpatialHash, Circle, ConvexPolygon, sat, sweptTests, Kinematics, CollisionResolver
  ai/                  Controller interface + controllers, Perception queries, aggro rules (data)
  abilities/           Ability, AbilityRuntime, effects/, restrictions/, AbilityRegistry
  combat/              DamagePipeline, DamageSource, DeathResolver
  match/               MatchDirector, MatchPhase states, MatchTimeline, Scoring, VictoryConditions, MatchResult
  loadout/             Loadout model, validateLoadout(), autoBuildLoadout()
  diagnostics/         Invariant, InvariantRunner, invariants/, Logger port, DiagnosticEvent types, replay
```

| Folder          | Responsibility                                                                                            | May import                                                                  | Key classes and files                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `utils/`        | Generic, pure helpers with no game vocabulary                                                             | `utils/`                                                                    | `Vec2`, `vec2.ts` (immutable and in-place forms), `geometry.ts`, `SeededRandom` (implements `Rng`), `deterministicMath.ts`, `fnv1a.ts`, `IdGenerator`, `RingBuffer`                                                    |
| `teams/`        | The team vocabulary every layer shares                                                                    | nothing                                                                     | `teams.types.ts` (`PlayableTeam`, `Team`)                                                                                                                                                                              |
| `config/`       | The world and match parameters, their defaults and validation                                             | `utils/`                                                                    | `GameConfig` (type), `validateGameConfig()`, `createDefaultGameConfig()`, `MatchTimelineEntry`                                                                                                                         |
| `content/`      | Immutable definitions keyed by ID; `ContentCatalogue` resolves `extends` and validates cross-references   | `content/`, `utils/`, `teams/` and `config/` (types)                        | `ContentCatalogue`, `validateContent()`, `legends/`, `mobs/`, `bosses/`, `structures/`, `abilities/`, `weapons/`, `artifacts/`, `status-effects/`, `obstacles/`, `maps/`, `ai/profiles/`, `narrative/`, `progression/` |
| `components/`   | State owned by entities plus the small invariants that guard it                                           | `utils/`, `content/` and `teams/` (types)                                   | `Transform`, `Health`, `Movement`, `Combat`, `Abilities`, `Progression`, `Team`, `Collider`, `StatusEffects` (+ `StatusEffectRuntime`), `Carry`, `Loadout`, `Vision`, `Spawner`, `Capturable`                          |
| `physics/`      | Shapes, broad and narrow phase, sweeps, kinematics; no entity knowledge                                   | `utils/`, `components/` (types)                                             | `SpatialHash`, `Circle`, `ConvexPolygon`, `sat.ts`, `sweptTests.ts`, `Kinematics`, `CollisionResolver`                                                                                                                 |
| `entities/`     | Identity and lifecycle: the family classes, factories, registries and strategy catalogues                 | `components/`, `content/`, `utils/`, `state/` (types), `physics/` (shapes)  | `Entity`, `Unit`, `Legend`, `Mob`, `Boss`, `Structure`, `Zone`, `Obstacle`, `Projectile`, `EntityFactory`, `EntityRegistry`, `StrategyRegistry`, `ProjectilePool`                                                      |
| `state/`        | The aggregate root, the event channel, snapshot DTOs and hashing                                          | `utils/`, `config/` (types), `content/` (types), `components/`, `entities/` | `GameState`, `EntityStore`, `GameEvents`, `GameEventMap`, `Snapshot.types.ts`, `StateHasher`                                                                                                                           |
| `commands/`     | Everything a player, bot or developer menu can ask for, and how it is applied                             | `state/`, `entities/`, `utils/`                                             | `Command.types.ts`, `CommandQueue`, `applyCommand.ts`, `CommandHandler.types.ts`, `handlers/*Handler.ts`, `defaultCommandHandlers.ts`                                                                                  |
| `map/`          | Config + seed → `MapDefinition`; the runtime `WorldMap` with cost grid and flow fields                    | `config/`, `content/`, `teams/`, `utils/`, `physics/`                       | `MapGenerator`, `MapBuilder`, `WorldMap`, `LaneGeometry`, `symmetry.ts` (map types in `content/maps/maps.types.ts`)                                                                                                    |
| `combat/`       | Damage resolution, death causes, applying statuses                                                        | `components/`, `content/`, `state/`, `utils/`                               | `DamagePipeline`, `DamagePipeline.types.ts`, `DamageStep.types.ts`, `<Name>Step.ts`, `defaultDamageSteps.ts`, `DeathResolver`                                                                                          |
| `abilities/`    | Ability behaviour built from effect and restriction strategies                                            | `combat/`, `components/`, `content/`, `state/`, `utils/`                    | `Ability`, `AbilityRuntime`, `effects/*Effect.ts`, `restrictions/*Restriction.ts`, `AbilityRegistry`, `defaultAbilityRegistry.ts`                                                                                      |
| `loadout/`      | The loadout model and its validation against content                                                      | `content/`, `utils/`                                                        | `Loadout.types.ts`, `validateLoadout.ts`, `autoBuildLoadout.ts`                                                                                                                                                        |
| `ai/`           | Controllers that read state and emit `Command`s; perception; aggro data                                   | `state/` (read), `commands/`, `content/` (types), `utils/`                  | `Controller`, `PlayerController`, `BotLegendController`, `MinionController`, `GuardController`, `TurretController`, `BossController`, `RoverController`, `Perception`                                                  |
| `match/`        | Phases, timeline, scoring, victory                                                                        | `state/`, `config/`, `utils/`                                               | `MatchDirector`, `MatchPhase.types.ts`, `MatchTimeline`, `Scoring`, `VictoryConditions`, `MatchResult.types.ts`                                                                                                        |
| `diagnostics/`  | Invariants, the runner, the `Logger` port, diagnostic event types, the replay and property-test harnesses | `state/`, `utils/`; types of `commands/` and `config/` (DEC-20)             | `Invariant`, `InvariantRunner`, `invariants/*Invariant.ts`, `Logger.types.ts`, `DiagnosticEvent.types.ts`, `replay.ts`, `Replay.types.ts`, `randomCommands.ts`                                                         |
| `systems/`      | Per-tick logic; one class per system; the ordered pipeline                                                | Everything below it except another system                                   | `System`, `SystemContext.types.ts`, `SystemPipeline`, `defaultSystemPipeline.ts`, `*System.ts`                                                                                                                         |
| `Simulation.ts` | Composes the above; the only thing the client drives                                                      | Everything                                                                  | `Simulation`                                                                                                                                                                                                           |

## 3. `apps/client/src/` (L4, L3 and L1)

```
client/src/
  main.tsx                    composes <Provider store={store}><App/></Provider>, builds the controllers
  game/Match.ts               composition root for one match (sim + loop + renderer + input + views + bridge)
  game/SessionController.ts   boot → menu → loading → match → results
  game/engine/                L1: loop/, render/, camera/, input/, audio/, time/
  game/views/                 SceneView (draw order), EntityView + ViewRegistry, TerrainView, MinimapView
  game/input/                 keybindings.ts (INPUT_ACTIONS + DEFAULT_CHORDS), InputMapper
  game/settings/              SettingsController: settings intents → settings event + persistence
  bridge/                     store.ts, eventBus.ts, events.ts, Binding.types.ts, chordKey.ts, slices/*, selectors/*
  data/persistence/           PersistenceController, repositories/*, StorageAdapter, adapters, schema/, dto/*
  data/resources/             ResourceController, AssetManifest, loaders/, AssetCache
  ui/screens/                 BootScreen, MainMenuScreen, LoadoutScreen, ProfileScreen, SettingsScreen, ...
  ui/hud/                     HealthBar, AetherBar, AbilityBar, MinimapPanel, MatchClock, Scoreboard, ...
  ui/components/              reusable presentational components, e.g. <KeyGlyph action="..."/>
  styles/                     global.css: tokens + reset only
  assets/                     manifest + licensed or team-made assets
```

| Folder                                       | Responsibility                                              | May import                                                                                    | Key classes and files                                                                                                                                                 |
| -------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game/engine/loop/`                          | Fixed-step accumulator loop and the frame port              | Browser APIs, `engine/`                                                                       | `GameLoop`, `FrameScheduler` (port), `RafFrameScheduler`, `FakeFrameScheduler`                                                                                        |
| `game/engine/render/`                        | The only code that touches the 2D context                   | Browser APIs, `engine/`                                                                       | `Renderer` (port), `Canvas2dRenderer`, `RecordingRenderer`, `SpriteAtlas`, `LayerStack`                                                                               |
| `game/engine/camera/`, `time/`, `audio/`     | World ↔ screen transform; clocks; audio port                | Browser APIs, `engine/`                                                                       | `Camera`, `Clock`, `PerformanceClock`, `FakeClock`, `AudioOutput` (port), `WebAudioOutput`, `NullAudioOutput`                                                         |
| `game/engine/input/`                         | Raw device state, no game vocabulary                        | Browser APIs, `engine/`                                                                       | `InputDevice` (port), `KeyboardDevice`, `MouseDevice`, `GamepadDevice`, `FakeInputDevice`, `DeviceState.types.ts`                                                     |
| `game/views/`                                | Draw snapshots; the draw order lives in `SceneView` only    | core `import type`, `engine/` port types, `views/`                                            | `SceneView`, `EntityView`, `ViewRegistry`, `defaultViewRegistry.ts`, `LegendView`, `MobView`, `StructureView`, `TerrainView`, `MinimapView`                           |
| `game/input/`                                | Bindings as data and device → `InputAction` → `InputIntent` | `engine/input/` types, core `import type`, `bridge/Binding.types.ts` and `bridge/chordKey.ts` | `keybindings.ts`, `InputMapper`, `BindingResolver` (types and `chordKey` in `bridge/`, because `ui/` and `bridge/` need them too)                                     |
| `game/settings/`                             | Settings and bindings in every session phase (13 §6.3)      | core, `input/`, `bridge/`                                                                     | `SettingsController`, `settingsState.ts` (persistence reached through a structural port)                                                                              |
| `game/Match.ts`, `game/SessionController.ts` | Composition root and session flow                           | core, `engine/`, `views/`, `input/`, `bridge/`, `data/`                                       | `Match`, `SessionController`                                                                                                                                          |
| `bridge/`                                    | The one store and the one event bus; display-ready slices   | core `import type`, `bridge/`                                                                 | `store.ts`, `eventBus.ts`, `events.ts`, `Binding.types.ts`, `chordKey.ts`, `slices/matchSlice.ts`, `slices/sessionSlice.ts`, `slices/settingsSlice.ts`, `selectors/*` |
| `data/persistence/`                          | One facade over IndexedDB; repositories; DTOs; migrations   | core `import type`, `data/`                                                                   | `PersistenceController`, `StorageAdapter` (port), `IndexedDbStorageAdapter`, `MemoryStorageAdapter`, `repositories/*Repository.ts`, `schema/migrations.ts`, `dto/*`   |
| `data/resources/`                            | One facade over asset loading and caching                   | Browser APIs, `data/`                                                                         | `ResourceController`, `AssetManifest`, `loaders/ImageLoader.ts`, `loaders/AudioLoader.ts`, `loaders/JsonLoader.ts`, `AssetCache`                                      |
| `ui/screens/`, `ui/hud/`, `ui/components/`   | React; reads selectors, dispatches UI intents to the bus    | `bridge/`, `ui/`, `styles/`                                                                   | `App.tsx`, `*Screen.tsx`, HUD pieces, `KeyGlyph.tsx`                                                                                                                  |
| `styles/`                                    | Design tokens and reset                                     | none                                                                                          | `global.css`                                                                                                                                                          |

## 4. Naming

| Thing                          | Convention                                                                                                       | Example                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Class file                     | PascalCase, only that class                                                                                      | `MovementSystem.ts`                                       |
| Non-class file                 | camelCase                                                                                                        | `applyCommand.ts`, `deterministicMath.ts`                 |
| Content definition file        | camelCase form of the ID, exporting a SCREAMING_SNAKE constant                                                   | `content/abilities/bladeRunner.ts` exports `BLADE_RUNNER` |
| Content family catalogue       | `<family>Catalogue.ts`                                                                                           | `content/abilities/abilityCatalogue.ts`                   |
| Content ID                     | kebab-case string, never renamed once used                                                                       | `'blade-runner'`, `'spawner-tower'`                       |
| Registry population file       | `default<Registry>.ts` exporting `createDefault<Registry>()`                                                     | `entities/defaultEntityRegistry.ts`                       |
| System                         | `<Name>System`                                                                                                   | `CaptureSystem`                                           |
| Component                      | Plain noun                                                                                                       | `Health`, `StatusEffects`                                 |
| Strategy                       | `<Behaviour><Family>Strategy`                                                                                    | `FlowFieldMovementStrategy`, `MeleeAttackStrategy`        |
| Ability effect / restriction   | `<Kind>Effect`, `<Rule>Restriction`                                                                              | `KnockbackEffect`, `NotWhileCarryingRestriction`          |
| Invariant                      | `<Fact>Invariant`                                                                                                | `NoRemovalWithoutCauseInvariant`                          |
| Port / adapter / test double   | Port is the capability noun; adapter is `<Tech><Port>`; doubles are `Fake`, `Null`, `Memory`, `Recording` + port | `Renderer`, `Canvas2dRenderer`, `RecordingRenderer`       |
| Command and event types        | kebab-case string literals                                                                                       | `'cast-ability'`, `'entity-removed'`                      |
| React screen / HUD / component | `<Name>Screen.tsx`, `<Name>.tsx` + `.module.css`                                                                 | `LoadoutScreen.tsx`, `AbilityBar.tsx`                     |
| Redux slice / selector         | `<name>Slice.ts`, `select<Fact>`                                                                                 | `matchSlice.ts`, `selectMatchClock`                       |

Everything else (`camelCase` functions, `SCREAMING_SNAKE_CASE` constants, `is/has/can` booleans,
string-literal unions instead of `enum`) follows `CONTRIBUTING.md` §2.

## 5. Companion files

Each class has one file containing only that class. What the class needs besides itself sits next
to it, named after it (`CONTRIBUTING.md` §3.1):

```
components/
  Health.ts              # export class Health { ... }
  Health.types.ts        # export type ShieldBar = { readonly sourceId: string; current: number; max: number }
  Health.constants.ts    # export const MAX_SHIELD_BARS = 8;   (implementation detail, not tuning)
  Health.test.ts
```

Create a companion only when needed. Types shared by several classes belong to none of them:
put them in a shared file (`state/Snapshot.types.ts`, `commands/Command.types.ts`). Other files
import a class's types from `<Class>.types.ts`, not from the class file.

## 6. The public API rule

`packages/core/src/index.ts` is the only thing the client may import (`@eternalus/core`; deep paths
do not resolve because of the package `exports` map). Adding an export is an API change and is
called out in the PR. Planned surface: `Simulation` and `SimulationOptions`; the `Command`,
`Snapshot`, `EntitySnapshot` and `GameEventMap` types; `GameConfig`, `validateGameConfig`,
`createDefaultGameConfig`; `ContentCatalogue` and `loadDefaultContent()` (read-only definitions for
the loadout screen); `Loadout`, `validateLoadout`, `autoBuildLoadout`; `PlayerController` and
`InputIntent`; the `Logger` and `LogRecord` types; `DiagnosticEvent`; `Replay` and `runReplay`;
`MapGenerator`, the `MapDefinition` types, `PlayableTeam` and `Team`
([integration contract](../agents/prompts/2026-10-03-ultracode-sessions.md) §2.2); the ID types.
Systems, entities, components and strategies stay internal.

## 7. Content, config, constants, settings

| Bucket        | What                                                        | Where                                                  | Example                                                   |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| **Content**   | Game data by ID: definitions, tuning numbers, display names | `packages/core/src/content/<family>/`                  | `LIGHT_MOB.health`, `VEIL.cooldownSeconds`, `displayName` |
| **Config**    | World and match parameters that shape a match               | `packages/core/src/config/GameConfig`                  | `numLanes`, `spawnTowersPerLane`, `tickRate`              |
| **Constants** | Implementation details that are not gameplay                | `<Class>.constants.ts` next to the class               | ring-buffer capacity, spatial-hash table size             |
| **Settings**  | Per-user preferences, persisted by the client               | `data/persistence` DTOs, `bridge/slices/settingsSlice` | keybindings, volume, developer menu enabled               |

If a number changes how the game feels, it is content (mark provisional ones `// TUNE:`). If it
changes the shape of the world, it is config. If a player may change it, it is a setting.

## 8. Where tests go

- Every source file has a sibling `<name>.test.ts(x)` in the same folder (Vitest, shuffled order
  with a fixed seed, no real timers). Coverage excludes `content/**` and `index.ts`.
- Contract tests for ports: one shared suite per port (`StorageAdapter.contract.ts`) executed
  against every adapter, so `MemoryStorageAdapter` and `IndexedDbStorageAdapter` prove the same
  behaviour (LSP).
- Replay fixtures (seed + command log + checkpoint hashes) live in `__fixtures__/` next to the
  test that replays them; a bug reproduced from a replay adds that replay as a fixture.
- Soak tests (thousands of ticks, heavy invariants on) carry an explicit `testTimeout` and run
  from a dedicated script (Recommendation: `npm run test:soak`, nightly in CI).
- Test doubles are real classes in `src/` next to the port (`FakeFrameScheduler`), not ad-hoc
  mocks, so knip sees them used and every test reads the same way.

## 9. Single place of change

| Registry                    | File                                                                           | One line adds                                             |
| --------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `EntityRegistry`            | `core/src/entities/defaultEntityRegistry.ts`                                   | A concrete entity class for an `EntityKind`               |
| `StrategyRegistry`          | `core/src/entities/strategies/defaultStrategyRegistry.ts`                      | A movement, targeting, attack or pick-up strategy         |
| Damage steps                | `core/src/combat/defaultDamageSteps.ts`                                        | A rule every hit runs through, at its position            |
| `AbilityRegistry`           | `core/src/abilities/defaultAbilityRegistry.ts`                                 | An `AbilityEffect` or `AbilityRestriction` class          |
| `ControllerRegistry`        | `core/src/ai/defaultControllerRegistry.ts`                                     | A `Controller` for a `ControllerId`                       |
| Content catalogues          | `core/src/content/<family>/<family>Catalogue.ts`                               | A definition (legend, mob, ability, weapon, ...)          |
| `SystemPipeline` order      | `core/src/systems/defaultSystemPipeline.ts`                                    | A system, at its position in the tick                     |
| `GameEventMap`              | `core/src/state/GameEvents.types.ts`                                           | An event name and payload type                            |
| `Command` union             | `core/src/commands/Command.types.ts`                                           | A command (the handler registry then demands its handler) |
| Command handlers            | `core/src/commands/defaultCommandHandlers.ts`                                  | A handler for a command type                              |
| Diagnostic events           | `core/src/diagnostics/DiagnosticEvent.types.ts`                                | A diagnostic event name and its attributes                |
| Built-in invariants         | `core/src/diagnostics/defaultInvariants.ts`                                    | An invariant                                              |
| `MatchTimeline`             | `core/src/config/GameConfig` `timeline`                                        | A scheduled match event                                   |
| `ViewRegistry`              | `client/src/game/views/defaultViewRegistry.ts`                                 | A view for an entity family or kind                       |
| Draw order                  | `client/src/game/views/SceneView.ts`                                           | A layer in the frame                                      |
| Keybindings                 | `client/src/game/input/keybindings.ts`                                         | An `InputAction` with its default chords                  |
| Redux slices                | `client/src/bridge/store.ts` (`combineSlices`)                                 | A slice                                                   |
| Bridge events               | `client/src/bridge/events.ts`                                                  | A game → UI or UI → game message                          |
| Repositories and migrations | `client/src/data/persistence/PersistenceController.ts`, `schema/migrations.ts` | A persisted record type / a schema step                   |
| Asset manifest              | `client/src/data/resources/AssetManifest.ts`                                   | An asset                                                  |
| Screens                     | `client/src/ui/App.tsx` (phase → screen)                                       | A screen                                                  |

## 10. I am adding X → it goes in Y

| I am adding...                                  | It goes in...                                                                   | Plus                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A tuning number or display name                 | `core/content/<family>/<id>.ts`                                                 | nothing else                                                                             |
| A world parameter (`numLanes`)                  | `core/config/GameConfig`                                                        | a `validateGameConfig()` check, a map test                                               |
| A new legend, mob, structure, boss class        | `core/entities/<family>/<Name>.ts` + a definition in `content/`                 | `defaultEntityRegistry.ts` line                                                          |
| A variant of an existing kind (new mob flavour) | `core/content/mobs/<id>.ts` only                                                | catalogue line                                                                           |
| Per-entity state                                | `core/components/<Name>.ts`                                                     | attach it in the family's `attachComponents()`                                           |
| Per-tick behaviour                              | `core/systems/<Name>System.ts`                                                  | `defaultSystemPipeline.ts` line                                                          |
| Behaviour that varies by kind                   | `core/entities/strategies/<Name><Family>Strategy.ts`                            | `defaultStrategyRegistry.ts` line, strategy id in content                                |
| A rule that changes every hit (05 §9)           | `core/combat/<Name>Step.ts` (a `DamageStep`)                                    | `defaultDamageSteps.ts` line, at its position in the order                               |
| An ability, effect, restriction                 | `core/content/abilities/<id>.ts`; `core/abilities/effects                       | restrictions/<Name>.ts`                                                                  | `defaultAbilityRegistry.ts` line for a new class |
| A weapon, artifact, status effect               | `core/content/weapons                                                           | artifacts                                                                                | status-effects/<id>.ts`                          | catalogue line |
| A command                                       | `core/commands/Command.types.ts` + `commands/handlers/<Name>Handler.ts`         | `defaultCommandHandlers.ts` line; a producer (`InputMapper`, controller, developer menu) |
| An event                                        | `core/state/GameEvents.types.ts`                                                | emitter and listeners                                                                    |
| A runtime check                                 | `core/diagnostics/invariants/<Fact>Invariant.ts`                                | `defaultInvariants.ts` line                                                              |
| A bot behaviour                                 | `core/ai/<Name>Controller.ts` or a behaviour-tree node                          | aggro numbers in `content/`                                                              |
| Something drawn on the canvas                   | `client/game/views/<Name>View.ts`                                               | `defaultViewRegistry.ts` line; draw order in `SceneView`                                 |
| A key or mouse action                           | `client/game/input/keybindings.ts`                                              | `InputMapper` mapping to an `InputIntent` field                                          |
| A screen or HUD element                         | `client/ui/screens/<Name>Screen.tsx` or `ui/hud/<Name>.tsx`                     | selector; slice if new data; bridge event if new game data                               |
| Data React needs from the game                  | `client/bridge/events.ts` + `slices/<name>Slice.ts`                             | publish (throttled) from `Match`'s `MatchBridge`                                         |
| A persisted record                              | `client/data/persistence/dto/<Name>Dto.ts` + `repositories/<Name>Repository.ts` | `schema/migrations.ts` step, `PersistenceController` accessor                            |
| An image, sound or JSON asset                   | `client/assets/` + `AssetManifest.ts` line                                      | licence noted in the PR                                                                  |
| A CSS token                                     | `client/styles/global.css`                                                      | nothing else                                                                             |
| A rule change to tooling                        | an ADR in `docs/decisions/`                                                     | the config change in the same PR                                                         |

## 11. How knip and ESLint relate to the tree

- **knip** (`knip.json`) treats `packages/core/src/index.ts` and `apps/client/src/main.tsx` as
  entries and flags every file, export and type that nothing reaches. Consequences: no speculative
  exports, no barrel files, and a new class is only "done" when its registry line makes it
  reachable. `includeEntryExports: false` means exports of `index.ts` are not flagged, so the
  public API can lead the client by one PR. Adding a package means adding it to `knip.json` and the
  root `tsconfig.json` references (ADR 0001).
- **ESLint** today bans React, Redux and `@eternalus/client` imports in core and `Math.random`
  everywhere in core (`eslint.config.js`). Every boundary in §2 and §3 is expressible as a
  `no-restricted-imports` block per folder; Recommendation: add them in Phase 1 as folders appear.
  Sketch:

```js
{
  files: ['apps/client/src/ui/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      { patterns: ['**/game/**', '**/data/**', '@eternalus/core'] },
    ],
  },
},
{
  files: ['apps/client/src/game/engine/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      { patterns: ['@eternalus/core', '**/views/**', '**/input/**', '**/bridge/**', '**/ui/**'] },
    ],
  },
},
```

- Determinism lint for core: `no-restricted-properties` bans `Math.random` everywhere in core and
  `Math.sin`, `Math.cos`, `Math.atan2`, `Math.exp` and `Math.pow` outside
  `packages/core/src/utils/deterministicMath.ts` (ADR 0012); `no-restricted-globals` for `Date`
  and `performance` is the next step of the same block.
- The tree, the tables in this doc and the lint blocks must agree; a PR that adds a folder updates
  all three ([01-layered-oop-model.md](01-layered-oop-model.md) §7).

## 12. Implementation status

HUD and character select (`feat/hud-and-character-select`, 2026-10-24). Folders and files the
branch added or moved; the §3 tree lines and the §9 and §10 rows that name them wait for the
owner in `INBOX.md` HC-T1:

- **Assets.** `apps/client/src/assets/` holds one folder per asset group (`boot/`, `selection/`,
  `selection-primary/`, `selection-alternate/`, `selection-raster/`,
  `selection-primary-raster/`, `match/`) plus `licences/` (the Cinzel OFL and the Phosphor Icons
  MIT texts, DEC-51). The typed manifest is not in `assets/`: it is
  `data/resources/AssetManifest.ts`, which concatenates one file per group
  (`data/resources/<group>Assets.ts`), so adding an asset is one line in its group's file with
  its `licence` and `source`, plus the file. The loaders are `data/resources/loaders/`
  (`AssetLoader.ts` port, `UiImageLoader.ts`, `FontLoader.ts`); there is no `AssetCache` yet
  ([14](14-persistence-and-resources.md) §14).
- **Bridge.** `bridge/catalogue.types.ts` and `bridge/hud.types.ts` (display types shared with
  `ui/`), `bridge/selectionRules.ts`, `bridge/minimapRing.ts`, `bridge/legendNames.ts`, the
  `bridge/selectors/` folder and the new `assetsSlice` ([13](13-game-interface.md) §10).
- **Game.** `game/content/` builds the display catalogue the UI reads from core's display content
  (`coreCatalogue.ts`, `buildDisplayCatalogue.ts` and the presentation files) in place of
  `placeholderCatalogue.ts`; `game/session/` gains `selectionAssetGroups.ts` and loses
  `runPlaceholderLoad.ts`; new are `game/MatchBridge.ts`, `game/MatchHost.ts`,
  `game/createBrowserMatch.ts` and `game/prepareMatchWorld.ts`; `game/useMatch.ts` is gone
  (DEC-50).
- **Core.** `loadDisplayContent()` is exported from `@eternalus/core`: the Legend and
  Legend-spec display data, validated through the content rules, and the map features' display
  names (DEC-49; ADR 0018, proposed); the specs live in `packages/core/src/content/legends/specs/`.

## Related

- [01-layered-oop-model.md](01-layered-oop-model.md): layers, ports and the rules the tree implements.
- [03-game-model.md](03-game-model.md): what lives in `state/`, `commands/`, `config/`.
- [04-entity-architecture.md](04-entity-architecture.md): `entities/`, `components/`, the registries.
- [05-abilities-weapons-and-loadouts.md](05-abilities-weapons-and-loadouts.md): `abilities/`, `loadout/`, the content families.
- [16-agentic-harness.md](16-agentic-harness.md): the skills that automate these placements.
- [17-extension-recipes.md](17-extension-recipes.md): one recipe per row of the decision table.
- [../process/guardrails.md](../process/guardrails.md): knip, ESLint and the coverage ratchet.
- `CONTRIBUTING.md` §2–§3 and `packages/core/AGENTS.md`, `apps/client/AGENTS.md`: the short versions.
