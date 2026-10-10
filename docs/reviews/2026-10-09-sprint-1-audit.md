---
title: Sprint 1 audit (2026-10-09)
description: Backlog of architecture fixes found when the Sprint 1 pull requests were reviewed against the design docs before merging - each item names the file, the rule it breaks and the fix; read this before fixing Sprint 1 code after the 2026-10-10 presentation, or before relying on a Sprint 1 pattern as an example.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-09
tags: [review, audit, sprint-1, architecture]
related:
  [
    'docs/plan/phase-1-simulation-kernel-and-world.md',
    'docs/decisions/0010-pre-pr-critic-and-ponytail-gate.md',
    'docs/decisions/0011-documentation-longevity.md',
    'docs/reviews/2026-10-05-map-code-audit.md',
  ]
---

# Sprint 1 audit (2026-10-09)

**Purpose.** The product owner chose to merge the remaining Sprint 1 pull requests before the
2026-10-10 presentation and fix their architecture problems afterwards, on the
`chore/sprint-1-audit` branch. Each PR was reviewed against the design docs as they stood at its
base commit by an independent critic (ADR 0010), and every finding that needs work is recorded
here.

**What counts as a finding.** Code or docs that are weaker than the design, or merely different
from it, with no binding reason. A divergence that improves on the design is not a fix. It is
listed under "Proposed design changes" for the owner's sign-off, and the design docs change only
once he approves (`docs/architecture/`, `docs/decisions/` and `AGENTS.md` files need his explicit
approval).

**How to use the backlog.** Item ids are `A<PR>-<n>` and are never reused. When a fix lands on
this branch, tick the item and add the commit; never delete an item. Severity: blocker, major,
minor, nit.

## PR #22 — buildings and map objects (`feat/buildings-and-map-objects`)

**Review:** an independent critic reviewed it after the merge (`8a13c19`), against the docs at `8a13c19^1`. In a fresh clone, `npm run check` gave `EXIT=0` (core 466/466, client 304/304). Verdict: request changes.

**What conforms:**

- Scenery never reaches `Simulation`, a snapshot or `StateHasher`.
- No `Math.random` or `Date` is used, and trigonometry goes through `deterministicMath`.
- The minimap's view-box clamp is a real fix.

**Merge history (recorded as found, ADR 0010):**

- The PR's own pre-PR critic was posted on the PR as "Verdict: BLOCKED" (2026-10-09 05:55Z), with the fixes left to the author.
- Aryan's approval was of `b013fdc`, before the port to the architecture.
- The ported code was approved at `66512d2` by the author of that port, and merged at `8a13c19`. Between the BLOCKED verdict and the merge, only the phase-branch merges changed the PR's files.
- The PR description carries no gate record: no critic verdict, no ponytail cuts, no check output.

The critic's measurements, made with probes against the merged sources:

- **Size:** the default scenery is 3,780 polygons (30,913 vertices), drawn in both the main view and the minimap every frame.
- **5 lanes:** the cathedral apse and the village overlap the capture-point forts.
- **Bridges:** they sit on the lava only because the default lanes happen to cross there.
- **Overpainting:** every structure glyph's centre is painted over by scenery drawn later.

- [ ] **A22-1** (blocker) `packages/core/src/map/*Builder.ts` (`MapSceneryBuilder`, `MapDecorationBuilder`, `MapLandscapeBuilder`, `MapMountainBuilder`, `MapVillageBuilder`, `MapStrongholdBuilder`, `MapFortificationBuilder`, `CathedralExteriorBuilder`, `CathedralInteriorBuilder`), `content/maps/map1Scenery.ts`, `map1Landforms.ts`, `index.ts:28-29,57-60`: a presentation-only subsystem (about 1,800 lines with its tests) sits in L2 core and is public API. The client is its only user. Against 01's layer table, 02 §2 `map/` ("config + seed → `MapDefinition`") and 02 §10 ("something drawn on the canvas → `client/game/views/`"). Move it to `apps/client/src/game/views/scenery/`, keeping at most preset-keyed authored data in core content, and drop the core exports. Keeping it in core would need an owner ADR.
- [ ] **A22-2** (blocker) The same builders apply map-1 geometry to every generated map, whatever its `presetId`. Examples: the ellipse at 800,450; `isWest ? 32 : 1348`; literal 1600/900/1640/940; hand-placed bridges; a cathedral exterior at fixed coordinates while the interior enters at the real cathedral. Against ADR 0009 ("a preset that hardcodes structure positions is rejected"), 06 §5 ("the bridge gaps follow wherever the lanes cross") and sprint 1.3's "no coordinate is hand-written in code". Anchor every dressing on generated features or lane × terrain crossings, key authored landforms by preset id, and draw nothing for presets without scenery. Add tests for `numLanes: 5`, a moved `strongholdInset` and a bent middle lane.
- [x] **A22-3** (blocker, ruled 2026-10-09, DEC-32) Product decisions that nobody had sourced. The owner ruled: the biomes, the village and the team colours stay for now, pending a decision for the full game. The enterable cathedral interior is part of the design. The free camera and world overview are demo-only. Follow-ups: A22-21 to A22-23.
- [ ] **A22-4** (major) `apps/client/src/game/useMatch.ts:104-136,160-164`: raw pointer and wheel listeners bypass `MouseDevice → InputMapper → InputAction` (09 §2–§3, 17 R21). Left-drag pans and left-click enters the cathedral, but mouse button 0 is bound to `attack`. That conflict is latent until `attack` is consumed. The wheel duplicates `camera-zoom-in/out` and cannot be rebound. Add InputActions for pan (on a chord that doesn't conflict) and `interact`, route the wheel through `MouseDevice.wheel`, and delete the raw listeners.
- [ ] **A22-5** (major) `apps/client/src/game/GameCanvas.tsx:14-43`, `GameCanvas.module.css` (14 colour literals), `useMatch.ts:39-40,125,137-140`: the toolbar and legend are HUD living in `game/`, and the view mode reaches React through `useState` and a ref callback (rules 5 and 10; 13 §1, §5, §7; anti-recipe A5). Move them to `ui/hud/`, publish a `map-view` bridge event into a slice field, emit `ui-intent`s for overview and leave-interior, and use colour tokens.
- [ ] **A22-6** (major) `apps/client/src/game/MapExplorer.ts` and `Match.ts`:
  - `MapExplorer` is a second camera outside `engine/camera` and not a `Projection` (08 §5).
  - `Match.enterAt` and `panBy` convert screen → world by hand, and aim still uses the hidden following camera in free view.
  - The Legend keeps walking while the interior is shown.
  - `Match.ts` grew to 371 lines.

  Fold the free mode into `Camera`, or a `CameraController` behind `Projection`, and bring `Match.ts` back under 300 lines.

- [ ] **A22-7** (major) `content/maps/maps.types.ts:190-198` (`color: string`), `map1Scenery.ts:10-32` (`MAP_PALETTE`), about 85 colour literals in the builders, and `views/MapView.constants.ts:11-28`: colours live in core, and the palette exists three times (core, client constants, CSS). Against 06 §8 (`colourRole`; team colour comes from the entity's team) and 13 §7 (tokens). Core should emit a material or role id, and the client should hold one palette shared with the CSS tokens.
- [ ] **A22-8** (major) `MapFortificationBuilder.ts`, `MapStrongholdBuilder.ts`, `CathedralExteriorBuilder.ts`: the static scenery bakes in structure art and paints over the feature glyphs in both views. Structures are destructible entities (07), so this art will outlive them. Draw structure art in per-kind `StructureView`s through `defaultViewRegistry` (08 §8), keep static scenery to ground and landforms, and add a test that glyphs are not overpainted.
- [ ] **A22-9** (major) `MapSceneryBuilder.ts:68-74` and `MapFortificationBuilder.ts:9-15`: kind and team dispatch uses `if`/ternary chains (rule 12, anti-recipe A1). Use a `Record<MapFeatureKind, Dresser[]>` registry, a size table and injected dressers.
- [ ] **A22-10** (major, not measured) `views/SceneryView.ts:17-25` and `Match.ts:198-199`: about 3,800 polygons are filled twice a frame, with no culling or caching, against the 08 §9 budget (render ≤ 8 ms; minimap ≤ 1 ms every sixth frame). Measure first. Then cache the static scenery offscreen (TerrainView, sprint 1.4) and lighten the minimap. Record the interim with a `ponytail:` note.
- [ ] **A22-11** (minor) About 820 numeric literals across the builders. The interior's id and display name are in code (`CathedralInteriorBuilder.ts:37-38`), and `map1Landforms.ts` has no `// TUNE:` markers. Move them to content or `.constants.ts`.
- [ ] **A22-12** (minor) Functions over the size and parameter limits (CONTRIBUTING §4): `MapStrongholdBuilder` (112 lines), `CathedralExteriorBuilder` (69), `MapMountainBuilder` (67), `CathedralInteriorBuilder` (67), `MapSceneryBuilder` (65), the `useMatch` effect (140 lines), and `MapDecorationBuilder.blob`/`rect` (7 parameters). Split them, and use options objects.
- [ ] **A22-13** (minor) `MapSceneryBuilder.ts:54-60` and `CathedralInteriorBuilder.ts:19-55`: `build()` adds to instance state, so a second call returns 7,560 pieces with only 3,780 unique ids. Build into a local array and add a test that calls it twice.
- [ ] **A22-14** (minor) Seven builders and `SceneryView.ts` have no sibling test (02 §8), and the "at its anchor" test only checks a width. Add per-builder tests that assert anchor alignment.
- [ ] **A22-15** (minor) `CathedralInteriorBuilder.types.ts:7`: the presentation-only interior is typed as a `MapDefinition` with a `capture-point` feature that has no entity (06 §4). Give it its own type.
- [ ] **A22-16** (minor) `views/MapView.ts:30,83`: `MapView` nests `SceneryView`, which splits draw order away from `SceneView` (08 §8). Make ground scenery its own `SceneView` layer.
- [ ] **A22-17** (minor) `useMatch.ts:122-126`: the cathedral can be entered only by pointer (13 §7: every screen operable by keyboard alone). Add a keyboard path.
- [ ] **A22-18** (minor) `docs/architecture/06-map-and-minimap.md` §10. Its two new status rows:
  - copy "1600 × 900" instead of naming where the value lives (OG-12);
  - cite "08 §4" (the Renderer port) for scenery;
  - set "Until" targets no design states (a walkable interior).

  Also, 06's `paths` frontmatter misses `SceneryView`/`MapExplorer`, and 08 has no status note. Fix these with the owner's approval.

- [ ] **A22-19** (minor, process) Record the owner's ruling on each item of the earlier BLOCKED critic in the decisions log, and append the missing gate record for PR #22 to `PROGRESS.md`.
- [ ] **A22-20** (nit) `**` in core where ADR 0012 says to treat it like `Math.pow` (use `t * t`). An abstract base class used only to share helpers (prefer composition). `SKETCH_*` duplicates `map1Preset`'s `TRACED_*`. Team colours changed without a source: include those in the A22-3 question.
- [ ] **A22-21** (minor, owner-approved docs change, DEC-32) Document the enterable cathedral interior as design in `docs/architecture/06-map-and-minimap.md` and `docs/reference/game-design/05-map.md`. Say what it is and how the player enters and leaves it, and name where its layout lives instead of copying values (OG-12). Then retire the "Until" target in 06 §10 that implies more than the owner approved.
- [ ] **A22-22** (minor) The in-match free camera and world overview are demo-only (DEC-32). Mark them `PROTOTYPE(...)` or put them behind the developer flag now, and remove them before the full game. A22-4 (raw listeners), A22-5 (the toolbar in `game/`) and A22-6 (the second camera) shrink to the cathedral interior once they are removed.
- [ ] **A22-23** (minor) `docs/reference/game-design/05-map.md` §"Map 1 scenery": rewrite it to match DEC-32. The biomes, village and colours are interim and pending a decision for the full game, the cathedral interior is design, and the free camera is demo-only. Drop the code class names and the copied values.

## PR #23 — escort minions prototype (`feat/minion-follow-prototype`)

**Review:** an independent critic reviewed it after the merge (`8fe091f`), against the docs at `8fe091f^1`. In a fresh clone, `npm run check` gave `EXIT=0` (core 459/459, client 292/292).

**What conforms:**

- AI acts only through `Command`s applied on the next tick (rule 9), and replays do not double them.
- `ai/` imports stay inside its allowed list, and there is no `switch (kind)`.
- The new core code is deterministic.
- No guardrail was weakened.
- The prototype code carries 18 `PROTOTYPE(PROTO-01)` markers.

**Verdict:** request changes.

- [x] **A23-1** (blocker, ruled 2026-10-09, DEC-33) PROTO-01 had no owner ruling. It is now ruled demo-only: the escort, speed 5.4 and mass 0.5 are not the design. Minions and mobs are Samarjit's to implement, and the escort goes when his Phase 3 minions replace it. A23-2 to A23-16 are Samarjit's, and any that touch only prototype code close when it is deleted.
- [ ] **A23-2** (major) `packages/core/src/ai/Controller.types.ts:11-13` and `content/units/units.types.ts:26-27`: the `Controller` contract differs from 11 §2 (`id: string` instead of `ControllerId`, plus a `cadenceTicks` member), and `controller?: string` has no prototype marker either. Phase 3 builds on this contract. Either mark both and list them in PROTO-01, or align them now: take cadence from the AI profile in content (11 §6) and add a `ControllerId` union.
- [ ] **A23-3** (major) `docs/plan/phase-1-simulation-kernel-and-world.md:115,194` (commit `b12aa0f`): two ticked items are not met. `DeathSystem` is not yet "the only removal path" (see A13-1) and has no "removal without a cause does not compile" test. `MinimapView` draws no unit dots and has no lower cadence. Untick both or annotate them "done except …", and append a PROGRESS correction.
- [ ] **A23-4** (major) Stale governing docs:
  - `docs/architecture/11-game-ai.md:24` still says "No AI code exists yet" and has no Implementation status section listing the PROTO-01 stand-ins. Its `paths:` frontmatter matches `ai/**`, so agents working there are misled.
  - 04 §13 still says "`light-mob` (the training dummy only)".
  - The "Today" list in `packages/core/AGENTS.md` leaves out `ai/` and `content/ai/`.

  These are architecture-doc and AGENTS.md edits, so they need the owner's approval.

- [ ] **A23-5** (minor) `packages/core/src/ai/FollowLeaderController.ts:46-83`: the controller does its own steering (seek, plus separation over a full scan). 11 §1 says "controllers decide _what_, systems decide _how_", and 10 §9 puts separation in `PathingSystem`. Add this to PROTO-01's replacement table.
- [ ] **A23-6** (minor) `packages/core/src/ai/AiSystem.ts:40-51`: decisions are staggered by store position, so removing any entity shifts every later brain's phase. Use `fnv1a(entityId) % cadence` and add a test.
- [ ] **A23-7** (minor) `packages/core/src/systems/DefaultSystemPipeline.ts:9-19`: the TSDoc's "the one place a system is added" is no longer true, line 18 is garbled, and no test checks that the `decide` systems run before `MovementSystem`.
- [ ] **A23-8** (minor) `apps/client/src/game/Match.ts:115,211-236` and `Match.constants.ts:40-45`: the escort's count and radius are gameplay numbers in the client, and `Match` issues `dev-spawn` in every match, although 03 §3 forwards `dev-*` commands only with the developer menu. Gate the escort behind the dev flag, or move the numbers into core content.
- [ ] **A23-9** (minor) `packages/core/src/Simulation.ts:9,66`: the follow-leader profile is a module import that bypasses `options.content` (03 §6). Load it through the injected content and validate it.
- [ ] **A23-10** (minor) `packages/core/src/ai/AiSystem.ts:47-50`: an unknown controller id throws in the middle of a step. Check every definition's `controller` when `Simulation` is constructed.
- [ ] **A23-11** (minor) `docs/plan/PROGRESS.md`: merge `c563c01` rewrote an entry's date (2026-10-09 → 2026-10-08), so the appended correction now contradicts it. Append a note about the rewrite; do not edit the entry again (ADR 0011).
- [ ] **A23-12** (minor) `packages/core/src/content/mobs/lightMinion.ts:13`: a prototype with off-reference stats uses the canonical id `light-minion`, and ids are never renamed once used. Rename it to a prototype id before replays or saves use it, or get the owner's OK.
- [ ] **A23-13** (minor) `packages/core/src/ai/`: the determinism check compares only the final hash of two runs in one process. Add a recorded escort replay fixture with checkpoints and a command-log check (11 §8).
- [ ] **A23-14** (nit) `apps/client/src/game/views/MobView.ts` copies `LegendView` line for line. Use one `OutlinedEntityView(color, scale)` registered twice.
- [ ] **A23-15** (nit) `packages/core/src/ai/AiSystem.ts:31`: a duplicate controller id silently overwrites the first. Throw, as the other registries do.
- [ ] **A23-16** (nit) Comment lines longer than 100 columns: `DefaultSystemPipeline.ts:18`, `lightMinion.ts:21`, `Controller.types.ts:12`, `EntityStore.ts:121`.

## PR #24 — settings and keybindings (`feat/settings-keybindings`)

**Review:** six critic passes before merge, recorded in `docs/changelog/pr-feat-settings-keybindings.md`. Pass 6 found it ready to merge. Its better-than-design items are signed off (DEC-25…DEC-31; ADR 0015 accepted). It was approved by Claudio. Samarjit's requested changes were made in the review round: one `chordKey` in `bridge/` (DEC-30) and a shared `readOrQuarantine` (DEC-31). The items below are what the reviews left open.

- [ ] **A24-1** (minor) `apps/client/src/game/useMatch.ts`: the match builds `InputMapper(PRESETS.wasd)`, so a rebinding made in Settings never reaches the match. Feed the player's bindings (from `SettingsController` or the store) into the match's mapper. This is the brief's done-when, "rebinding W → ArrowUp updates the HUD glyphs", end to end.
- [ ] **A24-2** (minor) `PauseOverlay` is not mounted anywhere, so Esc does nothing in a match. Mount it in the match screen (session G).
- [ ] **A24-3** (minor) Settings use the memory storage adapter and reset on reload. The IndexedDB adapter is S2. Before it lands, settle the store key: one `SettingsDtoV1` per `profileId`, or per `[profileId, group]` as architecture 14 sketches.
- [ ] **A24-4** (minor) `useBindingCapture.ts`: the DOM glue of the capture hook is untested (critic N2). Add a test.
- [ ] **A24-5** (minor) `apps/client/src/main.tsx`: runtime logs go to `NullLogger` "until the client sinks land" (`TODO(sam)`). They have landed (`data/logging/SinkLogger.ts`, `ConsoleSink.ts`, `RingBufferSink.ts`), so wire them.
- [ ] **A24-6** (nit) `SettingsScreenOptions` spells out its tab union instead of deriving it from `TABS`.
- [ ] **A24-7** (nit) `fakeKeyEvent.ts` (from #19) duplicates `syntheticEvent`. Keep one.
- [ ] **A24-8** (nit, tooling) `knip.json`: knip hints "Remove from ignoreDependencies" for `@eternalus/core` in `apps/client`.
- [ ] **A24-9** (deferred until a second DTO exists) Move the generic `DtoCheck<T>`, `isRecord`, `FieldCheck`, `groupProblem` and `isBoolean` from `dto/SettingsDto.ts` into a shared `dto/dtoCheck.ts`.

## Stand-ins whose trigger has fired

Interim code marked "replace when session X lands". Those sessions have now landed, so each stand-in is due. Ids use the PR that added the stand-in.

- [ ] **A8-1** (major) The map's kernel stand-ins: `DEFAULT_MAP_CONFIG`, `validateMapConfig`, `MapRandom` / `map/Rng.types.ts`, `MapLayout.navCellSize` and the local `MapConfig` (session A's swap, `INBOX.md` requests). This one waits on the owner's choice of where config is validated and the PR timing, and it is tracked in `INBOX.md` and architecture 06 §10.
- [ ] **A12-1** (minor) `apps/client/src/game/session/LcgRng.ts`: replace with core's `SeededRandom`, exported since #13, at the `createRng` line in `main.tsx`.
- [ ] **A12-2** (minor) `apps/client/src/game/content/placeholderSetup.ts`: use `createDefaultGameConfig().match` (exported since #13).
- [ ] **A12-3** (minor) `apps/client/src/bridge/domain.types.ts`: re-export `PlayableTeam` and `Team` from `@eternalus/core` (exported since #8).
- [ ] **A12-4** (minor) `apps/client/src/bridge/domain.types.ts` and `game/content/placeholderCatalogue.ts`: use `LegendClassId` and `LEGEND_CLASSES` from core. Session C has merged, but core's `index.ts` does not export either yet; export what the client needs first.
- [ ] **A13-1** (minor) `packages/core/src/commands/handlers/DevRemoveEntityHandler.ts`: hand removal to `DeathSystem`, which exists now. 03 §4 makes it the only `entity-removed` emitter.

## Full audit of the merged code (phase tip `26ae27e`)

Six independent critics each reviewed one area of the merged code at `26ae27e` against the design docs at the same commit. The areas: K (core kernel), E (entities and content), M (map), C (client engine and input), S (client shell) and D (docs, process and guardrails). Baseline `npm run check` at `26ae27e` gave `EXIT=0` (core 466/466, client 305/305, docs check passed). Findings already listed above are cited by id, not repeated. Items marked "owner approval" change an architecture doc, an ADR or an `AGENTS.md` file.

### Area M — map generation, map and minimap drawing (#1, #2, #8, #22)

**What conforms:**

- Generation is pure and deterministic from config and seed, and pinned by a golden hash.
- Every lane and feature is placed from config and mirrored, symmetry is validated on every `generate`, and lane and tower counts change with zero code.
- Presets are content only, and no feature coordinate is written in generator code.
- `WorldMap` follows 06 §6.
- Trigonometry goes only through `deterministicMath`.
- Views draw only through `Renderer`, using `import type` from core.

From the 2026-10-05 map audit, D1–D3, D5–D9, F3, F4, F6, F13 and F15–F17 still hold, and F8 is fixed. D4 and D11 named session H as their trigger, and #18 merged without that work (AM-2).

- [ ] **AM-1** (minor; settle before A8-1; owner approval) `packages/core/AGENTS.md:23,25` says `map/` may import `content/`, `teams/` and `utils/`, while 02 §2 (`02-code-structure.md:68,74`) adds `config/` and `physics/`. The two docs also disagree on `content/` → `config/` types. A8-1 needs `GameConfig['map']` in `map/`. Align the two docs; this joins A23-18's boundary conflicts.
- [ ] **AM-2** (minor; owner approval) `06-map-and-minimap.md:415,419`: the Minimap and Renderer-port rows give "session H" as the "Until", but #18 has merged. Re-point them to SCRUM-151 / Phase 2 sprint 2.8 and to sprint 1.4's renderer and `TerrainView`, and drop the branch names from 06's Purpose paragraph (`:33-35`).
- [ ] **AM-3** (minor) `map/MapGenerator.ts:43`, `terrainLayout.ts`, `riftTerrain.ts`, `campPlacement.ts:60-68`: only a preset's `laneProfile` is validated. Rift knots out of order, a negative `halfWidth`, an empty rift profile, a 2-point bounds polygon and bounds crossing the axis all generate without error, and `cornerCamps: 28` places west corner camps on the east half. Add `validateMapPreset` and a rule that keeps corner camps on their half and off the lanes, with one test per rule.
- [ ] **AM-4** (minor, latent) `apps/client/src/game/Match.ts:95,362-370`: the client finds the spawn point by checking `feature.kind === 'stronghold'` (06 §4 lets only `EntityFactory.fromFeature` read a feature's kind). It spawns the Legend, and the escort, at the stronghold's centre, inside its blocking footprint (radius 40). Emit a per-team spawn slot from the generator, outside the footprint, and resolve it in core. Until then, record it with A23-20.
- [ ] **AM-5** (minor) `apps/client/src/game/Match.types.ts:33-34`: the TSDoc says "the generated map the simulation plays on", but `Simulation` never receives the map, features are not entities, and `WorldMap` is built only in tests. Fix the TSDoc and add a 06 §10 row: the map is outside the simulation until Phase 2's spawn-from-`MapDefinition` items.
- [ ] **AM-6** (minor) `content/maps/maps.types.ts:82-90` vs the `content/structures/` and `content/obstacles/` types: the same ids have two definition types, each with its own `footprintRadius`. Add a 06 §10 row now. In Phase 2, move `minimapGlyph` and `isBlocking` onto the entity definitions so the footprint has one source.
- [ ] **AM-7** (minor) `apps/client/src/game/views/MapView.constants.ts:50-62`: features are drawn at world sizes kept in the client, which disagree with content (stronghold 50 vs a footprint of 80; turret 14 vs 16; tree 14 vs 16; rock 14 vs 20), so what the player sees is not what blocks them. Draw `feature.footprint` where one exists.
- [ ] **AM-8** (minor) 13 helper files in `packages/core/src/map/` (from #8) have no sibling test (02 §8). Add tests for the pure helpers (`riftTerrain`, `symmetry`, `mapSymmetry`, `validateMapLayout`, `ProfileLaneShape`), or record in 02 §8 that a builder's step helpers may be tested through its facade (owner approval).
- [ ] **AM-9** (minor) `docs/plan/phase-1-simulation-kernel-and-world.md:135,142,147,162`: "(feat/map-generator, pending merge)" and the `WorldMap` note ("until B's GameConfig lands") are stale. The ticks at `:142` ("no coordinate is hand-written in code") and `:162` ("a second preset needs only content"; "preset validates") have not held since A22-2 and AM-3. Annotate them "done except …" and append a PROGRESS correction.
- [ ] **AM-10** (nit) `packages/core/src/utils/geometry.ts:55` uses `**` on the generator's path (ADR 0012). Use multiplication, and re-pin the golden hash only if the output changes.
- [ ] **AM-11** (nit) `apps/client/src/game/views/DefaultEntityView.ts:4` imports `TEAM_COLORS` from `MapView`'s companion constants file. Move it into one shared palette (see A22-7).
- [ ] **AM-12** (nit) `engine/render/Canvas2dRenderer.ts:104,124`: stroke widths are in device pixels, so lines are half as thick at DPR 2 (08 §4: game code works in CSS pixels). Scale them by `pixelRatio` and add a DPR-2 test.
- [ ] **AM-13** (nit) `map/MapGenerator.test.ts:509-519` hand-rolls FNV-1a; use `utils/fnv1a.ts`.
- [ ] **AM-14** (nit) `packages/core/src/index.ts:78-90`: remove the unused deprecated `TeamId` and `FeatureOwner` aliases.
- [ ] **AM-15** (nit) `map/wallRing.ts:9`: `MAX_GATE_SHARE_OF_GAP = 0.4` shapes the generated gates. Move it into `MapLayout.wallRing` with `TUNE`, or document it as an invariant.
- [ ] **AM-16** (nit; owner approval if the doc changes) `map/MapBuilder.ts:177-185` always emits bridge segments, while 06 §3 step 7 says "when enabled". Add a layout switch, or drop the wording.
- [ ] **AM-17** (nit) `map/MapBuilder.types.ts:48-74` holds types that belong to function modules. Move each to its module's own `.types.ts`.
- [ ] **AM-18** (nit) The code says `MiniMapView`, while 02, 06, 08 and plan 1.4 say `MinimapView`. Pick one.
- [ ] **AM-20** (nit, process) Commit `b013fdc` (#22) uses the scope `feat(map)`, which is not allowed. Record it in A22-19's gate record; history is not rewritten.

Extensions to earlier items:

- **A8-1:** `GameConfig.map.navCellSize` has no reader, and `WorldMap.ts:31-33` documents the old source. There are two `Rng` interfaces. `validateMapConfig` lists every problem, while `validateGameConfig` throws on the first. `DEFAULT_MAP_CONFIG` is also used by `MapView.test.ts` and `MiniMapView.test.ts`. AM-1 comes first.
- **A22-2:** the builders never throw at 1, 5 or 7 lanes or at other world sizes; the failure is wrong art, not a crash. A map with no preset still gets 3,505 pieces of map-1 scenery.
- **A23-3:** confirmed that `Match.ts:199` draws the minimap every frame and that `EntityLayer.drawMinimap` is empty.

### Area S — client shell: bridge, UI, session, data (#12, #25, #26)

**What conforms:**

- `ui/` imports only `bridge/`, `ui/` and `styles/` (rule 5), and every UI action goes through `emitIntent`. Only the session states emit bridge events.
- One store with the seven contract slices.
- `SESSION_TRANSITIONS` equals 13 §2's table, and all 64 pairs are tested.
- Countdowns run on the `SessionClock` port.
- The screen flow matches reference 14.
- `ui/` has no colour literals.
- Accessibility basics: a focus ring, reduced-motion handling, labelled navigation, and `lang`.
- No storage or fetch outside the facades.
- #25 is fully reverted by #26, and #26's Warrior preselect carries its removal trigger.
- The game → UI events (`match-clock`, `hud-state`, `announcement`, `settings`) have no producer yet, so `ResultsScreen` cannot be reached. The plan honestly leaves this unticked.

- [ ] **AS-1** (major) `ui/components/PlaceholderScreen.tsx:31`, `ui/screens/screen.types.ts:4-5`, `ui/App.tsx:16-21,30,39`, `game/session/states/MatchState.ts:4-7`, `useMatch.ts`, `Match.constants.ts:24-28`:
  - **What happens:** the `Match` lives as long as the viewport renders, not as long as the `match` phase. `PlaceholderScreen` stands in for every phase from `boot` to `match`, and for the `settings` route, and always renders the viewport. So the match is created at `loading` and runs for 70 s or more before `match`.
  - **Wrong setup:** it ignores the session's `MatchSetupDraft` and always plays seed 1 as the Light Warrior, while the session draws a random team and themes the page, so about half of runs show the Dark theme.
  - **Against:** 13 §2 (`createMatch(setup)` on `match-loading → match`; `match.destroy()` on exit) and reference 14 §5.
  - **Fix:**
    - render the viewport only in `match`;
    - have the owner pick who owns the lifetime (AS-7, C2);
    - feed the seed, team and selection into the `Match`;
    - remove the stale `MatchState` TSDoc;
    - add a test that no viewport renders outside `match`.

  PR #26 deliberately kept the canvas playable for the demo, but neither the code nor 13 marks that.

- [ ] **AS-2** (minor) `game/session/states/CharacterSelectState.ts:55-56` and `SessionController.test.ts:170`: post-MVP sub-classes can be selected (reference 14 §2), and the test treats `knight` as valid. Reject `status: 'post-mvp'`, correct that test, and add a rejection test.
- [ ] **AS-3** (minor, latent) `bridge/events.ts:82` and `ui/components/ThemedBackground.tsx:24-25`: image layers load through a raw CSS `url()`, outside `ResourceController` (rule 13, 14 §1). Use `{kind:'image', assetId}`, resolved after the `selection` group loads.
- [ ] **AS-4** (minor; ADR needed, tooling) `eslint.config.js:41-44`: there is no client boundary lint (02 §11), so rule 5 and "ui/ never writes the store" are checked by review only. After an ADR, add a `ui/` `no-restricted-imports` block (`game/`, `data/`, core, `react-redux` `useDispatch`/`useStore`, value imports of `store`/`eventBus`), and move or exempt `ui/testStore.tsx`.
- [ ] **AS-5** (minor; owner approval) `docs/architecture/13-game-interface.md:31-32` still says "nothing under `ui/`…" and has no Implementation status section. After #24's §10 lands, add session D's and #26's interim items, including the preselected Warrior.
- [ ] **AS-6** (minor; owner approval) Undocumented folders and routing:
  - 02 §3 and 17 R20 lack `game/session/`, `game/content/` and `engine/time/SessionClock*`.
  - 13's `paths` miss the session files.
  - 14 claims `data/logging/**`, which belongs to 15.
- [ ] **AS-11** (minor, tests) `ui/screens/{About,Loadout,Profile,Results}Screen.tsx` and `ui/components/PlaceholderScreen.tsx:35-43`: no test asserts the intent behind Back, Play again, Main menu or Leave match, and `ResultsScreen` is at 60 % statement coverage. Assert the emitted `UiIntent`.
- [ ] **AS-12** (nit) `ui/components/ThemedBackground.tsx:11-43`: a second component and a helper share the file, and layers are dispatched with an `if` chain on `kind` (13 §7, 17 A1).
- [ ] **AS-13** (nit) `bridge/events.ts:129` and `ui/strings.ts:4-7`: session reasons are free strings, so a typo silently drops a banner. Add a `SessionReason` union.
- [ ] **AS-14** (nit) 12 source files (four bridge slices and the session states) have no sibling test, and the trigger PR #12 recorded for adding them never fired. Add them, or record the exemption. Also check the particles' `colourToken` in `placeholderCatalogue.test.ts`.
- [ ] **AS-15** (nit) Plan line 199 still says "pending merge". The client coverage thresholds are 55 against measured coverage of about 89 %, and `guardrails.md` §2 still says 45/50. Ratchet both.

Owner decisions from area S are listed under "Proposed design changes": AS-7, AS-8, AS-9, AS-10, AS-16 and AS-B1 to AS-B3.

### Area K — core kernel: config, utils, state, commands, diagnostics, systems (#13, #17)

**What was checked:** every source file in scope; an import census against 02 §2; sibling-test and file-size censuses; greps for `Math.*`, `**`, maps, sets, sorting, time, `console`, casts and markers. Core coverage thresholds are still 85 everywhere.

- [ ] **AK-1** (major; owner approval) The kernel's status notes are stale:
  - **03 §12** still says `Simulation(config, seed, logger, systems = [])`, that `move`/`stop` are unsupported, that the factory keeps its own id counter, and that there are no `recentCommands`.
  - **15 §13** says "Not built yet: `Invariant`, `InvariantRunner`, …", but they exist.
  - **10** has no status section, though `Movement` differs from 10 §2: per tick, no `|dv|` clamp, no friction, store order.
  - **Core `AGENTS.md:15-16`** still says "`systems/` with the pipeline only".

  PR #17 kept 03 unchanged until approved, and its replacement text waits in `INBOX.md` (item 7). Approve and apply that text, write 15 §13 and 10 status notes, and fix the core AGENTS "Today" list.

- [ ] **AK-3** (minor) `components/Movement.ts:71,98` and `diagnostics/invariants/FiniteTransformsInvariant.ts:36` use `Math.hypot`; `utils/geometry.ts:11,55` use a bare `Math.sqrt` and `**`. ADR 0012 treats these as engine-dependent, and `utils/vec2.ts` already has `length`/`normalizeInto`. Use those and the `sqrt` wrapper. An ADR 0012 amendment adding `hypot` and the other approximated `Math` functions to the lint is the owner's call.
- [ ] **AK-4** (minor) `commands/handlers/DevSpawnHandler.ts:16-44`: `team` is never validated, so a bad `dev-spawn`, for example from a JSON replay or a dev dump, throws out of `Simulation.step()` instead of being rejected (03 §3). `count` is also unbounded for kinds the caps don't cover. Add an `invalid-team` reason and a bound, with tests.
- [ ] **AK-5** (minor) `Simulation.ts:55-58` and `Simulation.types.ts:19-20`: injected content skips the validation and per-tick conversion that `loadDefaultContent` does (03 §6, "validates config and content"). Extract `loadContent(definitions, tickRate)` for both paths, and document the contract.
- [ ] **AK-6** (minor, latent) `entities/EntityFactory.ts:22`: the entity id counter belongs to the factory, outside `GameState` and outside the hash. Two states can hash equal yet issue different next ids, save/resume cannot restore it, and systems (the future `SpawnSystem`) cannot reach it (03 §2, §9; 15 §3). Move it into `GameState`, hash it, and test that.
- [ ] **AK-7** (minor, test gap) `diagnostics/replay.test.ts`, `randomCommands.ts:43` and `__fixtures__/wanderSeed7.replay.ts` never run the shipped pipeline:
  - the fixture spawns an unregistered `walker` (all rejected), so its moves are rejected too;
  - invariants never run under random commands;
  - the only real-pipeline determinism check is one Warrior for 90 ticks.

  Add a seeded property test on the default pipeline with heavy invariants (15 §9), and a golden fixture recorded on it (17 R16).

- [ ] **AK-8** (minor) `systems/DefaultSystemPipeline.ts:12` and `diagnostics/DefaultInvariantRunner.ts:9` are subclasses, while 02 §4/§9 and 15 §2 specify `createDefaultSystemPipeline()` and `createDefaultInvariants()`. The owner declined the same class-shaped registry for entities (DEC-21), and 17's `default*.ts` glob misses them. Replace them, and close the optional idea in `INBOX.md:151-153`.
- [ ] **AK-9** (minor) `diagnostics/DefaultInvariantRunner.test.ts`: add 15 §10's registry test (every id has a test file, no duplicates), and have the runner reject duplicate ids.
- [ ] **AK-10** (minor) `systems/DeathSystem.ts:14-25` polls `Health` and removes with no killer, against 03 §2/§4 (`entity-died` from `DeathResolver`). That is acceptable while combat doesn't exist, but record it in 03 §12 (with AK-1) and switch it when `DamagePipeline` lands.
- [ ] **AK-11** (minor) `config/defaultGameConfig.ts:25-27`: `countdownSeconds`, `hordeSizes` and `initialHordesPerTeam` are marked TUNE in FR-003, FR-037 and FR-004, but have no `// TUNE:` marker.
- [ ] **AK-12** (minor) `utils/deepFreeze.ts` has no sibling test, and its `Object.isFrozen` cycle guard leaves the mutable children of a shallow-frozen parent unfrozen. Use a `WeakSet` and add a test.
- [ ] **AK-13** (nit) `utils/SeededRandom.ts:6-7`: a module-level helper sits in a class file.
- [ ] **AK-14** (nit) `diagnostics/InvariantRunner.constants.ts:32-33`: move `SPEED_TOLERANCE` to `FiniteTransformsInvariant.constants.ts`.
- [ ] **AK-15** (nit) `NoRemovalWithoutCauseInvariant.constants.ts` copies the `RemovalCause` union. Derive both from one `as const` array in `state/`.
- [ ] **AK-16** (nit; public API change) `index.ts`:
  - `StateHasher` is exported but unusable without a `GameState`, and 02 §6 doesn't list it.
  - `SimulationOptions` (02 §6) is not exported.
  - The unused deprecated `TeamId`/`FeatureOwner` aliases are still there (also AM-14).
- [ ] **AK-17** (nit) `config/validateGameConfig.ts:125` returns the caller's object unfrozen. Return a deep-frozen copy.
- [ ] **AK-21** (doc) `docs/plan/phase-1-simulation-kernel-and-world.md:46-78`: annotate the sprint 1.1 items ticked against superseded text: command stamping (DEC-20), the match timeline and the replay content version.
- [ ] **AK-22** (doc; owner approval) `paths` frontmatter: 03 should claim `systems/DeathSystem*` and `systems/*Pipeline*`, and 15 should claim `systems/InvariantSystem*`. Add the emit-semantics sentence to 03 §4: a subscription changed during an emit takes effect from the next emit.

Extensions to earlier items:

- **A23-3:** `GameState`'s `entities.remove` is public to every holder, including AI controllers, so "no public `remove()`" is met only by its letter.
- **A23-7:** `DefaultSystemPipeline.test.ts` can't detect a reordering, and the tick order is split over three places (sprint 1.1's "reads as a list in code" is unmet).
- **A8-1:** `DEFAULT_MAP_CONFIG` is still public API.

### Area C — client engine, match and input (#18, #19)

**What conforms:**

- `GameLoop` matches 08 §2 exactly: the clamp, whole ticks, `alpha`, and keeping the remainder on `stop()`. Its tests use only the fake scheduler.
- `requestAnimationFrame`, `performance.now` and `setTimeout` stay inside their adapters, except AC-8.
- Only `Canvas2dRenderer` touches the context (rule 7).
- Views use `import type` from core (rule 6).
- `engine/` imports nothing above it, and `console` appears only in `ConsoleSink`, with a named disable.
- There is no `switch` on kind in `ViewRegistry`, and player input reaches core only as `Command`s (rule 9).
- Translating the intent into `move`/`stop` inside `Match` is an acceptable interim (`INBOX.md:81-85`), to be recorded by AC-3.

- [ ] **AC-1** (major) Merged into **AS-1**: the match runs behind every placeholder phase and the Settings route, and plays seed 1 as the Light Warrior. It adds three points:
  - `KeyboardDevice` cancels the default of every bound key on `window` behind the menus;
  - a throw from `Simulation.step()` escapes the rAF callback, and nothing routes it to the session (13 §2: a step exception sends `match` to results or menu);
  - the `PLACEHOLDER_*` trigger names session E, but session D already publishes the setup.

  Add a test that phases other than `match` schedule 0 frames.

- [ ] **AC-2** (major) `apps/client/src/game/useMatch.ts:42-181` is a second composition root that no test runs. A React effect chooses and constructs every adapter: renderer, scheduler, camera, devices, logger and sinks, mapper, simulation and map. It also holds the plan's ticked "clear held input on `blur`/hidden `visibilitychange`" and all listener teardown. `GameCanvas.test.tsx` renders on the server, so the effect never runs (17 A8; 01 §3; 15 §4). Move construction into a Node-testable `createMatch` factory in `game/`, test focus-loss release, resize and a teardown that leaves 0 listeners, and reduce `useMatch` to mount and unmount. Land it with A22-4 and A22-12.
- [ ] **AC-3** (major; owner approval) Docs 08 and 09 have no Implementation status section (`last-reviewed: 2026-09-30`), yet `INBOX.md:197`, `PROGRESS.md:349,364,376` and PR #18's description say the differences are "recorded in 08 §11". #18's critic accepted its divergences on that condition. Commit `e19fcad` added §11, and `fb310c6` removed it pending approval. The text waits at `INBOX.md:199-234`. Agents editing `engine/`, `views/` and `input/` are routed to a design that differs on the Renderer port, Camera/Projection, `Match`'s dependencies, the input pipeline, the clock and the sinks. Approve the text, amended with AC-1 to AC-8, as 08 §11 and 09 §11. Append a PROGRESS correction for `fb310c6`, and fix `INBOX.md:197`.
- [ ] **AC-4** (minor) There are two world ↔ screen transforms: `Camera.ts:65-92` and `Canvas2dRenderer.ts:82-87,147-152`. 08 §5 asks for one `Projection`, and #22's `MapExplorer` is a third. Keep one, drop `Camera.worldToScreen`, and add a round-trip test (with A22-6).
- [ ] **AC-5** (minor) `Camera.ts:21-25` and `Canvas2dRenderer.ts:82-87`: a fixed 64 × 36 view with X and Y scaled separately stretches the world, circles included, on windows that aren't 16:9. Derive the height from the aspect ratio, and test that scale X equals scale Y at 4:3.
- [ ] **AC-7** (minor) `useMatch.ts:89-94`, `Match.ts:73-85,170-265`, `Canvas2dRenderer.ts:53-57` and `Renderer.ts:21-30`: device pixels leak into `Match`, there is no `ctx.scale(dpr)`, resizing comes from a `window` listener, and the port mixes units (08 §4, 09 §4). The renderer should own DPR and a `ResizeObserver`, game code should work in CSS pixels, and the port should use one unit for widths. Extends AM-12.
- [ ] **AC-8** (minor) `useMatch.ts:54`: `() => performance.now()` stamps the logs, outside the clock port (09 §6, 15 §4). Inject `SessionClock.now`, which has existed since #12.
- [ ] **AC-9** (minor) `Match.ts:108-122`: `Match` decides the draw order by passing two layer lists, instead of `SceneView` defining it in one place (02 §9, `apps/client/AGENTS.md`). Give `SceneView` fixed slots (terrain → scenery → entities → overlay). Extends A22-16.
- [ ] **AC-10** (minor) Contract suites are missing for `FrameScheduler`, `Renderer` and `LogSink` (09 §9, 15 §10, 17 R25), and `RafFrameScheduler.test.ts` has one case. Add the three suites, each run by the real adapter and its double.
- [ ] **AC-11** (minor) Phase-1 plan lines 185, 188, 206 and 220 are ticked without meeting their done-when:
  - **Camera:** views still compute screen coordinates (`MiniMapView`).
  - **SceneView:** draw order is not in one place (AC-9).
  - **Logger sinks:** nothing reads the ring buffer, and `b12aa0f` re-ticked the item after #18's author had unticked it.
  - **Devices:** the blur/visibility release is untested (AC-2).

  Untick or annotate them, and append a PROGRESS correction (with A23-3).

- [ ] **AC-12** (minor; owner approval) `06-map-and-minimap.md:419`: the Renderer row's trigger ("session H's layers and sprites") has fired without that work. Move the row to 08 §11 with a real target (see AM-2).
- [ ] **AC-13** (minor, latent) `KeyboardDevice.ts`, `MouseDevice.ts`: devices keep only held state, and the mapper derives `pressed` by comparing two reads once per tick. A press and release between two reads is lost (09 §3, "pressed this frame"). It is latent because `Match` drops `aim` and `triggered`, and #24 keeps held-only devices. Latch presses until read, and add a contract case.
- [ ] **AC-14** (nit) `Match.ts:189-192` makes the camera follow the tick position, not the interpolated one (08 §5), and its smoothing depends on the frame rate.
- [ ] **AC-15** (nit) `RingBufferSink.ts:26-31` uses `push`/`shift`, which is O(capacity) per write. Use a fixed array with a head index.
- [ ] **AC-16** (nit) `DefaultEntityView.ts:25-27` branches on team in a view (17 A1). Use a palette lookup that includes neutral (with A22-7 and AM-11).
- [ ] **AC-17** (nit) `engine/Camera*.ts` should live in `engine/camera/` (08 §1, 02 §3).
- [ ] **AC-18** (nit; owner approval) `paths` frontmatter: 08 misses `useMatch`, `GameCanvas`, `DeviceIntentSource` and the `Match.*` companions, and `data/logging/**` is matched only by 14 (with AS-6).
- [ ] **AC-19** (nit) After #24 merges, re-check the input layer against this audit: #24 adds `now: () => Date.now()` in `main.tsx`, the same problem as AC-8, and keeps AC-13. A24-1 still applies.

Extensions to earlier items:

- **A23-14:** `LegendView` is the same data-only subclass as `MobView` (17 A7); one `OutlinedEntityView` covers both.
- **A22-6:** see AC-4.
- **A22-16:** see AC-9.
- **A22-4 and A22-12:** fix them through AC-2's factory.
- **A22-18:** 08's missing status note is AC-3.

### Area E — core entities, components and content (#14)

**PR #14's must-change items are all fixed at `26ae27e`:**

- **B1:** the factory resolves definitions by id through an injected `DefinitionSource`, and `dev-spawn` rejects unknown definitions.
- **M1:** `Unit` installs its component set, and `UnitComponentInstaller` is gone.
- **M3:** shields, heading, `Collider.isEnabled` and `Vision.revealedUntilTick` are hashed and tested.
- **M4 / DEC-22:** rules see the catalogue and run from `loadDefaultContent()`. The residue is AE-4.
- **M6:** the handoff items are done; the registry is wired and ids come from `IdGenerator`.
- **DEC-21:** `defaultEntityRegistry.ts` is the only file naming concrete classes.
- **DEC-24:** the ring lint is removed, and its follow-up PR has not been opened yet.

**The doc edits stayed within the owner's approvals:** 04 §5, the 04 §13 removals, 05 §2–§3 and 07 §2. One caveat: the 05 §2 edit also moved "resolves `extends`, converts seconds to ticks" to `loadDefaultContent()`, which goes beyond decision 2 (AE-19).

- [ ] **AE-1** (major) `content/units/units.types.ts:3-15`, `loadDefaultContent.ts:8-31`, `legends/legendCatalogue.ts:8`, `mobs/mobCatalogue.ts:8`: authored per-second and loaded per-tick unit definitions share one type, and both satisfy `DefinitionSource`. So nothing stops per-second data reaching `Movement` (30× speed and 900× acceleration at 30 Hz), and four entity tests already build `Movement` from per-second data (05 §2 `AbilityAuthoring`; 03 §10). Add `UnitAuthoring`/`MovementAuthoring` for content files, let only `loadDefaultContent` produce `UnitDefinition`, and make the entity tests spawn from loaded content.
- [ ] **AE-2** (major) `components/Movement.ts:80-109`: it slows down by `acceleration` instead of friction and turns with no `|dv|` clamp (10 §2 steps 1 and 3). With the shipped content, the Sentinel (9 m/s, 0.18 m/s²) coasts 1,500 ticks, 50 s and about 225 m after `stop`, yet reverses in one tick. Implement friction and the clamp, or a deceleration field, and add a stop-distance scenario test. Add this consequence to INBOX PR #14 item (7) before it is ruled. Recorded with AK-1's 10 status note.
- [ ] **AE-4** (minor) `legends/legendCatalogue.ts:8` and `mobs/mobCatalogue.ts:8` build catalogues, with a throwing duplicate-id check, when `@eternalus/core` is imported (DEC-22: "never at import time"). Export plain arrays, and build catalogues only in `loadDefaultContent()`.
- [ ] **AE-5** (minor) `content/validation/PositiveStatsRule.ts`: `visionRadius` is not validated, and `Vision` throws on negative or NaN values, so bad content throws out of `step()` on the first spawn. Unregistered `kind`s are caught only by a test (05 §2: "a typo fails at boot"). Add a vision rule, and check kinds and controllers when `Simulation` is constructed (with A23-10). Injected content is AK-5.
- [ ] **AE-6** (minor; `ponytail:`) `components/Health.ts:77-102`: shield order compares id lengths, a numeric sort of `entity-N` that 03 §2 forbids, and it ties a component to the factory's id format. Grant shields in store or call order, or have the owner amend 03 §2 together with A23-19.
- [ ] **AE-8** (minor) `index.ts:25` exports the closed `LegendKind` union and no `LegendId`, and the client sends one value as both `kind` and `definitionId` (`Match.ts:138-139`), so a data-only Legend (R2, `extends`) could never be picked (05 §12, 02 §6, 04 §6). Export `LegendId = string` and keep `LegendKind` internal (with A12-4).
- [ ] **AE-9** (minor; owner approval) `04-entity-architecture.md` §13 leaves out interim differences:
  - **§2:** `spawn` doesn't emit `entity-spawned`, the factory doesn't add to the store, and `retire` takes a string cause.
  - **§3:** no `facing`/`lookAt` or `applyImpulse`, `setTeam` without a cause, and `canSee`.
  - **§5:** no `extends`/`sprite`/`minimapGlyph`, flat stats, no ability or loadout ids, extra unused fields, and no `weightClass`.
  - **§6:** classes registered instead of factory functions.
  - Units also get a `Brain`.
- [ ] **AE-11** (minor; owner approval) `17-extension-recipes.md` R12 and `packages/core/AGENTS.md:42`: the component recipe never mentions `StateHasher`, which is how #14's M3 slipped through. Add "add its simulation fields to `StateHasher.fieldsOf` with one hasher test" (03 §9).
- [ ] **AE-12** (minor) `entities/playerScenarios.test.ts` (318 lines): its stand-in helpers outlived `MovementSystem` and `DeathSystem` (#17), and "halts at once on a hard stop" tests a path no command takes, since `stop` coasts. Drive the real systems, fix that scenario, and split the file.
- [ ] **AE-13** (minor) `docs/plan/phase-1-simulation-kernel-and-world.md:100,104`: "Unit definitions name no other ids yet" is wrong (`passiveOptions`, `defaultAction`, `pickUp`, `weaponBias` and `controller` are ids), and "pending merge" is stale. Correct both and append a PROGRESS correction.
- [ ] **AE-14** (nit) `components/TeamMembership.ts:17-22`: `setTeam` takes no cause and leaves the `team-changed` emit to callers (04 §3). Add a cause, or record it in 04 §13.
- [ ] **AE-15** (nit, acceptable) The `family` getters on `Unit`, `Legend` and `Mob` return `string` (and `'unit'` isn't an `EntityFamily`), while the newer families type it. Type them the same way.
- [ ] **AE-16** (nit) `UnitDefinitionRule` is shared by three classes but lives in one class's companion file; `DefinitionRef` and `IdentifiedDefinition` repeat `EntityDefinitionBase`; and `SPAWNABLE_TEAMS` re-lists `Team` outside `teams/` with no exhaustiveness check.
- [ ] **AE-17** (nit) Test gaps:
  - the registry depth test loops only over unit definitions;
  - the spawn test doesn't check `Vision`;
  - `loadDefaultContent.test.ts:12` has a stale title;
  - `mobCatalogue` has no test.
- [ ] **AE-18** (nit; owner approval) `07-structures-obstacles-and-destructibles.md:325,348,356`: there are two "§13" sections, the status note sits after §14, and "source id order" is stale (INBOX (9)).
- [ ] **AE-23** (nit, process) PR #14's description still describes `EntityModule`s and the ring lint, and the review round's critic, ponytail and check record exists only in a PR comment. Append the gate record to PROGRESS.

Extensions to earlier items:

- **AK-3:** `Movement`'s `Math.hypot` (also AE-7).
- **AK-5:** injected content skips validation (also AE-5c).
- **AK-6:** the id counter is outside `GameState` and the hash (also AE-22).
- **AK-1:** 10 needs its own status note for `Movement` and `Collider`: per tick, heading, no friction, clamp or impulses, circles only, shapes in `components/`, no `isUnbreakable` (AE-10).

## Proposed design changes (owner sign-off needed)

Decisions and doc conflicts the reviews surfaced. None of these may be changed in the design docs before the owner rules.

- [x] **A22-3 / PR #22 scenery:** ruled, DEC-32 (see A22-21 to A22-23). Still open: where presentation code lives (A22-1).
- [x] **A23-1 / PROTO-01:** ruled, DEC-33. Still open: A23-17 and A23-18.

- [ ] **AM-B1** (improvement on the design, small) `MapGenerator.generate` takes only the `{ map }` slice (`MapGenerator.types.ts:27`), while 06 §1 sketches a full `GameConfig`. It states its real dependency, and a full `GameConfig` still fits. If accepted, 06 §1 reads `generate(config: Pick<GameConfig, 'map'>, seed)`, and A8-1 uses that type.
- [ ] **AM-19** (owner question) `docs/reference/game-design/05-map.md:41,103-104` puts corner camps "behind impassable rifts", but neither 06 nor the generator encloses them. Add the enclosure to 06 §3 and the generator, or drop it from 05.
- [ ] **AS-7** (owner decisions, before `MatchBridge` and `MatchScreen` are written):
  - **C1:** does `MatchBridge` live in `game/` (13 §1, 12 §8) or in `bridge/` (contract §2.6, H brief)?
  - **C2:** who owns the `Match` lifetime, `SessionController` (13 §2) or `GameCanvas` (H brief)?
  - **C3:** is the event `announce {id, params, tick}` into `matchSlice` (12 §8, 13 §5) or `announcement` into `hudSlice` (contract, code)?
- [ ] **AS-8** (docs; owner approval) 13 contradicts itself or the code:
  - `loading-progress.group` (`'boot'|'menu'|'match'` vs `selection`);
  - the slice list vs reference 14 §5's `themeSlice`;
  - `MenuRoute 'main'` vs `'home'`;
  - `connectBusToStore` "in `bridge/store.ts`" (13 §5, `apps/client/AGENTS.md`) vs its own file;
  - `bridge/selectors/*` (02, 13, 17), which doesn't exist.
- [ ] **AS-9** (owner) Where do the background sets and the themed profile name ("Chronicle") live? They are in `game/content/placeholderCatalogue.ts:36-70` with no designed home. Decide before A12-4, so the class swap doesn't drop them.
- [ ] **AS-10** (owner, product) Does confirming a class end character select early (13 §2, the code), or does the reveal start only "after the countdown" (reference 14 §2)?
- [ ] **AS-16** (owner, before or after merging #24) `bridge/Binding.types.ts`: `26ae27e` has 13 §6.1's per-device `InputChord` union, and #24 replaces it with the contract's flat `{device, code, label}`. #24's 13 §10 records this as interim ("modifiers and gamepad axes come with `GamepadDevice`, post-MVP"), and DEC-26 does not rule on the shape. Adopt the flat shape as the design (edit 13 §6.1), or keep §6.1 as the target with that trigger.
- [ ] **AS-B1** (improvement on the design) `SessionController.types.ts:8-28`: the synchronous `SessionState` hooks with a narrow `SessionContext` (13 §2 sketches async). Exit → enter → `session-phase` happen in one call stack, and tests need no awaiting. The cost: each state must cancel its own callbacks, so add a per-entry context token as a guard. If accepted, 13 §2's sketch (lines 76-94) changes.
- [ ] **AS-B2** (improvement, conditional) No `useAppDispatch` (session D's INBOX item). Agreed, but "makes the rule structural" holds only together with AS-4's lint.
- [ ] **AS-B3** (weak candidate) Selectors on the slices instead of `bridge/selectors/`: fewer files and typed, but not memoised (13 §3 wants `createSelector`). Accept only with a split: plain reads on the slice, derived data in `selectors/`.
- [ ] **AK-2** (owner) May `diagnostics/` import `components/`? The invariants read `Health` and `Transform` (`FiniteTransformsInvariant.ts`, `HealthWithinBoundsInvariant.ts`), against 02 §2 and core `AGENTS.md:31`. Session C asked this in `INBOX.md:143-145` and nobody has answered. Recommended: allow read access.
- [ ] **AK-18** (owner) How does `commands/` reach components? 02 §2 forbids it, so `EntityStore` grows a per-component facade (`steer`, `positionOf`, `teamOf`, `isSteering`, `controllerOf`), and Phase 2 commands will add more. Widen the imports, or name a home for the facades.
- [ ] **AK-19** (docs; owner approval) Doc-vs-doc conflicts:
  - 10 §2 "entity id order" vs store order (DEC-20);
  - `RemovalCause` in 03 §2 vs 15 §3;
  - `DamageSource` kinds in 05 §9 vs 15 §3;
  - the plan's "payloads come from the pool" vs 03 §4 "may be pooled";
  - `MatchPhase` names and the event name in 12 §2 vs FR-006 vs reference 04;
  - `SystemContext.types.ts` (02 §2) vs `System.types.ts`.
- [ ] **AK-20** (owner, product) 03 §10: should `legendsPerTeam` and `initialHordesPerTeam` be derived from, or validated against, `numLanes`? At 5 lanes, 3 per lane plus the Rover exceeds the cap of 10, and FR-004 wants one horde per lane.
- [ ] **AK-23** (improvement on the design) `GameState.removalsAnnouncedThisTick()`: per-tick facts an invariant needs are kept by `GameState` for the current tick, not read back from the 512-entry event ring, which a busy tick can overflow into a false fatal. Adopt it in 15 §3 and apply it to `NoPassThroughUnbreakableInvariant`.
- [ ] **AK-24** (improvement on the design, small) `Violation.severity`: each violation carries its log level, optionally stamped by the runner. Adopt it in 15 §2 together with the seed in `InvariantViolationError` that 15 §5 already requires, and close the optional idea in `INBOX.md:153-154`.
- [ ] **AC-6** (owner) How much of the world does the player see? The view is 64 × 36 m (`Match.constants.ts:15-22`) and the zoom range 0.5–4 (`Camera.constants.ts:5-8`), and neither has a source. Put the view size in config or content, and inject the zoom bounds from settings (08 §5).
- [ ] **AC-20** (improvement on the design) The `IntentSource` port and `DeviceIntentSource` (`INBOX.md:86-91`, b). `Match` never names a device, its tests drive a scripted intent, and replayed or bot intents can use the same seam. Move the class and port to `game/input/`. If accepted, 13 §6.2, 08 §7 (`input: IntentSource`) and 09 §2 change.
- [ ] **AC-21** (improvement, conditional) Focus-loss release outside `Match` (`INBOX.md:86-91`, a) resolves 09 §2 in favour of 09 §10 (no browser API in `Match`). Accept it only with a tested home (AC-2's factory), then update 09 §2.
- [ ] **AC-22 to AC-27** (docs; owner rulings):
  - **AC-22, view lookup:** 08 §8 should say kind → family → default view, with each unknown kind reported once (02 §9 and the code).
  - **AC-23, the clock:** adopt `SessionClock` as the clock (01, 02, 08 and 09 say `Clock`), and `loop/` as the `FrameScheduler` home.
  - **AC-24, `Projection`:** decide where it lives and whether it is one-way or two-way (02 §3 forced a one-way port into `engine/input/`; 08 §5 has a two-way one in `camera/`).
  - **AC-25, who creates the `Match`:** `GameCanvas` (`apps/client/AGENTS.md`, H brief), `SessionController.createMatch` (13 §1–§2), or `Match` choosing its adapters (01 §3, 08 §7). This is the same decision as AS-7 C2, and AC-1 and AC-2 depend on it.
  - **AC-26, log filtering:** 09 §8 should put filtering in `SinkLogger`'s routes, as 15 §4 and the code do.
  - **AC-27, the loop example:** in 08 §3 the first frame only sets the time origin, so `runFrames(2, 16.7)` gives 0 ticks, not 1.
- [ ] **AE-3** (owner) The content numbers have no source. Health 600/800/1200, vision 25 and every speed, acceleration and mass in `content/legends/*.ts` and `mobs/trainingDummy.ts` trace to nothing. Magus health 800 above the Warrior's 600 contradicts `balancing.md` (550 < 650), and masses 1/2/6 are not on 10 §2's "kg-like" scale, so 05 §4's `impulse: 80` would knock a Warrior back at 80 m/s. Adopt `balancing.md`'s anchors or keep the placeholders, and drop the unsourced health-ordering assertion in `legendCatalogue.test.ts:35-44`.
- [ ] **AE-19** (docs; owner approval) Who resolves `extends` and validates content? `ContentCatalogue` (02 §2:68, 04 §5:177-178) or `loadDefaultContent()` (05 §2 as #14 edited it)? Also retire the `validateContent()` name in 02, 17 and the plan.
- [ ] **AE-20** (owner, product) There is no base-speed field. The game doc's base speed (reference 02, FR-035, `balancing.md`) conflicts with 10 §2's "speed = current |velocity|, ramping from standstill", which the code follows.
- [ ] **AE-21** (owner) What does `// TUNE:` certify? 00-overview:78 says "a provisional number quoted from a source", CONTRIBUTING §4 says any provisional number, and content uses it on invented numbers. Pick a marker for unsourced placeholders.
- [ ] **AE-B1** (improvement on the design) `obstacleType` (INBOX PR #14 item (2); `obstacles.types.ts:8-20`). 04 §5 makes `kind` the registry key, while 04 §1, 04 §5, 07 §9 and 17 R6 also make `ObstacleDefinition.kind` the tree/rock/bridge type. Both can't hold with one registered `Obstacle` class. If accepted, the 04 §1 Obstacle row, the 04 §5 `ObstacleDefinition` row, the 07 §9 sketch and 17 R6 change.
- [ ] **AE-B2** (improvement on the design, small) `EntityFactory.canCreate(kind, definitionId)` lets `dev-spawn` reject (03 §3) instead of throwing out of `step()`, the failure behind #14's B1. If accepted, 04 §6 changes; it shrinks to `has(id)` if spawn-by-definition-id lands.
- [ ] **AE-B3** (alignment with the more specific doc; area E recommends yes) The `Collider` fields follow 10 §4 (`isStatic`/`isEnabled`), not 04 §3's `isSolid` (INBOX (3)). The shield names follow 07 §2 (INBOX (4)). If accepted, the 04 §3 component table rows change.
- [ ] **AE-B4** (not better, per area E) `passiveOptions`. 05 §12 already gets a class's passives from `AbilityDefinition.classId` and `slot: 'passive'` (`PassiveOwnedRule`), so this would be a second source of truth. Pick one before Phase 4 content.
- [ ] **A23-17** The `PROTOTYPE(<id>) TEMPORARY` marker convention. It is used 18 times and documented nowhere. Document it in `AGENTS.md` / `CONTRIBUTING.md`, or fold it into `ponytail:`.
- [ ] **A23-18** Two import-boundary conflicts:
  - `packages/core/AGENTS.md:32` forbids `systems/` → `ai/`, but 02 §2 allows it (and 11 §1 calls `AiSystem` a system).
  - `packages/core/AGENTS.md:33` and 11 §1 forbid `ai/` → `content/` types, but 02 §2 allows them.

  Pick one per pair, through an ADR if a boundary changes.

- [ ] **A23-19** 11 §5–§6 and the phase 3 plan (line 99) stagger and order AI by numeric `entityId`, but 03 §2 makes ids strings that are never sorted as numbers. Name the stagger key (a hash of the id) and the order (store order).
- [ ] **A23-20** `Match` spawns the player, and now the escort, with `dev-spawn` without the developer menu (03 §3). Record that as an Implementation status note in 03 §12 or 08, or give match setup a proper non-dev command.

## Not yet audited

These Sprint 1 PRs merged before this audit started:

- #8 `feat/map-generator`
- #12 `feat/session-shell-home`
- #13 `feat/sim-kernel`
- #14 `feat/entity-collider-and-concrete-kinds`, reviewed 2026-10-08 with changes requested; the
  fixes were pushed before it merged
- #17 `feat/entity-systems`
- #18 `feat/engine-loop-match`
- #19 `feat/player-input`
- #20 `chore/lint-ignore-worktrees`
- #25 and #26, the character-select demo fixes (timeout off, Warrior preselected); both are
  marked for removal after the demo in `placeholderSetup.ts`

The full system audit planned after the presentation covers them.
