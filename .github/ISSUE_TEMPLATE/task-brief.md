---
name: Task brief
about: One concern, ready to hand to a teammate or a coding agent
title: '[P<phase>.<sprint>] <verb> <thing>'
labels: task
---

## Goal

<!-- One sentence. One concern per task ("add the Health component", not "add combat"). -->

## Phase / sprint

<!-- e.g. Phase 2, sprint 2.1 — link the checklist line in docs/plan/phase-*.md -->

## Location

<!-- Folder(s) per docs/architecture/02-code-structure.md, e.g. packages/core/src/components/ -->

## Acceptance criteria

- [ ] <!-- Observable behaviour a reviewer can check -->
- [ ] Tests: <!-- which tests, next to which files -->
- [ ] Docs: <!-- which docs / frontmatter / PROGRESS.md entry -->

## Out of scope

<!-- What the implementer must NOT touch (prevents drive-by refactors). -->

## Source

<!-- Requirement ids (FR-/NFR-), reference doc section, ADR. No product decisions inside the task. -->

## Done when

`npm run check` passes locally; PR opened against the phase branch with this issue linked; PROGRESS.md entry appended.
