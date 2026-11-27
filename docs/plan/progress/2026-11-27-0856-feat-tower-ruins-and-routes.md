---
title: 'Progress 2026-11-27: feat/tower-ruins-and-routes (phase/3 f801af9a merge, #129)'
description: 'Phase 3 / tower ruins, Sam Holtzman + Claude Code: merged phase/3-sprint-3-work f801af9a (#129, map feature link). Only docs/plan/PROGRESS.md conflicted; both sides kept. Full check exit 0.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/tower-ruins-and-routes (phase/3 f801af9a merge, #129)

Phase 3 / tower ruins · feat/tower-ruins-and-routes (PR #98) · Sam Holtzman + Claude Code
(session eternalus-161). The file name uses the UTC time, as the 0705 entry before it does, so
the name order stays the time order.

- What was done: merged `phase/3-sprint-3-work` `f801af9a` (#129, `MapFeatureLink`) on
  `53ee7cb7`. Only `docs/plan/PROGRESS.md` conflicted: both sides appended entries; it keeps
  both, phase/3's entries first. A sorted line comparison shows that the file keeps every line of
  both parents. No code file conflicted. #129 removes the `Structure.mapFeatureId` getter; no code
  on this branch reads it (grep), and the typecheck passes.
- Checks run: `npm run check` (Node 24.21.0) on the merged tree before this entry was added:
  `EXIT=0`. Core "Tests 1978 passed (1978)", protocol "Tests 31 passed (31)", client "Tests 2269
  passed (2269)", server "Tests 163 passed (163)", "Documentation check passed."
  (`eternalus-agent-work/map-stack-2026-11-27/check-98-merge-f801af9a.log`). Then
  `prettier --check` and `npm run docs:check` with this entry.
- Next step: push; then merge this head into #122, #152 and #154.
