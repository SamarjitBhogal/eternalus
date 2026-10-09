---
title: Balancing suggestions
description: Proposed tuning values, formulas and balance knobs for the MVP (hordes, minions, structures, turrets, capture points, bosses, abilities, XP, the Eternal form), and how to test balance with headless bot-vs-bot simulations.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-06
tags: [reference, suggestions, balancing, content, testing]
paths: ['packages/core/src/content/**', 'packages/core/src/config/**']
related:
  - 'docs/reference/game-design/02-entities-and-units.md'
  - 'docs/reference/game-design/03-structures-and-defenses.md'
  - 'docs/reference/game-design/06-abilities-and-progression.md'
  - 'docs/research/game-architecture-and-performance-research.md'
  - 'docs/research/persistence-input-diagnostics-research.md'
---

# Balancing suggestions

**Purpose.** Read this when you need a starting number, a formula shape or a knob name for anything tunable in the MVP, or when you are setting up the headless simulations that will tell us whether the numbers work. Every value here is a proposal: numbers quoted from the requirements doc or the game doc carry `TUNE` and their source; everything else is `Recommendation:` and will be replaced by what the soak simulations say. None of these numbers may be typed into gameplay code; they live in `packages/core/src/content/` (tuning) or `packages/core/src/config/` (structure), looked up by kebab-case ID (`AGENTS.md` rule 11).

## Ground rules

- **Units.** World distance in metres (the game doc says "N m/s"), time in seconds in content; the content loader converts seconds to ticks with `tickRate` from `GameConfig` (30 ticks/s, D9) so a tick-rate change never touches a definition. `Recommendation:` a helper `secondsToTicks()` in `core/utils/` is the only place that conversion happens.
- **Every number has one home.** Structural counts (`numLanes`, `spawnTowersPerLane`, `buffTowersPerLane`, `campsPerSide`, unit caps) are `GameConfig`; magnitudes, durations, costs and curves are content definitions. Rules that mention a count ("2 buff towers") are written as fractions of the config count so a config change never invalidates a rule.
- **Percentages are additive on base unless stated.** The game doc's shield rule is explicit: three bars of 150% each are `3 × 1.5 × base`, not `1.5³ × base`.
- **Reference values** (next section) exist only so the rest of the numbers are readable relative to each other. The soak metrics decide the final values.

## Reference anchor values (level 1)

`Recommendation:` all values. Collider radii follow the game doc's size headcanon (Warrior about 7 ft, Magus about 10 ft, Sentinel about 15 ft; Warrior ≈ a medium minion, Magus ≈ a heavy minion).

| Legend   | Max health | Max aether | Base speed / sprint max (m/s) | Acceleration (m/s²) | Basic attack (damage / interval)       | Mass | Radius (m) |
| -------- | ---------- | ---------- | ----------------------------- | ------------------- | -------------------------------------- | ---- | ---------- |
| Warrior  | 650        | 100        | 5.0 / 6.5                     | 12                  | 45 physical / 0.7 s (64 DPS)           | 80   | 0.5        |
| Sentinel | 1100       | 80         | 3.5 / 9.0 (Wrecking Run ramp) | 3 (normal)          | 90 physical / 1.2 s (75 DPS)           | 400  | 1.2        |
| Magus    | 550        | 140        | 4.0 / 5.0                     | 8                   | 40 magical, 8 m range / 0.9 s (44 DPS) | 120  | 0.8        |

The Sentinel's numbers encode the game doc's note that its _base_ speed is low but its _max_ speed is one of the highest and only its acceleration is slow: normal acceleration (3 m/s²) gives responsive movement, while the Wrecking Run sprint ramp (see "Sentinel wall sprint") is a separate, much slower passive-specific value.

| Minion tier (display name proposal) | Max health | Damage / interval | Speed (m/s) | Mass | Radius (m) | XP on kill | Horde size (TUNE, requirements) |
| ----------------------------------- | ---------- | ----------------- | ----------- | ---- | ---------- | ---------- | ------------------------------- |
| Light (Skirmisher)                  | 150        | 12 / 1.0 s        | 3.5         | 40   | 0.4        | 20         | 16                              |
| Medium (Footman)                    | 400        | 28 / 1.2 s        | 3.2         | 90   | 0.5        | 45         | 8                               |
| Heavy (Goliath)                     | 1200       | 70 / 1.6 s        | 2.8         | 250  | 0.8        | 120        | 4                               |

Sanity checks: a level-1 Legend kills a light minion in about 2.3 s and a full light horde alone in about 40 s without abilities; a full light horde attacking one Warrior does 192 DPS and kills it in under 4 s, so diving hordes at level 1 must not be viable. Heavy minions deal double damage to breakable walls and gates (see "Structure damage multipliers").

## Horde sizes and spawn cadence — MVP

Sources: `TUNE` horde sizes 16 / 8 / 4 (requirements doc); `TUNE` 48 units at match start from the stronghold as 3 hordes, one per lane; `TUNE` 60 s countdown during which nothing spawns from towers; `TUNE` towers spawn every 1 minute after (requirements doc). The game doc adds that spawner towers spawn light groups, BuffTowers spawn light and medium swarms, and the capital spawns light swarms and heavy mobs; the requirements doc says "towers" only. Which structure spawns what is `discrepancies.md` DISC-10; the recommendation below resolves it by making spawning a per-structure content field (`spawns: [{ hordeId, firstAtSeconds, everySeconds }]`), so the owner's answer is a content edit.

| Option                                                 | Per-minute load (3 lanes)             | Notes                                                                                                                                |
| ------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **A. Tiered cadence (recommended)**                    | 48 light + 12 medium + 1.3 heavy ≈ 61 | Light every 60 s from SpawnerTowers, medium every 120 s from BuffTowers, heavy every 180 s from the Stronghold to the worst-off lane |
| B. Doc-literal: every spawner, every 60 s              | 48 + 24 + 4 = 76                      | Hits the 144 cap by minute 3 if minions survive 2 min; cap logic fires constantly                                                    |
| C. Light only from towers; medium/heavy only on events | 48                                    | Simplest; medium and heavy hordes appear only from camps, checkpoints and structure-loss reinforcements                              |

Recommended spawn table (Option A):

| Source                    | Horde              | Size    | First spawn | Cadence     | Lane                                                                                               |
| ------------------------- | ------------------ | ------- | ----------- | ----------- | -------------------------------------------------------------------------------------------------- |
| Stronghold ("Wellspring") | light × `numLanes` | 16 each | 0 s         | once        | one per lane (the only spawn during the countdown)                                                 |
| SpawnerTower              | light              | 16      | 60 s        | every 60 s  | its lane                                                                                           |
| BuffTower                 | medium             | 8       | 120 s       | every 120 s | its lane                                                                                           |
| Stronghold                | heavy              | 4       | 180 s       | every 180 s | the worst-off lane (most structures lost, then lowest structure health, then furthest pushed back) |

`Recommendation:` a horde spawns one member per tick (16 ticks for a light horde) so a spawn never produces an overlapping blob and the AI setup cost is spread; lanes are offset by 10 ticks. A dead spawner spawns nothing; the lane then relies on Stronghold reinforcements, which is the "harder, not easier" pressure the game doc wants together with the enraged buff.

Unit cap: `maxUnitsPerTeam: 144` (`TUNE`, requirements doc) lives in `GameConfig`. `SpawnSystem` skips a spawn at the cap and emits `spawn-suppressed` (an invariant counts these; more than 5% of attempted spawns suppressed in a soak run means the cadence is too high). At an average minion lifetime of 2 minutes, Option A keeps about 120 units alive per team, under the cap. The requirements doc's own arithmetic (3 lanes × 3 hordes of 16 = 144) is where the cap comes from, so treat it as a ceiling, not a target.

Camps (neutral): `TUNE` 6 forest camps per side between the lanes, inactive until the countdown ends (requirements doc). Camps are lighter nearest a lane and heavier deeper into the Unknown (DISC-42, which declined the Stronghold-to-centre order first proposed here). `Recommendation:` a light camp is 4 light, a medium camp 2 medium + 2 light and a heavy camp 1 heavy + 2 medium; a cleared camp respawns 120 s later; leash radius 6 m; clearing a camp gives the mob XP plus a 50 XP bonus to the clearing Legends. Corner camps (MVP-if-time): the crystal respawns its boss every 300 s after a death (`TUNE`, game doc "every 5 minutes").

## Minion strength-by-distance curve — MVP

Source: "the closer to home, the stronger the minion; strength evens out in the middle, which prevents early rushes" (game doc). `Recommendation:` measure position as `t` = lane progress from the minion's home Stronghold (0) to the enemy Stronghold (1), taken from the lane's integration field (flow-field distance) rather than Euclidean distance, so it follows the bends of MVP lanes (DEC-14) and works unchanged for curved lanes later. Then:

```text
m(t) = clamp(1 + k · (1 − 2t), mMin, mMax)      k = 0.5, mMin = 0.75, mMax = 1.5
```

| t (lane progress) | 0.00 (home) | 0.25 | 0.50 (middle) | 0.75 | 1.00 (enemy home) |
| ----------------- | ----------- | ---- | ------------- | ---- | ----------------- |
| m(t)              | 1.50        | 1.25 | 1.00          | 0.75 | 0.75 (clamped)    |

Apply `m` in the `DamagePipeline` as a modifier (outgoing damage × m, incoming damage ÷ m) instead of rescaling health, so a minion's health bar never jumps as it walks. `HordeSystem` recomputes `t` every 15 ticks per minion; Legends are never affected. Shape options: linear with clamp (recommended: readable, one knob), smoothstep (softer edges), or stepped by lane thirds (1.5 / 1.0 / 0.75; the most legible in play but produces a visible seam). Because the far end is clamped at 0.75 rather than 0.5, an attacking horde is weaker at the enemy walls but not useless.

## Enraged buff on structure loss — MVP

Source: destroying a structure gives the _defending_ team's minions on that lane an "enraged" buff (game doc). `Recommendation:` one stack per lost SpawnerTower or BuffTower on that lane; each stack +15% damage, +10% attack speed, +10% move speed; `maxStacks = spawnTowersPerLane + buffTowersPerLane` (derived from config, 2 in the MVP); permanent for the rest of the match; applies to minions already on the lane and to every later spawn on it. Option: stacks decay after 300 s so a lane that lost everything early is not permanently harder. The status definition is `content/status-effects/enraged.ts` (see the status table in `more-abilities.md`).

Related minion growth (game doc): a minion that kills another minion earns XP and levels up after two kills, buffing nearby friendly minions; a minion that kills a Legend "ascends". `Recommendation:` minion level +1 per 2 kills, max 3, each level +10% health and damage, plus an aura of +5% damage to friendly minions within 4 m; `ascended`: size × 1.25, +50% max health, +25% damage, permanent, does not stack.

## Structure health and shields — MVP

Base health is `Recommendation:`; shield fractions are `TUNE` from the game doc's stronghold-defence notes (125% spawner, 150% other BuffTowers, 200% walls; additive on base; damage drains the bars first; a bar disappears when its BuffTower dies, which "prevents the destruction of one tower from destroying another tower that had low health already").

| Structure      | Base health    | Shield bar per living allied BuffTower (fraction of base) | Effective at start with 3 lanes | Source of the fraction                |
| -------------- | -------------- | --------------------------------------------------------- | ------------------------------- | ------------------------------------- |
| SpawnerTower   | 3,000          | 1.25                                                      | 3,000 + 3 × 3,750 = 14,250      | game doc (125%)                       |
| BuffTower      | 2,500          | 1.50, from each _other_ living BuffTower                  | 2,500 + 2 × 3,750 = 10,000      | game doc (150%); "other" is DISC-22   |
| WallSegment    | 2,000          | 2.00                                                      | 2,000 + 3 × 4,000 = 14,000      | game doc (200%)                       |
| Gate           | 3,000          | 2.00                                                      | 3,000 + 3 × 6,000 = 21,000      | Recommendation ("like walls")         |
| Turret         | 600            | 0                                                         | 600                             | Recommendation                        |
| Stronghold     | 10,000         | 1.00                                                      | 10,000 + 3 × 10,000 = 40,000    | Recommendation                        |
| Cathedral      | indestructible | —                                                         | —                               | Recommendation (it is a capture zone) |
| Corner crystal | unbreakable    | —                                                         | —                               | game doc                              |

Time-to-kill sanity: a level-1 lane trio (about 180 DPS) plus a light horde in contact (192 DPS) takes a fully shielded SpawnerTower down in about 40 s of uninterrupted contact; one Legend alone needs about 220 s. That is heavier than a MOBA outer turret and matches the game doc's intent that lanes are hard until BuffTowers fall. Option B if soaks show stalemates (median match over 30 min): halve the fractions (0.6 / 0.75 / 1.0). Bars drain in a fixed order (lane order of the towers that granted them) so the outcome is deterministic and testable.

Breakability rule for walls and gates: `TUNE` "unbreakable until at least 2 buff/debuff towers of the defending side are destroyed" (game doc). Written as config-safe: breakable when `downBuffTowers ≥ ceil(breakableFraction × totalBuffTowers)` with `breakableFraction = 2/3`. Option: "all but one" (`totalBuffTowers − 1`). Both give 2 for three lanes; they differ at one lane (fraction: the only tower; all-but-one: breakable from the start) and two lanes (fraction: both; all-but-one: one). The fraction form is recommended because walls should never be breakable at match start (DISC-09).

Which towers contribute wall shields (DISC-21): the general note says "all towers provide the wall extra HP", the detailed rule says 200% per BuffTower. `Recommendation:` only BuffTowers grant shield bars; each lost SpawnerTower instead removes 2 of the Stronghold's guards (the doc's "reduces the capital's guards"). Option: a lost SpawnerTower also removes 10% of the wall's _base_ health.

Auras (BuffTower and Stronghold; `TUNE` "reduces enemy health and damage by 10% each", "increases effects of debuffs"; the rest `Recommendation:`): radius 12 m; enemies inside deal 10% less damage, have 10% less max health, and debuffs on them last 25% longer; allies inside deal 10% more damage and regenerate aether 50% faster. The Stronghold's aura scales with `aliveBuffTowers / totalBuffTowers`, so "destroying buff buildings removes the capital's aura" holds at zero and degrades smoothly before that.

Guards (`TUNE` "respawn every 2 minutes", "don't leave the tower's perimeter"; counts are `Recommendation:`): SpawnerTower 4 light, BuffTower 6 medium ("numerous"), Stronghold 6 light ranged + 2 heavy melee, minus 2 light per lost SpawnerTower; leash radius 8 m; respawn 120 s after death.

### Structure damage multipliers

`TUNE` "Heavy Minions, Sentinels, and Magus damage abilities do the most damage to gates. Other units do little damage to gates or other structures" (game doc). `Recommendation:` a `structureDamageMultiplier` per source, looked up by the `DamagePipeline`: Sentinel basic attacks and abilities 1.0, heavy minion 1.0 (2.0 vs breakable walls and gates), Magus damage abilities 1.0, Slam 2.0, turret-mounted bolts 0, everything else 0.3.

## Turrets — MVP (manual control MVP-if-time)

`TUNE` from the game doc: bolts every 10 s on heavy ammo, every 5 s on default ammo; auto-fire picks heavy ammo against Sentinels and heavy minions; predictive aim; ammo specifics must be "a couple of lines" to change. `Recommendation:` the ammo table is `content/structures/turret-ammo.ts`, one entry per ammo, so a change is one entry.

| Ammo    | Damage       | Extra effect     | Interval (TUNE) | Projectile speed | Auto-selected against            |
| ------- | ------------ | ---------------- | --------------- | ---------------- | -------------------------------- |
| default | 150 physical | —                | 5 s             | 30 m/s           | everything else                  |
| heavy   | 500 physical | concussion 1.5 s | 10 s            | 24 m/s           | Sentinels, heavy minions, bosses |

Range 14 m. Targeting (`Recommendation:`, after the published turret rules cited in `../../research/game-architecture-and-performance-research.md#7-game-ai-for-bots`): keep the current target until it dies or leaves range; otherwise prefer a Legend that damaged an allied Legend in the last 3 s, then heavy units, then the nearest enemy. A level-1 Warrior survives about 21 s under one turret and a Sentinel about 22 s under heavy fire, so walking through a gate without minions is a losing trade at level 1. Turret positions are placed by the `MapGenerator` (two per gate, one per wall corner) rather than traced.

## Sentinel wall sprint — MVP

`TUNE` from the game doc: a Sentinel at full sprint speed can sprint through a _breakable_ stronghold wall, taking 50% of its total health as damage and dealing 50% of the segment's health ("if the wall has 10,000 health, the sentinel's full sprint would do 5,000 damage"); reaching full speed can take up to 1 minute of straight running; other structures are "a different story".

`Recommendation:`

- "Full speed" means `speed ≥ 0.95 × sprintMaxSpeed` (a content threshold, so a near-miss is not a coin flip).
- Sprint ramp: 20 s for the MVP map (options: 30 s; 60 s as in the doc). Reason: at a 9 m/s sprint maximum, a 20 s ramp needs about 120 m of straight runway, a 60 s ramp about 360 m, which is more than half of a lane on a map the size of the traced draft. The ramp is `wrecking-run.rampSeconds`, so the doc's value is one edit away once the map size is final.
- Self damage: 50% of _max_ health (a Sentinel under half health dies on the wall; option: 50% of _current_ health, never lethal).
- Segment damage: 50% of the segment's current total health (base plus bars), through the normal `DamagePipeline` so bars drain first.
- Only walls and gates can be breached, and only when breakable. Sprinting into an unbreakable wall: bounce (knockback 3 m, concussion 2 s, 10% self damage). Sprinting into any other structure: no breach, concussion 1.5 s, 10% self damage.
- The breach emits `wall-breached` (an achievement hook, see `mechanics-ideas.md`) and the movement invariant treats the tick of a legal breach as an allowed crossing.

## Capture points: checkpoints, XP tiers and hold buffs — MVP

`TUNE` from the game doc: three checkpoints per capture point; checkpoint 1 spawns multiple medium assist mobs and grants small individual XP, 2 spawns multiple heavy plus some light mobs and grants medium XP, 3 spawns one massive mob ("Balrog-type") and grants greater XP; XP is shared among nearby allies with a bias toward the ally who did the most damage; holding a zone reduces cooldowns and boosts friendlies; holding long enough levels friendly minions on that side; the buff is lost with the zone; a zone with a live mini-boss cannot be captured.

`Recommendation:` the three checkpoints are sequential stages of one capture (interpretation recorded as DISC-11): a team captures checkpoint 1, then 2, then 3, at which point it owns the point. Each stage needs 20 s of uncontested presence; presence of both teams pauses progress; reaching a stage spawns that stage's guards (checkpoint 1: 4 medium; checkpoint 2: 2 heavy + 4 light; checkpoint 3: one Behemoth, a heavy-mob variant with 3,000 health), and the guards must be dead before the next stage counts.

| Checkpoint | Guards spawned            | XP on winning it | Share rule                                                                    |
| ---------- | ------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| 1          | 4 medium                  | 60               | allies within 10 m: `share_i = xp × (0.6 / n + 0.4 × damage_i / totalDamage)` |
| 2          | 2 heavy + 4 light         | 150              | same                                                                          |
| 3          | 1 Behemoth (3,000 health) | 400              | same                                                                          |

Ownership effects (`Recommendation:`, per owned point, team-wide): −5% ability and ultimate cooldowns (so three points give −15%, not −30%) and +3% damage; after 90 s of continuous ownership, friendly minions spawned on that lane get +1 minion level (max 3); all of it ends the moment the point is lost. Recapturing means walking the three stages again from the other side. The Cathedral is the middle point and additionally hosts the gem; outer points host the quarter-mark mini-bosses, during which capture is disabled.

## Mini-boss and Greater Boss relative to Legends — MVP

Express boss stats as multiples of a reference Legend rather than absolute numbers, so retuning Legends or the XP curve never silently detunes bosses. `refHealth(L) = 650 × 1.08^(L − 1)` is the level-L Warrior's max health from the anchor table; the expected level at spawn is a content value.

| Boss                        | Spawn (planned 20-min match) | Expected Legend level | Health                  | Hit damage                                                                | Moves                                                                | Restriction                                                        | Rewards                                                                        |
| --------------------------- | ---------------------------- | --------------------- | ----------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| MiniBoss (outer lanes)      | quarter mark, 300 s          | 4 (≈ 819)             | 10 × refHealth ≈ 8,200  | 0.25 × refHealth ≈ 205 per hit, 1.5 s interval                            | 3 (sweep: cone knockback; leap: zone knockup; roar: concussion aura) | its capture zone; regenerates 5%/s after 10 s with no enemy inside | team-wide permanent +5% damage; 500 XP team-wide; no consumable item (DISC-43) |
| GreaterBoss ("the Eternal") | mid-game, 600 s              | 7 (≈ 1,031)           | 40 × refHealth ≈ 41,000 | 0.45 × refHealth ≈ 465 per heavy move, 2.5 s interval; light moves 0.15 × | 6 (two sweeps, slam, beam, charge, roar)                             | centre zone, radius 25 m                                           | 1,500 XP team-wide; final hit becomes an Eternal                               |

`Recommendation:` bosses take full damage from Legends and 25% from minions, so "it takes multiple players" is enforced by numbers rather than by a rule. The quarter and mid marks come from `plannedMatchSeconds: 1200` in the match timeline; the match itself has no time limit except an optional `maxMatchSeconds: 2700` after which the higher score wins (the game doc already tracks points for captures, structures and kills).

## Aether costs and cooldowns for the 3 + 1 abilities — MVP

The game doc gives each MVP class only two abilities (Warrior: Veil, Blade Runner; Sentinel: Rip & Tear, Slam; Magus: Imbue, Shockwave) and one to two ultimates; the third ability in each row below is the proposal from `more-abilities.md` (DISC-19). Aether: max 100 / 80 / 140 (Warrior / Sentinel / Magus) at level 1, +10 per level; regeneration 2 per second, +50% inside an allied BuffTower or Stronghold aura. Ultimates cost no aether; they charge a 0–100 meter. Cooldowns start at cast. All `Recommendation:`.

| Class    | Ability                            | Cooldown | Aether | Level-1 magnitude                                                                                                                                                          |
| -------- | ---------------------------------- | -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Warrior  | Veil                               | 20 s     | 40     | invisible 5 s; attacking or taking damage ends it                                                                                                                          |
| Warrior  | Blade Runner                       | 12 s     | 35     | dash 8 m in 0.3 s; 120 damage to units in the path; Physical: knockback 2 m + stun 0.5 s at the end; Magical: flame trail 3 s + burn                                       |
| Warrior  | Hamstring (proposed third)         | 9 s      | 25     | thrown blade, 12 m; 80 damage + bleed 3 stacks max                                                                                                                         |
| Warrior  | Fury (ultimate)                    | meter    | 0      | 8 s; attack speed 300%; damage × 1.5 with knockback 1 m; dash 3 m on the dash key, 1 s internal cooldown                                                                   |
| Sentinel | Rip & Tear                         | 10 s     | 30     | 3 m cone; 90 damage + bleed; targets under 30% health take double and are dragged 1.5 m toward you                                                                         |
| Sentinel | Slam                               | 16 s     | 50     | radius 4 m; 150 damage; knockback 3 m; knockup 0.8 s; × 2 against structures and obstacles                                                                                 |
| Sentinel | Shield Wall (proposed third)       | 18 s     | 40     | a 4 m wall obstacle for 6 s, 800 health                                                                                                                                    |
| Sentinel | Berserk (ultimate)                 | meter    | 0      | 12 s; size × 1.3; damage × 1.5; speed +20%; damage taken −30%                                                                                                              |
| Sentinel | Meteor Fall (ultimate)             | meter    | 0      | leap up to 10 m; radius 6 m; 400 damage; stun 1 s                                                                                                                          |
| Magus    | Imbue                              | 20 s     | 45     | 8 s; Damage: +25% damage, +20% attack speed; Support: self +15% / +10%, allies within 6 m +10% / +5%                                                                       |
| Magus    | Shockwave                          | 14 s     | 50     | radius 5 m; 120 magical; knockback 2.5 m; concussion 3 s                                                                                                                   |
| Magus    | Sanctuary (proposed third)         | 22 s     | 60     | zone radius 4 m for 5 s; heals allies 4% max health per second, or (Consecration variety) 40 magical per second to enemies                                                 |
| Magus    | Death Ray / "Judgement" (ultimate) | meter    | 0      | channel 4 s; beam 30 m × 1.5 m; 150 magical per 0.5 s (1,200 total); an opposing lock extends both by up to 4 s                                                            |
| Magus    | Nova (ultimate)                    | meter    | 0      | expand 2 s (stun 0.5 s, knockback 1 m) → pull 1.5 s → burst 300 magical + concussion 3 s, blind 1.5 s for enemies facing you within 6 m; burst damage × 1.5 at point-blank |
| Magus    | Revive (class default action)      | 45 s     | 30     | channel 2 s within 3 m of an intact ally corpse (≤ 15 s old); revived at 40% health; that ally cannot be revived again for 60 s                                            |

Ultimate meter (`TUNE` "kills, assists and objective damage fill your ultimate; it does not fill passively; you lose a small N% on death"): Legend kill +25, assist +12, minion kill +1, structure damage +1 per 2% of the structure's base health, boss damage +1 per 1%, death −15; a 10 s post-cast lockout stops back-to-back ultimates after a lock extension. Erudition (the "Studious" passive) applies as +20% duration, +10% potency, +25% meter gain.

## XP curve and level cap — MVP

`TUNE` "simple XP-based scaling on abilities, health and aether" (requirements doc); ability upgrades beyond level scaling are on hold (game doc, YELLOW). `Recommendation:`

```text
xpToNext(L) = 100 + 50 · (L − 1)   for L = 1 … 9      cumulative XP to level 10 = 2,700
```

Level cap 10 (options: 12 with the same formula, cumulative 3,850; 15, cumulative 5,950). Per level: +8% max health, +5% basic-attack damage, +4% ability potency, +10 max aether; cooldowns do not scale with level (capture points own that lever).

XP sources (`Recommendation:`): minion kill 20 / 45 / 120 shared equally among allied Legends within 10 m, with the killer getting an unshared +25%; Legend kill 150 + 25 × victim level, assists (damage in the last 10 s) get half; structure destroyed 300 to every allied Legend; checkpoints 60 / 150 / 400 with the damage-biased local share; camp cleared: the mobs' XP + 50; mini-boss 500 team-wide; the Eternal 1,500 team-wide. A laner sharing sixteen light minions a minute earns about 110 XP/min from minions alone, so objectives and kills are what carry a Legend to level 10 in the 18–22 minute window; the soak metric "Legend level at 10 and 20 minutes" is the check.

## Eternal (final-hit) stat multipliers — MVP

`TUNE` from the game doc: massively increased health, greatly increased damage, knockback and stun reduction, new abilities and animations, larger stature, dies once the bar is depleted. `Recommendation:` max health × 3 (and set to full on transformation), damage × 2, ability potency × 1.5, size × 1.5, knockback distance × 0.25, stun and concussion duration × 0.25, cannot be revived, form ends at death (option: hard cap 180 s so an unkillable Eternal cannot stall a match). The "Prime" ability set is a `LegendDefinition` swap (`warrior-eternal`, `sentinel-eternal`, `magus-eternal`) rather than a modifier on the base class; `mechanics-ideas.md` explains why that one mechanism also serves form change later.

## The balance knobs (all in `packages/core/src/content/`)

Every knob below is content or config, never a literal in a system. Folders marked "proposed" are additions to the brief's content tree.

| Knob group                              | Home (proposed file)                                                      | Examples                                                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Structural counts and caps              | `config/GameConfig.ts`                                                    | `numLanes`, `spawnTowersPerLane`, `buffTowersPerLane`, `campsPerSide`, `maxLegendsPerTeam`, `maxUnitsPerTeam`, `tickRate`, world size |
| Match timeline                          | `content/match/timeline.ts` (proposed folder)                             | `countdownSeconds: 60`, `plannedMatchSeconds: 1200`, quarter and mid marks, `maxMatchSeconds`                                         |
| Horde compositions                      | `content/hordes/` (proposed folder)                                       | `light-horde: 16 × skirmisher`, formation spacing, spawn stagger ticks                                                                |
| What each structure spawns and when     | `content/structures/*.ts` (`spawns`, `guards` fields)                     | SpawnerTower light every 60 s; BuffTower medium every 120 s; guard counts; respawn 120 s                                              |
| Structure health and shields            | `content/structures/*.ts`                                                 | base health, `shieldFractionPerBuffTower`, `breakableFraction`, aura radius and magnitudes                                            |
| Turret ammo and targeting               | `content/structures/turret-ammo.ts`, `turret.ts`                          | damage, interval, projectile speed, priority list                                                                                     |
| Minion stats and growth                 | `content/mobs/*.ts`                                                       | tier stats, XP value, level-up rule, `ascended` values, strength-by-distance `k` and clamps                                           |
| Status effects                          | `content/status-effects/*.ts`                                             | durations, magnitudes, stack rules (see `more-abilities.md`)                                                                          |
| Legend base stats and per-level scaling | `content/legends/*.ts`, `content/progression/level-scaling.ts` (proposed) | anchor table values, `+8% health per level`, aether per level                                                                         |
| XP curve and XP sources                 | `content/progression/xp.ts` (proposed folder)                             | `xpToNext`, share radius, share weights, per-source XP                                                                                |
| Abilities and ultimates                 | `content/abilities/*.ts`                                                  | cooldown, aether, duration, magnitudes, varieties, meter gains                                                                        |
| Weapons and artifacts                   | `content/weapons/*.ts`, `content/artifacts/*.ts`                          | damage, interval, on-hit effects, heavy-attack cooldowns                                                                              |
| Camps and bosses                        | `content/mobs/camps.ts`, `content/mobs/bosses.ts`                         | camp compositions, respawn, leash; boss multiples, expected level, moves, rewards                                                     |
| Capture points                          | `content/structures/capture-point.ts`                                     | stage seconds, guard sets, XP tiers, ownership effects, minion level-up hold time                                                     |
| Eternal form                            | `content/legends/*-eternal.ts`, `content/status-effects/eternal.ts`       | multipliers, optional cap                                                                                                             |
| Bot difficulty                          | `content/ai/*.ts` (proposed folder)                                       | reaction delay, aim error, cadence, Rover thresholds (see `mechanics-ideas.md`)                                                       |

Provisional values carry `// TUNE:` in the content file (`CONTRIBUTING.md` §4). A `validateContent()` run at startup in development and in a test checks ranges and cross-references (research §9), so a typo in a knob fails fast instead of producing a silent stalemate.

## How to test balance

Balance is measured, not argued. Because core has no DOM dependency and takes its randomness from a seeded RNG, a Vitest test in Node can step `Simulation` for a whole match with bots on both sides; the same seed and command stream reproduce the same match exactly (`../../research/game-architecture-and-performance-research.md#1-fixed-timestep-interpolation-and-determinism`). The soak-test pattern is described in `../../research/persistence-input-diagnostics-research.md#c3-testing-a-running-game-properties-replays-golden-hashes-soak-tests`, and the bot cadence that keeps a 20-Legend match cheap per tick is in `../../research/game-architecture-and-performance-research.md#7-game-ai-for-bots`.

`Recommendation:`

- **Harness.** `BalanceHarness` in `core/diagnostics/` takes `{ seed, gameConfig, contentOverrides, bots }`, runs the match headless (no human Legend; `mechanics-ideas.md` "Sim mode") and returns a `MatchReport`. A tagged Vitest project (`npm run test:soak`, generous `testTimeout`) runs N seeds and writes one JSON line per match; a small script summarises them. Content overrides are the knob under test; nothing else changes between runs.
- **Symmetry first.** Mirror the teams (same classes, same loadouts, same bot profiles). Over 200 seeds the win rate must be 50% ± 5%. A deviation is a bug in the map generator, spawn order or tick order, not a balance question; fix it before tuning anything.
- **Metrics per match** (all derivable from `GameEvents`): winner and victory condition; length (median target 18–25 min, P95 under 35 min, zero timeouts at `maxMatchSeconds`); time of first structure fall (target 4–8 min); alive-unit counts per team over time and `spawn-suppressed` count (under 5% of spawns); Legend level at 10 and 20 min; damage share per class (each within 25–40% in a mirrored trio); ability and ultimate use counts; structure time-to-kill; time to the first mini-boss and the Eternal kill; wall breaches; invariant violations (must be zero).
- **Class matrix.** Replace one class on one side and rerun (3 × 3 grid); a class whose swap moves the win rate more than 10 points is the first tuning target.
- **Config sweeps.** `numLanes ∈ {1, 3, 5}` and `buffTowersPerLane ∈ {1, 2}` must all produce playable matches; this is also the regression test for D7 (config-generated map) and for every rule written as a fraction of a count.
- **Golden replays.** When a set of knobs is accepted, commit a replay fixture (seed + commands + checkpoint hashes) so a later content change that alters the outcome is a visible, intentional diff.
- **Human sanity.** The developer menu's time controls (see `mechanics-ideas.md`) let a designer watch a sim-mode match at × 4 and stop at the moment a metric looked wrong.

## Related

- `README.md` — how a suggestion is accepted
- `../game-design/02-entities-and-units.md` — minions, hordes, guards, bosses
- `../game-design/03-structures-and-defenses.md` — walls, gates, turrets, shield bars
- `../game-design/04-objectives-capture-points-and-bosses.md` — capture points and bosses
- `../game-design/06-abilities-and-progression.md` — abilities, ultimates, XP scaling
- `../game-design/11-mvp-scope.md` — what is in the MVP
- `../../architecture/03-game-model.md` — match timeline and `GameConfig`
- `../../architecture/15-diagnostics-and-runtime-testing.md` — invariants and soak tests
- `../../research/game-architecture-and-performance-research.md` — determinism, bots, config-driven design
- `../../research/persistence-input-diagnostics-research.md` — soak tests, replays, golden hashes
- `more-abilities.md`, `mechanics-ideas.md`, `discrepancies.md`
