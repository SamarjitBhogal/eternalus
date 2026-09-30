---
title: Weapons and artifacts
description: Weapon classes, the named weapons, the unique per-class weapons and the class-specific artifacts (gadgets), plus the open question of weapon abilities; read it before working on weapon or artifact content or the combat pipeline.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [reference, game-design, weapons, artifacts, gadgets]
paths: ['packages/core/src/content/weapons/**', 'packages/core/src/content/artifacts/**']
related:
  - 'docs/reference/game-design/06-abilities-and-progression.md'
  - 'docs/reference/game-design/08-loadout.md'
  - 'docs/architecture/05-abilities-weapons-and-loadouts.md'
---

# Weapons and artifacts

**Purpose.** Read this when you add a weapon or an artifact, or change how attacks deal damage.
Weapons are the primary/secondary loadout slots; artifacts are the two gadget slots (Z and C by
default). The MVP ships "simple loadout options (weapons, some ability options, etc)"
(requirements doc), so a small catalogue from these tables is enough.

## Weapon rules

- **Non-unique weapons are not class-specific**: any class can use any weapon available to
  another class. The class table's "weapon bias" (light weapons for Assault, heavy for Sentinel,
  staves for Magus) is a bias, not a restriction.
- **Each class has one unique weapon** it can use if desired.
- Weapons have a **damage type** (physical, magical, or both), a **reach** and optionally a
  **heavy attack** and a **parry** with effects.
- **Open question** (`[STATUS: idea-pending]`): should weapons have abilities? "It may be
  getting complex." Until decided, weapons carry passive effects (bleed, concussion on heavy
  attack, stacking debuff) but no activatable ability.

## Weapon classes

| Weapon class       | General details                                                                 | Status  |
| ------------------ | ------------------------------------------------------------------------------- | ------- |
| Glove              | Typically melee (some have a ranged flex)                                       | **MVP** |
| Bow                | Typically ranged (some with higher-than-expected melee damage)                  | **MVP** |
| Sword              | Melee (mostly)                                                                  | **MVP** |
| Spear / Battle axe | Longer-reach melee                                                              | **MVP** |
| Staff              | (listed under named weapons and unique weapons; melee physical, ranged magical) | **MVP** |

## Named weapons

| Weapon class | Name          | Damage type                                                                                                                                            | Description                                                                                              | Status          |
| ------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | --------------- |
| Glove        | Raptor Talons | Melee, physical, bleed                                                                                                                                 | The initial melee hit inflicts physical damage and a bleed DoT. Looks like a Warhammer 40K power fist.   | **MVP**         |
| Bow          | (unnamed)     | Ranged, magical, debuff                                                                                                                                | Reduces protections (stacks). An obsidian bow that shoots glowing purple arrows with black smoke trails. | **MVP**         |
| Staff        | A Fine Line   | Melee physical, ranged magical, piercing                                                                                                               | A staff with a blade at one end that does piercing damage; ranged attacks also pierce.                   | **MVP**         |
| Battle axe   | Wuuthrad      | Physical melee; longer reach; heavy attack applies concussion; extra effective against Sentinels                                                       | Like the Skyrim axe, but its bonus applies to everyone instead of just elves.                            | **MVP-if-time** |
| Sword        | Lightbringer  | Magical and physical melee; heavy attack strikes lightning (cooldown) that inflicts a brief stun, concussion, and blind; parry inflicts blind and stun | A gold and white sword. Glows faintly in dark areas for allies.                                          | **MVP-if-time** |

Scope reasoning: one weapon per class of attack (melee glove, ranged bow, hybrid staff) covers
the MVP's "simple loadout options"; Wuuthrad and Lightbringer add heavy-attack and parry
mechanics that are not otherwise required. The bow's name is a naming to-do.

## Unique class weapons

| Class    | Weapon                  | Description                                                                                                                                                                                                                                                                                                                         | Status                                                            |
| -------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Sentinel | Barricades (needs work) | Think Cabrakan's arm walls. Walk on all fours? The walls can be pressed together in front of you, but you cannot move while doing so. Heavy but slow melee damage on swing. Greatly increases character weight. Passively acts as super-heavy armour: a moving obstacle with high penetration protection and knock-back absorption. | **post-MVP** (open question "Barricades needs work")              |
| Magus    | Staff                   | Melee attacks do physical damage; ranged attacks do magical damage. Increases the potency of spells (abilities).                                                                                                                                                                                                                    | **MVP**                                                           |
| Assault  | Short blades            | Close-range, fast melee with deadly passive abilities. Can be thrown, but must be retrieved or regenerate over time.                                                                                                                                                                                                                | **MVP-if-time** (throw/retrieve needs a projectile that persists) |

Barricades touches several systems at once (movement lock, `mass` change, a moving collider,
knockback absorption); that is why it is "needs work" and post-MVP. Its ingredients all exist as
extension points (Movement, Collider, StatusEffects), so it needs no new architecture.

## Artifacts (gadgets)

Artifacts are **class-specific and not shared across classes**. A Legend has two artifact slots
(loadout "Artifact 1 and artifact 2"), bound to **Z** and **C** by default (the requirements doc
calls them **gadgets**: "z and c for gadgets"). "Gadget" is the slot; "artifact" is the item.

| Class    | Artifact           | Description                                                                               | Varieties / modes                                                                                                                                          | Status          |
| -------- | ------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Sentinel | Mortar             | A mortar system with two fire modes, selected before spawn: **impact** and **air burst**. | **Physical**, **Magical**                                                                                                                                  | **MVP-if-time** |
| Sentinel | (TBD)              | Second Sentinel artifact not yet defined.                                                 | —                                                                                                                                                          | open question   |
| Magus    | Soul Orb (pending) | "Arc Soul from D2" (Destiny 2).                                                           | (names pending) **Cast Forward**: cast on any surface as a turret (health based or time based?). **Follower**: summons the orb beside you as an assistant. | **MVP-if-time** |

Assault has no artifact in the source; proposals are in `../suggestions/more-weapons.md`.
Scope: the requirements doc's MVP controls include Z/C for gadgets, so the slots and bindings
are **MVP**; the artifacts that fill them are **MVP-if-time** (one per class is the target).

## MVP note

The requirements doc's MVP line is "simple loadout options (weapons, some ability options,
etc)". For weapons that means: the weapon classes above as content, at least one named weapon
per class of attack, the Magus staff as the unique weapon, and the primary/secondary slots
wired to the attack. Everything else in this doc is the catalogue the content folder grows into.

## Engineering notes

- Definitions: `content/weapons/<weapon-id>.ts` (`WeaponDefinition`: class, damage type(s),
  reach, attack speed, heavy attack, parry, passive effects, allowed classes or `any`) and
  `content/artifacts/<artifact-id>.ts` (`ArtifactDefinition`: class, modes, cooldown, aether
  cost, effect). Weapons and artifacts are Flyweights: one immutable definition shared by every
  Legend that equips it; per-Legend state (ammo, cooldown, thrown blade in flight) lives in the
  `Loadout`/`Abilities` components.
- Damage flows through the `DamagePipeline` (source → modifiers → shields → health) with a
  `DamageSource` that names the weapon or artifact, so "extra effective against Sentinels" or
  "reduces protections (stacks)" are modifiers, not branches in `CombatSystem`.
- Attack behaviour is an `AttackStrategy` chosen by the weapon (melee arc, projectile, beam);
  a new weapon that behaves like an existing one is content only (OCP). Artifacts reuse
  `AbilityEffect` strategies, so a mortar is an ability with a "before spawn" mode selector in
  the loadout.
- If weapon abilities are adopted later, a `WeaponDefinition` gains an optional `abilityId` and
  nothing else changes: the ability registry already exists.

## Related

- [Abilities and progression](06-abilities-and-progression.md)
- [Loadout](08-loadout.md)
- [Classes and sub-classes](01-classes-and-subclasses.md)
- [Controls](09-controls.md)
- [Open questions](12-open-questions.md)
- [Architecture: abilities, weapons and loadouts](../../architecture/05-abilities-weapons-and-loadouts.md)
- [Suggestions: more weapons](../suggestions/more-weapons.md)
- [Verbatim source: Weapons, Artifact](../source/game-project-eternalus-v2.md)
