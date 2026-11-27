---
title: 'Progress 2026-11-27: chore/duel-max-level-gate-followups (phase/3 merge, DEC-406)'
description: "Phase 3: PR #177 merges phase/3 e8250d6b and f801af9a, and the owner's HC-B46 answers go into architecture 03 §4 and DEC-406."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: chore/duel-max-level-gate-followups (phase/3 merge, DEC-406)

Phase 3 / sprint 3 work · chore/duel-max-level-gate-followups (PR #177, base
`phase/3-sprint-3-work` f801af9a) · WORKFLOW-FIXES-8 to -11 (Claude Code). The work before this
is in the 2026-11-25 entry.

- What was done:
  - Merge 3e8df650 of phase/3 e8250d6b (#82, #84, #90, #170, #153, #173). The only conflict:
    `ProgressionSystem.test.ts` `setUp` now returns both `announceSpawn` and `clearCamp`.
  - The owner answered HC-B46 (Owner Calls v103, DEC-406). (1) A: architecture 03 §4 now allows
    one exception, an `entity-spawned` listener that finishes the setup of the entity it names, and
    its event table lists `ProgressionSystem`'s Duel max-level raise. 05 §18 says the exception is
    signed off. (2) A: a follow-up PR puts the whole Duel rule set in `DuelOptions`. It is not
    built, so `INBOX.md` HC-B46 stays open. Docs commit b4150d1b.
  - Critic (`architecture-reviewer`) on the DEC-406 docs: approve, 0 blockers. Nit 3 is fixed;
    nits 1 and 2 stay, with reasons in the PR. Ponytail: docs-only diff, no cut.
  - Merge 8b2bc39d of phase/3 f801af9a (#129). No conflict. INBOX.md, 03 and the decisions log
    keep both the #129 text and the DEC-406 text.
- Tests: no code change since the 2026-11-25 entry, except the first merge's `setUp`. The
  progression tests pass (4 files, 51 tests).
- Checks run: `npm run check` on 8b2bc39d (08:43Z to 08:53Z) → EXIT=0 after 615 s: core 317
  files / 1923 tests, protocol 1 / 31, client 334 / 2269, server 29 / 163, all passed; "Checked
  211 Markdown files under docs/." and "Documentation check passed.".
- Next step: push the merge and the docs, then merge #177 when CI is green. The `DuelOptions`
  follow-up PR needs an owner session.
