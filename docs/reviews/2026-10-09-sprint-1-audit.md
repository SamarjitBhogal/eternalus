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

## Proposed design changes (owner sign-off needed)

Decisions and doc conflicts the reviews surfaced. None of these may be changed in the design docs before the owner rules.

- [x] **A22-3 / PR #22 scenery:** ruled, DEC-32 (see A22-21 to A22-23). Still open: where presentation code lives (A22-1).
- [x] **A23-1 / PROTO-01:** ruled, DEC-33. Still open: A23-17 and A23-18.

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
