---
title: 'Progress 2026-11-27: chore/horde-test-speed (map-stack fold: #152 at 4a83e19a)'
description: 'Phase 3, sholtzman + Claude Code: PR #154 takes in PR #152 at 4a83e19a, which holds #122, #98 and phase/3 8ad77bfd; this head is the one checked tree for all four map-stack PRs.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: chore/horde-test-speed (map-stack fold: #152 at 4a83e19a)

Phase 3 / map work · chore/horde-test-speed (PR #154, into PR #152) · sholtzman + Claude Code
(eternalus-166)

- What was done: merged `feat/map-work-forts-towers` (`4a83e19a`) into the branch. That head holds
  #152's merge of #122 (`6ec9a777`) and of #98 (`bd00dd1f`, which holds phase/3 `8ad77bfd`). The
  four map-stack branches (#98, #122, #152, #154) now all move to this commit, so one full check
  covers all four. Two conflicts, both in append-only files, both sides added at the same place:
  `INBOX.md` (HC-B32 here, newer items there) and the owner decisions log (the DEC-357 batch here,
  the newer batches there). Both sides are kept, the newer batches first; DEC-357 stays directly
  above the DEC-358 batch, as before. Row check against the merge base `bb067900`: 288 decision
  rows = 251 shared + 1 from this branch + 36 from #152, no duplicates. For each file, the merged
  file minus #152's file has the same changed lines as this branch minus the merge base. No code
  changes.
- Checks run: `npm run check` EXIT=0 on tree `def7f526`: core "Tests 2086 passed (2086)", protocol "Tests 31 passed (31)", client "Tests 2297 passed (2297)", server "Tests 163 passed (163)", "Documentation check passed."
- Next step: push this head to #154, #152, #122 and #98 in one push; after CI passes on both
  runners, #98 merges into phase/3. `HORDE_WALK_TIMEOUT_MS` still waits for PR #84.
