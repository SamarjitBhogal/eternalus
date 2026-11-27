---
title: 'Progress 2026-11-25: feat/cathedral-eruption-boss (#160 review round 2)'
description: "Phase 3 / sprint 3.6, Aryan Walanj + Claude Code: S8 (the plinth is the gem's carried map object, so the path grid reopens at the eruption) and the R2 nits."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/cathedral-eruption-boss (#160 review round 2)

Phase 3 / sprint 3.6 · feat/cathedral-eruption-boss · Aryan Walanj + Claude Code

- What was done:
  - S8 (R1 B3's way (a)): the gem's structure definition names its plinth (`carriedObjectId`),
    and `Simulation` hands `WorldObjectStore` that link (`carriers`). The plinth is the gem
    entity's map object, so the gem's `entity-removed` destroys it and the pipeline's listener
    reopens the path grid and marks the lane fields dirty, as for any destroyed object.
    `WorldObjectStore.destroy` and the gem system's own call are gone (N4). The eruption test
    now also checks `grid.isWalkableAt` at the gem's place (red with no carriers link).
  - N3: the comment lines this PR added over 100 columns are wrapped (test names and rule strings
    stay on one line).
  - claudiodh's nits: one TSDoc block on `CUTSCENE.shake`; the cut-scene looks the gem up only
    until it finds it.
- Left: B1 and B2 wait on the owner; S7 waits on B2; N1 (`SpawnSystem.ts` and `GuardRoster.ts`
  over 300 lines); N2 (the PR body: a corrected body is drafted, not posted).
- Checks run: `npm run check` exits 1 on timeouts only (the machine under load). Format,
  `check:no-js`, lint, typecheck and knip passed; core "Tests 21 failed | 1835 passed (1856)" and
  client "Tests 1 failed | 2199 passed (2200)", every failure "Test timed out"; protocol "Tests 31
  passed (31)", server "Tests 163 passed (163)". The 16 timed-out files re-run with
  `--maxWorkers=2`: core "Tests 90 passed (90)", client "Tests 1 passed (1)". `npm run build`
  exit 0; "Documentation check passed."
- Next step: post the PR body (drafted in `PR160-BODY.md` outside the repo), re-request swholtzman's and claudiodh's review.
