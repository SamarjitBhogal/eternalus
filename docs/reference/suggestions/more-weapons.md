---
title: More weapons
description: Proposed additional named weapons for every weapon class, additional artifacts for each MVP class, and a proposal for weapon "abilities" that adds no active slots (weapon = stats + on-hit effects + one heavy attack); read it when the weapon or artifact catalogue needs an entry or when the open question "should weapons have abilities?" comes up.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-09-30
tags: [reference, suggestions, weapons, artifacts, gadgets, content]
paths: ['packages/core/src/content/weapons/**', 'packages/core/src/content/artifacts/**']
related:
  - 'docs/reference/game-design/07-weapons-and-artifacts.md'
  - 'docs/reference/suggestions/more-abilities.md'
  - 'docs/reference/suggestions/naming.md'
  - 'docs/architecture/05-abilities-weapons-and-loadouts.md'
---

# More weapons

**Purpose.** Read this when the weapon or artifact catalogue in `packages/core/src/content/` needs more than the five named weapons and three artifacts the game doc gives (`../game-design/07-weapons-and-artifacts.md`), when Assault needs an artifact (the source gives it none) or the Sentinel needs its second one (TBD, OQ-10), or when the open question "should weapons have abilities? It may be getting complex" (`[STATUS: idea-pending]`, OQ-29) needs an answer that does not add complexity. Everything here is a proposal (`README.md`); the names follow `naming.md` where a placeholder already has a recommended pick (the unnamed bow is **Ashveil**, the second Sentinel artifact is **Warhorn**). Item status of every row: proposed.

Conventions: damage type is physical, magical or both (the game doc's split); "passive" is the on-hit effect list every hit applies; the "heavy attack" is one stronger attack on a cooldown, the only "ability" a weapon has (§5); statuses are the IDs from `more-abilities.md` §7. Numbers are `Recommendation:`; the lore line is display text for the loadout screen and belongs in content.

## 1. The shape of a weapon

Every row below fills the same `WeaponDefinition`, so a proposal that needs a new field is flagged. Sketch (not code that exists; the full type is in `../../architecture/05-abilities-weapons-and-loadouts.md`):

```ts
// packages/core/src/content/weapons/oathkeeper.ts (sketch)
export const OATHKEEPER = {
  id: 'oathkeeper',
  displayName: 'Oathkeeper',
  weaponClass: 'sword', // 'glove' | 'bow' | 'sword' | 'spear-axe' | 'staff'
  allowedClasses: 'any', // unique weapons name one class
  damageType: 'physical', // 'physical' | 'magical' | 'split'
  reach: 2.0, // metres; ranged weapons add `range`
  attack: { strategy: 'melee-arc', damage: 48, intervalSeconds: 0.8 }, // TUNE: provisional
  onHit: [{ kind: 'buff', statusId: 'oathbound', target: 'self' }], // AbilityEffect list
  heavyAttack: {
    cooldownSeconds: 8,
    effects: [
      { kind: 'damage', amount: 120, damageType: 'physical', shape: { kind: 'arc', reach: 2.5 } },
      { kind: 'debuff', statusId: 'concussion', durationSeconds: 1.5 },
      { kind: 'knockback', impulse: 200 },
    ],
  },
  parry: { windowTicks: 12, effects: [{ kind: 'heal', fractionOfMax: 0.05, target: 'self' }] },
  lore: 'Sworn to a cause neither faction can name any more.',
} satisfies WeaponDefinition;
```

`onHit`, `heavyAttack.effects` and `parry.effects` reuse the `AbilityEffect` catalogue (`more-abilities.md` §1), so a weapon never needs a class of its own: a new weapon is one content file and one catalogue line (OCP). Per-Legend state (the heavy-attack cooldown, a thrown blade in flight) lives in the `Loadout`/`Combat` components; the definition is a shared Flyweight.

## 2. Additional named weapons by weapon class

The five named weapons in the source stay as they are: Raptor Talons (glove), the unnamed bow (Ashveil in `naming.md`), A Fine Line (staff), Wuuthrad (battle axe), Lightbringer (sword). The rows below add two or three per class so every class has a physical, a magical and a hybrid option, and so both team palettes have something to wear.

### Glove

| Name              | Damage type | Passive (on hit)                                                                                                  | Heavy attack (cooldown)                                                                        | Lore line                                                                                  | Status          |
| ----------------- | ----------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------- |
| Gravebreakers     | Physical    | Structure damage multiplier 0.6 instead of the default 0.3; every third hit on the same target knocks it back 1 m | Ground punch: 3 m cone, knockup 0.8 s and physical damage (8 s)                                | Forged for the grave-diggers of the old order, who buried whatever the wars left standing. | post-MVP        |
| Cinderfists       | Magical     | Applies `burn` for 1 s (refresh), so sustained punching keeps a target burning                                    | Flame burst: 4 m cone, `burn` 3 s and magical damage (10 s)                                    | Gauntlets quenched in the rift's own fire. They have not cooled since.                     | **MVP-if-time** |
| Judicator's Grasp | Split       | Alternates physical and magical hits; the "ranged flex" of the glove class                                        | Chained fist: a projectile 8 m that pulls the first enemy hit 3 m toward you (`pulled`) (12 s) | The Judicators never chased a heretic. They reeled them in.                                | post-MVP        |

### Bow

| Name           | Damage type | Passive (on hit)                                                                                     | Heavy attack (cooldown)                                                                                     | Lore line                                                                | Status          |
| -------------- | ----------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------- |
| Hollow Choir   | Magical     | Arrows pierce up to two enemies                                                                      | Volley: five arrows fall on a 4 m circle up to 16 m away (a zone for 1 s) (12 s)                            | Strung with the voices of the choir that sang the rift open.             | post-MVP        |
| Ironsong       | Physical    | "Higher-than-expected melee": the bow-bash melee attack deals 120% of arrow damage and concusses 1 s | Siege bolt: a slow bolt that ignores half of a structure's shield bars (a `DamagePipeline` modifier) (15 s) | A war-bow of the Dark forges, meant to be swung when the quiver empties. | post-MVP        |
| Sorrow's Reach | Magical     | Applies `marked` for 2 s                                                                             | Far shot: 24 m range, `marked` 6 s and the target is revealed to the minimap (12 s)                         | Its arrows do not kill from afar. They tell your friends where to.       | **MVP-if-time** |

### Sword

| Name         | Damage type | Passive (on hit)                                                                                       | Heavy attack (cooldown)                                                | Parry                  | Lore line                                                                   | Status          |
| ------------ | ----------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------- | --------------- |
| Oathkeeper   | Physical    | `oathbound`: +5% damage per consecutive hit on the same target, max 3 stacks, lost on switching target | Shield bash: `concussion` 1.5 s and 1 m knockback (8 s)                | Heals 5% of max health | Sworn to a cause neither faction can name any more.                         | **MVP-if-time** |
| Nightfall    | Split       | Three-hit rhythm; the third hit in a row is magical and blinds 0.5 s                                   | Crescent: a 6 m wave projectile that pierces (10 s)                    | Deflect only           | The last blade drawn before the peace broke. It remembers the dusk.         | post-MVP        |
| Pale Verdict | Physical    | +50% damage to targets below 25% health (pairs with Rip & Tear's "low-health enemies should back up")  | Lunge: dash 3 m and strike (a `DashEffect` with `onPath` damage) (9 s) | Deflect only           | The headsman's sword of the old realm. It has never needed a second stroke. | post-MVP        |

### Spear / Battle axe

| Name         | Damage type | Passive (on hit)                                               | Heavy attack (cooldown)                                                      | Lore line                                                                                                  | Status          |
| ------------ | ----------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------- |
| Rift Reaver  | Physical    | Longer reach (3 m); structure damage multiplier 0.6            | Cleave: 180° arc, 2 m knockback (8 s)                                        | Chipped from a stone that fell the day the rift opened.                                                    | **MVP-if-time** |
| Dawnpike     | Split       | Longest reach (3.5 m); thrusts hit up to two enemies in a line | Lunge: dash 5 m; enemies in the path are rooted 0.5 s (10 s)                 | Carried at the head of the paladin columns. The Dark side calls it the Duskpike, and it is the same spear. | post-MVP        |
| Gallows Hook | Physical    | Applies `slowed` 20% for 1 s                                   | Hook: pulls one enemy 6 m toward you (`pulled`), then `bleed` 1 stack (12 s) | A halberd made for hauling riders from saddles, now for hauling Magi out of their wards.                   | post-MVP        |

### Staff

| Name             | Damage type                    | Passive (on hit)                                                                       | Heavy attack (cooldown)                                                                             | Lore line                                                                         | Status          |
| ---------------- | ------------------------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------- |
| Umbral Crook     | Melee physical, ranged magical | Ranged hits apply `sundered` 1 stack                                                   | Lash: a 10 m beam for 0.5 s (`BeamAttackStrategy`, MVP-if-time) (12 s)                              | A shepherd's crook for a flock that no longer follows.                            | post-MVP        |
| Hearthwarden     | Melee physical, ranged magical | 20% of damage dealt heals the lowest-health ally within 6 m of the Magus               | Ward: a 3 m circle for 2 s that blocks enemy projectiles (a zone with a projectile collider) (12 s) | It kept the hearth-fires lit through the long, strained peace.                    | **MVP-if-time** |
| Bonecaller's Rod | Melee physical, ranged magical | Every third minion kill raises a shade (light-minion stats, 6 s) beside you (`summon`) | Bone spear: a piercing projectile 12 m (8 s)                                                        | Tap the ground twice and nothing happens. The third tap wakes what lies under it. | post-MVP        |

Unique class weapons stay as the source lists them (Barricades post-MVP, Staff MVP, Short blades MVP-if-time). `Recommendation:` when the short blades' throw lands, it is a `ProjectileEffect` whose projectile persists as a `Carryable` obstacle until retrieved or a 10 s regeneration timer refills the slot, so no new entity family is needed.

## 3. Additional artifacts per MVP class

Artifacts are class-specific and fill the two gadget slots (Z and C). The source gives the Sentinel a Mortar and a TBD, the Magus a Soul Orb and Assault nothing. Artifacts reuse `AbilityEffect` strategies (`../game-design/07-weapons-and-artifacts.md` Engineering notes), so every row is content only.

| Class    | Artifact                   | Modes / varieties (chosen before spawn, like the Mortar)                                                                                                 | Effect (one line)                                                                                            | Cooldown / aether `Recommendation:` | Composes                       | Status                                     |
| -------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------- | ------------------------------ | ------------------------------------------ |
| Assault  | Ashen Bomb                 | **Smoke**: enemies inside are blinded, allies inside are invisible. **Flash**: instant blind 1.5 s, no cloud.                                            | Throw a bomb 10 m; a 4 m cloud lasts 3 s                                                                     | 25 s / 30                           | projectile, zone, debuff, buff | **MVP-if-time** (the one Assault artifact) |
| Assault  | Widow's Thorns             | **Thorns**: slow + bleed. **Snare**: the first enemy to enter is rooted 1 s, then the patch is spent.                                                    | Scatter caltrops in a 3 m patch for 8 s: enemies inside are slowed 30% and gain a `bleed` stack every second | 20 s / 25                           | zone, debuff                   | post-MVP                                   |
| Sentinel | Warhorn (the TBD artifact) | **Rally**: allies within 10 m take 15% less damage and move 10% faster for 5 s. **Challenge**: enemies within 8 m are taunted 2 s (bots) and slowed 20%. | Blow the horn                                                                                                | 30 s / 30                           | buff / debuff                  | **MVP-if-time** (fills OQ-10)              |
| Sentinel | Bulwark Totem              | **Totem**: 600 health, 10 s. **Beacon**: 300 health, 15 s, also reveals 8 m.                                                                             | Plant a totem: allies within 4 m gain one shield bar worth 10% of their max health while it stands           | 35 s / 35                           | summon (`obstacle`), buff      | post-MVP                                   |
| Magus    | Aether Well                | **Well**: aether. **Font**: half the aether, plus 2% max health per second.                                                                              | A 3 m circle for 6 s: allies inside regenerate aether three times faster                                     | 30 s / 0 (it costs no aether)       | zone, buff                     | **MVP-if-time**                            |
| Magus    | Reliquary of Sight         | **Lantern**: reveal around you. **Eye**: place it; a 60 s ward.                                                                                          | Reveal an 8 m circle for 6 s and mark enemies inside                                                         | 25 s / 20                           | reveal, debuff (`marked`)      | post-MVP                                   |

Soul Orb's open question (Cast Forward turret: health- or time-based, OQ-36): `Recommendation:` both, as content fields (`lifetimeSeconds: 12`, `health: 300`), whichever ends first; the turret dies with `RemovalCause: 'expired'` or `'died'`, so the despawn invariant holds either way.

## 4. Recommended MVP catalogue

The requirements doc asks for "simple loadout options (weapons, some ability options, etc)". `Recommendation:` ship one named weapon per weapon class so the loadout screen has a real choice in every row, and one artifact per class:

| Slot               | MVP content                                                                                    | Why this set                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Glove              | Raptor Talons (source)                                                                         | Bleed exercises the DoT path                                                          |
| Bow                | Ashveil (source, name from `naming.md`)                                                        | Stacking debuff exercises `sundered` and ranged projectiles                           |
| Sword              | Oathkeeper                                                                                     | A plain physical melee weapon with a heavy attack and a parry, the reference weapon   |
| Spear / Battle axe | Rift Reaver                                                                                    | Longer reach and structure damage; Wuuthrad stays MVP-if-time with its Sentinel bonus |
| Staff              | A Fine Line (source) plus the Magus unique Staff                                               | Melee physical / ranged magical split                                                 |
| Artifacts          | Mortar (Sentinel), Soul Orb (Magus), Ashen Bomb (Assault); Warhorn if OQ-10 is decided in time | One per class fills both gadget bindings for the demo                                 |

Everything else in §2–§3 is the catalogue the content folder grows into; none of it needs a system change.

## 5. Weapon "abilities" without complexity — idea-pending (OQ-29)

The game doc asks "should weapons have abilities? It may be getting complex." The complexity comes from active slots: a key, an aether cost, a cooldown on the HUD, a bot decision and a loadout row per weapon. `Recommendation:` **weapons have no active slots.** A weapon is exactly three things, all of which the combat pipeline already supports:

1. **Stats**: damage, damage type, reach or range, attack interval, attack strategy (melee arc, projectile, beam).
2. **On-hit effects**: a list of `AbilityEffect`s applied on every hit (bleed, sundered, marked, burn), optionally `everyNthHit` or with a `chance` drawn from the seeded `Rng`.
3. **One heavy attack**: a stronger attack with its own cooldown and effect list, and no aether cost. The source already describes exactly this for Wuuthrad ("heavy attack applies concussion") and Lightbringer ("heavy attack strikes lightning (cooldown)").

Plus an optional **parry** window, because the source describes Lightbringer's parry and the Sentinel's Grasp parry: `parry: { windowTicks, effects }`; "for most troops, [a parry] is simply a deflect" is the default with an empty effect list.

How it is triggered (bindings are data and rebindable, `../game-design/09-controls.md`):

| Option              | Heavy attack                                 | Parry                               | Notes                                                                                                   |
| ------------------- | -------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **A (recommended)** | Hold `attack` ≥ 0.5 s and release (a charge) | `parry` action, default right mouse | No new key for the heavy attack; charging reads as "heavy" in a top-down game; one new action for parry |
| B                   | `heavy-attack` action, default right mouse   | `parry` action, default Shift       | Two new actions; clearer for bots and tutorials; Shift collides with the recommended sprint key         |
| C                   | Hold `attack` (as A)                         | No parry in the MVP                 | Smallest; Lightbringer's parry effects wait for post-MVP                                                |

What stays simple: no HUD slot beyond a small cooldown ring on the crosshair, no aether interaction, and the bot logic is one `Consideration` ("heavy attack ready and the target is in reach"). What it buys: weapon identity (a Cinderfist player plays differently from a Gravebreakers player) without a second ability system. If the owner later wants true weapon abilities, `WeaponDefinition` gains an optional `abilityId` that occupies a loadout ability slot, and nothing else changes (`../game-design/07-weapons-and-artifacts.md` Engineering notes); the heavy attack is not that, and the two can coexist.

Restrictions, in the same spirit (all content): `allowedClasses` for unique weapons; a **weight bias** so the class table's "light weapons / heavy weapons / staves" is a nudge rather than a rule (`Recommendation:` a heavy weapon on an Assault attacks 10% slower, a light weapon on a Sentinel deals 10% less; the Magus Staff's "increases the potency of spells" is a +10% ability potency modifier only for Magus); the **secondary weapon** slot (MVP-if-time) is a `swap-weapon` action with a 0.5 s swap that resets the heavy-attack cooldown, never a second set of active slots.

Status of this section: `[STATUS: idea-pending]` (OQ-29). The MVP-safe part is stats + on-hit + heavy attack; parry is **MVP-if-time**; weapon abilities as slots stay **post-MVP** unless the owner decides otherwise.

## 6. Engineering notes

- Definitions: `content/weapons/<id>.ts` (`WeaponDefinition`) and `content/artifacts/<id>.ts` (`ArtifactDefinition`: class, modes, cooldown, aether cost, effects), each exported as a SCREAMING_SNAKE constant and listed in `weaponCatalogue.ts` / `artifactCatalogue.ts` (`../../architecture/02-code-structure.md` §4). Display names and lore lines are content; nothing here is a class.
- The `DamagePipeline` (source → modifiers → shields → health) carries a `DamageSource` naming the weapon or artifact, so "structure multiplier 0.6", "ignores half the shield bars" and "+50% below 25% health" are modifiers registered by kind, not branches in `CombatSystem`. A new modifier kind is one class plus a registry line.
- Attack behaviour is an `AttackStrategy` chosen by `attack.strategy`; the beam (Umbral Crook's Lash, Death Ray) is `BeamAttackStrategy`, **MVP-if-time**; every other weapon here uses the MVP `MeleeAttackStrategy` or `RangedProjectileAttackStrategy`.
- Heavy attacks and parries reuse `AbilityRuntime` for their cooldown (an ability whose `slot` is `'heavy-attack'` / `'parry'` and whose aether cost is 0), so the cooldown invariant and the HUD ring come for free (DRY).
- Determinism: on-hit chances draw from the seeded `Rng`; `everyNthHit` counters live in the `Combat` component and are hashed.
- Invariants: a weapon's `allowedClasses` is validated at loadout time (`validateLoadout`), never at attack time; a thrown short blade in flight is a pooled `Projectile` with a finite lifetime.
- Tests: one scenario test per weapon that asserts the on-hit effect and the heavy attack's effect list; the content validation test checks every `statusId` and `definitionId` referenced here exists.

## Related

- `README.md` — how a suggestion is accepted
- `../game-design/07-weapons-and-artifacts.md` — weapon rules, the named weapons and artifacts from the source
- `../game-design/08-loadout.md` — the slots these fill
- `../game-design/09-controls.md` — why heavy attack and parry bindings are data
- `../game-design/12-open-questions.md` — OQ-07 (bow name), OQ-10 (second Sentinel artifact), OQ-29 (weapon abilities), OQ-36 (Soul Orb turret)
- `more-abilities.md` — the `AbilityEffect` catalogue and the status-effect table these weapons use
- `naming.md` — Ashveil, Warhorn and the other recommended names
- `balancing.md` — anchor damage values the weapon numbers should stay near
- `../../architecture/05-abilities-weapons-and-loadouts.md` — `WeaponDefinition`, `AttackStrategy`, `DamagePipeline`
