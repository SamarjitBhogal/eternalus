---
title: 'Progress 2026-11-26: feat/magus-passives (DEC-337 (4) B, HC-B40 signed off)'
description: 'Phase 4 / sprint 4.1, sholtzman + Claude Code: the owner answered DEC-337 (4) with B (Erudition stretches the stagger and the knock-up of a knock-back too) and signed off HC-B40 (DEC-361); KnockbackEffect stretches both statuses, the push keeps its travel time.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/magus-passives (DEC-337 (4) B, HC-B40 signed off)

Phase 4 / sprint 4.1 · feat/magus-passives (on `5bae2a29`) · sholtzman + Claude Code
(eternalus-156, eternalus-157)

- What was done: the owner answered two cards on the Owner Calls page (v98).
  - DEC-337 (4): "B: stretch them by 20% too". `KnockbackEffect` now applies `staggered` and
    `knockup` for the cast's stretched time (`cast.statusDuration`), as the `debuff` step does.
    The push keeps its travel time. `onHit` knock-backs still read stretch 1.
  - HC-B40: "A: sign off all seven (built)". The DEC-361 row records the sign-off; item (3)
    stays a follow-up.
- Docs: architecture 05 §18 (the knock-back statuses stretch, the push does not);
  `last-reviewed` bumped. Decisions log: the answers in DEC-337 (4) and DEC-361. `INBOX.md`:
  HC-B40 ticked with the answer.
- Tests fail first: the new `KnockbackEffect.test.ts` case ("stretches the stagger and the
  knock-up for an Erudition caster, not the push") was red on the old effect ("expected 9 to be
  11"), and green with the change; the knock-back and scenario tests then passed (43).
  Log: `eternalus-agent-work/magus-passives/dec337-4b-red-first.log` (sibling folder).
- Checks run: `npm run check` on this change, with this line still a placeholder: `exit=0`. Format,
  no-js, lint, typecheck, knip and build pass (knip prints its usual hint, "Remove from
  ignoreDependencies"); core 355 files / 2307 tests (coverage, all files: 99.14 statements, 93.16
  branches, 99.4 functions, 99.24 lines); protocol 1 file / 31 tests; client 314 files / 2202
  tests; server 21 files / 85 tests; "Checked 146 Markdown files under docs/. Documentation check
  passed." Log: `eternalus-agent-work/magus-passives/check-dec337-4b.log` (sibling folder). Then
  `prettier --check` and `npm run docs:check` with this entry.
- Next step: the critic and `/ponytail-review` on this commit, then the push and a comment on
  PR #166.
