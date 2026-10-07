---
title: 0011. Documentation longevity
description: Design docs state intent and point at the source of values, interim state lives in one status note, records are never rewritten and bulk doc edits are guarded, so the docs stay true for years; read this before editing several docs at once or writing an architecture doc.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-06
tags: [adr, docs, process, guardrail]
related:
  [
    'docs/requirements/03-organization-guidelines.md',
    'docs/decisions/0008-docs-structure-and-frontmatter.md',
    'docs/decisions/0010-pre-pr-critic-and-ponytail-gate.md',
  ]
---

# 0011. Documentation longevity

- Status: accepted (product owner decision, 2026-10-06)
- Date: 2026-10-06

## Context

The owner requires the documentation to survive a very long time. On 2026-10-06 an automated
sweep was asked to remove stale map statements from about 40 living docs. Its checks asked only
"is this statement true today?", never "will it stay true?". The result was correct line by line
and corrosive as a whole: architecture 08 replaced the target `Renderer` design with today's
interim method list, and architecture 06 grew by more than half by copying tuning values and
implementation detail into the design. Both would have been wrong after the next code or content
change. `npm run docs:check` caught none of it, because links, anchors and frontmatter were all
intact. The sweep was stopped and reverted before anything was committed.

## Decision

Rule OG-12 in `docs/requirements/03-organization-guidelines.md` governs every doc edit:

1. Design docs state intent: decisions, invariants, responsibilities, boundaries, extension
   points and why.
2. A value is named by where it lives, never copied; examples are marked "e.g." and follow from a
   stated rule.
3. Code in a design doc is a labelled contract or a labelled sketch, never copied implementation.
4. The target design stays the design; interim state goes in one "Implementation status" section
   or in `docs/plan/`.
5. Design text changes only for a cited decision, a contract change or a factual error, with the
   smallest edit at the place it applies.
6. Records (accepted ADR bodies, dated changelogs, `PROGRESS.md` entries, dated reviews, prompts
   that have run) are never rewritten; corrections are appended.
7. Headings and frontmatter are stable; renaming a heading updates every inbound link in the same
   change.
8. A bulk doc edit passes a guard before commit: a structural check (headings, frontmatter, no
   record touched) and an independent reviewer who reads the diff against these rules, not
   against the code alone.

## Consequences

- Fewer doc edits per code change, and the ones made are smaller and traceable to a reason.
- Readers find current values in code and content, which cannot drift from themselves.
- Doc sweeps cost a review step; this is accepted as the price of docs that last.
- `npm run docs:check` still guards links and frontmatter; the semantic rules are enforced in
  review (`docs/process/guardrails.md`).
