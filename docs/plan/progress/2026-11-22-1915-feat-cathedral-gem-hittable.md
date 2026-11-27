---
title: 'Progress 2026-11-22: feat/cathedral-gem-hittable (#132 R4 S4: glow ticks hash test)'
description: 'Phase 3 / sprint 3 work, Aryan Walanj + Claude Code: the gem hash test now changes glow ticks left on its own; red with that field unhashed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/cathedral-gem-hittable (#132 R4 S4: glow ticks hash test)

Phase 3 / sprint 3 work · feat/cathedral-gem-hittable · Aryan Walanj + Claude Code

- What was done: swholtzman's R4 S4 on #132. In `StateHasher.test.ts` the Cathedral gem test
  claimed each of four fields changes the hash, but every step moved more than one field. It now
  also compares two fresh gems struck for 3 and for 4 ticks, which differ in glow ticks left alone.
  With `glowTicksLeftValue` removed from `CathedralGemState.fields` the test failed ("expected
  954508484 not to be 954508484"); restored, it passes.
- Checks run: `npx vitest run src/state/StateHasher.test.ts`: "Tests 55 passed (55)"; Prettier
  clean; the pre-commit hook runs `npm run check:quick`.
- Next step: the owner pushes; swholtzman re-reviews #132.
