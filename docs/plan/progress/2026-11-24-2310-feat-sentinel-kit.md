---
title: 'Progress 2026-11-24: feat/sentinel-kit (lane B PR 6, pre-PR gate rounds 1 to 3)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: the three critic rounds of the pre-PR gate of the Sentinel kit and their fixes; DEC-363 to DEC-365, HC-B43, HC-S14, HC-S15, HC-Q113.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-24
tags: [plan, progress, log]
---

# Progress 2026-11-24: feat/sentinel-kit (lane B PR 6, pre-PR gate rounds 1 to 3)

Phase 4 / sprint 4.2 · feat/sentinel-kit (stacked on #162, base `009c8b3f`) · sholtzman + Claude Code (COMBAT-ABILITIES-LANE-2-23 to -26)

- What was done: the pre-PR gate (ADR 0010) of lane B PR 6 ran its three critic rounds (the owner's limit). The reports are in `eternalus-agent-work/abilities/pr6-sentinel/gate/`.
  - Round 1 (commits up to `c29b81e8`): Shield Wall has an aim overlay (display shape `outline`); one push-out rule and one "which units walls stop" rule for the collision step, a new Shield Wall and a body that grows (DEC-363); an execute has a `families` filter; only live walls count toward the cap of 2.
  - Round 2 (`d04d67c0` and this commit): each pass of `CollisionResolver.pushOut` is a swept move, so a push never moves a unit into a map object or another wall (DEC-364 (2)); the guard leash tolerance is 6 m (DEC-364 (1)); `PlacedOutline` is not exported (knip); the dated 06 amendment is restored and a new dated note holds the change.
  - Round 3, the last (this commit): architecture critic approve, its wording items fixed. Correctness critic: 0 blockers, 1 major, 3 nits, all fixed after the round with no critic run on the fixes. M1: Berserk in a gap narrower than the grown body. The body now keeps its size until it has room: `BodySizeSystem` asks the new `CollisionQuery.hasRoom` for the pushed, grown body and tries again each tick (DEC-365 (1); owner card HC-Q113, option A built). N2: each push-out pass stays inside the bounds, so the clamp moves no unit into a rock (DEC-365 (2)). N1: the limit of the push is stated as it is (at most four passes, no search for free ground). N3: the slide of a pass is pinned in its test.
  - Owner items: HC-B43 (nine better-than-design items), HC-Q113 (new). Scheduled: HC-S14 (with PR 8), HC-S15 (with lane B PR 7).
  - Docs: 05 §18, 06 (new dated note), 10 §12, the decisions log (DEC-364, DEC-365), `INBOX.md`.
- Checks run: each new test failed first on a deliberate break (`eternalus-agent-work/abilities/pr6-sentinel/r1-fixes-breaklog.md`). Before this commit: `npx tsc -b` exit 0; eslint on the changed files exit 0; prettier clean; `npm run docs:check` passed (151 files); core `npx vitest run`: `Test Files  376 passed (376)`, `Tests  2504 passed (2504)`. The full `npm run check` runs after this commit; the PR description records its result.
- Next step: the full `npm run check`, then the push and a PR with base `feat/vanguard-hamstring` (#162) through the coordinator's script. Open, not built: the Shield Wall outline does not show a refused cast (HC-S15); `NoMapObjectOverlapInvariant` does not check placed walls (HC-S14); the push does not search for free ground, so a unit under a new wall can stay partly inside it (10 §12).
