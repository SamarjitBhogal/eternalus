---
title: Phase 6 — Hardening, balance and release
description: Sprint checklists for the performance pass against budgets, the headless balance pass, the art and audio pass, reliability (soak and replay corpora in CI, error boundaries, persistence failure modes), docs gardening and the course deliverables ending in the v0.1.0-mvp tag; read this before starting any Phase 6 task.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-24
tags: [plan, phase-6, performance, balance, art, audio, reliability, release]
paths: ['packages/core/src/content/**', 'packages/core/src/diagnostics/**', 'apps/client/assets/**']
related:
  [
    'docs/plan/README.md',
    'docs/reference/suggestions/balancing.md',
    'docs/architecture/15-diagnostics-and-runtime-testing.md',
  ]
---

# Phase 6 — Hardening, balance and release

## Purpose

Read this when you pick up a Phase 6 task or review the Phase 6 PR. Phase 6 adds no features
(feature freeze 2026-12-04, roadmap risk table): it proves the budgets (tick ≤ 8 ms at 144
units per team + 20 Legends, 60 fps), balances the content by measurement in headless sim mode,
replaces placeholder shapes with licensed or team-made pixel/low-poly art and audio, hardens
reliability (soak and replay corpora in CI, error boundaries, persistence failure modes),
gardens the docs, and delivers the course report, presentation, demo and the `v0.1.0-mvp` tag.
Everyone works in this phase. If the schedule slips, cut line 1 of the roadmap (art and audio
polish) applies first; the budgets, the soak corpus and the deliverables are never cut.

- **Branch:** `phase/6-hardening-balance-and-release` (stacked on `phase/5-…` until it merges).
- **Weeks:** 9–10 (2026-11-30 → 2026-12-11). Week 9: sprints 6.1, 6.2, 6.3, and the CI job of
  6.4 so week 10 has two nights of data; week 10: 6.4, 6.5. Nothing new after 2026-12-04.
- **Requirement areas served:** "NFR: performance (144 units/team)", "NFR: determinism", "FR:
  runtime monitoring & logging", "FR: art (low-poly/pixel)", "NFR: documentation for humans and
  agents", the course deliverables.
- **Depends on:** Phases 1–5 merged to `main` or stacked on their phase branches; INBOX
  DEC-01 (term end and demo dates) and the balancing decisions raised by sprint 6.2.

## Sprint 6.1 — Performance pass against budgets

Owner: _ (sim lane lead + client lane lead). Week 9. Follows
[research §5](../research/game-architecture-and-performance-research.md#5-canvas-2d-performance),
[research §6](../research/game-architecture-and-performance-research.md#6-object-pooling-and-gc-avoidance)
and the budget split of [Phase 3 sprint 3.8](phase-3-minions-hordes-and-ai.md#sprint-38--sim-mode-soak-at-144-per-team-and-the-ai-budget).

- [ ] **Budget table + profiling harness** (a `budgets.json` per system and per render layer:
      pathing 2.5 ms, collision 2 ms, AI 1.5 ms, combat 1 ms, rest 1 ms; entity layer ≤ 6 ms,
      overlay ≤ 1 ms, HUD update ≤ 2 ms, `Recommendation:`; a `Profiler` port injected into
      `SystemPipeline`, no-op in production, `performance.now` in `npm run bench` and the
      browser; `performance.mark/measure` around tick and render; the long-animation-frame
      observer from `PerfOverlay`). Owner: _. Test: the bench prints p50/p95 per system and
      flags budget misses locally (CI runs it without time assertions). Done when: the top three
      hotspots are named in [PROGRESS.md](PROGRESS.md) with before/after numbers.
- [ ] **Pooling and allocation audit** (projectiles, particles, floating damage numbers,
      `GameEvents` payloads and mobs pooled; scratch vectors in steering; fields reset on
      acquire, references nulled on release). Owner: _. Test: a test-only allocation counter
      around `MovementSystem`, `PathingSystem`, `CollisionSystem` and `AbilitySystem` reads 0
      allocations per unit per tick. Done when: no hot loop allocates per tick.
- [ ] **Render pass** (viewport culling through a `SpatialHash` query, terrain chunk dirty
      flags, sprites grouped by atlas, frames pre-scaled per DPR, integer draw coordinates,
      minimap dots every 3rd frame, HUD store updates every 6th tick). Owner: _. Test: with a
      fake context, draw calls ≤ visible entities + overlay draws; off-screen entities draw 0.
      Done when: 60 fps holds with the camera on the busiest lane at full unit counts.
- [ ] **Flow-field, AI and invariant budgets** (per-tick rebuild cell budget, AI cadence and
      stagger, `light` invariants every tick and `heavy` only in dev/soak builds, all as
      `GameConfig`/`DebugConfig` values). Owner: _. Test: a bridge destruction at 144 per team
      is absorbed with no frame > 50 ms; AI ≤ 1.5 ms p95. Done when: no budget is a literal.
- [ ] **Memory, leaks and the slow machine** (30-minute headless soak sampling entity count,
      listener count, ring-buffer and pool sizes every 1,800 ticks; a manual browser run with
      `measureUserAgentSpecificMemory()` where available; the same match on the oldest teammate
      laptop, `Recommendation:` tick ≤ 12 ms p95 and median frame ≤ 33 ms there). Owner: _.
      Test: counters show no monotonic growth over 54,000 ticks. Done when: both machines are
      named in PROGRESS with their numbers.

**Success metric:** tick p95 ≤ 8 ms at 144 units per team + 20 Legends and 60 fps (median frame
≤ 16.7 ms, no frame > 50 ms) over a 60 s segment of the busiest match state on the reference
laptop; 0 per-tick allocations in the four hot systems.

## Sprint 6.2 — Balance pass via headless sim mode

Owner: _ (AI owner; product owner decides). Week 9. Follows
[balancing.md "How to test balance"](../reference/suggestions/balancing.md#how-to-test-balance)
and [research C3](../research/persistence-input-diagnostics-research.md#c3-testing-a-running-game-properties-replays-golden-hashes-soak-tests).

- [ ] **`BalanceHarness` + `npm run test:balance`** (`Recommendation:` a Node script in
      `core/diagnostics/`: `{ seed, gameConfig, contentOverrides, bots }` → one `MatchReport`
      JSON line per match; a summariser prints win rate, length percentiles, first structure
      fall, `spawn-suppressed` share, Legend levels at 10 and 20 min, damage share per class,
      invariant violations). Owner: _. Test: one seed runs in CI in under 60 s; the summariser's
      math on a fixture set. Done when: a knob under test is one content override, nothing else.
- [ ] **Symmetry run first** (mirrored teams: same classes, loadouts and bot profiles, 200
      seeds; win rate must be 50% ± 5%; a deviation is a bug in the map generator, spawn order
      or tick order, not a balance question). Owner: _. Test: the run; each fix ships with a
      replay fixture. Done when: symmetry holds before any knob changes.
- [ ] **Win-rate and match-length pass** (default content, light vs dark, N = 200 seeds:
      light win rate 45–55%; median length 18–25 min, P95 under 35 min, 0 timeouts at
      `maxMatchSeconds`; first structure fall 4–8 min; `spawn-suppressed` under 5%; knobs edited
      only in `packages/core/src/content/` and `config/`). Owner: _. Test: the batch. Done when:
      the balance PR's diff touches only content, config and fixtures (reviewer checks).
- [ ] **Class matrix + config sweeps** (3 × 3 class swaps: a swap moving the win rate more than
      10 points is the first tuning target; `numLanes` 1, 3 and 5 with `buffTowersPerLane` 1
      and 2 all playable, the D7 regression). Owner: _. Test: the grid. Done when: the results
      table is in PROGRESS.
- [ ] **balancing.md proposals evaluated** (every `Recommendation:` in
      [balancing.md](../reference/suggestions/balancing.md) becomes accepted, rejected or
      amended with the metric that decided it; product-level choices go to INBOX; accepted values
      become `// TUNE:` content with their source updated; golden replay fixtures committed for
      the accepted knob set). Owner: _. Test: the golden fixtures pass. Done when: every proposal
      has a status and no `TUNE` value in content lacks a source.

**Success metric:** light vs dark win rate 45–55% over 200 seeded matches; median match length
18–25 min with 0 timeouts; 0 invariant violations across the batch; every balancing.md proposal
carries a status.

## Sprint 6.3 — Art and audio pass

Owner: _ (art owner + client lane; product owner signs off). Week 9; anything not merged by
2026-12-04 stays placeholder (cut line 1). Follows
[10-art-and-lore.md](../reference/game-design/10-art-and-lore.md). Licensed or team-made only
(`AGENTS.md`); the reference games are mood references, never sources.

- [ ] **Asset policy in the manifest** (every entry carries `licence` — CC0, CC-BY with
      attribution, or team-made — and `source`; the manifest script fails otherwise; attribution
      renders in `AboutScreen`). Owner: _. Test: a fixture entry without a licence fails the
      manifest check in CI. Done when: 0 unlicensed files, verified by the script.
- [ ] **Pixel/low-poly sprite set** (one atlas per team palette: light gold/white/blue, dark
      red/black/purple, neutral `Recommendation:` grey-green; 3 classes × 2 teams, 3 mob tiers ×
      3 teams, bosses, structures with shield states, projectiles, obstacles, capture points;
      frames pre-scaled per DPR). Owner: _. Test: a test walks `ViewRegistry` and asserts every
      entity kind maps to a sprite id present in the manifest. Done when: placeholder shapes
      remain only behind a debug flag.
- [ ] **Terrain, palette and screens** (grass, rift and bridge tiles in one atlas; `TeamPalette`
      tokens for HUD and minimap; loading screen art and menu background; the boss atmosphere
      change **MVP-if-time**). Owner: _. Test: chunks draw from the atlas; palette tokens pass
      the contrast test from Phase 5. Done when: no colour literal exists outside `global.css`
      and `TeamPalette`.
- [ ] **Audio and announcer** (`WebAudioOutput` buses master/music/sfx bound to settings; SFX
      for basic attacks, each ability, structure loss, capture and spawn; one music loop;
      announcer lines for countdown, first hordes, tower razed, point captured, mini-boss,
      Eternal summoned, victory and defeat, `Recommendation:` team-recorded, with the text
      fallback in the `Announcer` HUD always on). Owner: _. Test: a fake `AudioOutput` receives
      one play per `GameEvents` type from a content table; muted buses play nothing. Done when:
      the event → sound mapping is a content table.
- [ ] **UI enhancements on the owner's Figma screens** (the follow-up to
      `feat/hud-and-character-select`, specified in [ui-enhancements-plan.md](ui-enhancements-plan.md):
      the in-game reduce-motion setting applied to every reduced-motion rule (UE-03, INBOX HC-S3),
      then the enhancements the owner picks in INBOX HC-S5, each a data-selectable variant with
      the Figma original kept live and the default, DEC-53; may start early once that branch has
      merged). Owner: _. Test: the plan's unit and visual acceptance per enhancement; every Figma
      scenario is byte-identical with no enhancement selected. Done when: each built enhancement
      has its `creative` row in reference 15 and the owner's review of its scenario.

**Success metric:** 100% of manifest entries carry a licence and a source; 100% of entity kinds
have a sprite (registry walk); the announcer fires for every timeline event in a scripted match;
the product owner signs off the look of one full match in the browser.

## Sprint 6.4 — Reliability

Owner: _ (sim lane lead + persistence owner). Week 10; the CI job lands in week 9. Follows
[15-diagnostics-and-runtime-testing.md](../architecture/15-diagnostics-and-runtime-testing.md).

- [ ] **Soak and replay corpora in CI on the phase branch** (`npm run test:soak` at `heavy`
      plus every replay fixture in a `soak` workflow that runs nightly and on demand for
      `phase/**` branches; `Recommendation:` not per PR — per-PR CI stays `npm run check`).
      Owner: _. Test: the workflow runs green twice. Done when: a failing run prints the seed,
      tick and last commands in the job summary.
- [ ] **100 seeded full matches at `heavy`** (sim mode, default content, invariants at `heavy`
      every 30 ticks; every bug found adds a replay fixture). Owner: _. Test: the batch on the
      nightly job. Done when: 0 invariant violations and 0 unhandled exceptions, seeds recorded
      in PROGRESS.
- [ ] **Error boundaries and loop safety** (a React error boundary per screen and around the
      HUD; an exception in `Simulation.step()` stops `GameLoop`, logs the repro payload (seed,
      tick, last 32 commands) through `Logger` and moves the session to `results` with a
      diagnostic; never a silent freeze or a blank page). Owner: _. Test: a fake system that
      throws routes to the boundary, leaves 0 scheduled frames and shows "copy repro".
      Done when: no failure path ends in a blank page.
- [ ] **Persistence failure modes** (`versionchange` from another tab → close and reload
      prompt; quota exceeded → evict replays and warn; private window or open failure → runtime
      fallback to `MemoryStorageAdapter` with a "not saved this session" banner; corrupt records
      → quarantine; `persist()` denied → warning). Owner: _. Test: one scenario per mode on the
      fake adapter; `persistenceSlice` reports each. Done when: the UI shows every mode and none
      throws.
- [ ] **Focus loss and the cross-browser matrix** (held input cleared on `blur` and hidden
      `visibilitychange`; a tab hidden five minutes resumes without a tick burst; a manual matrix
      of Chrome, Firefox and Safari on macOS, Windows and Linux for persistence, input including
      side buttons and the `code` fallback, and audio). Owner: _. Test: fake `visibilitychange`
      events; the matrix table with browser versions. Done when: the matrix is in PROGRESS with 0
      open blockers.

**Success metric:** 0 invariant violations and 0 unhandled exceptions over 100 seeded matches at
`heavy`; every persistence failure mode has a passing scenario test; the cross-browser matrix has
no blocker.

## Sprint 6.5 — Docs gardening and course deliverables

Owner: sholtzman (docs, report), SamarjitBhogal (release), everyone (deliverables). Week 10.

- [ ] **`npm run docs:check` green** (the docs step of `npm run check`: frontmatter schema,
      relative links, index in sync, `last-reviewed` within 90 days for every doc touched by
      Phases 1–5, `paths` accurate). Owner: _. Test: the check on the branch tip. Done when: 0
      errors and 0 staleness warnings.
- [ ] **ADR and changelog catch-up** (every deviation from architecture docs 01–17 found in
      Phases 1–5 has an ADR or the doc is updated; one entry per phase in
      [docs/changelog/](../changelog/README.md); `docs/README.md` regenerated; the glossary
      lists every new class name). Owner: _. Test: link check; a reviewer walks the "docs match
      the code" exit item of each phase. Done when: no phase has that item open.
- [ ] **README quick start verified on three OSes** (clean clone by three different teammates
      on macOS, Windows and Linux: Node 24.21.0, `npm install`, `npm run dev`, `npm run check`;
      timings and problems recorded). Owner: _. Test: the three runs. Done when: the README needs
      no oral instructions.
- [ ] **Course report, presentation and demo** (report: architecture, the patterns catalogue
      with the class per pattern, SOLID/DRY evidence, metrics against targets, process,
      retrospective; slides; a 10-minute demo script merged from Phases 1–5, rehearsed twice on
      the demo machine, with a recorded video as fallback). Owner: _. Test: both rehearsals run
      end to end. Done when: submitted before the course deadline (INBOX DEC-01).
- [ ] **Release `v0.1.0-mvp` + retrospective** (SamarjitBhogal merges the Phase 6 PR, tags
      `v0.1.0-mvp` on green `main` — humans tag, agents never do — and publishes release notes
      from the changelog; the team holds a retrospective: what worked, what did not, metrics
      against targets; leftovers triaged into [backlog-post-mvp.md](backlog-post-mvp.md); minutes
      in PROGRESS). Owner: _. Test: CI is green on the tag. Done when: every backlog row has a
      trigger and an owner.

**Success metric:** docs check 0 errors; quick start verified on 3 OSes; `v0.1.0-mvp` on green
`main`; report, presentation and demo delivered before the deadline; retrospective minutes in
PROGRESS.

## Success metrics (phase level)

| Metric                                                        | Target                                               |
| ------------------------------------------------------------- | ---------------------------------------------------- |
| Tick time at 144 units/team + 20 Legends                      | p95 ≤ 8 ms at 30 TPS on the reference laptop         |
| Frame rate (busiest match state, 60 s)                        | median ≤ 16.7 ms, no frame > 50 ms                   |
| Win rate light vs dark (200 seeds)                            | 45–55%                                               |
| Match length (200 seeds)                                      | median 18–25 min, P95 < 35 min, 0 timeouts           |
| Invariant violations (100 seeded matches at `heavy`)          | 0                                                    |
| Unhandled exceptions (100 matches + 30-min play × 3 browsers) | 0                                                    |
| Licensed assets                                               | 100% of manifest entries with licence and source     |
| Docs check                                                    | 0 errors, 0 staleness warnings                       |
| README quick start                                            | verified on macOS, Windows and Linux                 |
| Coverage                                                      | core ≥ 90%, client ≥ 70% (roadmap ratchet)           |
| Release                                                       | `v0.1.0-mvp` on green `main`; deliverables submitted |

## Exit criteria

1. All sprint metrics pass and are recorded in [PROGRESS.md](PROGRESS.md) with the machines and
   browsers used.
2. `v0.1.0-mvp` is tagged from green `main` by SamarjitBhogal and its release notes are
   published.
3. The report, presentation and demo are delivered; the demo script below runs end to end on the
   demo machine.
4. Architecture, reference and plan docs match the code (ADR and changelog catch-up done); the
   docs check is green.
5. The retrospective was held and the backlog triaged with owners and triggers.

## Demo script

1. Boot → main menu → Loadouts (save a Sentinel loadout) → Settings (rebind W → Up Arrow; the
   prompts follow) → Profile (history from earlier matches).
2. Start a match as Sentinel: countdown, the first three hordes, tower spawns at 60 s, a camp
   clear and level-up, a sprint through a breakable wall, the quarter-mark mini-boss.
3. Developer menu: spawn to 144 units per team; `PerfOverlay` shows tick p95 ≤ 8 ms at 60 fps;
   invariants at `heavy`: 0 violations.
4. Sim mode: the bots finish the match; results → Profile history; export the replay and replay
   it in `npm run test` to the same hash.
5. `numLanes` 3 → 5 in the preset: map, minimap, flow fields and spawn schedule follow.
6. `npm run check` green on three OSes; `npm run test:balance` summary inside the targets.

## Risks

| Risk                               | Mitigation                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Performance targets missed late    | Budgets tracked since Phase 1; profile before optimising; cut lines; the slow-machine floor is a separate, lower target. |
| Balance turns into opinion debates | Metrics decide; knobs only in content; product-level picks go to INBOX with decide-by dates; symmetry run first.         |
| Unlicensed or late assets          | Manifest licence field enforced in CI; placeholder shapes are acceptable (cut line 1); Kenney CC0 glyphs for prompts.    |
| Soak corpus makes CI slow          | Nightly and on-demand on phase branches only; per-PR CI stays `npm run check`.                                           |
| Deadline crunch and other courses  | Feature freeze 2026-12-04; week 10 is fixes and deliverables only; the recorded demo video is the fallback.              |
| Docs debt hidden until the report  | Gardening is a sprint with an owner; the docs check runs on every PR; `last-reviewed` staleness is a warning at 90 days. |

## Related

- [README.md](README.md)
- [phase-5-meta-ui-and-persistence.md](phase-5-meta-ui-and-persistence.md)
- [backlog-post-mvp.md](backlog-post-mvp.md)
- [PROGRESS.md](PROGRESS.md)
- [../architecture/15-diagnostics-and-runtime-testing.md](../architecture/15-diagnostics-and-runtime-testing.md)
- [../reference/suggestions/balancing.md](../reference/suggestions/balancing.md)
- [../reference/game-design/10-art-and-lore.md](../reference/game-design/10-art-and-lore.md)
- [../research/game-architecture-and-performance-research.md](../research/game-architecture-and-performance-research.md)
- [../research/persistence-input-diagnostics-research.md](../research/persistence-input-diagnostics-research.md)
- [../process/git-workflow.md](../process/git-workflow.md)
- [../changelog/README.md](../changelog/README.md)
