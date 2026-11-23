---
title: Open questions
description: Every open question and naming to-do from the game doc and the requirements doc, plus the questions raised by reconciling them, in one numbered table with status, owner and decision columns; read it before deciding anything, and add to it instead of deciding in code.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-29
tags: [reference, game-design, open-questions, naming, decisions]
related:
  - 'docs/reference/source/game-project-eternalus-v2.md'
  - 'docs/requirements/source/requirements-of-architecture.md'
  - 'docs/reference/suggestions/discrepancies.md'
---

# Open questions

**Purpose.** Read this when a design doc is ambiguous, when you are about to make a choice the
sources do not make, or when a product decision has been taken and needs recording. Agents never
decide these; they leave the `Owner` and `Decision` columns for a human and, if code needs a
value now, use a `TUNE` content value and reference the OQ id in a `// TODO(name): OQ-nn`
comment.

## How to use the table

- **ID** is stable; never renumber. Append new rows at the end of the relevant section.
- **Status** is one of `open`, `decided`, `idea-pending` (teal in the game doc),
  `needs-planning` (yellow), `removed` (red), `post-mvp` (orange or by decision). Removed rows
  stay so the history is visible.
- **Source** names where the question comes from: the game doc section, the requirements doc,
  or "reconciliation" for questions raised by comparing the two (details in
  `../suggestions/discrepancies.md`).
- **Owner** and **Decision** are blank until a human fills them; a decision that changes
  architecture also gets an ADR in `../../decisions/`.

## Naming to-dos

| ID    | Question                                                                                                                                             | Source                                                            | Status                                           | Owner | Decision |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------ | ----- | -------- |
| OQ-01 | Rename the Assault class: **decided 2026-10-03 → Warrior** (class `Warrior`, id `warrior`); displays as **Legionnaire** (DEC-48).                    | game doc: Naming; Classes                                         | decided (2026-10-03; DEC-48)                     |       |          |
| OQ-02 | Rename the Flying class (requirements doc spells it "arial" and also asks for a new name). **Decided (DEC-48): Harbinger**; id `harbinger` (DEC-59). | game doc: Naming (teal); requirements                             | decided (DEC-48); post-mvp                       |       |          |
| OQ-03 | Name all sub-classes; Sentinel's second sub-class is TBD in both name and focus. **Decided 2026-10-17 (DEC-49)**; Legend names open (OQ-69).         | game doc: Naming; Sub-classes                                     | decided (DEC-49); MVP (DEC-56); phase: HC-Q17    |       |          |
| OQ-04 | Rename Enchantment (the support form change).                                                                                                        | game doc: Naming; Form change                                     | open; needs-planning                             |       |          |
| OQ-05 | Rename Titan.                                                                                                                                        | game doc: Naming (red)                                            | removed (replaced by "Eternal (rename pending)") |       |          |
| OQ-06 | Name the central boss and the final-hit form; "Eternal (rename pending)" is used for both, and the source also writes "Mage Prime" and "Warrior′".   | game doc: Central boss; Form change                               | open                                             |       |          |
| OQ-07 | Name the bow (the obsidian, purple-arrow ranged magical debuff weapon).                                                                              | game doc: Naming; Named weapons                                   | open                                             |       |          |
| OQ-08 | Name the Studious passive (Magus).                                                                                                                   | game doc: Naming; Passives                                        | open                                             |       |          |
| OQ-09 | Name the Death Ray (working title).                                                                                                                  | game doc: Naming; Ultimates                                       | open                                             |       |          |
| OQ-10 | Name and define the second Sentinel (Tank) artifact.                                                                                                 | game doc: Naming; Design; Artifact                                | open                                             |       |          |
| OQ-11 | Name the god invoked by Fury ("the light of [god name]").                                                                                            | game doc: Naming; Ultimates                                       | open                                             |       |          |
| OQ-12 | Name the Soul Orb and its two modes (Cast Forward, Follower are "names pending").                                                                    | game doc: Artifact                                                | open                                             |       |          |
| OQ-13 | A better name for a minion "hoard" (our docs use "horde"; the requirements doc asks for a better name).                                              | requirements: MVP list                                            | open                                             |       |          |
| OQ-14 | A themed name for the buff/debuff tower ("Need a themed name for these"). Code name stays `BuffTower`.                                               | game doc: Stronghold Defenses                                     | open                                             |       |          |
| OQ-15 | A better, themed name for the "Profile" menu section.                                                                                                | requirements: boot menu                                           | open                                             |       |          |
| OQ-16 | Adopt "blessings" as the in-fiction name for abilities/ability upgrades?                                                                             | game doc: Ability Progression (teal); requirements "(blessings?)" | idea-pending                                     |       |          |
| OQ-17 | Define the summoner held by the capital. Does it do anything?                                                                                        | game doc: Design; Buildings                                       | open                                             |       |          |
| OQ-18 | Fury's dash "[button]", sprint and pick-up/throw have no default binding named.                                                                      | game doc: Ultimates; Passives; Interactives                       | open                                             |       |          |

## Design questions from the game doc

| ID    | Question                                                                                                                                                               | Source                                             | Status                                   | Owner | Decision |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------- | ----- | -------- |
| OQ-19 | Titan objective. Recorded outcome in the source: "decided at the team meeting. The gem explodes mid-game to summon a neutral boss. (Eternal)".                         | game doc: Design; Central boss                     | decided (in source)                      |       |          |
| OQ-20 | Ascendance (form change at buildings): keep, and how does it work?                                                                                                     | game doc: Design (teal); Buildings column (yellow) | idea-pending; needs-planning; post-mvp   |       |          |
| OQ-21 | Is form change class-dependent?                                                                                                                                        | game doc: Design; Form change                      | open; post-mvp                           |       |          |
| OQ-22 | Gem glow: tied to a team's summoning progress (original notes) or to the mid-game timer (meeting)? (The Central boss section still lists the glow under "still open".) | game doc: Design (red)                             | removed                                  |       |          |
| OQ-23 | Central boss as its own game mode?                                                                                                                                     | game doc: Design (red)                             | removed                                  |       |          |
| OQ-24 | Mini-boss final hit: keep or remove the consumable item reward? (No other consumables exist in the design.)                                                            | game doc: Design; Capture zones and mini-bosses    | open                                     |       |          |
| OQ-25 | Ability tree: how many upgrades per tier (N), and what does forgetting one cost? (Requirements doc: "ability upgrade tree still undecided".)                           | game doc: Design (teal); requirements long-term    | idea-pending; post-mvp                   |       |          |
| OQ-26 | Anti-air buildings: keep or cut? (The "Anti-Air Defense: will be added later" paragraph is orange.)                                                                    | game doc: Design (red); Anti-Air Defense (orange)  | removed as a question; anti-air post-mvp |       |          |
| OQ-27 | Multiple maps? (Not for MVP.)                                                                                                                                          | game doc: Design (teal); Map                       | idea-pending; post-mvp                   |       |          |
| OQ-28 | Sub-class structure: a generic damage / balance / support split per class, or mix it up?                                                                               | game doc: Design; Sub-classes                      | open; post-mvp                           |       |          |
| OQ-29 | Should weapons have abilities? ("It may be getting complex.")                                                                                                          | game doc: Design (teal); Weapons                   | idea-pending                             |       |          |
| OQ-30 | One ultimate per class or per sub-class?                                                                                                                               | game doc: Design; Ultimates                        | open                                     |       |          |
| OQ-31 | Finalize the class-switch ultimate penalty (50–100% back on cooldown, never reducing it). "Needs work." Class switching itself is undescribed.                         | game doc: Design; Ultimates                        | open; post-mvp                           |       |          |
| OQ-32 | Describe Slam and Rip & Tear (Rip & Tear has only "Low-health enemies should back up.").                                                                               | game doc: Design; Abilities                        | open                                     |       |          |
| OQ-33 | Barricades needs work (walk on all fours? movement lock; weight; moving obstacle).                                                                                     | game doc: Design; Unique class weapons             | open; post-mvp                           |       |          |
| OQ-34 | Lore names a third Medium faction, but the art theme covers only Light and Dark. Third playable team, or the neutral units' faction?                                   | game doc: Design (teal); Lore; Art Theme           | idea-pending                             |       |          |
| OQ-35 | Lore: "The factions used to live in a strained but organized peace?" (the source's own question).                                                                      | game doc: Lore                                     | open                                     |       |          |
| OQ-36 | Soul Orb Cast Forward turret: health based or time based?                                                                                                              | game doc: Artifact                                 | open                                     |       |          |
| OQ-37 | "Up until the mini-bosses spawn, the capture zones are protected by:" — the sentence is unfinished. Protected by what?                                                 | game doc: Capture zones and mini-bosses            | open                                     |       |          |
| OQ-38 | Add mount entities (Light/Dark skins; lets Warrior-type characters cross the huge map)?                                                                                | game doc: Entity Class Specifics (orange)          | post-mvp                                 |       |          |
| OQ-39 | Every `N`, `X`, `N00%`, `Nx` placeholder in passives, abilities, ultimates and the sprint rule needs a value (durations, percentages, m/s).                            | game doc: Abilities and Interactions; Ultimates    | open (balancing)                         |       |          |
| OQ-40 | Ultimate Plus: which levels unlock it and what it adds.                                                                                                                | game doc: Ability Progression                      | open                                     |       |          |

## Questions raised by reconciling the two documents

These were not asked in either source; they surfaced while writing the reference docs. Details
and the writers' recommendations are in `../suggestions/discrepancies.md`.

| ID    | Question                                                                                                                                                                                                                                            | Source                                                                                        | Status                 | Owner | Decision |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------- | ----- | -------- |
| OQ-41 | Language: the requirements doc says "JavaScript, HTML, and CSS" with TypeScript "only where needed", then "JavaScript, TypeScript, CSS, HTML ONLY". Resolved by brief decision D1: TypeScript everywhere (ADR 0003).                                | reconciliation: requirements doc                                                              | decided (D1)           |       |          |
| OQ-42 | Entity hierarchy: the requirements doc sketches a "neutral entity" class branch (light/medium/heavy camp, boss); the brief models team as a component and camps as structures (D10, ADR 0006).                                                      | reconciliation: requirements doc vs game doc                                                  | decided (D10)          |       |          |
| OQ-43 | Spawn cadence: which spawners run on the 1-minute timer (SpawnerTowers, BuffTowers, the Stronghold?) and what each spawns per cycle (the game doc lists light/medium/heavy per building, the requirements doc gives only sizes and the opening 48). | reconciliation: requirements MVP list vs game doc Buildings                                   | open                   |       |          |
| OQ-44 | Wall HP: the Walls section says "all towers provide the wall extra HP"; the shield-math section counts only buff/debuff towers. Do SpawnerTowers add a wall bar?                                                                                    | reconciliation: game doc Stronghold Defenses                                                  | open                   |       |          |
| OQ-45 | Shield-math example: "it would have 4500 health" is the shield pool (3 × 1500) on top of 1000 base (5500 total) per the following paragraph. Confirm the total is 5500, not 4500.                                                                   | reconciliation: game doc Stronghold Defenses                                                  | open                   |       |          |
| OQ-46 | Capture checkpoints: are checkpoints 1–3 stages of one capture point (each stage spawning its wave) or three zones in sequence along a lane?                                                                                                        | reconciliation: game doc Capture point checkpoints vs requirements "3 central capture points" | open                   |       |          |
| OQ-47 | "Holding a middle zone" (minion level-up): the Cathedral only, or any of the three central zones?                                                                                                                                                   | reconciliation: game doc Minions and lanes vs Capture zones                                   | open                   |       |          |
| OQ-48 | Turrets: only "Warrior-class legends" can enter them (game doc), or any Legend? Should this be a per-class content flag?                                                                                                                            | reconciliation: game doc Turrets                                                              | open                   |       |          |
| OQ-49 | "Destroying or capturing enemy buildings": is there a building-capture mechanic, or is capture only for capture points?                                                                                                                             | reconciliation: game doc Objectives and scoring                                               | open                   |       |          |
| OQ-50 | Armour set: the loadout lists an armour-set slot but no armour exists anywhere else in either source. What is it?                                                                                                                                   | reconciliation: game doc Loadout                                                              | open; post-mvp         |       |          |
| OQ-51 | Legend cap: "add/remove legends (max 10)" — per team (10 v 10) or in total? The brief reads it per team.                                                                                                                                            | reconciliation: requirements developer menu                                                   | open (brief: per team) |       |          |
| OQ-52 | Mini-boss reward "ability XP to spend on abilities" has no sink in the MVP (no ability tree). Does it feed level scaling until the tree exists?                                                                                                     | reconciliation: game doc Capture zones vs Ability Progression                                 | open                   |       |          |
| OQ-53 | Corner camps: the crystal "spawns new bosses every 5 minutes" and "spawns new waves every 4 minutes" (boss-spawn section). Two timers on one crystal, or a revision?                                                                                | reconciliation: game doc Outer Camps vs Minion Buffs on Boss Spawn                            | open                   |       |          |
| OQ-54 | Match length: nothing sets one, but "quarter mark" and "mid-game" need a nominal length. Fixed nominal length with no time limit?                                                                                                                   | reconciliation: game doc timeline                                                             | open                   |       |          |
| OQ-55 | Scoring values: points per kill, structure, capture and hold are unset.                                                                                                                                                                             | reconciliation: game doc Objectives and scoring                                               | open (balancing)       |       |          |
| OQ-56 | Aether: regeneration rate and whether structures refill it are unset; the requirements doc only defines aether as mana spent after cooldown.                                                                                                        | reconciliation: requirements MVP list                                                         | open (balancing)       |       |          |
| OQ-57 | Forest camps: which of the 6 per side are light, medium or heavy camps (the requirements doc names all three kinds)?                                                                                                                                | reconciliation: requirements MVP list and hierarchy                                           | open                   |       |          |
| OQ-58 | Player team: "randomly chosen for player" (requirements). Confirm random, with no choice in the MVP.                                                                                                                                                | reconciliation: requirements MVP list                                                         | open                   |       |          |
| OQ-59 | Lore: the Light and Dark faction descriptions are nearly identical ("favoured order and a heavy hand; grandiose architecture"). Unfinished, or intended?                                                                                            | reconciliation: game doc Lore                                                                 | open                   |       |          |
| OQ-60 | Mid-game loadout changes: allowed anywhere, or only at a BuffTower/Stronghold like blessing upgrades?                                                                                                                                               | reconciliation: game doc Ability Progression                                                  | open                   |       |          |
| OQ-61 | Revive eligibility: what makes a fallen ally "intact"/"not destroyed" (for example a Grasp-parry kill "with no revive")?                                                                                                                            | reconciliation: game doc Classes; Default actions; Interactives                               | open                   |       |          |
| OQ-62 | Sentinel sprint-through: does the 50% health cost apply per wall segment contacted, and what happens to the Sentinel's momentum after the breach?                                                                                                   | reconciliation: game doc Walls                                                                | open                   |       |          |

## Questions raised by the owner's Figma frames

These came from building the owner's character-select and HUD frames
([15-figma-frames-and-creative-decisions.md](15-figma-frames-and-creative-decisions.md)); each is
also asked in `INBOX.md` (HC-Q1 to HC-Q4, HC-F3).

| ID    | Question                                                                                                                                                                                                                                                                                                                 | Source                       | Status | Owner | Decision |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | ------ | ----- | -------- |
| OQ-63 | Weapon level: the HUD draws a weapon-level bar (Low, Mid, Max). What earns it, how many levels are there, what does a level change, and is it per weapon or per match?                                                                                                                                                   | Figma 62:258, 65:721         | open   |       |          |
| OQ-64 | Ultimate tiers and pips: are the ultimate's Low, Mid and Max castable tiers or one meter that must fill (architecture 05 §6)? What do the three charge pips count?                                                                                                                                                       | Figma 62:246, 62:250, 65:722 | open   |       |          |
| OQ-65 | Capture-point bar: progress toward capture or hold strength; the capturing team's colour or not; checkpoint ticks; how a contested or mini-boss-locked point looks.                                                                                                                                                      | Figma 62:425                 | open   |       |          |
| OQ-66 | HUD timer: elapsed match time or a countdown (to the gem or the score cap); does the Cathedral crystal change during the match?                                                                                                                                                                                          | Figma 65:604, 65:623         | open   |       |          |
| OQ-67 | Legend ratings (Damage, Support, Control) per Legend: may the Figma's Cantor values stand on Oracle as `TUNE` placeholders, and what are the other Legends' ratings?                                                                                                                                                     | Figma 58:323; DEC-49         | open   |       |          |
| OQ-68 | Which documented abilities, weapons and artifacts are the Figma's kit names and icons (Aetheric Recall, Staff Proficiency, Arcane Intellect, Unison Ward, Severed Accord; Meteor, Atom, LinkBreak, Aperture; Courage, Sword)?                                                                                            | Figma 62:125, 58:271, 62:231 | open   |       |          |
| OQ-69 | The Legionnaire's and the Sentinel's Legends: their names on each team and their art (their ids and sub-class titles are decided, DEC-49); whether the game doc's Magus focuses (Necromancer debuff, Druid buff, Mage self) carry over to Catalyst, Oracle and Necromancer; the role labels of Catalyst and Necromancer. | Figma 58:271; DEC-49         | open   |       |          |
| OQ-70 | "N Allies" on a class card: teammates on that class now, or a recommended composition?                                                                                                                                                                                                                                   | Figma 72:862 to 72:865       | open   |       |          |

## Engineering notes

- A decided row that changes architecture needs an ADR; a decided row that changes a number is a
  content change with the OQ id in the commit message.
- Content values that depend on an open row carry `// TUNE: OQ-nn` so they can be found when the
  row is decided.

## Related

- [Verbatim game doc](../source/game-project-eternalus-v2.md)
- [Verbatim requirements doc](../../requirements/source/requirements-of-architecture.md)
- [Suggestions: discrepancies](../suggestions/discrepancies.md)
- [Suggestions: naming](../suggestions/naming.md)
- [Suggestions: balancing](../suggestions/balancing.md)
- [Overview and status legend](00-overview-and-status-legend.md)
- [Decisions (ADRs)](../../decisions/)
