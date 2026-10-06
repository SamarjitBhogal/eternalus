---
title: 'PR: feat/map-generator'
description: The pull-request description for feat/map-generator into phase/1-simulation-kernel-and-world (reviewer Aryan Walanj) - the map audit, the config-driven MapGenerator and WorldMap, the Renderer port and every behavioural change for the feat/map author; read this when reviewing that PR.
audience: [humans]
status: active
owner: sholtzman
last-reviewed: 2026-10-06
tags: [changelog, pull-request, map, minimap, renderer]
related:
  [
    'docs/reviews/2026-10-05-map-code-audit.md',
    'docs/architecture/06-map-and-minimap.md',
    'docs/decisions/0009-config-driven-map-generation.md',
  ]
---

# PR: feat/map-generator

**Purpose.** The description for the pull request from `feat/map-generator` into
`phase/1-simulation-kernel-and-world`. Reviewer: **Aryan Walanj** (DEC-04). Title:

`feat(core): config-driven MapGenerator, WorldMap and Renderer port (map audit)`

---

## Summary

Session A of the Sprint 1 prompts: audits the merged `feat/map`/`feat/map-view` code against
ADR 0009 and the architecture, then makes it fit. The hand-traced `MAP_1` is replaced by a
pure, deterministic `MapGenerator` (config + seed → `MapDefinition`). Changing `numLanes`,
`spawnTowersPerLane` or `buffTowersPerLane` regenerates the map and the minimap with no code
change. The client renderer is split into a `Renderer` port and `Canvas2dRenderer`.

## Why

ADR 0009 / D7 and FR-012: the map must come from config, and the minimap must follow with no code
change. DEC-04 lets the lead architect reshape `feat/map` with Aryan reviewing. The audit
(`docs/reviews/2026-10-05-map-code-audit.md`) lists what was kept, which rule each problem broke,
and every deliberate difference from architecture 06.

## Behavioural changes (for the `feat/map` author)

- `MAP_1` no longer exists. Call `new MapGenerator().generate({ map: DEFAULT_MAP_CONFIG }, seed)`.
  The result is frozen, and the same config and seed always give a deep-equal map.
- Feature kinds: `capital` → `stronghold`; `team-structure` → `spawner-tower` / `buff-tower` (per
  lane, at `t` bands); `capital-wall` terrain → `wall-segment` and `gate` features with polygon
  footprints, plus `turret`s on the ring corners; `crossing` → `obstacle` with
  `definitionId: 'bridge-segment'` (one per lane at the rift); `side-objective` → `corner-camp`.
  New: `camp` (forest camps between lanes, `forest-camp-light|medium|heavy` by depth, DISC-42)
  and `capture-point` on the outer lanes (`cathedral` on the middle one).
- `MapFeature.owner` → `team` (`'light' | 'dark' | 'neutral'`, from `teams/teams.types.ts`). New
  fields: `definitionId`, `minimapGlyph`, `laneId?`, `footprint?`. `TeamId`/`FeatureOwner` are
  still exported but `@deprecated`.
- `MapTerrainKind` is `'out-of-bounds' | 'rift'`. `MapDefinition` gains `seed`; `MapLane` gains
  `index`.
- Lane ids are `lane-0`… (north to south); feature ids look like `light-spawner-tower-lane-0-0`,
  `dark-gate-lane-2` or `west-camp-corridor-1-0`.
- Layout: the Strongholds sit at x = 130 / 1470, not 55 / 1545 (the wall ring must fit inside
  the world). The traced north lane bends (all but the first, which now falls inside the gate
  apron, DEC-14 c), the corner objectives (320, 80), the Cathedral (800, 450)
  and the lane crossings (y = 100 / 450 / 800) are kept, and a test checks them. The traced
  middle-lane wobble is gone (the middle lane is straight).
- Map-1's look is now `content/maps/presets/map1Preset.ts`: out-of-bounds corners, a rift
  width profile and lane bends only, in fractions of the world size. It works with any odd
  `numLanes` and scales with the world (layout lengths stay absolute, so very small worlds such
  as 800 × 450 are rejected). The traced rift wobble became a symmetric change of width, so
  the whole map (features, terrain, lanes) is mirror-symmetric and the validator checks it.
- `numLanes` must be odd and ≥ 1 (the Cathedral needs a middle lane), and today ≤ 7: gates are
  spread evenly over a 140° arc and a gate narrower than `wallRing.minGateOpening` between its
  turrets is rejected. `cornerCamps` must be even. The seed must be an unsigned 32-bit integer. Invalid
  configs or layout content throw `MapGenerationError` naming the field.
- New `WorldMap.fromDefinition(map, cellSize, isBlocking)` (core-internal): a walkability grid
  that blocks every cell a shape touches, with reference-counted `stampFootprint`/
  `clearFootprint`. Cell size 5 units (content).
- Client: `engine/Renderer.ts` → `engine/render/Canvas2dRenderer.ts` (implements the
  `engine/render/Renderer.ts` interface). `fillSquare` → `drawWorldGlyph`; new `drawGlyph` for
  minimap markers. `resize` takes the device pixel ratio. `WorldLayer` gains `drawMinimap`.
  `MapView` styles features through `FEATURE_STYLES`. The mini map draws each feature's own
  `minimapGlyph`.
- Public API (`@eternalus/core`): adds `MapGenerator`, `DEFAULT_MAP_CONFIG` and the types `MapConfig`, `MapGeneratorConfig`, `PlayableTeam`, `Team`,
  `MinimapGlyph`, `MinimapGlyphShape`, `MinimapColourRole`; removes `MAP_1`.

## Decisions for the owner

The owner signed off INBOX DEC-14 on 2026-10-06
(`docs/reference/game-design/13-owner-decisions-log.md`), so the four places where an
independent review found the code structured better than architecture 06 are now the design:
the uneven camp split (D5), gates centred on evenly spread exits with a minimum opening (D7),
Light-only lane tracing mirrored to Dark, and reference-counted footprint stamps. The preset
model (D6) was in the same item. Still open: DEC-15 covers
camp weights; the default map has no medium camps. DEC-16 is the lint/worktree tooling fix
(not changed here).

## Independent review

Before this PR a separate reviewer agent checked the branch against the architecture as it
stood at the base commit, without the author's reasoning, and returned _fits after rework_.
Every finding (F1–F18) and its outcome is in the audit, §6. The fixed bugs: gates sealed at 7+
lanes, walls leaking in the walkability grid, the default map not mirror-symmetric, glyph
code touching the 2D context outside `Canvas2dRenderer`, and content objects frozen by
`generate()`. A second pass found that at aspect ratios other than 16:9, lanes could double
back through their own walls (N1). Lanes now leave each gate straight through a short apron and
only bend eastwards. The validator rejects any lane that runs west or through a wall, turret or
Stronghold, and a test replays the old lane shape to prove it is caught. The second pass's
verdict was _fits, no blockers_ once N1 was fixed (audit §6, re-review).

## Stacking note

This branch is cut from `docs/inbox-decisions-2026-10-03` (the phase branch was created from
`main` before that docs PR merged), so the diff shows the docs commit until that PR lands and
`main` is merged into the phase branch.

## Pre-PR gate (`AGENTS.md`, ADR 0010)

- **Critic:** an independent `architecture-reviewer`, given only the branch, the base commit and
  the design docs as of the base, ran three passes. The final verdict: fits the architecture, no
  blockers. Its four better-than-design items were signed off by the owner (DEC-14) and are now
  in architecture 06.
- **Ponytail:** `/ponytail-review` on the code diff found four candidates. Applied: obstacle
  scatter takes one keep-out zone instead of a one-item list. Reverted after trying: inlining
  `MapBuilder.ids()`, which made the file longer. Kept because the architecture or the brief
  requires them: the injected RNG factory (architecture 06 §1, session B's `SeededRandom`) and the
  deprecated `TeamId`/`FeatureOwner` aliases (prompt A step 1). Net −1 line.
- **Re-check:** `npm run check` on the post-ponytail code exits 0. Core "Tests 97 passed (97)",
  client "Tests 36 passed (36)", "Documentation check passed."

## How it was tested

- New core tests: `MapGenerator.test.ts` covers determinism plus a golden FNV-1a hash, a seed
  changing only obstacles, frozen output that never freezes content, full mirror symmetry
  (features, terrain, lanes) for 1–7 lanes and mirrored footprints on the default config, on
  both grounds, unique ids and
  containment, numLanes 3 → 5 (5 lanes, 5 capture points, 5 + 5 towers and 5 gates per team,
  camps over 4 corridors), N towers per lane with SpawnerTowers in front, gates at both lane
  ends, turrets per ring corner, capture points on the centre line, DISC-42 weight ordering, rift
  gaps and bridges, lanes walked in 1-unit steps outside terrain, obstacles off the lanes, the
  map-1 golden coordinates, a 3200 × 1800 world, sealed-gate rejection, every config and
  seed validation error, and a sample of layout validation errors. `WorldMap.test.ts`: flood
  fill proves every lane connects both Strongholds (1/3/5/7 lanes on `map-1`, 3/5/7 on the
  generated ground), closed gates seal the ring, and a wall thinner
  than a cell blocks crossing (this test fails on the old raster). Plus `MapRandom`,
  `LaneGeometry`, `campPlacement`, `wallRing`, `geometry` and the public API.
- Client tests: `Canvas2dRenderer` glyph tracing, DPR-scaled minimap glyphs and outlined rings;
  `RecordingRenderer`; `MapView` styles and minimap glyphs; the minimap proof (config-only
  change → new features drawn, and a never-seen `beacon` definition drawn with its own glyph);
  `SceneView` minimap order.
- `npm run check`: result in `docs/plan/PROGRESS.md` (2026-10-05 entry) and in the PR
  conversation.

## Checklist

- [x] `npm run check` passes locally
- [x] Tests added or updated (bug fixes include a test that failed before the fix)
- [x] No guardrail changes, **or** justified here with a link to the ADR
- [x] No new dependencies, **or** each one justified here in one line and approved by a human
- [x] Changes stay within the scope of the task
- [x] Docs updated where behaviour or workflow changed

Reviewer: @Aryan976503 (Aryan Walanj).
