---
title: Structures and defences
description: The team buildings (SpawnerTower, BuffTower, Stronghold), what destroying each does, walls, gates, the buff-tower shield math, turrets, anti-air and the form-change hooks; read it before working on structure content, the StructureSystem or the damage pipeline.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [reference, game-design, structures, walls, gates, turrets]
paths: ['packages/core/src/content/structures/**']
related:
  - 'docs/reference/game-design/02-entities-and-units.md'
  - 'docs/reference/game-design/04-objectives-capture-points-and-bosses.md'
  - 'docs/architecture/07-structures-obstacles-and-destructibles.md'
---

# Structures and defences

**Purpose.** Read this when you work on anything static that has health: the three team
buildings, walls, gates, turrets, and the rules for how they protect each other. The buff-tower
shield math in particular is the one piece of structure logic that every other rule (wall
breakability, gate breakability, "destroying a tower weakens the capital") depends on.
Capture points and camps are zones and neutral spawners; they are in
`04-objectives-capture-points-and-bosses.md`.

## Vocabulary

The game doc's original notes say capital, mob spawn and buff building; the team meeting says
stronghold, spawner tower and buff tower. They mean the same things. Code names are fixed:

| Source names                                                       | Code name      | Line                         |
| ------------------------------------------------------------------ | -------------- | ---------------------------- |
| Mob spawn, spawner tower                                           | `SpawnerTower` | Front line, 1 per lane       |
| Buff/Debuff, buff building, buff/debuff tower (themed name wanted) | `BuffTower`    | Second line, 1 per lane      |
| Capital, stronghold                                                | `Stronghold`   | Primary building, 1 per team |
| Wall, wall chunk, wall segment                                     | `WallSegment`  | Around the Stronghold        |
| Gate                                                               | `Gate`         | In the wall                  |
| Turret                                                             | `Turret`       | On the wall                  |

The MVP has 3 lanes with 1 SpawnerTower and 1 BuffTower per lane per team, a wall around each
Stronghold and one Stronghold per team (requirements doc). All of this is **MVP**.

## Buildings

| Building     | Location                 | What it does                                                                                                                                                                                                                    | Defence                                                                                                                                                                                 | Form change available                                       |
| ------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| SpawnerTower | Front line               | Spawns groups of light mobs that travel together toward the nearest objective in their lane                                                                                                                                     | Ranged and melee self-defence; light mob guards (do not leave the tower's perimeter; respawn every 2 minutes `TUNE`)                                                                    | Ascendance — **post-MVP**, needs-planning                   |
| BuffTower    | Second line of buildings | Applies team-wide buffs; buffs mobs; spawns light and medium mob swarms; debuffs nearby enemies (increases effects of debuffs, reduces enemy health and damage by 10% `TUNE` each); shields allied structures (see shield math) | Debuff aura and ranged self-defence; numerous medium mob guards (do not leave the tower's perimeter; respawn every 2 minutes `TUNE`)                                                    | Enchantment (rename pending) — **post-MVP**, needs-planning |
| Stronghold   | Primary building         | Applies team buffs; spawns mob groups (light swarms and heavy mobs); holds the summoner (to be defined); its destruction ends the game                                                                                          | Destructible walls; guarded by ranged and melee mobs (do not leave the perimeter; respawn every 2 minutes `TUNE`); debuffs nearby enemies and buffs nearby allies; has turrets on walls | Ascendance and Enchantment — **post-MVP**, needs-planning   |

### What destroying each one does

| Destroyed    | Effect (game doc)                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SpawnerTower | "Reduces the capital's guards and weakens its walls." Also: the enemy minions on that lane get the **enraged** buff (`02-entities-and-units.md`), so the lane gets harder, not easier.                                               |
| BuffTower    | "Removes the capital's buff and debuff aura." Its shield bar disappears from every allied structure it was protecting (see shield math). Once at least 2 BuffTowers are down, the walls and gates become breakable. Enraged applies. |
| Stronghold   | Ends the game; the other team wins (`04-objectives-capture-points-and-bosses.md`).                                                                                                                                                   |

"Weakens its walls" and "reduces the capital's guards" for a destroyed SpawnerTower are stated
without numbers. The Walls section says "all towers provide the wall extra HP" while the shield
math section counts only BuffTowers; the two readings are reconciled in the open questions
(`12-open-questions.md`). Until decided, the shield math below (BuffTowers only) is what the
requirements catalogue specifies, and a SpawnerTower's contribution to the wall is a content
value that defaults to zero.

## Walls

Status: **MVP** (requirements doc: "wall around stronghold per team").

- Strongholds have walls. At the start of the game the towers give the wall extra HP, and
  BuffTowers give it an aura that empowers allies and damages enemies.
- As towers fall, the health of the wall falls too, proportional to the number of allied towers
  razed.
- **Walls are unbreakable until at least 2 `TUNE` allied BuffTowers are down.** Before then no
  damage applies.
- Once breakable, **Sentinels and heavy minions** can damage them. Other units do little damage
  to walls or other structures (Gates section).
- **Sentinel sprint-through rule** (game doc, Walls): a Sentinel at full speed can sprint
  through a Stronghold wall. It takes up to **1 minute `TUNE`** of running straight to reach
  full speed. Doing so costs the Sentinel **50% `TUNE` of its total health** (only for
  Stronghold walls; other structures "are a different story") and deals **50% `TUNE` of its
  total damage** to the wall segment(s) contacted. Source example: if the wall has 10,000
  health, the Sentinel's full sprint does 5,000 damage.

Wall HP interacts with the shield math: walls get the largest per-tower bar (+200% `TUNE` per
living BuffTower), which is why they are effectively unbreakable early and why the breakability
switch is tied to BuffTower count rather than to hit points.

## Gates

Status: **MVP** (a wall needs an opening for hordes; the requirements doc's "wall around
stronghold" implies it).

- Gates open and close **slowly** to let allied hordes and allied Legends through.
- If an enemy tries to go through an open gate that has not been destroyed, **the gate defends
  itself with fire**.
- Like walls, gates are unbreakable until at least 2 `TUNE` of the defending team's BuffTowers
  have been destroyed.
- Once breakable, all units may attack the gate. **Heavy minions, Sentinels and Magus damage
  abilities do the most damage to gates.** Other units do little damage to gates or other
  structures.

Closed gates are solid for pathing (they stamp the nav cost grid) and open gates are passable
for allies only; the fire defence is a damage-over-time aura keyed on `Team`.

## Buff-tower shield math

Status: **MVP** (it is the structure-health model; the requirements catalogue lists it).

Per living allied BuffTower, each structure gets an **additional health bar** on top of its base
health (game doc, "How Buff/Debuff Towers … Buff Walls and Friendly Structures"):

| Protected structure | Extra health per living BuffTower `TUNE` |
| ------------------- | ---------------------------------------- |
| SpawnerTower        | +125% of base health                     |
| Other BuffTowers    | +150% of base health                     |
| WallSegment         | +200% of base health                     |

Rules:

1. The percentage is computed on the **base** health, once per tower, and the bars are added:
   "150% × base, not (150% × base) × 3".
2. Damage is taken from the additional bars first, "rather than the tower itself (acting like a
   shield)". Only when every bar is gone does base health drop.
3. When a BuffTower dies its bar is removed from every structure it was protecting. Because the
   bars sit on top of base health, "the destruction of one tower [cannot destroy] another tower
   that had low health already": the base health is untouched by the loss of a bar.
4. The bars can be shown as separate colours on the health bar, **one colour per living
   BuffTower**.

Worked example from the source (a structure with the 150% rate and 3 living BuffTowers, which is
the MVP count of one BuffTower per lane):

```text
base health            = 1000
bar per BuffTower      = 1000 × 1.5 = 1500
shield pool (3 towers) = 1500 + 1500 + 1500 = 4500   ← the source's "it would have 4500 health"
effective health       = 1000 base + 4500 shields = 5500
```

The source sentence "it would have 4500 health" names the shield pool, not the total; the
following paragraph makes the base additive ("if a structure had 1000 health, it gets an
additional N health on top of it"). The discrepancy note is in `../suggestions/discrepancies.md`
so nobody implements 4500 as the total.

## Turrets

Status: **MVP** (the Stronghold "has turrets on walls").

- Wall turrets **auto-fire at enemies within range** by default. Turret positions come from the
  map draft's wall circles in the source; in our model they are generated with the wall
  (`05-map.md`).
- A Legend can enter a turret for **manual firing** with **P** ("press p to assume control";
  auto-fire turns off) and leave with **P** again ("press p to exit"; auto-fire resumes). The
  source says "Warrior-class legends" can enter turrets; the requirements list does not restrict
  it, so which classes may enter is a content flag per class (open question).
- Turrets **launch bolts** (large crossbows) at any enemy in range. Fire rate `TUNE`: **1 bolt
  per 10 seconds on heavy ammo, 1 bolt per 5 seconds on default ammo**.
- On auto-fire, **ammo switches automatically** depending on the target: heavy for Sentinels and
  heavy minions, default for other units. On manual control the player presses **T** to switch
  projectile type.
- On auto-fire, the turret uses **predictive fire**: "minion x going in direction y at velocity
  v; fire at destination".
- "Ammo specifics can change (should be an easy code change; couple lines maybe)": ammo types
  are content entries, and the auto-selection rule is a `TargetingStrategy`, so a new ammo type
  is one content line and no system change.

Key bindings (P, T) are defaults only; every binding is configurable (`09-controls.md`).

## Anti-air defence

"Will be added later. TBD." — **post-MVP** (orange). The open question "Anti-air buildings: keep
or cut?" is **removed** from the question list (red) because the decision is simply "later". The
extension point is the Flying class (`01-classes-and-subclasses.md`): anti-air is a turret or
structure whose `TargetingStrategy` filters on an altitude component that ground units do not
have.

## Form change at buildings

The Buildings table lists a "Form change available" column: Ascendance at SpawnerTowers,
Enchantment (rename pending) at BuffTowers, both at the Stronghold. The whole column and the
Ascendance/Enchantment rows of the Form change table are yellow (**needs-planning**), so form
change is **post-MVP** (brief decision D12). The design as written: "Form change works like
entering a vehicle: the character morphs into a greater stature, and their abilities, attacks,
and stats change. It is configurable, possibly class-dependent, and can only be done at specific
locations."

The hook the architecture keeps: a structure definition may list `interactions` (enter turret,
upgrade blessings, change form); each is a Strategy resolved from a registry, so form change
lands as one new interaction class plus content, with no change to structures.

## Engineering notes

- Taxonomy: `Entity → Structure (abstract: static; Health with layered shield bars;
Collider(polygon footprint); Team) → Stronghold | SpawnerTower | BuffTower | WallSegment |
Gate | Turret | Camp | Cathedral`. Definitions live in `packages/core/src/content/structures/`.
- `StructureSystem` owns the shield math, breakability, gates and turrets; it reacts to
  `GameEvents` (`structure-destroyed`) rather than being called by `CombatSystem`. The
  `DamagePipeline` order is source → modifiers → shields → health, so "shields absorb first" is
  a pipeline stage, not a special case in each structure.
- Single place of change: the shield rates, the "2 BuffTowers down" threshold, respawn timers,
  fire rates and ammo types are content values; the number of towers per lane is `GameConfig`
  (`spawnTowersPerLane`, `buffTowersPerLane`), and the map generator places them
  (`05-map.md`).
- Invariants worth running every tick (`../../architecture/15-diagnostics-and-runtime-testing.md`):
  a structure's shield-bar count equals the number of living allied BuffTowers; no damage is
  applied to an unbreakable wall or gate; base health never drops while a shield bar remains.

## Related

- [Entities and units](02-entities-and-units.md)
- [Objectives, capture points and bosses](04-objectives-capture-points-and-bosses.md)
- [Map](05-map.md)
- [Controls](09-controls.md)
- [Open questions](12-open-questions.md)
- [Architecture: structures, obstacles and destructibles](../../architecture/07-structures-obstacles-and-destructibles.md)
- [Architecture: physics](../../architecture/10-physics.md)
- [Suggestions: discrepancies](../suggestions/discrepancies.md)
- [Verbatim source: Buildings, Stronghold Defenses](../source/game-project-eternalus-v2.md)
