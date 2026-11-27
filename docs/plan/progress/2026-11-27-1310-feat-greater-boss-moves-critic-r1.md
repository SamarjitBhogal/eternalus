---
title: 'Progress 2026-11-27: feat/greater-boss-moves (merge of #160, critic rounds 1 and 2 fixes)'
description: 'Phase 3 / Cathedral, swholtzman reviewer + Claude Code: #164 merged with #160 on phase/3 e3521feb, E8 re-applied, critic rounds 1 and 2 fixed (StateHasher tests, TeamKillAwards split, waiting-killer test, airborne-push docs, DEC-416 wording).'
audience: [humans, agents]
status: active
owner: Aryan976503
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/greater-boss-moves (merge of #160, critic rounds 1 and 2 fixes)

Phase 3 / Cathedral · feat/greater-boss-moves (PR #164), on `b365146b` · swholtzman reviewer
(PR-REVIEW-90_91-24, -25 and -26) + Claude Code

- What was done:
  - Merge `65f1b78f`: #164 `b365146b` with #160 `5ac24b4c` (#160 with phase/3 `e3521feb`). It
    replaces the base `96ddc1a0` that the 0745 entry names. It adds a `MovementSystem` test: a
    push moves an airborne unit once and the unit keeps its takeoff velocity. Red check: moving by
    `takeStep()` alone failed 3 tests; moving by the velocity alone failed 2.
  - E8 re-applied as `7a1d399a` on the merge (DEC-371 E8, DEC-416; see the 0745 entry).
  - Critic round 1 (no blockers) fixed: two `StateHasher` tests, for the last Legend hitter and for
    the owed `levels`; deleting either hash line turns its test red. `systems/TeamKillAwards` now
    holds the boss rewards (the shares, the caps, the last-hitter boss list for `KillCredit`), with
    its own test; `ProgressionSystem` is 310 lines (was 376). Putting `LastLegendHits` before the
    killing Legend in `awardFor` turns the new unit test red. Doc 10 and `INBOX.md` (DEC-420 (9))
    now say that a knockback moves a Legend in the air once. The DEC-416 row now says that DEC-79
    gives no points and that the code also counts no boss kill. `INBOX.md` has two new items: the
    boss kill on the scoreboard (owner question) and `KillCredit`'s two jobs (better than design).
    Nits: `compareById` in `LastLegendHits`, `credit` TSDoc, a wrapped comment line.
  - Critic round 2 (no blockers) fixed: through the real pipeline, the "killing Legend first" order
    matters in one case, a killing Legend that waits to respawn. `KillCredit.recordHit` skips an
    attacker that is not in the store, so `LastLegendHits` still names an earlier Legend of its
    team. The new `ProgressionSystem` test "owes the 5 to the waiting killer, not to a living mate
    whose hit the boss remembers" covers that case. Red check: with `LastLegendHits` first in
    `awardFor`, that test failed (1 of 34). No Legend projectile or damage status lands after death
    yet, so a match does not reach this case today. Nits: wrapped lines (the `ProgressionSystem`
    TSDoc, the two doc 10 notes); no `TeamKillRewards` alias; `lastHitterBossIds` returns
    `readonly string[]`; a comment says why the killer comes first; the test fixture is `TestUnit`
    and the cap test uses a `team-kill` award; `INBOX.md` says that a push in the air keeps today's
    behaviour (no owner ruling), that scoreboard option B also overrides DEC-79's "A non-Legend last
    hit gives no kill", and names `TeamKillAwards.cappedXp` in the PR #99 item; doc 05 `paths` names
    `systems/TeamKillAwards*`. New `INBOX.md` item (better than design): one "is this a Legend?"
    type guard. Not taken: the `as unknown as Legend` cast in `StateHasher.test.ts` stays
    (`RespawnQueue.add` takes a Legend; `RespawnQueue.test.ts` uses the same cast); the full check
    result goes in the #164 review note, because this entry is committed before its own check runs.
  - Ponytail review of the merge and E8: lean already; no cuts.
- Checks run: `npm run check` exit 0 on `7a1d399a` (core 334 files / 2062 tests, client 337 /
  2297, server 29 / 165, protocol 1 / 33, docs check passed). On the round 1 fixes: vitest on
  `ProgressionSystem*`, `TeamKillAwards`, `DefaultSystemPipeline*`, `combat/` and `StateHasher`
  passed; core `tsc --noEmit` exit 0; eslint and prettier on the changed files exit 0. Critic
  round 2's `npm run check` on the round 1 tree `fc97e12c`: exit 0 (core 335 / 2071). On the
  round 2 fixes: vitest on the same files, 18 files / 180 tests passed; core `tsc --noEmit`,
  eslint and prettier on the changed files exit 0. Full `npm run check` on this commit: run after
  the commit; the result is in the #164 review note.
- Next step: the push script for #164 (fast-forward from `b365146b`), then the review note. The
  phase/3 merge waits for Sam's merge yes.
