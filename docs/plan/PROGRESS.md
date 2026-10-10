---
title: Progress log
description: The running, append-only log of what was done, which checks ran and what comes next, written by humans and agents after every work session; read the last few entries to know where the project is before starting a task.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [plan, progress, log]
related: ['docs/plan/README.md', 'docs/agents/running-agents.md', 'docs/agents/checklists.md']
---

# Progress log

## Purpose

Read the last three entries before you start any task: they tell you which phase and sprint is
active, which branch it lives on, what the last `npm run check` said and what the next step is.
Append an entry when you finish a session (humans and agents alike, per
[README.md §1](README.md#1-how-phases-sprints-and-tasks-work) and
[running-agents.md](../agents/running-agents.md)). The phase docs hold the checklists; this file
holds the history, the measured numbers and the decisions that changed the plan. Sprint metrics
are recorded here with the machine they were measured on, so the roadmap's metrics dashboard
can point at an entry instead of a memory.

## Format rules

- **Append-only, newest at the bottom.** Never rewrite, reorder or delete an earlier entry; to
  correct one, append a new entry that says what was wrong. The only allowed edit to an old
  entry is fixing a broken link.
- **One entry per work session or PR**, under a level-3 heading of exactly this shape:
  `### YYYY-MM-DD — <phase/sprint> — <branch> — <who or agent>`. `<phase/sprint>` is
  `Phase N / sprint N.M` (or `Phase N / sprints N.M–N.K`); `<branch>` is the git branch the
  work is on; `<who or agent>` is a GitHub handle for a human, or `<handle> + <tool>` for an
  agent session (for example `sholtzman + Claude Code`, `abc + Codex`).
- **Three bullets, always in this order:**
  - `What was done:` the tasks ticked (name them as in the phase doc), files or features
    touched, decisions made or asked for (INBOX ids), metrics measured with the machine
    (CPU, RAM, browser and version) when a sprint metric is involved.
  - `Checks run:` the verbatim command and its result line, for example `npm run check` →
    `All checks passed (format, lint, typecheck, knip, coverage, build, docs)` or
    `npm run test:soak` → `18,000 ticks, 0 violations, 41 s`. Quote failures verbatim too; a
    failing check is not hidden ([AGENTS.md](../../AGENTS.md)).
  - `Next step:` the next task, PR or decision, with who owns it.
- Keep an entry under 15 lines; link to the PR, commit or INBOX item rather than repeating it.
- Meeting minutes (walkthroughs, retrospectives) are entries too: `<phase/sprint>` is the
  sprint that scheduled the meeting and the bullets list attendees, decisions and actions.
- Never log secrets, tokens or personal data; the file is committed.
- Agents append; they never commit or push the file unless asked (`AGENTS.md`).

## Example entry

The example below is fenced so it is not read as a real entry.

```markdown
### 2026-10-14 — Phase 1 / sprint 1.1 — feat/core-seeded-random — sholtzman + Claude Code

- What was done: `SeededRandom` (sfc32) and the deterministic math wrappers with known-answer
  tests; `StateHasher` (FNV-1a) with equal/changed-state tests; ESLint ban on `Math.sin/cos`
  outside `core/utils/`. Asked INBOX DEC-06 (world scale) to be answered before 1.3 starts.
- Checks run: `npm run check` → `All checks passed (format, lint, typecheck, knip, coverage, build, docs)`;
  coverage core 83% / client 55%.
- Next step: open the PR into `phase/1-simulation-kernel-and-world`; reviewer: the map owner.
  Then `Vec2` and geometry helpers (sprint 1.1, next checkbox).
```

## Entries

### 2026-09-30 — Phase 0 / sprints 0.1–0.4 — docs/phase-0-foundation — sholtzman + Claude Code

- What was done: the Phase 0 documentation foundation written on `docs/phase-0-foundation`:
  the `docs/` tree of the writer brief (plan with phases 0–6, backlog and this log;
  architecture 01–17; reference game-design 00–12, suggestions and the source transcription;
  requirements 01–06 and the source transcription; research reports and works cited; process,
  agents, decisions ADR 0003–0009, changelog), the root instruction files (`AGENTS.md`,
  `CLAUDE.md`, `GEMINI.md`), the harness scaffold and `INBOX.md` with decisions DEC-01–DEC-10.
  See [phase-0-documentation-and-harness.md](phase-0-documentation-and-harness.md) and the
  changelog entry [2026-09-30-phase-0-foundation.md](../changelog/2026-09-30-phase-0-foundation.md).
- Checks run (authoring sandbox, Node 22 with `engine-strict=false`; CI repeats on Node 24 ×
  3 OSes): `npm run format:check` → "All matched files use Prettier code style!";
  `npm run lint` → clean (zero warnings); `npm run typecheck` → clean; `npm run knip` → clean
  (run with `KNIP_DISABLE_RAW_TRANSFER=1` because the sandbox could not allocate oxc's raw
  buffer — environment limit, not a finding); `npm run test:coverage` → core 1/1, client 1/1
  passed, thresholds met; `npm run build` → built; `npm run docs:check` → "Checked 86 Markdown
  files under docs/. Documentation check passed." Hook scripts exercised by hand per
  `docs/agents/tool-setup.md` §6 (post-edit exit 0, stop-check exit 0, session-start exit 0).
- Next step: push `docs/phase-0-foundation`, open the PR to `main` with reviewer
  SamarjitBhogal, hold the team walkthrough (sprint 0.5, week 1) and answer the INBOX decisions
  DEC-01–DEC-10; owner: sholtzman.

### 2026-10-02 — Phase 1 / sprint 1.2 — copilot/implement-entity-modules — claudiodh + Copilot Coding Agent

- What was done: added foundational `packages/core/src/entities/*.js` modules (`Entity`, `Unit`, `Legend`, `Mob`, `EntityRegistry`, `EntityFactory`) plus focused `.test.js` coverage for abstract construction, family contracts, lifecycle order, component helpers, registry/factory behavior and unknown kind/cause errors; updated `packages/core/vitest.config.ts` so core discovers `.test.js` and includes `.js` sources in coverage; kept `packages/core/src/index.ts` unchanged (no public API export yet).
- Checks run: `npm run test -w @eternalus/core` → `Test Files 5 passed (5), Tests 13 passed (13)`; `npm run check:quick` → passed (`typecheck` + `lint`); `npm run check` → passed (`format:check`, `lint`, `typecheck`, `knip`, `test:coverage`, `build`, `docs:check`).
- Next step: wire concrete entity kinds and content definitions into the registry as Sprint 1.2 entity implementation continues; owner: sim lane.

### 2026-10-05 — Phase 1 / sprint 1.2 — refactor/implement-entity-modules — SamarjitBhogal + Claude Code

- What was done: ported `packages/core/src/entities/*.js` one-to-one to TypeScript (`Entity`, `Unit`, `Legend`, `Mob`, `EntityRegistry`, `EntityFactory`, plus `Entity.types.ts` and `EntityRegistry.types.ts`) with `.test.ts` ports of every JS test and a few added cases; deleted the JS files; reverted `packages/core/vitest.config.ts` to `.ts`-only globs. Added `npm run check:no-js` (`scripts/checks/no-js.mjs`): fails on any tracked/staged `.js`/`.jsx`/`.mjs`/`.cjs` except `eslint.config.js` and `scripts/**/*.mjs`; it runs in `check:quick` (git hooks), `check` and CI. Documented in `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, `docs/process/guardrails.md`.
- Checks run: `npm run check` → exit 0 (format, no-js, lint, typecheck, knip, core tests 20/20 at 100% coverage, client 27/27, build, docs 87 files passed). Guard self-tested: staging `packages/core/src/x.js` makes `check:no-js` exit 1.
- Next step: wire concrete entity kinds and content definitions into the registry; owner: sim lane.

### 2026-10-05 — Phase 1 / sprint 1.2 — refactor/implement-entity-modules — SamarjitBhogal + Claude Code

- What was done: addressed the PR #4 review on entity ids. `EntityFactory.create(kind, definitionId, spawnContext)` no longer takes an id; the factory assigns `entity-<n>` from a per-factory counter (`EntityFactory.constants.ts`), so ids are unique per match and deterministic for replays (no `Math.random`). Added a test for sequential, per-factory ids.
- Checks run: `npm run check` → exit 0 (core 21/21 tests, 100% coverage).
- Next step: wire concrete entity kinds and content definitions into the registry; owner: sim lane.

### 2026-10-07 — Phase 1 / sprint 1.3 — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: preserved all original map anchors and lanes; enlarged the preview to 12,800 ×
  7,200; added snowy/lava capture fortresses, cathedral village, twelve neutral camp clearings,
  deterministic scenery and an explorable cathedral interior through focused OOP builders.
  Added aspect-correct zoom/pan, minimap navigation and viewport-bound regression tests;
  updated the governing map docs. No dependencies, commits or pushes.
- Checks run: `npm run check:quick` → exit 0; `npm run check` → exit 0 (core 41/41,
  client 32/32; core coverage 100%; client lines 64.25%; build passed);
  `Checked 87 Markdown files under docs/. Documentation check passed.`
  Browser check → `PASS: cathedral entry/exit, wheel zoom, drag pan, minimap navigation, desktop and narrow-screen rendering.`
  Initial lint/unused-export findings were fixed without changing guardrails.
- Next step: map owner reviews the visual direction; future simulation work connects doorway
  collision, capture logic and neutral camp enemies to the existing presentation anchors.

### 2026-10-07 — Phase 1 / sprint 1.3 — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: enlarged both home strongholds and the cathedral exterior; expanded the
  cathedral interior to 1,800 × 2,200 with library, sacristy, vestry, reliquary, chapels and
  garden cloisters. Replaced broad biome bands with layered snow pockets and curved lava
  rivers with four bridges; added mountain borders, inland hills, lakes, varied trees and
  boulders. Replaced the square city grid with winding streets and housing clusters; removed
  the top-left title. Preserved original objectives, anchors and lane geometry. Added an
  additive interior-entry footprint to MapDefinition. No dependencies, commits or pushes.
- Checks run: `npm run check:quick` → exit 0; `npm run check` → exit 0 (core 42/42,
  client 33/33; core lines 100%, branches 98.02%; client lines 64.55%; production build passed).
  Verbatim docs result: `Checked 87 Markdown files under docs/. Documentation check passed.`
  Browser result: `PASS: title removed, cathedral entry/exit, wheel zoom, desktop and narrow-screen rendering.`
  Initial sandbox-only Vitest cache errors were resolved by running checks outside the sandbox.
- Next step: map owner reviews the updated environment. Mountain collision, player movement,
  capture behaviour and neutral enemies remain future simulation work.

### 2026-10-07 — Phase 1 / sprint 1.3 — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: replaced repeated mountain peak icons with connected curved ridgelines,
  blended slope shading, foothills and erosion grooves; softened inland hills. Cathedral
  entry now starts at 1.65× zoom while leaving restores the world overview. Added regression
  assertions for continuous full-edge mountain coverage, interior camera size and panning.
  Updated the governing map documentation. No dependencies, commits or pushes.
- Checks run: `npm run check:quick` → exit 0; `npm run check` → exit 0 (core 42/42,
  client 33/33; coverage thresholds and production build passed).
  Verbatim docs result: `Checked 87 Markdown files under docs/. Documentation check passed.`
  Browser result: `PASS: mountain overview and enlarged interior render; cathedral entry works.`
- Next step: map owner reviews the smoother mountain presentation and closer cathedral view.

### 2026-10-07 — Phase 1 / sprint 1.3 — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: replaced the ribbon mountain border with a field of overlapping rock masses
  varying in width, height, summit position and facets, including snow on taller peaks.
  Preserved landmark visibility by drawing mountains before fortified objectives. Rebuilt
  the cathedral interior as a circular rotunda with radial room entrances and a clear central
  capture court; added a neutral presentation capture anchor at (900, 1100). Kept the closer
  interior camera. Added tests for mountain size variation and edge coverage, circular floor
  geometry, capture-anchor position and furniture clearance. Updated governing map docs.
- Checks run: `npm run check:quick` → exit 0; `npm run check` → exit 0 (core 42/42,
  client 33/33; coverage thresholds and production build passed).
  Verbatim docs result: `Checked 87 Markdown files under docs/. Documentation check passed.`
  Browser results: `PASS: mountain field and circular capture hall render; cathedral entry works.`
  `PASS: final radial room entrances render and cathedral exit restores overview.`
- Next step: map owner reviews the mountain field and circular interior. Capture rules and
  mountain collision remain future simulation work. Changes remain uncommitted.

### 2026-10-07 — Phase 1 / sprint 1.3 — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: replaced rectangular stronghold compounds with round fortified walls and
  large palaces occupying their enclosures. Added faction-themed enterable royal throne halls
  with raised thrones, marble floors, ceremonial carpets, columns, banners and banquet tables.
  Added a visible, clickable north cathedral entrance and matching interior door. Preserved
  original landmark anchors and all other scenery. Added optional named interior-location
  metadata to MapDefinition; generalized preview entry/exit and the named leave control.
  Added regression coverage for round footprints, both throne-room entries, outside-wall
  rejection, interior bounds, return-to-world navigation and cathedral north entry.
- Checks run: `npm run check:quick` → exit 0; `npm run check` → exit 0 (core 42/42,
  client 35/35; coverage thresholds, production build and documentation checks passed).
  Verbatim docs result: `Checked 87 Markdown files under docs/. Documentation check passed.`
  Browser result: `PASS: both throne rooms enter and exit; cathedral north entrance opens its interior.`
  Initial sandbox-only Vitest cache errors were resolved by running the full gate outside
  the sandbox. No guardrails were changed; no dependencies, commits or pushes.
- Next step: map owner reviews the round strongholds and royal interiors. Player-driven
  doorway traversal and collision remain future simulation work.

### 2026-10-07 — Phase 1 / sprint 1.3 — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: replaced separate interior maps with same-world building cutaways. Clicking
  the cathedral or a palace toggles its roof independently without moving the camera or
  changing maps. Furnished interiors now fit the cathedral's nave/transept/apse and each oval
  palace footprint. Kept walls and entrance steps visible; suppressed the covered objective
  marker during cutaways while retaining its original data. Shared roof visibility with the
  minimap and added a restore-roofs overview control. Replaced old interior-location API
  fields with building footprints and per-decoration visibility metadata; removed obsolete
  standalone interior builders and updated governing docs and regression tests.
- Checks run: `npm run check:quick` → exit 0; `npm run check` → exit 0 (core 42/42,
  client 36/36; coverage thresholds and production build passed).
  Verbatim docs result: `Checked 87 Markdown files under docs/. Documentation check passed.`
  Browser results: `PASS: roofs toggle in the same world, second click restores identical canvas, multiple roofs open, zoom works.`
  `PASS: final cutaways and restore-all control render correctly.`
  Initial test-assertion lint finding was corrected without changing guardrails.
- Next step: map owner reviews same-world cutaways; future player occupancy can drive the
  roof visibility state. No dependencies, commits or pushes.

### 2026-10-07 — Phase 1 / sprint 1.3 — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: preserved stronghold perimeter walls and cathedral buttresses during roof
  cutaways; added visible nave, transept and curved apse wall sections with entrance gaps.
  Added six partitioned rooms to each palace beside its throne corridor: council, library,
  kitchen, bedchamber, armory and dining, with room-specific furniture and open doorways.
  Added cathedral stained-glass windows, candles, chapel benches/partitions, lectern and book,
  altar inlay and sacristy storage while keeping the central capture court clear. Added
  assertions for room partitions/doorways, permanent wall rendering and footprint containment;
  updated governing map docs. Same-world roof toggles remain intact.
- Checks run: `npm run check:quick` → exit 0; `npm run check` → exit 0 (core 42/42,
  client 36/36; coverage thresholds and production build passed).
  Verbatim docs result: `Checked 87 Markdown files under docs/. Documentation check passed.`
  Browser result: `PASS: detailed cathedral and partitioned palace render as same-world cutaways; zoom and pan work.`
- Next step: map owner reviews the detailed structures. Occupancy-driven roof visibility,
  movement and collision remain future simulation work. No dependencies, commits or pushes.

### 2026-10-07 — Phase 1 / sprint 1.3 — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: derived three permanent stone gate passages per stronghold from the existing
  lane crossings, connecting palace floors through the oval perimeter walls. Reoriented both
  furnished palace interiors toward the opposing team, preserving their oval footprints and
  side rooms; extended each throne carpet to its middle entrance. Removed the former single
  decorative doorway and added regression assertions for gate crossings, roof-independent
  visibility, carpet alignment and existing interior containment. Updated governing map docs.
- Checks run: `npm run check:quick` → exit 0; `npm run check` → exit 0 (core 43/43,
  client 36/36; formatting, lint, typecheck, knip, coverage and production build passed).
  Verbatim docs result: `Checked 87 Markdown files under docs/. Documentation check passed.`
- Next step: map owner reviews entrances and ceremonial aisles in the preview. Movement and
  gate collision remain future simulation work. No dependencies, commits or pushes.
