---
title: 'Progress 2026-11-23: chore/minion-perf-check (DEC-351, PR #83 review)'
description: 'Phase 3 / minion plan "Unit-cap performance", SamarjitBhogal + Claude Code: recorded the owner answers on tick time as DEC-351 and re-cited the CI step, the bench and NFR-021.'
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: chore/minion-perf-check (DEC-351, PR #83 review)

Phase 3 / minion plan "Unit-cap performance" · chore/minion-perf-check · SamarjitBhogal + Claude Code

- What was done: recorded the owner's 2026-11-23 answers to `INBOX.md` "Tick time" (1) to (3)
  as DEC-351 (bench step on every PR as built; the fill to 144 is enough; the reference machine
  is the `ubuntu-latest` CI runner). The `ci.yml` header, the guardrails "CI gate" row and the
  `hordes.mjs` header and output line cite DEC-351; NFR-021 and plan README §5 name the CI
  runner. The minion plan row keeps the pathing-plus-steering measurement as an open Phase 3
  action (CodeRabbit). INBOX (4) stays open.
- Bench on `ubuntu-latest` (CI run 45109421218, head `c1bcbe36`, Node 24.21.0): 144/team case,
  mobs 143/144 at start, 86/112 at end, p50 2.24 ms, p95 4.27 ms, max 5.64 ms, budget "yes";
  290/team case, 290/289 → 207/216, p95 4.93 ms, max 6.83 ms, no target (DEC-137 (1)).
- Checks run: see the PR #83 comment for this round (`npm run check`, quoted verbatim).
- Next step: re-review; INBOX "Tick time" (4) when the owner picks it up.
