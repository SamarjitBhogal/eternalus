---
title: 'Progress 2026-11-27: feat/boss-hit-area (pre-PR critic fixes)'
description: 'Phase 3 / sprint 3.6, sholtzman + Claude Code: the pre-PR critic of feat/boss-hit-area (PASS WITH SHOULD-FIX) and its fixes: body shapes checked at load, HitPath beside DamageSource, stale TSDoc.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/boss-hit-area (pre-PR critic fixes)

Phase 3 / sprint 3.6 · feat/boss-hit-area (on #160 `6858c960`) · sholtzman + Claude Code

- What was done: the pre-PR critic (`architecture-reviewer`, diff `6858c960...7ef5225d`, docs as
  at the base) gave PASS WITH SHOULD-FIX, no blockers. Fixes: a content rule, `BodyShapeRule`,
  checks every body shape at load (at least 3 finite corners, the head inside the outline), so a
  bad shape fails at boot and not when the boss spawns in a match. `HitPath` moves to `state/`
  beside `DamageSource`, so the `entities/` damage port uses it and does not copy it.
  `EntityStore.outlineOf` returns no outline for a body without a `Transform` and does not throw;
  its new polygon per call has a `ponytail:` note (08 §9: profile first). Stale TSDoc after the
  `bodyShape` rename now names `bodyShape` and the line of flight. `/ponytail-review` on the same
  diff: no cuts. Docs 04 §3 and `INBOX.md` (critic items B5 to B7) updated. Each new test was red
  first (breaks B39 to B43, logged outside the repo).
- Checks run: the full `npm run check` on 7ef5225d was stopped by Claude Code for low system
  memory during the client tests. Before the stop, format, no-js, lint, typecheck, knip, core
  tests ("Tests 1972 passed (1972)") and protocol tests ("Tests 31 passed (31)") passed. On this
  change: `npx vitest run` on the 7 changed test files → "Tests 54 passed (54)", the EntityStore
  tests → "Tests 20 passed (20)"; eslint and `prettier --check` on the changed files passed.
- Next step: merge #160's next head (`DamagePipeline.kill`: keep both sides), the full
  `npm run check`, then the push script and PR body to the coordinator.
