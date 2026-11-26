---
title: 'Progress 2026-11-25: refactor/simulation-split'
description: 'Phase 3: split Simulation.ts into a thin facade plus composition parts in simulation/, with golden hashes unchanged.'
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: refactor/simulation-split

Phase 3 / sprint 3 work · refactor/simulation-split · SamarjitBhogal + Claude Code

- What was done: split `packages/core/src/Simulation.ts` (761 → 264 lines, constructor 165 → 65) into `simulation/` (`RosterSpawner`, `ReplayRecorder`, `buildMatchWorld`, `spawnMapEntities`, `matchContent`, `buildDefaultPipeline`); public API unchanged. A temporary golden-hash snapshot of five scenarios was byte-identical before and after. Added `ReplayRecorder.test.ts` and `RosterSpawner.test.ts`; pre-PR critic: no blockers, should-fixes applied, folder sign-off in `INBOX.md`; documented in `docs/reviews/2026-11-25-simulation-refactor.md`, architecture 02 and 03, and `packages/core/AGENTS.md`.
- Checks run: `npm run check` on Node 24.21 → exit 0 (core 1841, protocol 31, client 2186, server 163 tests; "Documentation check passed."). Golden-hash snapshot of five scenarios byte-identical before and after.
- Next step: pre-PR critic and ponytail gate, then a draft PR into `phase/3-sprint-3-work` (owner: SamarjitBhogal).
