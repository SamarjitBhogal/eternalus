---
title: 0018. Sub-classes (Legends) are MVP
description: Decision for DEC-49 and DEC-56, accepted with the owner's corrections of 2026-10-25 - sub-classes (Legends) are MVP; character select offers a Legend pick per class from core content, shipped first as setup data with no gameplay; it amends ADR 0006 point 3, splits FR-057 and adds FR-119, keeps the roster in content files only and treats Legend ids as refactorable until saves exist; read this before adding sub-class content or gameplay, changing character select or relying on FR-057 or FR-119.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-25
tags: [adr, entities, content, character-select, sub-classes]
related:
  - 'docs/decisions/0006-entity-model-inheritance-plus-composition.md'
  - 'docs/decisions/0011-documentation-longevity.md'
  - 'docs/reference/game-design/13-owner-decisions-log.md'
  - 'docs/requirements/06-mvp-requirements.md'
  - 'docs/architecture/04-entity-architecture.md'
  - 'docs/architecture/17-extension-recipes.md'
---

# 0018. Sub-classes (Legends) are MVP

- Status: accepted (product owner decision in chat: accepted 2026-10-24, corrected 2026-10-25
  before it was applied, DEC-56; drafted 2026-10-17 as "MVP Legend pick as setup data" for
  DEC-49; the file keeps its first name so that earlier records still resolve)
- Date: 2026-10-17

## Context

DEC-49 ([owner decisions log](../reference/game-design/13-owner-decisions-log.md)) makes the
Legend pick part of the MVP character select: after the class, the player picks one of the
class's Legends (sub-classes), shown with its sub-class title, the Legend's name for the player's
team where one exists, its role, description, ratings and detail rows. Three binding texts said
otherwise or constrain the change:

- FR-057 ([MVP requirements](../requirements/06-mvp-requirements.md)) listed the game document's
  sub-classes, together with mid-match class switching, as "not built".
- [ADR 0006](0006-entity-model-inheritance-plus-composition.md) point 3 says "Sub-classes are
  post-MVP".
- NFR-010 changes a requirement only "by ADR plus a catalogue edit, never by a plan or code change
  alone".

Accepted ADRs are records whose bodies are never rewritten
([ADR 0011](0011-documentation-longevity.md) rule 6), so ADR 0006 cannot simply be edited.

The first draft of this ADR kept sub-class gameplay post-MVP. The owner accepted it on 2026-10-24
and corrected it on 2026-10-25, before it was applied (DEC-56). His words: "Sub-classes are not
post-mvp. We allow them to be selected today"; "these may change again in the future so they (and
the subclass legend names e.g. Elarion) should not be a difficult thing to alter. Changing a
roster, for example, is reflected where the roster is mentioned"; "code may use them, but right
now there are no saves, nor any release. if i choose to change them next week, nothing should
explode".

## Decision

1. **Sub-classes (Legends) are MVP.** The player picks a Legend per class at character select
   today. Sub-class gameplay (the `LegendSpecDefinition` fields a class consumes, recipe R2 in
   [17-extension-recipes.md](../architecture/17-extension-recipes.md)) is MVP scope too; which
   phase builds it is an open owner question (`INBOX.md` HC-Q17), not scheduled by this ADR.
2. **The pick ships first as setup data.** Core content holds a display-only
   `LegendSpecDefinition` family (`packages/core/src/content/legends/specs/`), loaded and
   validated through the content rules by `loadDisplayContent()` (architecture 04 §5, DEC-22).
   The session records the pick as `ClassSelection.specId` in the match setup. Until the gameplay
   is built, nothing in the simulation or in a running match reads it: it gives no stats,
   abilities, sizes or entity class.
3. **This amends ADR 0006 point 3.** Its "Sub-classes are post-MVP" is superseded; D11's
   data-first rule stands (a sub-class is `LegendSpecDefinition` data consumed by its class, and a
   subclass is added only for unique behaviour, within the depth limit). ADR 0006's body is not
   edited; its Status line notes the amendment.
4. **The roster lives in content only.** Sub-class titles, Legend names (per team), class display
   names, team names and Legend ids are content: the Legend specs in
   `packages/core/src/content/legends/specs/`, the class files beside them in
   `packages/core/src/content/legends/`, the locked cards in `content/legends/locked/` and the
   team names in `content/teams/teamDisplayNames.ts`. Requirements, design docs and plans name
   those files and never copy the roster ([ADR 0011](0011-documentation-longevity.md): name where
   a value lives), so a roster change is a content edit that shows wherever the roster is shown.
   Historical records keep what they recorded.
5. **Legend ids can still change.** There are no saves and no release yet. Until saves exist,
   renaming a Legend id is a content refactor, and a reference the refactor misses must fail
   loudly in the checks (a test or the boot-time content validation), never silently. 17 R26's
   rule that an id is never renamed once used applies once saves or a release reference it.

### Requirement edits (applied on acceptance)

- **FR-057** keeps only mid-match class switching and its ultimate penalty, post-MVP and otherwise
  unchanged; sub-classes leave it for FR-119.
- A new **FR-119** (MVP) covers sub-classes: character select offers, after the class, a Legend
  pick per class from content, the pick is setup data until its gameplay is built, LOCK IN needs a
  Legend when the class offers an available one, and a locked card is shown and never selectable;
  it names the content files and copies no roster (point 4). Acceptance: "`CharacterSelectState`
  tests reject locked and foreign Legends and accept an available one; `canConfirmSelection`
  truth table; the Legend name follows the player's team", plus D11's data-first rule. The pick
  is listed by exactly one phase doc in `docs/plan/` (the one the implementing branch's progress
  entry names); the phase of the gameplay is open (point 1). FR-119 was the next free number on
  every local and remote branch on 2026-10-25.

Catalogue, plan and architecture then agree, as NFR-010 asks.

### Documents amended on acceptance

ADR 0006's Status line ("amended by 0018: sub-classes are MVP"; its body is not edited);
`docs/requirements/06-mvp-requirements.md` (FR-057, FR-119 and its traceability rows);
architecture 04 §9, 17 R2 and the architecture README's D11 row; the phase 2 plan's requirement
areas and the phase 4 plan's sprint 4.1 extension-point item; and this ADR's Status. The id
wording of `AGENTS.md`, architecture 04 §10 and 17 R26 (point 5) changes design text beyond this
list, so it waits for the owner in `INBOX.md` HC-T1.

## Consequences

- Sub-class gameplay arrives through recipe R2 in the phase the owner names: the recipe adds the
  gameplay fields and the `Loadout.specId` path; the display fields and the setup-data pick stay.
- Legend names are content per team (DEC-49): a named Legend stores its name for each team, no
  name is computed in code, and a Legend with no name shows its sub-class title alone. Sub-class
  titles, class names and every other string are the same on both teams.
- A roster change (a title, a Legend name, a display name, an id) is a content edit plus the
  fixtures that name it; a doc that names the content files needs no edit.
- The branch that implements the pick did not merge before this ADR was accepted (a merge
  precondition in its pull request).
