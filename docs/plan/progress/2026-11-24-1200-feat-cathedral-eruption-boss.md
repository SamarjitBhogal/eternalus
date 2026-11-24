---
title: 'Progress 2026-11-24: feat/cathedral-eruption-boss (#160 review round 1)'
description: "Phase 3 / sprint 3.6, Aryan Walanj + Claude Code: merged #132 (DEC-346 plinth) and phase/3 (#130), fixed swholtzman's #160 review B3, B4, S1 (interim note), S2 to S6 and the code nits."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-24
tags: [plan, progress, log]
---

# Progress 2026-11-24: feat/cathedral-eruption-boss (#160 review round 1)

Phase 3 / sprint 3.6 · feat/cathedral-eruption-boss · Aryan Walanj + Claude Code

- What was done:
  - Merged #132 `8fde5fc0` (DEC-346: the gem's plinth blocks movement, no touch strike) and
    phase/3 `39717a6b` (#130 checkpoint defenders). Conflicts kept both sides; the eruption
    keeps only the gem removal, since the touch strike is gone.
  - B3: the eruption destroys the gem's plinth (`CATHEDRAL_GEM.plinthObjectId`,
    `WorldObjectStore.destroy`); a post that waits for the eruption keeps its ring point, so the
    boss stands at the centre (it stood 7.5 m off it after the #132 merge).
  - B4: doc 03's `entity-removed` row says `DeathSystem` only again; `CathedralGemSystem`'s
    removal is listed as interim in 03 §12.
  - S1: doc 12 §13 records `isGemErupted` as the interim for `atmosphere` (the full `atmosphere`
    build is left for later).
  - S2: the activation `if` chain is the `GUARD_FIRST_TICKS` registry.
  - S3: the no-respawn test asserts the boss's post has no refill tick.
  - S4: `checkEruptionPlan` rejects at load a summoned `bossId` that no gem-eruption post holds.
  - S5: not built as a load check. It rejected the test fixture maps (52 core tests: their
    towers sit within reach of the Cathedral), and a Cathedral checkpoint's defenders (#130) are
    leashed to the zone itself, so no load check can promise it. The seed test stays; the
    defenders question is `INBOX.md` item (10).
  - Critic: S2's two `firstTick` wrappers are one; a `WorldObjectStore.destroy` unit test.
  - S6: `INBOX.md` item (5) asks about acceleration, mass and vision too.
  - Nits: the DEC-83 citation, the shared `GEM_ERUPTION_ENTRY_ID`, and `CUTSCENE.shake.verticalShare`.
- Left: B1 and B2 wait on the owner; S7 waits on B2; `SpawnSystem.ts` is still 332 lines (S1's
  full `atmosphere` build would drop its eruption queue).
- Checks run: `npm run check` exits 1 on timeouts only (two other worktrees were running their
  checks at the same time). Format, `check:no-js`, lint, typecheck and knip passed; core "Tests 5
  failed | 1767 passed (1772)", each failure "Test timed out" (`replay`, `Simulation.flowFields`,
  `Simulation.duel`); protocol "Tests 29 passed (29)", client "Tests 2098 passed (2098)", server
  "Tests 114 passed (114)". The three files re-run with `--maxWorkers=2`: "Tests 17 passed
  (17)". `npm run build` exit 0; "Documentation check passed."
- Next step: push, ask swholtzman to re-review.
