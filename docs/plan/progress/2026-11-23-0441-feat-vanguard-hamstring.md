---
title: 'Progress 2026-11-23: feat/vanguard-hamstring (DEC-343, owner answers to HC-B26 and HC-Q79)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: DEC-343 records the owner answers to HC-B26 (1), (2), (4), (5), (6) and HC-Q79; 05 §3, §8 and §18 updated; no code change.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/vanguard-hamstring (DEC-343, owner answers to HC-B26 and HC-Q79)

Phase 4 / sprint 4.2 · feat/vanguard-hamstring (#162) · sholtzman + Claude Code (COMBAT-ABILITIES-LANE-2-19)

- What was done: the owner answered `INBOX.md` HC-B26 (1), (2), (4), (5), (6) and HC-Q79 on the Owner Calls page v68 (verbatim in `eternalus-agent-work/owner-calls-2026-11-20/answers-v68/PASTE-2026-11-23.md`). DEC-343 (number from PR-REVIEW-COORDINATION-32) records them in the decisions log, and both INBOX items are closed.
  - HC-B26 (1) and (4): kept, as built. 05 §3 now names the shot step's `projectileId` in place of `speed`, `radius` and `range`; 05 §18 "Hamstring" no longer asks for a sign-off.
  - HC-B26 (2): one shot launcher, built by lane B with lane A after #148 merges. 05 §18 "Launch" says so.
  - HC-B26 (5): the `hit`-area load check, built in lane B's PR 6 (Sentinel Rip & Tear). HC-B26 (6): one unit-on-point rule, built in lane B's next PR after #159 merges.
  - HC-Q79 (A): any hit that touches an enemy ends Veil, also when it does nothing; lane A's attack rework builds it. 05 §8 states the rule, and a new 05 §18 "Veil" bullet states what is built today.
  - The HC-Q79 answer also said that an attack from behind while invisible does critical damage. Checked 2026-11-23: no code, content, doc or remote branch (phase/3, #148, #159, `feat/vanguard-kit`) has critical hits or a bonus from behind. Not built; the coordinator asks the owner whether he wants it as a new rule.
- Checks run: `prettier --check` on the three changed docs and `npm run docs:check` (149 files) pass. This commit changes only docs and `INBOX.md`. The full `npm run check` runs on the commit before the push.
- Next step: the owner's push script pushes this commit to #162, with a reply on #150 and #162 for the answers. Then lane B's next PR (PR 6) builds HC-B26 (5) and, after #159 merges, HC-B26 (6).
