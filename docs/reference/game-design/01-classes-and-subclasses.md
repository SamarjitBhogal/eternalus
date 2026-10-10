---
title: Classes and sub-classes
description: The four Legend classes, their post-MVP sub-classes, class default actions, passives, pick-up/throw interactives, character sizes and movement profiles; read it before designing or implementing anything Legend-specific.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-10
tags: [reference, game-design, legends, classes]
paths: ['packages/core/src/content/legends/**', 'packages/core/src/entities/**']
related:
  - 'docs/reference/game-design/02-entities-and-units.md'
  - 'docs/reference/game-design/06-abilities-and-progression.md'
  - 'docs/architecture/04-entity-architecture.md'
---

# Classes and sub-classes

**Purpose.** Read this when you touch anything that differs by Legend class: the class
definitions in content, the concrete `Legend` subclasses, movement tuning, pick-up rules or the
class-specific default actions and passives. Everything here is the vision from the game doc;
scope markers say what the MVP builds. Abilities, ultimates and weapons have their own docs.

## The four classes

Players pick one of four classes. The MVP ships three; the Flying class is **post-MVP** (orange
in the game doc; brief decision D12). The game doc's later tables use the shorthand **Tank**
(Sentinel), **Mage** (Magus) and **Air** (Flying); these docs use the class names.

| Class                      | Code name  | Build and movement                                                  | Weapon bias   | Damage focus                       | Ability stats               | Other                                                          | Status       |
| -------------------------- | ---------- | ------------------------------------------------------------------- | ------------- | ---------------------------------- | --------------------------- | -------------------------------------------------------------- | ------------ |
| Warrior (formerly Assault) | `Warrior`  | Lighter, lower health, faster                                       | Light weapons | Split between magic and physical   | Better light ability stats  | —                                                              | **MVP**      |
| Sentinel                   | `Sentinel` | Heavy, slower (low base speed; see movement profile), more powerful | Heavy weapons | Physical                           | Better heavy ability stats  | —                                                              | **MVP**      |
| Magus                      | `Magus`    | Magical; floats or walks                                            | Staves        | Magic, with a higher ability focus | Better medium ability stats | Applies buffs or debuffs; can revive allies (if not destroyed) | **MVP**      |
| Flying (rename pending)    | `[Flying]` | Air-based; moves primarily in the air, like a jet or helicopter     | —             | Ability damage and range           | —                           | Can melee physically if desired, but it is risky               | **post-MVP** |

Notes:

- "Warrior" and "Flying" are placeholders. The requirements doc spells the flying class "arial"
  and also asks for a new name. The code name stays stable; the display name lives in content, so
  a rename is a class rename plus its imports and nothing else (requirements doc: "should be very
  easy").
- The Flying class row is reserved in the entity taxonomy (`[Flying]`) so the extension point is
  explicit, but no code, content or abilities are built for it in the MVP. Its abilities (Eagle
  Eye, Grasp, Firestorm) and sub-classes are therefore **post-MVP** by derivation even though the
  PDF did not highlight those rows.
- Each MVP class's abilities and ultimates, including the ones the owner approved on 2026-10-10
  (DEC-11: Warrior Hamstring, Fan of Sorrows, Eclipse; Sentinel Shield Wall, Sunder, Colossus
  Roar, Avalanche; Magus Sanctuary, Aether Lance, Last Rites), are listed in
  `06-abilities-and-progression.md`. They come on top of each class's game-doc kit, which stays
  MVP, and the class's abilities and ultimates are a pool: "a player chooses 3 abilities and 1
  ultimate from the set of abilities and ultimates that are available to their class when
  selecting/creating their loadout" (owner, confirmed in chat 2026-10-10). So the "3 abilities +
  ultimate" slots of the `Legend` contract below stand.

## Sub-classes (names pending) — post-MVP

Each class has sub-classes. They are **post-MVP** (brief decision D11): they will be modelled as
data-driven _specializations_ (`LegendSpecDefinition` in content) consumed by the class, with an
optional subclass only when behaviour is unique.

| Class    | Sub-class   | Focus                                                               | Status       |
| -------- | ----------- | ------------------------------------------------------------------- | ------------ |
| Warrior  | Assassin    | Lighter, higher burst damage                                        | **post-MVP** |
| Warrior  | Knight      | Balanced weight, balanced damage                                    | **post-MVP** |
| Warrior  | Paladin     | Heavier, higher sustain damage                                      | **post-MVP** |
| Sentinel | Colossus    | Melee focus, extra resistance                                       | **post-MVP** |
| Sentinel | TBD         | TBD                                                                 | **post-MVP** |
| Magus    | Necromancer | Debuff focus; Revive nearby fallen entities to fight for their team | **post-MVP** |
| Magus    | Druid       | Buff focus                                                          | **post-MVP** |
| Magus    | Mage        | Self-focus                                                          | **post-MVP** |
| Flying   | Hover       | Better health, higher sustain damage, slower                        | **post-MVP** |
| Flying   | Strafe      | Lower health, higher burst damage, faster                           | **post-MVP** |

**Open question** (OQ in `12-open-questions.md`): should each class's sub-classes follow a
generic damage / balance / support split, or mix it up? The current list is mixed: Warrior's
three are a weight/damage-curve spread, Magus's three are a debuff/buff/self split, Sentinel has
one named entry.

Note on the Necromancer: "Revive nearby fallen entities to fight for their team" implies a unit
changing team after death. This is one reason team is a property/component on units rather than
a class (brief decision D10).

## Class default actions

Default actions are always available; they are not loadout slots.

| Class | Action | Description                                                                                                      | Status  |
| ----- | ------ | ---------------------------------------------------------------------------------------------------------------- | ------- |
| Magus | Revive | Revives recently killed allies (if still intact). Recently revived allies cannot be revived again for N seconds. | **MVP** |

The Classes table adds the condition "can revive allies (if not destroyed)". What counts as
"intact" versus "destroyed" (for example, a Grasp-parry kill "with no revive") is not defined in
the source; `Recommendation:` model it as a `RemovalCause` on death so the rule is data, not a
special case.

## Passives

| Class    | Name                    | Description                                                                                                                                         | Status  |
| -------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Sentinel | Wrecking Run            | While holding sprint, speed gradually increases to a max of N m/s.                                                                                  | **MVP** |
| Magus    | Studious (name pending) | Abilities last X% longer and are N% more potent. Your ultimate fills faster.                                                                        | **MVP** |
| Magus    | Necromancy              | The lower your health, the stronger you become. All undead abilities are amplified. Revived allies have increased power and negation for N seconds. | **MVP** |

The loadout has one "passive ability or aura" slot (see `08-loadout.md`), so Magus chooses
between Studious and Necromancy. Warrior has no passive in the source. Wrecking Run is the
in-fiction name for the Sentinel movement profile below.

## Default interactives: pick up and throw

All units can pick up and throw objects, and the interaction looks different for each class. The
heavier the object, the slower you move while holding it. Some things are too heavy for certain
classes: a Sentinel can pick up a wall chunk; an Warrior cannot.

| Class    | Name     | Description                                                                                                                                                                                                                        | Weight max           | Status          |
| -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | --------------- |
| Magus    | Levitate | The selected object floats and can be pulled toward the user or thrown away.                                                                                                                                                       | Medium               | **MVP-if-time** |
| Sentinel | Grab     | Grabs the object and can hold or throw it. Picking up enemies applies the "crushed" debuff.                                                                                                                                        | High                 | **MVP-if-time** |
| Warrior  | Pick Up  | Picks up the object. Try picking up an enemy Warrior from behind (suplex for a break-neck finisher).                                                                                                                               | Low                  | **MVP-if-time** |
| Flying   | Grasp    | Target an object, mob, or player; swoop down, grab it, and take off with it. Picking up enemies stuns them briefly (they can soon fight you off). Has a cooldown. Careful trying this on a heavy Sentinel who is paying attention. | Depends on sub-class | **post-MVP**    |

Rules that go with them (game doc):

- Parrying, for most troops, is simply a deflect. A heavy Sentinel parries a Grasp by grabbing
  the aerial unit's limbs and slamming its body into the ground. The aerial unit explodes on
  contact, with no revive (like a fatal sniper headshot). **post-MVP** (needs the Flying class).
- Why use Grasp? Because gravity exists in the game. If your team's heavy Sentinel is at full
  health, try dropping him from a height onto the enemy. **post-MVP**.
- Felled trees "stay felled and can be picked up by strong enough characters, depending on tree
  size" (see `05-map.md`), which is the same weight-class rule applied to obstacles.

Scope note: the requirements doc's MVP list does not mention pick-up/throw, and the game doc does
not exclude it, so it is marked **MVP-if-time**. The architecture keeps it cheap: a `Carry`
component on the carrier, a `Carryable` flag on obstacles, and a `PickUpStrategy` per class.

## Character sizes

The product owner's "headcanon" (Additional Items section): each class has a different character
size, and sizes line up with minion weight classes.

| Class    | Size relative to minions                                         | Reference height `TUNE` |
| -------- | ---------------------------------------------------------------- | ----------------------- |
| Warrior  | Smallest; a little bigger than a light minion, ~ a medium minion | ~7 ft (Master Chief)    |
| Magus    | Quite a bit larger; ~ a heavy minion                             | ~10 ft (Hades, Smite)   |
| Sentinel | Very large                                                       | ~15 ft (an elephant)    |

Size is the `Collider` radius on the unit (see `02-entities-and-units.md`); the heights are
flavour that the art direction and hit-box tuning should agree on.

## Movement profile (speed, maxSpeed, acceleration, mass)

The game doc asks for four movement metrics on every entity besides health: **speed** (base),
**maxSpeed**, **acceleration** and a **weight or mass** field for knockback and momentum. The
class profiles it describes:

| Class    | Base speed | maxSpeed  | Acceleration | Mass | Notes from the source                                                                                                                         |
| -------- | ---------- | --------- | ------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Warrior  | high       | —         | —            | low  | "Lighter, faster"; would benefit most from mounts (post-MVP) because the map is huge.                                                         |
| Magus    | —          | —         | —            | —    | "floats or walks"; no numbers given.                                                                                                          |
| Sentinel | low        | very high | slow         | high | "one of the highest maxSpeed stats but their acceleration is just slow"; needs a lot of runway; can break through harder walls at high speed. |

Sentinel specifics from the Walls section (`03-structures-and-defenses.md` has the full rule):
"sentinels can take up to 1 minute `TUNE` of running straight to get to full speed"; sprinting
through a Stronghold wall costs 50% `TUNE` of total health and does 50% `TUNE` of the sentinel's
total damage to the wall segment(s) contacted. All values are `TUNE` and the "—" cells are simply
unspecified in the source; `Recommendation:` fill them in `content/legends/*` with the class
table's qualitative ordering (Warrior fastest base, Sentinel highest max) and let balancing move
them.

Mounts (horse-like entities that let Warrior-type characters cross the map quickly, with
different Light and Dark skins) are **post-MVP** (orange). The Sentinel does not need one: it
crosses the map on foot by reaching maxSpeed.

## Engineering notes

- Taxonomy (brief decision D4, ADR 0006): `Entity → Unit → Legend → Warrior | Sentinel | Magus |
[Flying]`. `Legend` is abstract and owns the shared contract (3 abilities + ultimate, 2 gadget
  slots for artifacts, `Loadout`, `Progression`, aether); the concrete classes are thin and hold
  only what is truly class-specific in behaviour (for example Magus's Revive default action).
  Everything numeric and every display name is a `LegendDefinition` in
  `packages/core/src/content/legends/<class-id>.ts`.
- Single place of change (OCP): adding a class = one concrete `Legend` subclass, one content
  entry, one `EntityRegistry` line. Renaming = rename the class and its imports; the display name
  is content. Adding a sub-class later = one `LegendSpecDefinition` entry, no new class unless
  its behaviour is unique (D11).
- Movement is a `Movement` component (`speed`, `maxSpeed`, `acceleration`, `mass`) read by
  `MovementSystem` and the physics `Kinematics`; class differences are data, not subclasses of
  the system (Strategy for anything that is genuinely different, such as a floating Magus).
- Pick-up/throw is a `Carry` component plus a `PickUpStrategy` per class; weight limits are
  content values compared against the carried entity's `mass`.
- The Flying class, when it comes, must not change the ground classes: it adds a `[Flying]`
  subclass, an altitude field or component, and its own strategies. Anti-air and Grasp parry
  rules hang off that extension point (`../../architecture/17-extension-recipes.md`).

## Related

- [Overview and status legend](00-overview-and-status-legend.md)
- [Entities and units](02-entities-and-units.md)
- [Abilities and progression](06-abilities-and-progression.md)
- [Weapons and artifacts](07-weapons-and-artifacts.md)
- [Loadout](08-loadout.md)
- [Open questions](12-open-questions.md)
- [Architecture: entity architecture](../../architecture/04-entity-architecture.md)
- [Architecture: physics](../../architecture/10-physics.md)
- [Verbatim source: Classes, Sub-classes, Abilities and Interactions, Entity Class Specifics](../source/game-project-eternalus-v2.md)
