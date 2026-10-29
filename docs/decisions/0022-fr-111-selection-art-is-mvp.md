---
title: 0022. FR-111 - the owner's selection-screen art is MVP
description: Record of the owner's decision of 2026-10-28 that the character art on the selection screen is his Figma art, MVP and interim until a digital artist is employed, which reworded requirement FR-111 - the ADR that NFR-010 asks for a requirement change, written on his delegation of the same day and adding nothing beyond that decision; read this before changing FR-111 or the selection-screen art's scope.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-28
tags: [adr, requirements, art, character-select, scope]
related:
  - 'docs/requirements/06-mvp-requirements.md'
  - 'docs/requirements/README.md'
  - 'docs/reference/game-design/13-owner-decisions-log.md'
  - 'docs/changelog/pr-feat-hud-and-character-select.md'
  - 'INBOX.md'
---

# 0022. FR-111 - the owner's selection-screen art is MVP

- Status: accepted (the product owner's decision in chat, 2026-10-28, on the selection-screen art,
  recorded in the decisions log's appended note to DEC-51, and his delegation of this record the
  same day; written and accepted on that delegation, 2026-10-28)
- Date: 2026-10-28

## Context

The requirements README ("How to cite and change a requirement") and NFR-010 in
[06-mvp-requirements.md](../requirements/06-mvp-requirements.md) change a requirement only
through an ADR the product owner accepts, plus the catalogue edit in the same pull request.

On 2026-10-28, `feat/hud-and-character-select` reworded FR-111 (commit `7b87f76`) from the owner's
answer to `INBOX.md` HC-Q7 (1), which had told him that his answer would decide FR-111's wording:
"Art is MVP; terms and credit in the note"; "The art will change when a real Digital Artist is
found and employed for the project. For the time-being, the art in the Figma is what is included.
More artwork will be uploaded in the future." No ADR was written, and the docs round flagged the
gap. Asked whether to draft an ADR, revert FR-111 or keep the edit, he answered: "Again, not sure
what this means. If you're asking about a number for a decision, work item, or PR, I don't care
what number is used. If it's something else, then let me know." This record is written on that
delegation of the bookkeeping. Number 0021 is reserved in prose by the game-loop plan
(`docs/game-loop-and-results-plan`, for its King taxonomy ADR), and 0022 was free on every local
and remote branch on 2026-10-28.

## Decision

Record the owner's decision of 2026-10-28 as the decisions log states it in its note to DEC-51:
the character art on the selection screen is the owner's art from his Figma frames; it is MVP,
interim until a digital artist is employed for the project, and more artwork follows. FR-111
reads as reworded in `7b87f76`:

- Statement: before, "high-quality character art on the selection screen is not built"; after,
  "The character art on the selection screen is the owner's art from his Figma frames (DEC-51),
  interim until a digital artist is employed for the project; more artwork follows."
- Source: DEC-51 (the owner's answer of 2026-10-28) is added.
- Status: the selection art moves from **post-MVP** to **MVP** (interim, DEC-51).
- Acceptance and phase: unchanged.

This ADR adds nothing beyond that decision.

## Consequences

- FR-111 now traces to an accepted ADR, as NFR-010 asks.
- References 10 (art and lore) and 11 (MVP scope) still list the selection-screen art as post-MVP;
  their edits wait in `INBOX.md` HC-T1 (rows T-155 to T-157), which the owner asked to have
  explained first.
- FR-111's acceptance ("no screen depends on a character portrait asset") was left as it was; the
  selection screens show portraits from the asset manifest, and the wording of that line is the
  owner's to settle (`INBOX.md` HC-Q7).
