---
title: 'Progress 2026-11-27: #170 follow-up (the owner answers DEC-397, DEC-398, DEC-424)'
description: 'Phase 3, sholtzman + Claude Code: the DEC-378 line merges phase/3 8ad77bfd, builds the PR170 card answers (feet in the sheet data, one sheet group family, the frame time in the draw state, a sprite width per class with its camera), amends ADR 0018 and records DEC-397, DEC-398 and DEC-424.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: #170 follow-up (the owner answers DEC-397, DEC-398, DEC-424)

Phase 3 · fix/legend-sprites-dec378 (the #170 follow-up PR) · sholtzman + Claude Code

- What was done:
  - Merge: phase/3 at `8ad77bfd` (#129 map-feature-link, #149 rule-7 docs, #177 duel max-level
    gate) merged into the DEC-378 line. The merge commit lists each conflict and its resolution.
  - Card PR170 (8) (DEC-398): the feet position is the sheet's own data. `SpriteAtlasEntry`
    has `groundOffset`, and `SpriteAtlasLoader` rejects a value outside 0 to 1. The renderer
    stands each sprite on its feet (`drawSprite(sprite, feet, width)`) and measures its top
    (`spriteTop`). `SPRITE_GROUND_OFFSETS` is gone from `legendSpriteSheets.ts`.
  - Card PR170 (9) (DEC-398, audit F13): one asset group family, `sprite-atlas:<asset id>`. The
    eight `atlas-<sub-class>` groups and their `NO_GROUPS` entries are gone. The match loads a
    sheet by its id (`matchAssetGroups`). The Magus entries moved into `legendSpriteAssets.ts`,
    so the family has one manifest file and one folder. The manifest test checks the real file,
    and the byte budget pins stay per sheet.
  - Card PR170 (12) (DEC-398): `EntityDrawState.frameTick` hands the frame time to every view.
    `LegendSprites.setFrameTick` and its call in `Match.render` are gone.
  - Card PR170 (15) (DEC-424): each class has its own sprite width, core content
    `LegendDefinition.spriteWidth` with a `// TUNE:` note, checked by `PositiveSpriteWidthRule`.
    The click radius is half the width, and the bar sits on the sprite top. The player's camera
    zooms out by the player's own width (`followViewFor`).
  - Cards PR170 (7), (10), (11), (14): built as answered. Card (11) scales in the one
    `drawImage` call with smoothing off and keeps no frame cache (audit F4).
  - Docs: DEC-397, DEC-398 and DEC-424 in a new batch; DEC-378 replaces DEC-374 (HC-B56 A), with
    a dated note in both rows. ADR 0018 has an amendment for DEC-397. Architecture 03 §5, 08 §4,
    §8, §11, 13 §10 and 14 §11, §14 say the answers. `INBOX.md` ticks the three answered items.
    ADR 0027 has a dated note on the group family. 14 §11 says that a group family counts as one
    group (one folder, one manifest file); 02 and `apps/client/AGENTS.md` point to it.
  - Merge recipe for PR #123 (ADR 0018): on merge with #123, keep both Status-line notes:
    ADR 0026 (2026-11-16, DEC-263) first, then DEC-397 (2026-11-27); `last-reviewed` takes the
    later date. The recipe of the 2026-11-27 07:00 entry for the `specId` lines still holds.
  - Performance: not measured. A Sentinel sprite is 2.5 times as wide as a Warrior's in world
    units, but the player's camera zooms out by the same ratio, so the player's own sprite draws
    the same number of pixels. Other Legends of a bigger class draw more pixels than before on
    the same camera. The wider Sentinel view (DEC-424) is not measured either: a Sentinel player
    sees 240 x 135 m, and 480 x 270 m at `MIN_ZOOM` 0.5, so the match culls and draws more terrain,
    entities and scenery. The owner's playtest checks the 08 §9 metrics, also with a Sentinel
    player at the smallest zoom.
  - `Match.ts` has 306 lines (`wc -l`), one less than before; it stays over the ~300-line guide.
- Checks run: `npm run check:quick` runs in each commit hook. The changed test files and the
  full client and core test suites passed before the critic round 1 fixes; the gate's full check
  covers the final tree. Each new or changed test, except the seven that critic N5 lists, failed
  first on a deliberate break; the record is in the agent work folder,
  `legend-sprites-dec378/fail-first.md`. The full check runs on the final head; its result goes
  into the report.
- Next step: the critic reviews the branch, then the pre-PR gate. The coordinator answers the
  owner's click-to-attack question on card PR170 (13); this PR does not change attack input.
  The coordinator also answers the owner's question in the HC-B57 note (DEC-397).
