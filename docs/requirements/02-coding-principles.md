---
title: Coding principles
description: The code-level requirements CP-01 to CP-16 (SOLID, DRY, KISS/YAGNI versus building in excess, the patterns catalogue, no hardcoding, the OCP litmus test, immutability, error handling, naming, TSDoc, size limits, determinism-safe habits) with Eternalus examples and anti-examples; read before writing or reviewing code.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-28
tags: [requirements, coding, solid, patterns]
paths: ['packages/core/src/**', 'apps/client/src/**']
related:
  [
    'docs/requirements/01-architecture-principles.md',
    'docs/architecture/17-extension-recipes.md',
    'docs/architecture/02-code-structure.md',
  ]
---

# Coding principles

Purpose: Read this when you write or review code and want the reasoning behind the conventions,
or when you need a concrete example of what "SOLID and DRY are a bible" means in this codebase.
Each principle has an ID (`CP-nn`). The mechanical conventions (naming table, companion files,
TypeScript settings, size numbers) live in [`CONTRIBUTING.md`](../../CONTRIBUTING.md) and are
linked, not repeated. Code below is **illustrative TypeScript sketches** of the target design
(`docs/plan/` tracks what is built), and names follow the canonical vocabulary in
[`../architecture/02-code-structure.md`](../architecture/02-code-structure.md).

## SOLID

### CP-01 Single responsibility

- **Requirement.** A class has one reason to change and its file contains only that class
  ([`CONTRIBUTING.md` §3.1](../../CONTRIBUTING.md)). Systems coordinate one concern per tick;
  entities own data; strategies encapsulate one interchangeable behaviour.
- **Example.** `MovementSystem` integrates velocity from `Movement` components. Collision
  push-out is `CollisionSystem`; damage is `CombatSystem`; removal is `DeathSystem`.
- **Anti-example.** A `Unit.update()` that moves, picks a target, attacks, checks death and draws
  itself. That class changes for every feature and cannot be tested in pieces.

### CP-02 Open/closed

- **Requirement.** Behaviour is extended by adding a class, a definition and a registry line, not
  by editing existing systems (AP-09). No `switch` on a kind or ID outside a registry or factory.
- **Example.** A new ability is an `AbilityEffect` strategy, an entry in `content/abilities/` and
  one line in `AbilityRegistry`; `AbilitySystem` is untouched (see CP-10).
- **Anti-example.** `if (ability.id === 'veil') { ... } else if (ability.id === 'slam') { ... }`
  inside `AbilitySystem`.

### CP-03 Liskov substitution

- **Requirement.** A subclass honours the contract of its parent: same preconditions or weaker,
  same postconditions or stronger, no thrown "not supported". Anything that does not fit the
  parent's contract is a component or a definition flag, not a subclass.
- **Example.** Every `Structure` subclass applies damage through the same `Health` rules (layered
  shields before base, never negative). `Gate` adds open/close state without changing how damage
  works.
- **Anti-example.** A `Camp extends Structure` whose `takeDamage()` throws because camps are
  invulnerable. Invulnerability is a `Health` definition field (`isInvulnerable`), so callers never
  need to know the subclass.

### CP-04 Interface segregation

- **Requirement.** Ports and interfaces are small and role-specific; a client depends only on the
  methods it uses. Prefer several narrow `interface`s to one wide one.
- **Example.** `System` is `update(state, events)`; a `Controller` only returns `Command`s;
  `Renderer` draws and `Camera` transforms, as two ports. `MinimapView` needs only the drawing
  subset it calls.
- **Anti-example.** One `GameEngine` interface with forty methods (draw, play sound, read input,
  save) that every view and test double must implement.

### CP-05 Dependency inversion

- **Requirement.** High-level code depends on abstractions it declares; adapters implement them
  and are injected at the composition root (AP-02, AP-10).
- **Example.** `GameLoop` takes a `FrameScheduler`; `Simulation` takes `Rng` and `Logger`;
  `PersistenceController` receives a `StorageAdapter`. Tests pass fakes.
- **Anti-example.** `MovementSystem` reading `performance.now()`, or `PersistenceController`
  calling `new IndexedDbStorageAdapter()` in its constructor.

## DRY, KISS and building in excess

### CP-06 DRY means one home per piece of knowledge

- **Requirement.** Every rule, number and name has exactly one home; other code looks it up.
  Duplicated _knowledge_ (the shield percentage, the tick rate, the draw order, the key bindings)
  is a defect. Duplicated _shape_ is not: two functions that happen to look alike but encode
  different rules stay separate (extracting them couples unrelated concepts). Apply the rule of
  three before abstracting look-alike code, and abstract only when the two sites would always
  change together.
- **Example.** Shield-bar arithmetic lives in one place used by every structure, and the per-tower
  percentages are content (FR-025). Draw order is defined once in `SceneView`; bindings once in
  `keybindings.ts` ([`CONTRIBUTING.md` §5](../../CONTRIBUTING.md)).
- **Anti-example (coincidental similarity).** Merging the Legend XP curve and the minion two-kill
  level-up into one `levelUp()` because both add a level; they are different rules with different
  owners.

### CP-07 KISS and YAGNI, tempered by "build in excess with perfect engineering"

- **Requirement.** Build the **seams** now, not the features: interfaces, registries, definition
  fields, discriminated unions with room for new members (`RemovalCause`, `Command`,
  `InputChord`). Do not build speculative implementations (no `MountSystem` before mounts exist,
  no altitude physics before the Flying class). The test: a seam is justified if at least one
  feature in [`../plan/backlog-post-mvp.md`](../plan/backlog-post-mvp.md) plugs into it and it
  costs an interface, not an implementation. Otherwise the simplest thing that satisfies the
  requirement wins.
- **Why.** The mandate asks for "excess" in engineering quality so that new features are "just
  add another block"; it does not ask for unused blocks. Speculative code is untested code and
  rots.

### CP-08 Patterns catalogue and when to use each

Use the names below exactly (full designs in the architecture docs). A pattern is chosen because
it removes a specific coupling, and the PR says which one.

| Pattern                   | Used for                                                                                     | Use it when                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Factory + Registry        | `EntityFactory` + `EntityRegistry` (kind → factory)                                          | Creation depends on a kind that grows over time                      |
| Type Object               | Content definitions (`LegendDefinition`, `MobDefinition`, ...)                               | Many "breeds" share one class and differ in data                     |
| Flyweight                 | Shared immutable definitions referenced by entities                                          | Per-kind data must not be copied per instance                        |
| Command                   | Input and bots produce `Command`s; dev-menu actions too                                      | Anything that mutates state; needs replay/undo/logging               |
| Observer                  | `GameEvents` in core, `TypedEventBus` in `bridge/`                                           | A producer must not know its consumers                               |
| State                     | `MatchDirector` over `MatchPhase`; controller FSMs                                           | Behaviour depends on a small set of named modes with transitions     |
| Strategy                  | `TargetingStrategy`, `AttackStrategy`, `MovementStrategy`, `PickUpStrategy`, `AbilityEffect` | Per-kind behaviour selected from data                                |
| Facade                    | `Simulation`, `PersistenceController`, `ResourceController`                                  | A subsystem needs one narrow entry point                             |
| Object Pool               | Projectiles, particles, high-frequency event payloads                                        | Hot-path allocation would cause GC pauses (AP-13)                    |
| Template Method           | `Entity` lifecycle hooks (`onSpawn`, `onRemove`)                                             | A fixed skeleton with subclass-specific steps                        |
| Composite                 | `Horde` (aggregate of Mob ids with lane, formation, leader)                                  | A group must be addressed as one unit                                |
| Adapter                   | Every `engine/` device, storage adapters                                                     | A platform API must fit a port (AP-02)                               |
| Builder                   | `MapBuilder` inside `MapGenerator`                                                           | Constructing a large, validated structure step by step               |
| Repository + Unit of Work | `data/persistence` repositories, one transaction per use case                                | Persistence with consistency guarantees (ES-10)                      |
| Dependency Injection      | Constructor injection from `Match`/`SessionController`                                       | Always; no Service Locator, no singletons except store and event bus |

Do not add a pattern for its own sake: "use patterns wherever possible" means wherever a
coupling would otherwise appear, and the review checklist asks which coupling each one removes.

## Data, not code

### CP-09 No hardcoding, no magic numbers

- **Requirement.** Gameplay numbers and display names live in `packages/core/src/content/`
  (provisional values marked `// TUNE:`); world-shape values (`numLanes`, tower counts, caps,
  tick rate, timeline) live in `config/GameConfig`; implementation-only constants (buffer sizes,
  retry limits) live in `<ClassName>.constants.ts`. A numeric literal in gameplay code other than
  `0`, `1`, `-1` or a unit conversion needs a name and a home. One-line rule with the mechanics:
  [`CONTRIBUTING.md` §4](../../CONTRIBUTING.md).
- **Sketch.**

```ts
// content/structures/buff-tower.ts (sketch)
export const buffTower = {
  id: 'buff-tower',
  displayName: 'Buff Tower', // themed name pending
  baseHealth: 1000, // TUNE: Game doc, "How Buff/Debuff Towers ... Buff Walls"
  shieldPercentPerAlliedBuffTower: {
    'spawner-tower': 1.25,
    'buff-tower': 1.5,
    'wall-segment': 2.0,
  },
} satisfies StructureDefinition;
```

### CP-10 The OCP litmus test: new idea = new class + content entry + registry line

- **Requirement.** Every extension recipe in
  [`../architecture/17-extension-recipes.md`](../architecture/17-extension-recipes.md) must reduce
  to at most those three additions (plus tests and docs). If a feature needs a fourth kind of
  change to existing code, the design has a missing seam; fix the seam, not the feature.
- **Sketch (a new ability).**

```ts
// abilities/effects/BlinkEffect.ts (sketch): the new class
export class BlinkEffect implements AbilityEffect {
  public apply(ctx: AbilityContext): void {
    /* teleport the caster by ctx.definition.range */
  }
}
// content/abilities/blink.ts (sketch): the content entry
export const blink = {
  id: 'blink',
  displayName: 'Blink',
  effect: 'blink',
  cooldownTicks: 240,
} satisfies AbilityDefinition;
// abilities/AbilityRegistry.ts (sketch): the registry line
registry.register('blink', () => new BlinkEffect());
```

### CP-11 Immutability and readonly by default

- **Requirement.** Definitions are frozen at load and shared (Flyweight); snapshots, commands and
  events are `Readonly`; function parameters are `readonly T[]`; class members not reassigned are
  `readonly`. State is mutated only inside systems through methods on components and entities,
  never by reaching into another object's fields. Mechanics: [`CONTRIBUTING.md` §1](../../CONTRIBUTING.md).
- **Why.** Immutable definitions make hot-reload and sharing safe; readonly snapshots stop views
  and React from becoming a second source of truth (AP-04).

## Errors, names, docs, size

### CP-12 Error handling: fail fast in core, degrade at the edges, never swallow

- **Requirement.** Three kinds of failure, handled differently:
  - **Bugs** (an entity inside a wall, a negative health) are invariant violations: assert in
    tests, log as `DiagnosticEvent` in the browser, never "fix up" silently (AP-12).
  - **Expected domain failures** (invalid command, unknown content ID, loadout that fails
    validation) throw typed errors from core: a `GameError` base with a string-literal `code` and
    subclasses such as `InvalidCommandError`, `UnknownDefinitionError`, `ConfigValidationError`.
    Core never catches its own errors to continue; the caller decides.
  - **Environment failures** (IndexedDB quota, asset fetch, audio context) are caught only in
    adapters, translated to typed errors (`StorageError` with `cause`), and handled by the
    application layer with a defined degraded mode (ES-06).
- **Rules.** No empty `catch`; no `catch` that logs and continues without a decision; every
  promise is awaited, returned or explicitly `void`ed (enforced); errors carry `cause` and the
  tick/entity context. React screens sit inside error boundaries.

### CP-13 Naming for rename-cheapness

- **Requirement.** Display names live in content, never in class names or code strings. Content
  IDs are kebab-case and never renamed once a save or a release stores
  them (ADR 0023; `INBOX.md` HC-Q18 (4)). Class names are code identifiers: renaming a
  class such as `Warrior` is an IDE rename of the class, its imports and the `extends` headers
  of its subclasses, and nothing else, because no rule, ID, save file or string compares against
  the class name. Kinds are string-literal unions declared once in content types; `kind` values
  are derived from definitions, not from `constructor.name`.
- **Why.** "if i wanted to change the name of 'Warrior' to anything else at any time, should be
  very easy". Placeholder names keep their "(rename pending)" note in docs and TSDoc.

### CP-14 TSDoc expectations

- **Requirement.** Every exported class and public method has TSDoc
  ([`CONTRIBUTING.md` §4](../../CONTRIBUTING.md)) with: a one-line summary in the imperative; the
  invariants or units of parameters (`ticks`, world units) with `@param`; `@returns` when not
  obvious; `@throws` for typed errors; `@remarks` for the design intent (which pattern, which
  principle); `@see` linking the architecture doc for anything non-trivial. Comments explain why,
  not what; no commented-out code; TODOs have an owner.

### CP-15 Size and shape limits

- **Requirement.** Files under ~300 lines, functions under ~60, at most 4 parameters, shallow
  nesting, one class per file: [`CONTRIBUTING.md` §4](../../CONTRIBUTING.md). A file that grows
  past the limit is split by responsibility (CP-01), not by moving helpers into a "utils" dump.

### CP-16 Determinism-safe habits in core

- **Requirement.** In `packages/core`: time is a tick count; randomness comes from the injected
  `SeededRandom`; iterate entities in ID order; sort with pure comparators that break ties by ID;
  never drive simulation order from object-key or `Map` iteration unless insertion order is fixed
  at load; defer spawns and removals to the end of the tick; keep `Math.sin/cos/atan2/pow/exp`
  behind `utils/` math wrappers; prefer vectors to angles in steering. Rationale and evidence:
  [`../research/game-architecture-and-performance-research.md#determinism-pitfalls-specific-to-javascript`](../research/game-architecture-and-performance-research.md#determinism-pitfalls-specific-to-javascript).

## Related

- [`01-architecture-principles.md`](01-architecture-principles.md): the design-level principles these serve
- [`05-engineering-standards.md`](05-engineering-standards.md): tests, determinism and performance verification
- [`../architecture/17-extension-recipes.md`](../architecture/17-extension-recipes.md): the recipes that prove the OCP litmus test
- [`../architecture/04-entity-architecture.md`](../architecture/04-entity-architecture.md): entity, component and strategy design
- [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md): the conventions this document reasons about
- [`../agents/checklists.md`](../agents/checklists.md): the review questions that check these principles
