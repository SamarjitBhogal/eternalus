---
title: 'Progress 2026-11-26: feat/wall-turrets (DEC-375 and DEC-376, Owner Calls v98)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: PR 4 builds the owner answers HC-B36 B (the pylon and the turret each have a health bar; the pylon takes the turret with it), HC-Q106 A and HC-B38 A (one condition field per map object).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/wall-turrets (DEC-375 and DEC-376, Owner Calls v98)

Phase 4 / sprint 4.2 · feat/wall-turrets · sholtzman + Claude Code (DEC-375 build session, brief
from PR-REVIEW-ASSIST-48)

- What was done: the owner's Owner Calls v98 answers. DEC-375 (HC-B36 B, replaces DEC-332 (1)):
  the pylon map object under a wall turret has its own entity and health (600, `TUNE:
provisional`, owner card draft pending); the turret keeps its 600. The pylon breaks under the
  turret's rule. Its fall takes the turret with it on the same tick (`DamagePipeline.collapse`
  through `MapDestructionSystem`, with the pylon's killer as the turret's killer), so the
  turret's XP goes to the Legend that felled the pylon. The turret's fall leaves the pylon as a
  ruin that blocks, with its own health. The client draws the pylon's bar under it and the
  turret's bar above it. DEC-376 (HC-Q106 A, HC-B38 A): 2 levels stay; HC-B38 (3) is built:
  `MapObjectSnapshot.condition` replaces `isDestroyed` and `isRuined`; no pinned hash changed.
  Docs: decisions log batch 2026-11-26, architecture 05 §9 status, 06 §10, 07 §8 and §13,
  `INBOX.md` HC-B36, HC-Q106, HC-B38. Fail-first 1 to 14
  (`eternalus-agent-work/wall-turrets/dec375-fail-first.md`).
- Checks run: the full check runs on this head after this entry
  (`eternalus-agent-work/wall-turrets/dec375-check-1.log`).
- Next step: a critic reviews the DEC-375 and DEC-376 work; then push through the coordinator.
  The owner card draft for the pylon's health, the reward default and the pylon's breakability
  goes to the Owner Calls page (`eternalus-agent-work/wall-turrets/dec375-pylon-health-card.md`).
