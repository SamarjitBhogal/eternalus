---
title: 'Progress 2026-11-22: character sprites rebuild'
description: 'Phase 3, Codex: rebuilt the Legend sprites from the Phase 3 base following PR 134 review.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: character sprites rebuild

Phase 3 · feat/character-sprites-rebuild · Codex

- What was done: Transplanted the sprite pipeline, loaded one atlas per match, retained the existing asset budgets, and recorded DEC-298.
- Checks run: `npm run check` exited 0 with 3,920 tests passing. `Documentation check passed.` Edge drew the selected Legend after fetching one atlas.
- Next step: Owner reviews draft atlas budgets. Coordinate targeting with PR 90 and build the selected-subclass portraits in their own follow-up.
