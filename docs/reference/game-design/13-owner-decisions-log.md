---
title: Owner decisions log
description: Dated record of every product-owner decision taken through INBOX.md after the source documents were written, with the docs each one changes; read this before relying on a number or rule from the game doc, because a decision here overrides it.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-03
tags: [reference, decisions, game-design, inbox]
related:
  [
    'docs/reference/game-design/12-open-questions.md',
    'docs/reference/suggestions/discrepancies.md',
    'INBOX.md',
  ]
---

# Owner decisions log

**Purpose.** Read this when a reference doc, a discrepancy row or a plan number could have been
overridden by the product owner. Decisions arrive through `INBOX.md`; once implemented they are
recorded here (newest batch first) and the affected docs are updated or linked. Precedence:
ADRs > this log > the reference docs > the source transcriptions.

## Batch 2026-10-03 (INBOX DEC-01…DEC-10 and the discrepancy answers)

### Project and process

| ID     | Decision                                                                                                                                                                                              | Affects                                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| DEC-01 | **Presentation date: 2026-11-27.** The plan is re-cut to four two-week sprints from 2026-10-05 with a feature freeze on 2026-11-20.                                                                   | `docs/plan/README.md` §"Re-cut 2026-10-03"                            |
| DEC-02 | React + Redux confirmed with the instructor.                                                                                                                                                          | ADR 0004 status → accepted (confirmed)                                |
| DEC-03 | Team is a property; no `NeutralEntity` class. Camps, bosses and mini-bosses carry their own team (`neutral`).                                                                                         | ADR 0006 status → accepted                                            |
| DEC-04 | `feat/map` (now merged into `main`): the lead architect may change the map code as needed to fit the architecture; **Aryan Walanj reviews** those PRs.                                                | Map audit session prompt; `06-map-and-minimap.md` review notes        |
| DEC-05 | **Two-week sprints.** Reviewers are chosen by the feature owner when opening the PR (whoever cares about the feature), not by rotation.                                                               | `docs/plan/README.md`, `docs/process/git-workflow.md` §1              |
| DEC-06 | 1 world unit = 1 metre. Legend footprint radii: **Warrior 0.5 m** (7 ft tall), **Magus 0.75 m** (10 ft), **Sentinel 1.25 m** (15 ft); the footprint covers the feet plus the impact area around them. | `10-physics.md` §1 (TUNE values), `balancing.md`, content `legends/*` |
| DEC-07 | MVP cut order confirmed: corner camps → manual turret control → pick-up/throw → art polish.                                                                                                           | `docs/plan/README.md` cut lines                                       |
| DEC-08 | Naming deferred except **Assault → Warrior** (effective now: class `Warrior`, content id `warrior`). Other placeholders keep the `naming.md` recommendations as display names until changed.          | All docs: "Assault" → "Warrior" where it names the class; `naming.md` |
| DEC-09 | Discrepancies answered below.                                                                                                                                                                         | `discrepancies.md` statuses                                           |
| DEC-10 | `INBOX.md` stays committed and visible to teammates.                                                                                                                                                  | —                                                                     |

### Gameplay rules (discrepancy answers)

| Source            | Decision                                                                                                                                                                                                                                                                                                     | Affects                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| DISC-09           | Wall/gate breakability threshold is a **fraction** (`2/3`) of the team's BuffTower count, so it survives a change of `buffTowersPerLane`.                                                                                                                                                                    | `07-structures` §3, content `structures/*`                    |
| DISC-10 / 23      | Spawn schedule Option A: SpawnerTower → light horde every 60 s; BuffTower → medium horde every 120 s; Stronghold → heavy horde every 180 s sent **down the team's worst lane** (dynamic, see `02-entities`).                                                                                                 | `12-game-story` §3 timeline, `balancing.md`                   |
| DISC-11           | One capture point per lane with three checkpoints; the Cathedral adds the gem and the minion level-up. **The gem is present from match start**, is unbreakable, strikes attackers with lightning when hit directly, and visibly changes appearance/behaviour over time until it is ready to summon the boss. | `04-objectives`, `07-structures` (Cathedral), `12-game-story` |
| DISC-12           | Corner-camp bosses exist from t = 0; forest camps spawn only after their cooldown.                                                                                                                                                                                                                           | `02-entities`, `12-game-story`                                |
| DISC-21 / 22 / 26 | Only BuffTowers grant shield bars; a lost SpawnerTower removes guards instead; a tower never shields itself; the worked example totals **5500** (1000 base + 3 × 1500).                                                                                                                                      | `03-structures`, `07-structures` §2                           |
| DISC-24           | Minion strength-by-distance stays in MVP-full. It is an **addition on top of base stats**: strongest at the Stronghold, base stats at the map centre at match start; when a tower in a lane falls, the "base-stat distance" in that lane extends further down the lane toward the enemy.                     | `02-entities`, `11-game-ai`, content `mobs/*`                 |
| DISC-27           | Turrets: operable by **Warrior only**, expressed as a content flag on the turret definition (`operableBy: ['warrior']`), i.e. data, not a class check; auto-fire by the system when unmanned; manual control is MVP-if-time.                                                                                 | `07-structures` §5, content `structures/turret`               |
| DISC-29           | **No building capture in the MVP** (destruction only). Central capture points remain.                                                                                                                                                                                                                        | `04-objectives`, FR rows on capture                           |
| DISC-31           | Max **10 Legends per team**, 20 per match.                                                                                                                                                                                                                                                                   | `config.limits.maxLegendsPerTeam`                             |
| DISC-32           | Mini-boss "ability XP" feeds level scaling until an ability tree exists.                                                                                                                                                                                                                                     | `06-abilities`                                                |
| DISC-38           | Magus picks one passive; Warrior has none in the MVP, but `passive` stays a field on the Legend definition so one can be added as data. Idea logged: **Inspire** (Warrior) — nearby allied minions deal more damage and resist fear/knockback.                                                               | `01-classes`, `more-abilities.md`                             |
| DISC-42           | **Declined** the Stronghold→centre ordering. Camps are ordered by distance from the lane: the closer to a lane, the lighter; the deeper into **the Unknown** (the inter-lane wilderness, the game's "jungle") the heavier.                                                                                   | `05-map`, `02-entities`, `MapGenerator` camp placement        |
| DISC-43           | Mini-boss consumable item **removed**.                                                                                                                                                                                                                                                                       | `04-objectives`, `12-open-questions`                          |
| DISC-51           | **The human player is their team's Rover.** The allied Rover is only bot-controlled in developer/sim mode when the player hands their Legend to an AI to watch. The enemy Rover is the hard bot.                                                                                                             | `02-entities`, `11-game-ai` (`RoverController`), `MatchSetup` |
| DISC-52 / 53      | Revive eligibility shape accepted with a **10 s** `bodyIntact` window; sprint-through per-breach rule accepted as a balancing starting point.                                                                                                                                                                | `05-abilities` (Revive), `07-structures` §3                   |
| DISC-58           | Radii as in DEC-06.                                                                                                                                                                                                                                                                                          | `10-physics`, `balancing.md`                                  |
| DISC-60           | Pick-up/throw: objects MVP-if-time, units post-MVP.                                                                                                                                                                                                                                                          | `01-classes`, backlog                                         |
| Naming            | `naming.md` picks accepted as working display names. Player names are displayed above characters; **bots carry a non-spoofable icon** before their name (never a `[BOT]` text tag).                                                                                                                          | `13-game-interface` HUD name tags, `naming.md`                |

### Still open after this batch (owner asked for elaboration)

| Source       | Question as asked         | Elaboration given in `INBOX.md`                                                                                                                                                                                                                                                                                                                         |
| ------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DISC-19 / 39 | "Unsure what this means." | The game doc names only two abilities per MVP class (Warrior: Veil, Blade Runner; Sentinel: Rip & Tear, Slam; Magus: Imbue, Shockwave) while the rule is "3 abilities + 1 ultimate", and it lists two ultimates for Magus (Death Ray, Nova) and Sentinel (Berserk, Meteor Fall). Decide the third ability per class and the one MVP ultimate per class. |
| DISC-33      | "Which crystals?"         | The corner-camp crystals of the game doc's "Outer (Corner) Camps" and "Minion Buffs on Boss Spawn" sections: unbreakable, respawn the camp's mini-boss 300 s after its death, and (once the central boss has spawned) emit light/medium waves every 240 s. Decide whether both timers stand.                                                            |
| DISC-34      | (left blank)              | `plannedMatchSeconds: 1200` (quarter mark at 300 s, mid-game at 600 s), no hard time limit, optional score cap at 2700 s.                                                                                                                                                                                                                               |

### New ideas logged (not yet scheduled)

- **Tower Guardians** — 4 specialised heavy-class guards per tower (and one on each side of every
  Stronghold gate); higher damage/health than minions; ranged and melee attacks; fight within a
  10 m radius and never chase; fallen guards are replaced after 5 minutes (as many as fell).
  This refines the game doc's "guards respawn every 2 minutes" and goes to `02-entities`,
  `07-structures` §4 and `GuardController` when scheduled (**MVP-if-time**; the base guard
  behaviour is MVP).
- **Weapon upgrades and scaling** — profile-level unlocks configured in loadouts; in-match XP
  unlocks tiers 1–5 up to a "Prime" form with visual changes. **Post-MVP** (backlog).
- **Visual feedback at level checkpoints** (every 10 levels; peak at 50) and purchasable skins.
  **Post-MVP**.
- **Team-specific skins** — Light and Dark Legends are mechanically identical (hitboxes,
  weapons, abilities); only appearance differs per team. Already the art-theme rule; recorded as
  an invariant for content: team never changes a definition's gameplay fields.
- **Interface flow** (home → loading → character select → pre-launch → match loading → match)
  recorded in [14-interface-and-screen-flow.md](14-interface-and-screen-flow.md).

## Related

- [12-open-questions.md](12-open-questions.md)
- [../suggestions/discrepancies.md](../suggestions/discrepancies.md)
- [14-interface-and-screen-flow.md](14-interface-and-screen-flow.md)
- [../../plan/README.md](../../plan/README.md)
