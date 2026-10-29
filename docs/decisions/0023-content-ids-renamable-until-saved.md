---
title: 0023. Content ids are renamable until saved or released
description: Record of the owner's answer of 2026-10-28 to INBOX HC-Q18 (4), "Every content id" - every kebab-case content id, not only the Legend ids of ADR 0018 point 5, stays renamable as a checked content refactor until a save or a release stores it, which reworded requirement CP-13 - the ADR that NFR-010 asks for a requirement change, written on his delegation of the same day and adding nothing beyond that answer; read this before renaming a content id or changing the id rule.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-28
tags: [adr, requirements, content, naming]
related:
  - 'docs/requirements/02-coding-principles.md'
  - 'docs/requirements/README.md'
  - 'docs/decisions/0018-mvp-legend-pick-as-setup-data.md'
  - 'docs/decisions/0022-fr-111-selection-art-is-mvp.md'
  - 'docs/architecture/17-extension-recipes.md'
  - 'INBOX.md'
---

# 0023. Content ids are renamable until saved or released

- Status: accepted (the product owner's answer to `INBOX.md` HC-Q18 (4) on his non-blocking
  decision page, given in chat on 2026-10-28, and his delegation of this record the same day;
  written and accepted on that delegation, 2026-10-28, as ADR 0022 was)
- Date: 2026-10-28

## Context

ADR 0018 point 5 lets Legend ids change while there are no saves and no release: renaming one is a
content refactor, and a reference the refactor misses must fail the checks, never silently. It
covers Legend ids only. `INBOX.md` HC-Q18 (4) asked the owner whether the rule reaches every
content id; the id wording of `AGENTS.md`, `CONTRIBUTING.md`, CP-13 in
[02-coding-principles.md](../requirements/02-coding-principles.md) and eight other docs ("never
renamed once used") waited for his answer as `INBOX.md` HC-T1 rows T-100 to T-102 and T-136 to
T-144.

On 2026-10-28 he ticked "Every content id", with the note "Whichever fits the architecture best."
The rows were applied the same day (`a1c03fb`), CP-13's among them, citing ADR 0018 point 5. CP-13
is a requirement, and the requirements README ("How to cite and change a requirement") and NFR-010
in [06-mvp-requirements.md](../requirements/06-mvp-requirements.md) change a requirement only
through an ADR the product owner accepts; the architecture critic's check of the applied rows
found the gap the same day. On the same page, asked about the ADR missing for FR-111, he answered:
"Again, not sure what this means. If you're asking about a number for a decision, work item, or
PR, I don't care what number is used. If it's something else, then let me know." This record is
written on that delegation, as ADR 0022 was. 0023 was free on every local and remote branch, in
every local worktree and in `INBOX.md` on 2026-10-28.

## Decision

Record the owner's answer to HC-Q18 (4): the rule of ADR 0018 point 5 reaches every content id
(the kebab-case ids of the definitions in `packages/core/src/content/`), not only Legend ids.

- Until a save or a release stores a content id, renaming it is a content refactor, and a
  reference the refactor misses must fail the checks (a test or the boot-time content validation),
  never silently.
- Once a save or a release stores it, it is never renamed, because replays, loadouts and match
  history reference it ([17](../architecture/17-extension-recipes.md) R26).
- CP-13's statement: before, "Content IDs are kebab-case and never renamed once used"; after,
  "Content IDs are kebab-case and never renamed once a save or a release stores them", citing this
  ADR and `INBOX.md` HC-Q18 (4). Its "Why" is unchanged.

This ADR adds nothing beyond that answer. ADR 0018 is not edited.

## Consequences

- CP-13 now traces to an accepted ADR, as NFR-010 asks. `AGENTS.md`, CP-13, architecture 04 §10,
  17 R26 and the naming suggestions cite this record for the rule.
- The safeguard stays the checks that fail on a missed reference, such as
  `buildDisplayCatalogue.test.ts` ("throws naming a presentation key left without a content entry
  (a renamed or removed id)").
- The TSDoc of `content/legends/locked/lockedClasses.types.ts` and
  `content/legends/specs/legendSpecs.types.ts` cites ADR 0018 point 5 for the same rule; it can
  cite this record when that code next changes.
