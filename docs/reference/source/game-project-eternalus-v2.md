---
title: Eternalus v2 game document (source transcription)
description: Verbatim Markdown transcription of the Eternalus v2 game design document (Sep 18, 2026) with the PDF's highlight colours encoded as inline status tags; read it when you need the original wording behind a game-design reference doc.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [reference, source, game-design, transcription]
related:
  - 'docs/reference/game-design/00-overview-and-status-legend.md'
  - 'docs/reference/game-design/12-open-questions.md'
  - 'docs/requirements/source/requirements-of-architecture.md'
---

# Eternalus v2 game document (source transcription)

**Purpose.** Read this when a game-design reference doc under `../game-design/` is not enough and
you need the product owner's original wording, table layout or section order. This file is the
verbatim source of truth for the game vision as of **Sep 18, 2026**; the game-design docs
interpret it, the requirements catalogue (`../../requirements/06-mvp-requirements.md`) decides
what the MVP builds, and `../../plan/` decides when. Do not edit the transcription to "fix" the
design; record changes in `../game-design/12-open-questions.md` or `../suggestions/`.

## How to read this transcription

- The original is a PDF whose coloured highlights carry status. They are encoded here as a tag at
  the start of the affected item (row, cell, bullet or paragraph), taken from the highlight
  annotation record made when the PDF was extracted:

  | Tag                        | Highlight in the PDF | Meaning in the source's own legend                         |
  | -------------------------- | -------------------- | ---------------------------------------------------------- |
  | `[STATUS: idea-pending]`   | Teal                 | Idea pending                                               |
  | `[STATUS: needs-planning]` | Yellow               | Potential removal / needs more planning before integration |
  | `[STATUS: removed]`        | Red                  | Determined to be removed                                   |
  | `[STATUS: post-mvp]`       | Orange               | Outside of MVP, in a section that should be in MVP         |

- When a highlight covers only part of an item (one word or phrase), the tag is placed at the
  start of the item and the covered text is named in parentheses after the tag.
- Items with no tag were not highlighted. That does not make them MVP: the MVP is decided by the
  requirements catalogue. Derived statuses (for example, Air abilities being post-MVP because the
  Flying class is) live in the game-design docs, not here.
- The original section order and heading text are preserved. Top-level sections are `##`,
  their sub-sections `###`.
- Tables are transcribed as pipe tables. Where the PDF put several lines or sub-bullets in one
  cell, they are joined with semicolons; wording is unchanged.
- Spelling and punctuation are the source's own (for example "hoards", "dont", "thats"). Our
  docs write **horde**, not "hoard" (the product owner asked for a better name; see
  `../suggestions/naming.md`). Straight quotes replace the PDF's curly quotes.
- A line that the source left unfinished is transcribed as it stands and marked
  _(unfinished in source)_.

---

## Eternalus v2

Sep 18, 2026 · @Sam Holtzman

Eternalus is a team-based, class-driven objective game. Players pick one of four classes and
fight across a destructible map to capture points, destroy enemy buildings, and, ultimately,
destroy the enemy capital. The MVP is a top-down, point-and-click, lane-based game (Battle for
Middle-earth meets League of Legends) with bots for all non-player characters. Names marked
(rename pending), (working title), or (name pending) are placeholders.

### Legend

- Teal highlight for idea pending
- Yellow highlight for potential removal/needs more planning before integration
- Red highlight for determined to be removed
- Orange for outside of MVP in a section that should be in MVP

## Classes

Four classes, each with sub-classes whose names are still pending. Later tables use the
shorthand Tank (Sentinel), Mage (Magus), and Air (Flying).

| Class                                        | Build and movement                                              | Weapon bias   | Damage focus                       | Ability stats               | Other                                                          |
| -------------------------------------------- | --------------------------------------------------------------- | ------------- | ---------------------------------- | --------------------------- | -------------------------------------------------------------- |
| Assault (rename pending)                     | Lighter, lower health, faster                                   | Light weapons | Split between magic and physical   | Better light ability stats  | —                                                              |
| Sentinel                                     | Heavy, slower, more powerful                                    | Heavy weapons | Physical                           | Better heavy ability stats  | —                                                              |
| Magus                                        | Magical; floats or walks                                        | Staves        | Magic, with a higher ability focus | Better medium ability stats | Applies buffs or debuffs; can revive allies (if not destroyed) |
| `[STATUS: post-mvp]` Flying (rename pending) | Air-based; moves primarily in the air, like a jet or helicopter | —             | Ability damage and range           | —                           | Can melee physically if desired, but it is risky               |

### Sub-classes (names pending)

| Class                       | Sub-class   | Focus                                                               |
| --------------------------- | ----------- | ------------------------------------------------------------------- |
| Assault                     | Assassin    | Lighter, higher burst damage                                        |
| Assault                     | Knight      | Balanced weight, balanced damage                                    |
| Assault                     | Paladin     | Heavier, higher sustain damage                                      |
| Sentinel                    | Colossus    | Melee focus, extra resistance                                       |
| Sentinel                    | TBD         | TBD                                                                 |
| Magus                       | Necromancer | Debuff focus; Revive nearby fallen entities to fight for their team |
| Magus                       | Druid       | Buff focus                                                          |
| Magus                       | Mage        | Self-focus                                                          |
| `[STATUS: post-mvp]` Flying | Hover       | Better health, higher sustain damage, slower                        |
| `[STATUS: post-mvp]` Flying | Strafe      | Lower health, higher burst damage, faster                           |

Open question: should each class's sub-classes follow a generic damage / balance / support
split, or mix it up?

## Game Mechanics

The team meeting notes say stronghold, minions, and buff tower; the original notes say capital,
mobs, and buff building. They mean the same things.

### Objectives and scoring

- Each team has buildings; buildings are objectives to destroy or capture.
- Points of interest are areas of mutual capture. At the start of the game, no one owns them.
- Teams gain points by capturing and holding points of interest, destroying or capturing enemy
  buildings, and getting kills.
- Destroying the enemy capital wins the game.
- Capture points have three checkpoints (see below).

### Buildings

| Building    | Location                 | What it does                                                                                                                                                                 | Defence                                                                                                                                                                                | Form change available                                   |
| ----------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Mob spawn   | Front line               | Spawns groups of light mobs that travel together toward the nearest objective in their lane                                                                                  | Ranged and melee self-defence; Light mob guards (dont leave the tower's perimeter. respawn every 2 minutes)                                                                            | `[STATUS: needs-planning]` Ascendance                   |
| Buff/Debuff | Second line of buildings | Applies team-wide buffs; buffs mobs; Spawns light and Medium mob swarms; Debuffs nearby enemies (increases effects of debuffs, reduces enemy health and damage by 10% each). | Debuff aura and ranged self-defence; Numerous Medium mob guards (dont leave the tower's perimeter. respawn every 2 minutes)                                                            | `[STATUS: needs-planning]` Enchantment (rename pending) |
| Capital     | Primary building         | Applies team buffs; spawns mob groups; holds the summoner (to be defined); its destruction ends the game; Spawns Light swarms and Heavy Mobs                                 | Destructible walls; guarded by ranged and melee mobs (dont leave the tower's perimeter. respawn every 2 minutes); debuffs nearby enemies and buffs nearby allies, has turrets on walls | `[STATUS: needs-planning]` Ascendance and Enchantment   |

- Destroying mob spawn buildings reduces the capital's guards and weakens its walls.
- Destroying buff buildings removes the capital's buff and debuff aura.

### Capture point checkpoints

| Checkpoint | Spawns                                                  | Effect when Destroyed / won                                                                           |
| ---------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1          | Multiple medium assist mobs                             | Small individual XP, shared among nearby allies with a bias toward the ally who did the most damage   |
| 2          | Multiple heavy assist mobs, plus some light assist mobs | Medium individual XP, shared among nearby allies with a bias toward the ally who did the most damage  |
| 3          | One massive assist mob (Balrog-type)                    | Greater individual XP, shared among nearby allies with a bias toward the ally who did the most damage |

### Form change

Form change works like entering a vehicle: the character morphs into a greater stature, and
their abilities, attacks, and stats change. It is configurable, possibly class-dependent, and can
only be done at specific locations (see Buildings).

| Form                                                    | Focus                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------- |
| `[STATUS: needs-planning]` Ascendance                   | Attack                                                                     |
| `[STATUS: needs-planning]` Enchantment (rename pending) | Support                                                                    |
| Eternal                                                 | Greater version of player's base class (e.g., Assault', Sentinel', Magus') |

### Central boss: Eternal (rename pending) and the Ascended form

Decided at the team meeting: the gem spawns in the centre Cathedral and explodes mid-game to
summon the boss. The boss belongs to no team.

- Obscenely massive: a Souls-like boss built for a multi-player or multi-team coordinated attack.
  Far more brutal than the lane mini-bosses.
- When summoned, a map-wide atmosphere change spreads outward from the Cathedral. The Titan
  explodes from the crystal, erupts through the roof, and roars.
- The whole team gets XP on the boss kill.
- The player who lands the final hit becomes an Eternal: their class is upgraded with new
  abilities and animations (Mage Prime, Tank Prime, Assassin Prime, etc.) as they grow in size and
  stature.
- An Eternal player has a massively increased health bar, greatly increased damage output, and
  knockback/stun reduction; they die once their health bar is depleted.
- Earlier ideas, still open:
  - the gem glows brighter the closer the game is to summoning it

### Capture zones and mini-bosses

- Three central capture zones, one per lane. Holding a zone reduces ability cooldowns and boosts
  friendlies.
- At the quarter mark of the game, the top and bottom lanes each spawn a mini-boss along with
  high-power enemy and support mobs. They fight anyone inside their zone, from either team, and
  stay restricted to their capture point.
- While the mini-boss is alive, its zone cannot be captured.
- It takes multiple players to defeat. On defeat, the team gets a permanent buff and a large
  amount of ability XP to spend on abilities. The player who lands the final hit gets a consumable
  item (keep or remove? see Open Questions).
- Each mini-boss is a minor-to-medium Souls-like boss: hard, with multiple moves, never standing
  still, fighting any player or team-associated mob, with high damage and high health. Still
  nothing compared to the middle boss.
- Up until the mini-bosses spawn, the capture zones are protected by:
  - _(unfinished in source: the sub-bullet is empty)_

### Minions and lanes

- Minion strength scales with distance from their home stronghold (vector math): the closer to
  home, the stronger the minion. Strength evens out in the middle, which prevents early rushes.
- Destroying a structure gives the enemy minions on that lane an "enraged" buff, so a lane gets
  harder to push through after a structure falls, not easier.
- Holding a middle zone long enough levels up friendly minions on that side and reduces ability
  and ultimate cooldowns. The buff is lost if the zone is lost.
- A minion that kills another minion earns XP. After two kills it levels up and buffs nearby
  friendly minions.
- A minion that kills a player ascends: it grows larger and gains additional buffs.
- Three lanes, with 3 players per lane plus 1 Rover per team (a 10v10 simulation). In the MVP,
  all non-player characters are bots.
- The enemy Rover is a hard bot: it reacts to structure health and mirrors or targets the player.

## Map

Terrain and buildings are destructible. Multiple maps are an open question.

### Map 1

- A standard-looking three-lane funnel. Each lane has a primary connector into the other team's
  zone.
- The middle lane holds the Cathedral, the major capture point. The outer lanes hold lesser
  capture points (see Capture zones and mini-bosses).
- Bridges are destructible.
- A massive rift through the centre of the map divides the team territories.
- The map starts green and grassy with trees. All grass and trees can burn or be felled. Falling
  trees do damage and break the ground; they stay felled and can be picked up by strong enough
  characters, depending on tree size.
- MVP: lanes are kept straight to simplify collision detection (JavaScript hitboxes).

## Art Theme

Grand, dark fantasy: the Remnant 2, Battle for Middle-earth, Elden Ring, and Lords of the Fallen
aesthetic. MVP: low-poly or pixel art in-game, with high-quality character art on the selection
screen.

| Team                 | Palette            | Style                                            |
| -------------------- | ------------------ | ------------------------------------------------ |
| Light (unique skins) | Gold, white, blue  | Paladin armour in gold and white                 |
| Dark (unique skins)  | Red, black, purple | Same classes, with hellish lava and rock styling |

## Lore

- No faction is innocent.
- The factions used to live in a strained but organized peace?
- A mysterious force or group broke the realm's order, and neither side could agree on how the
  land should be ruled or divided.

| Faction | Character                                                                 |
| ------- | ------------------------------------------------------------------------- |
| Light   | Favoured order and a heavy hand; grandiose architecture; holier-than-thou |
| Dark    | Favoured order and a heavy hand; grandiose architecture                   |
| Medium  | Favoured chaos and self-rule                                              |

## Loadout

- Primary weapon
- Secondary weapon
- Passive ability or aura
- Artifact 1 and artifact 2
- Armour set
- Ability 1, 2, and 3
- Per-class skin selection

## Abilities and Interactions

The tables below use the shorthand Tank (Sentinel), Mage (Magus), and Air (Flying).

### Default actions

| Class | Action | Description                                                                                                      |
| ----- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| Mage  | Revive | Revives recently killed allies (if still intact). Recently revived allies cannot be revived again for N seconds. |

### Passives

| Class | Name                    | Description                                                                                                                                         |
| ----- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tank  | Wrecking Run            | While holding sprint, speed gradually increases to a max of N m/s.                                                                                  |
| Mage  | Studious (name pending) | Abilities last X% longer and are N% more potent. Your ultimate fills faster.                                                                        |
| Mage  | Necromancy              | The lower your health, the stronger you become. All undead abilities are amplified. Revived allies have increased power and negation for N seconds. |

### Default interactives: pick up and throw

All units can pick up and throw objects, and the interaction looks different for each class. The
heavier the object, the slower you move while holding it. Some things are too heavy for certain
classes: a Tank can pick up a wall chunk; an Assault cannot.

| Class   | Name     | Description                                                                                                                                                                                                                                                     |
| ------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mage    | Levitate | The selected object floats and can be pulled toward the user or thrown away. Medium weight max.                                                                                                                                                                 |
| Tank    | Grab     | Grabs the object and can hold or throw it. High weight max. Picking up enemies applies the "crushed" debuff.                                                                                                                                                    |
| Assault | Pick Up  | Picks up the object. Low weight max. Try picking up an enemy Assault from behind (suplex for a break-neck finisher).                                                                                                                                            |
| Air     | Grasp    | Target an object, mob, or player; swoop down, grab it, and take off with it. Weight max depends on sub-class. Picking up enemies stuns them briefly (they can soon fight you off). Has a cooldown. Careful trying this on a heavy Tank who is paying attention. |

- Parrying, for most troops, is simply a deflect. A heavy Tank parries a Grasp by grabbing the
  aerial unit's limbs and slamming its body into the ground. The aerial unit explodes on contact,
  with no revive (like a fatal sniper headshot).
- Why use Grasp? Because gravity exists in the game. If your team's heavy Tank is at full health,
  try dropping him from a height onto the enemy.

### Abilities

Abilities are class-specific and not shared between classes. Grasp was moved to default
interactives.

| Class   | Name         | Description                                                                                                                                                                   | Varieties (Loadout Configurable)                                                                                                                                           |
| ------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assault | Veil         | Become invisible for N seconds.                                                                                                                                               |                                                                                                                                                                            |
| Mage    | Imbue        | Your weapons do X% more damage, and attack speed increases by N%.                                                                                                             | Damage: Full buff, applied to you alone. Support: Buff reduced. Provide lesser buff to nearby allies                                                                       |
| Air     | Eagle Eye    | Activate for thermal vision and target marking for N seconds. When the ability ends, targets stay marked for N more seconds. Marked targets are visible to all nearby allies. |                                                                                                                                                                            |
| Tank    | Rip & Tear   | Low-health enemies should back up.                                                                                                                                            |                                                                                                                                                                            |
| Mage    | Shockwave    | Sends out a shockwave of light that blasts enemies back and applies the "concussion" debuff.                                                                                  |                                                                                                                                                                            |
| Tank    | Slam         | Slam your arms down on the ground creating a shockwave, inducing knockback and knockup, and destroying the ground/structures near you                                         |                                                                                                                                                                            |
| Assault | Blade Runner | Dash forward at incredible speed, dealing damage to everyone in your path.                                                                                                    | Physical: knocks back enemies in your way and stuns anyone at the end of your path. Magical: leaves a path of flame in your wake and burns anyone at the end of your path. |

- If Slam and Shockwave are used near each other by opposing forces, they cause a large explosion
  (a DBZ moment).

### Weapons

Non-unique weapons are not class-specific: any class can use any weapon available to another
class. Open question: should weapons have abilities? It may be getting complex.

#### Weapon classes

| Class              | General details                                                |
| ------------------ | -------------------------------------------------------------- |
| Glove              | Typically melee (some have a ranged flex)                      |
| Bow                | Typically ranged (some with higher-than-expected melee damage) |
| Sword              | Melee (mostly)                                                 |
| Spear / Battle axe | Longer-reach melee                                             |

#### Named weapons

| Weapon class | Name          | Damage type                                                                                                                                            | Description                                                                                              |
| ------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Glove        | Raptor Talons | Melee, physical, bleed                                                                                                                                 | The initial melee hit inflicts physical damage and a bleed DoT. Looks like a Warhammer 40K power fist.   |
| Bow          | (unnamed)     | Ranged, magical, debuff                                                                                                                                | Reduces protections (stacks). An obsidian bow that shoots glowing purple arrows with black smoke trails. |
| Staff        | A Fine Line   | Melee physical, ranged magical, piercing                                                                                                               | A staff with a blade at one end that does piercing damage; ranged attacks also pierce.                   |
| Battle axe   | Wuuthrad      | Physical melee; longer reach; heavy attack applies concussion; extra effective against Tanks                                                           | Like the Skyrim axe, but its bonus applies to everyone instead of just elves.                            |
| Sword        | Lightbringer  | Magical and physical melee; heavy attack strikes lightning (cooldown) that inflicts a brief stun, concussion, and blind; parry inflicts blind and stun | A gold and white sword. Glows faintly in dark areas for allies.                                          |

#### Unique class weapons

Each class has a unique weapon it can use if desired.

| Class   | Weapon                  | Description                                                                                                                                                                                                                                                                                                                         |
| ------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tank    | Barricades (needs work) | Think Cabrakan's arm walls. Walk on all fours? The walls can be pressed together in front of you, but you cannot move while doing so. Heavy but slow melee damage on swing. Greatly increases character weight. Passively acts as super-heavy armour: a moving obstacle with high penetration protection and knock-back absorption. |
| Mage    | Staff                   | Melee attacks do physical damage; ranged attacks do magical damage. Increases the potency of spells (abilities).                                                                                                                                                                                                                    |
| Assault | Short blades            | Close-range, fast melee with deadly passive abilities. Can be thrown, but must be retrieved or regenerate over time                                                                                                                                                                                                                 |

### Artifact

Artifacts are class-specific and not shared across classes.

| Class | Artifact           | Description                                                                       | Varieties                                                                                                                                     |
| ----- | ------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Tank  | Mortar             | A mortar system with two fire modes, selected before spawn: impact and air burst. | Physical, Magical                                                                                                                             |
| Tank  | (TBD)              | Second Tank artifact not yet defined.                                             | —                                                                                                                                             |
| Magus | Soul Orb (pending) | Arc Soul from D2                                                                  | (Names Pending) Cast Forward: Cast on any surface as a turret (health based or time based?); Follower: Summons orb beside you as an assistant |

### Ultimate Abilities

- Each class (and perhaps each sub-class?) has one ultimate ability?
- Kills, assists, and objective damage fill your ultimate. It does not fill passively. You lose a
  small N% of the meter on death.
- Switching classes sets your ult back 50–100% on cooldown (toward the just-used side, never
  reducing the cooldown), so players cannot build up a charge and then switch classes next life.
  Needs work.

| Class   | Name                      | Description                                                                                                                                                                                                                                                                                                                                                                                          |
| ------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mage    | Death Ray (working title) | A Kamehameha. Very long distance. Lasts N seconds.                                                                                                                                                                                                                                                                                                                                                   |
| Tank    | Berserk                   | Suddenly grow in size, power, speed, and durability (Hulk / Cú Chulainn). Lasts N seconds.                                                                                                                                                                                                                                                                                                           |
| Tank    | Meteor Fall               | Leap into the air and come down hard: massive AoE damage, stun, etc. (Bacchus).                                                                                                                                                                                                                                                                                                                      |
| Air     | Firestorm                 | An AoE attack that sets alight the land beneath you. Higher up means a wider area and less damage (up to X max height); closer to the ground means a smaller area and higher damage. Basic damage fall-off, like shotgun birdshot but larger.                                                                                                                                                        |
| Assault | Fury                      | Imbue yourself with the light of [god name]. Attack speed is over-maxed (N00%) for N seconds. Press [button] to dash instantly in any direction (joystick or WASD to guide). Attacks do Nx damage during Fury and apply knock-back.                                                                                                                                                                  |
| Mage    | Nova                      | Sends out a shockwave that stuns enemies caught in it, with minor knock-back. At its largest point it collapses inward, pulling enemies toward you for N seconds, before a larger explosion knocks them back and inflicts concussion. The closer enemies are when the explosion hits, the more damage Nova does. Enemies within X metres who are looking at you are blinded by the second explosion. |

- Two opposing Death Rays lock together like the Harry Potter graveyard duel. Do not get close to
  the middle. Both sides get up to N seconds of extended ult time as long as they stay connected.
  It is cool and rare.
- Abilities cast before an ult still apply during it. For example, using Veil and then Fury as
  Assault keeps you invisible during Fury until Veil expires.

## Ability Progression (No Item Shop)

Ability progression replaces item-buying entirely. During the MVP, ability upgrades beyond basic
scaling with level are on hold.

- Each class has 3 abilities plus an ultimate. Abilities start weak and scale with level.
- `[STATUS: idea-pending]` Ability tree, like Battle for Middle-earth: levels unlock upgrade
  tiers, only N upgrades can be held within a tier, and forgetting an upgrade to open a slot has
  a cost
- The ultimate is available from the start as a charging bar and upgrades to Ultimate Plus at
  higher levels.
- The loadout can be configured pre-game, with an auto-build option. Players can override the
  auto-build mid-game if needed. Loadout can be adjusted in game. Changing abilities or ultimate
  resets cooldown, needing full recharge before use.
- `[STATUS: idea-pending]` (the word "blessings" only) Upgrading "blessings" (abilities) requires
  visiting a buff tower or the stronghold.

## Movement and Controls (MVP)

- WASD in the MVP. Click to attack, use number keys for abilities
- Abilities are mapped to keyboard keys (Z, C for artifacts, 1–4 for abilities, etc.).
- Controller support is deferred to post-MVP, along with the first-person full game.

## MVP Scope and Team Next Steps

Reference games for the MVP structure: Battle for Middle-earth (top-down) and League of Legends
(lane-based, single-character control, WASD).

MVP decisions so far:

- All non-player characters are bots, including the enemy Rover.
- WASD and numbers for abilities, controller, and first-person come later.
- `[STATUS: needs-planning]` (the phrase "with high-quality character art on the selection
  screen" only) Low-poly or pixel art in-game, with high-quality character art on the selection
  screen.
- `[STATUS: needs-planning]` Ability upgrades on hold beyond basic level scaling.

Team concern: not everyone understands the full game design yet, which risks conflicting
implementations. Thorough documentation is needed so all 5 members are aligned before coding
begins.

- Integrate the team meeting's design decisions into this document.
- Schedule a full team meeting to walk through this document before coding begins.

## Open Questions and Naming To-Dos

Every open question from the original notes and the team meeting, collected in one place.

### Naming

- `[STATUS: idea-pending]` (the word "Flying" only) Rename the Assault and Flying classes.
- Name all sub-classes.
- `[STATUS: removed]` (the word "Titan" only) Rename Enchantment and Titan.
- Name the bow, the Studious passive, the Death Ray, the second Tank artifact, and the god invoked
  by Fury.

### Design

- Titan objective: decided at the team meeting. The gem explodes mid-game to summon a neutral
  boss. (Eternal)
- `[STATUS: idea-pending]` Ascendance (form change at buildings)
- `[STATUS: removed]` Gem glow: tied to a team's summoning progress (original notes) or to the
  mid-game timer (meeting)?
- `[STATUS: removed]` Central boss as its own game mode?
- Mini-boss final hit: keep or remove the consumable item reward?
- `[STATUS: idea-pending]` Ability tree: how many upgrades per tier (N), and what does forgetting
  one cost?
- `[STATUS: removed]` Anti-air buildings: keep or cut?
- Define the summoner held by the capital. Does it do anything?
- Is form change class-dependent?
- `[STATUS: idea-pending]` Multiple maps? (Not for MVP)
- Sub-class structure: a generic damage / balance / support split per class, or mix it up?
- `[STATUS: idea-pending]` Should weapons have abilities?
- One ultimate per class or per sub-class? Finalize the class-switch cooldown penalty.
- Describe Slam and Rip & Tear, and define the second Tank artifact.
- Barricades needs work.
- `[STATUS: idea-pending]` Lore names a third Medium faction, but the art theme covers only Light
  and Dark.

## Additional Items to Integrate (Unstructured; Popup Ideas)

**INCLUDED IN MVP IF POSSIBLE** _(red text in the source: emphasis, not a removal highlight)_

### Entity Class Specifics

Along with the standard "health" metrics, the Entity class will need speed, maxSpeed, and
acceleration metrics. If you read the primary document, you'll note that the Sentinels have low
speed, but thats base stat. they would actually have one of the highest maxSpeed stats but their
acceleration is just slow. The class would also need a weight or mass field too if we are
handling things like knockback and momentum in the future (ref. primary document; at high speeds
the Sentinel class can break through harder walls by sprinting through them; they need a lot of
runway for this though).

`[STATUS: post-mvp]` Outside of MVP scope, but i would like to think about adding mount
entities. Dark and light would have different skins for them, but a mount would be like a horse
or something that would let Assault class-type characters to get from one place to another much
quicker, given the map would be huge. Sentinel classes can get between two points on foot by
relying on their high-speed, but the acceleration metric means they need a while to really get
going.

Also note: i didnt include this in the doc, but headcannon says that each class has different
character sizes. Assault is the smallest (a little bigger than a light minion; ~equivalent in
size to medium minions), Magus is quite a bit larger (~equivalent in size to Heavy minions), and
Sentinel class characters are very large. Imagine Assault like Master Chief (~7ft tall), Magus
like Hades in Smite/Smite 2 (~10ft), and Sentinel like an Elephant (~15 ft).

### Outer (Corner) Camps

Outer camps can be fortified neutral camps. Buildings surrounded by impassible rifts (the
purple). Each is unique in design but holds high-level mini bosses from the start of the game.
Killing a boss and it's supporting minions gives your team XP and spawns a wave of heavy minions
from your capital. They go down the lane where you are worst-off (lowest structure damage, lost
the most structures, pushed furthest back, etc) There is a crystal within each of these that
cannot be broken. It spawns new bosses every 5 minutes after a mini boss's death.

### Minion Buffs on Boss Spawn

Also, an idea going with the theme of buffs and debuffs being a big thing: when the middle boss
spawns, all neutral camps become stronger and more aggressive. The corner camps begin spawning
waves of light/medium enemies that attack your lanes from the sides. A heavy mini-boss's guards
the crystal that spawns new waves every 4 minutes.

### Stronghold Defenses

#### Walls

Strongholds have walls. Start of game, all towers provide the wall extra HP and buff/debuff
towers give it an aura that empowers allies and damages enemies.

As towers fall, the health of the wall falls too (proportional to number of towers of allied side
that are razed). Walls are breakable by players once at least 2 buff/debuff towers are downed.
Before then, they are unbreakable.

Once breakable, Sentinels and heavy minions can start to do damage. Sentinels can sprint through
them if theyre at full speed (sentinels can take up to 1 minute of running straight to get to
full speed), but take 50% total health as damage when doing so (only applies to sprinting through
stronghold walls. other structures are a different story), and only do 50% total damage to the
wall segment(s) contacted (if the wall has 10,000 health, the sentinel's full sprint would do
5,000 damage).

#### Gates

Gates open and close (slowly) to allow minion hoards and allied players through. If an enemy
tries to go through an open gate that hasn't been destroyed, the gate defends itself with fire.

Like walls, until at least 2 buff/debuff towers of the defending team's side have been destroyed,
they are unbreakable.

Once breakable, all units may use attacks on the gates. Heavy Minions, Sentinels, and Magus'
damage abilities do the most damage to gates. Other units do little damage to gates or other
structures.

#### How Buff/Debuff Towers (Need a themed name for these) Buff Walls and Friendly Structures

Per buff/debuff tower alive, spawner towers (1st line of defence per team) have their health
increased by 125%. Other buff/debuff towers receive 150% increase in health. Walls have their
health increased by 200% per buff/debuff tower alive. The % increase is calculated on top of the
base health, so 150% \* base, not (150% \* base) \* 3. E.g., if a structure had 1000 base health
and there are 3 allied buff/debuff towers alive, it would have 4500 health (1000 \* 1.5) +
(1000 \* 1.5) + (1000 \* 1.5). If the structure receives damage, the health is taken off these
additional health bars, rather than the tower itself (acting like a shield).

This health increase is added on top of the base health of the structure in question. In other
words, if a structure had 1000 health, it gets an additional N health on top of it. When being
damaged, that N is what is taken from, not the base 1000. This prevents the destruction of one
tower from destroying another tower that had low health already. Its a simple additional amount
of health (could be separated on the health bar via colours corresponding to towers alive; 1 for
each tower).

#### Turrets

Wall has small turrets which auto-fire at enemies within their range (see map draft's wall's
circles for locations of these turrets). Turrets can be entered by Assault-class legends for
manual firing (auto fires by default. auto-fire turns off when "press p to assume control" is
pressed by a Legend. When they "press p to exit", it resumes auto-firing). Turrets launch bolts
(large crossbows) at any enemy in range (fire rate: 1 bolt per 10 seconds on heavy ammo, 1 bolt
per 5 seconds on default ammo). On auto fire, ammo switches automatically depending on who the
turret is targeting (heavy for Sentinels and Heavy minions, default for other units). On manual
control, players "press t to switch projectile type". On auto, predictive fire (minion x going in
direction y at velocity v; fire at destination). Ammo specifics can change (should be an easy
code change; couple lines maybe).

#### Anti-Air Defense

`[STATUS: post-mvp]` Will be added later. TBD.

---

_End of transcription._

## Related

- [Overview and status legend](../game-design/00-overview-and-status-legend.md)
- [Open questions](../game-design/12-open-questions.md)
- [Requirements doc transcription](../../requirements/source/requirements-of-architecture.md)
- [MVP requirements catalogue](../../requirements/06-mvp-requirements.md)
- [Suggestions: discrepancies between the sources](../suggestions/discrepancies.md)
- [Suggestions: naming](../suggestions/naming.md)
