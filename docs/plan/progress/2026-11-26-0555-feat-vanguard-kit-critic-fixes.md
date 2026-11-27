---
title: 'Progress 2026-11-26: feat/vanguard-kit (DEC-380 and #123-merge critic fixes)'
description: 'Phase 3 / sprint 3 work, Claude Code: PR #136 fixes the findings of the DEC-380 critic and the #123 merge critic: FR-117 Duel reset, one Duel progression slice, the status end path, and the owner items HC-B52 and HC-Q121.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/vanguard-kit (DEC-380 and #123-merge critic fixes)

Phase 3 / sprint 3 work · feat/vanguard-kit · sholtzman + Claude Code

- What was done: the two critics of `2026-11-26-0451-feat-vanguard-kit.md` (DEC-380, and the `3a7f4aba` merge of #123) both passed; this fixes their findings. `22c50aa1`: the Duel round reset readies every non-ultimate ability of the Legend that died (FR-117; the survivor keeps its cooldowns). `f872e416`: `DUEL_RULES.progression` (`DuelProgressionRules`) is the one record of the Duel's level and meter start rules, read as `ProgressionContent.duel`. `f69abb4d`: critic nits. `ebeff435`: `StatusEffectApplier.removeStacks` at 0 stacks ends a status as `remove` does (`granted` slot, `status-expired`), the Fury TSDoc says it stays until `LegendReset`, and the Duel test shares one `towards` step. Docs: architecture 05 §6, §13 and the Fury bullet, and a dated update in 12; `INBOX.md` HC-B52 (three findings for the owner), HC-Q121 (corner boss and the ultimate meter; no number added), and notes under HC-Q55 and HC-B12.
- Checks run: fail first, then green, for D380-2, D380-6 and M136-1 (`eternalus-agent-work/abilities/pr136-merge/breaks.log`). `StatusEffectApplier`, `MinionLevelSystem` and `DuelRoundSystem` tests: 43 passed; `Simulation.duel.test.ts`: 18 passed; the pre-commit `check:quick` passed on each commit. The full `npm run check` on the final head and the last critic verdict go in the PR #136 comment.
- Next step: last critic re-check on `8fb20809..HEAD`, full check, push. Then the HC-B52 (3) follow-up PR if the owner picks it, COMBAT-WEAPONS-ABILITIES.
