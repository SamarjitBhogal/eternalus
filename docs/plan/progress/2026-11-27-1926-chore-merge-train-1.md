---
title: 'Progress 2026-11-27: chore/merge-train-1 (16 PRs in one merge)'
description: 'Phase 3, LEGEND-JUMP-7 to -11 (Claude Code): merge train 1 merges the exact origin head of 16 ready PRs into one branch for one check, one critic, one PR and one CI run; conflicts, merge fixes, checks and one known gap.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: chore/merge-train-1 (16 PRs in one merge)

Phase 3 · chore/merge-train-1 · sholtzman + Claude Code (LEGEND-JUMP-7 to LEGEND-JUMP-11, for
PR-REVIEW-COORDINATION-64 to -69)

- Why: Sam approved the merge train on 2026-11-27 (chat to PR-REVIEW-COORDINATION-64, about
  17:12Z). One PR at a time costs one phase/3 merge, check, push and CI run per PR. The train puts
  all ready PRs on one branch. GitHub marks a PR as merged when its exact head reaches its base, so
  each car is the PR's origin head, merged with `git merge --no-ff`.
- Base: `phase/3-sprint-3-work` at `9112519e`. phase/3 moved twice during the train (#160 merged
  as `3a7dea19`, #146 squash-merged as `74052e2c`); the train merged both.
- Cars, in merge order (merge commit, PR, branch, head):

  | Merge commit | PR      | Branch                                             | Head     |
  | ------------ | ------- | -------------------------------------------------- | -------- |
  | bda48deb     | #147    | docs/dec-288-interior-bonus-buildings              | b37ed624 |
  | c1a737bd     | #151    | docs/ste-writing-rule                              | 94538a62 |
  | 826aefb7     | #174    | docs/features-nfr-report                           | 3945cc7d |
  | 8ac1969a     | #155    | fix/hook-project-dir                               | 42bbcbc5 |
  | e6da4d73     | #180    | refactor/lane-progress-port                        | 0c88a722 |
  | 08336e8c     | #185    | feat/corner-camp-clear-bonus                       | 45a60422 |
  | 7e992cb5     | #189    | feat/legend-level-damage                           | 3f28400a |
  | 82fde6c3     | #133    | docs/land-dec-38                                   | 9e99b3c9 |
  | fb34ee11     | #188    | fix/legend-sprites-dec378                          | edb35a13 |
  | 07153d2b     | #191    | feat/damage-numbers                                | 4393890c |
  | ce8ddd24     | phase/3 | (#160 feat/cathedral-eruption-boss, merged)        | 3a7dea19 |
  | a237ef4e     | #190    | feat/boss-hit-area                                 | 9046638e |
  | 2dafccfa     | #146    | feat/duel-results-score (merged later as a squash) | 2932a65d |
  | 9a96dea8     | #112    | feat/developer-menu-sim-mode                       | f2479ad3 |
  | 48c7f045     | #112    | (new head)                                         | 85243db9 |
  | 9a278ded     | phase/3 | (#146 squash)                                      | 74052e2c |
  | 64688825     | #164    | feat/greater-boss-moves                            | 00f36a15 |
  | 27ccf451     | #98     | feat/tower-ruins-and-routes                        | 4d65241e |

- Conflicts and resolutions: each merge commit message lists every conflicted file, how it was
  resolved, and the checks run on it. The rules: keep both sides; decisions log rows stay newest
  date first and, on the same date, highest DEC first, with no DEC row twice; INBOX items and
  progress lists keep both; test fixtures take the union of fields. The six docs and tooling cars
  and #180 and #185 merged with no conflict.
- Merge fixes (no conflict marker; two PRs meet): #180 made `DamagePipeline`'s steps required, so
  the new `new DamagePipeline()` calls of #160, #190 and #164 tests pass
  `damageStepsWithoutLaneProgress()`; #188 made `EntityDrawState.frameTick` required (#160's boss
  view test); #112 removed the `ROVER_BOT` import that #164's `Simulation` constructor used; #164
  made `TeamKillReward` a union, so #185's corner-boss test narrows it; #164 takes the Greater Boss
  off `PathingSystem`, so #190's DEC-421 guard test gives that boss `leashed-chase` in its test
  content; test `setUp` signatures of #112 and #164 meet the train's. #98 (the last car; it reuses the resolutions of its trial merge
  `c934b645`) made `ruinWall`, the snapshot field `aura`, the draw-state field `time` and the one
  `MatchGrid` argument of `MatchWorld` required, so tests of #189, #112, #191, #160 and #188 pass
  them; #98's court test passes #184's map version; two #98 tests use
  `damageStepsWithoutLaneProgress()`.
- Known gap after the merge (coordinator's option A for #164, "as built"): DEC-421 (#190, "a big
  boss hits from its whole drawn body") applies to the boss's basic attack only. #164's
  `BossController` never uses the basic attack. Its moves measure from the boss centre, and no move uses the
  drawn outline. So the slam (4 m) and the sweeps (6 m) miss a player who stands on the drawn body
  far from the centre; the charge (10 m) and the beam (a 30 m × 1.5 m line) still reach that player. Sam answered the owner card on 2026-11-27 (call 11 = A + B, DEC-429,
  through PR-REVIEW-COORDINATION-68): the boss's moves reach from the drawn outline, and the basic
  attack comes back between moves (1.5 m of the body). E7-BOSS-BRAIN-10 builds it in a follow-up PR
  in merge train 2. The train changes no code for it.
- Notes for the owner (no change in the train): (1) the DEC-421 hold branch in `PathingSystem` has
  no shipped user until the DEC-429 follow-up, because #164 takes the Greater Boss off
  `PathingSystem` (its guard test gives the boss `leashed-chase` in test content). (2)
  `EntityDrawState` now has two frame clocks: `frameTick` (#188, sprite frames) and `time` (#98,
  aura particles). They differ by one tick in steady play. Each PR keeps its behaviour; to join
  them is a design call.
- Checks run: after each car, `npx tsc -b`, eslint and Prettier on the merged files, and the full
  `packages/core` and `apps/client` Vitest suites. After the last car (#98): core 365 files, 2345
  tests passed; client 347 files, 2450 tests passed. The full `npm run check` runs on the tip that
  holds this entry; the PR description gives its result line.
- Critic and ponytail: an `architecture-reviewer` subagent judges the conflict
  resolutions and merge fixes in the remerge-diff of each merge commit (not the PRs: each PR had
  its own critic). On the first 17 merges: approve, no blockers; `/ponytail-review` found no cuts.
  Its SHOULD-FIX, the DEC-356 batch above the DEC-368 batch of the same date (from the #112
  merge), is fixed in the commit of this entry. The PR description gives the verdicts on the #98
  merge.
- Next step: the coordinator runs `push-train1.sh` (it pushes the new branch and opens one PR into
  phase/3; it closes nothing). After CI is green, Sam merges it with a merge commit, and GitHub marks
  each car merged.
