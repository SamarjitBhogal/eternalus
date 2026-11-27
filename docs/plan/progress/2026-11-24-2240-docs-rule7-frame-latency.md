---
title: 'Progress 2026-11-24: docs/rule7-frame-latency (HC-B28 answered, DEC-336)'
description: 'Phase 3, GAME-LOOP-AND-POST-GAME-66 (Claude Code): the owner picked "fix all three" on HC-B28; one frame definition in 08 §9, new frame-histogram edges, and the gates count missed frames (DEC-336).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-24
tags: [plan, progress, log]
---

# Progress 2026-11-24: docs/rule7-frame-latency (HC-B28 answered, DEC-336)

Phase 3 / the match-start countdown · docs/rule7-frame-latency · sholtzman + Claude Code (GAME-LOOP-AND-POST-GAME-66)

- What was done: merged `phase/3-sprint-3-work` (1145cf6b; docs conflicts only). Recorded the
  owner's pick on HC-B28 as DEC-336, docs only (`PerfMonitor` is not built). Architecture 08 §9
  holds the one definition of "one 60 Hz frame" and "missed frame" and the new edges of the
  frame histogram (one 60 Hz frame, 25 ms, 50 ms). The frame gates of the plan README §5,
  phase 1 and phase 6 keep the median and add "no missed frame"; rule 7 and architecture 15 §6
  point to 08 §9. These are the owner's design docs. DEC-336 lists seven defaults that are not
  the owner's words. INBOX: HC-B28 moves to Done. Critic (architecture-reviewer), two rounds:
  approve with fixes, all applied but two nits that need no edit. Its three better-than-design
  items are owner card HC-B44 (not blocking).
- Checks run: `npm run check` → `EXIT=0` on the final tree, before this line was written (core
  "Tests 1753 passed (1753)", protocol "Tests 29 passed (29)", client "Tests 2118 passed (2118)",
  server "Tests 114 passed (114)", "Documentation check passed."). Then `prettier --check` and
  `npm run docs:check` on this file.
- Next step: the coordinator checks the push script and Sam pushes; #149 may need a new teammate
  approval after the push.
