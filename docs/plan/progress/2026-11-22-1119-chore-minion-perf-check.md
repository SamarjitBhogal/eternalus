---
title: 'Progress 2026-11-22: chore/minion-perf-check'
description: 'Phase 3 / sprint 3, SamarjitBhogal + Claude Code: PR #83 round-2 review fixes, merge of phase/3, the bench on the shipped bot roster.'
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: chore/minion-perf-check

Phase 3 / sprint 3 · chore/minion-perf-check (PR #83, round 2) · SamarjitBhogal + Claude Code

- What was done: merged `phase/3-sprint-3-work` at `e2a4fd66` (conflicts in `PROGRESS.md`, both
  kept; plan README and minion plan tables taken from the base, the tick-time cells set again
  short enough to keep the table widths). The bench builds its laners from the shipped
  `botRoster` (one class of each per lane, DEC-102), its Legend guard needs 10 units of travel
  (no pilot now fails all 20 Legends, was 10), its tick counts come from `tickRate`, and `runCase`
  is split in three. INBOX tick-time item rewritten to its current state with four questions.
  Measured (AMD Ryzen AI 9 HX 370, 62 GB, Node 24.21.0, load about 6): 144/team p95 4.50 ms, max
  5.37 ms, mobs 143/144 → 92/98; 290/team p95 4.85 ms, max 8.59 ms. Not done: the `ci.yml` header
  and the guardrails "CI gate" row (the session could not edit guardrail files; INBOX question 3).
- Checks run: `npm run check` (Node 24.21.0) → `EXIT=0`: "All matched files use Prettier
  code style!", client "Tests 2077 passed (2077)", server "Tests 84 passed (84)", "✓ built in
  831ms", "Documentation check passed." (the captured log dropped the core and protocol test
  lines; the `&&` chain exited 0). `npm run bench` ran as above; a no-pilot break test threw.
- Next step: owner answers the INBOX "Tick time" questions; swholtzman re-reviews PR #83.
