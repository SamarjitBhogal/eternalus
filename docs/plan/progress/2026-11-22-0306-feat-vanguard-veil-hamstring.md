---
title: 'Progress 2026-11-22: feat/vanguard-veil-hamstring (DEC-327 Veil end rule)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: Veil ends on a hit, not on a status tick (DEC-327); HC-Q75 and HC-B19 answered; full check passed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/vanguard-veil-hamstring (DEC-327 Veil end rule)

Phase 4 / sprint 4.2 · feat/vanguard-veil-hamstring (PR #150) · sholtzman + Claude Code

- What was done: built DEC-327 in `StatusEffectSystem`: a periodic status tick no longer ends Veil; any other hit, or a debuff from another entity, ends it on both sides. Renamed `endsOnDamage` to `endsOnHit` and `breakOnDamage` to `breakOnHit`. Six new tests, one old-rule test replaced; each went red under a deliberate break first (`eternalus-agent-work/abilities/veil-dec327-breaks.log`). Recorded DEC-327 in the decisions log; `INBOX.md` HC-Q75 and HC-B19 answered; 03 §2 and §5, 05 §8 and §18, 08 §8 and 11 §3 now state HC-B19 (2) to (5).
- Checks run: `npm run check` → `EXIT=0` (core 332 files / 2081 tests, protocol 1 / 30, client 313 / 2197, server 21 / 84, "Documentation check passed."; `eternalus-agent-work/abilities/veil-dec327-check.log`).
- Next step: lane A's target-free attack rework replaces the held attack (HC-Q75); HC-B19 (6) stays not built. The owner pushes #150.
