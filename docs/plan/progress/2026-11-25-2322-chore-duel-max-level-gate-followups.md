---
title: 'Progress 2026-11-25: chore/duel-max-level-gate-followups (PR #142 gate findings)'
description: 'Phase 3, sholtzman + Claude Code: PR #142 merged before its reviewer pushed the pre-PR gate fixes, so they are on this branch: unit tests for the Duel max-level start, one snapshot per tick in the Duel fight helper, the as-built text moved to 05 §18, and better-than-design item HC-B46.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: chore/duel-max-level-gate-followups (PR #142 gate findings)

Phase 3 / sprint 3 work · chore/duel-max-level-gate-followups · sholtzman + Claude Code

- What was done: PR #142 (`da524343`) merged before its reviewer pushed the gate fixes, so this
  branch (from phase/3 `67dbae61`) holds them. Tests and docs only: five unit tests for
  `legendsStartAtMaxLevel` in `ProgressionSystem.test.ts`; one snapshot per tick in
  `fightUntil`; the as-built text moved from 05 §13 to a 05 §18 bullet that names the 03 §4
  exception; doc 12's dated note; `INBOX.md` HC-B46 (the 03 §4 exception, the Duel rule set in
  `DuelOptions`). Gate on PR #142 at `d718d43c` and its rejected findings: see the PR. This
  branch's critic (`architecture-reviewer`, base `67dbae61`): should-fix only; S1 to S3 and nits
  N1 to N3 and N5 to N7 built (list in the PR).
  Ponytail (`/ponytail-review`): no cut. Tests failed first: each deliberate break of
  `ProgressionSystem.ts` turned its named test red (list in the PR).
- Checks run: `npm run check` on `6bddc3f8` → EXIT=0 after 470 s (test files 300, 1, 320 and 29
  passed; "Documentation check passed.").
- Next step: the owner answers the Owner Calls cards "PR142 (1) Duel max level", "(2) Duel pace"
  and "(3) test time limit", and HC-B46. On A or B to card (1), a follow-up records the rule in
  a DEC row and the design text, and builds the `DuelOptions` change.
