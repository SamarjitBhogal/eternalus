---
title: 'Progress 2026-11-25: feat/class-passives (DEC-367, the Wrecking Run hit answers)'
description: 'Phase 3, combat PR 8, GAME-LOOP-AND-POST-GAME-68 (Claude Code): recorded the owner answers on the Wrecking Run hit cards HC-Q101 to HC-Q103 as DEC-367; docs only, the hits are built in a later PR.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/class-passives (DEC-367, the Wrecking Run hit answers)

Phase 3 / combat PR 8 (class passives) · feat/class-passives · sholtzman + Claude Code (GAME-LOOP-AND-POST-GAME-68)

- What was done: the owner answered the three Wrecking Run hit cards (Owner Calls page v98,
  pasted 2026-11-26; HC-Q101 to HC-Q103, which DEC-330 (6) names). Recorded as DEC-367 in the
  owner decisions log, with the owner's words, the rules they give with DEC-330 W3 and W4, and
  five readings that are not the owner's words. DEC-330 gets an "Amended by DEC-367" note.
  Game design 12 OQ-62 is now "decided (DEC-367)"; the phase 4 sprint 4.1 status names the hits PR. Docs
  only: the Wrecking Run hits PR builds the rules and updates the other docs that DEC-367 names.
  The critic (architecture-reviewer, 2026-11-26) approved with fixes, 0 blockers; all fixes are
  applied. Its question on Avalanche (it breached "without the 50% self-damage", and the 50% is
  gone) is a game-design call: Owner Calls card HC-Q117. Critic findings:
  `eternalus-agent-work/game-loop-plan/critic-dec367-dec368-2026-11-26.md` (outside the repo).
  The new batch is at the top of the log ("newest batch first"),
  where #166 (`feat/magus-passives`) also adds its batch, so #166 shows a conflict in the log
  against this branch; both sides are kept when it merges.
- Checks run: `npm run check` → `EXIT=0` on the final tree (core 2241, protocol 31, client 2202,
  server 85 tests; "Documentation check passed."). After it only this line changed; Prettier
  and the docs check pass on it.
- Next step: the coordinator checks the push script and Sam pushes. The Wrecking Run hits PR has
  no owner yet.
