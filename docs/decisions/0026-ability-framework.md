---
title: 0026. Ability framework build decisions
description: Proposed record of seven decisions the ability framework PR (DEC-196 to DEC-209) took beyond architecture 05, 04 and 10 - kits from a class pool with an optional kit per Legend read through RosterSlot.specId (amends ADR 0018 point 2); one CastValidator for the handler, snapshot and bots; unbuilt abilities are unavailable, a missing strategy fails at boot; forced motion for dashes and knock-backs; aether refill in its own system; where both run; area shapes behind a registry; read this before changing the cast path, kits, knock-back, aether refill or effect areas.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-11-14
tags: [adr, abilities, kits, physics, aether, content]
related:
  - 'docs/architecture/05-abilities-weapons-and-loadouts.md'
  - 'docs/architecture/04-entity-architecture.md'
  - 'docs/architecture/10-physics.md'
  - 'docs/architecture/13-game-interface.md'
  - 'docs/decisions/0018-mvp-legend-pick-as-setup-data.md'
  - 'docs/reference/game-design/13-owner-decisions-log.md'
  - 'packages/core/AGENTS.md'
---

# 0026. Ability framework build decisions

- Status: proposed (drafted 2026-11-13 for the ability framework PR, `feat/ability-framework`;
  the code is built on that branch and waits for the product owner's acceptance, `INBOX.md`
  HC-Q48)
- Date: 2026-11-13

## Context

The product owner's rulings DEC-196 to DEC-209 (the
[decisions log](../reference/game-design/13-owner-decisions-log.md)) set the ability work: the
framework first with one ability for each class (Blade Runner, Slam, Shockwave), then one PR for
each class (DEC-196). [Architecture 05](../architecture/05-abilities-weapons-and-loadouts.md) is
a sketch written before any ability code existed. Building it forced seven decisions that go
beyond that sketch, beyond [04](../architecture/04-entity-architecture.md) §5 and
[10](../architecture/10-physics.md) §2, or against them. Each is below with its own context, the
decision, the alternatives rejected and the consequences. The folder import rules in
`packages/core/AGENTS.md` bind several of them: `commands/` imports only `state/`, `entities/`
and `utils/` (and the shared types it re-exports, decision 2); `components/`, `state/` and `ai/`
do not import `abilities/`.

## Decision

### 1. Kits: a class pool, a class default kit and an optional kit per Legend

- **Context.** 04 §5 and 05 §2 put a fixed `abilityIds` (three) and an `ultimateId` on
  `LegendDefinition`. DEC-198 gives each class one ability pool and each Legend its own default
  kit from it, so that custom loadouts can come later. DEC-199 names the kits and DEC-209 (2)
  the slot order. [ADR 0018](0018-mvp-legend-pick-as-setup-data.md) point 2 says of the Legend
  pick: "Until the gameplay is built, nothing in the simulation or in a running match reads it:
  it gives no stats, abilities, sizes or entity class."
- **Decision.** `LegendDefinition.abilityPool` lists every ability and ultimate of the class.
  `LegendDefinition.defaultKit` is an `AbilityKit`: three abilities for `ability-1` to
  `ability-3` and the ultimate for `ability-4`. `LegendSpecDefinition.kit` is an `AbilityKit` or
  `null`; `null` means the class's default kit. `RosterSlot.specId` (optional) names the Legend
  of a roster slot; the client passes the pick for the player and for each bot. `Legend` builds
  its `Abilities` from the spec's kit, else from the class's default kit: one rule,
  `content/legends/specs/kitOf.ts`, which the client's kit rows also call through
  `@eternalus/core`. `Legend` looks the spec up in the spec source the `EntityFactory` passes in
  the spawn context, as it passes the weapon source (`Simulation` injects `LEGEND_SPECS`). A spec
  id that does not exist, or that belongs to another class, throws at spawn. `KitInPoolRule` and
  `KnownAbilityRefsRule` check the pool and every kit at content load. **This amends ADR 0018
  point 2, the sentence quoted above:** the simulation now reads the Legend through
  `RosterSlot.specId`, and only to choose the kit. The pick still gives no stats, sizes or
  entity class.
- **Alternatives rejected.** A fixed kit per class (the sketch): DEC-198 gives each Legend its
  own kit. A kit on every spec with no class default: every spec would repeat its class's kit.
  Waiting for the `Loadout` model (05 §12, sprint 4.5): the per-class PRs need kits now.
- **Consequences.** A custom loadout later is another selection from the same pool (DEC-198).
  `AbilityKit` is the ability half of 05 §12's `Loadout`, which absorbs it when it is built. On
  acceptance, ADR 0018's Status line gets an "amended by 0026" note; its body is not edited.

### 2. One cast rule, injected where the folder rules forbid an import

- **Context.** 05 §7 puts `canCast` on the per-slot `AbilityRuntime` and calls it from
  `applyCommand`. The player snapshot (`isReady`, `blockedBy`) and the bots need the same rule.
  `commands/`, `components/`, `state/` and `ai/` may not import `abilities/`.
- **Decision.** `abilities/CastValidator` is the one rule. It runs ordered checks and returns
  the first reason that fails: the caster exists and is alive, the slot holds an ability, the
  ability is built (`unavailable`), no other cast of the caster waits (`casting`), the match
  holds no units idle and no status forbids casting (`cannot-cast`; the countdown is a freeze,
  DEC-88), the cooldown is over, an ultimate's meter is full (`not-charged`), the aether covers
  the price after status modifiers, a directional cast has a direction (`no-target`), then each
  restriction in content order. `slotBlockedBy` runs the same checks without the aim's: a slot's
  readiness does not depend on where a cast would be aimed. `CastValidator` implements the port
  `state/SlotReadiness.types.ts` itself (`blockedBy`, `slotBlockedBy`, `priceOf`,
  `cooldownTicksOf`). `Simulation` builds one validator per match and injects it into
  `CastAbilityHandler` (typed `Pick<SlotReadiness, 'blockedBy'>`), `GameState.snapshot` (for
  `PlayerSnapshotter`, which asks `slotBlockedBy`), the bot controllers and, through
  `DefaultSystemPipeline`, `AbilitySystem`, which runs it again on each queued cast: a cast that
  fails then is announced with `command-rejected` and spends nothing. The slot state is
  `components/AbilitySlotRuntime`, next to `Abilities` (as `StatusEffectRuntime` sits next to
  `StatusEffects`); it holds no rule. Its pending cast's `Aim` is the one aim type: it lives in
  `components/AbilitySlotRuntime.types.ts`, the lowest layer that holds one, and
  `commands/Command.types.ts` re-exports it for the `cast-ability` command, as it re-exports
  `AbilitySlot` from `content/`.
- **Alternatives rejected.** `canCast` on the slot runtime: `components/` would import the
  registry. The handler imports `abilities/` directly: breaks the folder rule. The snapshot and
  the bots keep their own readiness check: two definitions of "ready" drift, and the HUD could
  show a slot as ready that the handler refuses. A separate port for the handler (`CastCheck`)
  and an adapter class over the validator for the snapshot and the bots (`CastReadiness`): two
  ports with one shape and three validators per match. The snapshot judging a slot with a made-up
  aim: it guesses at what the aim check would say.
- **Consequences.** The handler, the system, the HUD and the bots judge a cast by one rule and one
  validator. The port has one implementation, which `AGENTS.md` ("Ponytail") keeps on purpose. A
  new reject reason is one member of `AbilityRejectReason`
  (`content/abilities/AbilityDefinition.types.ts`); the client's `HudBlockReason` is that type.

### 3. An ability with no effects is unavailable; a missing strategy fails at boot

- **Context.** The kits name twelve abilities. The framework PR builds three; the per-class PRs
  build the rest (DEC-196). The kit rows must show every kit ability (DEC-199).
- **Decision.** An ability with `effects: []` is full content (name, description, cost,
  cooldown) and composes as unavailable: a cast is refused with `unavailable`, the snapshot
  shows `blockedBy: 'unavailable'` and the display data `isAvailable: false`. An ability that
  names an effect, shape or restriction kind with no registered strategy throws
  `ContentValidationError` when `createDefaultAbilityRegistry` resolves every ability at boot.
- **Alternatives rejected.** Leave the unbuilt abilities out of content: the kits would not
  validate and the kit rows could not show them. Stand-in effects: throwaway code that no plan
  schedules. Treat a missing strategy as unavailable too (an interim of the build): a typo would
  ship without a sign.
- **Consequences.** A per-class PR fills `effects` and registers any new strategy, and the
  ability becomes castable with no other change. A typo in a kind stops the boot.

### 4. Forced motion, not impulses, for dashes and knock-backs

- **Context.** 10 §2 makes every push an impulse added to `pendingImpulse` (velocity change
  `J / mass`). `Movement` re-points its velocity along the heading every tick
  (`components/Movement.ts`), so an impulse added to the velocity is gone a tick later. DEC-208:
  the content distance is for a target of base mass, a heavier target moves less, and
  knock-backs that hit one target at the same time add up.
- **Decision.** `Movement.push(displacement, ticks)` spreads a displacement evenly over a number
  of ticks. `takeForcedStep()` returns the sum of every push under way. `MovementSystem` adds it
  to the walking step and moves once, so collision treats both alike. Forced motion moves a unit
  that `cannot-move` (Slam knocks back and knocks up at once) and waits while the match holds
  units idle. A knock-back moves its target the content distance × `baseMass` /
  max(`baseMass`, target mass), over the travel time; both numbers live in
  `content/abilities/knockback.ts` (`TUNE`, proposals pending the owner). Each knock-back is its
  own push, so knock-backs in one tick add up as vectors (DEC-208 (3)). Every target a
  knock-back reaches gets `staggered`; `knockup: true` adds `knockup`. A dash resolves its path
  at cast: along the aim, cut where the caster's circle first touches a wall or the map's edge
  (`abilities/dashReach.ts`), with the collision rule `CollisionSystem` moves units with.
  `Simulation` builds one `CollisionResolver` per match, on the one static collision index and
  the map's bounds, so the bounds rule lives once, inside it. It injects that resolver into
  `CollisionSystem` and hands it to `abilities/` as the `CollisionQuery` port on `GameState`,
  beside `space` and `paths`, so `MatchWorld` stays map data. A destroyed object leaves the index
  the moment its entity is removed, so walking and a dash stop seeing it at once. The client's
  aim overlay asks the same rule (`Simulation.dashReach`). Its path steps hit each unit on the
  path once, at cast, and its end steps run at the cut end.
- **Alternatives rejected.** Impulses as designed: they need a velocity model that keeps
  momentum (10 §2's friction and acceleration clamp), which `Movement` does not have. Moving the
  `Transform` directly: skips collision. The last push wins: contradicts DEC-208 (3).
- **Consequences.** 10 §2's knock-back paragraph and 05 §3's `knockback` row change. Impulses
  stay the design for throwing a carried unit (10 §3), which is not built. Boss masses (DEC-208)
  need no code change. The dash's hit path ends where its motion ends: a dash aimed away from a
  wall it stands beside goes its whole distance, one aimed into the wall stops at it. In a match
  without map objects there is no `CollisionSystem`, so nothing stops a dash, as nothing stops
  walking.

### 5. Aether regeneration is its own system, with exact amounts

- **Context.** 05 §6 has `AbilitySystem` add `aetherRegenPerTick`, a field on `Abilities`, at
  2 per second. DEC-201 sets 4 per second at the base capacity, growing with the maximum aether
  (`TUNE`, DEC-201 (3)), +50% in an allied BuffTower or Stronghold aura, and the Stronghold's
  bonus scaled by the share of its team's BuffTowers still standing (DEC-201 (4)).
- **Decision.** `systems/AetherRegenSystem` refills every `Aether` pool that is not full. The
  amount per tick is the base rate × max / base × (1 + aura bonus) / tick rate, rounded down to
  a multiple of `AETHER_REGEN_QUANTUM` (2^-16, a precision constant in
  `AetherRegenSystem.constants.ts`), and never above the maximum. A Legend within the aura radius
  of a live allied aura structure gets that aura's bonus. A BuffTower gives the full bonus. The
  Stronghold gives the bonus × standing / spawned BuffTowers of its team (spawned = standing +
  `LaneStructures.lostCount`), so nothing once they all fall. Inside several auras the Legend
  gets the largest bonus; bonuses never add up. The rate, the bonus, the radius and the aura
  sources live in `content/abilities/aetherRegen.ts`. `Aether.base` keeps the class's starting
  capacity.
- **Alternatives rejected.** Regeneration inside `AbilitySystem` (05 §6): two reasons to change
  one class, and it refills Legends that never cast. A stored per-tick rate on the component: it
  must be recomputed on every level-up and aura change; computing it from max and base each tick
  cannot go stale. Unrounded amounts: rounding error builds up, so the tick a pool reaches a cost
  is hard to predict and to test. Adding up the bonuses of several auras: DEC-201 gives one +50%.
- **Consequences.** A full refill takes the same time at every level. The aura radius is
  `balancing.md`'s recommendation, pending the owner (`INBOX.md` HC-Q49).

### 6. Where the two systems run in the tick

- **Context.** 05 §7 places `AbilitySystem` after `AiSystem` and before `MovementSystem`. The
  commands of a tick are applied at the start of `Simulation.step()`, so a cast is queued before
  the pipeline runs.
- **Decision.** `DefaultSystemPipeline` runs `AbilitySystem` after the AI and `HordeSystem`, then
  `AetherRegenSystem`, then `StatusEffectSystem` and `MovementSystem`. A cast runs on the tick
  its command is applied, spends before that tick's refill, and its pushes move on the same
  tick. `StateHasher` adds a Legend's slot fields only once a slot leaves its initial state, so
  a match in which nobody casts keeps the hashes of the golden replays.
- **Alternatives rejected.** `AbilitySystem` after `MovementSystem`: a dash would start a tick
  late. Regeneration before the casts: a Legend at full aether would lose that tick's refill when
  it casts.
- **Consequences.** 05 §7's order holds; the pipeline lists of 10 §9 and 11 §1 gain the two
  systems when they are next revised. `DefaultSystemPipeline` stays the one place of change.

### 7. Area shapes behind a registry, shared with the aim overlay

- **Context.** 05 §3 lists the effect shapes as shared types and finds targets with a
  `SpatialHash` query. Rip & Tear needs a fan and a circle, and its aim indicator shows both
  (DEC-206). In aim-then-click mode every ability shows its range overlay first (DEC-209 (3)).
  `SpatialHash` holds points only (10 §12).
- **Decision.** `abilities/shapes/AreaShape` answers whether a body overlaps a placed area and
  which point a knock-back pushes away from. Each `EffectShape` kind is one class (`CircleShape`,
  `PathShape`; a `path` has a `width`), registered in `AbilityRegistry` through
  `defaultAbilityRegistry.ts`. A body counts when its circle overlaps the area. A shape kind with
  no class fails at boot (decision 3). `TargetQuery` walks the `EntityStore` and sorts the hits
  by id. `loadDisplayContent` publishes each effect step's kind and area in `AbilityDisplay`
  (a dash's own row carries its distance and no area; the kind is any string, so a new effect
  kind needs no edit to the display types); the client's `AimOverlayView` draws them with one
  painter per shape kind (`aimShapePainters.ts`, a mapped type keyed by the kind, so a kind with
  no painter does not compile).
- **Alternatives rejected.** A `switch` over shape kinds: rule 12 forbids it. Areas computed by
  the client from its own data: two sources for one area. A `SpatialHash` query: it has no body
  radii, and casts are rare enough for a walk.
- **Consequences.** The fan for Rip & Tear is one class, one registry line and one painter
  (Sentinel PR). The overlay draws the area that the cast will hit.

## Consequences

- The design text of 05 §1, §2, §3, §5, §6, §7 and §16, 04 §5 and 10 §2 is corrected to the
  built code and to DEC-198, DEC-201 and DEC-208, each change cited. The rest of 05's sketch
  (varieties, cast and channel times, delayed steps, the ultimate meter, zones, projectiles)
  stays the intent; 05 §18 lists what is built.
- The better-than-design parts (decisions 1, 2, 4 and 5, and the client's `HudBlockReason`) are
  in `INBOX.md` HC-B5 for the owner's sign-off.
- `abilities/` imports what [02](../architecture/02-code-structure.md) §2 allows (`combat/`,
  `components/`, `content/`, `state/`, `utils/`) plus one module, `entities/unitFamilies`
  (`DamageEffect` scales damage on a target that is not a unit). `packages/core/AGENTS.md`'s
  `abilities/` row says exactly that.
- Documents amended on acceptance: ADR 0018's Status line ("amended by 0026"; its body is not
  edited) and this ADR's Status.
