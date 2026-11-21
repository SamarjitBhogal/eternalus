---
title: Loadout
description: The loadout slots a Legend carries, pre-game configuration with auto-build, the rules for changing a loadout mid-match and persistence to the player profile; read it before working on the LoadoutScreen, the Loadout component or profile persistence.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-28
tags: [reference, game-design, loadout, profile]
paths: ['packages/core/src/loadout/**', 'apps/client/src/ui/screens/LoadoutScreen*']
related:
  - 'docs/reference/game-design/06-abilities-and-progression.md'
  - 'docs/reference/game-design/07-weapons-and-artifacts.md'
  - 'docs/architecture/14-persistence-and-resources.md'
---

# Loadout

**Purpose.** Read this when you work on what a Legend brings into a match and where that choice
is made and stored: the slots, the pre-game screen with auto-build, mid-game changes and the
profile that remembers loadouts between matches. The items that fill the slots are described in
`06-abilities-and-progression.md` and `07-weapons-and-artifacts.md`.

## Loadout slots

From the game doc, per Legend (per class, since abilities, artifacts and skins are
class-specific):

| Slot                      | Filled from                                                                                                               | Status                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Primary weapon            | Any non-unique weapon, or the class's unique weapon                                                                       | **MVP**                                                   |
| Secondary weapon          | As above                                                                                                                  | **MVP-if-time** (one weapon is enough for the MVP attack) |
| Passive ability or aura   | The class's passives (for example Magus: Studious or Necromancy)                                                          | **MVP-if-time**                                           |
| Artifact 1 and artifact 2 | The class's artifacts (gadget slots Z and C)                                                                              | slots **MVP**, artifacts **MVP-if-time**                  |
| Armour set                | Not described anywhere else in the sources                                                                                | **post-MVP**                                              |
| Ability 1, 2 and 3        | Three from the class's ability pool, each with its variety where one exists (pool rule below)                             | **MVP** ("some ability options")                          |
| Ultimate                  | One from the class's ultimates (pool rule below); the slot is implied by "changing abilities or ultimate resets cooldown" | **MVP** (one equipped, chosen from the class's ultimates) |
| Per-class skin selection  | Light and Dark unique skins per class (`10-art-and-lore.md`)                                                              | **post-MVP** (one skin per team in the MVP)               |

**Pool rule (DEC-11, confirmed in chat 2026-10-10).** The owner: "a player chooses 3 abilities and 1
ultimate from the set of abilities and ultimates that are available to their class when
selecting/creating their loadout". Each class's set (its game-doc kit plus the DEC-11 approvals,
listed in `06-abilities-and-progression.md`) is a pool, and the loadout's ability and ultimate
slots are filled from it; the "3 + 1" slot count is unchanged.

The requirements doc's MVP line is "simple loadout options (weapons, some ability options, etc)"
and "can configure loadouts that are saved to the users profile". The armour set has no other
mention in either source (no armour stats, no items); it is kept as a slot in the domain model so
it can be filled later, and is an open question.

## Pre-game configuration and auto-build

- The loadout **can be configured pre-game, with an auto-build option** (game doc).
- Auto-build fills every slot with the class's default choices from content (`Recommendation:`
  a `defaultLoadout` per `LegendDefinition`; the same defaults are what bot Legends use, so the
  bots and the auto-build never disagree).
- The `LoadoutScreen` (React, `apps/client/src/ui/screens/`) edits a `Loadout` value validated
  against content by `packages/core/src/loadout/` (class restrictions, one item per slot, a
  variety only where the ability defines one). Status: **MVP**.

## Mid-game adjustment

From the game doc's progression bullets:

- Players can **override the auto-build mid-game** if needed; the loadout **can be adjusted in
  game**.
- **Changing abilities or the ultimate resets the cooldown**, needing a full recharge before use
  (the ultimate meter goes to zero; abilities go on full cooldown).
- Artifact modes such as the Mortar's fire mode are "selected before spawn", so mode changes
  apply on the next spawn, not immediately.
- Upgrading blessings requires visiting a BuffTower or the Stronghold (post-MVP with the ability
  tree); `Recommendation:` apply the same location rule to mid-game loadout changes so a loadout
  cannot change in the middle of a fight. Recorded as an open question.

Status: **MVP-if-time** (the requirements doc asks only for pre-game configuration).

## Saved to the profile (MVP)

- Loadouts are **saved to the user's profile** (requirements doc) through the
  `PersistenceController` facade into IndexedDB (decided, D3): a `LoadoutRepository` keyed by
  profile and class, with versioned DTOs and migrations
  (`../../architecture/14-persistence-and-resources.md`).
- The profile (themed name wanted; see `11-mvp-scope.md`) also holds match history and settings;
  the loadout is one of its documents.
- A saved loadout that references content that no longer exists (a renamed ID) is repaired by
  auto-build for the missing slot and logged, never crashed on. Content IDs are never renamed
  once a save or a release stores them (`AGENTS.md`), which keeps this rare.

Status: **MVP**.

## Engineering notes

- Domain model: `packages/core/src/loadout/` holds the `Loadout` value type (one ID per slot,
  varieties, modes), `validateLoadout(loadout, content)` and `autoBuild(classId, content)`. It
  is pure; the client persists it and the `Match` composition root passes it into
  `EntityFactory` when spawning the Legend, which fills the `Loadout` component.
- Single place of change: a new slot is one field on the type, one validation rule, one screen
  row and one DTO migration. A new item for an existing slot is content only.
- Bots use the same `autoBuild`, so there is exactly one place that knows what a sensible loadout
  is.
- Invariant: a spawned Legend's `Loadout` component validates against content; a failed
  validation is a diagnostic event, and the factory substitutes the auto-build.

## Related

- [Abilities and progression](06-abilities-and-progression.md)
- [Weapons and artifacts](07-weapons-and-artifacts.md)
- [Classes and sub-classes](01-classes-and-subclasses.md)
- [Controls](09-controls.md)
- [MVP scope](11-mvp-scope.md)
- [Open questions](12-open-questions.md)
- [Architecture: abilities, weapons and loadouts](../../architecture/05-abilities-weapons-and-loadouts.md)
- [Architecture: persistence and resources](../../architecture/14-persistence-and-resources.md)
- [Verbatim source: Loadout, Ability Progression](../source/game-project-eternalus-v2.md)
