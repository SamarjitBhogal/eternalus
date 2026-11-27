---
title: 'Progress 2026-11-24: PR #170 review fix (Legend sprites)'
description: 'Phase 3, sholtzman + Claude Code: review fix on PR #170 - phase/3 merged in, the stand-in cast path removed, one sprite-sheet table, health-bar height tests, docs corrected.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-24
tags: [plan, progress, log]
---

# Progress 2026-11-24: PR #170 review fix (Legend sprites)

Phase 3 · feat/character-sprites-phase3 · sholtzman + Claude Code

- What was done: merged `phase/3-sprint-3-work` (`1145cf6b`) into the PR (conflicts in `Match.ts`
  and `createBrowserMatch.test.ts`, both sides kept). Removed the cast and effect path that
  DEC-298 (2) drops (no `ability-cast` emitter and none of its ability ids in core). One
  `LEGEND_SPRITE_SHEETS` table replaces three spec maps. Sprite constants named and marked
  `TUNE`. Tests for the health-bar height. The manifest source rule is whole again, with a
  separate attachment test. Docs 08, 14, both provenance docs and `INBOX.md` corrected. Owner
  questions (sprite look, player-only sprite, ADR 0027 budget, sheet licences) wait on the owner.
- Checks run: `npm run check` exited 0. Tests: core 1753, protocol 29, client 2167, server 114
  passed. Last lines: "Checked 150 Markdown files under docs/." "Documentation check passed."
- Next step: the owner rules on the PR #170 cards; then approve or adjust (reviewers).
