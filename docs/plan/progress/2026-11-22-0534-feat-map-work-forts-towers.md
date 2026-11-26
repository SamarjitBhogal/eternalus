---
title: 'Progress 2026-11-22: feat/map-work-forts-towers (horde bug renumbered BUG-9)'
description: 'Phase 3, sholtzman + Claude Code: the horde nav-cell bug row in bugs.md becomes BUG-9, as #128 logged BUG-8 first.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/map-work-forts-towers (horde bug renumbered BUG-9)

Phase 3 / map work · feat/map-work-forts-towers · sholtzman + Claude Code (PR-38-HELPER-47)

- What was done: the `docs/plan/bugs.md` row "Horde centres stand in blocked nav cells by a fort
  door" is now BUG-9. PR #128 (`docs/bug-citadel-side-entrances`, `f3d4488f`) logged BUG-8 first
  (citadel side entrances, SCRUM-443); eternalus-144 reported the clash. The earlier
  `PROGRESS.md` entries of this branch call the horde bug BUG-8; they are historical and stay.
- Checks run: BUG-9 is free: no remote or local branch, worktree copy or agent-work file has a
  BUG-9 or higher (grep, 2026-11-22). `prettier --check` and `npm run docs:check` on this change.
- Next step: as in the entry before this one (push map-work, open its PR stacked on #122).
