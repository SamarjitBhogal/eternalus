---
title: 'Progress 2026-11-25: feat/cathedral-gem-hittable (#132 pre-PR critic fixes)'
description: 'Phase 3 / sprint 3 work, Aryan Walanj + Claude Code: the architecture-reviewer critic on 1145cf6b..9d250403 (PASS WITH SHOULD-FIX) and its fixes: one assist window source, a faster gem minion test, doc wraps, four better-than-design items in INBOX.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/cathedral-gem-hittable (#132 pre-PR critic fixes)

Phase 3 / sprint 3 work · feat/cathedral-gem-hittable · Aryan Walanj + Claude Code

- What was done: the `architecture-reviewer` critic ran on `1145cf6b..9d250403` with the docs as
  at `1145cf6b` (claudiodh's should-fix 2). Verdict: PASS WITH SHOULD-FIX, no blocker. Applied:
  - S3: `assistWindowTicks` is required on `DefaultSystemPipelineOptions`, so `Simulation`'s one
    scoring load is the only source; the pipeline passes `createDefaultDamageSteps()` instead of a
    positional `undefined` (also claudiodh's nit). Every test that builds the pipeline passes the
    window from `loadScoring`.
  - S2: `CathedralGem.test.ts` "is never targeted by enemy minions fighting on it" runs 4 minions
    a side for 3 s with no bot Legends (was 8 a side, 6 bots, 20 s), which timed out under
    coverage on a slow machine; its assertions are unchanged. The Duel test's 3-minute timeout was
    already dropped in the phase/3 merge (phase/3's own `FIGHT_TIMEOUT_MS` covers that test).
  - Nits: doc 05's two long lines rewrapped; doc 18 `last-reviewed` bumped.
  - Four better-than-design items (one gem body, a credit flag on the status, Legends only, enemy
    status damage) are in `INBOX.md` for the owner.
  - S1 (a recorded full check) is left to CI on the pushed head, as the 2026-11-23 19:00 entry
    explains; the PR description quotes it.
- Checks run: `npm run typecheck` (exit 0); eslint on the changed files (exit 0); Prettier;
  `npm run docs:check` ("Documentation check passed."); the touched tests: "Test Files 7 passed
  (7) Tests 54 passed (54)".
- Next step: push; CI on the new head; update the PR description; reviewers' approval.
