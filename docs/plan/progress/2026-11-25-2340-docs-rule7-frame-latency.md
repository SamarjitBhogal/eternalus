---
title: 'Progress 2026-11-25: docs/rule7-frame-latency (DEC-368, the HC-B44 answers)'
description: 'Phase 3, GAME-LOOP-AND-POST-GAME-68 (Claude Code): recorded the owner answers on HC-B44 as DEC-368; architecture 08 §9 gets the missed-frame count and rounding, phase 6 the oldest-laptop gate.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-25: docs/rule7-frame-latency (DEC-368, the HC-B44 answers)

Phase 3 / the match-start countdown · docs/rule7-frame-latency · sholtzman + Claude Code (GAME-LOOP-AND-POST-GAME-68)

- What was done: the owner answered card HC-B44 (Owner Calls page v98, pasted 2026-11-26), the
  three better-than-design items of the DEC-336 critic. Recorded as DEC-368 in the owner
  decisions log, with the owner's words, and a note on DEC-336 that DEC-368 amends it.
  Architecture 08 §9: a new "Missed-frame count" term (the count skips the first frame after the
  loop starts or resumes; each terrain change may cause one frame of up to 50 ms), and the
  planned `PerfMonitor` rounds each interval to the clock's step before it picks a bucket and
  takes the first edge from `crossOriginIsolated`. Phase 6 sprint 6.1: the oldest-laptop gate
  reads "median frame ≤ two 60 Hz frames". `INBOX.md`: HC-B44 moves to Done. `PerfMonitor` is not
  built, so the change is docs only. The critic (architecture-reviewer, 2026-11-26) approved with
  fixes, 0 blockers; all fixes are applied: 08 §9 gets a "Two 60 Hz frames" term, the count says
  what a terrain change is (a destruction, not a gate opening or closing), `PerfMonitor` does not
  record the skipped interval and compares whole clock steps; the phase 3 terrain gates and the
  phase 6 bridge test allow at most one missed frame; the README, phase 1 and phase 6 gates point
  to the count. Five readings are not the owner's words; DEC-368 lists them. Critic findings:
  `eternalus-agent-work/game-loop-plan/critic-dec367-dec368-2026-11-26.md` (outside the repo).
- Checks run: `npm run check` → `EXIT=0` on the final tree (core 1830, protocol 31, client 2186,
  server 163 tests; "Documentation check passed."). After it only this line changed; Prettier
  and the docs check pass on it.
- Next step: the coordinator checks the push script and Sam pushes; #149 may need a new teammate
  approval after the push.
