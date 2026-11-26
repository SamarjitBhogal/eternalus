---
title: 'Progress 2026-11-26: feat/legend-level-damage (DEC-380)'
description: 'Phase 3: a Legend weapon hit grows with its level, and a Duel earns no match XP (DEC-380 (1) and (2)).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/legend-level-damage (DEC-380)

Phase 3 / sprint 3 work · feat/legend-level-damage (base `phase/3-sprint-3-work` 67dbae61) ·
WORKFLOW-FIXES-7 and -8 (Claude Code)

- What was done:
  - DEC-380 (2): `BasicAttackLevelStep` multiplies a Legend's `weapon` hit by
    `Progression.potency({ perLevel: basicAttackPerLevel })` = `1 + perLevel × (level − 1)`. It
    runs after `FriendlyFireStep` and reads the match's unit definitions
    (`ProgressionContent.units`, the same source as `ProgressionSystem`). Each class has
    `basicAttackPerLevel: 0.08` (`TUNE`), the same as `healthPerLevel`.
  - DEC-380 (1): `DUEL_RULES.hasMatchXp: false`. With it, `ProgressionSystem` listens for no kill,
    structure or respawn award. The max-level start still applies.
  - Critic round 1 (PASS WITH NITS) fixes: B2 (injected units), N1 (`priceKill`), N2, N3, N4;
    docs S2, S3, N6, N7. B3 and N5 rejected; B1 sent to COMBAT-WEAPONS-ABILITIES.
  - Critic round 2 (PASS WITH NITS) fixes: `combat/` no longer imports `entities/` (02 §2), the
    INBOX note's health sentence, TSDoc and test nits. Its better-than-design item is `INBOX.md`
    HC-B49; the structure and boss question is Owner Calls card HC-Q119.
  - Docs: architecture 05 §9 and §18, the DEC-380 row, the INBOX DEC-36 note (three points for
    the owner: the 0.08 default, scaled hits on structures and bosses, 05 §13 text), phase 4 plan
    status.
- Fail-first: every new test went red under a deliberate break, and the code was restored by
  sha256 (`eternalus-agent-work/legend-level-damage/breaks.log`).
- Ponytail: one optional −3-line shrink, rejected for clarity; no cuts applied.
- Checks run: `npm run check` on `a0a9e93d` with these docs (11:09Z to 11:17Z) → exit 0:
  format, no-js, lint, typecheck, knip, coverage (core 302 files / 1836 tests, protocol 1 / 31,
  client 320 / 2186, server 29 / 163, all passed), build, "Documentation check passed.". Each
  code commit's pre-commit `check:quick` exited 0.
- Next step: push and open the PR against `phase/3-sprint-3-work`. The ability PRs (#136, #162,
  #175) raise their damage `perLevel` from 0.04 to 0.08 (agreed by their owners, not pushed yet).
