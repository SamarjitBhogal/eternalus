---
title: 'Progress 2026-11-26: feat/boss-design (controller review)'
description: 'Phase 3: made boss specials data-driven and added deterministic selection and roaming.'
audience: [humans, agents]
status: active
owner: gursh
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/boss-design (controller review)

Phase 3 / sprint 3 work · feat/boss-design · Gurshaan + Codex

- Installed the special move table on spawn. Moved line, stun, shield and pull behavior into an effect registry.
- Replaced sequential selection with a seeded choice among usable moves. Added seeded roaming inside the guard leash.
- Covered the five moves, arena boundaries, deterministic replay and roaming in the existing encounter scenarios.
- Next: integrate the remote review commits and Phase 3, then verify the updated PR against the recorded owner decisions.
