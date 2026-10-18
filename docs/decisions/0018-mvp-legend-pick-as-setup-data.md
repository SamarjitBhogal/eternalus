---
title: 0018. MVP Legend pick as setup data
description: Proposed decision for DEC-49 - character select offers a Legend (sub-class) per class as display and setup data, loaded from a display-only core content family and recorded as the selection's spec id, with no simulation behaviour; it amends ADR 0006 point 3 to make only sub-class gameplay post-MVP and adds FR-119 with an FR-057 edit; read this before adding sub-class content, changing character select or relying on FR-057.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-17
tags: [adr, entities, content, character-select, sub-classes]
related:
  - 'docs/decisions/0006-entity-model-inheritance-plus-composition.md'
  - 'docs/decisions/0011-documentation-longevity.md'
  - 'docs/reference/game-design/13-owner-decisions-log.md'
  - 'docs/requirements/06-mvp-requirements.md'
  - 'docs/architecture/04-entity-architecture.md'
  - 'docs/architecture/17-extension-recipes.md'
---

# 0018. MVP Legend pick as setup data

- Status: proposed (drafted 2026-10-17 for the product owner's decision DEC-49, given in chat on
  2026-10-17; accepted when he signs it in `INBOX.md` HC-Q1)
- Date: 2026-10-17

## Context

DEC-49 ([owner decisions log](../reference/game-design/13-owner-decisions-log.md)) makes the
Legend pick part of the MVP character select: after the class, the player picks one of the
class's Legends (sub-classes), shown with its sub-class title, the Legend's name for the player's
team where one exists, its role, description, ratings and detail rows. Three binding texts say
otherwise or constrain the change:

- FR-057 ([MVP requirements](../requirements/06-mvp-requirements.md)) says sub-classes "are not
  built" and lists "Assassin, Knight, Paladin, Colossus, Necromancer, Druid, Mage, Hover, Strafe".
- [ADR 0006](0006-entity-model-inheritance-plus-composition.md) point 3 says "Sub-classes are
  post-MVP".
- NFR-010 changes a requirement only "by ADR plus a catalogue edit, never by a plan or code change
  alone".

Accepted ADRs are records whose bodies are never rewritten
([ADR 0011](0011-documentation-longevity.md) rule 6), so ADR 0006 cannot simply be edited.

## Decision

Proposed.

1. **Character select offers a Legend per class as display and setup data.** Core content gains a
   display-only `LegendSpecDefinition` family (`packages/core/src/content/legends/specs/`), loaded
   and validated through the content rules by `loadDisplayContent()` (architecture 04 §5, DEC-22).
   The session records the pick as `ClassSelection.specId` in the match setup.
2. **No simulation behaviour.** Nothing in the simulation or in a running match reads the pick: it
   gives no stats, abilities, sizes or entity class. Sub-class gameplay (the `LegendSpecDefinition`
   fields a class consumes) stays post-MVP and arrives with recipe R2
   ([17-extension-recipes.md](../architecture/17-extension-recipes.md)).
3. **This amends ADR 0006 point 3** to read, in effect, "sub-class **gameplay** is post-MVP". ADR
   0006's body is not edited; on acceptance its Status line notes the amendment.

### Requirement edits (applied after acceptance)

- A new **FR-119** (MVP): "Character select offers, after the class, a Legend pick per class from
  content (the sub-class title, the Legend's name for the player's team where one exists, role,
  description, ratings, detail rows); the pick is setup data with no gameplay (FR-057); LOCK IN
  needs a Legend when the class offers an available one; a locked card is shown and never
  selectable." Acceptance: "`CharacterSelectState` tests reject locked and foreign Legends and
  accept an available one; `canConfirmSelection` truth table; the Legend name follows the player's
  team." It is listed by exactly one phase doc in `docs/plan/` (the one the implementing branch's
  progress entry names). FR-119 was the next free number on every remote branch on 2026-10-17 and is
  re-checked before the edit.
- FR-057's sub-class list becomes "Velite, Centurion, Praetorian, Colossus, Juggernaut, Catalyst,
  Oracle, Necromancer, Hover, Strafe" (DEC-49; Druid and Mage removed), and FR-057 gains one
  sentence: "Picking a Legend at character select is FR-119 (ADR 0018)."

Catalogue, plan and architecture then agree, as NFR-010 asks.

### Documents to amend if accepted

ADR 0006 keeps its body; its Status line gains "amended by 0018 (Legend pick as setup data)".
`docs/requirements/06-mvp-requirements.md` (FR-057, the new FR-119 row and its traceability rows);
architecture 04 §9 (the player already picks a Legend at character select as setup data) and 17
R2 (the MVP already ships the display and setup part; the recipe adds the gameplay fields and the
`Loadout.specId` path); and this ADR's Status, which becomes "accepted" with the date.

## Consequences

- The Legend ids (`assassin`, `knight`, `paladin`, `colossus`, `juggernaut`, `catalyst`,
  `oracle`, `necromancer`) are permanent content ids once shipped (17 R26).
- Gameplay arrives with R2: the recipe adds the gameplay fields and the `Loadout.specId` path; the
  display fields and the setup-data pick stay.
- Legend names are content per team (DEC-49): a named Legend stores its name for each team, no
  name is computed in code, and a Legend with no name shows its sub-class title alone. Sub-class
  titles, class names and every other string are the same on both teams.
- The branch that implements the pick does not merge before this ADR is accepted (a merge
  precondition in its pull request).
