---
title: Legend team brief (2026-10-10)
description: One-stop brief for the teammates implementing Legend entities and abilities after the owner's 2026-10-10 decisions - the approved abilities and alternate ultimates per class, the new and changed status effects, the Duel rules that touch abilities, what is still open, which architecture docs govern the work and where to ask; read it before starting any Legend, ability or status-effect task.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-10
tags: [plan, legends, abilities, status-effects, duel, brief]
related:
  - 'docs/reference/game-design/13-owner-decisions-log.md'
  - 'docs/reference/suggestions/more-abilities.md'
  - 'docs/reference/game-design/06-abilities-and-progression.md'
  - 'docs/architecture/05-abilities-weapons-and-loadouts.md'
  - 'docs/plan/phase-4-legends-abilities-and-loadouts.md'
  - 'docs/reviews/2026-10-10-new-requirements-impact.md'
---

# Legend team brief (2026-10-10)

**Purpose.** Read this before you implement a Legend class, an ability, an ultimate or a status
effect. It gathers what the owner decided on 2026-10-10 (DEC-11, DEC-12, DEC-36 in the
[decisions log](../reference/game-design/13-owner-decisions-log.md)) and points to where each rule
and number lives. It decides nothing. Where a rule is still open, it says so; do not fill the gap
yourself (`AGENTS.md`, "Never make product or game-design decisions").

## 1. What changed

- **DEC-11:** each class gets more approved abilities and one alternate ultimate (§2), all MVP,
  on top of its game-doc kit, which stays MVP. Each class's set is a **pool**: "a player chooses
  3 abilities and 1 ultimate from the set of abilities and ultimates that are available to their
  class when selecting/creating their loadout" (owner, confirmed in chat 2026-10-10). Colossus
  Roar **fears** instead of taunting. An enemy Sentinel's **Sunder shatters Sanctuary**.
- **DEC-12:** a new debuff, **`insanity`** (the owner's name), applied by volatile corner-camp
  crystals. Description and icon only for now.
- **DEC-36 (Duel mode):** the ultimate's cooldown persists through death; the other abilities
  reset to fully cooled down on death (§4). Set by the course instructor, like DEC-37's server:
  planned now; must be implemented by the end of Sprint 3 (2026-11-13).
- **DEC-13:** the planned match is 30 minutes, which affects pacing assumptions such as how often
  an ultimate charges in a match.

## 2. Abilities and ultimates per class

Each table is the class's **pool**: a loadout equips 3 of its abilities and 1 of its ultimates
(DEC-11, confirmed in chat 2026-10-10). "Source" is where the item comes from and "Card" where it
is described. "Composes" copies the card's effect kinds; the game doc names none for its own
items, except the two that 05 §4 works through. Costs, cooldowns and magnitudes live in
[`balancing.md`](../reference/suggestions/balancing.md#aether-costs-and-cooldowns-for-the-3--1-abilities--mvp)
for the game-doc abilities and ultimates and for Hamstring, Shield Wall and Sanctuary. **Every
other newly approved item is unpriced: TBD (owner).** The proposal cards carry `Recommendation:`
values that are not decisions.

### Warrior

| Kind               | Name           | Source                                    | Status | Composes (effect kinds, from the card) | Card                                                                                                  |
| ------------------ | -------------- | ----------------------------------------- | ------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Ability            | Veil           | game doc                                  | MVP    | —                                      | [06 Abilities](../reference/game-design/06-abilities-and-progression.md#abilities)                    |
| Ability            | Blade Runner   | game doc                                  | MVP    | worked example in 05 §4                | [06 Abilities](../reference/game-design/06-abilities-and-progression.md#abilities)                    |
| Ability            | Hamstring      | DEC-11                                    | MVP    | projectile, damage, debuff             | [more-abilities §2](../reference/suggestions/more-abilities.md#2-warrior-formerly-assault--mvp-class) |
| Ability            | Fan of Sorrows | DEC-11 (MVP confirmed in chat 2026-10-10) | MVP    | projectile ×5, damage, debuff          | [more-abilities §2](../reference/suggestions/more-abilities.md#2-warrior-formerly-assault--mvp-class) |
| Ultimate           | Fury           | game doc                                  | MVP    | —                                      | [06 Ultimates](../reference/game-design/06-abilities-and-progression.md#ultimates)                    |
| Ultimate (altern.) | Eclipse        | DEC-11                                    | MVP    | zone, buff, debuff                     | [more-abilities §2](../reference/suggestions/more-abilities.md#2-warrior-formerly-assault--mvp-class) |

### Sentinel

| Kind               | Name          | Source                                    | Status                             | Composes (effect kinds, from the card)     | Card                                                                                  |
| ------------------ | ------------- | ----------------------------------------- | ---------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| Ability            | Rip & Tear    | game doc                                  | MVP (confirmed in chat 2026-10-10) | — (undescribed, OQ-32)                     | [06 Abilities](../reference/game-design/06-abilities-and-progression.md#abilities)    |
| Ability            | Slam          | game doc                                  | MVP                                | —                                          | [06 Abilities](../reference/game-design/06-abilities-and-progression.md#abilities)    |
| Ability            | Shield Wall   | DEC-11                                    | MVP                                | summon (`obstacle`), knockback (`knockup`) | [more-abilities §3](../reference/suggestions/more-abilities.md#3-sentinel--mvp-class) |
| Ability            | Sunder        | DEC-11 (MVP confirmed in chat 2026-10-10) | MVP                                | zone (line), damage, debuff / knockback    | [more-abilities §3](../reference/suggestions/more-abilities.md#3-sentinel--mvp-class) |
| Ability            | Colossus Roar | DEC-11 (MVP confirmed in chat 2026-10-10) | MVP                                | debuff (`feared`, `slowed`), buff          | [more-abilities §3](../reference/suggestions/more-abilities.md#3-sentinel--mvp-class) |
| Ultimate           | Berserk       | game doc                                  | MVP                                | —                                          | [06 Ultimates](../reference/game-design/06-abilities-and-progression.md#ultimates)    |
| Ultimate           | Meteor Fall   | game doc                                  | MVP (confirmed in chat 2026-10-10) | —                                          | [06 Ultimates](../reference/game-design/06-abilities-and-progression.md#ultimates)    |
| Ultimate (altern.) | Avalanche     | DEC-11                                    | MVP                                | buff, dash (continuous), knockback, damage | [more-abilities §3](../reference/suggestions/more-abilities.md#3-sentinel--mvp-class) |

### Magus

| Kind               | Name         | Source                                    | Status                             | Composes (effect kinds, from the card)        | Card                                                                               |
| ------------------ | ------------ | ----------------------------------------- | ---------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| Ability            | Imbue        | game doc                                  | MVP                                | —                                             | [06 Abilities](../reference/game-design/06-abilities-and-progression.md#abilities) |
| Ability            | Shockwave    | game doc                                  | MVP                                | —                                             | [06 Abilities](../reference/game-design/06-abilities-and-progression.md#abilities) |
| Ability            | Sanctuary    | DEC-11                                    | MVP                                | zone, heal / damage, debuff                   | [more-abilities §4](../reference/suggestions/more-abilities.md#4-magus--mvp-class) |
| Ability            | Aether Lance | DEC-11 (MVP confirmed in chat 2026-10-10) | MVP                                | projectile, damage, debuff (`marked`), reveal | [more-abilities §4](../reference/suggestions/more-abilities.md#4-magus--mvp-class) |
| Ultimate           | Death Ray    | game doc                                  | MVP                                | —                                             | [06 Ultimates](../reference/game-design/06-abilities-and-progression.md#ultimates) |
| Ultimate           | Nova         | game doc                                  | MVP (confirmed in chat 2026-10-10) | worked example in 05 §4                       | [06 Ultimates](../reference/game-design/06-abilities-and-progression.md#ultimates) |
| Ultimate (altern.) | Last Rites   | DEC-11                                    | MVP                                | revive, heal, buff                            | [more-abilities §4](../reference/suggestions/more-abilities.md#4-magus--mvp-class) |

Passives, Revive and pick-up are unchanged
([01 Classes](../reference/game-design/01-classes-and-subclasses.md)).

**Effect kinds the approvals pull forward.** Architecture 05 §17 lists `summon` (Shield Wall) as
MVP-if-time and `reveal` (Aether Lance) as post-MVP, and Avalanche needs a continuous `dash`.
Changing those statuses edits an architecture doc, so it needs the owner's approval first (open in
`INBOX.md`, "DEC-11 — architecture approvals").

## 3. New and changed status effects

Proposed semantics for every status are in
[more-abilities §7](../reference/suggestions/more-abilities.md#7-proposed-status-effects). A new
status is content only (05 §8; [recipe R9](../architecture/17-extension-recipes.md#r9-add-a-status-effect)).

- **`feared` (new, DEC-11).** Applied by Colossus Roar (in place of its old `taunted`) and by Last
  Rites' Dirge variety. **What a feared unit does is open**, and so is whether `control-immune`
  covers it and whether it applies to human Legends. Colossus Roar's card says fear is bot-only
  and Legends only get the slow; that stays as written until the owner answers whether it holds
  in Duels too and what `feared` does to bots (`INBOX.md` DEC-11). The card cites
  `mechanics-ideas.md` for "bot-only", but that file has no such text; the source is asked there
  too. Bot controllers will have to obey it (architecture 11 §4). Until then, build the rest of
  Colossus Roar and do not invent fear's behaviour. Architecture 05 §8's id list does not name
  `feared` yet (owner).
- **`taunted` (changed).** No longer applied by Colossus Roar; it stays for Mirror of Ash and the
  Warhorn (both post-MVP).
- **`insanity` (new, DEC-12).** A debuff from the shockwave of a destroyed volatile corner-camp
  crystal. For now it is a `StatusEffectDefinition` with a description and an icon and **no
  modifiers or flags**. The name is the owner's; its description and an icon (a placeholder is
  fine) may be added now. Its effect and duration are TBD (owner). Any icon, placeholder included,
  is an asset and needs a licence (`AGENTS.md`). Corner camps are MVP-if-time and first in the cut
  order (DEC-07).
- **Sunder shatters Sanctuary (DEC-11).** Only an enemy Sentinel's Sunder is named. Interactions
  between abilities are `ComboRule` listeners on `ability-cast` in `abilities/combos/` (05 §4),
  never code inside either ability. The impact review reads it as Sunder's line ending an enemy
  Sanctuary zone it crosses (AB-4); confirm with the owner if more is meant. The owner confirmed
  it MVP in chat on 2026-10-10 ("all of these for MVP"); 05 §17 still lists combos as
  MVP-if-time, an architecture approval open in `INBOX.md` (AB-4).

## 4. Duel rules that touch abilities (DEC-36)

The owner's rule: "Your cooldown for an ultimate persists through life and death, where your other
abilities have standard cooldown and reset to fully cooled down upon death."

- **Conflict (open, Q9; see
  [plan §9](multiplayer-and-scalability-plan.md#9-open-questions-for-the-owner)).** In the design
  the ultimate has no cooldown. It is a charge meter filled by kills, assists and objective damage,
  never passively, and it loses N% on death (reference
  [06 Ultimates](../reference/game-design/06-abilities-and-progression.md#ultimates); architecture
  05 §6 `UltimateChargeRule`; FR-059). In a Duel, is the ultimate a time cooldown, or the meter
  with no loss on death? Q10 (see plan §9) asks whether the reset on death also applies in 10v10.
- **State outlives the entity.** `DeathSystem` removes the dead (03 §4) and each `AbilityRuntime`
  dies with its entity (05 §6). FR-051 already asks a respawned Legend to keep its ultimate
  charge, so per-player ability state across lives is needed in both modes. Where it lives is an
  architecture call for the owner (impact review §2.5).
- **What does not foreclose either answer.** `AbilityRuntime.cooldownUntilTick` is a stamp, never
  a timer (05 §6), so "reset to ready" is one write. Which slots reset on death should be data
  per mode, never `if (mode === 'duel')` (`AGENTS.md` rule 12; netcode research §5).
- **Fear in a Duel.** Colossus Roar's card gives Legends only the slow, so against another human
  it is a slow and a damage reduction; whether that holds in Duels is open (Q14, `INBOX.md`
  DEC-11).
- **Invisibility.** Veil and Eclipse hide a Legend; whether that can leak to the opponent depends
  on the networking model (open, Q2; see plan §9).
- **Round reset (open; see
  [plan §9](multiplayer-and-scalability-plan.md#9-open-questions-for-the-owner), "Round reset").**
  The plan asks what a round reset does with projectiles and zones still in flight, aether and
  status effects. Ability-placed entities belong
  to that question, and the Legend team implements them: Shield Wall's rampart (`summon`),
  Sanctuary's circle and burning ground such as Blade Runner (Magical)'s flame path. The owner's
  rule keeps map damage and resets only the players; whether these count as either is part of the
  question, so leave their reset behaviour to the answer and keep it data per mode, as above.

## 5. Still open for the owner

| Question                                                                                                                 | Id        | Asked in                                                                      |
| ------------------------------------------------------------------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------- |
| Does "Legends only get the slow" hold in Duels; what `feared` does to bots; `control-immune`; the source of "bot-only"   | Q5, Q14   | `INBOX.md` DEC-11                                                             |
| Costs, cooldowns and magnitudes of the unpriced approved items, or may agents use `TUNE` placeholders?                   | AB-6      | `INBOX.md` DEC-11                                                             |
| `insanity`'s effect and duration; when crystals turn volatile; a volatile crystal's health and who can break it          | Q15       | `INBOX.md` DEC-12                                                             |
| Duel ultimate: time cooldown or meter; reset on death in 10v10                                                           | Q9, Q10   | [plan §9](multiplayer-and-scalability-plan.md#9-open-questions-for-the-owner) |
| Round reset, including ability-placed entities (Shield Wall, Sanctuary, burning ground)                                  | —         | [plan §9](multiplayer-and-scalability-plan.md#9-open-questions-for-the-owner) |
| 05 §8 and §17: add `feared` and `insanity`; statuses of `summon`, `reveal` and the Sunder–Sanctuary combo (architecture) | AB-3…AB-5 | `INBOX.md` DEC-11 (architecture approvals)                                    |

The ids are those of the
[impact review](../reviews/2026-10-10-new-requirements-impact.md#8-open-questions-for-the-owner);
the Duel ones are also among the plan's questions (see plan §9). Answered in chat on 2026-10-10:
Q3 (each class's set is a pool, and Rip & Tear stays) and Q4 (Meteor Fall and Nova stay MVP).

## 6. Governing docs

- **Architecture 05** ([abilities, weapons and loadouts](../architecture/05-abilities-weapons-and-loadouts.md)):
  §2 definitions, §3 effect strategies, §4 combos, §5 restrictions, §6 runtime, aether and the
  ultimate meter, §7 cast lifecycle, §8 status effects, §12 loadout, §14 registry, §17 MVP status.
- **Architecture 04** ([entity architecture](../architecture/04-entity-architecture.md)): §1 family
  tree, §3 components, §4 strategies, §5 type objects, §6 factory and registry, §12 worked example
  of a Legend class.
- **Architecture 03** ([game model](../architecture/03-game-model.md)): §3 commands
  (`cast-ability`), §4 events (`ability-cast`, `entity-died`), §8 determinism, §9 the hasher.
- **Architecture 11 §4** for the controllers that must obey `feared` (the minions and AI lane).
- Recipes and skills: [R8 Add an ability](../architecture/17-extension-recipes.md#r8-add-an-ability),
  R9 Add a status effect; the `new-ability`, `new-entity` and `new-content` skills.
- Plan: [Phase 4](phase-4-legends-abilities-and-loadouts.md) (sprint 4.3 grows with DEC-11).

Edits to `docs/architecture/`, `docs/decisions/` or any `AGENTS.md` need the owner's approval
first.

## 7. Where to ask

- **Product questions** (abilities, numbers, status behaviour): the open items under "Decisions
  needed from Sam" in `INBOX.md`. Add a new item if yours is not there.
- **Duel and server questions:** `docs/plan/multiplayer-and-scalability-plan.md`.
- **Architecture** (05 §17 statuses, per-player ability state, combos): sholtzman, the architecture
  owner, through `INBOX.md`.
- **Bots obeying `feared`, crystals and mobs:** Samarjit Bhogal, who owns minions and mobs
  (DEC-33, on `chore/sprint-1-audit`).
- Phase 4 owners are not assigned yet (Sprint 1 audit AD-17).

## Related

- [Owner decisions log](../reference/game-design/13-owner-decisions-log.md) (DEC-11, DEC-12,
  DEC-13, DEC-36)
- [More abilities](../reference/suggestions/more-abilities.md) ·
  [Abilities and progression](../reference/game-design/06-abilities-and-progression.md) ·
  [Loadout](../reference/game-design/08-loadout.md) ·
  [Balancing](../reference/suggestions/balancing.md)
- [New requirements impact](../reviews/2026-10-10-new-requirements-impact.md) §2.5, §4
