---
title: Abilities and progression
description: The class abilities, combos, ultimates and their charge rules, the no-item-shop progression model, aether as the ability resource and XP-based scaling; read it before working on AbilitySystem, ProgressionSystem or ability content.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [reference, game-design, abilities, ultimates, progression, aether]
paths: ['packages/core/src/content/abilities/**', 'packages/core/src/abilities/**']
related:
  - 'docs/reference/game-design/01-classes-and-subclasses.md'
  - 'docs/reference/game-design/07-weapons-and-artifacts.md'
  - 'docs/architecture/05-abilities-weapons-and-loadouts.md'
---

# Abilities and progression

**Purpose.** Read this when you add or change an ability, an ultimate, a status effect or
anything about how Legends get stronger over a match. Abilities are class-specific and never
shared between classes; progression replaces an item shop entirely. Every number in the source
is a placeholder (`N`, `X`, `N00%`, `Nx`) and is quoted as such.

## Abilities

Each class has **3 abilities plus an ultimate**. Abilities are class-specific and not shared
between classes. Some abilities have **varieties** chosen in the loadout (`08-loadout.md`).
Grasp was moved to the default interactives (`01-classes-and-subclasses.md`).

| Class    | Ability      | Description                                                                                                                                                                   | Varieties (loadout configurable)                                                                                                                                                   | Status       |
| -------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Assault  | Veil         | Become invisible for N seconds.                                                                                                                                               | —                                                                                                                                                                                  | **MVP**      |
| Assault  | Blade Runner | Dash forward at incredible speed, dealing damage to everyone in your path.                                                                                                    | **Physical**: knocks back enemies in your way and stuns anyone at the end of your path. **Magical**: leaves a path of flame in your wake and burns anyone at the end of your path. | **MVP**      |
| Sentinel | Rip & Tear   | "Low-health enemies should back up." (no further description; open question "Describe Slam and Rip & Tear")                                                                   | —                                                                                                                                                                                  | **MVP**      |
| Sentinel | Slam         | Slam your arms down on the ground creating a shockwave, inducing knockback and knockup, and destroying the ground/structures near you.                                        | —                                                                                                                                                                                  | **MVP**      |
| Magus    | Imbue        | Your weapons do X% more damage, and attack speed increases by N%.                                                                                                             | **Damage**: full buff, applied to you alone. **Support**: buff reduced; provides a lesser buff to nearby allies.                                                                   | **MVP**      |
| Magus    | Shockwave    | Sends out a shockwave of light that blasts enemies back and applies the "concussion" debuff.                                                                                  | —                                                                                                                                                                                  | **MVP**      |
| Flying   | Eagle Eye    | Activate for thermal vision and target marking for N seconds. When the ability ends, targets stay marked for N more seconds. Marked targets are visible to all nearby allies. | —                                                                                                                                                                                  | **post-MVP** |

Counting: the source gives Assault 2, Sentinel 2, Magus 2 and Flying 1 named abilities against
the "3 abilities per class" rule, so each MVP class is one ability short. Proposals live in
`../suggestions/more-abilities.md`; the requirements doc's MVP asks only for "some ability
options", so two per class is enough to ship the MVP loadout.

### Combos and interactions

- **Slam + Shockwave**: if Slam and Shockwave are used near each other by opposing forces, they
  cause a large explosion ("a DBZ moment"). **MVP-if-time**.
- **Death Ray lock**: two opposing Death Rays lock together like the Harry Potter graveyard duel.
  Do not get close to the middle. Both sides get up to N seconds of extended ult time as long as
  they stay connected. "It is cool and rare." **MVP-if-time**.
- **Abilities cast before an ultimate still apply during it.** Example: Veil then Fury keeps the
  Assault invisible during Fury until Veil expires. **MVP** (it falls out of status effects
  being independent timers).

### Status effects named in the sources

concussion (Shockwave, Wuuthrad heavy attack, Lightbringer, Nova), stun, blind, bleed (Raptor
Talons), burn (Blade Runner magical, Firestorm), knockback and knockup (Slam, Shockwave, Fury,
Nova), crushed (Grab), marked (Eagle Eye), invisible (Veil), enraged (minions), pulled (Nova
collapse), protections reduced (the unnamed bow, stacking). Each is a `StatusEffectDefinition`
in content applied through the `StatusEffectSystem`.

## Ultimates

Rules from the game doc:

- Each class (and perhaps each sub-class?) has one ultimate ability. Open question: **one
  ultimate per class or per sub-class**. MVP: one per class.
- **Kills, assists and objective damage fill your ultimate. It does not fill passively.** You
  lose a small **N%** of the meter on death.
- **Switching classes sets your ultimate back 50–100% `TUNE` on cooldown** (toward the just-used
  side, never reducing the cooldown), so players cannot build up a charge and then switch classes
  next life. Marked "Needs work" in the source (class switching mid-match is itself undescribed;
  in the MVP the class is fixed for the match, so this rule is **post-MVP**).
- The ultimate is available from the start as a charging bar and upgrades to **Ultimate Plus** at
  higher levels (**MVP-if-time**; level thresholds `TUNE`).

| Class    | Ultimate                  | Description                                                                                                                                                                                                                                                                                                                                                                                          | Status       |
| -------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Magus    | Death Ray (working title) | A Kamehameha. Very long distance. Lasts N seconds.                                                                                                                                                                                                                                                                                                                                                   | **MVP**      |
| Magus    | Nova                      | Sends out a shockwave that stuns enemies caught in it, with minor knock-back. At its largest point it collapses inward, pulling enemies toward you for N seconds, before a larger explosion knocks them back and inflicts concussion. The closer enemies are when the explosion hits, the more damage Nova does. Enemies within X metres who are looking at you are blinded by the second explosion. | **MVP**      |
| Sentinel | Berserk                   | Suddenly grow in size, power, speed, and durability (Hulk / Cú Chulainn). Lasts N seconds.                                                                                                                                                                                                                                                                                                           | **MVP**      |
| Sentinel | Meteor Fall               | Leap into the air and come down hard: massive AoE damage, stun, etc. (Bacchus).                                                                                                                                                                                                                                                                                                                      | **MVP**      |
| Assault  | Fury                      | Imbue yourself with the light of [god name]. Attack speed is over-maxed (N00%) for N seconds. Press [button] to dash instantly in any direction (joystick or WASD to guide). Attacks do Nx damage during Fury and apply knock-back.                                                                                                                                                                  | **MVP**      |
| Flying   | Firestorm                 | An AoE attack that sets alight the land beneath you. Higher up means a wider area and less damage (up to X max height); closer to the ground means a smaller area and higher damage. Basic damage fall-off, like shotgun birdshot but larger.                                                                                                                                                        | **post-MVP** |

Magus and Sentinel each have two ultimates listed and Assault one. With one ultimate per class
in the MVP, the second is a loadout choice (`08-loadout.md`: "changing abilities or ultimate
resets cooldown"), which the source supports ("Loadout can be adjusted in game"). The god
invoked by Fury, the Death Ray's final name and Fury's dash button are naming to-dos
(`12-open-questions.md`).

## Ability progression (no item shop)

Ability progression replaces item-buying entirely. **During the MVP, ability upgrades beyond
basic scaling with level are on hold** (yellow in the game doc; also the requirements doc's
"simple XP-based scaling").

| Rule                                                                                                                                                                         | Status                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Each class has 3 abilities plus an ultimate. Abilities start weak and **scale with level**.                                                                                  | **MVP**                                                                      |
| **Ability tree**, like Battle for Middle-earth: levels unlock upgrade tiers, only N upgrades can be held within a tier, and forgetting an upgrade to open a slot has a cost. | **post-MVP** (`[STATUS: idea-pending]`)                                      |
| The ultimate is available from the start as a charging bar and upgrades to Ultimate Plus at higher levels.                                                                   | **MVP-if-time**                                                              |
| The loadout can be configured pre-game, with an **auto-build** option. Players can override the auto-build mid-game if needed. Loadout can be adjusted in game.              | **MVP** (pre-game + auto-build); in-game adjustment **MVP-if-time**          |
| **Changing abilities or ultimate resets cooldown**, needing full recharge before use.                                                                                        | **MVP** (whenever in-game change exists)                                     |
| Upgrading **"blessings"** (abilities) requires visiting a BuffTower or the Stronghold.                                                                                       | **post-MVP** with the tree; the word "blessings" is `[STATUS: idea-pending]` |

The requirements doc writes "abilities (blessings?)", so "blessing" is the candidate in-fiction
name for an ability upgrade, not yet adopted (`../suggestions/naming.md`).

## Aether: the ability resource

From the requirements doc: **aether** is "equivalent to mana; currency for ability use after
cooldown is done". So an ability needs two things to fire: its **cooldown** has elapsed **and**
the Legend has enough **aether** to pay its cost. Both are per-ability content values. Aether
regenerates (rate `TUNE`, not in the sources; `Recommendation:` slow passive regen plus a
larger refill at the Stronghold, mirroring the "visit a buff tower or the stronghold" rule for
upgrades). Status: **MVP**.

The ultimate uses a **charge meter** instead (kills, assists, objective damage), not aether.

## XP-based scaling (MVP)

The requirements doc's MVP line: "simple XP-based scaling on abilities (blessings?), health, and
aether". What scales with level in the MVP:

| Stat      | Scales how (all curves `TUNE`, in content)                             |
| --------- | ---------------------------------------------------------------------- |
| Abilities | Potency/duration per level from the ability definition's scaling table |
| Health    | Max health per level from the class definition                         |
| Aether    | Max aether (and optionally regen) per level from the class definition  |

XP sources named in the sources: kills, capture-point checkpoints (small/medium/greater
individual XP shared with a damage bias), mini-boss kills (permanent team buff + "a large amount
of ability XP"), corner-camp boss kills (team XP), the central boss kill (whole-team XP). Minions
have their own two-kill level-up (`02-entities-and-units.md`). Level thresholds are a table in
content; nothing is bought.

## Engineering notes

- `packages/core/src/abilities/`: `Ability` interface, `AbilityRuntime` (cooldown + aether
  bookkeeping), `AbilityEffect` strategies, `AbilityRegistry`. Definitions in
  `content/abilities/<ability-id>.ts` with `cost`, `cooldownTicks`, `scaling` per level and a
  `varieties` map. `AbilitySystem` runs after `AiSystem` and before `MovementSystem`.
- Single place of change (the requirements doc's own test: "adding abilities, changing
  abilities … adding restrictions to abilities … should all be extremely simple"): a new ability
  is one `AbilityEffect` class (only if its effect is new), one content entry and one registry
  line. A new variety is content only. A restriction (class, level, zone) is a predicate in the
  definition evaluated by `AbilityRuntime`.
- Combos are `GameEvents` listeners (`ability-cast` with position and team) in a `ComboRule`
  registry, not code inside either ability.
- `ProgressionSystem` owns XP, levels and the ultimate meter; the ability tree, when it comes, is
  a new `Progression` sub-component plus content, with the `BuffTower`/`Stronghold` interaction
  hook from `03-structures-and-defenses.md`.
- Invariants: aether within [0, max]; an ability never fires while on cooldown or unaffordable;
  the ultimate meter never increases passively (a `tick-completed` listener can assert it).

## Related

- [Classes and sub-classes](01-classes-and-subclasses.md)
- [Weapons and artifacts](07-weapons-and-artifacts.md)
- [Loadout](08-loadout.md)
- [Objectives, capture points and bosses](04-objectives-capture-points-and-bosses.md)
- [Open questions](12-open-questions.md)
- [Architecture: abilities, weapons and loadouts](../../architecture/05-abilities-weapons-and-loadouts.md)
- [Suggestions: more abilities](../suggestions/more-abilities.md)
- [Verbatim source: Abilities, Ultimate Abilities, Ability Progression](../source/game-project-eternalus-v2.md)
