---
title: 'Progress 2026-11-26: feat/character-sprites-phase3 (phase/3 merge after #90; DEC-374)'
description: 'Phase 3 / sprites, SamarjitBhogal + Claude Code: merged phase/3-sprint-3-work f37c943b (#90, #84); health-bar placement combines both PRs; DEC-374 recorded.'
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/character-sprites-phase3 (phase/3 merge after #90; DEC-374)

Phase 3 / sprites · feat/character-sprites-phase3 (PR #170) · SamarjitBhogal + Claude Code

- What was done: merged `phase/3-sprint-3-work` at `f37c943b` (after #82, #84 and #90). Five code
  conflicts, all where #90 and this PR each placed the health bar: #90 asks a view for
  `visualRadiusOf` (also used for pointer targeting), this PR has `draw` return the height it
  drew. Both are kept: `EntityLayer` places the bar above the returned height, else the view's
  `visualRadiusOf`, else the footprint radius. `LegendView` and `MobView` keep #90's visual
  radius and return a height (`undefined` for discs); `Match` builds #90's shared `views`
  registry with this PR's `LegendSpriteView`. Two clashes git did not mark: the duplicated
  `LEGEND_VISUAL_DIAMETER` (this PR's copy removed, #90's DEC-238 one kept) and #90's
  `MinionView.draw`, which now returns `number | undefined`. The acting owner answered
  claudiodh's two owner questions (ship the sprites in Phase 3; only the human's Legend draws a
  sprite): DEC-374, doc 08 §11. The pre-PR gate (critic, ponytail) is waived by the acting owner.
- Checks run: `npm run check` on Node 24.21.0 before the push (see the PR #170 comment).
- Next step: merge PR #170 (acting-owner bypass).
