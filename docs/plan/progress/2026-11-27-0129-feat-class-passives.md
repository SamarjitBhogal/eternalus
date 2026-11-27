---
title: 'Progress 2026-11-27: feat/class-passives (fold U3: #167 and #166 merged in, DEC-404, DEC-425)'
description: 'Phase 3, combat PR 8, GAME-LOOP-AND-POST-GAME-73 and -74 (Claude Code): merged #167 and #166 into feat/class-passives for the player-stack fold, and recorded the owner answers on HC-Q117 and HC-Q132 (Avalanche) as DEC-404 and DEC-425; docs only besides the merges.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/class-passives (fold U3: #167 and #166 merged in, DEC-404, DEC-425)

Phase 3 / combat PR 8 (class passives) · feat/class-passives · sholtzman + Claude Code (GAME-LOOP-AND-POST-GAME-73, -74)

- What was done: step U3 of the owner's player-stack fold (2026-11-27: merge each leaf into its
  base locally, then one gate, then a fast-forward push).
  - Merged `fix/wide-corner-slide` (#167, `52c55ab4`, HC-B33) with no conflicts.
  - Merged `feat/magus-passives` (#166, `b014951e`, the Magus passives Erudition and
    Necromancy). Three conflicts, all in docs; each keeps both sides: `last-reviewed` in the
    phase 4 plan and game design 12, the phase 4 PR 8 status, and the decisions log (the DEC-367
    batch first, then #166's two 2026-11-23 batches).
  - Recorded the owner's answer on Owner Calls card HC-Q117 (page v103) as DEC-404: during
    Avalanche, a hit on a breakable wall segment or gate breaks it at once, the Sentinel goes
    through and loses no health. Three cases stay open because the card did not ask them: a
    tower or Stronghold hit during Avalanche, the speed after the breach, and a wall that cannot
    break. Owner Calls card HC-Q132 asked them. Not built: Avalanche comes with the Sentinel
    ultimates.
  - Merged `feat/magus-passives` again (#166, `37994b72`: HC-B51 signed off as DEC-419, docs
    only), which came after the first merge. Two conflicts, both two additions at the same
    place; both sides are kept, newest first: the INBOX Done list and the decisions log. The
    open HC-B51 item goes out by the 3-way merge. A line-count check against `b014951e` found
    0 lines dropped and 0 invented.
  - Recorded the owner's answers on card HC-Q132 (pasted 2026-11-27, about 10:08Z) as DEC-425:
    during Avalanche, a tower or the Stronghold loses 5% on a hit and the Sentinel is not stunned
    and loses no health; after a wall breaks, the Sentinel keeps full speed until Avalanche ends
    (6 s, a tuning value); a wall that cannot break bounces it back 3 m with no stun. DEC-404
    gets an "Answered" note. Not built.
  - The critic (architecture-reviewer, 2026-11-27) passed the merge resolution and DEC-404 with
    fixes: 0 blockers, 2 should-fix, 5 nits. Applied: this entry (S1), the open cases named in
    DEC-404 and its INBOX entry with a card (S2, N2), the DEC-367 (4) wording (N1), the PR text
    (N3) and a rewrap in the phase 4 plan (N4). Not applied: N5 (optional; the row already names
    the answers file). Findings:
    `eternalus-agent-work/abilities/pr8-passives/critic-u3-2026-11-27.md` (outside the repo).
    The second #166 merge and DEC-425 came after the critic; both are docs only.
- Checks run: `npm run check` → `EXIT=0` on tree `211d16be` (core 2321 tests, protocol 31, client
  2202, server 85; "Documentation check passed."). After it only this line changed; Prettier and
  the docs check pass on it.
- Next step: the coordinator checks the push script and Sam pushes (fast-forward). GitHub then
  shows #166 and #167 as merged. The Wrecking Run hits PR has no owner yet.
