---
title: 'Progress 2026-11-26: refactor/query-injection (HC-B39 sign-off)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: HC-B39 signed off after an independent critic agreed; its should-fix S1 and nits N1-N3 built (narrow AttackContext.areas); no behaviour change.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: refactor/query-injection (HC-B39 sign-off)

Phase 4 / sprint 4.2 · refactor/query-injection · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-66 and -67)

- What was done: the owner answered HC-B39 "A: sign off both (built) — if a critic agrees" (Owner
  Calls v98). An independent critic (architecture-reviewer) agreed on both items of `59160098`
  (`eternalus-agent-work/abilities/hc-b35/critic-hc-b39-report.md`); its own `npm run check` on
  `59160098` passed. Its should-fix S1 is built: `AttackContext.areas` is
  `Pick<AreaHitQuery, 'find' | 'aimedBodyOf'>` and `CombatSystem` passes it on as
  `AttackContext['areas']`. N1: `CombatSystem` writes its `reach` type once. N2: the
  `DefaultSystemPipeline` TSDoc names the `TargetQuery`. N3: a correction in DEC-359. DEC-359 gets
  the sign-off and an addendum; `INBOX.md` HC-B39 is ticked. Not built: the critic's optional
  bundle of cast services (reason in DEC-359).
- Checks: `check:quick` (pre-commit hook). The full `npm run check` is still to run on this commit.
- Next: the full check, then a push script for the coordinator.
