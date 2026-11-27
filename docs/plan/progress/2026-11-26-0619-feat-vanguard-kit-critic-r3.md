---
title: 'Progress 2026-11-26: feat/vanguard-kit (critic round 3 and the final check)'
description: 'Phase 3 / sprint 3 work, Claude Code: PR #136 passes its third and last critic round; two doc path fixes, one INBOX note, and the full check on the final tree.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/vanguard-kit (critic round 3 and the final check)

Phase 3 / sprint 3 work · feat/vanguard-kit · sholtzman + Claude Code

- What was done: critic round 3 (the last) on `8fb20809..15b860f7` gave PASS with 3 nits and 1 better-than-design item (`eternalus-agent-work/abilities/pr136-merge/critic-r3-report.md`). R3-1: the 2026-11-12 note in architecture 12 names `DUEL_RULES.progression.legendsStartAtMaxLevel`. R3-2: the 05 "Sources" bullet names `entity-spawned` (cause `start`, DEC-380 (1)). R3-3: this entry gives the verbatim checks that `2026-11-26-0555-feat-vanguard-kit-critic-fixes.md` paraphrased; that entry stays as written. R3-4 (a mode-neutral progression slice) is not built: it is a note under `INBOX.md` HC-B52 (2), for the branch that merges second with `hasMatchXp`. Ponytail on the code of `3a7f4aba..15b860f7`: two line-level cuts, both rejected (`pr136-merge/ponytail-r1.md`).
- Checks run: by the critic, in `packages/core`: `npx vitest run src/combat/StatusEffectApplier.test.ts src/systems/DuelRoundSystem.test.ts src/systems/UltimateCharge.test.ts src/systems/ProgressionSystem.test.ts src/systems/MinionLevelSystem.test.ts` → `Tests  79 passed (79)`; `npx vitest run src/Simulation.duel.test.ts` → `Tests  18 passed (18)`. `npm run check` on the tree of `15b860f7` with this commit's docs (`eternalus-agent-work/abilities/pr136-merge/logs/check-15b860f7-tree.log`) → `CHECK_EXIT=0`: core `Tests  2205 passed (2205)`, protocol `Tests  32 passed (32)`, client `Tests  2299 passed (2299)`, server `Tests  163 passed (163)`, `Documentation check passed.`
- Next step: push #136 and post the gate record as a PR comment (coordinator script). Then the owner answers HC-B52 and HC-Q121, COMBAT-WEAPONS-ABILITIES.
