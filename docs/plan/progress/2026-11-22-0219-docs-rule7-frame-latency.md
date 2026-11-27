---
title: 'Progress 2026-11-22: docs/rule7-frame-latency (HC-B22 answered, DEC-328)'
description: 'Phase 3, GAME-LOOP-AND-POST-GAME-53 (Claude Code): the owner picked A on HC-B22; rule 7 counts missed frames and every 16.7 ms frame-time target is one 60 Hz frame (DEC-328).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: docs/rule7-frame-latency (HC-B22 answered, DEC-328)

Phase 3 / the match-start countdown · docs/rule7-frame-latency · sholtzman + Claude Code (GAME-LOOP-AND-POST-GAME-53)

- What was done: recorded the owner's pick A on HC-B22 as DEC-328 (amends DEC-299 (3)). The UI
  enhancements plan's rule 7 now asks for a p95 within one 60 Hz frame and no more missed frames
  (over 25 ms) than the control, on a cross-origin isolated test page. The frame-time targets of
  architecture 08 §9, the plan README §5, phase 1 and phase 6 read "one 60 Hz frame". These are
  the owner's design docs. INBOX: HC-B22 moves to Done. Decisions log: DEC-328, and DEC-299 notes
  the amendment. Critic (architecture-reviewer): approve with fixes; 1 major (how the missed-frame
  counts are compared), 3 minor and 4 nits, all applied. Its two better-than-design items are
  owner card HC-B28 (not blocking). Docs only.
- Checks run: `npm run check` → `EXIT=0` on the final tree (core 1683, protocol 29, client 2077,
  server 84 tests; docs check passed).
- Next step: the coordinator checks the new push script, Sam pushes; #149 needs a teammate
  approval.
