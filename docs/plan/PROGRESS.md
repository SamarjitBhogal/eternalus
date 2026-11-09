---
title: Progress log
description: The running, append-only log of what was done, which checks ran and what comes next, written by humans and agents after every work session; read the last few entries to know where the project is before starting a task.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-05
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

### 2026-10-03 — Phase 0 follow-up / INBOX batch 1 — docs/inbox-decisions-2026-10-03 — sholtzman + Claude (Cowork)

- What was done: recorded the owner's INBOX answers (DEC-01…DEC-10, 32 discrepancies) in
  `docs/reference/game-design/13-owner-decisions-log.md`; re-cut the plan to four two-week
  sprints ending at the 2026-11-27 presentation (`docs/plan/README.md` §0); extended
  `SessionPhase` with the character-select / pre-launch / match-loading flow; renamed Assault →
  Warrior across the docs; wrote the Sprint 1 session prompts
  (`docs/agents/prompts/2026-10-03-ultracode-sessions.md`); opened DEC-11…DEC-13 in `INBOX.md`.
- Checks run: `npm run format:check`, `npm run docs:check` (see the commit for the verbatim
  lines); CI repeats `npm run check` on the PR.
- Next step: push the branch, PR into `main`; create `phase/1-simulation-kernel-and-world`;
  start sessions B and D (then A, F, E, G; C after B; H in week 2) per the prompts file; close
  `copilot/implement-entity-modules` with the review-R text; answer DEC-11…DEC-13.

### 2026-10-05 — Phase 1 / sprint 1.3 (session A) — feat/map-generator — sholtzman + Claude Code

- What was done: audited the merged `feat/map`/`feat/map-view` code
  (`docs/reviews/2026-10-05-map-code-audit.md`). Replaced the hand-traced `MAP_1` with a pure,
  deterministic `MapGenerator` + `MapBuilder` (strongholds, lanes, towers on `t` bands, wall
  ring with a gate per lane and turrets, camps by depth per DISC-42, capture points with the
  Cathedral on the middle lane, a symmetric rift with a bridge gap per lane, seeded obstacles),
  the `teams/` module, the `map-1` preset (fractions of the world, lane profile, rift width
  profile) and the `WorldMap` walkability grid. Client: `Renderer` port + `Canvas2dRenderer`,
  `RecordingRenderer`, glyph-based map and minimap drawing. An independent reviewer agent
  checked the branch against the base-commit architecture. Its findings F1–F18 (sealed gates at
  7+ lanes, leaky walls, an asymmetric default map and others) were fixed and recorded in audit
  §6. Architecture 02 and 06 (§10), the core and client `AGENTS.md`, sprint 1.3 checkboxes,
  INBOX (DEC-14–DEC-16, requests to session B) and the PR description
  (`docs/changelog/pr-feat-map-generator.md`) were updated.
- Checks run (worktree `.worktrees/map-generator`, Node 24.21.0): `npm run check` → exit 0.
  "All matched files use Prettier code style!"; lint clean; typecheck clean; knip clean apart
  from the existing configuration hint "@eternalus/core apps/client knip.json Remove from
  ignoreDependencies"; core "Test Files 8 passed (8) / Tests 91 passed (91)", coverage
  statements 97.92 %, branches 86.26 %; client "Test Files 7 passed (7) / Tests 36 passed (36)",
  statements 80.78 %, branches 74.35 %; "✓ built"; "Checked 93 Markdown files under docs/.
  Documentation check passed."
- Next step: push `phase/1-simulation-kernel-and-world` (from `main`) and `feat/map-generator`,
  open the PR into the phase branch with reviewer Aryan Walanj. The owner answers DEC-14–DEC-16.
  Once session B lands `config/`, swap the local `MapConfig`/`DEFAULT_MAP_CONFIG` for
  `GameConfig` (owner: sholtzman).

### 2026-10-05 — Phase 1 / sprint 1.3 (session A, re-review) — feat/map-generator — sholtzman + Claude Code

- What was done: the reviewer's second pass found that at aspect ratios other than 16:9, lanes
  could run back through their own wall ring (N1). Lanes now leave each gate straight through
  a 20-unit apron and only bend eastwards. The validator rejects lanes that run west or through
  walls, turrets or Strongholds. Seeds are limited to 0…2³²−1 and lane profiles are validated.
  Corrected overstated wording (world size, the B1 argument, which DEC-14 items were judged
  better) in the audit §6, INBOX DEC-14/15, arch 06 §10 and the PR description. The golden map
  hash changed on purpose (lane apron).
- Checks run: `npm run check` → exit 0. "All matched files use Prettier code style!"; lint,
  typecheck clean; knip clean apart from the existing configuration hint; core "Test Files 8
  passed (8) / Tests 96 passed (96)", statements 97.84 %, branches 87.03 %; client "Test Files
  7 passed (7) / Tests 36 passed (36)", statements 80.78 %, branches 74.35 %; "✓ built";
  "Checked 93 Markdown files under docs/. Documentation check passed."
- Next step: unchanged from the entry above (push both branches, open the PR with reviewer
  Aryan Walanj; the owner answers DEC-14–DEC-16).
- Follow-up (same day): the reviewer's targeted N1 check confirmed the fix (all probed worlds
  generate, lanes never touch a wall, turret or Stronghold, every lane connects). Its two nits
  were fixed: `wallRing.laneApron` is now validated (the rule had not been applied; the new test
  fails without it), and a test title no longer claims "any world size". `npm run check` → exit
  0; core "Tests 97 passed (97)", client "Tests 36 passed (36)"; "Documentation check passed."

### 2026-10-05 — Phase 1 / sprint 1.2 — refactor/implement-entity-modules — SamarjitBhogal + Claude Code

- What was done: ported `packages/core/src/entities/*.js` one-to-one to TypeScript (`Entity`, `Unit`, `Legend`, `Mob`, `EntityRegistry`, `EntityFactory`, plus `Entity.types.ts` and `EntityRegistry.types.ts`) with `.test.ts` ports of every JS test and a few added cases; deleted the JS files; reverted `packages/core/vitest.config.ts` to `.ts`-only globs. Added `npm run check:no-js` (`scripts/checks/no-js.mjs`): fails on any tracked/staged `.js`/`.jsx`/`.mjs`/`.cjs` except `eslint.config.js` and `scripts/**/*.mjs`; it runs in `check:quick` (git hooks), `check` and CI. Documented in `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, `docs/process/guardrails.md`.
- Checks run: `npm run check` → exit 0 (format, no-js, lint, typecheck, knip, core tests 20/20 at 100% coverage, client 27/27, build, docs 87 files passed). Guard self-tested: staging `packages/core/src/x.js` makes `check:no-js` exit 1.
- Next step: wire concrete entity kinds and content definitions into the registry; owner: sim lane.

### 2026-10-05 — Phase 1 / sprint 1.2 — refactor/implement-entity-modules — SamarjitBhogal + Claude Code

- What was done: addressed the PR #4 review on entity ids. `EntityFactory.create(kind, definitionId, spawnContext)` no longer takes an id; the factory assigns `entity-<n>` from a per-factory counter (`EntityFactory.constants.ts`), so ids are unique per match and deterministic for replays (no `Math.random`). Added a test for sequential, per-factory ids.
- Checks run: `npm run check` → exit 0 (core 21/21 tests, 100% coverage).
- Next step: wire concrete entity kinds and content definitions into the registry; owner: sim lane.

### 2026-10-06 — Phase 1 / sprint 1.3 (session A, docs) — feat/map-generator — sholtzman + Claude Code

- What was done: the owner signed off DEC-14 (the four map-generator refinements the critic
  judged better than architecture 06); recorded in the decisions log and INBOX. A first
  automated doc sweep corroded the docs (target designs replaced by interim code, tuning values
  copied into architecture 06) and was reverted before commit. Redone surgically: architecture 06
  §2–§6 now carry DEC-14 as design text and §10 lists only interim items; 32 other living docs got
  minimal corrections (contract type names, superseded design, stale "no code yet" claims), each
  checked by an independent reviewer against OG-12 (`chore/pre-pr-gate`). No record was edited.
- Checks run: `npm run check` → exit 0: "All matched files use Prettier code style!"; lint,
  typecheck and knip clean; core "Tests 97 passed (97)", client "Tests 36 passed (36)"; "✓ built"; "Documentation check passed."
- Next step: the human pushes `feat/map-generator`; run the new pre-PR gate's ponytail step on
  PR #8; merge `main` (now with PR #9) into the phase branch and resolve any conflict.
- Follow-up (same day): pre-PR gate run on this branch. Ponytail review of the code diff: one cut
  applied (single keep-out zone), one reverted as longer, two kept for the architecture and the
  brief; `npm run check` → exit 0 (core 97/97, client 36/36). Gate results in the PR description.

### 2026-10-06 — Process / pre-PR gate — chore/pre-pr-gate — sholtzman + Claude Code

- What was done: owner decision to add a pre-PR gate after the Definition of done (independent
  architecture critic, ponytail pass, `npm run check` re-run, then the PR) — ADR 0010, `AGENTS.md`
  "Before opening a PR" and "Ponytail", CONTRIBUTING §8, checklists §1/§4, PR template, git
  workflow, guardrails table, harness doc, `verify`/`pr-review` skills. Ponytail runs at `lite`,
  injected into the main session and coding subagents only (`.claude/settings.json` env; matcher
  pipe-tested). Documentation longevity rule OG-12 and ADR 0011 after a doc sweep corroded
  architecture docs. Every changed doc was reviewed independently against OG-12.
- Checks run: `npm run check` → exit 0: "All matched files use Prettier code style!"; lint,
  typecheck and knip clean; core "Tests 7 passed (7)", client "Tests 27 passed (27)"; "✓ built"; "Documentation check passed."
- Next step: the human pushes `chore/pre-pr-gate` and opens it into `main` after PR #5; in the
  first new session, confirm ponytail starts at `lite` (per-project mode flag).

### 2026-10-06 — Phase 1 / sprint 1 setup — phase/1-simulation-kernel-and-world — sholtzman + Claude Code

- What was done: brought the phase branch up to date for the Sprint 1 sessions by merging
  `origin/main` (`4cff2a7`), `origin/docs/inbox-decisions-2026-10-03` (`3fab2df`) and
  `origin/chore/pre-pr-gate` (`bdf2e37`). Conflicts: this log (every entry kept, oldest first) and
  `docs/process/guardrails.md` (`last-reviewed` → 2026-10-06; all 22 table rows kept). The agent's
  own `git fetch` failed on keychain auth; merged refs from the human's 18:15 fetch.
- Checks run: `npm ci` → ok; `npm run docs:index` → "Documentation check passed." (no changes);
  `npm run check` → exit 0: Prettier clean, lint/typecheck/knip clean, core "Tests 37 passed
  (37)" at 100%, client "Tests 27 passed (27)", "✓ built", "Documentation check passed."
- Next step: the human pushes the phase branch; start the Sprint 1 sessions per
  `docs/agents/prompts/2026-10-03-ultracode-sessions.md`.

### 2026-10-06 — Phase 1 / sprint 1 session D — feat/session-shell-home — sholtzman + Claude Code

- What was done: client session shell per prompt §3 D. `bridge/`: §2.3 events and types,
  `TypedEventBus` + `eventBus`/`emitIntent`, the seven slices, `useAppSelector`,
  `connectBusToStore`. `game/`: `SessionClock` port + adapters + contract suite;
  `SessionController` (architecture 13 §2 table, one state per phase, 60 s / 10 s countdowns,
  `select-timeout`, same-setup rematch, `IllegalSessionTransition`), seeded team draw, 10 + 10
  rosters with the player as Rover, `data-team` theming, placeholder catalogue. `ui/`: `App.tsx`
  routing, home menu, About/Loadout/Profile/Results shells, §2.4 tokens. Client coverage → 55.
  Session F's settings intents added at its request. Gate: critic ×2 (code findings fixed),
  ponytail 2 cuts applied / 1 rejected; details in `docs/changelog/pr-feat-session-shell-home.md`.
- Checks run: `npm run check` → exit 0 (verbatim tail in the PR description).
- Next step: Sam pushes and opens the PR; E/G swap their `App.tsx` lines; after F merges, wire
  `SettingsScreen` and `SettingsController`; Sam answers the `useAppDispatch` INBOX item.

### 2026-10-06 — Phase 1 / sprint 1.1 — feat/sim-kernel — sholtzman + Claude Code

- What was done: first deliverable of session B: `packages/core/src/config/` with
  `GameConfig.types.ts` (integration contract §2.2, plus `map.navCellSize` as the nav grid's
  config home requested by session A), `createDefaultGameConfig(overrides)` (deep merge, frozen)
  and `validateGameConfig(unknown)` throwing `ConfigValidationError` with the field path. The map
  rules are session A's `validateMapConfig` rules, so A can delete its stand-ins. **Sam: this
  commit is ready to merge into the phase branch early to unblock session A.**
- Checks run: `npm run check` → exit 0: "All matched files use Prettier code style!"; core
  "Tests 78 passed (78)" at 100% coverage; client "Tests 27 passed (27)"; "✓ built in 235ms";
  "Documentation check passed."
- Next step: session B continues with `utils/`, `state/`, `commands/`, `diagnostics/` and
  `Simulation` on the same branch.

### 2026-10-06 — Phase 1 / sprint 1.1 — feat/sim-kernel — sholtzman + Claude Code

- What was done: session B's simulation kernel in `packages/core`: `utils/` (`SeededRandom`
  sfc32 + `Rng` port, `deterministicMath`, `vec2`, `fnv1a`, `RingBuffer`, `IdGenerator`),
  `state/` (`GameState`, `EntityStore`, `GameEvents` with the 03 §4 catalogue, snapshots,
  `StateHasher`), `commands/` (union, queue, handler registry; dev-spawn honours the caps),
  `diagnostics/` (`Logger` port, replay harness, golden fixture), `Simulation` +
  `SystemPipeline`; core coverage threshold 80 → 85. Ticked six sprint 1.1 items; SeededRandom
  (lint ban), Vec2 (mutating variants), replay (15 §7 format) and Logger (`DiagnosticEvent`)
  stay open. Asked in `INBOX.md`: two better-than-design sign-offs, session A's swap, the lint
  ban, design-doc deltas. PR body: `docs/changelog/pr-feat-sim-kernel.md`.
- Checks run: sprint metric: 10 seeds × 3,000 ticks, identical hashes every 100 ticks, twice,
  in 367–377 ms (Apple M4 Pro, 24 GB, Node 24.21.0, Vitest 5.0.2). `npm run check` → `EXIT=0`:
  "All matched files use Prettier code style!"; core "Tests 197 passed (197)" at 100%; client
  "Tests 27 passed (27)"; "✓ built in 69ms"; "Documentation check passed." Pre-PR gate: critic
  NO BLOCKERS after three passes; ponytail cut two test-only getters (−14 lines).
- Next step: Sam pushes `feat/sim-kernel` and opens the PR into the phase branch; session A
  swaps its stand-ins after the merge; session C starts on the merged kernel.

### 2026-10-07 — Phase 1 / sprint 1.1 — feat/sim-kernel — sholtzman + Claude Code

- What was done: follow-ups on PR #13 after the owner's sign-off (DEC-15…DEC-18, decisions log):
  determinism lint with ADR 0012 and an `exp` wrapper; in-place `Vec2` forms; `DiagnosticEvent`
  types and typed log records; 03 §10's initial-hordes cap rule; the kernel design folded into
  architecture 01, 02, 03, 10, 15 and 17 with "Implementation status" sections in 03 and 15;
  replay fixture format in 15 §7; session C's follow-ups in `INBOX.md` and its prompt. All ten
  sprint 1.1 items ticked. Correction: the 2026-10-06 entry above had its "Checks run" line
  completed in place (it first pointed at the PR body) before the branch was pushed; this log is
  append-only, so that edit is recorded here.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 204 passed (204)" at 100%; client "Tests 27 passed (27)"; "✓ built in 70ms";
  "Documentation check passed." Sprint metric: 10 seeds × 3,000 ticks, identical hashes, in
  356–360 ms (Apple M4 Pro, 24 GB, Node 24.21.0). Pre-PR gate on the follow-ups: critic pass 4
  found one blocker (stale PR body and PROGRESS), fixed; ponytail found nothing to cut.
- Next step: Sam pushes the follow-ups to PR #13 and updates its description; session A swaps
  its stand-ins after the merge; session C starts from its `INBOX.md` request.

### 2026-10-07 — Phase 1 / sprint 1 integration — feat/map-generator, chore/pre-pr-gate, docs/inbox-decisions-2026-10-03 — sholtzman + Claude Code

- What was done: resolved the merge conflicts of PR #5 (`docs/inbox-decisions-2026-10-03` →
  `main`), PR #10 (`chore/pre-pr-gate` → `main`) and PR #8 (`feat/map-generator` →
  `phase/1-simulation-kernel-and-world`) with merge commits, no rebase and no force. This log
  keeps every entry from both sides verbatim, oldest first; `guardrails.md` takes 2026-10-06 and
  `main`'s updated pre-commit row. In #8, `components/TeamMembership.ts` now takes `Team` from
  `teams/teams.types.ts` (#8 moved the team type out of `maps.types.ts`), and
  `packages/core/AGENTS.md` lists the folders that exist after the merge.
- Checks run: `npm run check` → `EXIT=0` on each merged branch: #5 and #10 core "Tests 37 passed
  (37)", client "Tests 27 passed (27)"; #8 core "Tests 127 passed (127)", client "Tests 36 passed
  (36)"; "Documentation check passed." on all three.
- Next step: Sam pushes the three branches, merges #5 then #10 into `main` (merge commits) and #8
  into the phase branch; `feat/sim-kernel` (#13) re-syncs with the phase branch after #8.

### 2026-10-07 — Phase 1 / sprint 1.1 — feat/sim-kernel — sholtzman + Claude Code

- What was done: re-synced PR #13 with the phase branch after PR #8 (the map generator) merged.
  Kernel files use `Team` from `teams/teams.types.ts`; `index.ts` exports both APIs with
  `MapConfig` only from `config/` and without the deleted `MAP_1`; `polarPoint` and one wall-ring
  test call `utils/deterministicMath.ts` so #8's code passes the determinism lint (ADR 0012); both
  sides' doc edits kept (01, 02, 03, 10, 15, 17, core `AGENTS.md`, decisions log, `INBOX.md`), 03
  §12 and 06 §10 updated for what the merge resolved. Correction to the 2026-10-07 entries above:
  session B's decisions recorded there as DEC-15…DEC-18 are DEC-17…DEC-20, because #8's open
  INBOX items already use DEC-15 and DEC-16.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 295 passed (295)" (statements 98.78%, branches 91.48%, functions 99.1%, lines 98.69%);
  client "Tests 36 passed (36)"; "✓ built in 79ms"; "Documentation check passed."
- Next step: Sam pushes `feat/sim-kernel`; PR #13 then merges into the phase branch.

### 2026-10-07 — Phase 1 / sprint 1.2 — feat/entity-collider-and-concrete-kinds — claudiodh + Claude Code

- What was done: entity foundation of sprint 1.2 (SCRUM-16), all as classes, keeping main's
  `Entity`/`Unit`/`Legend`/`Mob` contract that `feat/sim-kernel` builds on. New family bases
  `Structure`, `Zone`, `Obstacle`, `Projectile` on a runtime-checked `SpawnContextReader`;
  `UnitComponentInstaller`; `Collider`, `Vision`, layered shields on `Health`; the characters
  `Warrior`/`Sentinel`/`Magus` with traits from `01-classes`; `LightMob` + the training dummy only
  (other mobs: SCRUM-59). One `EntityModule` per family installed by `DefaultEntityRegistry`;
  frozen `ContentCatalogue`s, rule-based `ContentValidator`, ESLint core module rings.
- Checks run (Node 22, `npm_config_engine_strict=false`): `npm run check` → exit 0 (core "Tests
  227 passed (227)", client "Tests 36 passed (36)", "✓ built", "Documentation check passed.");
  a trial merge with `feat/sim-kernel` conflicts only in `index.ts`, `index.test.ts` and this log.
- Next step: pre-PR gate, then review. Session B (#13) adds `MovementSystem`, `DeathSystem`,
  `InvariantSystem`; owner: sim lane.

### 2026-10-07 — Phase 1 / sprint 1.2 — feat/entity-systems — claudiodh + Claude Code

- What was done: session B's handoff to session C (`INBOX.md`), stacked on `feat/sim-kernel` and
  the entity foundation. `Simulation` takes `SimulationOptions` and builds `DefaultSystemPipeline`
  (`MovementSystem`, `DeathSystem`, `InvariantSystem`); `EntityFactory` uses `IdGenerator` and a
  `DefinitionSource`; `MoveHandler`/`StopHandler`; `InvariantRunner` + `DebugConfig` with
  `no-removal-without-cause`, `health-within-bounds`, `finite-transforms`, each with a test that
  triggers it; `GameState.recentCommands`, `LogRecord.context`; `StateHasher` fields for shields,
  heading, collider and vision (recorded replay checkpoints unchanged); `ShieldBar` shared.
  Player scenarios now also play through the `Simulation`.
- Checks run (Node 22, `npm_config_engine_strict=false`): `npm run check` → exit 0 (core "Tests
  449 passed (449)", client "Tests 36 passed (36)", "✓ built", "Documentation check passed.").
- Next step: Sam decides the `dev-remove-entity` deferral (INBOX); `ObjectPool`, the remaining
  sprint 1.2 invariants and the pre-PR gate; owner: claudiodh.

### 2026-10-07 — Phase 1 / sprints 1.4–1.5 — feat/engine-loop-match — claudiodh + Claude Code

- What was done: session H's first pieces (SCRUM-154), stacked on `feat/entity-systems`.
  `GameLoop` + `FrameScheduler` port (`RafFrameScheduler`, `FakeFrameScheduler`); entity views
  (`DefaultEntityView`, `LegendView`), `ViewRegistry`/`DefaultViewRegistry`, `EntityLayer`;
  `Camera` follow, zoom, culling and world↔screen; `Match` composition root with the player's
  Warrior at the Light stronghold and an `IntentSource` port; `useMatch` replaces `useMapCanvas`;
  `SinkLogger`, `ConsoleSink`, `RingBufferSink`. Minimap untouched (SCRUM-151, Aryan); keyboard
  left to session F. 08 §11 records the interim differences. After the pre-PR critic: cleanup
  is proven by tests, unknown kinds are logged once, and the GameLoop and Logger sinks plan items
  stay open (the Clock is session D's; the overlay cannot read the ring buffer yet).
- Checks run (Node 22, `npm_config_engine_strict=false`): `npm run check` → exit 0 (core "Tests
  449 passed (449)", client "Tests 83 passed (83)", "✓ built", "Documentation check passed.").
- Next step: pre-PR gate, then the PR (after #14 and #17); input session F for WASD; owner:
  claudiodh.

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

### 2026-10-08 — Phase 1 / sprint 1.5 — feat/player-input — claudiodh + Claude Code

- What was done: WASD movement in the browser (SCRUM-158, SCRUM-217), stacked on
  `feat/engine-loop-match`. `bridge/Binding.types.ts` (`INPUT_ACTIONS`, `InputChord`, `Binding`);
  `game/input/keybindings.ts` with every default and the `wasd`/`arrows` presets;
  `InputDevice` port and `KeyboardDevice`; `InputMapper` (bindings → actions → `InputIntent`);
  `DeviceIntentSource` replaces `IdleIntentSource` in `useMatch`, with focus-loss release.
  09 §11 records the interim differences; a player scenario walks the Warrior with W.
- Checks run (Node 22, `npm_config_engine_strict=false`): `npm run check` → exit 0 (core "Tests
  449 passed (449)", client "Tests 111 passed (111)", "✓ built", "Documentation check passed.").
- Next step: core `PlayerController` for the `intent` command (INBOX, Sam's TODO); `MouseDevice`;
  pre-PR gate; owner: claudiodh.

### 2026-10-08 — Phase 1 / sprint 1.5 — feat/player-input (mouse) — claudiodh + Claude Code

- What was done: `MouseDevice` (buttons bitmask with side buttons, pointer on the canvas, pointer
  capture, `contextmenu`/`auxclick`/non-primary presses cancelled); the shared
  `describeInputDevice` contract suite for both devices (09 §9); `InputMapper` matches mouse
  chords by `chordKey` and aims through a `Projection` port that `Match` implements with its
  camera; `useMatch` attaches the mouse to the canvas. 09 §11 and 08 §11 updated; the
  `KeyboardDevice` / `MouseDevice` box is ticked.
- Checks run (Node 22, `npm_config_engine_strict=false`): `npm run check` → exit 0 (core "Tests
  449 passed (449)", client "Tests 127 passed (127)", "✓ built", "Documentation check passed.").
- Next step: core `PlayerController` consumes `aim` and `triggered` (INBOX); pre-PR gate on the
  mouse commits; owner: claudiodh.

### 2026-10-08 — Phase 1 / sprint 1.2 — feat/entity-collider-and-concrete-kinds — claudiodh + Claude Code

- What was done: the PR #14 review (Sam, 2026-10-08). Registry back to
  `createDefaultEntityRegistry()` (DEC-21); content rules get the catalogue, are listed in
  `content/defaultContentRules.ts` and run once from `loadDefaultContent()`, which also converts
  speeds authored per second to per tick (DEC-22); `EntityFactory` resolves definitions by id,
  checks their kind once and takes ids from `IdGenerator`, `dev-spawn` rejects
  `unknown-definition`, and `Simulation` spawns a Warrior; `Unit` installs the unit components;
  `StateHasher` hashes shields, colliders and vision; `ShieldBar` shared with `GameEvents`;
  shields in creation order; `EntityDefinitionBase`; `deepFreeze` in `utils/`; ring lint, ADR
  0013 and the AGENTS section removed (DEC-24). DEC-21…24 logged; proposals in `INBOX.md`.
- Checks run (Node 22, `npm_config_engine_strict=false`): `npm run check` → exit 0 (see the PR).
- Next step: Sam re-reviews #14; then merge it into #17, #18 and #19; owner: claudiodh.

### 2026-10-08 — Phase 1 / sprint 1 session D — feat/session-shell-home — sholtzman + Claude Code

- What was done: resolved PR #12's merge conflicts by merging `origin/phase/1-simulation-kernel-and-world`
  (`b0e9dea`, after PRs #13 and #15) into `feat/session-shell-home`; merge commit, no rebase and no
  force. Conflicts were docs only: this log (every entry from both sides kept verbatim, oldest
  first; 12 base + 1 + 4 = 17 entries) and `docs/README.md` (regenerated with `npm run docs:index`;
  the changelog table lists both `pr-feat-session-shell-home.md` and `pr-feat-sim-kernel.md`).
  `INBOX.md` and the phase-1 plan auto-merged; no code changes were needed.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; lint,
  typecheck and knip clean; core "Tests 295 passed (295)" (statements 98.78%, branches 91.48%);
  client "Tests 197 passed (197)" (statements 90.13%, branches 88.23%); "✓ built in 94ms";
  "Documentation check passed."
- Next step: review and merge PR #12. Follow-up: core now exports `SeededRandom`, so the client's
  `LcgRng` stand-in can be swapped at the `createRng` line in `main.tsx` (its own task).

### 2026-10-08 — Phase 1 / sprint 1.3 — feat/buildings-and-map-objects (merge of phase/1) — SamarjitBhogal + Claude Code

- What was done: merged `phase/1-simulation-kernel-and-world` into the PR branch and ported the
  map work onto the config-driven `MapGenerator`. `MapSceneryBuilder` (core export) dresses any
  generated map from sketch-space content stretched to the world size; camps, forts and
  strongholds anchor on generated features. `CathedralInteriorBuilder` (core export) builds the
  interior and its entry footprint from the generated cathedral. `Match` keeps the following
  camera and adds the restored `MapExplorer` free view (drag pan, wheel zoom, overview, cathedral
  interior); `GameCanvas` has the PR's toolbar and legend again. Removed the static `MAP_1`,
  `MapLayout`'s ×8 scale and the hand-placed camps (the generator places camps).
- Checks run: `npm run check` → exit 0 (core `Test Files 78 passed (78)`, `Tests 449 passed
(449)`, lines 99.16%; client `Test Files 58 passed (58)`, `Tests 301 passed (301)`, lines
  89.98%; build passed; `Checked 98 Markdown files under docs/. Documentation check passed.`).
  Pre-PR critic: BLOCKED (V1–V5, see the PR); ponytail: 6 cuts, −51 lines, output identical.
- Next step: owner reviews the merge; per-frame scenery cost is left as is for now.

### 2026-10-08 — Phase 3 prototype (sprint 3.3 subset) — feat/minion-follow-prototype — SamarjitBhogal + Claude Code

- What was done: prototype for the demo, stacked on `feat/player-input` (#19 → #18 → #17 → #14) and synced
  with the phase branch after PR #12, and again after #14, #17, #18 and #19 merged (merge commits;
  `MobView` now registered in `createDefaultViewRegistry()`).
  Minions escort the player's Legend: `ai/Controller.types.ts`, `ai/AiSystem.ts` (runs first,
  queues decisions for the next tick), `ai/FollowLeaderController.ts` (walk to the nearest allied
  Legend, keep space from it and from other followers), `components/Brain.ts` (installed by `Unit`
  when a definition names a `controller`), `EntityStore.positionOf/teamOf/controllerOf` for `ai/`,
  `content/mobs/lightMinion.ts`, `content/ai/followLeaderProfile.ts`; `Match` spawns six
  minions around the player; `views/MobView.ts` draws mobs on a dark outline (the default view
  painted them in the team colour, invisible on their own Stronghold). Checked in headless Chrome:
  the escort shows, trails the player while it walks and settles around it. Prototype decision, to be replaced by Phase 3's `MinionController`,
  `SpawnSystem` and `Perception`: recorded as PROTO-01 in `INBOX.md`; no design doc changed.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 456 passed (456)" (statements 99.03%, branches 93.46%); client "Tests 291 passed (291)"
  (statements 92.51%, branches 93.35%); "✓ built in 152ms"; "Documentation check passed." (Node
  24.21.0, Linux). Pre-PR gate not run yet.
- Next step: rehearse the demo; after #14–#19 merge, open the PR into the phase branch through the
  pre-PR gate, or drop the branch when Phase 3 lands.

### 2026-10-08 — Phase 3 prototype (sprint 3.3 subset) — feat/minion-follow-prototype (pre-PR gate) — SamarjitBhogal + Claude Code

- What was done: ran the pre-PR gate (ADR 0010) on the prototype. Critic pass 1 found one blocker
  (the Match default-view warning test had lost its exact assertion; restored with an `obstacle`
  through test-injected content) and several should-fix items, all fixed: `AiSystem` asks each
  entity on a cadence (`decideEveryTicks: 5`, architecture 11 §6, staggered by store position) and
  throws on an unregistered controller; the follower sends `stop` only while it is steering
  (`EntityStore.isSteering`); deterministic `distance`/`length` instead of `Math.hypot`; the light
  minion cites `balancing.md` and states its speed and mass departures; PROTO-01 now asks the
  owner to confirm them and where `AiSystem` belongs. Ponytail: one cut (−2 lines). Correction to
  the entry above: it is dated 2026-10-09 but the work was done on 2026-10-08; this log is
  append-only, so the date is corrected here.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 459 passed (459)" (statements 99.03%, branches 93.55%); client "Tests 292 passed (292)"
  (statements 92.61%, branches 93.35%); "✓ built in 162ms"; "Documentation check passed." (Node
  24.21.0, Linux). Critic pass 2: NO BLOCKERS. Headless Chrome: the escort trails the player and
  settles around it.
- Next step: Samarjit commits and pushes the rework, then opens the PR into the phase branch with
  `docs/changelog/pr-feat-minion-follow-prototype.md` as its description.

### 2026-10-08 — Phase 3 prototype (sprint 3.3 subset) — feat/minion-follow-prototype (markers) — SamarjitBhogal + Claude Code

- What was done: marked every piece of the escort prototype as temporary with
  `PROTOTYPE(PROTO-01) TEMPORARY` plus what replaces it (18 markers, 16 files; comments only): the
  follow controller, its profile and tests, the light-minion definition and its catalogue line,
  the escort spawn and its tests in `Match`, and the interim `AiSystem`, `Brain`, `EntityStore`
  read helpers, `Unit` brain attach, `Simulation` controller list and `DefaultSystemPipeline`
  `decide` parameter. The convention is explained in PROTO-01 (`INBOX.md`) and the PR #23
  description doc, with a proposal to add it to `AGENTS.md` once the owner approves.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 459 passed (459)"; client "Tests 292 passed (292)"; "✓ built in 165ms"; "Documentation
  check passed." (Node 24.21.0, Linux).
- Next step: update the PR #23 description on GitHub from the doc; reviewers check the markers.

### 2026-10-08 — Process / tooling — chore/lint-ignore-worktrees — sholtzman + Claude Code

- What was done: DEC-16, accepted by the owner in chat. `eslint.config.js` adds `.worktrees/` and
  `.claude/worktrees/` to `globalIgnores`. Before, `eslint --debug .` from the main checkout
  linted 727 files under `.worktrees/` besides the main tree's 174. A probe file with a lint error
  under `.worktrees/` is now reported as ignored, and the same file outside it is still linted.
  Recorded in the decisions log (batch 2026-10-08), moved to Done in `INBOX.md`, and noted in
  `docs/agents/running-agents.md` §3.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; lint,
  typecheck and knip clean; core "Tests 295 passed (295)"; client "Tests 36 passed (36)";
  "✓ built in 237ms"; "Documentation check passed."
- Next step: the human reviews and commits; the PR into the phase branch touches
  `eslint.config.js` line 24 only, away from PR #14's module-ring hunk (line 78 on).

### 2026-10-08 — Process / tooling — chore/lint-ignore-worktrees — sholtzman + Claude Code

- What was done: pre-PR gate on DEC-16. The critic found no blockers and one major: a change to
  `eslint.config.js` needs an ADR (`docs/agents/checklists.md`, `guardrails.md` §4). The owner
  chose to add one: ADR 0014, a "Lint scope" row in the guardrails table, and ADR 0014 named in
  the DEC-16 row and the config comment. Ponytail: "Lean already. Ship." Correction to the entry
  above: its next step ("the human reviews and commits") was overtaken, because the owner asked
  for the commit and the PR in the same session.
- Checks run: see the PR description for the verbatim `npm run check` output after the ADR.
- Next step: review and merge the PR into the phase branch. Whichever of it and PR #14 merges
  second keeps both `PROGRESS.md` entries (#14's first).

### 2026-10-09 — Process / tooling — chore/lint-ignore-worktrees — sholtzman + Claude Code

- What was done: re-synced PR #20 with the phase branch twice: after PR #12, and after PRs #14,
  #17, #18 and #19. Merge commits only. Conflicts kept both sides, newest first: `INBOX.md`
  (session D's open item; the PR #14 and DEC-16 Done entries), this log, and the decisions log's
  two 2026-10-08 batches. ADR 0014 is still free on every remote branch (0013 is reserved by
  DEC-24, 0015 by `feat/settings-keybindings`).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 442 passed (442)"; client "Tests 289 passed (289)"; "✓ built in 218ms"; "Documentation
  check passed."
- Next step: the human pushes; PR #20 (approved) merges into the phase branch.

### 2026-10-09 — Phase 1 / sprint 1.3 — feat/buildings-and-map-objects (merge of phase/1) — sholtzman + Claude Code

- What was done: re-synced PR #22 with the phase branch after PR #20 merged. Merge commit only.
  The one conflict was this log; every entry from both sides was kept, oldest first: 32 entries
  (24 shared, 5 from this branch, 3 from the phase branch).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 449 passed (449)"; client "Tests 301 passed (301)"; "✓ built in 225ms"; "Documentation
  check passed."
- Next step: the human pushes; PR #22 (approved) merges, then PRs #23 and #24 re-sync.

### 2026-10-09 — Phase 1 / plan audit — feat/minion-follow-prototype — SamarjitBhogal + Claude Code

- What was done: audited the Phase 1 plan against the local working tree (open PRs not counted)
  and ticked six items whose code and tests are in place: `DeathSystem` with `RemovalCause`, the
  `map-1` preset, `GameLoop` + `FrameScheduler`, `MinimapView`, the logger sinks and the coverage
  ratchet (core 85, client 55). Still open: `SpatialHash`, `CollisionSystem`, `ObjectPool`, the
  unique-id and live-reference invariants, the `WorldMap` cost grid and its wiring into
  `Simulation`, the renderer's three layers and `getContext` lint rule, `TerrainView`, the bridge
  clock publish, `PlayerController`, collision for the placeholder Legend, `PerfOverlay`,
  `DeveloperMenu` and `npm run bench`. None of the open PRs (#22, #23, #24) adds `SpatialHash`,
  collision or `WorldMap` wiring, which Phase 3 minions need. Docs only.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 459 passed (459)"; client "Tests 292 passed (292)"; "✓ built in 230ms"; "Documentation
  check passed." Also restored a blank line in this log that the `c563c01` conflict resolution
  dropped (Prettier failed on it at HEAD).
- Next step: pick up `SpatialHash` and `CollisionSystem` v1 (sprint 1.3) before more minion work.

### 2026-10-09 — Phase 1 / sprint 1.3 — feat/buildings-and-map-objects (merge of phase/1) — SamarjitBhogal + Claude Code

- What was done: re-synced PR #22 with the phase branch (minion-follow prototype, plan audit).
  Conflicts in `Match.ts`, `Match.constants.ts` and this log; both sides kept in each
  (`DEFAULT_ASPECT` and the free-view helpers next to `PROTOTYPE_ESCORT` and `spawnEscort`).
  Merge left uncommitted.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 466 passed (466)"; client "Tests 304 passed (304)"; "✓ built in 176ms"; "Documentation
  check passed."
- Next step: the human commits the merge and pushes; PR #22 merges.

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

### 2026-10-10 — Phase 1 / sprint 1.3 — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: resolved all 18 unmerged paths by integrating same-world cathedral and palace
  roof cutaways with the generated map, live player/escort simulation, renderer port and camera
  controls. Kept oval stronghold walls, three lane entrances, furnished side rooms and throne
  carpets. Presentation follows generated feature IDs and positions without scaling simulation
  geometry or adding hand-placed gameplay camps. Retained the incoming legacy cathedral builder
  API and its tests, while the active Match uses one world scene. Preserved all progress entries
  from both sides; updated map docs, deterministic math calls and integration regression tests.
  Staged conflict resolutions and related fixes; no commit, push or new merge operation.
- Checks run: `npm run check:quick` → exit 0; `npm run check` → exit 0. Formatting,
  no-JS, lint, typecheck, knip, coverage and build passed; core 472/472, client 307/307.
  Verbatim tail: `Checked 100 Markdown files under docs/. Documentation check passed.`
  Both `git diff --check` and `git diff --cached --check` passed; Git reports no unmerged paths.
  Initial formatting and deterministic-math lint findings were fixed without changing guardrails.
- Next step: human reviews and commits the pending merge. Building collision and automatic
  occupancy-driven roof visibility remain future work.

### 2026-10-10 — Phase 1 / sprint 1.3 — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: refined map presentation for the existing player camera without changing
  camera tracking, zoom, simulation geometry or gameplay. Added clipped, deterministic
  material detail for slate roofs, masonry floors and walls, carpet, grass, foliage, water
  and worn roads. Added layered lane verges and narrower stronghold roof trims and banners.
  Building artwork replaces oversized main-view feature glyphs; minimap markers remain.
  Added polygon culling, cached material batches and static scenery caches with roof/view/resize
  invalidation. Live entities render separately. Updated governing map and engine documents.
- Checks run: `npm run check:quick` passed; `npm run check` passed (exit 0): format,
  no-JS, lint, typecheck, knip, coverage, production build and documentation. Core 472/472,
  client 314/314. Verbatim tail: `Checked 100 Markdown files under docs/. Documentation check passed.`
  Browser inspection covered the close-view roof and interior, roof toggle and movement.
  An unchanged view measured 16.7 ms/frame in isolated headless Chrome; this is not a
  moving-camera performance guarantee. Initial lint findings were corrected without weakening
  guardrails. `git diff --check` passed. Changes remain uncommitted.
- Next step: human reviews the map at player zoom and provides the next visual requirement;
  moving-camera performance remains worth profiling separately from cached stationary views.

### 2026-10-13 — Phase 1 / sprint 1.3 — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: replaced the client placeholder seed with a fresh browser-generated unsigned
  seed per match, shared by map generation and simulation. Seeded off-path corridor camps and
  corner camps while retaining mirrored definitions, counts, depth-based weights, strongholds,
  cathedral, capture crossings and lane structures. Seeded forest tree/boulder positions, lake
  positions, village houses and mountain forms. Reflected movable scenery polygons west/east,
  including streets and border mountains, with identical materials and sizes. Kept existing
  camera and map artwork. Lake placement omits a template when its clearance search is exhausted.
  Updated map documentation and the intentionally changed map golden hash (camp draws now
  precede obstacle draws). Preserved all earlier uncommitted presentation changes.
- Checks run: `npm run check:quick` passed; focused generation/scenery regression tests 64/64
  passed; `npm run check` passed (exit 0): formatting, no-JS, lint, typecheck, knip,
  coverage, production build and docs. Core 478/478, client 315/315. Verbatim tail:
  `Checked 100 Markdown files under docs/. Documentation check passed.` New tests cover
  different-seed variation, same-seed reproduction, exact polygon reflection across multiple
  seeds and fresh seed requests. Initial type errors and lake-placement/mountain-ID regression
  failures were fixed without weakening checks. `git diff --check` passed.
- Next step: human reviews newly generated matches and supplies the next map requirement.
  Decorative scenery still has no gameplay collision. No commit or push performed.

### 2026-10-09 — Phase 1 / demo fix — fix/disable-select-timeout — sholtzman + Claude Code

- What was done: the demo plays on the game canvas behind the `character-select` placeholder,
  which has no way to pick a class yet, so the 60 s select countdown cancelled every demo match
  back to the menu (`select-timeout`). `CharacterSelectState` takes `isTimeoutEnabled` (default
  on, the design's behaviour) and skips the countdown when it is off;
  `createDefaultSessionStates({ isSelectTimeoutEnabled })` passes it through, and `main.tsx`
  turns it off with a `TODO(sam)` to turn it back on once character select can pick a class.
  New test: with the timeout off, character select survives 10 × the countdown and confirming
  still goes to `pre-launch` (it failed with the guard removed). In the demo, character select
  now has no exit (the placeholder screen offers none); reload to return to the menu. Not
  checked in a browser. Pre-PR critic: ready for PR; its TSDoc and test nits applied.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 466 passed (466)"; client "Tests 305 passed (305)"; "✓ built in 89ms"; "Documentation
  check passed."
- Next step: review and merge the PR into the phase branch before the demo; turn the timeout
  back on when the character select screen lands.

### 2026-10-09 — Phase 1 / sprint 1 session F — feat/settings-keybindings — sholtzman + Claude Code

- What was done: keybindings as data (`keybindings.ts`, presets `wasd`/`arrows`, `rebind` with
  swap/replace, resets), `BindingResolver`, `InputMapper` → core `InputIntent` through a
  `Projection` port, `KeyboardDevice`/`MouseDevice`/`FakeInputDevice` with the `InputDevice`
  contract; the `PersistenceController` facade (settings only) over `StorageAdapter` and
  `MemoryStorageAdapter` with its contract, `SettingsDtoV1` validation and quarantine;
  `settingsSlice` body; `SettingsController` in `game/settings/` (owner sign-off DEC-27 after the
  critic rated it better than the design); `KeyGlyph`, `Prompt`, `SettingsScreen` (tabs,
  press-to-bind incl. mouse side buttons, conflict dialog, resets, audio/video/accessibility) and
  `PauseOverlay`; `main.tsx`/`App.tsx` wiring after merging D's PR #12. Owner decisions
  DEC-25…DEC-29: agents push task branches and open PRs (ADR 0013, accepted; `.claude/settings.json`
  tightened after the critic), F's input layer is canonical over PR #19 (INBOX handover), snapshot
  shape and conflict-free edits folded into 09 and 13. Fixed a memory-adapter bug (overlapping
  transactions committed stale copies; the ordering test failed before the fix). Design docs 02,
  09, 13, 14 updated with one "Implementation status" note each; sprint 1.5 boxes for keybindings
  data and keyboard/mouse devices ticked. Pre-PR gate: critic passes 1–3 (not ready → ready →
  ready), ponytail cuts 1 and 3 applied (−9 lines), cut 2 reverted for a build warning.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; lint,
  typecheck and knip clean; core "Tests 295 passed (295)" (lines 98.69%); client "Tests 345
  passed (345)" (statements 90.97%, branches 85.75%, lines 91.13%); "✓ built in 88ms";
  "Documentation check passed."
- Next step: push `feat/settings-keybindings` and open its PR into the phase branch (description
  in `docs/changelog/pr-feat-settings-keybindings.md`); PR #19 adapts to F's input layer after
  F merges; G mounts `<PauseOverlay />` in `MatchScreen`.

### 2026-10-09 — Phase 1 / sprint 1 session F — feat/settings-keybindings — sholtzman + Claude Code

- What was done: merged `origin/phase/1-simulation-kernel-and-world` again after PRs #14, #17,
  #18 and #19 landed (`a82e098`). PR #19 had added its own input layer at the same paths; per
  DEC-26 the 15 add/add conflicts take this branch's side, #19's `DeviceIntentSource` now builds
  this branch's snapshot (`Set` of button numbers, no `keyLabels`), and #19's `fakePointerEvent.ts`
  (unused after the merge; knip) is removed; #19's `Match`/`useMatch`/`DeviceIntentSource` tests
  pass unchanged. The critic's merge review found #19's "forget the pointer off the canvas"
  behaviour lost; restored in `0782f39` with a test that failed before. INBOX and the decisions log keep both sides. Correction to the entry above: the
  push ADR is **0015**, not 0013 (DEC-24 reserves 0013 for session C's core lint); renamed with
  every reference on this branch.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; lint,
  typecheck and knip clean; core "Tests 442 passed (442)" (lines 98.92%); client "Tests 398
  passed (398)" (statements 91.39%, lines 91.58%); "✓ built in 92ms"; "Documentation check
  passed."
- Next step: push and open the PR; the `Match` owner wires live bindings and the pause toggle
  (INBOX); G mounts `<PauseOverlay />`.

### 2026-10-09 — Phase 1 / sprint 1 session F — feat/settings-keybindings (merge of phase/1) — sholtzman + Claude Code

- What was done: re-synced PR #24 with the phase branch after PRs #20, #22 and #23 merged. Two
  conflicts, both docs: this log (every entry from both sides kept, the phase branch's first,
  then this branch's two session F entries) and `docs/README.md` (regenerated with
  `npm run docs:index`; ADRs 0014 and 0015 and both changelog rows listed). No code file was
  changed on both sides. Merge left uncommitted.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 466 passed (466)"; client "Tests 413 passed (413)"; "✓ built in 150ms"; "Documentation
  check passed."
- Next step: the human commits the merge and pushes; PR #24 merges.

### 2026-10-09 — Phase 1 / sprint 1 session F — feat/settings-keybindings (PR #24 review) — sholtzman + Claude Code

- What was done: addressed SamarjitBhogal's review (changes requested), approved by sholtzman in
  chat for whatever is in line with or better than the architecture. (1) Quarantine-on-read is
  the shared `repositories/readOrQuarantine.ts` (14 §8, DEC-31); its record is typed as
  `QuarantineRecordDtoV1` (§7), `DtoCheck<T>` moved to `dto/DtoCheck.types.ts`, and the warn
  callback type is `WarnReporter`. (2) `chordKey` moved to `bridge/chordKey.ts` (DEC-30, better
  than the design: 13 §1 had it in `game/input/`); `selectChordOwner` and the settings screen use
  it instead of restating `device:code`. Docs 02, 13 and 14 updated. Deferred, as the review
  suggests: shared DTO helpers until S2's second DTO. New `readOrQuarantine.test.ts` with a
  validator that knows nothing about settings.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 466 passed (466)"; client "Tests 415 passed (415)"; "✓ built in 116ms"; "Documentation
  check passed."
- Next step: independent critic on the review diff, then push; the human merges.

### 2026-10-09 — Phase 1 / sprint 1 session F — feat/settings-keybindings (review critic, merge of phase/1) — sholtzman + Claude Code

- What was done: critic pass 5 on the review round (base `4892adc`): ready to merge, no
  blockers. Its should-fix items were applied before committing: `WarnReporter` moved out of the
  controller's companion file into `repositories/readOrQuarantine.types.ts`; `readOrQuarantine`
  takes three parameters (`tx, { store, key, validate }, report`, CONTRIBUTING §4) and 14 §8's
  sketch matches; the PR description has a review-round section and DEC-27…DEC-31. Nits applied:
  DEC-31 called better than the design in INBOX, 13 §6.1 wording, the deferred DTO helpers
  tracked in 14 §14, the resolved `chordKey` nit kept and marked. Then merged
  `origin/phase/1-simulation-kernel-and-world` again for PR #25 (the select-timeout toggle in
  `main.tsx`, which auto-merged); the one conflict was this log, both sides kept, the phase
  branch's entry first. Merge left uncommitted.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "✓ built in 105ms"; "Documentation
  check passed."
- Next step: critic re-check of the follow-ups and the merge, then push; the human merges. If
  PR #26 (preselect the Warrior) merges first, `main.tsx` needs one more re-sync.

### 2026-10-09 — Phase 1 / sprint 1 session F — feat/settings-keybindings (review critic pass 6) — sholtzman + Claude Code

- What was done: critic pass 6 on the review commits and merge `97fb72a`: ready to merge, no
  blockers, every pass-5 item resolved, each commit builds on its own. Applied its should-fix
  items: the `readOrQuarantine` valid-path test asserts the exact result and that the record
  stays in its store (it failed with `return raw` substituted), and the PR description records
  critic passes 5 and 6, the ponytail note and the final check. Nits: test count noted, one
  INBOX line rewrapped.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "✓ built in 97ms"; "Documentation
  check passed."
- Next step: push and update the PR #24 description on GitHub; the human merges. If PR #26
  merges first, re-sync `main.tsx`.

### 2026-10-09 — Phase 1 / demo fix — fix/preselect-warrior — sholtzman + Claude Code

- What was done: replaced PR #25's approach, at sholtzman's request. #25 turned the
  character-select timeout off; now the timeout is back to the design's behaviour and character
  select starts with the Warrior selected (`PLACEHOLDER_PRESELECTED_CLASS_ID` in
  `game/content/placeholderSetup.ts`, `TODO(sam)`), so the 60 s countdown leads into
  `pre-launch` and the match instead of cancelling. `CharacterSelectState` takes
  `preselectedClassId` (selected on entry through the normal `select-class` path, so it is
  checked against the catalogue); `createDefaultSessionStates({ preselectedClassId })` passes it
  through. #25's isTimeoutEnabled option and its test are removed with the behaviour; the new
  test fails with the preselect removed. Not checked in a browser.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 466 passed (466)"; client "Tests 305 passed (305)"; "✓ built in 95ms"; "Documentation
  check passed."
- Next step: review and merge before the demo; remove the preselect when the character select
  screen lands.

### 2026-10-09 — Phase 1 / Sprint 1 audit — chore/sprint-1-audit — sholtzman + Claude Code

- What was done: started the Sprint 1 audit backlog (`docs/reviews/2026-10-09-sprint-1-audit.md`),
  the house for the fixes the owner chose to make after the 2026-10-10 presentation.
  - PR #22 and #23 merged before their reviews finished. Independent critics then reviewed each
    merge against the docs at its first parent. #22: 3 blockers, 8 majors. #23: 1 process
    blocker, 3 majors. Both verdicts were request changes.
  - PR #24's findings come from its own six critic passes.
  - The backlog also lists the stand-ins whose trigger has fired, and the owner decisions the
    reviews surfaced (A22-3, A23-1, A23-17…A23-20).
  - Nothing outside `docs/` is changed on this branch yet.
- Checks run: `npm run check` (see the commit); the two post-merge critics each ran it in a fresh
  clone with `EXIT=0`.
- Next step: the owner rules on A22-3 and A23-1 (both block phase 1 → `main`), then the backlog is
  fixed on this branch after the presentation.

### 2026-10-09 — Phase 1 / Sprint 1 audit — chore/sprint-1-audit — sholtzman + Claude Code

- What was done: the full Sprint 1 audit.
  - Recorded the owner's rulings DEC-32 (PR #22 scenery) and DEC-33 (PROTO-01 is demo-only).
  - Merged the phase tip (`26ae27e`) into this branch.
  - Six independent critics audited the merged code by area: kernel, entities and content, map,
    client engine, client shell, and docs and process. Each finding was spot-checked against the
    code before it went into `docs/reviews/2026-10-09-sprint-1-audit.md`.
  - The backlog holds 2 blockers, 22 majors, 82 minors and 46 nits, plus the owner decisions.
  - Overlapping findings are merged (AC-1 into AS-1; `Math.hypot`, injected content and the id
    counter into AK-3, AK-5 and AK-6).
  - AD-26 corrects an earlier line of the audit by appending, not editing.
- Checks run: baseline `npm run check` at `26ae27e` → `EXIT=0`: "All matched files use Prettier
  code style!"; core "Tests 466 passed (466)"; client "Tests 305 passed (305)"; "✓ built in
  270ms"; "Documentation check passed." This branch changes only `docs/` and `INBOX.md`.
- Next step: the owner answers the "Proposed design changes" items. The fixes then land on this
  branch, starting with the summary's "fix first" list. Merge PR #24, then fold its follow-ups
  (A24-*, AC-19) in.

### 2026-10-09 — Phase 1 / sprint 1 session F — feat/settings-keybindings (merge of phase/1 after #26) — sholtzman + Claude Code

- What was done: merged the phase branch into PR #24 after PR #26 merged, on top of session F's
  eight unpushed commits (the review-round fixes, DEC-30/DEC-31, critic passes 5 and 6). The one
  conflict was this log; every entry from both sides was kept, 46 in all.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "✓ built in 97ms"; "Documentation
  check passed."
- Next step: the human pushes; Samarjit re-reviews (his changes were requested before the
  review-round commits); PR #24 merges.

### 2026-10-10 — Sprint 2 planning / new requirements — docs/sprint-2-requirements-and-planning — sholtzman + Claude Code

- What was done:
  - Committed the owner's INBOX answers and the instructor's two new Sprint 3 requirements
    verbatim (`8d0d308`): Duel multiplayer (DEC-36) and server scalability (DEC-37).
  - Three research agents wrote the netcode report, the server-scalability and matchmaking report
    and an impact map (`5194e58`).
  - Planners recorded DEC-11/12/13/15 and DEC-34…DEC-37 in the decisions log, moved answered
    INBOX parts to Done, updated the reference docs, and wrote a Legend team brief (`045ecc3`).
  - They also wrote proposed ADR 0016 (server-authoritative Duel) and ADR 0017 (balanced
    asymmetric camps), `docs/plan/multiplayer-and-scalability-plan.md` (a proposed Sprint 2–4
    re-cut and 52 owner questions) and FR-113…FR-118 and NFR-034 (`3923124`).
  - The research index and works cited were updated (`d121df1`).
  - Two independent critics reviewed the branch. Architecture: request changes, no blockers.
    Fidelity: needs fixes. Two fixers applied every finding.
  - The owner's chat clarifications are recorded under DEC-11: the new abilities and the
    Sunder–Sanctuary combo are MVP, they are on top of each class's original kit, and a loadout
    picks 3 abilities and 1 ultimate from the class pool.
  - No existing architecture doc, ADR or AGENTS file was edited; both new ADRs are proposed.
- Checks run: `npm run check` (see the commit); `npm run docs:check` → "Documentation check
  passed."; Prettier clean.
- Next step: the owner pushes the branch, and the PR goes into the phase branch for the team.
  The owner then answers the INBOX items and plan §9, and accepts or changes ADR 0016/0017
  and the re-cut.

### 2026-10-13 — Phase 1 / sprint 1.5 — feat/buildings-and-map-objects — Gurshaan + Codex — verification blocked

- What was done: added a temporary controlled-player sprite preview using both user-supplied
  knight sheets, copied unchanged after the user confirmed ownership/project-use permission.
  ResourceController and an injectable ImageLoader load and cache manifest images; source and
  permission are recorded with the assets. LegendView requests sheet crops through Renderer;
  Canvas2dRenderer anchors, crops and horizontally mirrors images, retaining the marker until
  loading succeeds. SpritePreviewController uses mapped actions and tick time: WASD selects
  idle/walk, 1–4 preview rows, Z switches sheets, E restores automatic playback. Unsupported
  rows clamp to the smaller sheet's final row. No combat effects, simulation or camera changes.
  Added an on-screen control legend and updated engine/resource implementation-status notes.
- Checks run: client coverage suite 329/329 passed; production build, typecheck, knip and
  docs:check passed. Browser inspection verified transparent idle, attack-row playback and
  switching to the opaque gray-background sheet. New tests cover frame timing, facing, row
  selection, smaller-sheet bounds, image loading/cache retry, input edges, renderer crop/flip,
  and fallback markers. A floating-point expectation and the existing gadget-slot trigger
  contract were corrected in tests; no assertions or guardrails were weakened.
  `npm run check:quick` failed only in the existing nested GameTest2 project: verbatim tail
  `✖ 95 problems (95 errors, 0 warnings)`.
  `npm run check` failed at formatting, exclusively in GameTest2: verbatim tail
  `[warn] Code style issues found in 54 files. Run Prettier with --write to fix.`
  The unrelated nested Git project and repository guardrails were left untouched. Full task
  verification is blocked, so the task is not declared done. `git diff --check` passed.
- Next step: human resolves how the nested GameTest2 project belongs in the repository checks;
  then rerun the full gate. Temporary grid-row metadata can later be replaced with authored
  frame anchors and directional sequences. Changes are uncommitted; local preview runs on 5173.

### 2026-10-13 — Phase 1 / maintenance — feat/buildings-and-map-objects — Gurshaan + Codex — pull

- What was done: ran the requested `git pull --no-rebase --no-commit --no-autostash` against
  the current branch's configured origin upstream. Fetch updated remote-tracking references;
  pull reported `Already up to date.` No integration, merge commit or conflict resolution was
  needed. Preserved all local sprite changes, untracked assets and the nested GameTest2 project.
- Checks run: pull exit 0; `git ls-files --unmerged` returned no entries; `git diff --check`
  passed. Branch is one commit ahead and zero behind its upstream. `npm run check` failed at
  formatting on the same pre-existing GameTest2 files. Verbatim tail:
  `[warn] Code style issues found in 54 files. Run Prettier with --write to fix.`
  Repository validation remains blocked; no unrelated files or guardrails were changed.
- Next step: human reviews local sprite work; resolve the separate GameTest2 quality-gate
  blocker before repository verification can pass. No commit or push performed.

### 2026-10-13 — Phase 1 / sprint 1.5 — feat/buildings-and-map-objects — Gurshaan + Codex — sprite timing/crops

- What was done: replaced uniform four-tick playback with per-row timing, retaining a faster
  walk while ability frames last 10–12 ticks. Replaced equal-height row division with explicit
  pixel boundaries for both sheets and integer inset crop margins. Preserved crop aspect ratio
  when drawing the controlled Legend. Updated engine implementation-status notes. Browser
  inspection exposed next-row wings under the initial uniform crop; the authored row boundaries
  removed that observed fragment from the attack preview.
- Checks run: targeted SpritePreviewController and LegendView tests 12/12 passed, including
  exact frame-duration boundaries, loop completion, next-row exclusion and source aspect ratio.
  Typecheck passed. `npm run check:quick` remains blocked by the existing GameTest2 lint errors
  (95 errors). `npm run check` failed at formatting only in GameTest2; verbatim tail:
  `[warn] Code style issues found in 54 files. Run Prettier with --write to fix.`
  `git diff --check` passed. Full repository verification remains blocked; no guardrails or
  unrelated GameTest2 files were altered. Changes remain uncommitted.
- Next step: human tests all preview rows and resolves the existing GameTest2 gate blocker;
  exact per-frame anchors and additional in-between art remain future sprite authoring work.

### 2026-10-16 — Phase 1 / sprint 1.5 — feat/buildings-and-map-objects — Gurshaan + Codex — paladin replacement

- What was done: removed both former knight atlases and SpritePreviewController, its metadata
  and its obsolete preview tests. Added the supplied Angelic Paladin atlas with an imagegen
  backdrop-cleanup derivative stored in client assets. Replaced grid-row playback with a new
  PaladinAnimationController, individual atlas crops, source-pixel foot pivots, timed idle/run
  loops and one-shot slash, thrust, ranged and ascension sequences. Attacks return to locomotion.
  Preview bindings are WASD, 1 slash, 2 thrust, 3 aimed ranged, 4 ascend, E automatic/reset;
  sheet switching is removed. The ranged cast releases one visual bolt after windup, traveling
  96 world units analytically with a locked direction, gold trail and terminal impact. Added
  an ascension aura, pixel-crisp sprite sampling, optional rotation/opacity/glow in Renderer,
  and gold control-label styling. Existing ResourceController loading and generic rendering
  infrastructure support the replacement; no old asset or controller references remain in src.
  Updated engine/resource implementation-status notes. No simulation damage or collision added.
- Checks run: targeted controller/effect/render/resource/input tests 41/41 passed; full client
  coverage suite 333/333 passed. Typecheck, production build, knip and docs:check passed.
  Browser inspection verified a transparent paladin, aimed traveling bolt and ascension aura;
  decoded alpha samples confirmed empty atlas space is transparent. Production bundles only
  the replacement paladin atlas. `git diff --check` passed. Initial non-null assertions and an
  unused type export were fixed without relaxing guardrails.
  `npm run check:quick` fails only in the existing nested GameTest2 project, verbatim tail:
  `✖ 95 problems (95 errors, 0 warnings)`.
  `npm run check` fails at formatting only in GameTest2, verbatim tail:
  `[warn] Code style issues found in 54 files. Run Prettier with --write to fix.`
  Full repository verification remains blocked, so the task is not declared fully done.
- Next step: human tests the new preview and resolves the existing nested-project check
  blocker before the full gate can pass. Gameplay abilities/projectile collision remain future
  simulation work. Changes are uncommitted; historical progress entries remain intact.

### 2026-10-20 — Phase 1 / sprint 1.5 — feat/buildings-and-map-objects — Gurshaan + Codex — PR #30 revisions

- What was done: removed the entire temporary sprite implementation, atlases, resource loaders,
  renderer extensions, animation tests and controls, restoring those files to the branch's
  pre-sprite implementation. Historical progress entries remain append-only. Pulled the current
  upstream (Already up to date), then merged origin/phase/1-simulation-kernel-and-world with
  explicit owner authorization, without committing. Resolved conflicts in this log and reference
  05 by preserving both histories, then reapplied the review fixes from the retained backup
  stash named codex-pr30-review-fixes-before-phase-merge. No unmerged index entries remain.
- Review fixes: B1 and S3 fit oval palace decoration inside generated rings using layout.wallRing
  in absolute world units. Removed fixed-angle decorative towers; generated turrets remain the
  towers. Passages use generated team/gate positions. Scenery near generated ring footprints
  draws beneath features. B3/S1 renamed the presentation class to MapPresentationBuilder and
  separated MapPresentation/MapBuilding from the unchanged MapDefinition contract; removed dead
  fields and shared anchors, floor radii and door geometry in content. B4 preserves minimap
  glyphs regardless of roof state. B5 repaired UTF-8 punctuation. B7 removes the unused separate
  cathedral interior API and its obsolete tests/settings. S2 fixes the toolbar after a second
  click closes the last roof, with a pointer-event regression test. S4 moves new-builder colours
  to MAP_PALETTE. S5 sets building membership and visibility during construction, retaining
  shadows and permanent walls. S6 moves builder assertions beside their implementations and
  removes copied scenery tests. S7 makes the mutable roof set private. Applied the small naming,
  redundant getter, import order, small ellipse and function-size nits without redesigning
  cameras or gameplay. B2 restores the earlier interior paragraph and preserves the old table,
  with dated approved-design amendments, DEC-36 integration intent and INBOX tracking.
- Checks on the resolved merge: full coverage passes, core 478/478 and client 429/429; typecheck,
  production build, knip and docs validation pass. Verbatim documentation result:
  Checked 109 Markdown files under docs/.
  Documentation check passed.
  Browser inspection before phase integration verified marker-based characters, the exposed
  generated stronghold ring and same-world cathedral cutaway. After integration, all suites
  and the build were rerun. An overlap-check performance regression was fixed with conservative
  polygon bounds instead of raising timeouts; no assertions, coverage or guardrails weakened.
  npm run check:quick fails only on the existing unrelated GameTest2 project:
  ✖ 95 problems (95 errors, 0 warnings)
  npm run check fails at formatting only in that project:
  [warn] Code style issues found in 54 files. Run Prettier with --write to fix.
  Both staged and unstaged git diff --check checks pass. GameTest2 was not changed.
- Next: resolve the unrelated nested-project check failures, then hand the resolved branch to
  Claude Code for B6/ADR 0010's architecture critic, Ponytail review/cuts and final full check.
  The PR description still needs that actual gate evidence and the renamed/removed core API
  notice; use a conforming squash title such as feat(core): add same-world building cutaways.
  The phase merge and fixes are deliberately uncommitted and unpushed, with the backup stash
  retained. Full repository verification and the release gate remain incomplete.

### 2026-10-20 — Phase 1 / verification — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: verified the user's removal of the nested GameTest2 directory. Its tracked
  gitlink deletion remains unstaged; no other Git changes, commit or push were made in this
  follow-up. The previously resolved phase merge is still pending its merge commit.
- Checks: npm run check passed in full, exit 0: format, no-JS, lint, typecheck, knip, coverage,
  production build and documentation validation. Core 478/478 and client 429/429 tests pass.
  Verbatim final output:
  Checked 109 Markdown files under docs/.
  Documentation check passed.
  The first sandboxed attempt passed static checks but failed because Vitest workers could not
  access sandbox temporary module files (ENOENT). The complete check was rerun outside that
  sandbox and passed without code or guardrail changes.
- Next: include the tracked GameTest2 deletion when preparing the merge commit. The team's
  ADR 0010 review gate and PR description evidence remain pending; no release-gate approval
  is implied by the passing automated checks.

### 2026-10-10 — Phase 1 / S2 — feat/legend-aether — Claudio + Claude Code

- What was done: added the `Aether` component (MP pool: `max`/`current`, `canAfford`, `spend`,
  `restore`, `fraction`, `isEmpty`) in `packages/core/src/components/Aether.ts` with its test.
  `Legend.installComponents` now installs `Aether(definition.baseAether)` on every Legend (mobs and
  structures get none); `LegendDefinition` gains `baseAether`, with TUNE placeholders in the Warrior
  (200), Sentinel (250) and Magus (500) content. `StateHasher` hashes aether, appended only when
  present so non-legend entities hash unchanged. `Magus.test` asserts the pool; the `Match` test
  fixture's warrior definition gains `baseAether`. Sub-classes were left out: they are post-MVP
  (D11, `01-classes-and-subclasses.md`). Aether regen is a Phase 4 system, not added. Aether tuning
  values raised for the owner in `INBOX.md`. Not checked in a browser.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 472 passed (472)"; client "Tests 416 passed (416)"; "✓ built in 105ms"; "Documentation
  check passed."
- Next step: pre-PR gate (critic + ponytail-review), then open the PR (rebased onto
  `phase/2-sprint-2-work`); owner confirms the aether pool sizes; abilities and regen
  that spend aether land in Phase 4.

### 2026-10-14 — Phase 2 sprint 2 / minion system design — docs/minion-system-design — SamarjitBhogal + Claude Code

- What was done:
  - Analysed driving minions with an external model over a WebSocket. Decision: the minion system
    stays scripted and deterministic in core. A model becomes, at most, a later writer of the goal
    seam and would need an ADR.
  - Ran an interactive design session and wrote `docs/architecture/18-minion-system.md`. It is the
    owning doc for spawning, hordes, minion and guard behaviour, the goal seam for hordes and bot
    Legends, and horde redirection. The work is split into phases M1 to M5 with named blockers:
    the damage pipeline (sprint 2.2) and structures (sprint 2.1), both built by other developers.
  - Doc 04 §7 and doc 11 §4.3–4.4 now point to doc 18. The architecture index and the docs
    index were updated.
- Checks run: `npm run docs:check` → "Documentation check passed."; `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: the owner answers doc 18 §13 (worst lane, unit cap, gate holding, M5 order, M4
  triggers). The Phase 3 plan's sprints 3.1–3.4 and 3.7 are then re-cut to M1–M5, and M1 starts.

### 2026-10-15 — Phase 2 sprint 2 / minion system design, round 2 — docs/minion-system-design — SamarjitBhogal + Claude Code

- What was done:
  - A second interactive session settled doc 18's open points. Confirmed: partial spawns at the
    unit cap (MS-10), holding at gates that are not breakable yet (MS-12) and strength scaling
    in M5 (MS-16).
  - Added MS-18…MS-22:
    - `TUNE` placeholder stats for medium and heavy mobs.
    - Separation within a team only, so enemy hordes pass through each other in M1.
    - Bots spread across lanes at setup.
    - `Survive` outranks goals, and a goal clears itself when it can no longer apply.
    - No gameplay redirection of hordes in the MVP.
  - The worst-lane rule (MS-9) stays open for the owner. By the human's choice, the Phase 3
    plan is not re-cut.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: the owner answers MS-9; run the pre-PR gate (architecture-reviewer critic) on the
  doc changes before opening a PR.

### 2026-10-15 — Phase 2 sprint 2 / minion doc entity legend — docs/minion-system-design — SamarjitBhogal + Claude Code

- What was done: added an entity legend to the top of `docs/architecture/18-minion-system.md`.
  It lists the entity types the system implements (light, medium and heavy lane minions, tower
  guards, bot laners, the enemy Rover, and the Horde composite). It also lists what is out of
  scope; bosses, camps, turrets and the human Legend are explicitly excluded.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: unchanged; the owner answers MS-9, then the pre-PR critic runs.

### 2026-10-15 — Phase 2 sprint 2 / minion doc MS-9 settled — docs/minion-system-design — SamarjitBhogal + Claude Code

- What was done: the human settled MS-9. The worst lane for the Stronghold's scheduled heavy
  horde (DISC-10) is a weighted mix of towers lost and enemy pressure.
  - Doc 18 §3.3 now defines both terms (0 to 1), `TUNE` weights in content, ties to the lowest
    lane index, and a fallback lane when every lane scores 0.
  - In M1 only pressure counts; M2 adds the towers term.
  - §13 now has no open questions. The boss reward wave's `LaneAssessment` stays out of scope.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: run the pre-PR gate (architecture-reviewer critic) on the doc changes before a PR.

### 2026-10-15 — Phase 2 sprint 2 / minion plan critic rework — docs/minion-system-design — SamarjitBhogal + Claude Code

- What was done:
  - The pre-PR critic (architecture-reviewer, base `d125cad`) returned BLOCKERS. By the human's
    choice, the whole doc moved from `docs/architecture/18-minion-system.md` to
    `docs/plan/minion-system-plan.md`. The architecture index changes were reverted, and the
    phase table and interim stand-ins now sit in a plan doc.
  - Blocker fixes:
    - The goal types moved to `state/`, removing the state→ai import and the cycle.
    - DISC-21 is read correctly: a lost SpawnerTower shrinks the Stronghold's guards.
    - Each M5 item keeps its own MVP status.
    - MS-19 is limited to steering; collision still separates enemies (the human's choice).
  - Other fixes: `structure-destroyed`, `spawn-suppressed`, `GameConfig.limits.maxUnitsPerTeam`,
    `MapDefinition.lanes[i].path` (reversed for Dark), and the doc 03 event flow (`SpawnSystem`
    emits `horde-spawned`; `HordeSystem` handles `entity-removed` and `team-changed`). Also the
    mob `hordeId` back-pointer, `GuardPlan.leashRadius`, the 12 §2 opening hordes, and
    `content/ai/` instead of a new folder.
  - Docs 04, 07, 11, 15 and 17 now point to the plan. Doc 04's movement catalogue names
    `LaneFollowMovementStrategy`, and doc 07's horde sizes name `GameConfig.match.hordeSizes`.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: the critic re-checks; commit and push if it reports no blockers.

### 2026-10-15 — Phase 2 sprint 2 / minion docs split — docs/minion-system-design — SamarjitBhogal + Claude Code

- What was done:
  - The critic re-check left one blocker (N1): the target design sat in `docs/plan/`. By the
    human's choice, the doc is split. The design (decisions, spawning, hordes, movement, minion
    and guard behaviour, the goal seam, redirection, tests) is now
    `docs/architecture/18-minion-system.md`, with its `paths:`.
  - The build phases M1–M5 and the interim stand-ins stay in `docs/plan/minion-system-plan.md`,
    which links to doc 18.
  - Docs 04, 07, 11, 15 and 17 point to doc 18, and doc 18 is back in the architecture index.
  - Also fixed:
    - N2: `horde-spawned` is emitted after the deferred `spawn-requested` is fulfilled (07 §6).
    - N3: the check result is filled in.
    - N4: doc 11's description wording.
    - N5: goals use `MapLane.index`; the horde record keeps `MapLane.id`.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: the critic re-checks; commit and push if it reports no blockers.

### 2026-10-15 — Minion system M1 (marching) — feat/minion-m1-marching (stacked on docs/minion-system-design, uncommitted) — SamarjitBhogal + Claude Code

- What was done (minion plan M1; the human's choices: brains deferred to M2, spawn at the map's
  tower and Stronghold positions, client wired):
  - **Prototype escort deleted (DEC-35):** `FollowLeaderController`, `AiSystem`,
    `Controller.types`, the `Brain` component, the follow-leader profile, the `EntityStore`
    PROTO helpers, and `Match.spawnEscort` with `PROTOTYPE_ESCORT` in the client.
  - **Content:** `light-minion` is now the real light lane minion (balancing.md anchors, no
    controller). New `medium-minion` and `heavy-minion` (`TUNE` placeholders, MS-18), with
    `MediumMob` and `HeavyMob` classes and registry lines. Also `content/ai/` (horde steering,
    worst-lane weights) and `content/structures/spawnWaves.ts` (DISC-10).
  - **State:** `HordeStore`, `LaneRoutes` and the map on `GameState`; hordes are in the state
    hash, appended only once a horde has existed.
  - **Systems:** `HordeSystem` (records, membership, leader promotion, dissolve, waypoint
    progress), `SpatialHash` (`physics/`), `LaneFollowMovementStrategy` with `PathingSystem`,
    `SpawnSystem` (opening hordes, tower and Stronghold waves, unit cap with the new
    `spawn-suppressed` event), and `worstLane` (enemy pressure; the towers-lost term is 0 until
    M2).
  - **Config:** `GameConfig.match.fallbackWorstLane`, with validation.
  - **API:** `SimulationOptions.map` (an API change); the client passes the map.
  - **Design fix found by the scenario test:** a leader that reacted to separation was pushed
    off its lane by its own followers and the horde never stopped. The leader now ignores
    neighbours (doc 18 §5.1).
  - **Docs:** doc 18 implementation status; plan M1/M2 rows (brains moved to M2) and
    stand-ins; doc 03 gains the `spawn-suppressed` event.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 485 passed (485)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: review, commit on the human's request, then the pre-PR gate; M2 waits on sprints
  2.1 and 2.2.

### 2026-10-16 — Phase 2 / Sprint 1 audit — chore/sprint-1-audit (merge of phase/2 for PR #28) — sholtzman + Claude Code

- What was done: merged `phase/2-sprint-2-work` (`d125cad`, PR #27 on top of #24 and #26) into
  this branch so PR #28 can merge into phase 2. Four doc conflicts, every entry from both sides
  kept:
  - This log: the two audit entries, then phase 2's two entries, by date.
  - The decisions log: the DEC-32/DEC-33 batch goes between phase 2's 2026-10-10 batch and its
    PR #24 batch, newest first.
  - `docs/README.md`: regenerated with `npm run docs:index`.
  - `INBOX.md`: phase 2 had already replaced PROTO-01 with a "still open" item that cites DEC-33
    and DEC-35. That item is kept, and this branch's DEC-33 note on the old item is dropped
    (DEC-33 itself is in the decisions log). The note's audit ids A23-17 and A23-18 move into the
    new item's questions (3) and (2).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "✓ built in 117ms"; "Documentation
  check passed."
- Next step: retarget PR #28 to `phase/2-sprint-2-work` and merge it.

### 2026-10-16 — Phase 2 / layered architecture diagram — docs/phase-2-architecture-diagram — sholtzman + Claude Code

- What was done: added `docs/plan/phase-2-architecture.md` with a Figure-4.6-style layered model of
  the whole architecture at Phase 2 exit (cumulative P0–P2 plus Track B S1–S2). The figure is
  `phase-2-architecture.drawio` (editable source) exported to `phase-2-architecture.svg`; the doc
  also carries a Mermaid view of the same bands with the allowed-import arrows, a "Not shown" list,
  drawing choices for every doc conflict, and an implementation-status note. Docs were read as on
  `origin/phase/2-sprint-2-work`. A research agent built the cited inventory, a drafter drew it,
  and an independent critic (`architecture-reviewer`, its own checklist from the docs) reviewed
  three rounds: 0/8/14, 0/1/7, then approve (blockers/should-fix/nits). One optional nit is left:
  the "Sentinel sprint-through rule" could read "sprint-through rule (definition flag)"
  (phase-2:127-129). Added a Related link in the Phase 2 doc and regenerated the docs index.
- Pre-PR gate: critic approved (above); `/ponytail-review` gave 3 findings, 2 applied (the copied
  02 §2 may-import lists and one provenance line, -26 lines), 1 kept (a single `.drawio.svg`
  instead of `.drawio` + `.svg`: the plain `.drawio` stays diffable and opens directly).
- Checks run: `npm run check` (after ponytail) → `EXIT=0`: "All matched files use Prettier code
  style!"; core "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "✓ built in 99ms";
  "Documentation check passed."
- Next step: the owner names a reviewer on the PR into `phase/2-sprint-2-work` and reviews the
  figure.

### 2026-10-16 — Phase 2 / sprint 2.2 — feat/combat-damage-pipeline — Claudio + Claude Code

- What was done: added `combat/DamagePipeline`, the one way damage reaches `Health` (05 §9).
  Anything with `Health` is hit the same way (Legends, mobs, bosses, structures, destructible
  obstacles); a target without `Health` is never damaged. Shields drain before health, every
  landed hit emits `damage-applied` with its `DamageSource`, and the lethal hit alone emits
  `entity-died` with the killer. A missing, health-less or already-dead target returns a reason
  instead of throwing. `DamageResult` lives in `combat/DamageSource.types.ts`; `DamageSource`
  stays in `state/GameEvents.types.ts` (now exported) because `state/` may not import `combat/`
  (02). No modifier steps yet (statuses, structure multipliers, damage types, breakability).
- Checks run: `npm run check` → `EXIT=0`: core "Tests 469 passed (469)"; client "Tests 416
  passed (416)"; "✓ built in 98ms"; "Documentation check passed."
- Second commit (same branch): `DamageStep` list run before `Health`
  (`combat/defaultDamageSteps.ts`, first step `FriendlyFireStep`, pending the owner's sign-off in
  `INBOX.md`); `Combat` component (installed when a unit definition has an `attack`; Warrior,
  Sentinel and Magus get TUNE melee placeholders, interval authored in seconds and loaded as
  ticks); `AttackStrategy` + `MeleeAttackStrategy` + `defaultStrategyRegistry.ts` in
  `entities/strategies/` with a `DamageDealer` port; `CombatSystem` between movement and death;
  `AttackTargetHandler` through new `EntityStore.isAlive`/`setAttackTarget` facades; reject reasons
  `cannot-attack`/`invalid-target`; `StateHasher` hashes `Combat` once it has changed. Docs 02, 03,
  04, 05, 17 (new recipe R13a) and the Phase 2 plan updated. Pre-PR gate: critic request-changes
  (2 blockers: handler imported components; strategies in `combat/`) → fixed, plus its
  should-fixes (split tests, pipeline-order and hash tests, docs, INBOX); ponytail-review: 2 line
  cuts applied (redundant self-target check, unused `null` in `setAttackTarget`), no structural
  change. Final `npm run check` → `EXIT=0`: core "Tests 487 passed (487)"; client "Tests 416
  passed (416)"; "✓ built in 91ms"; "Documentation check passed."
- Next step: killer causes in `DeathSystem` and the unexplained-death invariant, status effects,
  ranged attacks (SCRUM-169), damage types with the first resistance.

### 2026-10-16 — Phase 2 / sprint 2.2 — feat/combat-damage-pipeline (killer tracking) — Claudio + Claude Code

- What was done: `GameState` records this tick's killers from `entity-died` (`killerOf`, cleared by
  `advanceTick`, like the announced removals). `DeathSystem` puts the killer on each `died`
  `entity-removed` (new optional `killer` field, 03 §2). New `NoDeathWithoutKillerInvariant`
  (`no-death-without-killer`, error, tick; 15 §3) flags a `died` removal with no killer this tick,
  i.e. a lethal hit that skipped `DamagePipeline`; registered in `DefaultInvariantRunner`. The
  pipeline-order test now kills through the pipeline (the invariant caught the old direct
  `applyDamage`). Kept the cause `died` plus the killer per 03 §2 instead of the plan's new
  `RemovalCause` members. Docs 03, 05, 15 and the Phase 2 plan updated.
- Checks run: `npm run check` → `EXIT=0`: core "Tests 492 passed (492)"; client "Tests 416 passed
  (416)"; "✓ built in 89ms"; "Documentation check passed."
- Next step: pre-PR gate on this commit (critic + ponytail), then push to PR #34; status effects,
  ranged attacks (SCRUM-169), damage types.

### 2026-10-16 — Phase 2 / sprint 2.2 — feat/combat-damage-pipeline (review fixes) — Claudio + Claude Code

- What was done: rebased on `phase/2-sprint-2-work` (PR #28 merged; only PROGRESS conflicted,
  both sides kept). Fixed two findings from the owner's review of #35 whose precedent is here:
  `Combat` no longer imports `EntityId` from `state/` (plain `string`, 02 §2: `components/` may not
  import `state/`); `DefaultSystemPipeline` builds the one `DamagePipeline` and injects it into
  `CombatSystem` (no default `new` inside the system). Doc 05 §9 status updated.
- Checks run: `npm run check` → `EXIT=0`: core "Tests 492 passed (492)"; client "Tests 416 passed
  (416)"; "✓ built in 93ms"; "Documentation check passed."
- Next step: same fixes carried into #35 with the rest of the owner's review.

### 2026-10-16 — Phase 2 / sprint 2.2 — feat/status-effects — Claudio + Claude Code

- What was done (SCRUM-228, branch from `feat/combat-damage-pipeline`, PR #34): status effects
  (05 §8). Content: `content/status-effects/` with the MVP set `bleed`, `concussion`, `stun`,
  `blind`, `enraged`, `crushed` (numbers from more-abilities §7 and balancing.md, times in
  seconds) and `STATUS_EFFECTS`; `loadStatusEffects(tickRate)` converts them to ticks once. `components/StatusEffects` (every unit gets one; no component =
  immune) keeps pooled `StatusEffectRuntime` instances and caches one multiplier per stat and the
  flags; `StatusEffectRuntime.reapply` is the one stacking switch (`refresh`, `intensity`).
  `combat/StatusEffectApplier` lands a status by id and emits `status-applied`; `StatusTickEffect`
  strategies (`PeriodicDamageEffect`, `MaxHealthDamageEffect`, `defaultStatusTickEffects.ts`) run
  periodic ticks through `DamagePipeline` (`kind: 'status'`, credited to the applier);
  `StatusModifierStep` (after friendly fire) makes blinded weapon hits miss and applies
  `damageDealt`/`damageTaken`. `StatusEffectSystem` (before movement) ticks and expires
  (`status-expired`). `MovementSystem` and `CombatSystem` read `moveSpeed`/`cannot-move` and
  `attackSpeed`/`cannot-attack` (`Movement.advance(speedScale)`, `Combat.beginAttack(tick,
attackSpeed)`). `StateHasher` hashes active statuses. Docs 02, 05, 17 (R9) and the Phase 2 plan
  updated; numbers and rules to confirm in `INBOX.md`.
- Checks run: `npm run check` → `EXIT=0`: core "Tests 514 passed (514)"; client "Tests 416 passed
  (416)"; "✓ built in 94ms"; "Documentation check passed."
- Pre-PR gate: critic request-changes (blocker: Prettier on this file; bug: reapplying reset the
  periodic rhythm, so a bleed reapplied every 0.7 s never ticked; times converted at load instead
  of per instance; per-entity closures in the system; attack-speed and `status-applied` tests) →
  all fixed (`periodAnchorTick`, `loadStatusEffects`, applier by id), plus tests. `npm run check` →
  `EXIT=0`: core "Tests 519 passed (519)"; client "Tests 416 passed (416)"; "✓ built in 97ms";
  "Documentation check passed."
- Ponytail-review: 3 cuts applied (dropped the unread `appliedTick`, definition as a constructor
  parameter instead of a nullable getter, a tautological test line). Critic re-check: approve, no
  blockers. Final `npm run check` → `EXIT=0`: core "Tests 519 passed (519)"; client "Tests 416
  passed (416)"; "✓ built in 101ms"; "Documentation check passed."
- Next step: PR to `phase/2-sprint-2-work` (after #34); the owner answers the INBOX item.

### 2026-10-16 — Phase 2 / sprint 2.2 — feat/status-effects (owner review) — Claudio + Claude Code

- What was done: rebased on #34 (itself rebased on phase 2). Applied the owner's review of #35:
  modifiers multiply (`op: 'mul'`, value once per stack; the 0 clamp and the `attackSpeed === 0`
  guard are gone); ids in `components/` are plain strings; one `DamagePipeline` shared with
  `StatusEffectSystem`; blind resolved in `CombatSystem` (new `attack-missed` event, 03);
  `periodAnchorTick` hashed; authored (`AuthoredStatusEffect`, seconds) and loaded
  (`StatusEffectDefinition`, ticks) types split, `loadStatusEffects(tickRate, structuresPerLane)`
  resolves `enraged`'s cap from config and validates at load; `utils/TickRate` is the one
  seconds-to-ticks formula (also used by `loadDefaultContent`); `periodic.effects` shaped like
  `AbilityEffectSpec` (`damage` with `amount` or `fractionOfMax`, one `DamageStatusTick`, marked
  `ponytail:` as interim); `StatusEffects.remove` + `StatusEffectApplier.remove`;
  `StatusStacksWithinMaxInvariant` registered; sibling tests for the runtime (table-driven),
  applier, step, tick, registry, invariant and `TickRate`. Docs: 02 and 17 reverted to the
  design except the forced `StatusEffectRuntime` move; interim state in the 05 §8 status note; 03
  `attack-missed` row; plan (FR-029 deferred); INBOX rewritten.
- Checks run: `npm run check` → `EXIT=0`: core "Tests 534 passed (534)"; client "Tests 416 passed
  (416)"; "✓ built in 97ms"; "Documentation check passed."
- Critic: request-changes (item 18 wiring deferred, item 11 unrecorded, loader no longer caught
  0 or negative seconds) → fixed: `DefaultSystemPipeline(invariants, state, decide)` (the same
  signature as #31) loads the statuses for the match's config and builds the one
  `StatusEffectApplier`, which now also expires (`StatusEffectSystem` calls it), so every status
  event comes from one class; the loader validates authored seconds, whole `maxStacks` and
  positive tick amounts; merge order #34 → #35 → #31 goes in the PR reply. `npm run check` →
  `EXIT=0`: core "Tests 534 passed (534)"; client "Tests 416 passed (416)"; "✓ built in 94ms";
  "Documentation check passed."
- Ponytail-review: no cuts (`op: 'mul'` keeps the design's shape). Critic re-check: approve, no
  blockers. Next step: push, reply to the owner on #35 (merge order #34 → #35 → #31).

### 2026-10-16 — S2 / SCRUM-426 — feat/legend-aether (progression) — Claudio + Claude Code

- What was done: `Progression` component (XP total, level along a content curve, cap) installed on
  every Legend; `content/progression/` with `LEVEL_CURVES` (`legend`: 100 + 50·(L−1), cap 10),
  `XP_SOURCES` (Legend kill 150 + 25 × victim level; mob kill 20 / 45 / 120 by kind) and per-class
  `levelScaling` (+8% base health, +10 aether per level), all `TUNE` from `balancing.md`;
  `KnownLevelCurveRule`; `ProgressionSystem` (subscribes to `entity-died` through the state it
  gets from `DefaultSystemPipeline`, awards in its own pass, raises `Health`/`Aether` max, emits
  `level-up`); `Health.baseMax` + `raiseMax`, `Aether.raiseMax`; `StateHasher` hashes progression
  once XP is earned. Aether pools now follow `balancing.md` (100 / 80 / 140) instead of invented
  placeholders; INBOX item updated. Kills only feed it once `DamagePipeline` (PR #34) emits
  `entity-died`. Docs 04, 05 and the Phase 4 plan updated.
- Checks run: `npm run check` → `EXIT=0`: core "Tests 488 passed (488)"; client "Tests 416 passed
  (416)"; "✓ built in 92ms"; "Documentation check passed."
- Pre-PR gate: critic request-changes, 1 blocker (a level-up revived a killer that died the same
  tick: `Health.raiseMax` now never heals the dead) → fixed with tests; should-fixes done
  (`ProgressionLevelInvariant` `progression-level`, pipeline wiring test); nits done (rule uses
  `Object.hasOwn`, 04 table row, 05 `paths`, damage-before-progression comment, INBOX lists the
  progression numbers). Ponytail-review after.
- Next step: push to PR #31; shared/assist XP and potency scaling later.

### 2026-10-16 — Phase 2 / sprint 2.2 — docs/status-effect-rulings — sholtzman + Claude Code

- What was done: the owner's rulings on PR #35's status-effect questions, as a new 2026-10-16
  batch of the decisions log:
  - DEC-40: modifiers multiply, per stack and across statuses (05 §8 `op: 'mul'`).
  - DEC-41: `StatusEffectApplier` and the cache recomputed on change are accepted as design;
    whether the approval covers `09a48a6`'s wider applier is open.
  - DEC-42: stun defaults to 2 s and wobbles aim. Blind's aim wobble makes basic attacks and
    aimed projectiles veer off and usually miss (a miss is not guaranteed), with a white
    vignette that fades over 2–3 s.
  - DEC-38 and DEC-39 are taken elsewhere (skins; the Phase 1 waiver in PR #16). DEC-42's open
    questions are a new `INBOX.md` item.
  - Posted on PR #35: a strict-audit review (request changes, 22:55Z) and the rulings comment
    (01:53Z). The rulings comment was posted without re-fetching the PR. The author's `09a48a6`
    (reply at 23:32Z) had already applied review items 1 and 4, so the comment's instructions on
    those are stale, and the guaranteed miss now lives in `CombatSystem`, not
    `StatusModifierStep`. A correcting comment awaits the owner. The pre-PR critic found this.
    The other fidelity and accuracy fixes it requested are applied to the rows above.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "✓ built in 91ms"; "Documentation
  check passed."
- Next step: PR #35 applies DEC-41's doc updates and DEC-42, and marks questions (1)–(4) of its
  INBOX item `Decision:`; (5) stays open. The owner answers the DEC-42 item.

### 2026-10-17 — Phase 2 sprint 2 / minion docs, PR #33 review — docs/minion-system-design — SamarjitBhogal + Claude Code

- What was done (both reviews of PR #33 answered, in an interactive session with the author):
  - Owner decisions from sholtzman's review logged as DEC-38 to DEC-42 (formation, advancing from
    the spawn point, every lane mob spawns in a horde, dev spawns are hordes, Phase 3 scope kept)
    and written into doc 18 (MS-23 to MS-25, §3.2, §3.5, §4, §5).
  - The author's choices: the worst lane is one `LaneAssessment` in `state/` over the game doc's
    terms, with a worked example (MS-9, still open for the owner's sign-off); `fallbackWorstLane`
    is dropped (ties go to the middle lane). The goal seam and horde redirection move to
    `backlog-post-mvp.md`; M4 is now flow fields only. `stop` clears the attack target (MS-26).
    Controllers own target selection (MS-27; `AggroPriorityTargetingStrategy` leaves 04 §4).
    Separation follows 10 §9, with the formation slot added to its priority list.
  - Mechanical: the M-numbers moved from doc 18 to the plan (ADR 0011 rule 4); `legendsPerLane`
    lane assignment without the Rover; `spawn-suppressed` is a `TeamState` counter; ids in string
    order; one lane identifier (`MapLane.id`); `progress` in world units; lane objectives in the
    `WorldMap` structures index; `GuardWithinLeashInvariant` in 15 §3; the PROTO-01 inventory and
    a "no marker remains" done-when; the traceability table maps FR-037/FR-038 to doc 18; the
    Phase 3 plan points to the minion plan and says `structure-destroyed`.
  - Open questions listed in doc 18 §12 and `INBOX.md`: MS-9 weights, horde size and cadence
    (M7, not picked), PROTO-01 part 2.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: the critic and ponytail gate on the updated branch; reply to the review comments;
  commit and push when the human asks.

### 2026-10-17 — Phase 2 sprint 2 / minion docs, pre-PR gate — docs/minion-system-design — SamarjitBhogal + Claude Code

- What was done:
  - Critic (`architecture-reviewer`) on `d125cad..aa36023`: one blocker (doc 18's pipeline order
    contradicted 10 §9) and minor findings, all fixed: membership pruning timing and the horde
    invariant accepting `removedThisTick`; sizes name FR-037/`hordeSizes`; the middle-lane
    tie-break is an owner question; `lane-objective` ranks last in the 11 §4.3 list; the guard
    leash is measured from the structure in 18 §7 and 15; import paths of `LaneAssessment`, the
    strategy and `match/` callers; 03 §4 listeners, 07 §6 fulfilment and 12 §7 lane id updated;
    interim text out of the doc 18 body; nits. Left open: naming the guard kinds (owner content).
  - Ponytail cuts: doc 18's "Post-MVP extensions" and "Naming" sections and the boss wave's own
    weights removed; open questions are now §10.
  - Critic re-check: approve, no blockers.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: the owner answers doc 18 §10 (MS-9 sign-off, horde size and cadence, PROTO-01 part 2); then M1F.

### 2026-10-17 — Phase 2 sprint 2 / merge of phase 2 — docs/minion-system-design — SamarjitBhogal + Claude Code

- What was done: merged `origin/phase/2-sprint-2-work` (`8751fff`, PR #28's Sprint 1 audit) into
  this branch. One conflict, in this log: both sides' entries kept, by date (the 2026-10-16 audit
  merge entry sits between this branch's 2026-10-15 and 2026-10-17 entries). `INBOX.md`, the
  decisions log and `docs/README.md` merged cleanly; the incoming DEC-32/DEC-33 do not clash with
  this branch's DEC-38 to DEC-42.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: push the branch so PR #33 shows the merge.

### 2026-10-17 — Minion system M1 refresh — feat/minion-m1-marching (merged docs/minion-system-design, uncommitted) — SamarjitBhogal + Claude Code

- What was done: fast-forwarded this branch to `docs/minion-system-design` (the PR #33 review
  rework), popped the M1 WIP stash (doc conflicts resolved in favour of the reviewed design) and
  brought the code in line with the new doc 18:
  - **Formation (DEC-38):** `content/mobs/formations/ranks.ts`; `PathingSystem` lays out the slots
    around each horde's anchor and `LaneFollowMovementStrategy` steers every mob, leader included,
    to its slot with separation from all neighbours (10 §9). The old leader-follow steering and
    `followDistance` are gone.
  - **Anchor (18 §4):** `progress` is world units from the horde's own gate; `HordeSystem` advances
    it at `marchSpeedFactor` of the slowest member's speed and no longer creates records.
  - **Spawning (DEC-39, DEC-40):** `SpawnSystem` creates members and record in one step, then emits
    the events; the anchor starts at the lane point nearest the spawn point. The unit cap counts
    into `GameState.teams` (`unitsRequested`, `unitsSuppressed`), hashed; the `spawn-suppressed`
    event is removed.
  - **Worst lane (18 §3.3):** `state/LaneAssessment.ts` (`assessLanes`) with the three terms
    (structure terms constant until M2), ties to the middle lane; `systems/worstLane`,
    `WORST_LANE_WEIGHTS` and `GameConfig.match.fallbackWorstLane` are removed.
  - **Order and ids:** pipeline `hordes → movement → pathing → spawn → death → invariants`, pinned
    by a test through the new `SystemPipeline.names`; horde members sort in string order.
  - **Docs:** doc 18 implementation status; plan M1/M2 rows (brains moved to M2) and stand-ins.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 486 passed (486)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: review; commit on the human's request; then the pre-PR gate.

### 2026-10-17 — Minion system M1, pre-PR gate — feat/minion-m1-marching — SamarjitBhogal + Claude Code

- What was done (critic on `e814637..508eea0`, the human's choices on four items):
  - **Blocker fixed:** `LaneFollowMovementStrategy` implements the 04 §4 `MovementStrategy`
    contract (`desiredVelocity(self, ctx): Vec2`, stateless, writes `ctx.out`), selected by the new
    `UnitDefinition.movementStrategy` through `entities/strategies/defaultStrategyRegistry.ts`
    (the shape PR #34 uses, `movement` as its key). `Movement.strategyId` carries the choice from
    spawn. `SpatialHash.forEachNear` became `collectNear` into a caller buffer, and `entities/`
    reaches it through a structural port, not an import of `physics/`.
  - **Deferred removal (03 §4):** `HordeSystem` queues `entity-removed` / `team-changed` ids and
    drops them at the start of its pass.
  - **Minor fixes:** helpers and types out of class files (`utils/compareById`,
    `HordeStore.types`, `LaneRoutes.types`, `SpawnSystem.types`/`.constants`, `PathingSystem.types`);
    the opening wave is content (`OPENING_WAVE`) and spawns read the kind from the definition
    through an injected `SpawnPlan`; a type guard instead of a team cast; `weightClass` in the
    hash; a formation overlap scenario test; doc 18 paths and §3.3 wording, 04 §4 selector name,
    03 and 10 implementation status, plan stand-ins (insert-ordered `SpatialHash`, linear
    separation, no hordes in the snapshot); placeholder stats cite the plan instead of MS-18.
  - **Ponytail:** `spawnHorde` takes the routes instead of checking them again.
  - **INBOX:** the first heavy horde's start (60 s or 240 s), and the `hordeOf` store lookup
    instead of a `hordeId` field, raised as better than the design.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 490 passed (490)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: critic re-check, then open the M1 PR stacked on PR #33.

### 2026-10-17 — Phase 2 sprint 2 / minion docs, DEC renumber — docs/minion-system-design — SamarjitBhogal + Claude Code

- What was done: the owner rulings from the PR #33 review, logged earlier as DEC-38 to DEC-42,
  are renumbered DEC-43 to DEC-47. DEC-38 (Legend skins), DEC-39 (the Phase 1 waiver) and DEC-40
  to DEC-42 (PR #36's status rulings) were already taken. Changed in the decisions log, doc 18
  (MS-23 to MS-25) and the Phase 3 plan; the earlier entries in this log keep the old numbers as
  written.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: merge into `feat/minion-m1-marching`.

### 2026-10-17 — Minion system M2a (brains and perception) — feat/minion-m2a-brains-perception (off feat/minion-m1-marching) — SamarjitBhogal + Claude Code

- What was done:
  - **PR split:** the rest of the minion work is cut into pull requests M2a, M4, M2b, M2c, M3,
    M5a and M5b, with their blockers (minion plan §2; stand-ins are now §3).
  - **DEC renumber:** the PR #33 owner rulings became DEC-43 to DEC-47 on PR #33 and were merged
    into M1 (PR #38) before branching.
  - **Neighbour index:** `SpatialHash` is now 10 §5's counting-sort grid with an exact, ascending
    `queryCircle`; `physics/SpaceIndex` is `state.space` (the `SpaceQuery` port in `state/`),
    rebuilt by the new `SpaceSystem` after `MovementSystem`; `PathingSystem` and the steering
    strategy read it instead of their own grid.
  - **Perception** (`ai/perception/`): `unitsWithin` and `nearest`, filtered by hostility, kind
    and liveness through the re-added `EntityStore.teamOf` / `isAlive` (PR #34's signatures).
  - **Brains and AI:** `content/ai/cadence.ts` (11 §6), the `ControllerId` union in content
    types, a `ControllerBinding` component from `UnitDefinition.controller` / `aiProfile`,
    `state.ai` (`AiState`: brains with their own RNG stream, the deferred queue; hashed), the
    `Controller` contract, an empty controller registry, and `AiSystem` (stagger by id hash,
    budget with deferral) composed first by `Simulation`.
  - **`HordeMembershipConsistentInvariant`** (15 §3), against the store lookup.
  - **`dev-spawn-mobs`** (13 §4, 18 §3.5, DEC-46): its handler resolves the origin (structure,
    `{ lane, t }`, point) to a lane and queues a `HordeRequest` on `state.hordeRequests`;
    `SpawnSystem` fulfils queued requests and scheduled waves through one shape, clipped to the cap.
  - **Docs:** 03 §3 union and status, 10 §12, a new 11 §10 implementation status, 18 status, plan
    §2 table and §3 stand-ins; INBOX question on how a controller writes its memory back.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 507 passed (507)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: review; commit on the human's request; the pre-PR gate; M4 can start in parallel.

### 2026-10-17 — Minion system M2a, pre-PR gate — feat/minion-m2a-brains-perception — SamarjitBhogal + Claude Code

- What was done: the critic (`architecture-reviewer`, `62e8a61..d13bbfa`) approved with
  should-fixes, all applied: `Perception` returns ids in string order and breaks `nearest` ties
  toward the lower id (11 §3, §5), with a test across `entity-9` / `entity-10`; a `StateHasher`
  test covers every brain field and the deferred queue, and an `AiSystem` determinism test
  compares the ask order and the hash of two runs; `SpatialHash.queryCircle` sorts in place
  (no allocation per query); the weight classes have one source (`state/Horde.constants.ts`);
  an unregistered controller fails at `Simulation` construction for shipped content and at
  attach time otherwise; nits (pipeline TSDoc, `PathingSystem.test` no longer imports
  `SpaceSystem`, new `SpaceIndex` and `ControllerBinding` tests, the cadence test checks the
  ticks actually used). Ponytail: the redundant `queryCircle` guard is gone and `nearest` walks
  the query's indexes.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 514 passed (514)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: open the draft PR to `phase/2-sprint-2-work`; M4 is in progress in its worktree.

### 2026-10-17 — Minion system M4 (flow fields) — feat/minion-m4-flow-fields — SamarjitBhogal + Claude Code

- What was done:
  - **Fields:** `map/FlowField` (one lane and team: corridor mask, `Uint16Array` integration,
    `Int8Array` direction, bilinear `directionAt`, `isLineClear`), `map/FlowFieldBuilder` (Dijkstra
    flood fill from the lane's enemy end, octile costs, no corner cutting, an indexed heap, a cell
    budget per call, its own buffers swapped in on completion) and `map/LaneFlowFields` (2 ×
    `numLanes` fields, `markDirty(cells)`, `rebuildDirty(cellBudget)`). The corridor is the band
    around the lane plus the ground inside the team's wall ring out to the gate (18 §3.2). Ties
    break by a team preference order mirrored for Dark, so each lane's two fields are exact mirror
    images; blocked corridor cells beside open ground point back to it (the wall-avoidance stand-in).
  - **Steering:** `LaneFollowMovementStrategy` follows the field while the next `blockedLookAhead`
    (new `HORDE_STEERING` content) of the line to its slot is blocked, through an optional
    `MovementContext.flow` port; `PathingSystem` takes the fields (optional) and rebuilds dirty
    ones each tick; `DefaultSystemPipeline` builds the `WorldMap` and the fields from the map.
  - **Config:** `map.flowFieldCorridorHalfWidth` and `map.flowFieldCellBudget` (`TUNE`), validated;
    the WANDER_SEED_7 replay fixture gains both fields (its hashes are unchanged).
  - **Tests:** field counts, reach and downhill directions, mirror symmetry for 3 and 5 lanes; a
    gate change re-routed within `ceil(cells / budget)` ticks with the old field serving; the
    strategy's switch; hordes routed around a block; every opening horde reaches its enemy end for
    3 and 5 lanes (under 1% of samples on unwalkable ground, about 8% without the fields); hash
    stability on the 5-lane map.
  - **Docs:** doc 18 status, 10 §12, 06 §10, 03 §10 table; plan §2 stand-ins (the polyline-only row
    removed; no dirty trigger and no wall-avoidance term added).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 512 passed (512)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: review; commit on the human's request; then the pre-PR gate (critic, ponytail).

### 2026-10-17 — Minion system M4, pre-PR gate — feat/minion-m4-flow-fields — SamarjitBhogal + Claude Code

- What was done: the critic (`architecture-reviewer`, `62e8a61..4bf6e7b`) approved; its minor
  findings are fixed: `PathingSystem` builds one movement context per tick and sets each horde's
  `flow` on it (`MovementContext.flow` is now `FlowQuery | null`), the saddle fallback in
  `FlowField.directionAt` computes its cell inline (no allocation on the hot path), and the
  rebuild test asserts the exact queue size after a repeated `markDirty`. `ponytail:` notes now
  name the whole-grid reset in `FlowFieldBuilder.begin`, the `UNREACHED` cost ceiling and the
  wall-pointing stand-in. Not done: the optional DRY helper for the blocking rule.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 512 passed (512)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: draft PR to `phase/2-sprint-2-work`; merge after #33 and #38, then resolve the
  overlap with M2a (#39).

### 2026-10-22 — Phase 2 / sprint 2.2 — feat/status-effects (DEC-40 to DEC-42) — Claudio + Claude Code

- What: applied the owner's rulings on PR #35. DEC-42: `blind` has no hard miss (the
  `attacks-miss` flag, the `CombatSystem` miss branch and the `attack-missed` event are gone;
  blind is content with no flags until the aim wobble lands); `stun` defaults to 2 s (`TUNE`,
  DEC-42). DEC-41: design text updated as asked: 05 §3 and §8 (the applier is the one way in, the
  component recomputes on change; whether the applier's `remove` / `expire` are covered stays
  open, as DEC-41 says), 03 §4 (`status-applied` emitted by `StatusEffectApplier`;
  `attack-missed` row removed), 17 R9 (`reapply`, apply through the
  applier). INBOX item marked `Decision:` (DEC-40 to DEC-42; the open DEC-42 questions are PR #36's
  item). Follow-ups, not built: blind/stun aim wobble (seeded RNG), the client white vignette.
- Checks run: `npm run check` → `EXIT=0`: core "Tests 534 passed (534)"; client "Tests 416 passed
  (416)"; "✓ built in 100ms"; "Documentation check passed."
- Critic: approve, two nits fixed (the applier's remove/expire kept out of the design text as
  DEC-41's open question; a reflowed sentence). Ponytail-review: lean (the delta only deletes).
  Next step: push and reply on #35; merge order stays #34 → #35 → #31.

### 2026-10-22 — Phase 2 / SCRUM-426 — feat/legend-aether (owner review, PR #31) — Claudio + Claude Code

- What: synced with `feat/status-effects` by a plain merge (no force; #34 → #35 → #31 order),
  then applied Sam's review. Content injected: level curves are a catalogue
  (`levelCurveCatalogue.ts`, `loadLevelCurves` shape-checks cap and steps at load), passed to
  `ProgressionSystem`, `KnownLevelCurveRule` and the invariant runner; `Simulation({ levelCurves })`
  can replace them. `Progression` keeps `curveId` (D2 reverted to the design); `Health.baseMax`
  removed (D3 reverted: the raise uses the definition's `baseHealth`). Mob XP is
  `MobDefinition.xpValue` (light minion 20, training dummy 0, O8); `XP_SOURCES` keeps only the
  Legend kill, re-priced 150 + 5 × victim level for cap 50. O3/O4: `raiseMax` raises only the cap;
  the system heals and refills by the raise only while alive. O5: self and ally kills pay nothing
  (teams compared; one check covers both). Every award emits `xp-gained` from one private method;
  `LevelMatchesXpInvariant` (`level-matches-xp`, 15 §3 name) replaces `ProgressionLevelInvariant`
  with the four rules. `KindSet` (`LEGEND_KINDS`, `MOB_KINDS`) keys rules on kind without casts.
  `StateHasher` appends progression at the end, ungated. `Aether.fraction`/`isEmpty` removed (no
  caller). 04 §3 design rows reverted (O2); 04 bullet rewritten; 05 progression note moved into
  one "Implementation status" section (ADR 0011 rule 4). INBOX: income estimate for the cap-50
  curve. TODO(claudiodh) where a dead Legend's award is dropped (respawn, FR-051).
- Tests shown red by breaking the code: O5 (team check removed), O3 heal and O4 no-heal (guard
  removed / inverted), O8 and mob XP (xpValue replaced), `xp-gained` (emit skipped), pipeline
  order (Death before Progression; Combat after Progression), hash rows (each `fields.push`
  removed), curve shape (each check removed), `KnownLevelCurveRule` (injected `has` forced true;
  keyed on field instead of kind), `PositiveAetherRule` (keyed on field), `LevelScalingRule`
  (filter removed), `raiseMax` cap only (heal added back), Legend `curveId` (wrong id). The
  no-attacker guard's break is a type error (`Award.killerId` is an `EntityId`), not a test.
- Gate: ponytail-review: no cuts (the invariant's level recompute is independent on purpose).
  Critic: request-changes, no code blockers; 4 should-fix → fixed red-first: the invariant runner
  takes the curves (no content default in `diagnostics/`); `loadDefaultContent(tickRate, curves)`
  validates Legends against the injected curves; `GameState.xpAwardsThisTick()` records every
  award of the tick, so the 512-event ring buffer can't hide one; rule 4 tested for self and ally
  awards apart (each condition's removal now fails its own test). Nits taken: the definition
  lookup hoisted out of the level loop; INBOX notes the cap-10 boss levels. Nits left: an ally
  award by a recipient already removed this tick is not flagged (the event has no recipient team,
  Sam's payload); the kind lists are not checked for exhaustiveness. The PR body carries the
  O1–O8 list, the D-table and the break-per-test table.
- Checks run: `npm run check` → `EXIT=0`: core "Tests 585 passed (585)"; client "Tests 416 passed
  (416)"; "Documentation check passed."
- Next step: Sam re-reviews #31 after #34 and #35; Samarjit's medium/heavy minions need `xpValue`
  (45 / 120) whichever merges second.

### 2026-10-22 — Phase 4 (early, O7) / sprint 4.4 — feat/weapons — Claudio + Claude Code

- What: first weapon slice (SCRUM-183 / SCRUM-287, 05 §10). `content/weapons/`
  (`WeaponDefinition`, empty `WEAPONS` catalogue, `loadWeapons` with seconds→ticks via `TickRate`
  and validation at load); `LegendDefinition.defaultLoadout.primaryWeaponId` +
  `KnownWeaponRule`; `EntityFactory` and `Simulation({ weapons })` inject the weapon source;
  `Legend.basicAttack` builds `Combat` from the weapon (`Combat.weaponId`); `MeleeAttackStrategy`
  names the weapon in the `DamageSource` (mobs name their own definition). No weapon numbers
  shipped: owner questions in INBOX. Answers Sam's Discord ask (dealer = entity + weapon; damage
  changes with the weapon on the same class).
- Tests shown red by breaking the code: interval conversion, no attacks, each non-positive
  field, kebab id, `uniqueTo` outside `allowedClasses` (loader checks removed); unknown weapon
  (`KnownWeaponRule` forced true); rule listing (rule unregistered); `Combat.weaponId` (default
  changed); Legend equips / throws without a source (override bypassed); factory forwarding
  (spread removed); `Simulation` wiring (weapon source not passed); weapon and mob source names
  (`definitionId` reverted / replaced).
- Gate: ponytail-review 1 cut (reuse `KEBAB_CASE`). Critic: request-changes, 1 blocker (a double
  cast in `SpawnContextReader.weapons`) → replaced by a type guard; 1 should-fix (a weapon with no
  attacks left a Legend without `Combat`) → `Legend` now throws; both red first. Nits kept: the
  factory test's `as FactoryEntity` copies the existing pattern; `WeaponSource` / `loadWeapons`
  stay off `src/index.ts` until the client needs them.
- Checks run: `npm run check` → `EXIT=0`: core "Tests 557 passed (557)"; client "Tests 416 passed
  (416)"; "✓ built in 94ms"; "Documentation check passed."
- Next step: the owner's answers in INBOX (weapon numbers, default weapons), then the shipped
  weapons; open the PR to `phase/2-sprint-2-work` once #34 and #35 are merged.

### 2026-10-24 — Phase 2 / sprint 2.2 — docs/status-effect-rulings (merge of phase 2) — sholtzman + Claude Code

- What was done: merged `origin/phase/2-sprint-2-work` (`00fee93`, PRs #33, #35 and #31) into
  this branch to clear PR #36's conflict. Two conflicts, both sides kept: the decisions log holds
  both 2026-10-16 batches, PR #33's DEC-43 to DEC-47 above this branch's DEC-40 to DEC-42 (newest
  numbers first), with `last-reviewed` at the later 2026-10-17; this log keeps phase 2's entries
  and appends this branch's. `INBOX.md` merged cleanly. Against the phase branch the merge only
  adds this branch's lines. It also gives the DEC-40 to DEC-42 references already on the phase
  branch (05, 03, 17, `stun.ts`, `blind.ts`, tests) the log rows they cite.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 585 passed (585)"; client "Tests 416 passed (416)"; "✓ built in 200ms"; "Documentation
  check passed."
- Next step: quick `/pr-review`, then merge PR #36 into `phase/2-sprint-2-work`.

### 2026-10-18 — Phase 2 / Track B (S1 carry-over) / HUD and character select, foundation — feat/hud-and-character-select — sholtzman + Claude Code

- What was done: the foundation for the owner's three Figma frames (Pre-Game Class Selection
  62:125 with its alternate 62:70, Pre-Game Sub-Class Selection 58:271, HUD Draft 62:231), built
  by gated agent packages from the master plan (decisions DEC-48…DEC-55):
  - Core: Legionnaire as the warrior display name, the display-only Legend family (Catalyst,
    Oracle, Necromancer; Velite, Centurion, Praetorian; Colossus, Juggernaut) with mirrored Magus
    Legend names per team, map-feature display names and `loadDisplayContent()`.
  - Assets: the owner's Figma art exported on a scratch page (originals verified unchanged),
    lossless WebP renditions, Cinzel (OFL) and Phosphor (MIT) with licences, behind a minimal
    `data/resources` `ResourceController` and `AssetManifest` (asset groups boot, selection,
    selection-primary, selection-alternate, match).
  - Bridge and content: HUD and catalogue contracts, events, slices, selectors, the core-backed
    display catalogue (placeholder catalogue retired), the `effectsRenderer` and `contrastMode`
    data switches, tokens (Figma-exact set and an accessibility-minimums set) and strings.
  - Lifecycle (audit AS-1): `SessionController` owns the `Match` (DEC-50). The world is prepared
    in `match-loading`; the `Match` is created only when the match viewport attaches and is
    destroyed on leaving `match`. Nothing builds a map, Simulation, game loop or rAF before
    `match` (the game loop no longer runs during class selection). `MatchBridge` publishes what
    the simulation has; the minimap draws in the HUD ring through `Renderer.clipToEllipse`.
  - Screens are not built yet: `App.tsx` still shows `PlaceholderScreen` (WP-F F2 registers the
    real screens after the selection and HUD packages).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 487 passed (487)"; client "Tests 735 passed (735)", statements 96% (base 89.19%);
  "✓ built in 155ms"; "Documentation check passed."
- Next step: the selection screens (WP-SEL-SHARED, WP-LEGEND, WP-CLASS) and the HUD (WP-HUD) in
  parallel local sub-branches with the pixel audit against the Figma, then WP-F F2 integration
  and the final audit.

### 2026-10-18 — Phase 2 / Track B (S1 carry-over) / HUD and character select, WP-HUD — feat/hud-charselect-hud — sholtzman + Claude Code

- What was done: the match screen and HUD of Figma 62:231 (package WP-HUD), not yet registered in
  `App.tsx` (WP-F F2 does that):
  - `ui/screens/MatchScreen`: the viewport under a HUD section (`--hud-u` = one Figma px, nine
    regions in the Figma's paint order) and the pause overlay beside both; the viewport and the
    HUD are `inert` while an overlay is open. `PauseOverlay` autofocuses Resume, focuses the
    dialog for the settings view and returns focus to the element the pause key captured.
  - `ui/hud/`: segmented health, aether, ultimate and weapon bars, the level badge (XP ring =
    XP within the level, emblem from the class kit, total level), the ability and gadget slots
    with the owner's slot meanings (OD-9: gold glow = ready, red fill from the bottom = remaining
    cooldown, a key glyph on every slot), charge boxes, structure strips bound by identity,
    objectives with an allegiance flag, the clock, the crystal and the minimap ring. A `null`
    value draws the "no data yet" hatch and is an image named "No data yet".
  - Bridge selectors `selectHudKit`, `selectHudSlotView`, `selectStructureStrip`,
    `selectObjectives`, `selectMatchClockText`; `HudSide`; the Figma fixture's slots follow OD-9.
- Checks run: `npm run check` → `EXIT=0` (quoted in the WP-HUD report); pixel audit of the
  `hud-draft` harness scenario against `hud.figma.png`: 64 match, 44 identical, 4 masked, 27
  differ (Cinzel text rasterisation, the 15 px numerals 1 px high, sub-pixel edges of the charge
  boxes and the XP ring).
- Next step: the orchestrator's gate and the HUD-vs-Figma critic; WP-F F2 registers
  `MatchScreen` in `App.tsx`.

### 2026-10-18 — Phase 2 / Track B (S1 carry-over) / HUD and character select, WP-HUD fix round 1 — feat/hud-charselect-hud — sholtzman + Claude Code

- What was done: the named leaves `ui/hud/HealthBar` and `ui/hud/AetherBar` (OD-19(b): each one
  line over `ResourceBar`, passing `className` through), each with a server-render test (Figma
  value 1850 / 4700, "—" and the "No data yet" image before the first publish, no shield
  overlay); `MatchScreen` renders them instead of `ResourceBar` directly (the aether placement
  class is unchanged).
- Checks run: `npm run check` → `EXIT=0` (client 159 files, 860 tests; core 85 files, 487 tests).
- Next step: the orchestrator's gate re-check; the T-HUD-20 objective-letter fallback waits for
  the orchestrator's decision; the visual audit loop on `hud-draft`.

### 2026-10-18 — Phase 2 / Track B (S1 carry-over) / HUD and character select, WP-HUD visual fix round 1 — feat/hud-charselect-hud — sholtzman + Claude Code

- What was done: the two fixable defects of the WP-HUD raster audit, round 1.
  - `ResourceBar.module.css`: the health and aether numeral box sits 1 `--hud-u` below the
    Figma's top 2 through a named, commented local knob (`--value-baseline-nudge: 1`). Chrome
    rounds Cinzel 15's ascent and descent and puts the baseline about 0.8 px above Figma's, so the
    numerals were 1 px high; tops of 2.5 and 2.8 render like 2. This is a per-leaf baseline offset
    found by the audit: OD-18 outranks the plan's "no knob tuned during the audit" (§11.4 step 7,
    I-88) for this leaf. It is a `top`, not a `translate` (I-45).
  - `ChargePips`: each box stroke is drawn on the edges the Figma render shows, which sit on a
    1/8 px grid (`PIP_GEOMETRY.edgeStepsPerPx`); the fills, widths and viewBox keep the node
    geometry. A `normalised` change of at most 0.063 px that needs a CD row (CD-17 type) in the
    register (reference doc 15), which WP-DOCS owns.
- Checks run: `npm run check` → `EXIT=0` (client 159 files, 863 tests; core 85 files, 487
  tests). Harness `hud-draft` re-shot: health-value and aether-value now shift 0 (OD-18 /
  OD-21(d) floor), the charge boxes match; byte-identical to the auditor's combined probe.
- Next step: WP-DOCS registers the charge-box CD row and records the numeral baseline knob; the
  re-audit of `hud-draft`.

### 2026-10-18 — Phase 2 / Track B (S1 carry-over) / HUD and character select, WP-HUD visual fix round 2 — feat/hud-charselect-hud — sholtzman + Claude Code

- What was done: two of the three defects of the WP-HUD raster audit, round 2.
  - `LevelBadge.module.css`: the XP glow draws only the fill's shadow, as Figma does. A
    drop-shadow filter also paints the copy it shades, and the copy's anti-aliased edge showed
    through the r 80.5 mask and tinted the stroke's outer edge. The copy now sits
    `--xp-glow-shift` (whole px, at least 400 Figma px) left of its place, outside the masked
    wrapper, and the shadow is offset back by the same shift. The 80.25 fill clip stays.
  - `SegmentedBar.module.css`: the health and aether marker → rest step gets three stops at a
    quarter, half and three quarters, each the straight-alpha mix Figma draws (relative colour
    from the rest token towards the white marker, so the minimums set follows); the gradient
    names `in srgb` so those stops keep the legacy interpolation space. The cream bars get the
    premultiplied points of their own ramp, so they render unchanged (byte-identical in the
    harness, both colour sets).
  - Not done here: the HUD key-label centre needs `KeyGlyph.module.css` (WP-F) changed, which is
    not additive; it is routed to WP-F as a CCR.
- Checks run: `npm run check` (result quoted in the WP-HUD report). Harness `hud-draft` re-shot:
  xp-ring 4.17 %, xp-ring-inner 4.54 %, level-icon 4.43 % (official mask), all MATCH under the
  CD-25 information mask; health marker zone 0 px over dE 2.3, aether 16. The 1280 × 720, dark,
  green, minimums and minimums-peak scenarios change only on the ring edge and the marker
  columns; null and live-no-data are byte-identical; the CSS path equals `hud-draft`.
- Next step: WP-F applies or rejects the KeyGlyph CCR; the re-audit of `hud-draft`.

### 2026-10-18 — Phase 2 / Track B (S1 carry-over) / HUD and character select, WP-HUD key-label centre (KeyGlyph CCR applied) — feat/hud-charselect-hud — sholtzman + Claude Code

- What was done: the HUD key-label defect of the WP-HUD audits (rounds 2 and 3), on the
  orchestrator's instruction to apply the open CCR to `KeyGlyph.module.css` (WP-F file).
  - `.hud` padding is `calc(1 * var(--hud-u)) calc(2 * var(--hud-u)) 0 calc(3 * var(--hud-u))`,
    so the content centre sits on the Figma text node 65:668 (+13, +13 of the 25 × 25 box). The
    digits were about 1 px high and 0.6 px left.
  - The CCR said to check the change against OD-21(f) (key-cap overflow). With the padding alone
    the 23-unit line box overflows the 22-unit content box (scroll 23 × 24, client 23 × 23), so
    the line height is now `calc(22 * var(--hud-u))`: the line box fills the content box (FID-17).
    At 1920 × 1080 (DPR 1 and 2) this renders byte-identical to the padding alone; at 1280 × 720
    it also centres the digits vertically (padding alone left them about 0.5–0.9 px high).
  - `KeyGlyph.test.tsx`: a test of the `.hud` rule (box, stroke, padding, line height). It
    failed before the CSS change.
- Checks run: `npm run check` (result quoted in the WP-HUD report). Harness, every scenario
  before and after: only pixels inside the six HUD key boxes change; key-label rows ult / 1 / 2 /
  3 are 4.81 / 3.69 / 5.77 / 4.17 % (were 8.01 / 5.13 / 10.26 / 9.46), shift 0, ink box 0, glyph
  centroids within 0.17 px of Figma's (OD-18 floor). The CSS path still equals the raster path.
  The text lists are unchanged.
- Next step: the re-audit of `hud-draft`; WP-F confirms the change to its file.

### 2026-10-18 — Phase 2 / Track B (S1 carry-over) / HUD and character select, WP-HUD OD-9 docs record — feat/hud-charselect-hud — sholtzman + Claude Code

- What was done: the HUD-vs-Figma critic's one finding, OD-9 not yet recorded in the docs. Docs
  only; no code changed.
  - Reference 15 §3: register row CD-28 (`fill-in`): the red vertical fill is the on-cooldown
    look, cut from the bottom to `cooldownRemainingTicks / cooldownTicks`; the gold glow is the
    ready look; the fill's direction is a default for the owner to confirm (HC-C1).
  - Architecture 13 §10 (Implementation status): the `AbilityBar` cooldown sweep of §3 is that
    vertical fill, with a link to CD-28. §3's design text is unchanged.
  - Architecture 05 §15 `PlayerSnapshot` sketch: `xp` is the XP earned inside the current level
    (resets on level-up), `xpToNext` the XP the current level needs to reach the next.
  - `last-reviewed` 2026-10-18 on all three; `INBOX.md` HC-C1 gains one sentence naming CD-28.
- Checks run: `npm run check` (result quoted in the WP-HUD report). Harness `hud-draft` re-shot
  and compared with the previous shot and the Figma reference.
- Next step: the PR's deviation table lists the vertical fill as acceptable (owner design).

### 2026-10-19 — Phase 2 / Track B (S1 carry-over) / HUD and character select, WP-HUD XP-ring edges and glow (CSS-quality audit) — feat/hud-charselect-hud — sholtzman + Claude Code

- What was done: the two fixable XP-ring defects of the WP-HUD CSS-quality audit (65:653).
  - `LevelBadge.module.css`, arc edges: the conic gradient uses the Figma's own edge geometry
    as soft ramps. It starts at −1.05° with a 0.69° fade-in, has the orange stop at
    p × 174° + 1.05°, and fades out over 0.75° centred on p × 360°. The hard `transparent 0`
    stop is gone, because Chrome draws conic hard stops aliased (the end was a staircase and the
    start 1.4 px late). The fade-in narrows to the gap left before a full turn
    (`min(0.69deg, (1 − p) × 360deg)`), so p = 1 closes with no notch. With no XP (p = 0),
    `LevelBadge` sets `data-xp-arc="none"` and the fill and glow copy draw no arc; the edge ramps
    alone would leave a 1–2 px sliver at 12 o'clock.
  - `LevelBadge.module.css`, glow: the drop-shadow σ is now `calc(4 * var(--hud-u))`, a tuning
    value with a comment: Figma's blur 10 is nominally σ 5 but measures as σ 4 here, the same
    finding as `SLOT_GLOW_SIGMA`.
  - `LevelBadge.test.tsx`: the existing exact pin of the drop-shadow string now says
    `calc(4 * …)` (still exact). Three new tests cover the gradient stops with no hard stop, p = 0
    (`data-xp-arc="none"` and the `background: none` rule) and p = 1 (no attribute, and the
    fade-in and fade-out stops that close the ring).
- Checks run: `npm run check` (result quoted in the WP-HUD report). Harness `hud-draft`, raster
  and CSS paths, re-shot. The two paths are still byte-identical to each other, because the HUD
  does not depend on the renderer. The shot is byte-identical to the auditor's combined probe.
  Only the badge box changed: 132 of 139 rows are identical, and xp-ring, -outer and -fill moved
  from 4.17 to 3.60 %. Arc-edge zone: 36 px over 2.3 before, 13 after. Glow bands r 81–93:
  dL* −0.28 to +0.33, with 0 px over 2.3. In harness scenarios at p = 0, 1 and 0.998, the ring
  is empty at p = 0, closes with no dip at 12 o'clock at p = 1, and shows a closing gap at 0.998.
- Next step: the re-audit of `hud-draft` on both paths. The stroke edge (r 79–81) and the level
  number stay open, as the audit found.

### 2026-10-23 — Phase 2 / Track B (S1 carry-over) / HUD and character select, WP-HUD frame 8:2 and CD-25 dispositions — feat/hud-charselect-hud — sholtzman + Claude Code

- What was done: the HUD-vs-Figma critic's two docs findings. Docs only; no code changed.
  - Reference 15 §1: frame 8:2's role reads "deleted by the owner 2026-10-18 (OD-9); 62:231 is
    the only HUD frame" (the Figma no longer has the node).
  - Reference 15 §3, CD-25: the status reads "registered (OD-3, 2026-10-18); mask pending owner
    sign-off (HC-C1)"; the row states the measurement's outcome instead of its condition, and
    points to HC-S4. The level-number mask is still not applied: it waits for the owner.
  - `INBOX.md`: HC-C1 asks the owner to sign off CD-25 and its mask; HC-Q2 (2) asks how an
    uncharged ultimate looks, with CD-28's default, and no longer cites 8:2; HC-Q2 (5) is marked
    answered by OD-9 (CD-28); new HC-S4 records the hybrid grain field ("option A") as a
    better-than-design candidate, not built.
  - `last-reviewed` 2026-10-23 on reference 15.
- Checks run: `npm run check` (result quoted in the WP-HUD report). The harness could not re-shoot
  `hud-draft`: its sources and the shot and diff tools are gone from the scratch space. Every
  file outside `docs/` and `INBOX.md` hashes the same before and after this edit, so the HUD
  render is unchanged; the region numbers were re-measured on the last shot of that code.
- Next step: the owner signs CD-25 (then the mask is applied) or picks HC-S4.

### 2026-10-24 — Phase 2 / Track B (S1 carry-over) / HUD and character select, final visual audit (stream C) — fix/hud-charselect-visual — sholtzman + Claude Code

- What was done (recorded by stream B from stream C's report): the final pixel audit of 62:125,
  62:70, 58:271 and 62:231 against the Figma as refreshed on 2026-10-24, on the Figma-raster
  path, until a round changed nothing; every remaining difference has a ruling (register CD-29 to
  CD-35). Fixes: the measured blur for the label and countdown glows (OD-27; 32 regions better,
  none worse); the picked Legend title centred on the owner's renamed 55:257 box; the battle axe
  with the owner's Noise grain, extracted from his own frame (OD-28, register CD-37). Also the CSS
  effects path measured once for information, a live-content layout review on both teams and at
  1280 × 720, and the HUD's slot meanings re-checked against OD-9.
- Checks run: `npm run check` before the commits, `EXIT=0`: core 85 files, 487 tests; client 199
  files, 1208 tests, statements 95.38 %; docs check passed (log in the stream's working folder).
- Next step: the owner signs CD-25's mask (HC-C1); docs that quote the match budget use the new
  totals (141,646 / 359,902 B, OD-29 (d)).

### 2026-10-24 — Phase 2 / Track B (S1 carry-over) / HUD and character select, docs for the owner's sign-off (stream B) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only; no code changed):
  - Architecture, append-only (OD-26): one Implementation-status note each in 01 (new §8), 02 (new
    §12), 05 (new §18), 06 §10, 13 §10, 14 §14 and 17 (new §12), and three paragraphs citing
    DEC-50 and DEC-52 to DEC-55 in 13 §2, §7 and §9. Two 13 §10 sentences wait for the merged live
    probe (`⟨PENDING-A⟩`).
  - Every change to existing design text is an unapplied patch with the owner's edit table (T-01
    to T-79, plus A-1 and A-2 merged earlier), inlined in `INBOX.md` HC-T1.
  - Reference 15: a `floor` kind; CD-26 records the frame's own Oracle/Cantor inconsistency and the
    panel-subtitle mask; new rows CD-29 to CD-37 (rendering floors with every number from the final
    audit in §4, fit-to-width titles, the battle-axe extraction).
  - New `docs/plan/ui-enhancements-plan.md` (UE-01 to UE-12, each a data-selectable variant with
    the Figma original kept live) with its task line in Phase 6, sprint 6.3.
  - `INBOX.md`: HC-T1, HC-B1 (reconciled) and HC-C1 rewritten; HC-Q15 with the measured sizes;
    new HC-S5; the owner's playtest of 2026-10-24 recorded in Done.
  - Ids re-checked after `git fetch` across 39 remote refs and the open PRs: DEC-48…55, OQ-63…70,
    FR-119, ADR 0018 and the CD, HC and UE ids are unique. An independent fact-check found 19
    imprecisions; all are fixed.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 487 passed (487)"; client "Tests 1207 passed (1207)", statements 95.38 %; "✓ built";
  "Checked 113 Markdown files under docs/." and "Documentation check passed.".
- Next step: after the merge and the upstream sync, replace the `⟨PENDING-A⟩` sentences with the
  live-probe result and regenerate the patch on the merged tree; the owner answers HC-T1, HC-B1,
  HC-C1, HC-Q1 (5) and HC-S5.

### 2026-10-24 — Phase 2 / Track B (S1 carry-over) / HUD and character select, screen registration, live probe and upstream sync — feat/hud-and-character-select — sholtzman + Claude Code

- What was done (recorded by stream B from the coordinating session's results):
  - `ui/App.tsx` registers `CharacterSelectScreen` and `MatchScreen` in `PHASE_SCREENS`
    (`5c0f7da`). Only `MatchScreen` renders the viewport; `PlaceholderScreen` no longer shows it.
    The App test that pins this failed first against the old App (5 phases showed a viewport).
    Eight unused tokens this branch had added were removed, each grepped first.
  - A live probe of the built app passed all ten criteria in development and production builds:
    no canvas and no animation frame before the match, the world prepared only in
    `match-loading`, the loop running in the match and stopped after Leave match, the
    keyboard-only flow, Esc and C left to the page on the selection screens, no page errors, and
    the `Match` created only in the match. Long frames during character select are judged on the
    production build (OD-30): none in seven runs.
  - `useFitFontSize` measures after layout through a one-shot `ResizeObserver` and applies the
    fit with `flushSync`; its new tests failed first. Residual risk: the class-to-Legend step is
    not measurably cheaper, so a slower machine may still stutter there.
  - Merged `origin/phase/2-sprint-2-work` (34 commits: PRs #31, #33, #34, #35, #36, #37, #41) as
    `5755dfe`.
  - Evidence: the probe records are outside the repository (`eternalus-agent-work/hud-charselect/`
    `wf7/probe-r2/`, `results/f2.json`).
- Checks run: after F2, `npm run check` → `EXIT=0` (core 487 tests; client 1219 tests); after the
  sync, `npm run check` → `EXIT=0`: core "Test Files 112 passed (112)", "Tests 606 passed (606)";
  client "Test Files 199 passed (199)", "Tests 1220 passed (1220)", statements 95.36 %;
  "Checked 116 Markdown files under docs/." "Documentation check passed."
- Next step: the owner's sign-offs (INBOX HC-T1, HC-B1, HC-C1, HC-Q1 (5)).

### 2026-10-24 — Phase 2 / Track B (S1 carry-over) / HUD and character select, docs follow-up after the sync (stream B) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only):
  - Architecture 13 §10: the two placeholder sentences now record the screen registration and
    the live check, with its residual risk and where the evidence is. 05 §18 records that the
    HUD's aether, level and XP stay `null` after the sync, because core's entity snapshot carries
    only health (INBOX HC-F6 gains a line).
  - Reference 15: Select Class's label glow is an open residual for the owner, not a floor
    (CD-30); CD-21 now gives its fifteen `minimums` tokens and the thirteen pairs' ratios in both
    sets (new §5, computed as `tokenContrast.test.ts` computes them); a new appendix lists the
    build rulings OD-1 to OD-30 that the docs cite. INBOX HC-C1 matches.
  - The unapplied design-text patch was regenerated on the synced tree (79 edits, only line
    numbers moved) and the HC-T1 table updated.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 606 passed (606)"; client "Tests 1220 passed (1220)", statements 95.36 %; "✓ built";
  "Checked 116 Markdown files under docs/." "Documentation check passed."
- Next step: the pre-PR critic on the merged branch, then the owner's sign-offs.

### 2026-10-24 — Phase 2 / Track B (S1 carry-over) / HUD and character select, docs for the pre-PR critic's run 1 (stream B) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only):
  - Architecture 13: the three paragraphs citing the owner's decisions (§2 DEC-50, §7 the display
    switches, §9 the variants) moved from the design text into the §10 note until he approves
    their wording, because §2's table still described the old lifetime (critic S5). §10 now also
    records the missing shield segments (N17), a re-attach restarting at tick 0 (N21), the minimap
    inside the HUD ring (N23), the fixed slots and the unbuilt default-action prompt (N25), the
    frame-only minimap panel (N26) and the plan entry for each deferred HUD piece (N29).
    Architecture 14 §14: a failed asset is warned about, not raised as a typed error.
  - Reference 15's appendix defines every cited ruling part (OD-11a to OD-29d) and OD-31 to
    OD-33; every OD id cited in the repository resolves there.
  - `INBOX.md` HC-B1 adds the critic's BD1, BD2 and NF1 to NF5, merged with the existing rows.
    HC-T1 lists rows T-01 to T-99: T-86 to T-90 for the critic's items, and T-91 to T-99 for ADR
    0018's own amendments, which apply only if the owner accepts it.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 606 passed (606)"; client "Tests 1220 passed (1220)", statements 95.36 %; "✓ built";
  "Checked 116 Markdown files under docs/." "Documentation check passed."
- Next step: the working ids that resolve nowhere in the repository (the DV rows and the work
  package names) wait for a ruling; then the critic's second run.

### 2026-10-25 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the pre-PR critic's rework round (lanes A and B) — feat/hud-and-character-select — sholtzman + Claude Code

- What was done (code; recorded by stream B from the orchestrator's facts and the lane reports):
  - Lane A, `fix/hud-charselect-critic-a`, 20 commits for the critic's S1, S2, N4, N5, NF3, S4,
    N9, N6, N7 and NF4: `loadDisplayContent()` takes injectable catalogues and both its
    validations are tested; the locked fourth card, the Magus's alternate-layout description and
    the team names are core display content; `main.tsx` injects the catalogue's known asset ids,
    so `game/content/` reads no `data/` module; each placed image declares its draw box on its
    manifest entry, published with the URLs, replacing five `ui/` tables (the HUD weapon art
    included); the character-select shell is split into its own files and hooks; both card rows
    share one tested focus helper, and Back returns focus to View Details in the alternate layout.
  - Lane B, `fix/hud-charselect-critic-b`, 15 commits for N10 to N16, N2, N3 and N22: derived
    selectors moved to `bridge/selectors/`; companion files renamed after their owners;
    `classNames` moved to `ui/components/`; the glow buttons' plate boxes moved into their skin
    rules; oversized files and functions split; sibling tests for `useAssetUrl`, `useStageScale`,
    `FakeViewportCanvas` and `GameCanvasChrome`; a recording `FakeSessionContext` replaces
    `spyContext`; the bridge re-exports core's `PlayableTeam` and `Team`; three constructors
    gained TSDoc. `GameCanvasChrome`'s CSS stays in `GameCanvas.module.css` (a PR note).
  - Merged into `feat/hud-and-character-select` as `751a057` (lane A), `e260398` (lane B) and
    `f529a90` (with the docs round 4b56fc6). Conflicts: `testSessionDeps.ts` and
    `FakeSessionContext` (lane B's recording fake, reading lane A's `shippedCatalogue()`), the
    `WeaponPanel.tsx` imports, and `boxes: {}` added to lane B's three tests that dispatch
    `groupUrlsChanged`.
  - Not in this round: N1 (the test fixtures still live in `bridge/`) and S3 (a separate code
    sweep of the working ids cited in code). Open gap: the one-line hook wiring
    `rovingKeyDown(actions.move)` is untested; the helper is tested.
  - Reports: `eternalus-agent-work/hud-charselect/critic/rework1/` (A1 to A4, B1 to B3), outside
    the repository. The pixel re-shoot of the merged tree was still running when this entry was
    written.
- Checks run (merged tree, as reported by the orchestrator): `npm run check` → `EXIT=0`; core
  "Tests 615 passed (615)"; client "Tests 1305 passed (1305)", statements 95.99 %.
- Next step: the pixel re-shoot result, the code sweep (S3), then the critic's second run.

### 2026-10-25 — Phase 2 / Track B (S1 carry-over) / HUD and character select, ADR 0018 accepted as corrected, the PR register and doc drift (stream B, round B6) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only):
  - The owner accepted ADR 0018 on 2026-10-24 and corrected it on 2026-10-25 (DEC-56, his words
    quoted in the decisions log): sub-classes (Legends) are MVP, and the pick ships first as setup
    data. ADR 0018 is rewritten to match, retitled "Sub-classes (Legends) are MVP" (the file keeps
    its name) and accepted. Applied, revised to match: ADR 0006's Status line; FR-057 keeps only
    mid-match class switching, and the new FR-119 (MVP) covers sub-classes and names the content
    files instead of copying the roster; architecture 04 §9 (heading too), 17 R2 and the
    architecture README's D11 row; the phase 2 and phase 4 plan items. HC-Q1 (5) is answered;
    HC-Q17 asks which phase builds sub-class gameplay. DEC-56, FR-119 and HC-Q17 were checked
    free on every local and remote ref after a fetch.
  - The unapplied patch (INBOX HC-T1) now has 89 rows: the applied ones left it, T-100 to T-102
    carry ADR 0018's id wording to `AGENTS.md`, 04 §10 and 17 R26 for the owner, and T-64, T-73
    and T-78 now say sub-classes are MVP.
  - New `docs/changelog/pr-feat-hud-and-character-select.md` (build ruling OD-35): the plan's
    deviation table DV-01 to DV-138 with final DEC numbers, the applied ADR 0018 rows, and one
    line for each working id the branch cites (249 ids, drafted from the plan's sources by two
    subagents and reviewed; 14 render-log lines are marked as restated from the asset sources,
    because that log was not recovered). A resolver script found a definition in the repository
    for every id cited on the branch's added lines (849 ids, 0 unresolved).
  - Status notes match the merged code: 02 §12 (`loadDisplayContent()` also returns the locked
    cards and the team names, with optional catalogues; `main.tsx` injects the catalogue's asset
    ids), 13 §10 and 14 §14 (draw boxes on manifest entries and in `asset-urls`), 17 §12 (the
    display names are core content, named by file).
  - Reference 15's appendix gains OD-34 to OD-36.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 615 passed (615)"; client "Tests 1305 passed (1305)", statements 95.99 %; "✓ built";
  "Checked 117 Markdown files under docs/." "Documentation check passed."
- Next step: the roster audit (B7), the owner's sign-offs (HC-T1, HC-B1, HC-C1, HC-Q17), the
  code sweep and the critic's second run.

### 2026-10-25 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the roster rows, the staff fill-in and the PR register's index (stream B, round B7) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only; the branch was first fast-forwarded to the task branch's `dfe56a0`,
  the code sweep, which touches no docs):
  - Reference 15: CD-38 registers the Magus staff in the HUD's weapon panel as a `fill-in`
    (centred at its native size in the weapon art's layout box; no Figma original exists), and the
    appendix gains OD-37, which supersedes OD-8's "stays unused" for that slot only. INBOX HC-C1
    lists CD-38.
  - The unapplied patch (INBOX HC-T1) has 95 rows. The rows that copied a display name, a title or
    a Legend name now cite DEC-48, DEC-49 or DEC-56 and point to the content files; T-65 replaces
    reference 01's eight sub-class rows with one pointer row (T-66 to T-72 merged into it). New rows
    T-103 to T-115 carry DEC-56 into reference 01, reference 10, the glossary, the naming and
    more-abilities suggestions and the post-MVP backlog, for one sign-off. HC-T1 flags T-93a, the
    applied FR-057 acceptance sentence, as agent-written. HC-Q16 points to the content file.
  - The PR register (`docs/changelog/pr-feat-hud-and-character-select.md`) names the round-4
    critic of R4-08, defines the streams, the lanes, the rounds B1 to B8 and the merged rows T-66
    to T-72, and follows the code sweep (the fixtures in `bridge/__fixtures__/`). The resolver
    found a definition in the repository for every id cited on the branch's added lines (869 ids,
    0 unresolved, on `dfe56a0` plus this round).
  - `docs/changelog/README.md` lists the register. The index still lacks the earlier PR records
    (`pr-feat-sim-kernel.md`, `pr-feat-session-shell-home.md`, `pr-feat-settings-keybindings.md`,
    `pr-feat-minion-follow-prototype.md`); they are not backfilled here.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 615 passed (615)"; client "Tests 1305 passed (1305)", statements 95.99 %; "✓ built";
  "Checked 117 Markdown files under docs/." "Documentation check passed."
- Next step: the roster audit's list of docs (B8), then the owner's sign-offs.

### 2026-10-25 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the roster audit's doc items (stream B, round B8) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only; the roster rename-friction audit and its rulings are build ruling
  OD-38, and the code fixes are a separate round):
  - The unapplied patch (INBOX HC-T1) has 122 rows. New rows T-116 to T-135 remove the remaining
    copies of class names and "post-MVP sub-classes" from the requirements, architecture 04, 05,
    17 and 18, the phase 4 plan, the backlog, reference 10 and 11, the glossary and the reference
    README, each pointing to the content files; four are optional, and T-125 (architecture 18) is
    addressed to its owner, SamarjitBhogal. T-136 to T-142 and the revised T-100 to T-102 change
    "never renamed once used" to "never renamed once a save or a release stores it"; their
    wording waits for the owner's answer to HC-Q18 (4). T-77's term is now "Flying", and T-101
    no longer quotes a stale display name. Two stale texts of the owner's are flagged in HC-T1,
    not edited (CP-13's "Why" line and phase 4's exit criterion 3).
  - Reference 15: the shipped side of the Figma's renamed Legends (§1, CD-13, CD-14, CD-26) now
    points to `packages/core/src/content/legends/specs/`; the Figma's own strings stay. The
    appendix gains OD-38.
  - INBOX: HC-F2 cites ADR 0018 point 5 (the id stays the owner's question); new HC-Q18 asks four
    decisions with recommendations (the art-id prefix guard, class id versus entity kind,
    self-naming prose, how far id permanence reaches) and notes the provenance strings and the
    asset rename.
  - The resolver found a definition in the repository for every id cited on the branch's added
    lines (900 ids, 0 unresolved).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 615 passed (615)"; client "Tests 1305 passed (1305)", statements 95.99 %; "✓ built";
  "Checked 117 Markdown files under docs/." "Documentation check passed."
- Next step: the code fixes' round and its progress entry, then the owner's sign-offs (HC-T1,
  HC-Q17, HC-Q18).

### 2026-10-26 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the roster audit's code fixes (lane B, OD-38) — feat/hud-and-character-select — sholtzman + Claude Code

- What was done (code; recorded by stream B from the orchestrator's facts and the proof in
  `eternalus-agent-work/hud-charselect/roster-audit/fixes/`, outside the repository; the audit's
  items P1 to P11 are defined in `docs/changelog/pr-feat-hud-and-character-select.md`):
  - Lane B, `fix/hud-charselect-critic-b`, 12 commits (`f23ce76`, `51b4e61`, `59c7bdc`,
    `c1671e0`, `b4637d5`, `1cc5568`, `d0be63f`, `84cf26c`, `eed8002`, `6703db0`, `cbdcb27`,
    `f896faf`), merged together with round B8 (`0b85863`) into `feat/hud-and-character-select`
    as `fcc7c85`.
  - P1: the Results screen's "X wins." and the explorer's stronghold labels read the team names
    from content.
  - P5: (a) boot fails on a presentation key with no content entry; (b) `CharacterSelectState`
    logs ERROR `client.session` for a class or Legend id the catalogue does not have and ignores
    it (`SessionContext` gained `logger`); a judgement call: a known Legend id under the wrong
    class is ignored silently; (c) `Match` logs ERROR `client.match` when core rejects the
    player's spawn.
  - P2: the content tests build their expected prose from `displayName`.
  - P3: the art-name guards read the names from content. The asset id
    `legionnaire-legend-portrait` became `warrior-legend-portrait` (4 webp files moved with
    `git mv`, 100 % similarity, the same SHA-256), the constant `LEGIONNAIRE_LEGEND` became
    `WARRIOR_LEGEND`, and the About screen's collapsed credits show the new id.
  - P4 and P7: tests read the expected names and ids from content (helpers
    `rosterNamesThatAreNotIds` and `firstAvailableSpecId` in
    `apps/client/src/game/content/__fixtures__/shippedCatalogue.ts`).
  - P11: id TSDoc in `legendSpecs.types.ts` and `lockedClasses.types.ts`. `f896faf` dropped the
    stale "ADR 0018, proposed" from two content comments.
  - Pixels: 246 of 250 shots are byte-identical to the baseline. The 4 that differ are the
    harness's own asset-check page (`check-assets-fonts`, 4 variants): the same thumbnails,
    reordered because the renamed URL sorts later, checked by eye and by the bounding box. No app
    screen changed.
  - Trial renames, before → after: a sub-class title with its Legend names, 4 failures in 3 files
    plus stale prose → 2 tests, both in `legendSpecCatalogue.test.ts`; a class display name, 3
    tests → 1; a Legend id, 16 tests in 6 files → 6 in 3 files. The Legend-id trial found that
    the new name guard flags that Legend's art ids once its id differs from its title (`INBOX.md`
    HC-Q18 (1)).
  - Disclosed for the critic: `Match.ts` has 335 lines and `buildDisplayCatalogue.ts` 304, both
    past the ~300-line guideline.
- Checks run (at `fcc7c85`, the orchestrator's log `results/verify-fcc7c85.log` in the same
  folder): `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  615 passed (615)"; client "Tests 1312 passed (1312)", statements 96.02 %; "✓ built";
  "Checked 117 Markdown files under docs/." "Documentation check passed." The id resolver: 900
  ids, 0 without a definition.
- Next step: the production live probe (running), the critic's second run, ponytail, `/verify`.

### 2026-10-26 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the roster-fix round's record, the owner's visual sign-off and two id-wording rows (stream B, round B9) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only, after fast-forwarding the docs branch to `fcc7c85`):
  - The progress entry above for the roster-fix round, from the orchestrator's facts.
  - PR register (`docs/changelog/pr-feat-hud-and-character-select.md`): the roster-fix round,
    round B9, and the audit's items P1 to P5, P7, P8 and P11.
  - Reference 15: the appendix gains OD-39 (the owner judged the visuals good enough for the
    MVP; his functional UI/UX improvements wait for Sprint 3) and OD-39a (he confirmed it on the
    current head; the Legend title centring was checked), with his words.
  - INBOX: new HC-U1 for Sprint 3 (his UI/UX list, carrying CD-25's mask, CD-30 and CD-38).
    HC-C1 records his words and that he viewed the live host; its box stays his to tick. HC-Q18
    (1) gains the trial finding (the name guard flags 7 art ids in 20 files and 1 token once
    `oracle` stops being an id), and (4) notes that the locked-class id's TSDoc already applies
    ADR 0018 point 5. HC-T1 gains T-143 and T-144 (the naming suggestions' "never change once
    used" and "never renamed once used"), which wait for HC-Q18 (4); the table has 124 rows, and
    the intro's one 104-character line is rewrapped.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 615 passed (615)"; client "Tests 1312 passed (1312)", statements 96.02 %; "✓ built";
  "Checked 117 Markdown files under docs/." "Documentation check passed." `git apply --check` on
  the unapplied patch prints nothing; the id resolver: 908 ids, 0 without a definition.
- Next step: the owner's sign-offs (HC-T1, HC-C1, HC-Q17, HC-Q18), then the critic's second run.

### 2026-10-26 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the doc side of the pre-PR critic's second run (stream B, round B10) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only; the critic's code findings are being reworked in lanes A and B):
  - PR register (`docs/changelog/pr-feat-hud-and-character-select.md`): a section for the critic's
    second run at `fcc7c85`. It records the verdict (request-changes, no blockers), each finding
    with its severity, class and where it goes, the refuted list, and build-01: the JavaScript
    bundle grew from 385.94 kB at base to 666.44 kB, partly from 62 inlined images. It also holds
    the notes for the pull request's description and the merge preconditions.
  - INBOX HC-T1: a note at its top splits the rows. Group (i) is 47 rows that only record the
    owner's decisions or align `apps/client/AGENTS.md` with the approved design; it is the merge
    precondition the critic asked for, and its patch also applies on its own. Group (ii) needs his
    judgement. Nothing is ticked. New row T-145 schedules the replacement of the interim "Leave
    cathedral" control in Phase 2, sprint 2.8 (register CD-22). T-32, T-36, T-41 and T-43 add the
    manifest entry's draw box and the bridge's shared HUD layout geometry, and T-79, the drafted
    architecture 08 status note, now names `createBrowserMatch` and `MatchHost`. The table has 125
    rows.
  - INBOX: HC-Q7 (1) names FR-111 and asks for the terms of the art tools, a merge precondition;
    new HC-Q19 asks about the minimap's click intent, its visibility setting and the M key.
  - Architecture 13 §10 (the branch's status note): the Session bullet names the uncaught
    `Simulation.step()` exception and Phase 6, sprint 6.4; shield segments and the `default-action`
    prompt point at Phase 4, sprint 4.7; the `toggle-minimap` binding has no handler (HC-Q19).
  - Architecture 08 gains no note directly: an earlier one was removed so that 08 stays unchanged
    until the owner approves its note (`fb310c6`), so the note stays HC-T1 row T-79.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 615 passed (615)"; client "Tests 1312 passed (1312)", statements 96.02 %; "✓ built";
  "Checked 117 Markdown files under docs/." "Documentation check passed." `git apply --check`
  prints nothing for the whole patch and for group (i) alone; the id resolver: 913 ids, 0
  without a definition.
- Next step: the next round, with the rework's facts; the owner's sign-off of HC-T1 group (i)
  and his answer to HC-Q7 (1).

### 2026-10-26 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the rework of the pre-PR critic's second run (lanes A and B) — feat/hud-and-character-select — sholtzman + Claude Code

- What was done (code; recorded by stream B from the orchestrator's facts and the evidence in
  `eternalus-agent-work/hud-charselect/critic/run2/rework/`, outside the repository; the finding
  ids are defined in `docs/changelog/pr-feat-hud-and-character-select.md`):
  - Lane A, `fix/hud-charselect-critic-a`, 7 commits, merged as `6b84d64`: the `accessibleNames`
    tests moved beside their file (`3244c4d`, ui-screens-06); `legendStepState.shownLegend`
    extracted and tested (`c2b1182`, ui-screens-01); one "No data yet" string and the template
    `STRINGS.noDataFor(label)` replace two strings (`c0a1713`, ui-screens-07); the selection cards'
    props types in companion files and a shared `previewHandlers.ts`, the card functions now 66 and
    61 lines (`8a6eb2f`, ui-screens-08); `cssRule` throws on a missing selector, with
    `hudTestSupport.test.ts`, and its 21 callers pass (`3140a5f`, ui-hud-components-assets-07);
    `bindLatestActionShortcut`, tested in Node, and the unused `isEnabled` dropped (`e450fa0`,
    ui-hud-components-assets-06); the glow buttons' chrome plates placed at their manifest draw
    boxes, with `BOXED_CHROME_PLATES` and the literal CSS boxes deleted (`7c8d70b`,
    ui-hud-components-assets-01). Disclosed: one test was inverted on purpose, because a plate's
    box now belongs to the plate; the chrome image gains inline CSS custom properties, runtime
    values from the manifest, as `WeaponPanel` does.
  - Lane B, `fix/hud-charselect-critic-b`, 10 commits, merged as `66482f4`: a roster fact dropped
    from a TSDoc (`8893235`, core-bridge-11); a size pin replaced by a comparison with
    `LEGEND_SPECS.all()` (`a2e825b`, core-bridge-10); the `SpecDetailNames` export dropped
    (`b90d942`, core-bridge-04); the profile screen's display name moved into core content,
    `content/profile/profileDisplayName.ts`, through `loadDisplayContent()` (`61401b2`, `e93e61e`,
    game-data-02); `LegendSpecDefinition.isSelectable`, true for every Legend today, replaces the
    client presentation's status (`c17e116`, `4dfb446`, game-data-03); the HUD mirror's TSDoc gives
    its real reason (`6b2e4a6`, core-bridge-06); `GameCanvasChrome.module.css`, with the built CSS
    byte-identical once class names are normalised (`63a9de1`, game-data-07);
    `assetsInlineLimit: 0` with `vite.config.test.ts` (`dc5bdfa`, build-01): 666.44 → 557.09 kB,
    gzip 242.72 → 174.14 kB, data URIs 62 → 0, image files emitted 99 → 152.
  - Tests: core 615 → 617, client 1312 → 1331; no assertion dropped (per-file counts in each
    lane's notes).
  - Pixels: 246 of 250 shots byte-identical to the baseline. The 4 that differ are the harness's
    asset-check page (`check-assets-fonts`, 4 variants), byte-identical to the shots verified in
    the roster-fix round. The shoot reported "worktree untouched: NO"; the only files it changed
    were 36 gitignored TypeScript build outputs, and no tracked file changed.
- Checks run (at `66482f4`, the orchestrator's log `results/verify-66482f4.log` in the same
  folder): `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  617 passed (617)"; client "Tests 1331 passed (1331)", statements 96.3 %; the JavaScript bundle
  557.32 kB (gzip 174.19 kB); "✓ built"; "Documentation check passed." The id resolver: 913 ids,
  0 without a definition.
- Next step: the ponytail review (running) and its cuts, the critic's delta check, the final
  check and the live probe.

### 2026-10-26 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the record of the critic's second-run rework (stream B, round B11) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only, after fast-forwarding the docs branch to `66482f4`):
  - The progress entry above for the rework round, from the orchestrator's facts.
  - PR register: each reworked finding of the second run names its commit; build-01's outcome (no
    image inlined; the bundle at 557.32 kB, still over Vite's 500 kB warning from code growth);
    the rework's test totals and pixel proof; the N22 definition now says the control's CSS has
    its own module.
  - Status notes: architecture 02 §12 names `content/profile/profileDisplayName.ts` and
    `LegendSpecDefinition.isSelectable`; 17 §12's display-name bullet adds the profile screen's
    name; 14 §14 says the build inlines no asset, so each group's bytes load with the group.
  - INBOX: HC-T1 gains T-146, FR-090's acceptance (the profile screen's display name lives in
    core content, not `ui/`), in group (i) because its basis is rule 11 (48 rows in group (i), 126
    in the table); new HC-Q20 on the bundle size, to decide in Sprint 3.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 617 passed (617)"; client "Tests 1331 passed (1331)", statements 96.3 %; "✓ built";
  "Checked 117 Markdown files under docs/." "Documentation check passed." `git apply --check`
  prints nothing for the whole patch and for group (i) alone; the id resolver: 917 ids, 0
  without a definition.
- Next step: the next round after the ponytail cuts and the critic's delta; the owner's sign-off
  of HC-T1 group (i) and his answer to HC-Q7 (1).

### 2026-10-26 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the ponytail cuts, the critic's delta re-check and the final check (pre-PR gate steps 2 and 3) — feat/hud-and-character-select — sholtzman + Claude Code

- What was done (code in lanes A and B; recorded by stream B in round B12 from the orchestrator's
  facts and the evidence in `eternalus-agent-work/hud-charselect/{ponytail,critic/delta,results}/`,
  outside the repository; the cut and finding ids are defined in
  `docs/changelog/pr-feat-hud-and-character-select.md`):
  - Ponytail (ADR 0010, level lite): four area reviewers proposed 20 cuts; a skeptic per area
    accepted 19 and rejected pt-ui-hud-components-1 (a shared screen-reader-only stylesheet would
    belong to no component, against ADR 0002). The orchestrator added pt-orch-1, the second pin of
    the class ids in `loadDisplayContent.test.ts`. Lane A (`ui/`, 10 commits, `b45b295` to
    `98f9ab2`, net −84 lines) merged as `30329db`; lane B (core, bridge, game and data, 10 commits,
    `cc8ff8c` to `09a86ab`, net −64 lines) merged as `a9e8295`. Net −148 lines.
  - Tests unchanged in number (core 617, client 1331); every changed test file keeps its number of
    tests and expectations; one expectation changed on purpose (pt-orch-1).
  - Pixels at `a9e8295`: 246 of 250 byte-identical to the baseline; the 4 that differ are the
    known reorder on the harness's asset-check page, byte-identical to the shots verified in the
    roster-fix round. "Worktree untouched: NO" was 3 gitignored build outputs only.
  - Live probe at `a9e8295`: the development build passes every criterion, with its long-frame
    check during character select information only (OD-30); the production build passes every
    criterion, that one included. The in-match check confirms pt-game-data-1 in a real browser.
  - The critic's delta re-check (`fcc7c85` to `a9e8295`): request-changes only because owner
    items remain (C-01 and core-bridge-01 through `INBOX.md` HC-T1 group (i); HC-Q7 (1) for C-02
    and ui-hud-components-assets-04). Every upheld run-2 code violation is closed, and the delta
    adds no code violation. New: d-core-game-bridge-01 (acceptable: three public API changes of
    `@eternalus/core` to call out in the pull request) and C-03 (this entry). Refuted: d-ui-01.
  - Round B12 (docs): the PR register gains the ponytail table, the delta verdict, the API note
    and the remaining merge preconditions; `INBOX.md` HC-Q20 gives the bundle size at `a9e8295`.
    The pull request's description is drafted outside the repository
    (`eternalus-agent-work/hud-charselect/streams/docs/PR-DESCRIPTION.md`).
- Checks run: step 3 at `a9e8295` (the orchestrator's log `results/verify-a9e8295.log`):
  `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 617
  passed (617)"; client "Tests 1331 passed (1331)", statements 96.3 %; the JavaScript bundle
  556.27 kB (gzip 173.96 kB); "✓ built"; "Documentation check passed." Round B12's docs commit:
  `npm run check` → `EXIT=0` with the same test totals, "Documentation check passed.";
  `git apply --check` prints nothing for the whole patch and for group (i) alone; the id
  resolver: 919 ids, 0 without a definition.
- Next step: the owner's sign-off of HC-T1 group (i) and his answer to HC-Q7 (1), the merge
  preconditions; then the pull request opens with the drafted description.

### 2026-10-27 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the doc side of the /pr-review before the merge (stream B, round B13) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only, on `a171761`; the review's finding ids are defined in the PR register's
  new `/pr-review` section, `docs/changelog/pr-feat-hud-and-character-select.md`):
  - The `/pr-review` (six areas and a skeptic, at `a171761`): request-changes, no blocker upheld.
    The register records the verdict, the failing checklist items, every finding's handling, the
    owner items, the items not changed with their reasons, and an integration recipe for the merges
    with the nine sibling pull requests. HC-B1 joins the merge preconditions. The code repairs are
    in progress in other worktrees.
  - Reference 12: OQ-03's status says MVP (DEC-56) with the phase open (HC-Q17). The Phase 6 plan is
    back to its base text: its UI enhancements task line waits as `INBOX.md` HC-T1 T-152 until
    HC-S5 is answered, and the UI enhancements plan says the task is unscheduled.
  - HC-T1 gains T-147 to T-151 in group (i) (the naming suggestions record DEC-48; the D11 row
    records ADR 0018) and T-152 in group (ii): 132 rows, 53 in group (i).
  - Proposed for the owner: ADR 0019 (DEC-50) and ADR 0020 (the client test configuration), both
    in the decisions index; new `INBOX.md` HC-Q21 (the merge order) and HC-Q22 (the HUD's weapon art
    against `feat/weapons`). The pull request's description is rewritten to the template, outside
    the repository.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  617 passed (617)"; client "Tests 1331 passed (1331)"; "✓ built"; "Checked 119 Markdown files
  under docs/." "Documentation check passed." `git apply --check` prints nothing for the whole
  patch and for group (i) alone; the id resolver: 935 ids, 0 without a definition.
- Next step: the code repairs' commits (recorded in a later round); the owner's answers to the merge
  preconditions (HC-T1 group (i), HC-Q7 (1) and (3), HC-B1), ADR 0019 and ADR 0020, and HC-Q21.

### 2026-10-27 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the resumed check of round B13 (stream B's successor) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only, on `5e2a00e`; a resumed run of round B13, whose first run was
  interrupted during its final checks): every round-B13 item was checked against `c3ffd28` and
  `5e2a00e` and found in place. The D2b patches regenerate byte-identical from the committed tree
  (132 rows over 35 files; group (i) 53 rows over 18 files), and the inline HC-T1 table matches the
  generated one row for row. HC-Q21, HC-Q22, T-147 to T-152 and the ADR numbers 0019 and 0020
  appear on no other local or remote ref after a fetch.
  - PR register, merge preconditions: the HC-T1 group (i) bullet now notes 53 rows since the
    `/pr-review` (the critic's 48 kept), and the HC-Q7 bullet adds (3), the wording of the owner's
    credit (pr-ui-hud-components-assets-03), as the description and the owner items already said.
  - `INBOX.md`: HC-B1 says it is now a merge precondition (pr-docs-process-09), and HC-Q7 says its
    (3) goes with (1) before the merge.
  - Outside the repository, the pull request's description: a note on the title, and the body now
    starts at the template's "Summary"; the test cases are recounted with a script kept beside it
    (773 at the base, 1,608 at `a171761`, each `it.each` call counted once; the first run's grep
    gave 766 and 1,596); the code repairs are mentioned only as in progress.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  617 passed (617)"; client "Tests 1331 passed (1331)"; "✓ built"; "Checked 119 Markdown files
  under docs/." "Documentation check passed." `git apply --check` prints nothing for the whole
  patch and for group (i) alone; the id resolver: 935 ids, 0 without a definition.
- Next step: unchanged from round B13: the code repairs' commits (a later round); the owner's
  answers to the merge preconditions (HC-T1 group (i), HC-Q7 (1) and (3), HC-B1), ADR 0019 and
  ADR 0020, and HC-Q21.

### 2026-10-27 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the /pr-review's code repairs and their review (stream B, round B14) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (code in lanes A and B and one follow-up; recorded by stream B from the evidence in
  `eternalus-agent-work/hud-charselect/pr-review/`, outside the repository; the finding ids are
  defined in the PR register's `/pr-review` section,
  `docs/changelog/pr-feat-hud-and-character-select.md`):
  - Lane A, merged as `a632723`: `14d90cd` (pr-ui-hud-components-assets-01: `usePauseOverlayFocus`
    and 7 tests), `c3290dd` (pr-ui-screens-02: sibling tests for `useClassSelectStep`, 6, and
    `useLegendSelectStep`, 5; `onCardKeyDown` typed as `ReturnType<typeof rovingKeyDown>`),
    `90f915a` (-04) and `c0ec551` (-05). Lane B, merged as `932c7c7`: `2fbe59b` (pr-game-data-04),
    `2a58d2d` (pr-game-data-03: progress reported once per entry, still monotonic), `42bb212`
    (pr-ui-screens-04: `RoleRatingRangeRule`), `1853e14` (pr-core-bridge-03) and `b918397` (the
    code part of pr-docs-process-06). Every new or changed test went red first.
  - The repairs' review (one reviewer and a skeptic, `a171761` to `932c7c7`): no blocker; rd-01,
    this record, upheld as should-fix; the nits rd-02 to rd-04 fixed in `76bae8e`, `71a5b24` and
    `7166412`, and `c72266b` caches an entry before its rendition warnings (red, then green).
  - Docs: the register marks each repaired finding with its commit, records the review, and its
    integration recipe keeps four imports in `defaultContentRules.ts`; 14 §14's status note records
    the per-entry progress and the retired rejected load. HC-T1 gains T-153 (group (ii): 14 §11's
    "ends at the manifest sum" holds only when every file loads) and T-154 (group (i): DEC-49's file
    list names `RoleRatingRangeRule.ts`): 134 rows, 54 in group (i).
- Checks run: at `c72266b` (the orchestrator's log `pr-review/check-c72266b.log`): `npm run check`
  → `EXIT=0`: core "Tests 619 passed (619)"; client "Tests 1357 passed (1357)", statements
  96.45 %; the JavaScript bundle 556.61 kB (gzip 174.04 kB); "Documentation check passed." Live
  probe at `c72266b`: development ALL PASS (its long-frame check information only, OD-30),
  production ALL PASS. Pixels at `932c7c7`: 246 of 250 byte-identical, the 4 others the known
  asset-check page reorder. This round's docs commit: `npm run check` → `EXIT=0`: "All matched
  files use Prettier code style!"; core "Tests 619 passed (619)"; client "Tests 1357 passed
  (1357)"; "✓ built"; "Checked 119 Markdown files under docs/." "Documentation check passed."
  `git apply --check` prints nothing for the whole patch and for group (i) alone; the id
  resolver: 938 ids, 0 without a definition.
- Next step: the owner's decisions (ADR 0019, ADR 0020, HC-Q21, HC-Q22, HC-B1, squash or merge
  commit, HC-T1 group (i), HC-Q7 (1) and (3)), then the pull request.

### 2026-10-27 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the ponytail review's doc cuts before the merge (stream B, round B15) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only, on `b783682`; the second review round's ponytail findings pc-03 to
  pc-06 and the plan part of pc-07, in `eternalus-agent-work/hud-charselect/pr-review/`, outside
  the repository):
  - pc-03: ADR 0019 and ADR 0020 have short titles like the other ADRs ("0019. SessionController
    owns the Match", "0020. Client test configuration"); their descriptions keep the detail. The
    regenerated `docs/README.md` index now differs from `a171761` by the two new rows only.
  - pc-04: in the D2b generator, HC-T1 row T-152 loses the basis note that the prose above the
    table already gives and gets a shorter "Branch says" cell; T-153 and T-154, added in round
    B14, were also wider than their columns and are shortened too. No cell is wider than its
    column at `a171761`, so the inline table differs from `a171761` by its eight new rows only
    (T-147 to T-154). The two patches are unchanged.
  - pc-05: the PR register's owner items point to the merge preconditions instead of repeating
    them, and the findings rows pr-docs-process-07 and -09 say "(above)", where the list is.
  - pc-06: the register's "Not changed" entry for pr-ui-hud-components-assets-06 points to ADR
    0020's Consequences, which keeps the reasons.
  - pc-07: the UI enhancements plan's Related line no longer repeats §1's "unscheduled".
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  619 passed (619)"; client "Tests 1357 passed (1357)"; "✓ built"; "Checked 119 Markdown files
  under docs/." "Documentation check passed." `git apply --check` prints nothing for the whole
  patch and for group (i) alone; the id resolver: 936 ids, 0 without a definition.
- Next step: unchanged from round B14: the owner's decisions (ADR 0019, ADR 0020, HC-Q21, HC-Q22,
  HC-B1, squash or merge commit, HC-T1 group (i), HC-Q7 (1) and (3)), then the pull request.

### 2026-10-27 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the owner's critic loop and its fixes (stream B, round B16) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (code on `fix/hud-charselect-critic-b`, merged into the task branch, and docs on
  this branch; recorded by stream B from the evidence in
  `eternalus-agent-work/hud-charselect/pr-review/`, outside the repository; the finding ids and
  rounds B15 and B16 are defined in the PR register's section "The owner's critic loop",
  `docs/changelog/pr-feat-hud-and-character-select.md`):
  - The loop: two critics in parallel, correctness and ponytail, for two rounds at most. Round 1
    (`a171761` to `df70ab5`): both approve; cc-01 should-fix, cc-02 to cc-04 and pc-01 to pc-07
    nits. Round 2 (`df70ab5` to `be4aca3`): both approve; every accepted round-1 finding fixed,
    cc-03 and pc-01 in part; new cc2-01 (should-fix), cc2-02, cc2-03, pc2-01 and pc2-02. The loop
    stops after round 2, so these were fixed without a third round.
  - Round 1's findings: cc-01 fixed in round B14 (`b783682`); cc-02 in `eade1c2` (`freeAll` and
    `release(group)` go on past a throwing release and rethrow the first error; red before the fix
    (2 tests) and with either half reverted); cc-03 in part in `4bbe7e8` (an exported, tested
    `isOverlayOpen`; red on the break `overlay === 'pause'`), the effect's dependency array staying
    out of reach of the Node-only tests; cc-04 in `8439831` (TSDoc); pc-01 in `289f793`, then
    `6750f03`; pc-02 rejected: `StructureStrip`'s `SIDE_CLASS` record matches its sibling
    variant-to-class records, the registry style of `AGENTS.md` rule 12, for about 6 lines; pc-03 to
    pc-06 in round B15 (`66eca5e`, `b1f7121`, `6e838a6`, `8765a16`); pc-07 in `0c05712` (the TSDoc)
    and in round B15 (`6cfabc8`, the plan). The five code commits (`eade1c2`, `8439831`, `4bbe7e8`,
    `0c05712`, `289f793`) merged as `be4aca3`, with 3 new client tests.
  - Round 2's findings: pc2-01 fixed in `6750f03` (`radioGroup` moved into `ui/testStore.tsx` and
    the second builder deleted; the test count unchanged; a deliberate break turned 4 tests red);
    cc2-01 and cc2-02 in this round (this entry, and the register's new section, which defines the
    loop's ids and rounds B15 and B16); cc2-03 by the correction at the end of this entry; pc2-02 in
    this round (14 §14's status note keeps one sentence on progress, the one HC-T1 T-153 depends on,
    without commit hashes).
- Checks run: at `be4aca3` (the coordinating session's log `pr-review/check-be4aca3.log`):
  `npm run check` → `EXIT=0`: core "Tests 619 passed (619)"; client "Tests 1360 passed (1360)",
  statements 96.47 %; the JavaScript bundle 556.75 kB (gzip 174.10 kB); "Documentation check
  passed." Live probe at `be4aca3`: development ALL PASS (its long-frame check information only,
  OD-30), production ALL PASS. This round, on the final code (`6750f03`) with this round's docs:
  `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 619 passed
  (619)"; client "Tests 1360 passed (1360)", statements 96.48 %; the JavaScript bundle 556.75 kB
  (gzip 174.10 kB); "✓ built"; "Checked 119 Markdown files under docs/." "Documentation check
  passed." `git apply --check` prints nothing for the whole patch and for group (i) alone; the id
  resolver: 937 ids, 0 without a definition.
- Next step: unchanged from round B14: the owner's decisions (ADR 0019, ADR 0020, HC-Q21, HC-Q22,
  HC-B1, squash or merge commit, HC-T1 group (i), HC-Q7 (1) and (3)), then the pull request.
- Correction (cc2-03; round B14's entry is not rewritten): `90f915a` and `c0ec551` in round B14's
  entry are pr-ui-hud-components-assets-04 and -05.

### 2026-10-27 — Phase 2 / integration — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: fetched origin and merged origin/phase/2-sprint-2-work at 230a330 into the
  existing map branch at 1f7295a using --no-commit --no-ff, as requested by the owner. The only
  conflict was in this progress log; preserved both histories. All source changes merged
  cleanly, including the client test fixture's new Legend progression/aether fields. Existing
  map presentation, mirrored seeded scenery and roof cutaways were preserved; no new
  dependencies or unrelated changes were introduced.
- Checks run: npm run check:quick passed. npm run check passed in full, exit 0: formatting,
  no-JS, lint, typecheck, knip, coverage, production build and docs. Core 597/597 tests and
  client 429/429 tests pass. Knip retains its existing configuration hint only. Verbatim tail:
  Checked 113 Markdown files under docs/.
  Documentation check passed.
  git diff --check and git diff --cached --check passed; no unmerged index entries remain.
- Next: review and commit the resolved merge, then push when authorized. The merge is left
  pending and uncommitted, so GitHub and HEAD do not include Phase 2 until the merge commit
  is made. No commit, push or PR action performed.

### 2026-10-25 — Phase 2 / sprint 2.2 — feat/minion-m1-marching (merge of phase 2) — SamarjitBhogal + Claude Code

- What was done: merged `origin/phase/2-sprint-2-work` (`230a330`: PRs #31, #34, #35, #36) into
  PR #38's branch. 12 conflicts. `defaultStrategyRegistry.ts` now holds both the `movement` and
  `attack` keys (claudiodh's note on #38). `DefaultSystemPipeline` takes the phase branch's
  required `state` and progression content, plus this branch's optional horde wiring; the order is
  hordes → status effects → movement → pathing → combat → progression → spawn → death →
  invariants, pinned by its test. The PROTO-01 pieces the phase branch still carried (the `decide`
  hook, `Brain` on `Unit`, the escort test definition, `EntityStore.positionOf` / `isSteering` /
  `controllerOf`) stay deleted; `isAlive`, `setAttackTarget` and `teamOf` stay for combat. The
  medium and heavy minions get `xpValue` 45 and 120 (`balancing.md` "XP sources"), now required.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 609 passed (609)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: carry this merge into #39 (M2a) and #40 (M4).

### 2026-10-25 — Phase 2 / sprint 2.2 — feat/minion-m2a-brains-perception (merge of M1 and phase 2) — SamarjitBhogal + Claude Code

- What was done: merged the updated `feat/minion-m1-marching` (`68a6e31`, which carries
  `origin/phase/2-sprint-2-work` at `230a330`) into PR #39's branch. 8 conflicts. The pipeline
  keeps M1's merged signature and adds this branch's AI and neighbour index to the `hordes`
  wiring: ai → hordes → status effects → movement → space → pathing → combat → progression →
  spawn → death → invariants, pinned by its test. `Unit` installs `StatusEffects`, `Combat` and
  `ControllerBinding`; `UnitDefinition` keeps `attack` beside `controller: ControllerId` and
  `aiProfile`; `EntityStore` keeps `teamOf`, `isAlive`, `setAttackTarget` and `controllerOf`;
  the invariant runner lists `horde-membership-consistent` beside the combat and progression
  invariants; `Simulation.defaultContent` passes the level curves through.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 633 passed (633)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: merge #38, then this PR.

### 2026-10-25 — Phase 2 / sprint 2.2 — docs/minion-plan-all-enemy-ai (off feat/minion-m2a-brains-perception) — SamarjitBhogal + Claude Code

- What was done: on SamarjitBhogal's request, the minion plan now plans for enemy bots of every
  entity type. Doc 18 gets MS-28 (proposed; MS-3 marked superseded), camp mobs and checkpoint
  defenders in its entity legend, a new §7.1 (both are leashed guards that reuse
  `GuardController` with a camp or capture point as home), a test line, a "scheduled here,
  designed elsewhere" note for bosses, the Rover, the bot tree and A\*, and open question 4. The
  plan gets phases M6 (camps and checkpoint defenders), M7 (bosses) and M8 (Rover, A\*, bot
  ability use), their PR rows, and a §1.1 coverage table listing every AI-driven entity with its
  controller, design doc and build phase (turrets stay in Phase 2 sprint 2.3). Pointers in doc 11
  §4, doc 07 §7 and the Phase 3 plan. Because DEC-47 (sholtzman) kept camps, checkpoint spawns,
  A\* and the Rover in Phase 3, the change is marked proposed and an `INBOX.md` item asks for
  sign-off and for the checkpoint defenders' team and leash.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 633 passed (633)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: owner sign-off on the INBOX item; merge after #39 (this branch is cut from M2a).

### 2026-10-25 — Phase 2 / sprint 2.2 — docs/minion-plan-all-enemy-ai (review fixes) — SamarjitBhogal + Claude Code

- What was done: `/pr-review` on `13553b0..4f0feab` requested changes with four should-fixes,
  all applied. (1) The new rows of doc 18's decision and entity tables and the plan's phase table
  are now as wide as the existing columns, so Prettier no longer reflows the untouched rows (the
  phases are renamed M6 Camps, M7 Bosses, M8 Rover, and the entity row "Zone defender"). (2)
  `camp-cleared` is not in 03's event catalogue: §7.1 now says M6 adds it, with `SpawnSystem` as
  the emitter only a `Recommendation:`. (3) Doc 07 §7 marks the defenders' `GuardController`
  holding as proposed (MS-28). (4) M7 is also blocked by M3, since its done-when fights bot
  Legends.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 633 passed (633)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: draft PR to `phase/2-sprint-2-work`, merged after #39; the owner answers the MS-28
  INBOX item.

### 2026-10-25 — Minion system M2b (minion controller) — feat/minion-m2b-minion-controller (off docs/minion-plan-all-enemy-ai) — SamarjitBhogal + Claude Code

- What was done:
  - **Contract:** `Controller.decide` takes one `DecisionInput` (state, id, brain, perception) and
    returns `{ commands, memory, rngState }`; `AiSystem` writes the brain back (SamarjitBhogal's
    answer to the M2a INBOX item, doc 11 §2 updated). `AiSystem` owns one `Perception`.
  - **`MinionController`** (18 §6.1): `marching → engaging → returning → marching`, acquiring by
    priority, then distance, then id; switching only to a strictly better rank; ending a chase on
    death, leash or aggro duration with one `stop`; re-forming within `reformDistance` of its slot
    with an aggro cooldown. Registered in `defaultControllerRegistry`, with its content injected
    by `Simulation` (aggro rules, formations, kind classes through the new `KindSet.hasKind`).
  - **Shared ranking helper** `ai/aggroRank` (MS-27) over 11 §4.3's priority list.
  - **Content:** `content/ai/aggro/` (`lane-minion`: League/Dota numbers scaled by minion speed,
    all `TUNE`); the three minions get `controller: 'minion'`, `aiProfile: 'lane-minion'` and
    their `balancing.md` attacks (12 / 1.0 s, 28 / 1.2 s, 70 / 1.6 s; reach 1.5 m as the
    Warrior's, `TUNE`).
  - **Movement:** `PathingSystem` chases a member's attack target and stops at attack reach
    (`MovementContext.arrivalRadius`); slots come from the new `state/formationSlot`, which the
    controller also uses. `HordeSystem` holds the anchor while the leader has a target.
  - **`stop`** clears the attack target too (MS-26), through `EntityStore.clearAttackTarget`;
    `EntityStore.attackTargetOf` is new.
  - **Tests:** every FSM transition, the ranking helper, chase and anchor hold, `stop`, and two
    match scenarios: opposing opening hordes fight with kills on both sides and clean invariants,
    and the same seed gives the same hash tick for tick. The M1 marching scenarios run with
    minions that cannot fight.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 655 passed (655)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: the pre-PR gate, then M3 and M5a off this branch.

### 2026-10-25 — Minion system M2b, pre-PR gate — feat/minion-m2b-minion-controller — SamarjitBhogal + Claude Code

- What was done: the critic (`architecture-reviewer`, `7a87de1..35b4361`) approved with five
  should-fixes, all applied: AI profiles are checked at `Simulation` construction
  (`Controller.hasProfile`, `AiSystem.assertRegistered`); `aggroRank` takes an options object
  (four-parameter limit); one `FORMATIONS` record feeds `PathingSystem` and the controller; doc
  11 §1 and §8 show the new contract, and §10 records the profile and constructor-injection
  stand-ins. Nits applied: shared ranking types in `aggroRank.types.ts`, the kind classifier as
  content (`content/ai/unitClasses.ts`, with a turret stand-in row in the plan), no array
  allocation while returning, TSDoc for `arrivalRadius`, the fight test derives its counts from
  config. Two better-than-design items (the chase in `PathingSystem`, `state/formationSlot`),
  constructor injection and the scaled aggro numbers are an `INBOX.md` item. Not changed:
  `AiSystem` still creates its own `Perception` (accepted). Ponytail (lite): `FRESH_MINION_MEMORY`
  deleted, `formationSlot` returns early for the leader.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 657 passed (657)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: draft PR; M3 (bot laners, roster option chosen by SamarjitBhogal) and M5a off this
  branch.

### 2026-10-25 — Minion system M3 (bot laners) — feat/minion-m3-bot-laners (off feat/minion-m2b-minion-controller) — SamarjitBhogal + Claude Code

- What was done:
  - **Roster** (SamarjitBhogal's choice): `SimulationOptions.roster` lists the bot Legends (team,
    class, `laner` or `rover`, difficulty); `Simulation` spawns them when the match is built, at
    their own end of their lane in ranks, after checking each controller and difficulty exists.
    `RosterSlot` is exported (API addition). The client's `useMatch` passes a placeholder roster
    of nine bot laners per team (the player is their team's Rover, DISC-51).
  - **Lanes** (18 §8, MS-20): `state/assignLanes` fills each team's lanes evenly in roster order,
    fewest Legends first, lowest index on a tie.
  - **Per-entity controller:** `Placement.controller` (`ControllerSpawn`) overrides the
    definition's controller and gives the brain its starting memory (the lane);
    `SpawnContextReader` validates it; `AiSystem` starts brains from it.
  - **`BotLegendController`** (11 §4.2): the `laner` tree (`Survive`, `Fight`, `Push`,
    `Regroup`) on a small `ai/bt/` node library and `ai/utility/` scorer; difficulty content in
    `content/ai/difficulties/` (`TUNE`, no reference values), retreat points in
    `content/ai/botLaner.ts`. `EntityStore` gains `healthFractionOf` and `isInReach`, which
    `CombatSystem` now uses too.
  - **Tests:** each branch of the tree, the node library, the scorer, lane assignment, the
    spawn's controller, and match scenarios: the roster spreads over the lanes, bots push with
    their hordes the same way twice, and bad rosters fail at construction.
  - INBOX: bot numbers and base healing. Stand-ins in plan §3.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 676 passed (676)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: the pre-PR gate.

### 2026-10-25 — Phase 2 / sprint 2.2 — feat/minion-m4-flow-fields (merge of M1 and phase 2) — SamarjitBhogal + Claude Code

- What was done: merged the updated `feat/minion-m1-marching` (`68a6e31`, which carries
  `origin/phase/2-sprint-2-work` at `230a330`) into PR #40's branch. 2 conflicts: this log (both
  sides kept) and `DefaultSystemPipeline`, which keeps M1's merged signature and order and builds
  the lane flow fields only when the horde wiring is passed and the match has a map, handing them
  to `PathingSystem` as before.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 631 passed (631)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: merge #38 and #39, then resolve this PR's overlap with M2a (see the PR's merge order).

### 2026-10-25 — Minion system M8 setup (merge of M4) — feat/minion-m8-rover-astar (off feat/minion-m3-bot-laners) — SamarjitBhogal + Claude Code

- What was done: M8 needs M3 and M4, so this branch merges `feat/minion-m4-flow-fields`
  (`9cb64a0`, PR #40) into M3. That resolves the overlap #40 records with M2a: the movement
  context keeps M2b's `arrivalRadius` and gains M4's `flow`; `LaneFollowMovementStrategy` checks
  arrival against the context, follows the field when the line to its target is blocked and uses
  M2a's `queryCircle`; `PathingSystem` keeps M2a/M2b's shape (neighbours from `state.space`, the
  shared slot function, the chase) and takes the flow fields as a fourth parameter, rebuilding
  them within the cell budget. M4's routing scenarios run with minions that cannot fight.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 698 passed (698)"; client "Tests 416 passed (416)"; "Documentation check passed."
  The generated-map hash scenario gets the 60 s timeout the other long M4 scenarios have.
- Next step: M8 itself (Rover, A\* for Legends, bot ability use).

### 2026-10-25 — Minion system M3, pre-PR gate — feat/minion-m3-bot-laners — SamarjitBhogal + Claude Code

- What was done: the critic (`architecture-reviewer`, `0b59134..1eec4f4`) requested changes with
  one blocker, fixed: `legendsPerLane` was never read. `assignLanes` now fills lanes up to it and
  throws when a team's laners do not fit, and `Simulation` assigns every lane before it spawns
  anything. Should-fixes applied: a bot that heals is shown playing its lane again (a `move`
  back to the lane, no `stop`); `Regroup` returns to the nearest point of the bot's lane (11 §4.2,
  "the lane corridor") instead of its own end; an invalid `Placement.controller` throws instead
  of silently falling back; `placeholderRoster` has its own client file and test. Nits applied:
  `ControllerId` derives from `CONTROLLER_IDS`, `ControllerSpawn` sits beside `Placement`,
  retreat points tie-break by id, one test file per class, the condition-notes convention is
  documented on `BtNode`, doc 18 says roster order. Accepted: `assignLanes` in `state/` (beside
  `formationSlot`), retreat arrival measured to the structure's centre while structures are map
  features. Ponytail (lite): lean already, no cuts.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 679 passed (679)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: critic re-check, draft PR; M8 merges these fixes.

### 2026-10-25 — Minion system M3, critic re-check — feat/minion-m3-bot-laners — SamarjitBhogal + Claude Code

- What was done: the critic re-check (`1eec4f4..c2d9d1e`) approved: the blocker and should-fixes
  are fixed. Its remaining items applied: `Placement`'s TSDoc is back on it; a plan §3 stand-in
  records that no lane counts a human laner while the human is always the Rover (DISC-51);
  roster order over 18 §8's id order is an INBOX sign-off item; `spawnRoster` hands each spawn to
  a small `spawnBot`; the retreat tie-break by id has a test.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 680 passed (680)"; client "Tests 416 passed (416)"; "Documentation check passed."

### 2026-10-25 — Minion system M5a (MVP modifiers) — feat/minion-m5a-modifiers (off feat/minion-m2b-minion-controller) — SamarjitBhogal + Claude Code

- What was done:
  - **Strength by distance** (MS-16, DISC-24): `combat/MinionStrengthStep`, a damage step after
    `StatusModifierStep`: a horde member's hits × `m(t)` and hits on it ÷ `m(t)`, with
    `m(t) = clamp(1 + k(1 − 2t), min, max)` over its lane progress; Legends and non-horde units
    are 1. Content `content/mobs/minionModifiers.ts` (`balancing.md` k 0.5 and max 1.5; min 1.0
    because DISC-24 makes it an addition on top of base stats; INBOX asks to confirm, and how
    far a fallen tower moves the base point).
  - **Enraged** (MS-16): `systems/EnragedSystem` after `SpawnSystem`: each `structure-destroyed`
    of a SpawnerTower or BuffTower (`ENRAGING_STRUCTURES`) adds one `enraged` stack to the losing
    team's minions on that lane and to every later horde there. Stacks per team and lane live
    in `TeamState.enragedByLane`, hashed once any exists.
  - Stand-ins (plan §3): lane progress follows the polyline until M4's fields; nothing emits
    `structure-destroyed` until structure entities exist.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 664 passed (664)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: the pre-PR gate.

### 2026-10-25 — Minion system M5a, pre-PR gate — feat/minion-m5a-modifiers — SamarjitBhogal + Claude Code

- What was done: the critic (`architecture-reviewer`, `0b59134..389953d`) requested changes with
  one blocker, fixed: a horde spawned in the same update as a tower loss got the stack twice;
  `EnragedSystem` now gives new hordes their lane's stacks before it adds the loss, with a test.
  Should-fixes applied: a scenario test drives a real `Simulation` (light minions near home hit a
  Warrior harder than base through the damage pipeline) with a same-seed hash check; doc 18's
  pipeline positions and `paths:` name `EnragedSystem` and `MinionStrengthStep`; the strength
  test builds its curve from content. Better than the design (INBOX): enraged in its own system
  rather than `SpawnSystem`. Accepted: the 1.0 floor reads DISC-24 over `balancing.md`; `t` per
  hit along the polyline; only towers enrage (`balancing.md`); enraged has no live trigger until
  structure entities (M2c). Not changed: `enragedByLane` stays mutable like its sibling counters.
  Ponytail (lite): lean already, no cuts.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 667 passed (667)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: draft PR.

### 2026-10-25 — Phase 2 / sprint 2.2 — feat/minion-m4-flow-fields (merge of M1 and phase 2) — SamarjitBhogal + Claude Code

- What was done: merged the updated `feat/minion-m1-marching` (`68a6e31`, which carries
  `origin/phase/2-sprint-2-work` at `230a330`) into PR #40's branch. 2 conflicts: this log (both
  sides kept) and `DefaultSystemPipeline`, which keeps M1's merged signature and order and builds
  the lane flow fields only when the horde wiring is passed and the match has a map, handing them
  to `PathingSystem` as before.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 631 passed (631)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: merge #38 and #39, then resolve this PR's overlap with M2a (see the PR's merge order).

### 2026-10-25 — Phase 2 / SCRUM-183 — feat/weapons (damage from weapons) — Claudio + Claude Code

- What: merged `origin/phase/2-sprint-2-work` (PRs #31, #34, #35, #36) by a plain merge (no
  force); conflicts kept both sides (level curves and weapons injected side by side:
  `loadDefaultContent(tickRate, curves, weapons)`, `createDefaultContentRules(curves, weapons)`,
  `Simulation({ levelCurves, weapons })`). Then a Legend's damage comes from its weapon, not the
  Legend: `LegendDefinition` drops `attack` (`attack?: never`) and requires
  `defaultLoadout.primaryWeaponId`; `Legend.basicAttack` has no fallback; `KnownWeaponRule` flags a
  Legend with no weapon. Shipped `raptor-talons` (Warrior), `wuuthrad` (Sentinel), `magus-staff`
  (Magus, melee only until SCRUM-169) from the 05 §10 table, numbers = each class's `balancing.md`
  basic attack, all `TUNE`; INBOX item updated. Tests that spawn Legends now pass a weapon source.
- Gate: critic approve, no blockers. Should-fix done: the Wuuthrad note no longer says "no heavy
  weapon is MVP" (07 rates spear / battle axe MVP; only Wuuthrad is MVP-if-time); the
  `UnitAttack` comment says a mob's attack lives on its definition and a Legend's on its weapon.
  The 05 §10 design sentence "Until weapons land, a unit's basic attack is
  `UnitDefinition.attack`" is left as written (design docs are append-only); the Implementation
  status covers it. Nits left: a raw `TypeError` for a Legend without `defaultLoadout` passed
  through unvalidated `SimulationOptions.content` (types require it; a guard trips
  `no-unnecessary-condition`); import order of the new `loadWeapons` imports. Ponytail-review: 3
  cuts (one `newFactory()` helper in `playerScenarios`, `DefaultSystemPipeline` and `AiSystem`
  tests, −73 lines).
- Checks run: `npm run check` → `EXIT=0`: core "Tests 608 passed (608)"; client "Tests 416 passed
  (416)"; "✓ built in 98ms"; "Documentation check passed."
- Next step: Sam confirms the default weapons and numbers (INBOX); ranged attacks with
  projectiles (SCRUM-169, Aryan).

### 2026-10-26 — Minion system M8 (Rover, A\* for Legends, bot casts) — feat/minion-m8-rover-astar — SamarjitBhogal + Claude Code

- What was done:
  - **A\* for Legends** (10 §9): `map/AStarPathfinder` (octile costs and heuristic, no corner
    cutting, ties by cell index, string pulling, a cell budget from `content/ai/pathfinding.ts`)
    behind the new `state/PathQuery` port (`state.paths`). `Simulation` builds one `WorldMap`
    for it and the lane flow fields. The flow-field heap is now `map/CellHeap`, shared by both,
    and line of sight is `WorldMap.isLineClear` (`FlowField` delegates).
  - **Bot leaves:** `ai/BotLeaves` holds the conditions and actions both bot trees use;
    `moveTo` heads for the A\* waypoint when the straight line is blocked.
  - **Bot casts:** a fighting bot casts `ability-1` at its enemy when `abilityUseChance` comes
    up on its brain's RNG stream, at most every `castIntervalTicks` (difficulty content).
  - **`RoverController`** (11 §4.7): `Survive`, `Hunt`, `Fight`, `Mirror`, `Defend`; content
    `content/ai/difficulties/rover.ts` and `content/ai/rover.ts`. Roster Rovers spawn at their
    Stronghold with no lane; the client's placeholder roster adds the enemy Rover.
  - **Tests:** the pathfinder (clear line, detour, determinism, no way), line of sight, the
    heap, the Rover's branches (a driven Legend is not the human), bot routing and casting, and
    match scenarios: a Rover spawns at its Stronghold, laners and a Rover play with no warnings
    and the same hash twice.
  - Stand-ins (plan §3) and INBOX (numbers; A\* as a query rather than a movement strategy).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 717 passed (717)"; client "Tests 417 passed (417)"; "Documentation check passed."
- Next step: the pre-PR gate.

### 2026-10-26 — Minion system M8, pre-PR gate — feat/minion-m8-rover-astar — SamarjitBhogal + Claude Code

- What was done: the critic (`architecture-reviewer`, `9f3842c..ab0dad2`) requested changes with
  three blockers, all fixed. (1) A\* is shown taking the shorter side of an off-centre stamped
  footprint, with the hand-computed optimal octile cost (`lastCost`), and going straight again
  once the footprint is cleared. (2) The Rover's `Defend` could never run because `Mirror`
  always came first: the two are now one utility pick over the lanes, `StructurePressure` (from
  the new `laneScores`, counted from the calmest lane) against `HumanProximity` (the human's
  lane), weighted in `content/ai/rover.ts`. (3) Tests show the Rover choosing the pushed lane
  over the human's, the human's on a tie, and the worst lane with no human in sight.
  Should-fixes: A\* snaps a blocked start or goal to the nearest open cell (a Rover inside its
  Stronghold's footprint walks out); string pulling walks forward and stops at the first unseen
  cell; `CellHeap.clear` resets only queued cells; the human search asks `Perception` for
  Legends only and the stand-in names the rule it bends; `GameState` takes its indexes as one
  object; `Simulation` builds the world and the controllers in helpers; A\*'s limits are
  validated `GameConfig.map` values (`pathMaxExpansions`, `pathSnapCells`). Nits: the leaf test
  uses a stub `PathQuery`; doc 18's status wording; import order; the INBOX item states that A\*
  now costs inside the decision budget. Not changed: no path cache yet (a stand-in row);
  `castIntervalTicks` stays in ticks, recorded in 11 §10. Ponytail (lite): lean already.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 724 passed (724)"; client "Tests 417 passed (417)"; "Documentation check passed." One
  earlier run timed out M4's 5-lane routing scenario at its 60 s limit under coverage while the
  machine was loaded; it takes about 10 s without coverage.
- Next step: critic re-check, then the draft PR.

### 2026-10-26 — Minion system M8, critic re-check — feat/minion-m8-rover-astar — SamarjitBhogal + Claude Code

- What was done: the re-check (`ab0dad2..1da6bbc`) confirmed the three blockers fixed and found
  a new one: `npm run check` failed because M4's 3- and 5-lane routing scenarios took 57–60 s
  under coverage against a 60 s limit. Timed at `9f3842c` (before M8) they were as slow, and a
  profile put three quarters of the time in `SpaceSystem`: M2a's `SpatialHash.rebuild` cleared
  and prefix-summed a per-cell array of hundreds of thousands of cells every tick. Root-cause
  fix: `rebuild` sorts the points by cell and index and queries binary-search each cell's run,
  so the cost follows the unit count (the scenarios now take 5–9 s under coverage), with a
  regression test on a 10^6 × 10^6-cell world. This departs from 10 §5's counting-sort storage,
  so it is a better-than-design item in INBOX and doc 10 §12. Should-fixes: doc 11 §10
  describes the Rover's `Lane` pick; doc 03's config table lists the A\* fields; INBOX lists the
  Rover's lane weights and the calmest-lane rule. Nits: `mostLaneScore` replaces the Rover's
  copy of the score maximum; a full lane tie goes to the middle lane (tested);
  `UtilityScorer.best` is generic over the option id; TSDoc fixes. Not changed: no cross-field
  check of `pathSnapCells` against footprint sizes.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 726 passed (726)"; client "Tests 417 passed (417)"; "Documentation check passed."
- Next step: critic re-check, then the draft PR.

### 2026-10-26 — Minion system M8, critic round 3 — feat/minion-m8-rover-astar — SamarjitBhogal + Claude Code

- What was done: the third critic pass (`1da6bbc..8b84fd3`) approved: the check is green (the
  routing scenarios take 8–13 s under coverage) and the new `SpatialHash` is correct. Its nits
  applied: `rebuild` throws a `RangeError` (tested) when cells × points would make the sort keys
  inexact; the TSDoc and the INBOX sign-off item say a rebuild is O(n log n) with one view object
  per rebuild, and that a NaN position is never found; an INBOX line is re-wrapped.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 727 passed (727)"; client "Tests 417 passed (417)"; "Documentation check passed."
- Next step: the draft PR.

### 2026-10-27 — Phase 2 / sprint 2.2 — feat/minion-m8-rover-astar (owner sign-offs) — SamarjitBhogal + Claude Code

- What was done: SamarjitBhogal accepted both M8 better-than-design items in chat. Doc 10 §5
  now describes the sorted `SpatialHash` layout (O(n log n) rebuild, one view per rebuild) and
  §12 drops the deviation; doc 11 §6 says a bot's A\* is a `PathQuery` inside the decision
  budget, and sprint 3.2's done-when and the minion plan's M8 row follow. The Rover and cast
  numbers stay as built (design docs first, else the agent's judgement). INBOX records the
  decisions. Docs only.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 727 passed (727)"; client "Tests 417 passed (417)"; "Documentation check passed."
- Next step: merge the updated M3 branch in, so this PR carries the M2b and M3 answers too.

### 2026-10-27 — Phase 2 / sprint 2.2 — feat/minion-m3-bot-laners (owner answers) — SamarjitBhogal + Claude Code

- What was done: SamarjitBhogal answered the M3 INBOX item in chat. Roster order for bot lanes
  is accepted, so doc 18 §8 says roster order; base healing is out of the minion system's scope
  for now (the Phase 3 plan's laner test says so); the bot numbers stay as built (design docs
  first, else the agent's judgement). The INBOX item records the decision. Docs only.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 680 passed (680)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: none for M3; merge after #44.

### 2026-10-27 — Phase 2 / sprint 2.2 — feat/minion-m5a-modifiers (DISC-24 tower shift, sign-off) — SamarjitBhogal + Claude Code

- What was done: on SamarjitBhogal's answers in chat. (1) DISC-24's shift is built: a team's
  base-stat point starts at mid-lane and moves toward the enemy by
  `MINION_STRENGTH.shiftPerTowerLost` (0.1 of the lane, `TUNE`, the agent's judgement with no
  reference) for each lane tower the enemy has lost on that lane, capped at `maxBasePoint` (0.9);
  the curve is `m(t) = clamp(1 + k · (1 − t / c), min, max)`. `TeamState.enragedByLane` is renamed
  `towersLostByLane`, since enraged and the shift read the same count, which `EnragedSystem`
  keeps. New `MinionStrengthStep` test. (2) `EnragedSystem` as its own system is accepted: 03 §4's
  `structure-destroyed` and `horde-spawned` rows name it; docs 05 and 18 describe the shift. The
  INBOX item records the decision; the floor stays 1.0 until the owner says otherwise.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 668 passed (668)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: none for M5a; nothing emits `structure-destroyed` until M2c, so the shift is live
  only in tests until then.

### 2026-10-27 — Phase 2 / sprint 2.2 — feat/minion-m5a-modifiers (critic on the tower shift) — SamarjitBhogal + Claude Code

- What was done: the `architecture-reviewer` critic approved 2af508f with one should-fix: the
  shift's direction is the agent's reading of DISC-24, not the owner's decision. INBOX now
  records only what the owner decided and asks the direction as its own question, with
  readings (a), built as an interim, (b) and (c). Nits applied: `MinionStrengthStep` refuses a
  base-stat point outside the lane (new test), and `StateHasher`'s variable and test name say
  lost towers (the hash tag stays `enraged`, so hashes do not change).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 669 passed (669)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: the owner picks the DISC-24 reading; merge after #44.

### 2026-10-27 — Phase 2 / sprint 2.2 — feat/minion-m2b-minion-controller (owner sign-offs) — SamarjitBhogal + Claude Code

- What was done: SamarjitBhogal accepted the M2b better-than-design items in chat. Doc 18 §5.2
  now says `PathingSystem` reads `Combat.targetId` and hands the strategy a target and arrival
  radius; §7's guard strategy follows; §5.1 names `state/formationSlot.ts` as the slot function's
  home; doc 11 §1 says controllers get their content through their constructor from `Simulation`
  (the §10 deviation line is gone). The INBOX item records the decision; the numbers stay as built
  (design docs first, else the agent's judgement). Docs only.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 657 passed (657)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: none for M2b; merge after #43.

### 2026-10-27 — Phase 2 / sprint 2.2 — docs/minion-plan-all-enemy-ai (MS-28 answered) — SamarjitBhogal + Claude Code

- What was done: SamarjitBhogal answered the MS-28 item in chat. The minion system does not
  control bosses; every other mob type may be driven by it. Doc 18 MS-28 is now an owner
  decision that excludes bosses, and a "Not handled here: bosses" note replaces bosses in the
  "scheduled here" note. The plan drops M7 (the numbering keeps M8 so branch and PR names stay
  valid), and its §1.1 row for bosses points to Phase 3 sprint 3.6. Doc 11 §4 and the Phase 3
  plan say `BossController` stays in sprint 3.6. Checkpoint defenders fight for the team that
  owns the point (doc 18 §7.1, doc 07 §7). The defenders' leash, and the team of an unowned
  point's defenders, are a new open INBOX item.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 633 passed (633)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: the owner answers the leash item before M6.

### 2026-10-27 — Phase 2 / sprint 2.2 — chore/coderabbit-pr-review — SamarjitBhogal + Claude Code

- What was done: added `.coderabbit.yaml` so CodeRabbit reviews every PR into `main` or a
  `phase/*` branch (drafts included) by `.claude/skills/pr-review/SKILL.md`: the skill, the
  checklists, `AGENTS.md` files, the code-structure doc and `CONTRIBUTING.md` are loaded as code
  guidelines, a `**/*` path instruction maps the skill's severities, and a blocking
  (`mode: error`) pre-merge check holds the skill's blocker list. `auto_approvals.enabled` lets
  CodeRabbit request changes on blockers and approve once they are resolved. The config
  validates against CodeRabbit's `schema.v2.json`. `docs/process/git-workflow.md` §review
  rules notes it.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; "Documentation
  check passed."; core "Tests 585 passed (585)"; client "Tests 416 passed (416)"; "✓ built in 225ms".
- Next step: the owner makes CI a required status check on `main` and `phase/*` (CodeRabbit
  cannot run `npm run check`), then confirms CodeRabbit reviews this branch's PR.

### 2026-10-27 — Phase 2 / sprint 2.2 — chore/coderabbit-pr-review (pre-PR gate) — SamarjitBhogal + Claude Code

- What was done: pre-PR gate on the CodeRabbit config. The critic requested changes (2
  blockers). Fixes: `allow_author_approval: false`; ADR 0018 (proposed) records the decision,
  with a `guardrails.md` §1 row and a §5 note; the blocking check now fails only on the skill's
  blockers (guardrail weakening, agent product decisions; approved dependencies pass) and the
  rest are review findings; the path instruction adds the three-way classification;
  `tool-setup.md` §7 documents CodeRabbit; architecture docs and `guardrails.md` are loaded as
  guidelines. Ponytail cut 3 lines of defaults from `.coderabbit.yaml`.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 585 passed (585)"; client "Tests 416 passed (416)"; "✓ built in 182ms"; "Documentation
  check passed." Critic second pass: approve; its should-fix items are applied
  (`override_requested_reviewers_only: true`, accurate self-approval wording, CI on `phase/*` in
  `guardrails.md` §5, ADR 0018 in `related:`).
- Next step: the product owner accepts ADR 0018 and answers whether CodeRabbit's approval
  counts toward the required approval; make CI a required check on `main` and `phase/*`.

### 2026-10-27 — Phase 2 / sprint 2.2 — chore/coderabbit-pr-review (CodeRabbit review of PR #48) — SamarjitBhogal + Claude Code

- What was done: addressed CodeRabbit's two major comments on PR #48. Any actionable inline
  comment makes CodeRabbit request changes, so the path instruction now posts only blockers that
  way and `should-fix`/`nit` findings as nitpicks in the summary. CodeRabbit's approval counts
  toward GitHub's required approvals, so `guardrails.md` §5 now asks for a Code Owner review
  (`.github/CODEOWNERS` lists only people) and ADR 0018 says so. The minor comment
  (`auto_pause_after_reviewed_commits: 0`) was declined and resolved: we should not demand too
  many reviews from CodeRabbit.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 585 passed (585)"; client "Tests 416 passed (416)"; "✓ built in 192ms"; "Documentation
  check passed."
- Next step: the owner turns on "Require review from Code Owners" and required CI on `main` and
  `phase/*`, and accepts ADR 0018.

### 2026-10-27 — Phase 2 / sprint 2.2 — chore/coderabbit-pr-review — SamarjitBhogal + Claude Code

- What was done: second round of CodeRabbit threads on PR #48. Team decision: CodeRabbit's
  approval is enough for task PRs into `phase/*`; phase PRs into `main` keep a Code Owner
  (teammate) approval. Recorded in ADR 0018, `guardrails.md` §5, `git-workflow.md` and
  `sdlc.md` §4. Declined the PROGRESS heading nit: a note after the branch is an existing
  convention in this log.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 585 passed (585)"; client "Tests 416 passed (416)"; "✓ built in 186ms"; "Documentation
  check passed."
- Next step: the owner enables the "phase branches" ruleset (PR, 1 approval, required CI, Code
  Owner review off), adds required CI on `main`, and accepts ADR 0018.

### 2026-10-27 — Phase 2 / sprint 2.2 — chore/coderabbit-pr-review — SamarjitBhogal + Claude Code

- What was done: third round of CodeRabbit threads on PR #48. `.coderabbit.yaml` reads from the
  PR branch, so `auto_approvals.overrides` now withholds CodeRabbit's approval on PRs that touch
  review or guardrail config. ADR 0018 rewritten as accepted (team decision including the
  product owner): context, numbered decision, options, consequences. The "phase branches"
  ruleset is active (PR, 1 approval, Code Owner review off, the three CI checks required).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 585 passed (585)"; client "Tests 416 passed (416)"; "✓ built in 191ms"; "Documentation
  check passed."
- Next step: add the three CI checks as required on `main`.

### 2026-10-27 — Phase 2 / sprint 2.2 — chore/coderabbit-pr-review — SamarjitBhogal + Claude Code

- What was done: fourth round of CodeRabbit threads on PR #48. The approval override now also
  covers `.claude/skills/pr-review/**` and its `.agents/` mirror, so a PR that changes the
  review procedure needs a teammate's approval. ADR 0018 says so.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 585 passed (585)"; client "Tests 416 passed (416)"; "✓ built in 182ms"; "Documentation
  check passed."
- Next step: add the three CI checks as required on `main`.

### 2026-10-28 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the owner's answers to the merge decisions (stream B, round B17) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only, on `7a55b2e`; the owner's answers of 2026-10-28, given in chat from a
  decision page whose items D1 to D8 the PR register's new section "Owner answers of 2026-10-28"
  defines):
  - D1, `INBOX.md` HC-T1 group (i) ("Approve all 54"): `d2b-group-i.patch` applied once
    `git apply --check` printed nothing; the 19 files equal the generator's group (i) copies
    (`b1121f5`).
  - D3, HC-B1 ("Approve all"), and D4, ADR 0019 ("Accept"): the 24 HC-T1 rows whose only open basis
    was HC-B1 or DEC-50 applied with the D2b generator's new `--apply-b17` (`e28854b`). Six rows
    tied to HC-B1 or ADR 0019 stay pending because they also carry another open item: T-11 and T-31
    (HC-Q7 (2)), T-16 (HC-F9, HC-Q8), T-23 (HC-Q2), T-29 (HC-Q14) and T-90 (HC-F7). DEC-22 gets the
    appended note HC-B1's BD1 promised.
  - D4 and D5: ADR 0019 and ADR 0020 accepted, recorded as ADR 0018 records its acceptance
    (`9f7cb80`).
  - D2, HC-Q7 (1) and (3): DEC-51's appended note and FR-111 reworded (`7b87f76`); new HC-T1 rows
    T-155 to T-157 propose the same for references 10 and 11 (pending: no row existed for them);
    HC-Q7 (3) holds a credit drafted from his words for his confirmation. He did not state the
    tools' terms, so HC-Q7 stays open for them and for (2), (4) and (5).
  - D8, HC-Q22: new DEC-57 in a new batch 2026-10-28, with his words. DEC-57 was free on all 82
    local and remote refs after `git fetch` and in every local worktree (the game-loop plan's
    working copy names DEC-57 as the next free number and assigns none).
  - D6 and D7: HC-Q21 (b) and the merge commit recorded in `INBOX.md`, the PR register (owner items,
    the integration recipe, the /pr-review's disposition cells) and the pull request's description
    (outside the repository); the merge commit departs from `docs/process/git-workflow.md`'s squash
    default (§4, §5) for this pull request only.
  - `INBOX.md` (`160d096`): HC-T1's prose and table (78 rows applied, 59 pending, each open item
    named), HC-B1, HC-Q21 and HC-Q22 ticked with his answers, HC-Q7's answer, a Done entry.
  - Every edit to a sholtzman-owned doc this round (`last-reviewed` 2026-10-28 on each doc):
    - Group (i) rows: `apps/client/AGENTS.md` T-01 to T-04, T-06; architecture 04 T-50, T-54, T-119,
      T-121; 05 T-122; 13 T-87, T-88; 17 T-123, T-124; the architecture README T-151; reference 01
      T-61 to T-65, T-103 to T-106, T-115; reference 10 T-107, T-128, T-129; reference 11 T-130,
      T-131; the decisions log T-154; reference 14 T-73, T-74; the glossary T-76 to T-78, T-108; the
      naming suggestions T-109, T-110, T-147 to T-150; the more-abilities suggestions T-111 to
      T-113; the reference README T-134, T-135; the backlog T-114, T-126; the phase 4 plan T-127;
      requirements 02 T-117; requirements 06 T-116, T-146.
    - HC-B1 and ADR 0019 rows: architecture 01 T-45; 02 T-37, T-40, T-42 to T-44, T-89; 04 T-51; 05
      T-55; 13 T-07 to T-09, T-14, T-15, T-21, T-25, T-27, T-86; 14 T-30, T-32 to T-35; 17 T-48.
    - The branch's Implementation-status notes (not design text): 01 §8, 02 §12 and 17 §12 say which
      of their rows are now in the design text; in 13 §10 the bullet on DEC-50 and DEC-52 to DEC-55
      is replaced by one on the `match` row that still waits (T-16).
    - ADR 0019 and ADR 0020: Status line, frontmatter `status: active` and description.
    - Decisions log: the batch 2026-10-28 with DEC-57; appended notes at the end of DEC-22's and
      DEC-51's decision cells (Prettier re-padded the DEC-21 to DEC-24 table, whitespace only).
    - Requirements 06: FR-111's statement, source and status; its acceptance and phase are
      unchanged.
    - PR register: the section "Owner answers of 2026-10-28", a dated status under the merge
      preconditions, the owner items, the integration recipe's intro and step 5, and five /pr-review
      disposition cells.
    - `docs/README.md` regenerated (the descriptions changed by T-103 and T-111, and ADR 0019's and
      ADR 0020's).
  - Outside the repository (`eternalus-agent-work/hud-charselect/streams/docs/`): the D2b generator
    gains `--apply-b17` and the rows T-155 to T-157; `d2b.patch` now holds the 59 pending rows over
    30 files and `EDIT-TABLE.rows.md` all 137 rows plus A-1 and A-2; `d2b-group-i.patch` is applied
    and no longer generated. The id resolver now ignores `FNV-1a`, a hash name that a group (i)
    table re-pad put on an added line. Backups in `b17-backup/`.
- Checks run, on `160d096` with this entry and the register's last fix in the working tree:
  `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 619 passed
  (619)"; client "Tests 1360 passed (1360)", statements 96.48 %; the JavaScript bundle 556.75 kB
  (gzip 174.10 kB); "✓ built"; "Checked 119 Markdown files under docs/." "Documentation check passed."
  `git apply --check d2b.patch` (the 59 pending rows) prints nothing; the post-B17 tree plus that
  patch equals round B16's fully patched copies in all 36 files of B16's patch except this round's
  own edits (the four status notes, T-155 to T-157), `last-reviewed` ignored; the id resolver: 958
  ids, 0 without a definition (it resolves D1 to D8 to the architecture README's decision rows, the
  first definition it finds; the register's new section defines the decision page's D1 to D8 and
  says they differ).
- Next step: the owner's remaining answers (the tools' terms in HC-Q7 (1) if he wants them stated,
  the credit draft in HC-Q7 (3), the rest of HC-T1); the code change to `assetLicences.ts` once he
  confirms the credit; then, once the minion stack and `feat/weapons` have merged into
  `phase/2-sprint-2-work`, the one integration with the register's recipe (HC-Q21 (b)), and the pull
  request, merged with a merge commit.
- Flag for the owner: the requirements README ("How to cite and change a requirement") and NFR-010
  change a requirement only through an accepted ADR. FR-111 was reworded on his answer to HC-Q7 (1),
  which the item said would decide its wording, and on DEC-51's note; no ADR records it.
- Correction (`b1121f5`'s message is not rewritten): it says T-103 and T-113 changed the two index
  descriptions; they are T-103 and T-111.

### 2026-10-28 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the owner's non-blocking answers (stream B, round B18) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only, on `5415d6d`: `a6ed088` ADR 0022, `ac007bd` the decisions log,
  `a1c03fb` the applied rows, `bdafffa` INBOX and the register; the owner's 42 answers of
  2026-10-28 to the non-blocking questions, given in chat from a second decision page whose keys
  N1 to S2 the PR register's new section "Owner answers of 2026-10-28 (non-blocking)" defines; his
  verbatim answers and a ledger, one row per answer with where it is recorded, are outside the
  repository in `eternalus-agent-work/hud-charselect/decisions/`):
  - `INBOX.md`: an "Answered 2026-10-28" line with his words under each of the 34 items he answered;
    HC-F4, HC-F5, HC-F7, HC-F9, HC-Q6, HC-Q10, HC-Q12, HC-Q14 and HC-Q15 ticked; HC-T1's answer
    and its regenerated table (127 rows applied, 16 pending); his Sprint 3 list in HC-U1; the
    register rows CD-25, CD-30 and CD-38, row T-153's section and rows T-155 to T-157 explained by
    name and content; a Done entry.
  - Decisions log: a new batch 2026-10-28 with DEC-58 to DEC-70 (his rename, "still not final";
    the `harbinger` id and the "Coming Soon..." card; the fixed 60 s countdown and the locked view;
    the bot rosters; the HUD rules; the class kits; the weapons; the detail rows and the View
    Details modal; the developer hotkey; Cinzel everywhere; load on demand; the destroyed-structure
    look; sub-class gameplay next sprint), his words quoted, readings marked; notes appended to
    the decision cells of DEC-48, DEC-49, DEC-51 and DEC-57 (Prettier re-padded those two tables,
    whitespace only). DEC-58 to DEC-70 were free on all 82 local and remote refs after `git fetch`,
    in every local worktree and in `INBOX.md`.
  - ADR 0022 (new, accepted on his delegation, "I don't care what number is used"): records his
    answer that made FR-111's rewording of round B17, as NFR-010 asks; adds nothing beyond it.
    0022 was free on every ref; 0021 stays the game-loop plan's. `docs/README.md` regenerated.
  - Every edit to a sholtzman-owned doc this round (`last-reviewed` 2026-10-28 on each):
    - HC-T1 rows applied (49, `--apply-b18` of the D2b generator): `AGENTS.md` T-100;
      `CONTRIBUTING.md` T-136; `apps/client/AGENTS.md` T-05; architecture 01 T-46; 02 T-36, T-38,
      T-39, T-41, T-138; 04 T-101, T-120; 05 T-139; 06 T-56, T-57; 08 T-58, T-79 (a new §11
      status section); 09 T-59; 13 T-11, T-16 to T-20, T-22, T-24, T-26, T-28, T-29, T-90; 14
      T-31, T-153; 16 T-140; 17 T-47, T-102; plans phase 1 T-80 (sprint 1.4's `Match` task
      ticked), T-85; phase 2 T-145 (a new sprint 2.8 task); phase 3 T-84; phase 4 T-83; phase 5
      T-81, T-82; reference 08 T-141; reference 11 T-132; the glossary T-133; the suggestions
      README T-142; the naming suggestions T-143, T-144; requirements 02 (CP-13) T-137;
      requirements 06 (FR-047's statement) T-118.
    - Implementation-status notes (not design text): the lead sentences of 01 §8, 02 §12, 06 §10,
      14 §14 and 17 §12 now say their rows are in the design text; 13 §10's first bullet now names
      what still waits (the `character-select` and `menu` → `loading` rows, §3's HUD rows); 06
      §10's camera bullet adds that the developer hotkey (DEC-66) is not built.
    - Decisions log, ADR 0022 and the PR register's new section, as above; `last-reviewed` only on
      06, 08, 09, 16, the phase 1, 2, 3 and 5 plans, reference 08 and the suggestions README (the
      others already had 2026-10-28).
  - Not applied, with reasons (`INBOX.md` HC-T1): T-10 and T-13 held, because his bots are filled
    at LOCK IN with the enemy mirroring the player (DEC-61), which changes where the rosters are
    completed; T-12 and T-75 redrafted to DEC-60 and applied with that build; T-23 redrafted to
    his HUD rules (DEC-62), for his approval; T-152 waits for his list of enhancements; T-155 to
    T-157 explained, for his approval; T-125 is SamarjitBhogal's. New rows T-158 to T-161
    (`flying` to `harbinger` in architecture 04 §1 and §12, 17 R1 and the phase 4 plan's sprint
    4.1; approved with HC-F2, applied with the content rename) and T-162, T-163 (reference 12
    OQ-02 and the naming suggestions; for his approval).
  - Outside the repository: the D2b generator gains `--apply-b18`, the redrafts and T-158 to
    T-163; `d2b.patch` now holds the 16 pending rows over 11 files. Backups in `b18-backup/`.
- Checks run, on `5415d6d` with all of this round's edits in the working tree (this entry's
  checks line still a placeholder): `npm run check` → `EXIT=0`: "All matched files use Prettier
  code style!"; core "Tests 619 passed (619)", statements 99.19 %; client "Tests 1360 passed
  (1360)", statements 96.48 %; the JavaScript bundle 556.83 kB (gzip 174.14 kB); "✓ built";
  "Checked 120 Markdown files under docs/." "Documentation check passed."
  `git apply --check d2b.patch` (the 16 pending rows) prints nothing; the post-B18 tree plus that
  patch equals round B17's fully patched copies in all 30 files of B17's patch except this
  round's own edits (T-12, T-23, T-75 and T-152 redrafted, T-158 to T-163, the status notes),
  `last-reviewed` and table padding ignored; before any change, the B17 generator reproduced every
  B17 output byte for byte on `5415d6d`. The id resolver: 1010 ids, 0 without a definition (it
  resolves a decision-page key such as N2 or F10 to the first definition it finds; the register's
  new section defines the page's keys and says they differ).
- Next step: the build work his answers order (the content rename and the "Coming Soon..." card;
  the fixed countdown, the locked view and the bot rosters; the HUD's empty frames; the
  destroyed-structure look; the developer hotkey; Cinzel in the menus; load on demand; step errors
  to the session; the art-id guard), each with its doc rows; his open answers (the bots' Legends,
  the weapon panel, CD-25's mask, the Magus description, HC-Q7 (1) and (4), the enhancements,
  T-155 to T-157, T-162, T-163, T-23); next sprint: the class kits and sub-class gameplay; then
  the integration with the sibling pull requests (HC-Q21 (b)).

### 2026-10-28 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the critic's check of round B18, loop 1 (stream B, round B19) — docs/hud-charselect-docs — sholtzman + Claude Code

- What was done (docs only, on `0cd98b7`: `f35683d` ADR 0023, `bfd6607` the corrected rows,
  `38dc4d1` the decisions log, `6f0430c` INBOX and the PR register). The architecture critic, loop 1
  of the owner's three, read the 49 rows round B18 applied against the design at `230a330`: no
  blocker, 3 should-fix findings and 7 nits (its report is outside the repository, in
  `eternalus-agent-work/hud-charselect/decisions/record-and-research.json`). All ten are fixed:
  - Should-fix: `cancel-match` left 13 §3's `CharacterSelectScreen` Emits (T-166; no `ui/` file
    emits it, DEC-60); 13 §6.2 now gives the reason 13 §10 gives for reading the pause key in `ui/`
    (a paused match's stopped loop cannot read it) and the `clientActions` sketch marks
    `pause-menu` as the exception (T-169, T-170); the content-id rule cites the new ADR 0023 and
    `INBOX.md` HC-Q18 (4) instead of ADR 0018 point 5, which covers Legend ids only (T-175 to
    T-179, and the basis cells of HC-T1 rows T-100 to T-102 and T-136 to T-144).
  - Nits: the owner's Keep of 2026-10-28 beside the `Recommendation:` labels of HC-F9, HC-F7 and
    HC-Q14, and `--text-min` named in place of a copied 12 px (T-164, T-167, T-168, T-169); the
    `MemoryStorageAdapter` target kept (T-165); 02 §3's interim wording moved to 02 §12 (T-171);
    09 §2's sentence order (T-172); the exact test name (T-173); "no non-test file" (T-174);
    `Recommendation:` notes appended to DEC-61 and DEC-62 for the recorder's interim defaults.
  - ADR numbers: 0023 was free on all 82 local and remote refs after `git fetch`, in every local
    worktree, in `INBOX.md` and in `eternalus-agent-work/`, and is used for the content-id record.
    **0024 is reserved for the coming "load on demand" ADR** (DEC-68; INBOX HC-Q20). The load-on-
    demand research (`eternalus-agent-work/hud-charselect/decisions/research/load-on-demand.md`)
    calls that ADR "0023" while leaving the number to the orchestrator; read it as 0024. 0021
    stays the game-loop plan's.
  - Every edit to a sholtzman-owned doc this round (`last-reviewed` already 2026-10-28 on each):
    - HC-T1 rows applied (16, `--apply-b19` of the D2b generator): `AGENTS.md` T-175; architecture
      02 T-171; 04 T-176; 09 T-172; 13 T-164 to T-170; 17 T-177; the phase 1 plan T-173, T-174;
      the naming suggestions T-179; requirements 02 (CP-13) T-178. Prettier re-padded 13 §2's
      table, whitespace only.
    - Implementation-status notes (not design text): 13 §10's Session bullet (`SessionController`
      takes no `persistence` yet, so its transitions test has no `MemoryStorageAdapter`) and 02
      §12's Assets bullet (the generated `assets/manifest.json` of 14 §11 stays planned).
    - The decisions log: notes appended to the decision cells of DEC-61 and DEC-62 (the rows are
      not rewritten; no other row changed).
    - ADR 0023 (new, accepted on the owner's delegation of 2026-10-28, as ADR 0022 was;
      `docs/README.md` regenerated); the PR register's new section "The critic's check of round
      B18 (loop 1)"; this entry.
    - `INBOX.md` (not under `docs/`): HC-T1's round B19 bullet and regenerated table, a line under
      HC-Q18 naming ADR 0023, a Done entry.
  - Not changed: T-12's pending redraft still names `cancel-match` as a trigger; HC-T1 flags it for
    the DEC-60 build. The TSDoc of `lockedClasses.types.ts` and `legendSpecs.types.ts` still cites
    ADR 0018 point 5 (code; ADR 0023 says it can cite the new record when that code next changes).
  - Outside the repository: the D2b generator gains T-164 to T-179, `--apply-b19`,
    `B19-APPLIED.rows.md` and `basis_b19()`; its README records the round. Backups in
    `b19-backup/`. The new rows were first numbered after the row each corrects, with a letter
    suffix, and renumbered before any commit, because a six-character id would have re-padded all
    of HC-T1's table (pc-04).
- Checks run, on `0cd98b7` with all of this round's edits except this entry in the working tree:
  `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 619 passed
  (619)", statements 99.19 %; client "Tests 1360 passed (1360)", statements 96.48 %; the
  JavaScript bundle 556.83 kB (gzip 174.14 kB); "✓ built"; "Checked 121 Markdown files under
  docs/." "Documentation check passed." Before any change the B18 generator reproduced every B18
  output byte for byte on `0cd98b7`. After it, `git apply --check d2b.patch` (the 16 pending rows)
  prints nothing; the patched copies differ from round B18's only by this round's own edits (04,
  13, 17 and the naming suggestions; the other seven files are byte for byte the same); no edit-
  table cell is wider than its column, so the inline table changes only in its 12 basis cells and
  16 new rows. T-164 to T-179 were free on every ref and in the agent working folders. The id
  resolver against `230a330`, with this entry written: 1028 ids, 0 without a definition.
- Next step: a second critic loop on round B19 if the coordinating session runs one (two of the
  owner's three remain); then the build work round B18 listed, ADR 0024 (load on demand) among it.

### 2026-10-29 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the owner's build-plan answers (batch 1 docs pass, round B20) — feat/hud-plan-b1 — sholtzman + Claude Code

- What was done (docs, plus code comments): `3849c8b` the applied rows, `4fca16b` two Nadirev
  comments, `90442f6` the records; on 2026-10-30 the critic's loop 2 (approve, no blocker) and its
  ponytail review were applied in place to this unmerged text, in one `docs(docs)` and one
  `chore(client)` commit. On 2026-10-29 the owner answered the build plan's P1 to P11 and the
  enhancement review page (verbatim in
  `eternalus-agent-work/hud-charselect/decisions/owner-answers-2026-10-29-plan.md`), with the
  instruction: "Answers must be documented in the code so I do not need to make these decisions
  again."
  - Decisions log: DEC-100 to DEC-108 (numbering in the log's batch intro), and dated notes on
    DEC-48, DEC-51, DEC-53, DEC-57, DEC-59 to DEC-62, DEC-65, DEC-66 and DEC-69.
  - HC-T1: T-155 to T-163 applied; the critic's loop 2 (round B20a) added T-180 and restored the
    marker T-155 had dropped; 7 rows pending (`INBOX.md` HC-T1).
  - Every edit to a sholtzman-owned doc (detail in the commits; `last-reviewed` bumped on each but
    this log):
    - `docs/architecture/04-entity-architecture.md`: HC-T1 T-158, T-159 (first line only), T-180.
    - `docs/architecture/17-extension-recipes.md`: T-160.
    - `docs/plan/phase-4-legends-abilities-and-loadouts.md`: T-161.
    - `docs/reference/game-design/10-art-and-lore.md`: T-155.
    - `docs/reference/game-design/11-mvp-scope.md`: T-156, T-157.
    - `docs/reference/game-design/12-open-questions.md`: T-162.
    - `docs/reference/suggestions/naming.md`: T-163.
    - `docs/reference/game-design/13-owner-decisions-log.md`: the new batch and the eleven notes.
    - `docs/plan/ui-enhancements-plan.md`: DEC-100's values (UE-01, UE-06, UE-07, UE-08, UE-12,
      every default on) and the answered owner question.
    - `docs/changelog/pr-feat-hud-and-character-select.md`: the section "Owner answers of
      2026-10-29"; notes on ruling I-82 and roster item P8.
    - `docs/plan/PROGRESS.md`: this entry.
    - `INBOX.md` (not under `docs/`): dated notes on the answered items, HC-T1's bullet and table, a
      Done entry; HC-Q1 (1)'s "Necromancer" is the question as asked on 2026-10-17 and is left as
      written.
  - Code comments: Nadirev cites DEC-58 (`4fca16b`); `RETIRED_NAMES` cites DEC-49 and DEC-58, and
    `--font-game` cites DEC-67 (the `chore(client)` commit).
  - Stale text that changes with the build: what `INBOX.md` HC-F1, HC-F8 and HC-Q4 track, and also
    13 §10's status note, reference 14 §5, `bridge/selectors/selectStructureStrip.ts` (the Wall
    tile) and `game/input/keybindings.ts` (no V).
- Checks run: `npm run check` EXIT=0, core 620/620, client 1363/1363; `npm run docs:check` passes.
- Next step: merge into `feat/hud-and-character-select`; steps 6 and 7 of the build plan.

### 2026-10-29 — Phase 2 / sprint 2.2 — chore/ci-drop-macos — SamarjitBhogal + Claude Code

- What was done: CI matrix drops `macos-latest` and keeps `ubuntu-latest` and `windows-latest`,
  to save Actions minutes on the education plan. macOS behaves like Linux for the Node tooling,
  and the git hooks plus the local `npm run check` still run on macOS machines. `guardrails.md`,
  `git-workflow.md`, `sdlc.md`, the PR checklist, the harness doc, phase exit criteria and
  NFR-019 / ES-07 updated to match (requirement change needs sholtzman sign-off on the PR).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 608 passed (608)"; client "Tests 416 passed (416)"; "✓ built in 225ms"; "Documentation
  check passed."
- Next step: the repo admin removes the `npm run check (macos-latest)` required check from the
  `main` protection and the "phase branches" ruleset.

### 2026-10-29 — Phase 2 / sprint 2.2 — chore/ci-drop-macos — SamarjitBhogal + Claude Code

- What was done: CodeRabbit review on PR #50. Added ADR 0019 (proposed) because requirement
  changes need an ADR plus product-owner acceptance (`docs/requirements/README.md`). NFR-019,
  ES-07 and the `ci.yml` comment now say macOS developers run the full check locally; the git
  hooks run only `check:quick` and are not full coverage.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 608 passed (608)"; client "Tests 416 passed (416)"; "✓ built in 230ms"; "Documentation
  check passed."
- Next step: sholtzman accepts ADR 0019 on the PR (then flip its status to accepted); the admin
  removes the macOS required check.

### 2026-10-29 — Phase 2 / sprint 2.2 — chore/ci-drop-macos — SamarjitBhogal + Claude Code

- What was done: ADR 0019 marked accepted by the repository admin (SamarjitBhogal); no separate
  product-owner sign-off needed.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 608 passed (608)"; client "Tests 416 passed (416)"; "✓ built in 226ms"; "Documentation
  check passed."
- Next step: the admin removes the `npm run check (macos-latest)` required check, then PR #50
  merges.

### 2026-10-29 — Phase 2 / sprint 2.2 — feat/minion-m1-marching — SamarjitBhogal + Claude Code

- What was done: merged `phase/2-sprint-2-work` (CI drops macOS, ADR 0019) into PR #38 and
  answered its CodeRabbit threads: `StateHasher.test.ts` pins the no-horde hash input and covers
  horde progress, member ids, `issuedIds`, `unitsRequested` and `unitsSuppressed`; architecture 03
  no longer says `GameState` lacks `recentCommands`; architecture 10 says `SpatialHash` cells
  yield items in reverse insert order.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 639 passed (639)"; client "Tests 415 passed (415)"; "✓ built in 222ms"; "Documentation check passed."
- Next step: merge this into the stacked minion PRs (#39, #40 and up).

### 2026-10-29 — Phase 2 / sprint 2.2 — feat/minion-m2a-brains-perception — SamarjitBhogal + Claude Code

- What was done: merged the updated M1 (with `phase/2-sprint-2-work`) into PR #39 and answered
  its CodeRabbit threads. `SpawnSystem` validates the opening and scheduled waves when it is built
  (unknown mob, wrong weight class → `ContentValidationError`) and keeps the Stronghold as a
  spawner even without recurring waves, so its opening hordes still spawn. The horde integration
  test derives its minion count from the config; the plan's M4 blocker is M1; the core
  `AGENTS.md` import table matches architecture 02 (`ai/` may import `content/` types).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  666 passed (666)"; client "Tests 415 passed (415)"; "✓ built in 175ms"; "Documentation check
  passed."
- Next step: merge this into the enemy-AI plan (#43) and M2b (#44).

### 2026-10-29 — Phase 2 / sprint 2.2 — feat/minion-m1-marching — SamarjitBhogal + Claude Code

- What was done: CodeRabbit on PR #40 (which carries M1's commits): team spawn counters change
  only through `GameState.recordSpawnRequest`, which rejects a spawned count outside
  0..requested (architecture 03 §2); `TeamState` fields are readonly and `SpawnSystem` calls it.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  639 passed (639)"; client "Tests 415 passed (415)"; "✓ built in 236ms"; "Documentation check
  passed."
- Next step: merge into M2a (#39) and M4 (#40) and up the stack.

### 2026-10-29 — Phase 2 / sprint 2.2 — docs/minion-plan-all-enemy-ai — SamarjitBhogal + Claude Code

- What was done: merged the updated M2a (with M1's CodeRabbit fixes and `phase/2-sprint-2-work`)
  into PR #43; kept this branch's M6/M8 plan rows and tags beside M2a's M4 blocker fix. Earlier
  PROGRESS entries stay as written (historical records, owner's call).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  666 passed (666)"; client "Tests 415 passed (415)"; "✓ built in 227ms"; "Documentation check
  passed."
- Next step: merge into M2b (#44).

### 2026-10-29 — Phase 2 / sprint 2.2 — feat/minion-m2b-minion-controller — SamarjitBhogal + Claude Code

- What was done: merged the updated enemy-AI plan (M2a, M1 and `phase/2-sprint-2-work`) into PR
  #44, resolving its conflict, and answered its CodeRabbit threads. `followerIndex` in
  `state/formationSlot.ts` is the one follower-index rule; `MinionController.isAtSlot` uses it, and
  `PathingSystem` now counts every follower, so a member skipped this tick no longer shifts the
  slots behind it (regression test fails on the old loop).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  692 passed (692)"; client "Tests 415 passed (415)"; "✓ built in 234ms"; "Documentation check
  passed."
- Next step: merge into M5a (#45) and M3 (#46).

### 2026-10-29 — Phase 2 / sprint 2.2 — feat/minion-m3-bot-laners — SamarjitBhogal + Claude Code

- What was done: merged the updated M2b into PR #46 and answered its CodeRabbit threads. Owner
  decisions recorded in INBOX (M1 item): first heavy horde at the countdown's end; horde
  membership only in `state.hordes`, so doc 18 §3.2, §4, §9 and 15's invariant drop `hordeId`.
  Guard tests now assert outcomes (`HordeSystem` without a map, `PathingSystem` unknown formation,
  no map, no horde) and the horde invariant test checks one violation's id and entity.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  718 passed (718)"; client "Tests 416 passed (416)"; "✓ built in 207ms"; "Documentation check
  passed."
- Next step: merge into M8 (#47).

### 2026-10-29 — Phase 2 / sprint 2.2 — feat/minion-m5a-modifiers — SamarjitBhogal + Claude Code

- What was done: merged the updated M2b (M2a, M1 and `phase/2-sprint-2-work`) into PR #45. With
  M1's readonly `TeamState`, `towersLostByLane` now changes only through
  `GameState.recordTowerLost`, which `EnragedSystem` calls; tests use it instead of writing the
  record. Earlier PROGRESS entries stay as written (owner's call).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  705 passed (705)"; client "Tests 415 passed (415)"; "✓ built in 268ms"; "Documentation check
  passed."
- Next step: none for M5a; M3 (#46) and M8 (#47) next.

### 2026-10-29 — Phase 2 / sprint 2.2 — feat/minion-m4-flow-fields — SamarjitBhogal + Claude Code

- What was done: merged the updated M1 (with `phase/2-sprint-2-work`, the M1 CodeRabbit fixes and
  the `GameState.recordSpawnRequest` counter guard) into PR #40 and answered its CodeRabbit
  threads. Spawn-wave validation landed in M2a (PR #39) and reaches M4 through the merge order.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  661 passed (661)"; client "Tests 415 passed (415)"; "✓ built in 229ms"; "Documentation check
  passed."
- Next step: merge into M8 (#47) after M3.

### 2026-10-29 — Phase 2 / sprint 2.2 — feat/minion-m8-rover-astar — SamarjitBhogal + Claude Code

- What was done: merged the updated M3 and M4 (with every lower minion PR and
  `phase/2-sprint-2-work`) into PR #47, resolving the `GameState` `{ space }` constructor in the
  merged tests, and answered its CodeRabbit threads. `SpatialHash.queryCircle` binary-searches
  once per covered row instead of once per cell (same results; the Rover's 400 m sense query got
  cheaper); doc 10's sketch marks `radii` and `queryRect` as planned; Sprint 3.2's A\* item no
  longer claims camp chases (M6 owns them).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  765 passed (765)"; client "Tests 417 passed (417)"; "✓ built in 201ms"; "Documentation check
  passed."
- Next step: none; all minion PRs are merged up to date with `phase/2-sprint-2-work`.

### 2026-10-29 — Phase 2 / sprint 2.2 — feat/minion-m1-marching — SamarjitBhogal + Claude Code

- What was done: second CodeRabbit round (threads on #38, #40, #44, #45). `EntityStore.countOnTeam`
  counts living units only, so a unit killed earlier in the tick no longer blocks a wave under the
  cap before `DeathSystem` removes it (regression test fails on the old count). `StateHasher`
  tests cover counters without any horde and change only `memberIds` (two-member horde).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  641 passed (641)"; client "Tests 415 passed (415)"; "✓ built in 319ms"; "Documentation check
  passed."
- Next step: merge up the stack again.

### 2026-10-29 — Phase 2 / sprint 2.2 — feat/minion-m2a-brains-perception — SamarjitBhogal + Claude Code

- What was done: second CodeRabbit round on PR #39. Owner signed off `ai/` importing `content/`
  types; architecture 11 §1 now matches 02 §2 and the core `AGENTS.md` (recorded in the PR
  description). The brain hash test also varies `controllerId` and `profileId`. Merged M1's
  living-unit cap fix.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  668 passed (668)"; client "Tests 415 passed (415)"; "✓ built in 179ms"; "Documentation check
  passed."
- Next step: merge up the stack again.

### 2026-10-29 — Phase 2 / sprint 2.2 — fix/phase-2-failing-tests — SamarjitBhogal + Claude Code

- What was done: CI on `phase/2-sprint-2-work` failed on Windows: `LaneFlowFields.test.ts`
  "mirrors each lane's Light field onto its Dark field: 5 lanes" timed out (6.3 s > 5 s) under
  coverage. It ran three `expect`s per grid cell; it now finds the first non-mirrored cell in a
  plain loop and asserts there is none (2088 ms → 27 ms locally with coverage). Same check:
  mask, integration and mirrored direction per cell; a no-flip mutation fails it.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  663 passed (663)"; client "Tests 415 passed (415)"; "✓ built in 165ms"; "Documentation check
  passed."
- Next step: merge into `phase/2-sprint-2-work` so the phase PR goes green.

### 2026-10-29 — Phase 2 / sprint 2.2 — fix/phase-2-failing-tests — SamarjitBhogal + Claude Code

- What was done: PR #53's Ubuntu job then timed out on `Simulation.hordes.test.ts` "gives the same
  hash on the generated map for the same seed, tick for tick" (5.09 s; 1.5 s locally). Core's
  `vitest.config.ts` now sets `testTimeout: 60_000`, so no whole-match simulation test fails on
  runner speed alone. No test or assertion changed.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  663 passed (663)"; client "Tests 415 passed (415)"; "✓ built in 174ms"; "Documentation check
  passed."
- Next step: merge into `phase/2-sprint-2-work`.

### 2026-10-30 — Phase 2 / Track B (S1 carry-over) / HUD and character select, batch 2 of the build plan (steps 6 to 9 and DEC-109; docs pass, round B21) — feat/hud-plan-b2 — sholtzman + Claude Code

- What was done: batch 2 built steps 6 to 9 of the build plan and DEC-109 in 14 commits on
  `9620398` (`4f1d2b5` to `20bf6ef`): the bot roster content and the bots filled at LOCK IN under
  a 60 s countdown that LOCK IN does not end (DEC-60, DEC-61, DEC-102); the "Failed to Choose
  Legend" popup (DEC-102); the locked view, with Esc on the Legend step only (DEC-60); the Legend
  panel's Ultimate / Abilities rows, Oracle's Unison Ward as ability 1 (DEC-65, DEC-103); 32 px
  Legend card titles (the owner's edit of frame 58:271); the `view-details` action on V and View
  Details on both selection steps (DEC-103); the alternate layout's View Details and Select Class
  (DEC-109). This docs pass (round B21) records it:
  - HC-T1 (the D2b generator outside the repository, round B21): T-10, T-12, T-13, T-75 and T-152
    redrafted; T-181 to T-190 new; nothing applied; 17 rows pending (`INBOX.md` HC-T1).
  - Every edit to a sholtzman-owned doc (`last-reviewed` bumped on each but this log):
    - `docs/architecture/13-game-interface.md`: §10's status note (the built flow, the screens,
      the session, the bridge's `selection-locked`, View Details' interim reduce-motion reading, a
      known-gaps bullet).
    - `docs/architecture/02-code-structure.md`: §12's status note (`fillRosters.ts`, the bot
      roster, core's new type exports).
    - `docs/architecture/17-extension-recipes.md`: §12's status note (a selection step, a
      keybinding action, the bot roster).
    - `docs/reference/game-design/15-figma-frames-and-creative-decisions.md`: frame 145:2 in §1;
      rows CD-39 to CD-46; dated notes on CD-09 and CD-10.
    - `docs/reference/game-design/13-owner-decisions-log.md`: dated notes on DEC-52 and DEC-109.
    - `docs/changelog/pr-feat-hud-and-character-select.md`: "Changed since the table" marks DV-70,
      DV-71 and DV-81 superseded.
    - `docs/plan/PROGRESS.md`: this entry.
    - `INBOX.md` (not under `docs/`): notes under HC-F1, HC-F7, HC-Q5, HC-Q9 and HC-C1; HC-T1's
      bullet and table; a Done entry.
  - Not ticked: HC-Q5. DEC-109 answers its View Details question only; the Magus description and
    the class step's row titles stay open (DEC-109's appended note).
- Checks run: batch 2's `npm run check` EXIT=0, core 628/628, client 1431/1431
  (`eternalus-agent-work/hud-charselect/build-1029/check-b2-dec109.log`); its red proofs are
  `redproofs-b2-steps67.txt`, `redproofs-b2-steps89.txt` and `redproofs-b2-dec109.txt` in the same
  folder. This pass (docs only): `npm run check` EXIT=0, core 628/628, client 1431/1431,
  "Documentation check passed." (`check-b2-docs.log` there); `git apply --check` of the D2b patch
  prints nothing.
- Next step: the critic gate on `feat/hud-plan-b2`, then merge into `feat/hud-and-character-select`.

### 2026-10-30 — Phase 2 / Track B (S1 carry-over) / HUD and character select, batch 2's critic loop 1 (findings F1, V1 to V6 and the nits; docs pass, round B22) — feat/hud-plan-b2 — sholtzman + Claude Code

- What was done: the architecture critic's loop 1 on batch 2 (`9620398..a37cd83`) and the visual
  shoot. Code fixes (the coordinating session, in the same working tree): F1, the three Legend
  mini portraits move from the `selection-primary` group to `selection`
  (`data/resources/selectionLegendStripAssets.ts`; 49,506 / 118,376 B move between the group
  budgets, OD-44), so the alternate layout's View Details shows them
  (`coreCatalogue.assets.test.ts` now counts the minis as drawn by both layouts); V1, View
  Details' filter
  (`ui/components/modalKeyFilter.ts`) also stops mouse buttons bound to an action, and a
  `pause-menu` button closes it; V2, `ClassDetailsScreen.test.tsx`; V4, the roster's random stream
  is injected (`SessionControllerDeps.createRosterRng`, bound in `main.tsx`) and
  `game/session/Rng.types.ts`' TSDoc corrected; V5, the comment in `LegendDetailsPanel.tsx`.
  Rejected: V3 (a test of the V press that opens View Details needs a DOM test environment, a new
  dependency only the owner approves; `INBOX.md` HC-Q23). This docs pass (round B22) records it:
  - HC-T1 (the D2b generator outside the repository, round B22): T-12 redrafted without the
    `cancel-match` trigger (V6); T-191 new (02 §6: the display loader also carries the bot roster,
    the critic's nit; the wording is the owner's); nothing applied; 18 rows pending.
  - Every edit to a sholtzman-owned doc (`last-reviewed` already 2026-10-30 on each but this log):
    - `docs/architecture/13-game-interface.md`: §10's known-gaps bullet (V1, V2, V3).
    - `docs/reference/game-design/15-figma-frames-and-creative-decisions.md`: dated notes in the
      Why cells of CD-42 (V5: no rating bars is the recorder's reading, not DEC-103's) and CD-45
      (the locked Legend's panel against DEC-60's "details of the class").
    - `docs/changelog/pr-feat-hud-and-character-select.md`: the "Integration recipe" gains two
      items for M3 (`botRoster.test.ts` restates `assignLanes`; `occupied` and the lane mix).
    - `docs/plan/PROGRESS.md`: this entry.
    - `INBOX.md` (not under `docs/`): HC-T1's bullet and table; notes under HC-C1 and HC-Q15; new
      HC-B2 (better than the design: a view over a selection step, and its name) and HC-Q23; a Done
      entry.
  - V4: no current doc says the session's only random stream is `createRng` or `LcgRng`; the old
    mentions are in dated records, which stay as written.
- Checks run: `npm run check` EXIT=0 (core 116 files / 628 tests, client 236 files / 1440 tests,
  build, "Documentation check passed."). Red proofs, each break turned its test red and was
  restored byte-identical: F1 (minis spread back into `SELECTION_PRIMARY_ASSETS`), a mini's group
  back to `selection-primary`, V1 (the button handler returns at once), V2 (no description; no
  strip; always open), V4 (LOCK IN builds its own `SeededRandom`). This pass (docs only):
  `npm run docs:check` "Documentation check passed."; Prettier clean on the touched files;
  `git apply --check` of the D2b patch prints nothing.
- Next step: the critic's loop 2 on the fixes, then merge into `feat/hud-and-character-select`.

### 2026-10-30 — Phase 2 / Track B (S1 carry-over) / HUD and character select, batch 2's critic loops 2 and 3 (round B23) — feat/hud-plan-b2 — sholtzman + Claude Code

- What was done: the architecture critic's loop 2 on `a37cd83..b1bb032` approved (no blocker or
  major; loop 1's findings resolved, V3's rejection acceptable); its minor finding and nits are
  fixed in `e7f7cf4` and this round: the roster stream's name and fork move from
  `SessionController.constants.ts` (the class no longer reads them) into
  `game/session/createRosterRng.ts`, bound in `main.tsx` and the test deps, with its own test (the
  same seed repeats; the stream is apart from the seed's own); the TSDoc of `modalKeyFilter.ts`,
  `useModalKeyFilter.ts` and `ViewDetailsScreen.tsx` names the bound mouse buttons, and says that a
  `pause-menu` button's release is no longer filtered once the view closes. Declined: View Details'
  backdrop keeps the selection tokens `--selection-art-shade` and `--selection-drop-shadow` (its
  own palette; the critic agreed); ponytail loop 2's hoisted `pause-menu` match (two different
  questions, no line saved). Loop 3 on `b1bb032..e7f7cf4` approved with nits only.
  - Every edit to a sholtzman-owned doc: `docs/architecture/02-code-structure.md` §12
    "Implementation status" names `createRosterRng.ts` among the `game/session/` files (a status
    note, not design text); `docs/plan/PROGRESS.md`: this entry.
- Checks run: `npm run check` EXIT=0 on `e7f7cf4` plus this round (core 116 files / 628 tests,
  client 237 files / 1442 tests, build, "Documentation check passed."). Red proofs, each break turned its test red and
  was restored byte-identical: the button listeners left bound on unbind; the button listeners in
  the bubble phase; a second control in the class View Details; LOCK IN building its own
  `SeededRandom` (again, after the move); the roster stream without its fork; the roster stream
  off the match seed.
- Next step: merge `feat/hud-plan-b2` into `feat/hud-and-character-select` (no fast-forward, local);
  then the remaining build-plan steps.

### 2026-10-30 — Phase 2 / Track B (S1 carry-over) / HUD and character select, batches 3 and 4 of the build plan merged (steps 4, 10, 11, 12 partial, 13; DEC-110 to DEC-112, DEC-114; docs pass, round B24) — feat/hud-plan-b3a — sholtzman + Claude Code

- What was done: lane 3b (merged in `dfab3f7`) built steps 4, 10 and 11: the Coming Soon void on the
  locked card (`180601d`, DEC-104), the empty live HUD kit with the Vanguard's helmet only
  (`80a9689`, DEC-101) and destroyed structures on the strip (`cf7efbe`, DEC-69, DEC-108). Lane 4
  (merged in `373e426`) built step 12 in part and step 13: a crashed match ends and returns to the
  menu with a message (`cca838d`, DEC-106) and the developer camera tools show or hide on
  Cmd/Ctrl+Shift+F3 (`e84c8aa`, DEC-105). Lane 3a built DEC-110 to DEC-112 (`b1fe73e`, `8d33344`,
  `1662eb8`, docs in `e0597fc`). DEC-114 (`1f5cb75`): the live HUD shows the art that fits the
  picked Legend (the Vanguard's Courage gadget, the Magus staff, the Bulwark's Wuuthrad) and leaves
  every other frame empty; red proofs 8/8 (`eternalus-agent-work/hud-charselect/build-1029/b34-redproofs-dec114.txt`,
  outside the repository).
  - Docs (round B24): `13-owner-decisions-log.md` gets DEC-114 to DEC-116 (the owner's answers Q1
    to Q3; no DEC-113 row, the number belongs to `docs/game-loop-and-results-plan`) and a dated
    note on DEC-101; reference 15 gets dated notes on CD-05, CD-38 and OD-37; the PR register's
    "Integration recipe" gets one item (a destroyed structure must stay published with health 0;
    check against PR #55); `INBOX.md`: HC-T1's round B24 bullet and table (T-184 redrafted, T-192 to
    T-208 new, 35 pending), status notes under HC-F2, HC-F6, HC-F8, HC-Q4 and HC-Q8, HC-Q24 to
    HC-Q26 (answered) and HC-Q27 (accept the crash-report ADR), a Done entry.
  - Every edit to a sholtzman-owned doc: the decisions log (DEC-114 to DEC-116 rows; the DEC-101
    note), reference 15 (three dated notes in Why cells and the OD-37 row), the PR register (one
    dated paragraph), this entry. The design-text changes (17 new rows and T-184's redraft) are
    pending rows in the D2b patch, not applied.
- Checks run: the merged check before DEC-114 gave EXIT=0 (core 628/628, client 1475/1475;
  `eternalus-agent-work/hud-charselect/build-1029/b34-check-merged.log`, outside the repository).
  The final check: to be filled by the orchestrator. This pass (docs only): `npm run docs:check`
  and Prettier on the touched files, `git apply --check` of the D2b patch.
- Next step: critic loop 1 (running), merge into `feat/hud-and-character-select`, the owner's
  acceptance of ADR 0025, the step-12 report lane, steps 15 and 16; step 17 waits for PRs #55 to
  #58.

### 2026-10-30 — Phase 2 / Track B (S1 carry-over) / HUD and character select, batches 3 and 4's critic loop 1 (items m1, m2, n1, n3, A2, B1, M2; DEC-117, DEC-118; docs pass, round B25) — feat/hud-plan-b3a — sholtzman + Claude Code

- What was done: code fixes from the critic's loop 1 (the orchestrator's, uncommitted when this docs
  pass ran): `MatchHost` runs a client-only one-shot action from a table of action to handler
  (`runOneShotAction`, one entry: `toggle-developer-camera`; m1, DEC-117); the two default chords of
  `toggle-developer-camera` are ordered by platform at load, Cmd first on an Apple device (n1,
  DEC-118); a test ties the stored chord modifiers (`CHORD_MODIFIERS`) to the bridge's
  `ChordModifier` type (m2); the test order nit (n3); a `ponytail:` comment on `endCrashedMatch`
  (A2: the menu banner is DEC-106's interim; build-plan step 12 replaces it with ADR 0025's report
  popup and `ErrorBoundary`). Red proofs 8/8 in
  `eternalus-agent-work/hud-charselect/build-1029/b34-redproofs-loop1.txt` (outside the repository).
  - Docs (round B25): `13-owner-decisions-log.md` gets a fourth batch of 2026-10-30 with DEC-117 and
    DEC-118 (the owner's answers B1, m1 and n1; DEC-119 stays unused) and dated notes on DEC-57,
    DEC-62 and DEC-105; reference 15 gets CD-47 (a destroyed structure's look, DEC-69, `cf7efbe`);
    status notes in architecture 13 §10, architecture 06 §10 and architecture 14 §14 (the chord
    `modifiers` field added inside schema version 1); `INBOX.md`: HC-T1's round B25 bullet and table
    (T-196 redrafted, T-209 to T-212 new, 39 pending), HC-B3, HC-Q28 and HC-Q29 (answered), a Done
    entry.
  - Every edit to a sholtzman-owned doc: the decisions log (DEC-117 and DEC-118 rows; dated notes on
    DEC-57, DEC-62 and DEC-105), reference 15 (the CD-47 row), architecture 13 §10, 06 §10 and 14 §14
    (one dated status note each), this entry. The design-text changes (T-196's redraft and four new
    rows) are pending rows in the D2b patch, not applied.
  - The orchestrator, after the docs pass: the 14 §14 note words the optional field as a reading
    for the owner, not an interim, and `INBOX.md` gains HC-B4 (better than the design: an optional
    field that old saves lack needs no new save version; open). ADR 0025's draft is checked against
    the installed Vite 8.3.1 and React 19.3 types (one fix: `componentStack` may be null) and added
    as `docs/decisions/0025-error-reports-through-the-local-dev-server.md` (proposed); HC-Q27 names
    it.
- Checks run: `npm run check` EXIT=0 (core 628/628, client 1482/1482, documentation check passed;
  `eternalus-agent-work/hud-charselect/build-1029/b34-check-loop1-fixes.log`, outside the
  repository). The previous entry's final check, run on `3588904`: EXIT=0 (core 628/628, client
  1477/1477; `b34-check-3588904.log` in the same folder). This docs pass also ran `npm run
docs:check`, Prettier on the touched files and `git apply --check` of the D2b patch.
- Next step: critic loop 2, merge into `feat/hud-and-character-select`, the owner's acceptance of
  ADR 0025, the step-12 report lane.

### 2026-10-30 — Phase 2 / Track B (S1 carry-over) / HUD and character select, batches 3 and 4's critic loop 2 (items V1, D1, N1 to N3) — feat/hud-plan-b3a — sholtzman + Claude Code

- What was done: the critic's loop 2 found no blocker; every loop-1 item is closed. Fixes:
  - V1 and N1: `game/input/keybindings.ts` is plain data again (no platform read; the developer
    camera chords in literal order, Ctrl first). `main.tsx` reads the platform (a user agent that
    contains "Mac") and injects it as `isApplePlatform` into `SettingsController`, which lists the
    platform's own chord first each time it publishes the settings and saves what it published
    (`ownPlatformChordsFirst` in `game/input/bindingEdits.ts`). DEC-118's behaviour is unchanged.
    Red proofs 6/6 in `eternalus-agent-work/hud-charselect/build-1029/b34-redproofs-loop2.txt`
    (outside the repository; script `redproof_loop2.py` beside it). The `main.tsx` line has no unit
    test (composition root); the type makes the flag required.
  - D1: ADR 0025 (proposed) no longer says the plugin's middleware runs before Vite's own; the
    plugin depends on no Vite middleware order or check, refuses a `Host` other than `localhost`,
    `127.0.0.1` or `[::1]` (DNS rebinding), and its Watch line names `server.allowedHosts: true`
    and `server.https`. The critic's Vite source lines were not re-read: the installed Vite chunk
    files are not readable in this session; the `allowedHosts` warning was read in Vite's types.
  - N2: `last-reviewed` bumped in architecture 06 and 14 (13 was already current). N3: the loop-1
    Done entry in `INBOX.md` names HC-B4.
  - Every edit to a sholtzman-owned doc: the decisions log (a dated note on DEC-118 and one more
    path in its last cell), ADR 0025 (§1, §2, §8 item 2, Watch), architecture 13 §10 (the status
    note names `SettingsController`), 06 and 14 (`last-reviewed` only), `INBOX.md` (a dated note
    under HC-Q28, the loop-1 Done entry, a new Done entry), this entry. No design text changed.
- Checks run: `npm run check` EXIT=0 (core 628/628, client 1485/1485, documentation check passed;
  `eternalus-agent-work/hud-charselect/build-1029/b34-check-loop2-fixes.log`, outside the
  repository), run with this entry in place.
- Next step: critic loop 3 (the last) on this round, merge into `feat/hud-and-character-select`;
  the owner's answers to HC-Q27 (ADR 0025) and HC-B4 before the PR.

### 2026-10-30 — Phase 2 / Track B (S1 carry-over) / HUD and character select, batches 3 and 4's critic loop 3 (items T1, T2, D2, D3) — feat/hud-plan-b3a — sholtzman + Claude Code

- What was done: the critic's loop 3 (the last of three) closed all five loop-2 items and found no
  blocker. Fixes:
  - T1: loop 2 deleted the four user-agent tests and left the platform check untested in
    `main.tsx`. Correction to the previous entry ("The `main.tsx` line has no unit test"): the check
    is now `isAppleUserAgent` in `apps/client/src/game/isAppleUserAgent.ts` (beside
    `developerFlags.ts`, same pattern), tested for a Mac, an iPad, an iPhone, Windows and Linux;
    `main.tsx` passes it `window.navigator.userAgent`.
  - T2: the Apple row of `SettingsController.test.ts` also checks `controller.bindings`, so the
    order the controller keeps (and the next rebind swap reads) is pinned.
  - D2: DEC-118's last cell names `bindingEdits.ts` for `ownPlatformChordsFirst`. D3: one ADR 0025
    line rewrapped.
  - Red proofs 4/4 in `eternalus-agent-work/hud-charselect/build-1029/b34-redproofs-loop3.txt`
    (outside the repository; script `redproof_loop3.py` beside it). No critic loop 4 (the owner's
    limit is three); these fixes have red proofs and a full check, not a critic read.
  - Every edit to a sholtzman-owned doc: the decisions log (DEC-118's last cell), ADR 0025 (one
    line rewrapped), `INBOX.md` (a Done entry), this entry. No design text changed.
- Checks run: `npm run check` EXIT=0 (core 628/628, client 1490/1490, documentation check passed;
  `eternalus-agent-work/hud-charselect/build-1029/b34-check-loop3-fixes.log`, outside the
  repository), run with this entry in place.
- Next step: merge into `feat/hud-and-character-select`; the owner's answers to HC-Q27 (ADR 0025)
  and HC-B4 before the PR.

### 2026-10-30 — Phase 2 / Track B (S1 carry-over) / HUD and character select, record ADR 0025's acceptance (DEC-124) and HC-B4 (DEC-125) (docs pass, round B26) — feat/hud-plan-b5 — sholtzman + Claude Code

- What was done: the owner accepted ADR 0025 ("sure. accept both. continue"), answered its three
  open questions as recommended in one dialog, and took option 1 of HC-B4. His words are kept
  verbatim in `eternalus-agent-work/hud-charselect/decisions/owner-answers-2026-10-30-adr0025-hcb4.md`
  (outside the repository).
  - Docs (round B26): `13-owner-decisions-log.md` gets a fifth batch of 2026-10-30 with DEC-124
    (ADR 0025 accepted: (a) the silent-error list of its §6 as written; (b) a screen crash outside
    a match uses a new reason `'screen-crashed'`, "The screen stopped because of an error.", and the
    same note popup; (c) the copy-mode text and a "Copy report" button) and DEC-125 (a record's
    `schemaVersion` is bumped only for a field old saves cannot satisfy), and dated notes on
    DEC-115 and DEC-116. ADR 0025 is accepted (`status: active`, its description and Status line);
    each open question carries its answer, and the two pointers to them (§5 Q2, §6 Q1) carry the
    answer in brackets. Architecture 14 §14's status note records DEC-125. `INBOX.md`: HC-Q27 and
    HC-B4 answered and ticked; dated notes under HC-Q8, HC-Q25 and HC-Q26; HC-T1's round B26 bullet
    and table (T-202, T-203 and T-207 redrafted, T-208's status changed, T-213 to T-226 new, 53
    pending); a Done entry.
  - The orchestrator: the citation comment for DEC-125 in
    `apps/client/src/data/persistence/dto/SettingsDto.ts`.
  - Every edit to a sholtzman-owned doc: the decisions log (the fifth batch's DEC-124 and DEC-125
    rows; dated notes on DEC-115 and DEC-116), ADR 0025 (frontmatter `description` and `status`,
    the Status line, the pointers to Q2 in §5 and to Q1 in §6, one answer under each open
    question), architecture 14 §14 (one dated note), `INBOX.md`, this entry; `docs/README.md`'s
    index line for ADR 0025 is regenerated from the new description. The design-text changes (14
    new rows and three redrafts) are pending rows in the D2b patch, not applied.
- Checks run: `npm run docs:check` "Documentation check passed." (122 files); Prettier clean on
  the seven touched files; `git apply --check` of the D2b patch printed nothing; the pre-commit
  `npm run check:quick` passed. The full `npm run check` was not run on this commit: the writer
  part of step 12 was being built in the same worktree, uncommitted; the lane's full check runs
  after the writer part.
- Next step: build-plan step 12 (ADR 0025 §8) in this lane: core (the external command log, the
  replay checkpoints, `exportReplay()`, `recentContext()`), then the writer, then the popup.

### 2026-10-30 — Phase 2 / Track B (S1 carry-over) / HUD and character select, build-plan step 12 (ADR 0025 §8 items 1 to 3: replay export, error-report writer, crash popup) — feat/hud-plan-b5 — sholtzman + Claude Code

- What was done: three code commits on top of `f9fbaf8`.
  - `531cd90` (core): `Simulation.enqueueCommand` logs external commands; checkpoints at tick 0
    and every `REPLAY_CHECKPOINT_EVERY` ticks; `exportReplay()`; `recentContext()` in
    `diagnostics/recentContext.ts`, shared with `InvariantRunner`; `LogContext` exported.
  - `6db5713` (writer): the dev-server plugin `apps/client/errorReportsPlugin.ts`; under
    `src/data/logging/` the `ErrorReport` types and constants, the `ReportWriter` port with its
    contract test, the dev-server and memory writers, `ErrorReporter` (the crash path, notes, and
    ADR §6's silent reports), `logWindowErrors.ts`; the match evidence chain; the `main.tsx`
    wiring; `logs/` in `.gitignore`.
  - `226e2c6` (popup): `ErrorBoundary` (the one class component, DEC-115) around the current
    screen in `App`; `CrashReportNotice` with DEC-106's words and DEC-124 (b) and (c) (asking,
    saving, saved, copy); `CrashReportFlow` and `handleScreenCrash` in `src/game/session/`; the
    reporter is a `SessionController` dependency; a loop crash and a screen crash in a match both
    report before the session leaves `match`; outside a match the session returns to the menu
    with `'screen-crashed'`. The `'match-crashed'` banner and the DEC-106 interim are removed.
- Red proofs (scripts and outputs in `eternalus-agent-work/hud-charselect/build-1030/`, outside
  the repository): core 10 breaks, writer 56, popup 54; every break RED, baseline and restore
  green, production files restored byte for byte.
- Checks run: `npm run check` EXIT 0 on `226e2c6`'s tree. Core 118 files, 634 tests; client 252
  files, 1657 tests; client coverage (lines, branches, functions, statements) 96.79 / 93.59 /
  95.23 / 97.23; "Documentation check passed." (122 files).
- Gaps reported to the owner, not changed: ADR 0025 does not define `reportCrash`'s input or a
  failed note write (the writer returns copy mode); the plugin's answer `file` uses
  `ERROR_REPORTS_FOLDER`, not its `dir` option; `ErrorReport.constants.ts` is in the app and the
  node tsconfig projects; `SESSION_TRANSITIONS` has no move to `menu` from `menu` or
  `pre-launch` (a menu crash goes back to `home`; a `pre-launch` crash keeps the popup and the
  reveal runs on); the source is `screen:<registry id>`, not the component name (names are
  mangled in a build); the saving and saved texts are recommendations, not owner words.
- Next step: the pre-PR gate (critic and ponytail, at most three loops) on `f9fbaf8..HEAD`, then
  a `--no-ff` merge into `feat/hud-and-character-select`; then build-plan step 15 (load on demand).

### 2026-10-30 — Phase 2 / Track B (S1 carry-over) / HUD and character select, build-plan step 12's critic loop 1 (six minor items, four nits, ponytail cuts) — feat/hud-plan-b5 — sholtzman + Claude Code

- What was done: the critic (architecture-reviewer on `f9fbaf8..c228b73`) found no blockers, six
  minor items and four nits; the ponytail review found five cuts. Fixed in `dce7b0c`:
  - The report's stack text and the FATAL record keep React's component stack.
  - The popup's title comes from what crashed (`cause`: match or screen), not the session reason,
    so a crash in the pre-launch reveal says "The screen stopped because of an error.".
  - A crash number keys the dialog, so a second crash starts with an empty note.
  - A saved report whose note write failed has its own copy text (`isReportSaved`), not DEC-124
    (c)'s "could not be saved".
  - A happy-dom test with the real `App` and `GameCanvas` shows the report comes before the
    viewport detach.
  - The tick is read through `RunningMatch.currentTick()`, in a try/catch, not by building the
    evidence.
  - `SessionCrashes` owns the crash wiring; `SessionController.ts` is 310 lines.
  - `ErrorBoundary.types.ts`; the plugin tests are split in two files with shared fixtures.
  - A test links each silent-report rule's body to its log site.
  - `reportedErrorOf` moves to `data/logging/`; `logWindowErrors` reuses it; one `errorText`
    const.
  - Not done, with reasons: `ErrorReporter.withNote`'s non-JSON branch stays (it keeps `addNote`
    from rejecting; cutting it deletes a test); `logTail.slice(-LOG_TAIL_RECORDS)` stays (the one
    place the report's limit applies to both evidence sources); DEC-115 and DEC-116's "Where"
    cells stay as written (historical rows; their dated notes record the acceptance).
  - `INBOX.md`: HC-Q30 asks the owner for the popup's three texts with no owner words (saving,
    saved, note not saved) and three behaviours (the second click after a saved note, a crash in
    the pre-launch reveal, a crash of the home screen); `strings.ts` cites it.
- Red proofs: 27 breaks, every break RED in its own test file, baseline and restore green
  (`eternalus-agent-work/hud-charselect/build-1030/s12-loop1-redproofs.txt`).
- Checks run: `npm run check` EXIT 0 on `dce7b0c`'s tree. Core 118 files, 634 tests; client 255
  files, 1672 tests; client coverage 96.92 / 93.85 / 95.35 / 97.36; "Documentation check passed."
- Next step: critic loop 2 on `c228b73..HEAD`, then the `--no-ff` merge into
  `feat/hud-and-character-select`.

### 2026-10-30 — Phase 2 / Track B (S1 carry-over) / HUD and character select, build-plan step 12's critic loop 2 (one minor item, five nits) — feat/hud-plan-b5 — sholtzman + Claude Code

- What was done: the critic (on `c228b73..4ad6d72`) found no blockers, one minor item and five
  nits, and found that the three items loop 1 declined have reasons that hold. The ponytail review
  found four cuts.
  - `INBOX.md` HC-Q30 (the minor item): item 5 is built as option A until the owner answers, not
    as the recommended B; its "Today" now says the popup stays open over the starting match and
    its two buttons only close it.
  - Code (the commit after `4ad6d72`): `MATCH_CRASH_BODY` in `SessionCrashes.constants.ts`;
    `crashMatch` private; `crashNumber`'s TSDoc; `logWindowErrors` reads the message and the stack
    once per event; `ErrorReporter.test.ts` (335 lines) split into the silent path (195) and
    `ErrorReporter.crash.test.ts` (106), with the shared setup in
    `__fixtures__/errorReporterSetUp.ts`. The test count is 33 before and after (the file at
    `4ad6d72` was run beside the split files).
  - Not done, with reasons: no `SessionCrashes.test.ts`, because `SessionCrashes` is
    `SessionController`'s crash wiring moved out for the file length, and
    `SessionController.crash.test.ts` tests and red-proofs it through the session's public API; a
    sibling test would repeat those tests. Ponytail: the try/catch around the tick read stays (a
    crash path must not throw into `componentDidCatch`, `currentTick` is a port method, and a test
    holds it); `componentStack` stays a string that is `''` when React gives none (ADR 0025 §5).
  - For the PR: `GameCanvas.crash.test.tsx` imports `ui/App` from `game/` (test only, as
    `main.tsx` composes them; precedent `SettingsScreen.rebind.test.tsx`), and it holds the
    client's first `vi.mock`; `LogContext` is a new export of `@eternalus/core`.
- Checks run: no new behaviour, so no red proofs (refactors and moved tests; the existing tests
  cover them). `npm run check` EXIT 0: core 118 files, 634 tests; client 256 files, 1672 tests;
  client coverage 96.93 / 93.85 / 95.37 / 97.37; "Documentation check passed."
- Next step: critic loop 3 (the last) on this loop's diff, then the `--no-ff` merge into
  `feat/hud-and-character-select`.

### 2026-10-30 — Phase 2 / Track B (S1 carry-over) / HUD and character select, build-plan step 12's critic loop 3 (no findings) — feat/hud-plan-b5 — sholtzman + Claude Code

- What was done: the critic (on `4ad6d72..299a2da`) found nothing at any severity: every loop-2
  item fixed or declined with a reason that holds, the `ErrorReporter` test split moves the tests
  unchanged (15 `it(` and 34 `expect(` before and after), `logWindowErrors` behaves the same, and
  HC-Q30 item 5 matches the build. The gate ends after three loops with no blockers.
- Checks run: `npm run check:quick` EXIT 0 at `299a2da`; the full `npm run check` EXIT 0 ran on
  the loop-2 code (`c604ee0`'s tree; `299a2da` changes only `INBOX.md` and this file).
- Next step: the `--no-ff` merge into `feat/hud-and-character-select` waits: an unfinished merge
  of `origin/phase/2-sprint-2-work` (started 2026-10-30 18:41, not by this lane) is open in that
  worktree, and the owner chose to wait for it to be committed or aborted. Then build-plan step
  15 (load on demand).

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m2a-brains-perception — SamarjitBhogal + Claude Code

- What was done: merged `phase/2-sprint-2-work` (now with M4, PR #40) into PR #39. M4 and M2a were
  built in parallel, so the steering code was joined: `PathingSystem` keeps M2a's `state.space`
  neighbours and gains M4's flow fields (rebuilt within `flowFieldCellBudget`, one per horde lane);
  `LaneFollowMovementStrategy` routes along the field where the line to the slot is blocked and
  queries `queryCircle`; M4's own grid and `cellSize` are dropped. Doc 18's status note covers both.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  690 passed (690)"; client "Tests 415 passed (415)"; "✓ built in 174ms"; "Documentation check
  passed."
- Next step: merge into the enemy-AI plan (#43) and up the stack.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m2a-brains-perception — SamarjitBhogal + Claude Code

- What was done: merged `phase/2-sprint-2-work` (now with the CI test-timeout fix, PR #53) into
  PR #39. The only conflict was `PROGRESS.md`; both sides' entries are kept in date order.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  690 passed (690)"; client "Tests 415 passed (415)"; "✓ built in 149ms"; "Documentation check
  passed."
- Next step: merge into the enemy-AI plan (#43) and up the stack.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m2a-brains-perception — SamarjitBhogal + Claude Code

- What was done: third CodeRabbit round on PR #39. Doc 18's implementation status no longer says
  the damage pipeline is missing (`combat/DamagePipeline` is built; structures have only the
  `Structure` base). `SpawnSystem` now reads definitions from the factory
  (`EntityFactory.definitions` is public read-only) and `DefaultSystemPipeline` drops its separate
  `definitions` option, so a horde request the dev-spawn handler accepted can always be spawned.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  690 passed (690)"; client "Tests 415 passed (415)"; "✓ built in 150ms"; "Documentation check
  passed."
- Next step: merge into the enemy-AI plan (#43) and up the stack.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m2a-brains-perception — SamarjitBhogal + Claude Code

- What was done: at the owner's request, commented out `Simulation.hordes.test.ts` "brings every
  opening horde to its enemy end with no stuck mob" (3 and 5 lanes). With M2a's brains and
  perception the 530 s march takes about 8 s locally but 95–125 s on the GitHub runners under
  coverage, past the 60 s timeout. A named `vitest/no-commented-out-tests` disable with a reason
  sits above it. Restore it once the march is cheaper or runs in a separate non-coverage job.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  688 passed (688)"; client "Tests 415 passed (415)"; "✓ built in 155ms"; "Documentation check
  passed."
- Next step: restore the march test (owner to choose: shorter march or soak job).

### 2026-10-30 — Phase 2 / sprint 2.2 — docs/minion-plan-all-enemy-ai — SamarjitBhogal + Claude Code

- What was done: merged `phase/2-sprint-2-work` (now with M1, M2a and M4 merged, and the CI test
  timeout fixes) into PR #43. Conflicts: doc 18's frontmatter (kept `camps` in `tags`, newest
  `last-reviewed`) and `PROGRESS.md` (both sides' entries kept in date order).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  688 passed (688)"; client "Tests 415 passed (415)"; "✓ built in 162ms"; "Documentation check
  passed."
- Next step: merge into M2b (#44) and up the stack.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m2b-minion-controller — SamarjitBhogal + Claude Code

- What was done: merged the enemy-AI plan (#43, now with the merged M1, M2a and M4) into PR #44.
  M2b and M4 were built in parallel, so the steering code was joined: `PathingSystem` keeps M2b's
  chase, `arrivalRadius` and `formationSlot`, and gains M4's flow fields (fourth constructor
  argument, rebuilt each tick, `context.flow`); `LaneFollowMovementStrategy` routes along the field
  where the line to its target (slot or chased unit) is blocked and stops within `arrivalRadius`.
  The M4 march tests now use the marching-only content, since M2b minions fight when hordes meet.
  `packages/core/AGENTS.md` describes the `ai/` contract as returning a `Decision` (CodeRabbit).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  714 passed (714)"; client "Tests 415 passed (415)"; "✓ built in 173ms"; "Documentation check
  passed."
- Next step: merge into M5a (#45) and M3 (#46).

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m3-bot-laners — SamarjitBhogal + Claude Code

- What was done: merged the updated M2b (#44, now with M4's flow fields joined in) into PR #46.
  Conflicts: doc 18's frontmatter and status note (M4 and M3 sentences both kept; lane assignment
  no longer listed as unbuilt) and `PROGRESS.md` (both sides' entries in date order).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  740 passed (740)"; client "Tests 416 passed (416)"; "✓ built in 159ms"; "Documentation check
  passed."
- Next step: owner sign-off on the `packages/core/AGENTS.md` import-boundary row (CodeRabbit
  thread); merge into M8 (#47).

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m5a-modifiers — SamarjitBhogal + Claude Code

- What was done: merged the updated M2b (#44, now with M4's flow fields joined in) into PR #45.
  Conflicts: `DefaultSystemPipeline` imports (both kept), doc 18's status note (M4 and M5a
  sentences both kept) and `PROGRESS.md` (both sides' entries in date order).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  727 passed (727)"; client "Tests 415 passed (415)"; "✓ built in 157ms"; "Documentation check
  passed."
- Next step: review and merge after M2b.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m8-rover-astar — SamarjitBhogal + Claude Code

- What was done: merged the updated M3 (#46, with M2b's join of M4's flow fields) into PR #47. M8
  had joined M4 and M2b itself, so its side was kept for `PathingSystem`, `MovementStrategy.types`,
  `LaneFollowMovementStrategy` and the pipeline (the shared `world` grid); `laneMatch` takes
  M2b's `isMarchingOnly` flag, so the march tests stay marching-only while the determinism test
  fights. Doc 18's status note and `PROGRESS.md` keep both sides.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  765 passed (765)"; client "Tests 417 passed (417)"; "✓ built in 159ms"; "Documentation check
  passed."
- Next step: review and merge after M3.

### 2026-10-30 — Phase 2 / sprint 2.2 — docs/minion-plan-all-enemy-ai — SamarjitBhogal + Claude Code

- What was done: CodeRabbit round on PRs #43 and #47. Doc 18 §7.1 no longer says
  `GuardWithinLeashInvariant` covers camp mobs and defenders unchanged (doc 15 defines it for tower
  guards; extending it is M6 work, defenders wait on §10 item 4). The minion plan's M6 blockers add
  the owner's answer on the defenders' leash and unowned-point team; its description and purpose
  exclude turrets as well as bosses, matching the coverage table. Docs index regenerated.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  688 passed (688)"; client "Tests 415 passed (415)"; "✓ built in 159ms"; "Documentation check
  passed."
- Next step: merge up the stack.

### 2026-10-27 — Phase 2 / map objects — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: connected authored physical footprints to deterministic swept-circle collision,
  retaining both Cathedral entrances and all stronghold lane entrances. Added obstacle-backed
  map-object health, persistent destruction snapshots, ordinary attack targeting, walkable ruins,
  health bars and minimap invalidation. Building collapse damages owned contents through the
  shared damage pipeline. Terrain stays indestructible; Cathedral health follows its existing
  indestructible requirement. Missing scenery HP uses the owner's approved temporary value in
  content. Seeded placement and mirrored object identities are preserved. No sprite assets or
  dependencies were added. Updated the governing map, structure and physics implementation notes.
- Checks run: npm run check:quick passed. npm run check passed, exit 0: formatting, no-JS,
  lint, typecheck, knip, coverage, production build and documentation. Core 615/615 tests and
  client 435/435 tests pass. The coverage suite preserves its thresholds and time limits; the
  existing map-overlap test now rejects disjoint bounds before the same polygon checks and
  assertions. Regression coverage includes entrances, tunnelling, bridge crossings, destruction,
  walk-through ruins, replay hashes and minimap refresh. Browser preview loaded without console
  errors; the existing pre-launch placeholder limited manual gameplay verification. Verbatim tail:

  ```text
  Checked 113 Markdown files under docs/.
  Documentation check passed.
  ```

- Next: human playtest and balance temporary scenery health. Changes remain uncommitted; no PR,
  commit or push action was performed.

### 2026-10-30 — Phase 2 / PR #30 review corrections — feat/buildings-and-map-objects — Gurshaan + Codex

- What was done: merged origin/phase/2-sprint-2-work at c5b4d23 with the owner's explicit
  approval, resolved all conflicts and restored the saved local collision/destruction work.
  Kept the merge uncommitted. Replaced ID-based selection and reflection with authored metadata
  and per-kind interior/placement registries; shared Cathedral massing, precinct and throne-room
  content; derived palace scale from generated wall footprints; centralized palette and passage
  constants. Restored append-only design text and recorded the approved mirrored-camp amendment.
  Refiled the HUD-owned input/toolbar follow-ups. Logged match seeds and mocked startup RNG in
  tests. Removed renderer caching and close-view detail from this change, preserving their code
  and tests in a local renderer follow-up patch/archive, scheduled in INBOX with Gurshaan as owner.
  SceneView again owns all draw order. Preserved the three Match explorer signatures. Added
  GameState.livingBuffTowerCount(team), excluding obstacle proxies, and the shared throne anchor
  and room bounds for the separate game-loop integration. The later coordinated rename remains
  deferred. Physical map placements are injected explicitly, preserving headless horde scenarios.
- Checks run: npm run check:quick passed; focused geometry, seed, input, collision, destruction
  and BuffTower-query regressions passed. npm run check passed, exit 0: format, no-JS, lint,
  typecheck, knip, coverage, build and documentation. Core 725/725 tests and client 428/428
  tests passed. The renderer-specific tests travel with the extracted renderer code; no
  guardrail or coverage threshold was weakened. An initial Knip runtime memory-allocation
  failure was retried; the retry identified an unused type export, which was fixed before the
  passing full gate. Verbatim final tail:

  ```text
  Checked 115 Markdown files under docs/.
  Documentation check passed.
  ```

- Next: independent architecture critic and reviewer-owned Ponytail handoff; update PR target,
  title and description with honest gate status. The renderer follow-up still needs material
  metadata, cache activation inside SceneView, file-length/capture-layer corrections and
  camera-moving p95 measurements before its own PR. No commit, push or new PR was performed.

### 2026-10-30 — Phase 2 / Sprint 2 — PR #30 critic follow-up

- Branch: feat/buildings-and-map-objects.
- Fixed the critic's content-injection violation: Simulation supplies map-object definitions to
  WorldObjectStore; the store no longer imports global content policy. Added a custom definition
  ID and health regression. Independent code re-review approved the fix with no new blocker.
- Checks: npm run check:quick passed. npm run check passed (exit 0): 726 core tests and
  428 client tests, coverage, formatting, lint, typecheck, Knip, build and docs. Verbatim tail:

  ```text
  Checked 115 Markdown files under docs/.
  Documentation check passed.
  ```

- Next: PR metadata update is blocked by GitHub integration permissions (403 Resource not
  accessible by integration). Prepared title, phase-branch target and description are saved
  outside the repository for manual application. Ponytail and its post-cut full check remain
  required before merge. Changes and the pending Phase 2 merge remain uncommitted and unpushed.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m2b-minion-controller — SamarjitBhogal + Claude Code

- What was done: CodeRabbit round on PR #44 (and the critic's follow-ups). A chasing minion no
  longer follows the lane flow field, which leads to the lane's end, not to its target:
  `PathingSystem` hands the strategy no field while a member has an attack target. Regression test
  (upstream target across the blocked lane's rift) fails on the old code. Doc 18 §5.2 says so; a
  `ponytail:` remark names the ceiling (terrain between chaser and target can stall it; A* to the
  target replaces it). Merged the enemy-AI plan's latest doc fixes.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  715 passed (715)"; client "Tests 415 passed (415)"; "✓ built in 161ms"; "Documentation check
  passed."
- Next step: merge into M5a (#45) and M3 (#46).

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m3-bot-laners — SamarjitBhogal + Claude Code

- What was done: CodeRabbit round on PR #46. `Simulation` now refuses a roster whose team has more
  Legends than `match.legendsPerTeam`, before anything spawns (five lanes of `legendsPerLane` 3
  held 11 laners against a cap of 10); test in `Simulation.bots.test.ts`. Merged M2b's chase fix.
  The `packages/core/AGENTS.md` import-boundary thread still needs the owner's sign-off.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  741 passed (741)"; client "Tests 416 passed (416)"; "✓ built in 179ms"; "Documentation check
  passed."
- Next step: owner sign-off; merge into M8 (#47).

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m5a-modifiers — SamarjitBhogal + Claude Code

- What was done: CodeRabbit round on PR #45. Doc 11's implementation status now says why
  `AiSystem` is first today and second once `CommandApplySystem` heads the pipeline (§1 keeps the
  design order; `Simulation.step()` applies commands until then, doc 03). CodeRabbit's wording
  ("after `CommandApplySystem`") was not used: that system does not exist yet. Merged M2b's chase
  fix.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  728 passed (728)"; client "Tests 415 passed (415)"; "✓ built in 150ms"; "Documentation check
  passed."
- Next step: review and merge after M2b.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m2b-minion-controller — SamarjitBhogal + Claude Code

- What was done: CodeRabbit round on PR #44. Dropping the flow query while chasing also dropped
  the blocked-line check, so a chase could steer into a rift. `PathingSystem` now always passes the
  lane field and sets `MovementContext.isChasing`; `LaneFollowMovementStrategy` still detects a
  blocked line, routes a march along the field and holds a chase. The rift test now expects the
  chaser to hold; a strategy test covers blocked and clear chases. Doc 18 §5.2 updated.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  716 passed (716)"; client "Tests 415 passed (415)"; "✓ built in 169ms"; "Documentation check
  passed."
- Next step: CodeRabbit re-review; merge into M5a (#45) and M3 (#46).

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m5a-modifiers — SamarjitBhogal + Claude Code

- What was done: CodeRabbit round on PR #45 (a chase could steer through a rift). Merged M2b's fix
  (#44): `PathingSystem` always passes the lane field with `MovementContext.isChasing`, so a
  blocked chase holds and a march still routes. CodeRabbit's suggestion (route the chase along the
  lane field) was not used: that field leads to the lane's end, which its own #44 review flagged.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  729 passed (729)"; client "Tests 415 passed (415)"; "✓ built in 150ms"; "Documentation check
  passed."
- Next step: CodeRabbit re-review; merge after M2b.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m2b-minion-controller — SamarjitBhogal + Claude Code

- What was done: CodeRabbit round on PR #44. Separation was added after a held chaser's steering
  was zeroed, so a neighbour behind it could push it onto unwalkable ground.
  `LaneFollowMovementStrategy` now checks the final heading (separation included) over
  `blockedLookAhead` and holds any mob it would take onto blocked ground. Regression test (a held
  chaser with a neighbour one unit behind) fails on the old code. The routing test's stub now
  blocks only the line toward the slot; its no-direction case now expects a hold, not a step onto
  blocked ground. Doc 18 §5.2 updated.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  717 passed (717)"; client "Tests 415 passed (415)"; "✓ built in 177ms"; "Documentation check
  passed."
- Next step: CodeRabbit re-review; merge into M5a (#45) and M3 (#46).

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m2b-minion-controller — SamarjitBhogal + Claude Code

- What was done: CodeRabbit round on PR #44. The final-heading check always probed
  `blockedLookAhead` ahead, so a chaser with a clear line to a target just in front of blocked
  ground held outside attack reach. A chase with a clear line now probes only up to its target
  (arrival stops it there); marches keep the full look-ahead, since a shorter probe let formation
  members edge into the blocked lane's rift face and stall (the blocked-lane march test caught it).
  Regression test (chaser at x 46, target at x 49, blocked from x 50) fails on the old code.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  718 passed (718)"; client "Tests 415 passed (415)"; "✓ built in 162ms"; "Documentation check
  passed."
- Next step: CodeRabbit re-review.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m5a-modifiers — SamarjitBhogal + Claude Code

- What was done: merged `phase/2-sprint-2-work` (now with M2b, #44) into PR #45; only
  `PROGRESS.md` conflicted (both sides kept in date order). This brings M2b's final-heading check,
  which answers CodeRabbit's thread that separation could push a held chaser onto blocked ground.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  731 passed (731)"; client "Tests 415 passed (415)"; "✓ built in 156ms"; "Documentation check
  passed."
- Next step: CodeRabbit re-review.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m5a-modifiers — SamarjitBhogal + Claude Code

- What was done: cleared CodeRabbit's failed pre-merge check on PR #45. `GameState.test.ts` uses
  exact `toEqual` again (with `towersLostByLane: {}`) instead of `toMatchObject`. The owner chose
  DISC-24 reading (a), so the tower shift helps the team that destroyed the tower: INBOX item
  ticked, DEC-48 added to the decisions log, no code change. A comma fix in 11 §10. The two open
  threads (lane field during chases, separation in a blocked chase) were already fixed by the M2b
  merge, with tests.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  731 passed (731)"; client "Tests 415 passed (415)"; "Documentation check passed."
- Next step: CodeRabbit re-review and approval.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m3-bot-laners — SamarjitBhogal + Claude Code

- What was done: merged `phase/2-sprint-2-work` (with M5a) into PR #46. Doc 18's status note,
  INBOX, the plan's stand-in table and this log kept both sides. CodeRabbit round:
  `Simulation.spawnRoster` also checks `limits.maxUnitsPerTeam` (Legends are Units), with a test;
  doc 11 §10 says `profileId` names each controller's own content (aggro rules for minions,
  difficulties for bot Legends). The `ai/` → `teams/` (types) boundary already matches 02 on the
  phase branch, so no change.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  757 passed (757)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: CodeRabbit re-review; PR ready for review.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m3-bot-laners — SamarjitBhogal + Claude Code

- What was done: cleared CodeRabbit's failed "pr-review skill verdict" pre-merge check on PR #46.
  `PathingSystem.test.ts` again covers a mapped match without a spatial index (dropped when the
  no-op cases were split). `AiSystem.test.ts` covers `assertRegistered` falling back to the
  controller id as the profile when a definition names none (pass and throw).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  759 passed (759)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: push, then CodeRabbit re-review and approval.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m8-rover-astar — SamarjitBhogal + Claude Code

- What was done: merged the updated M3 (#46) into PR #47: M2b's chase fix (no lane field while
  chasing), M3's roster cap and the enemy-AI plan's doc fixes, which also answer #47's CodeRabbit
  thread (the plan's scope now excludes turrets as well as bosses). The plan table keeps M8's row
  (`PathQuery`) and the new M6 blockers; the new chase test uses M8's `GameState` indexes object.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  766 passed (766)"; client "Tests 417 passed (417)"; "✓ built in 169ms"; "Documentation check
  passed."
- Next step: review and merge after M3.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m8-rover-astar — SamarjitBhogal + Claude Code

- What was done: merged `phase/2-sprint-2-work` (M3 #46, M5a #45) into PR #47. The movement
  context keeps M8's `flow` and M2b's `isChasing`; the pipeline keeps M8's shared `world` plus
  M5a's `EnragedSystem`; doc 11 takes the phase's `profileId` bullet; other docs keep both sides.
  CodeRabbit round: `spawnBot` creates by the definition's `kind`, not its id; `moveTo` stops and
  fails when A\* finds no way. Regression tests for both fail on the old code.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  786 passed (786)"; client "Tests 417 passed (417)"; "✓ built in 272ms"; "Documentation check
  passed."
- Next step: review and merge (M3 and M4 are merged).

### 2026-10-30 — Phase 2 / sprint 2.2 (CodeRabbit, target memory) — feat/minion-m8-rover-astar — SamarjitBhogal + Claude Code

- What was done: CodeRabbit round on PR #47 (review of `da6734b`). When A\* finds no way,
  `BotLeaves.moveTo` now also clears `targetId` in the bot's memory: its `stop` clears the live
  attack target, and the stale memory made the next fight skip `attack-target`. The regression
  test fails on the old code.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  787 passed (787)"; client "Tests 417 passed (417)"; "✓ built in 252ms"; "Documentation check
  passed."
- Next step: CodeRabbit re-review; review and merge.

### 2026-10-30 — Phase 2 / sprint 2.2 (CodeRabbit, line checks) — feat/minion-m8-rover-astar — SamarjitBhogal + Claude Code

- What was done: CodeRabbit's outside-diff finding on PR #47 (`WorldMap.isLineClear` sampling can
  miss a clipped corner) is valid, but an exact cell walk made minions hold at rift corners and
  failed the M4 blocked-lane routing test (no wall-avoidance term yet). Deferred by the owner to
  `CollisionSystem`: a `ponytail:` note on `isLineClear` and an `INBOX.md` FYI item.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  787 passed (787)"; client "Tests 417 passed (417)"; "✓ built in 163ms"; "Documentation check
  passed."
- Next step: CodeRabbit re-review; review and merge.

### 2026-10-30 — Phase 2 / sprint 2.2 (CodeRabbit, roster test) — feat/minion-m8-rover-astar — SamarjitBhogal + Claude Code

- What was done: CodeRabbit's "Pr-Review Skill Verdict" pre-merge check on PR #47 flagged
  `placeholderRoster.test.ts` as loosened (checklists §2): M8 had narrowed it to the laners and
  used `find` for the dark-player Rover. For both player teams it now asserts the full roster's
  length (19), the laner checks and the exact non-laner list. CodeRabbit accepted the deferred
  line-check finding.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  787 passed (787)"; client "Tests 419 passed (419)"; "✓ built in 159ms"; "Documentation check
  passed."
- Next step: CodeRabbit re-review; review and merge.

### 2026-10-30 — Phase 2 / sprint 2.2 — fix/coderabbit-review — sholtzman + Claude Code

- What was done: applied the product owner's rulings on the review of the merged PR #48 (DEC-95
  to DEC-98, with the owner's follow-up picks on the critic's questions). ADR 0018 gained a dated
  amendment: player-facing and architecture decisions go to the product owner as blockers
  (visibility, not a veto); CodeRabbit blocks but never approves; nobody's text is a sign-off for
  someone else (the owner's own description counts on the owner's own PRs); drafts are not
  reviewed; learnings stay in this repo, wait 7 days for an admin, and
  are logged for the product owner. `.coderabbit.yaml` follows it (validated against
  `schema.v2.json`). The SDLC, git workflow, guardrails and tool-setup docs say "humans approve"
  again. New `scripts/coderabbit/collect-learnings.mjs` (zero dependencies, `gh api`) writes
  `docs/agents/coderabbit-learnings.md`; its 7 tests each failed on a deliberate break. The
  workflow that runs it every 2 days (`.github/workflows/coderabbit-learnings.yml`) and the
  `workflow_dispatch:` line in `ci.yml` were added by the product owner: agents may not edit
  workflows.
- Checks run (with the workflow files in, after merging the phase tip `9c58897`; only
  `PROGRESS.md` and the decisions log conflicted, both sides kept): `npm run check` → `EXIT=0`:
  "All matched files use Prettier code style!"; core "Tests 787 passed (787)"; client "Tests 419
  passed (419)"; "✓ built in 112ms"; "Documentation check passed." Pre-PR gate: architecture critic PASS after 2 rounds;
  ponytail review "Lean already".
- Next step: the repo admin turns on Code Owner review on `phase/**` and `main`, only then allows
  Actions to create and approve PRs, and deletes the stored "no human approval" learning in the
  CodeRabbit app.

### 2026-10-30 — Phase 2 / sprint 2.2 — docs/renumber-dec-48 — sholtzman + Claude Code

- What was done: PR #45 logged its DISC-24 tower-shift decision as DEC-48, but the HUD and
  character-select branches have used DEC-48 since 2026-10-18 (class names are display names) and
  cite it in about 36 files. The tower-shift row is now DEC-120, with a note under its batch that
  maps the old number; its `INBOX.md` citation follows. The 2026-10-30 PR #45 entry above still
  says DEC-48: past entries are not rewritten, and the note maps it.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  787 passed (787)"; client "Tests 419 passed (419)"; "✓ built in 258ms"; "Documentation check
  passed."
- Next step: none; the HUD branches keep DEC-48.

### 2026-10-30 — Phase 2 / sprint 2.2 — fix/horde-leave-stronghold — SamarjitBhogal + Claude Code

- What was done: hordes spawn inside the Stronghold's blocking footprint, so the lane steering held
  every minion; a mob on unwalkable ground now walks straight to its slot (`isWalkableAt`), and one
  separation would push onto blocked ground keeps its own heading (crowds at a wall deadlocked).
  Doc 18 §5.2 updated; regression tests fail on the old code. Critic PASS (both changes better
  than the design; its fixes applied); ponytail: lean already. Merged the phase branch (#59, #60).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  791 passed (791)"; client "Tests 419 passed (419)"; "✓ built in 172ms"; "Documentation check
  passed."
- Next step: the product owner signs off on the doc 18 §5.2 change on PR #61 (ADR 0018, DEC-96;
  `INBOX.md` item); then mark it ready for review.

### 2026-10-30 — Phase 2 / sprint 2.2 — docs/pr-review-rulings — sholtzman + Claude Code

- What was done: recorded the owner's 2026-10-30 rulings from the open-PR review in the decisions
  log: DEC-85 (mirrored random camps, #30-A), DEC-86 (capture rules, #49), DEC-87 (spawn timeline),
  DEC-89 (most-struggling lane), DEC-90 (Legend XP target), DEC-91 (horde event names, #38-E),
  DEC-93 (tier-1 and tier-2 first waves at +165 s and +195 s, amending DEC-87). Requirements FR-005,
  FR-031, FR-033, FR-037 and FR-049 now cite them; structures doc §7 states the capture rules;
  INBOX DEC-15 question (1) closed by DEC-85; the XP-curve item notes that the resize waits for
  bot laners (PR #46). DEC-88 and DEC-92 belong to the game-loop work.
  Later the same day: DEC-94 (ObjectPool covers projectiles, not event payloads; PR #51) and
  DEC-99 (`crushed` is hard control; a re-applied stun restarts its timer; PR #52). The coding
  principles Object Pool row and the glossary's Object Pool entry cite DEC-94.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  731 passed (731)"; client "Tests 415 passed (415)"; "✓ built in 257ms"; "Documentation check
  passed." Moved onto the phase head `9c58897` (PRs #46 and #47; `INBOX.md` and this log kept both
  sides), then again `EXIT=0`: core "Tests 787 passed (787)"; client "Tests 419 passed (419)";
  "✓ built in 117ms"; "Documentation check passed." Moved onto `f12d680` (PRs #60 and #61; this
  log, `INBOX.md` and the decisions log kept both sides), then `EXIT=0`: "All matched files use
  Prettier code style!"; core "Tests 791 passed (791)"; client "Tests 419 passed (419)"; "✓ built
  in 118ms"; "Documentation check passed."
- Next step: a PR into `phase/2-sprint-2-work`. Docs owned elsewhere still to align
  (doc 18 §3.1/§3.3/§10, doc 07 §6 tower rows, doc 12 §2, FR-003) go to their sessions.

### 2026-10-30 — Phase 2 / sprint 2.2 — fix/minion-m1-review — sholtzman + Claude Code

- What was done: fixed the review findings on the merged PR #38 (minion M1) and the stalls they
  hid. Wave hordes spawned inside their structure's footprint never moved; the lane field now
  leads every reachable blocked corridor cell out (MS-31, Call 4 B). A mob that would slide along
  a wall faces the slide direction and walks that way (MS-35). The anchor holds while any member
  fights (MS-33). One opening horde per lane at load-in, every wave timed from the countdown's
  end (MS-30; `match.initialHordesPerTeam` removed). First tier-1 and tier-2 waves at +200 s and
  +230 s (DEC-127). `GameState.world` is a `MatchWorld` (F7d). Horde membership lives only in
  the store (MS-29). Separation falls off as 1/r (F7b). Merged the phase branch at `f12d680`
  (#61): MS-31 and MS-35 replace #61's walk-out and separation hold, and a chase on blocked ground
  follows the field out (DEC-126). Docs 02, 03, 04, 06, 10, 12 and 18, the minion plan and the
  phase 2 plan updated, and a status note under doc 07 §6; DEC-128 records Call 2 (MS-32). Ponytail
  cut: `FlowFieldBuilder.pointWallsOut` uses `cellOf`. The `INBOX.md` #61 item is decided and the
  MS-33 item added. Merged `docs/pr-review-rulings` (PR #62) for the DEC-87 and DEC-93 rows; FR-005
  now gives the DEC-127 first times.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  818 passed (818)"; client "Tests 419 passed (419)"; "✓ built in 108ms"; "Documentation check
  passed." After merging PR #62, again `EXIT=0`: core "Tests 818 passed (818)"; client "Tests 419
  passed (419)"; "✓ built in 107ms"; "Documentation check passed." Critic round 2: approve, no
  blockers; after its fixes, `EXIT=0`: core "Tests 818 passed (818)"; client "Tests 419 passed
  (419)"; "✓ built in 116ms"; "Documentation check passed."
- Soak (seed 1, 3 lanes, 900 s): skipped spawns 30.61 % light / 33.47 % dark without bots, 23.62 %
  / 43.22 % with bots; the < 5 % bar still fails until #56 gives hordes structures to attack.
- Next step: pre-PR gate and the PR into `phase/2-sprint-2-work`; then merge this fix into #55
  and #56 and build the Legend-only chase limit (MS-34) on #56.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-structures — SamarjitBhogal + Claude Code

- What was done: the part of sprint 2.1 the minion plan's M2c needs (unowned, so built here as
  plan row M2s). `Stronghold`, `SpawnerTower`, `BuffTower` and `Gate` entities with
  `content/structures/structureCatalogue.ts` (base health from `balancing.md`) and registry lines;
  `Simulation` builds one per map structure feature, in feature id order, with its lane.
  `BreakabilityRule` content, `StructureSystem` (emits `structure-destroyed` and
  `structure-breakability-changed`, gates unbreakable until 2 of 3 BuffTowers are down) and
  `BreakabilityStep` in the damage pipeline. The client registers an empty `StructureView` (the map
  layer already draws buildings). Docs 03, 07, 18 and the minion plan updated.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  727 passed (727)"; client "Tests 416 passed (416)"; "✓ built in 160ms"; "Documentation check
  passed." After the critic (blockers: the BuffTower count kept in the system, and
  `Collider.isUnbreakable` not hashed; both fixed, total now from config) and ponytail (lean, no
  cuts): core "Tests 728 passed (728)", client "Tests 416 passed (416)", `EXIT=0`.
- Next step: M2c on top of this branch.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m2c-objectives-guards — SamarjitBhogal + Claude Code

- What was done: minion plan M2c on top of M2s. `state/LaneStructures` (the lane-order objective
  index, built once the structures spawn); `HordeSystem` holds the anchor `objectiveHoldGap` in
  front of the next standing objective; `MinionController` attacks the breakable objective as
  `lane-objective` (gate holding until `structure-breakability-changed`); `assessLanes` scores
  structure damage not dealt and structures lost; `SpawnSystem` spawns from the structure entities
  (a destroyed tower stops) and runs the guard plans (`content/structures/guardPlans.ts`, posts in
  `state.guards`, respawn after 120 s, DISC-21 shrink); `GuardController` on the shared
  `ai/LeashBehaviour`; `LeashedChaseMovementStrategy`; guards steered by `PathingSystem`;
  `GuardWithinLeashInvariant`. Light, medium and heavy guard content. Four sign-off items in
  `INBOX.md`. Docs 18 and the minion plan updated.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  751 passed (751)"; client "Tests 416 passed (416)"; "✓ built in 184ms"; "Documentation check
  passed."
- Pre-PR gate: critic round 1 had one blocker (no test for `PathingSystem`'s guard steering), now
  tested with a guard engage-and-return match too; should-fixes applied (`GuardRoster` split out
  of `SpawnSystem` with its own tests, the DISC-21 shrink names its structure kind in content,
  guards acquire inside their leash, INBOX items 5–8, a plan §3 row). Critic round 2: approve, no
  blockers. Ponytail: lean, no cuts. Final `npm run check` → `EXIT=0`: core "Tests 755 passed
  (755)", client "Tests 416 passed (416)", "✓ built in 172ms", "Documentation check passed."
- Next step: M5b.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m5b-if-time — SamarjitBhogal + Claude Code

- What was done: minion plan M5b (MVP-if-time) on top of M2c. Minion XP: `Veterancy` component,
  `VeterancySystem` (kills from `entity-died`, a level per 2 mob kills up to 3, +10% max health,
  the `veteran` and `rallied` statuses, aura every 0.5 s within 4 m), content in
  `content/mobs/minionVeterancy.ts`; `Veterancy` is hashed. Ghosted first wave:
  `AggroRuleDefinition.ghostFirstWaveTicks` read by `LeashBehaviour.rankOf`, shipped at 0 (off).
  Tower Guardians not built (ranged attacks and numbers missing; `INBOX.md`). Docs 11 and 18
  updated.
- Pre-PR gate: critic approve, no blockers; should-fixes applied (only kills of lane minions count,
  per the game doc; tests for the level cap, non-minion victims and the aura cadence; a hasher test
  for `Veterancy`; doc 05's status note; doc 11's design text restored). Ponytail: lean, no cuts.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  763 passed (763)"; client "Tests 416 passed (416)"; "✓ built in 153ms"; "Documentation check
  passed."
- Next step: M6.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m6-camps-defenders — SamarjitBhogal + Claude Code

- What was done: minion plan M6, forest camps. `Camp` structure and three forest-camp definitions;
  light, medium and heavy camp mobs and the `camp-mob` aggro profile; camp groups as `group` guard
  plans activated at the countdown's end (balancing.md compositions, 6 m leash, 120 s group
  respawn); `GuardRoster` emits `camp-cleared` (new in doc 03's catalogue); guard plans are looked
  up by structure definition id; posts may be neutral and skip the unit cap. Checkpoint defenders
  not built: `CaptureSystem` is only on PR #49, which conflicts with the minion stack (INBOX).
  INBOX notes record the two earlier minion items as applied by their `Recommendation:`s.
- Pre-PR gate: critic round 1 had one blocker (no test of a neutral camp mob through
  `GuardController`), now tested with a camp-post leash invariant case; doc 15's leash row covers
  camp mobs; the one-way aggro between neutral and team units is an INBOX question. Ponytail: lean.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  768 passed (768)"; client "Tests 416 passed (416)"; "✓ built in 144ms"; "Documentation check
  passed."
- Next step: the owner's INBOX answers; checkpoint defenders once PR #49 lands.

### 2026-10-30 — Phase 2 / sprint 2.2 — fix/struggling-lane-signals (on PR #56) — Claude Code for sholtzman

- What was done: the owner's most-struggling lane (DEC-89) in `assessLanes`. The three terms are
  now `structureDamageTaken` (the team's own lane structures' lost share of their starting
  health), `pushedBack` (unchanged) and `alliesHurt` (the lane's share of the damage the team's
  Legends and mobs took). New `state/AllyDamageStore` on `GameState.allyDamage`, fed by a
  `damage-applied` subscriber in `GameState` (lane = `LaneRoutes.nearestLane` of the victim; only
  hits from the victim's enemy team count) and hashed by `StateHasher` while it holds
  damage. `SpawnSystem` clears a team's tally right after it picks that team's Stronghold
  heavy-wave lane. Weights 1/3 each, `TUNE: DEC-89`. Doc 18 §3.3, §10 item 1 and the MS-9 row
  updated. Written for Samarjit to integrate into PR #56 (no capacity on his side).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  768 passed (768)"; client "Tests 416 passed (416)"; "✓ built in 270ms"; "Documentation check
  passed." Every new test was seen red against a deliberate break first.
- Critic round 2 (same day): the enemy-only rule (a removed or same-team attacker no longer
  counts; new test seen red first, "expected 2 to be +0"), trimmed `AllyDamageStore` TSDoc, doc 18
  MS-9 note and §3.3 bullet. Correctness critic: PASS. `npm run check` → `EXIT=0`: core "Tests 769
  passed (769)"; client "Tests 416 passed (416)"; "Checked 115 Markdown files under docs/."
- Next step: the pre-PR gate (critic, ponytail) and Samarjit's integration into PR #56. PR #47
  refactors `LaneAssessment` into `laneScores`/`mostLaneScore`: expect a merge conflict there.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-structures — sholtzman + Claude Code

- What was done: merged `fix/minion-m1-review` (PR #63, with the phase head `f12d680` and PR #62)
  into PR #55. `Simulation`, the damage steps, `Placement`, `SpawnContextReader` and the pipeline
  keep both sides; `spawnStructures` reads `state.world` (F7d replaced `state.map`). Docs 03, 05,
  18 and this log keep both sides. `EnragedSystem` loses its "nothing emits `structure-destroyed`
  yet" remark: `StructureSystem` emits it now.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  830 passed (830)"; client "Tests 420 passed (420)"; "✓ built in 101ms"; "Documentation check
  passed."
- Next step: M2c (#56) merges this; its end-to-end test kills a tower and checks the lane's
  `enraged` stack.

### 2026-10-30 — Phase 2 / sprint 2.2 (CodeRabbit) — feat/minion-structures — sholtzman + Claude Code

- What was done: CodeRabbit's two findings on PR #55. `AiSystem.update` now also throws when an
  entity's AI profile is one its controller does not have (injected content skips
  `assertRegistered`); the regression test fails on the old code. A destroyed SpawnerTower or
  BuffTower still spawning waves is M2c's work (#56 builds it): the minion plan's stand-in row now
  says so, and its enraged row says only the human's Legend can destroy a structure until M2c.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  831 passed (831)"; client "Tests 420 passed (420)"; "✓ built in 106ms"; "Documentation check
  passed."
- Next step: CodeRabbit re-review; M2c (#56) merges this.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m2c-objectives-guards — sholtzman + Claude Code

- What was done: merged PR #55 (`3ba4e79`, with PR #63) into M2c over DEC-89; the merge commit
  lists each side kept. Lane-minion test filters skip guards; two `SpawnSystem` tests run to the
  DEC-87/DEC-127 first waves. Rover lane `pressure` 3 → 4.5, since DEC-89 dropped the constant
  damage-not-dealt term, so a lane pushed most of the way still outweighs the human (INBOX
  updated). CodeRabbit on #56: doc 11 §10 registry and `structuresWithin` notes, INBOX "eight
  items", direct `LaneStructures` tests, `StructureSystem`'s in-sync guard, the M2c entry above
  split into two three-bullet entries. MS-34 (DEC-135): only a Legend escapes a chase by time;
  `MARCHING_ONLY` now disarms tower guards too, since a guard chases a non-fighting minion to its
  death. Every new or retimed test seen red against a break.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 880 passed (880)"; client "Tests 420 passed (420)"; "Documentation check passed."
- Next step: the tower-to-enraged scenario test, the test-file splits, the pre-PR gate.

### 2026-10-31 — Phase 2 / sprint 2.2 — feat/minion-m2c-objectives-guards — sholtzman + Claude Code

- What was done: the tower-to-enraged scenario test (`Simulation.modifiers.test`) showed that
  `finite-transforms` stopped the match once an enraged minion ran at 1.1 × `maxSpeed`.
  `Movement.topSpeed` now holds the cap the statuses allowed, and the invariant checks against it
  (INBOX: approve the doc 04/10/15 wording). The minion plan drops its "only the human's Legend"
  row. Four long test files split by concern (#63's promise). Soak (seed 1, 3 lanes, bots, 900 s):
  skipped light 36.37 %, dark 54.24 % (#63: 23.62 %, 43.22 %); tower guards hold 36–38 of the
  144-unit cap. Not tuned (the prompt says report, do not change numbers).
- Checks run: `npm run check` → `EXIT=0`: core "Tests 883 passed (883)"; client "Tests 420 passed
  (420)"; "Documentation check passed."
- Next step: the pre-PR gate, then push and reply on #56.

### 2026-10-31 — Phase 2 / sprint 2.2 — feat/minion-m2c-objectives-guards — sholtzman + Claude Code

- What was done: pre-PR gate for #56. Critic round 1 (`f2b264a..61b9a1b`): one blocker, fixed:
  `cf93e2a` had split the 2026-10-30 M2c entry, which was already on the remote; it is restored
  word for word (the merge entry above still says "split", as it was then). Also fixed: a stale
  Rover remark and a literal 30 in a test. Rejected: the `topSpeed` multiplier gap
  (`StatusEffects.test` covers the math). DEC-137: unit cap 144 → 300 (soak at 300: light 0 %,
  dark 15.78 %, the rest from hordes holding at an unbreakable gate). INBOX: the docs that still
  say 144 and `maxDecisionsPerTick`, and the gate hold. Critic round 2: PASS. Ponytail: no cuts.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 883 passed (883)"; client "Tests 420 passed (420)"; "✓ built in 111ms"; "Documentation
  check passed."
- Next step: push, the CodeRabbit replies and the summary comment on #56.

### 2026-10-31 — Phase 2 / sprint 2.2 — feat/buildings-and-map-objects — sholtzman + Claude Code

- What was done: fixed PR #30's review findings for the author, at the product owner's request:
  merged the phase branch and #63; H1 objects stamp the `WorldMap`, a destroyed one (and its
  feature) reopens; S1 walk out of a footprint; DEC-121 (a) side teams; G1 map centre opened;
  DEC-133 tower hordes walk out before their brain engages, until wholly on walkable ground or at
  the exit; DEC-121 (c) collision right after movement, pinned. Three critic rounds, every finding
  fixed; each new test failed under a break first. Residual seed-2 "stall" = fight tail, 0 under a
  strict metric.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  887 passed (887)"; client "Tests 433 passed (433)"; "Documentation check passed."
- Next step: push to PR #30 (merges after #63); Sam applies the design-text drafts for DEC-121 (c)
  and DEC-133 (INBOX); author: S3, S5, S6, N2.

### 2026-11-02 — Phase 3 / minion M2c — feat/minion-m2c-objectives-guards — SamarjitBhogal + Claude Code

- What was done: merged `phase/3-sprint-3-work` (with #30's map objects, collision and DEC-133
  deploy) into #56. Conflicts: `Simulation` (one factory: map-object, unit and structure
  definitions), the pipeline's tick-order remark, `SpawnSystem` (deploy kept beside the structure
  spawners), `PathingSystem.test` (chase tests stay in `PathingSystem.chase.test`, #30's deploy
  tests kept), `SpawnSystem.test` imports, and both sides of the decisions log and this file. A
  probe (seeds 1, 2, 360 s, bots and map objects, every invariant) found 35 tower guards spawned
  inside fort walls for the whole match; `GuardRoster` now moves a blocked post to the nearest clear
  point inside its leash, straight out, then around the ring (DEC-138, owner's pick 2026-11-02;
  architecture 18 §7). Critic: PASS, 0 blockers; its two should-fixes (the DEC row, the rule in
  §7's design text) applied, and the new test also asserts guards spawned. Test:
  every guard clear and leashed on seeds 1 and 2 (red before the fix). `Simulation.structures`'
  guard test placed its dummy beside a post that stood off the 60 m map; the dummy moved beside an
  on-map post, assertions unchanged. Probe after: 0 violations, 4.5–5.2 ms per tick (dev laptop).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 954 passed (954)"; client "Tests 434 passed (434)"; "✓ built in 182ms"; "Documentation
  check passed."
- Next step: commit and push the merge on #56, retarget #56 to `phase/3-sprint-3-work`, close
  #55 (contained in #56), then rebase M5b (#57) and M6 (#58).

### 2026-11-02 — Phase 3 / minion M5b — feat/minion-m5b-if-time — SamarjitBhogal + Claude Code

- What was done: merged #56's head (`a90ee14`: M2c on `phase/3-sprint-3-work`, DEC-89, DEC-135,
  DEC-137, DEC-138) into #57, which was built on M2c's 2026-10-30 head. Conflicts, both sides
  kept: `LeashBehaviour`'s remark (MS-34's Legend-only timeout plus the ghosted wave),
  `mobs.types` (`MinionVeterancyDefinition` beside `MinionStrengthCurve`), the pipeline's
  tick-order remark (veterancy after progression), doc 18's status paragraph (M3, M5a and M5b),
  INBOX (M5b item beside the cap, gate-hold and `topSpeed` items) and this file. Fixed after the
  merge: `VeterancySystem.test` builds `GameState` from `matchWorldOf` (#30's signature).
  `Simulation.modifiers`' enraged siege test assumed the first lane to lose a tower spawns there
  again; with minion XP, seed 1's dark Stronghold falls at 238.5 s, before the first wave at 240 s.
  It now follows the first loss that a horde of that team and lane follows (light lane-0, 240 s);
  the same assertions, plus "at least one tower lost" and an enraging kind. Critic: PASS, no
  blockers; should-fixes applied (this result, a rewrapped remark). It traced the 238.5 s fall:
  M2c alone loses that Stronghold at 340.7 s; minion XP brings it forward. Probe (seeds 1, 2,
  360 s, bots, map objects, every invariant): 0 violations, 4.5–5.0 ms per tick (dev laptop).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 962 passed (962)"; client "Tests 434 passed (434)"; "✓ built in 189ms"; "Documentation
  check passed."
- Next step: push #57, retarget it to `phase/3-sprint-3-work`; then M6 (#58).

### 2026-11-02 — Phase 3 / minion M2c — feat/minion-m2c-objectives-guards — SamarjitBhogal + Claude Code

- What was done: CodeRabbit's #57 thread on `GuardRoster.update`: an empty post counted its team's
  units (a walk of the entity store) before the cheap checks, so every post of a fallen structure
  paid it each tick. The cap count now runs last; the same posts fill on the same ticks.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 954 passed (954)"; client "Tests 434 passed (434)"; "✓ built in 218ms"; "Documentation
  check passed."
- Next step: merge into #57 (M5b) and #58 (M6).

### 2026-11-02 — Phase 3 / minion M2c — feat/minion-m2c-objectives-guards — SamarjitBhogal + Claude Code

- What was done: DEC-138's post search stepped one nav cell (5 m), so where a plan's leash span is
  shorter (camps: posts at 3 m, edge at 7 m) it tried only the ring and kept a post inside the
  camp fire (M6 merge probe: 46 camp mobs in furniture on seeds 1 and 2). It now steps one body
  radius: a gap a guard fits through is two radii wide, so no step skips one. Test:
  `GuardRoster.test` with a 3 m leash span and a block 1 m past the posts (red before the fix).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 955 passed (955)"; client "Tests 434 passed (434)"; "✓ built in 266ms"; "Documentation
  check passed."
- Next step: merge into #57 (M5b) and #58 (M6).

### 2026-11-02 — Phase 3 / minion M2c — feat/minion-m2c-objectives-guards — SamarjitBhogal + Claude Code

- What was done: the M6 merge probe still found 6 camp mobs in camp fires on seed 1 (two mirrored
  camps): the nav grid blocks every 5 m cell a footprint touches, so a fire's 8 m stone blocks the
  grid past the 7 m camp leash, though the ground there is clear. DEC-138's search now runs again
  on the map objects alone when nothing in the leash is clear on both; guards seek, and collision
  uses the exact shapes. Test: `GuardRoster.test` with the grid blocked past the leash and the
  object only over the posts (red without the second pass).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 956 passed (956)"; client "Tests 434 passed (434)"; "✓ built in 261ms"; "Documentation
  check passed."
- Next step: merge into #57 (M5b) and #58 (M6).

### 2026-11-02 — Phase 2 / sprint 2.2 — feat/minion-m2c-objectives-guards — sholtzman + Claude Code

- What was done: MS-36 / DEC-144, "distance, then time" (the owner's answers A b, B a, C a, D b).
  `LeashBehaviour` rewritten: the leash tests the target's position, not the mob's; no time limit
  inside it (a Legend too; supersedes DEC-135's Legend limit); a target outside it is dropped
  after `leashGraceTicks` (90) unless another enemy in reach is taken first; a dead target's
  killer takes the next enemy at once; a returning mob acquires; the cooldown (Legends only)
  starts at the leash break; call for help (`callForHelpRadius` 7.5) brings in an enemy attacking
  a horde-mate; guards never take or keep a target outside their circle. 15 new or rewritten
  controller tests, each red on 79bb571's leash code first (record in the agent-work folder,
  `m56-ms36-tests-red.log`). Probes (seed 1, 3 lanes): 0 crossings in 300 s with and without
  bots; soak 900 s with bots at cap 300 skips 0 % for both teams (dark was 15.78 %); 16v16 fight
  over by 51 to 54 s with call for help, still on at 60 s without. Docs: decisions log DEC-144
  batch; doc 18 MS-36, §6.1, §7; doc 11 §4.3; phase-3 plan; INBOX gate pile-up item closed.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 963 passed (963)"; client "Tests 434 passed (434)"; "✓ built in 124ms"; "Documentation
  check passed."
- Next step: the pre-PR gate (critic, ponytail), push to #56, and the #56 comment.

### 2026-11-02 — Phase 2 / sprint 2.2 — feat/minion-m2c-objectives-guards (round 2) — sholtzman + Claude Code

- What was done: MS-36 / DEC-144 round 2, from the critic's first review and the owner's answers
  E b, F b, G a and "No, emergent is enough" (a guard does not step back to pull its target in).
  `LeashBehaviour`: a target outside the leash with no other enemy in reach is chased and attacked
  for `leashGraceTicks`, then the leash breaks (E); guards get a grace of 0 and stop at their
  circle at once (`content/ai/aggro/towerGuard.ts`); after a break the cooldown leaves alone only
  the enemy that escaped, a minion too (new memory field `escapedId`; F); a call for help beats
  the escape and cooldown filters; `attack()` emits nothing when the mob already fights that
  target. `returning` kept; an INBOX item asks the minion owner (G). `Simulation.modifiers.test`
  now checks the first defended loss whose lane spawns again (a lost SpawnerTower ends its lane's
  light hordes, doc 18 §3.1); its assertions are unchanged. 10 new or changed tests, each red
  first (`m56-ms36-r2-ef-red.log`, `m56-ms36-r2-helpcall-red.log` in the agent-work folder).
  Probes (seed 1, 3 lanes): 0 crossings in 300 s with and without bots; soak 900 s with bots at
  cap 300 skips 0 % for both teams, mean step 0.508 ms, worst 3.71 ms; 16v16 fight over at 49 s
  and 54 s. Docs: decisions log DEC-144 row and the round-2 answers, batch order fixed (the
  2026-10-30 M2c batch now sits below the 2026-10-31 PR #30 batch); doc 18 MS-36, §6.1, §7; doc 11
  §4.3; INBOX (G).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 965 passed (965)"; client "Tests 434 passed (434)"; "✓ built in 120ms"; "Documentation
  check passed."
- Next step: critic round 2, push to #56, and the #56 comment.

### 2026-11-02 — Phase 2 / sprint 2.2 — feat/minion-m2c-objectives-guards (round 3) — sholtzman + Claude Code

- What was done: MS-36 / DEC-144 round 3, from the critic's second review and the owner's guard
  answers ("1 + 2, skip 3" and "Widen tolerance"). Guards have no rest (`aggroCooldownTicks` 0),
  and the guards of one structure defend each other anywhere in its circle: `LeashRules` gains
  `isMate` and `helpRadius` (minion: its horde and `callForHelpRadius`; guard: the same home, a
  reach derived from its post). The `guard-within-leash` tolerance grows from 2 m to 5 m
  (`content/structures/guardPlans.ts`): a guard fighting a target at the circle's edge can stand
  beyond it by its melee stance (up to 3.1 m), plus one decision's walk (1.2 m). Found when
  `Simulation.modifiers` tripped the invariant (10.01 m); the overshoot was latent before (3436366
  trips it at 594 s, after that test's window). Guards now hold longer (the first defended loss
  comes at 613 s, was 351 s), so that test searches 900 s, not 500 s; its assertions are
  unchanged. Critic round 2: F2 test (the escaped enemy is fought again after the cooldown), F4
  TSDoc, F5 doc 18 §6.1 wording, ponytail cut 1 (early `continue`); ponytail cut 2 (inline
  `moveGuardTo`) rejected: a base helper with 8 call sites. 4 new tests, each red first
  (`m56-ms36-r3-cooldown-ends-red.log`, `m56-ms36-r3-guards-red.log`,
  `m56-ms36-r3-tolerance-red.md` in the agent-work folder). Docs: decisions log DEC-144 row and
  the guard answers; doc 15 §3; doc 18 MS-36, §6.1, §7; INBOX (edge dance kept for tower fire).
- Correction to the round-2 entry above (critic round 2 F3): it says the `Simulation.modifiers`
  assertions are unchanged. Not exact: the `memberIds.length > 0` check became part of picking
  the loss, and the `towersLostByLane` literal `{ [lane]: 1 }` became a tally of the team's losses.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 969 passed (969)"; client "Tests 434 passed (434)"; "✓ built in 109ms"; "Documentation
  check passed."
- Next step: critic round 3 (the last of three), push to #56, and the #56 comment.
- Critic round 3 (the last of three): APPROVE WITH NITS, 0 blockers. Fixed: F1 (the tolerance
  basis is 3.55 m, not 3.1 m: a heavy guard, 0.8 m, against a Sentinel, 1.25 m, at 1.5 m reach;
  5 m still covers walk plus stance with about 0.5 m of margin; new `guardPlans.test` checks the
  sum for every guard), F2 (the "outside" enemy in the guard test now stands inside the guard's
  help query, 9 m past the edge), F3 (the `Simulation.modifiers` tally counts only
  `ENRAGING_STRUCTURES`), F7 (two guard test names), F4 (doc 18 status note and INBOX M2c item:
  no aggro timeout since DEC-144), F10 ("leav" → "leave" in the decisions log and INBOX). F5 and
  F6 answered in the #56 comment; F8 (`callForHelpRadius: 0` stays) and F9 (moving tests to a
  `LeashBehaviour.test.ts` is a follow-up) rejected. Ponytail: 1 cut, applied
  (`GuardController.rulesFor` uses `geometry.distance`). Red first:
  `m56-ms36-r3-critic3-red.log`, `m56-ms36-r3b-tolerance-red.log`.
- Correction to the text above: "4 new tests, each red first" was overstated. The guard test
  that the enemy outside the circle is left alone passed on the old code too (its enemy stood
  outside the help query); F2 moved it, and it is now red under a break. The `Simulation.modifiers`
  window: the base searched 300 s for the loss and 400 s for the next horde (500 s was round 2's).
- Rebased onto #56's `be5366d` (SamarjitBhogal's merge of phase 3 and the DEC-138 guard-post
  fixes, pushed during round 3). Conflicts only in doc 18 §7, the decisions log and this file;
  both sides kept. Note: DEC-138 is used twice, by the guard-post batch here and by a docs ruling
  on the local HUD branch; one of them needs a new number before both reach the phase branch.
- Checks run (rebased head, before this bullet): `npm run check` → `EXIT=0`: "All matched files
  use Prettier code style!"; core "Tests 974 passed (974)"; client "Tests 434 passed (434)"; "✓
  built in 114ms"; "Documentation check passed." Soak (cap 300, bots, 900 s): 0 non-INFO log
  records, 0 % spawns skipped, step mean 0.460 ms, worst 3.25 ms.
- Next step: push to #56 and post the #56 comment.

### 2026-11-03 — Phase 3 / minion M2c — feat/minion-m2c-objectives-guards (test split, `returning` merge) — SamarjitBhogal + Claude Code

- Critic round 3's F9, done on #56 at the owner's request (it was listed as a follow-up above).
  The 17 shared leash tests (cooldown, grace, call for help, target death, acquiring while
  returning, priority ranking; 16 word for word, 1 renamed in the merge below) moved from `ai/MinionController.test.ts` (551 lines) to the new
  `ai/LeashBehaviour.test.ts` (299 lines), still driven through `MinionController`'s rules. The
  9 minion-specific tests stay (144 lines). The shared setup moved to
  `ai/__fixtures__/minionControllerSetup.ts`. The move changed no test body or assertion; 26
  tests before and after. Five were then updated for the merge below.
- `returning` merged into the resting state (DEC-155, answering DEC-144 G: option b).
  `LeashBehaviour` runs `idle ⇄ engaging`: a leash break emits `stop` and rests the mob at once,
  with `escapedId` and the cooldown; `PathingSystem` already walks a mob with no target back to
  its slot or post. Removed: `LeashRules.isHome`, `MinionController.isAtSlot` and its scratch
  points, `AggroRuleDefinition.reformDistance` (both profiles) and `MinionControllerContent.formations`
  (only `isAtSlot` read it). Five tests updated to the new state: two leash-break tests expect
  the resting state, and the three `returning:` tests now check that a memory saved as
  `returning` reads as resting, keeping its cooldown. Doc 18 §5.2, §6.1, §7, §9, the phase-3
  plan's FSM line, the decisions log (DEC-155) and the INBOX item (moved to Done) follow. New
  INBOX item for sholtzman: FR-071 (`06-mvp-requirements.md`) still names `returning`.
- Critic (`architecture-reviewer`, working tree vs `879525f`): APPROVE WITH NITS, 0 blockers.
  Applied: the decision recorded as DEC-155 (was only in INBOX), the FR-071 INBOX item, TSDoc and
  plan rewraps, a test comment, `GuardController` keeps its `Pick` of the content, this entry's
  wording.
- Checks run (after the critic fixes): `npm run check` → `EXIT=0`: "All matched files use
  Prettier code style!"; core "Tests 974 passed (974)"; client "Tests 434 passed (434)"; "✓ built
  in 260ms"; "Documentation check passed."
- Next step: push to #56; sholtzman answers the FR-071 INBOX item.

### 2026-11-02 — Phase 2 / Track B (S1 carry-over) / HUD and character select, merge of the phase branch and T-199 (DEC-143) — feat/hud-plan-b6 — sholtzman + Claude Code

- What was done: merged `origin/phase/2-sprint-2-work` (`e2c3e1e`; every phase PR since `230a330`,
  #42 to #63 and #30) as `54716be`: #30's buildings ported into `MatchCamera`, `Match` and
  `prepareMatchWorld`; the simulation gets the map, the map objects and the setup's bots; the old
  interior model and "Leave cathedral" deleted. Then DEC-143 (T-199): `game/BuildingRoofs.ts` owns
  roof cutaways (the player's building opens, closes on leaving or death; developer clicks add to
  it), the roof click is developer-only, the minimap has a test that it draws with the explorer
  hidden or shown. Docs: 06 §10 (T-199 row, notes), 13 §10, 02 §12, reference 05 and 15 (CD-22)
  dated notes, the phase 2 plan's leave-interior task. Red proofs in
  `eternalus-agent-work/hud-charselect/build-1102/w4-redproof.md`.
- Checks run: `npm run check` EXIT 0 on the merge and again on T-199 (core "Tests 936 passed
  (936)", client "Tests 1694 passed (1694)", "Documentation check passed.").
- Next step: the critic and ponytail gate on `feat/hud-plan-b6`; the owner drops the phase 2
  leave-interior task and answers T-199 (HC-T1).

### 2026-11-02 — Phase 2 / Track B (S1 carry-over) / HUD and character select, the pre-PR gate — feat/hud-plan-b6 — sholtzman + Claude Code

- What was done: batch 5 merged (`62652b0`, `da57c29`, `3ceb877` via `dccd92f`); hiding the
  explorer puts the developer's roofs back (`b3e2a2e`); critic loop 1 fixes (replay carries its
  setup, `ReplaySetup`; pointer claims; base zoom on leaving the explorer); DEC-147 to DEC-149
  built (bot difficulty by role in core content, `createMatchSeed`, developer-roof names, a dead
  Legend opens no roof, `crashToMenu`, core `findBuildingAt`), with a test pinning the interim
  spawn adoption until A19 (`99563b4`); loop 2 fixes (generic replay types in `diagnostics/`,
  `MatchRequest.roster`); DEC-150 to DEC-152 (`6f67263`, `826f929`, `eaa5f7c`); critic loop 3
  and its fix, the critic's BD-A (`5500a0c`: with the explorer shown a click attacks on release,
  a drag never attacks, a click on the Legend's own building attacks, DEC-153); docs (`dd41ca1`
  and this entry's commit). The owner's one delta re-check (DEC-153): approve, four nits, one doc
  fix, three rejected (`docs/changelog/pr-feat-hud-and-character-select.md`). The HUD lane's
  DEC-138 renumbered DEC-154 (SamarjitBhogal pushed DEC-138 first, #56). Red proofs in
  `eternalus-agent-work/hud-charselect/build-1102/` (`loop*-redproofs-*.md`).
- Checks run: `npm run check` EXIT 0 on the final tree: "All matched files use Prettier code
  style!"; core "Tests 945 passed (945)"; client "Tests 1735 passed (1735)"; "Documentation check
  passed." (knip printed one configuration hint, not a failure).
- Next step: merge into `feat/hud-and-character-select` and open the PR to
  `phase/2-sprint-2-work`; BD-B (`Match`'s pointer and explorer controls in their own class) at the
  A19 merge (`INBOX.md` HC-S6).

### 2026-11-02 — Phase 2 / Track B (S1 carry-over) / HUD and character select, PR #68 Windows CI — feat/hud-and-character-select — sholtzman + Claude Code

- What was done: PR #68's first CI run failed on `windows-latest` only (2 of 1735 client tests).
  The note test made the report read-only to prove the rename, and Windows refuses to replace a
  read-only file; it now proves the rename by the file's identity (`stat` `ino`), on every
  platform. The browser-match replay test (a whole match recorded and replayed) took 6.4 s on the
  runner against the 5 s default; it gets the 60 s that core gives its whole-match tests. Red
  proof: `eternalus-agent-work/hud-charselect/build-1102/pr68-windows-ci-redproofs.md`.
- Checks run: `npm run check` EXIT 0: "All matched files use Prettier code style!"; core "Tests
  945 passed (945)"; client "Tests 1735 passed (1735)"; "Documentation check passed."
- Next step: PR #68 CI on both runners; a teammate review.

### 2026-11-03 — Phase 2 / Track B (S1 carry-over) / HUD and character select, PR #68 Windows CI (2) — feat/hud-and-character-select — sholtzman + Claude Code

- What was done: PR #68's second CI run failed on `windows-latest` only, on a different
  whole-match client test (`createBrowserMatch.test.ts`, 5.2 s against the 5 s default). The
  runner's speed is the one cause of three failures across two runs, so the client suite now has
  core's 60 s `testTimeout` in `apps/client/vitest.config.ts` and the replay test's own 60 s is
  gone (`bfe4fac`). Changelog bullet "Windows CI" and the PR body brought in line.
- Checks run: CI run 41593504943 on `bfe4fac`: `npm run check (windows-latest)` pass,
  `npm run check (ubuntu-latest)` pass. Local `npm run check` EXIT 0: "All matched files use
  Prettier code style!"; core "Tests 945 passed (945)"; client "Tests 1735 passed (1735)";
  "Documentation check passed."
- Next step: a teammate review of PR #68; it merges after the minions and weapons PRs (merge
  commit).

### 2026-11-03 — Phase 2 / Track B (S1 carry-over) / HUD and character select, PR #68 review — feat/hud-and-character-select — sholtzman + Claude Code

- What was done: SamarjitBhogal approved PR #68 with five optional follow-ups. The owner chose two:
  the PR targets `phase/3-sprint-3-work` and merges now (DEC-157). The replay's command
  log stamps each external command with the tick it applied in: `Simulation` keeps the bots' and
  the external commands in two queues and `step()` applies the bots' first, the order a replay
  reproduces. ADR 0025 amendment 2026-11-03, architecture 03 §3, DEC-156. File-length splits
  scheduled (`INBOX.md` HC-S7). Red proof: both new tests in `Simulation.replay.test.ts` fail on
  the old `Simulation.ts` (`eternalus-agent-work/hud-charselect/build-1102/dec156-redproof.txt`).
- Checks run: `npm run check` EXIT 0: "All matched files use Prettier code style!"; core "Tests
  947 passed (947)"; client "Tests 1735 passed (1735)"; "Documentation check passed."
- Next step: merge PR #68 with a merge commit once CI passes; #56, #57 and #58 resolve the
  conflicts with it.

### 2026-11-03 — Phase 2 / sprint 2 — feat/buildings-and-map-objects — branch sync

- What was done: fetched origin, fast-forwarded the local branch from 796f77d to its remote
  head dd1a416, then to Phase 2 head e2c3e1e. Both updates were fast-forwards; no conflicts,
  new merge commits or source edits were required. HEAD and origin/phase/2-sprint-2-work have
  no commits unique to either side.
- Checks run: npm run check passed (exit 0): formatting, no-JS, lint, typecheck, Knip,
  coverage, build and documentation; core 887/887 tests and client 433/433 tests passed.
  Verbatim final tail:

  ```text
  Checked 116 Markdown files under docs/.
  Documentation check passed.
  ```

- Next step: continue work from the synchronized branch. This required progress entry is
  uncommitted; no commit or push was performed.

### 2026-11-03 — Phase 2 / sprint 2 — feat/buildings-and-map-objects — map detail pass

- What was done: added lane-facing cathedral side portals and steps, plus matching interior
  thresholds and selection footprints, retaining the existing walkable wall openings. Roads now
  use joined world-space surfaces, soft shoulders and restrained wear; explicit isLaneSurface
  metadata removes the main view's overlaid fixed-pixel lane line while retaining minimap routes.
  Replaced uniform rubble with cached artwork by object kind: stumps and fallen logs, burned house
  shells, scattered rock shards, broken walls/towers, collapsed tents, furniture and gate timber,
  and palace debris. Extended ruin bounds keep fallen logs visible. Fire is cosmetic and existing
  destruction collision/snapshot behavior is preserved. Updated the map design amendment.
- Checks run: npm run check:quick passed. Focused geometry and rendering regressions passed;
  visually inspected a render sheet made from the actual views. An initial full run caught the
  interior-fit test's old footprint expectation; updated it to cover and require all four authored
  door thresholds, with no assertions removed. Final npm run check passed (exit 0): formatting,
  no-JS, lint, typecheck, Knip, coverage, build and docs; 891 core and 450 client tests passed.
  Verbatim final tail:

  ```text
  Checked 116 Markdown files under docs/.
  Documentation check passed.
  ```

- Next step: human playtest and review of the visual changes. All changes remain uncommitted;
  no push or PR was performed.

### 2026-11-03 — Phase 2 / sprint 2 — feat/buildings-and-map-objects — front shield arc

- What was done: replaced the complete outer stronghold ring with mirrored blue front arcs,
  following the author's confirmed annotated outline. Preserved all original lane, gate and tower
  anchor positions; taller tips join the rear mountain boundary. Shield panel artwork follows the
  physical polygons, with translucent glass, luminous rims, runes and emitters. Artwork retains
  segment destruction ownership, and the main view omits the replaced plain feature fills.
  Added optional boundary metadata, validation, legacy closed-ring support and regressions for
  geometry, presentation, anchor preservation and mountain containment. Updated the map design.
- Checks run: npm run check:quick passed. Initial full tests caught shifted tower deployment
  positions; corrected the geometry while keeping the existing deployment assertions unchanged.
  Two default-worker runs then hit the unchanged roof-toolbar test's five-second startup timeout;
  it passed in isolation. Final npm run check passed (exit 0) with VITEST_MAX_WORKERS=2:
  formatting, no-JS, lint, typecheck, Knip, coverage, build and docs; 904 core and 451 client tests
  passed. All timeouts, assertions and coverage thresholds remain unchanged. Visually inspected
  a preview rendered from the actual map views. Verbatim final tail:

  ```text
  Checked 116 Markdown files under docs/.
  Documentation check passed.
  ```

- Next step: human playtest and review of the shield appearance. Changes remain uncommitted;
  no push or PR was performed.

### 2026-11-04 — Phase 2 / course sprint 3 (phase/3-sprint-3-work), PR #69 review fix and pre-PR gate — fix/pr69-local → feat/buildings-and-map-objects — sholtzman + Claude Code

- What was done: merged `origin/phase/3-sprint-3-work` 387a5fd (PR #68) into the PR branch (eb0e012).
  Owner rulings DEC-158 (the Stronghold wall is a shield arc from cliff face to cliff face) and
  DEC-159 (no closed-ring wall: `wallRing.frontArc` required; closed-ring branches and the tests
  that covered only the closed ring removed; ring tests of gate order, chord, splitting, narrowing
  and anchors ported to the arc). Seal test (each tip on its cliff corner); layout validation
  rejects outer gates past ±90°; one `shieldReach` from `boundaryPoint`; `MapShieldBuilder` no
  longer guesses vertex order; `strongholdRing` throws instead of inferring; palace ruins drop the
  timber ground by identity. Each new or ported test was turned red by a deliberate break first.
  Gate: critic r1 approve (S1–S4), r2 request-changes (narrowing test could not fail; fixed), r3
  approve; ponytail: 1 cut taken (shared reach), 5 rejected with reasons in the PR review.
- Checks run: `npm run check` on 95cc4a5 → EXIT=0; core "Tests 967 passed (967)", client
  "Tests 1753 passed (1753)", "Documentation check passed."
- Next step: push to `feat/buildings-and-map-objects` (remote head must still be 52c1297), approve
  #69; after #56 and #64 merge, re-run #56's soak probe and #64's zone tests.

### 2026-11-02 — Phase 3 / minion M6 — feat/minion-m6-camps-defenders — SamarjitBhogal + Claude Code

- What was done: brought #58 onto #57's head (M5b on M2c on `phase/3-sprint-3-work`) in three
  merges (`1c023a6`, `08dd3fc` and this one). Conflicts, both sides kept: `GuardRoster` (M6's camp
  plans by definition id, first fill tick, neutral cap exemption and `camp-cleared`, with DEC-138's
  clear posts and the cheap-checks-first refill), `SpawnSystem`'s guard-plan validation, M2c's
  split of `Simulation.hordes.test` (M6's camp test moved to `Simulation.structures.test`), docs
  15, 18 and the plan (CaptureSystem is now PR #64), INBOX (the owner's newer answers; M6's two
  agent notes dropped, superseded by DEC-89 and the 2026-10-29 decision; the M6 item now names
  PR #64) and this file. After the merge: camp mobs' `movement` became `movementProfile`; two tests build
  `GameState` from `matchWorldOf`; the removed `initialHordesPerTeam` is dropped. The merge probe
  (seeds 1, 2, 360 s, bots, map objects, every invariant) found camp mobs inside camp fires; fixed
  on #56 (body-radius step, then an objects-only second pass) and merged in. New test: every camp
  mob clear of map objects once camps fill, seeds 1 and 2 (seed 1 red before). Probe after: 0
  violations, 5.6–6.5 ms per tick (dev laptop).
- Critic: PASS, no blockers; its should-fix (the INBOX item's PR #49) and nits applied.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 971 passed (971)"; client "Tests 434 passed (434)"; "✓ built in 218ms"; "Documentation
  check passed."
- Next step: push #58, retarget it to `phase/3-sprint-3-work`. Checkpoint defenders wait for #64.

### 2026-11-02 — Phase 3 / minion M6 — feat/minion-m6-camps-defenders — SamarjitBhogal + Claude Code

- What was done: CodeRabbit's two #58 threads. Doc 07's status note no longer lists camps as not
  built (M6 adds `Camp`). Not changed: the 2026-10-30 M6 entry's four bullets, since pushed
  entries are never rewritten (OG-12); new entries keep the three-bullet shape.
- Checks run: `npm run docs:check` and Prettier on the two docs; docs-only change.
- Next step: merge #56, #57, #58 in order.

### 2026-11-02 — Phase 3 / minion soak — feat/minion-m6-camps-defenders — SamarjitBhogal + Claude Code

- What was done: the minion plan's done-when soak on #58's head (`816c238`), a throwaway probe,
  not committed: seeds 1 and 2, 3 lanes, 600 s, bot rosters, map objects. With every invariant
  once a second: 0 violations (`guard-within-leash` for tower guards and camp mobs, map-object
  overlap, horde membership), 0 guard posts refilled after their due tick, 0 % of 496 horde units
  skipped per team, at most 284 / 250 units on a team (cap 300). Tick time at the release
  invariant level (developer laptop, not the reference laptop): seed 1 p50 1.58, p95 3.35, p99
  4.00, max 10.99 ms (4 of 18,000 ticks over 8 ms); seed 2 p50 1.44, p95 2.61, p99 3.13, max
  7.92 ms. With heavy invariants every 30 ticks, those ticks cost 160 to 360 ms, so heavy-level
  soaks run slowly. No tower fell and no camp was cleared in 600 s on the generated map: hordes
  march about 1.5 km and bots never attack structures or camps (minion plan §3).
- Checks run: the probe above; docs-only change, `npm run docs:check` passes.
- Next step: bot laners attack structures (the M3 stand-in), on a branch from #58's head.

### 2026-11-02 — Phase 3 / minion M3 stand-in — feat/minion-bot-structures — SamarjitBhogal + Claude Code

- What was done: bot laners attack structures (doc 11 §4.2 `Push`; minion plan §3's M3 stand-in).
  New `Push` branch ahead of following the horde: `BotLeaves.findObjective` takes the lane's next
  standing enemy structure from `laneStructures.objectiveFor` (a gate only once breakable) when
  the bot is within `engageRadius` of the point hordes gather at; `siege` sends `attack-target`,
  walks to that point, then straight at the structure, and holds in reach. `Fight` still outranks
  it. Tests: three `Push` cases in `BotLegendController.test` (its index now holds units only, as
  `SpaceSystem` does) and a two-lane scenario where bots hit dark structures in 90 s, both red
  before. Probe (seed 1, 1,200 s, bots, map objects, heavy invariants every 10 s): bots' first
  structure hit at 220 s, 134 bot and 80 minion hits, 3 structures lost (2 without this change),
  0 violations. Plan §3's row is now "Bot laners never cast". Critic: PASS, no blockers; its
  should-fixes applied (a test that a unit near the structure is fought first; the straight last
  leg to an off-lane Stronghold as a `ponytail:` remark and a plan §3 row).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 976 passed (976)"; client "Tests 434 passed (434)"; "✓ built in 352ms"; "Documentation
  check passed."
- Next step: pre-PR gate, then a draft PR into `phase/3-sprint-3-work` that merges after #58.

### 2026-11-02 — Phase 3 / minion plan stand-ins — feat/minion-bot-structures — SamarjitBhogal + Claude Code

- What was done: plan §3's M4 row "Nothing marks a lane flow field dirty" removed: PR #30's
  `DefaultSystemPipeline` reopens a destroyed blocking map object's cells and marks the lane fields
  over them dirty, and gates are not blocking in the MVP, so no gate change alters the grid.
- Checks run: `npm run docs:check` and Prettier; docs-only change.
- Next step: the owner's call on the two remaining M4/M5a stand-ins (strength by the field's
  distance; a wall-avoidance term now that `CollisionSystem` exists).

### 2026-11-02 — Phase 3 / minion M4 test — chore/minion-full-march-test — SamarjitBhogal + Claude Code

- What was done: restored the full-match march test commented out at the owner's request on
  2026-10-30 (PR #39: 530 s, over 100 s on CI under coverage). Since M2c a horde holds at its first
  enemy objective, and march-only hordes cannot attack, so "reach the enemy end" cannot pass; the
  test checks sprint 3.1's metric for the first objective instead: for 3 and 5 lanes (seed 1),
  every opening mob (full size, counted) comes within 15 m along its lane of its first enemy
  objective's gather point (18 §6.2), with under 1 % of samples off walkable ground and no
  warnings. Only the opening hordes march (long countdown); the loop stops once every mob arrives
  and samples once a second; 1.4–2.6 s locally. Critic round 1 blocked "arrived" judged on horde
  anchors (which move whether or not mobs follow); it now judges each mob (at 1 m only 6 of 96
  arrive, so it measures mobs). A missing objective throws. Plan §3 row and INBOX item for the
  redefined M4 done-when.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 973 passed (973)"; client "Tests 434 passed (434)"; "✓ built in 156ms"; "Documentation
  check passed."
- Next step: critic round 2, then a draft PR into `phase/3-sprint-3-work` after #58.

### 2026-11-04 — Phase 3 / minion stack merge — chore/minion-full-march-test — sholtzman + Claude Code

- What was done: #56, #57, #58 and #66 merged into `phase/3-sprint-3-work` (8e058d8) after an
  independent audit with no merge-blockers. Merged `phase/3-sprint-3-work` into this branch (#67)
  and resolved its two docs conflicts with #66: this log keeps all three 2026-11-02 entries in
  commit order; minion plan §3 takes #66's rows (no "flow field dirty" row, "Bot laners never
  cast", the straight-last-leg row) and adds this branch's M4 done-when row.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 1056 passed (1056)"; client "Tests 1736 passed (1736)"; "✓ built in 390ms";
  "Documentation check passed." This entry was added after that run (docs-only).
- Next step: merge #67, then `fix/minion-stack-followups` from `phase/3-sprint-3-work`.

### 2026-11-04 — Phase 2 / course sprint 3 (phase/3-sprint-3-work), PR #69 base sync — fix/pr69-local → feat/buildings-and-map-objects — sholtzman + Claude Code

- What was done: pushed 32eefbf; the base had moved to f40811f (#56, #57, #58, #66, #67, the
  minion stack), so `origin/phase/3-sprint-3-work` was merged again (1e33263). Only this file
  conflicted; both sides kept. Re-ran #56's soak probe (cap 300, bots, 900 s) on 1e33263 and on
  f40811f: the gameplay output is identical (skipped 0 % / 0 %, deaths 1639, non-INFO 0); step
  times overlap over three runs each (mean 0.62–0.76 ms both; worst-tick spikes on both).
- Checks run: `npm run check` on 1e33263 → EXIT=0; core "Tests 1076 passed (1076)", client
  "Tests 1754 passed (1754)", "Documentation check passed."
- Next step: push, approve #69; after #64 merges, re-run #64's zone tests.

### 2026-11-04 — Phase 2 / course sprint 3 (phase/3-sprint-3-work), PR #69 review follow-up — fix/pr69-local → feat/buildings-and-map-objects — sholtzman + Claude Code

- What was done: Samarjit's review of 97d7263 (approve with S1–S3). S3: `MapFeature.wallBoundary`
  no longer copies `frontArc` (nothing read it); the new test was red on the old code, and the
  golden map hash changed only because of that field (adding it back gives the old hash). N2: the
  missing-wall error says "wall arc". S1 (scoped title) and S2 (PR description with the gate
  results) are PR metadata, set when this is pushed.
- Checks run: `npm run check` → EXIT=0; core "Tests 1076 passed (1076)", client "Tests 1754
  passed (1754)", "Documentation check passed."
- Next step: push, set the PR title and description, squash-merge; after #64 merges, re-run #64's
  zone tests.

### 2026-11-04 — Phase 3 / horde steering deadlock — fix/horde-guard-deadlock — sholtzman + Claude Code

- What was done: a unit whose pull toward its target is cancelled by separation no longer stalls
  for good. Root cause: `addSeparation` zeroed any sum shorter than `minSteer`, so two units that
  met head-on (one extra entity before the first wave put the light lane-0 leader on its light
  guard's post at (76, 20), the guard 0.995 ahead and walking back to it) each had a pull of 1
  against a push of about 1.21; both nets fell to 0.21 and both stood still from tick 634 to past
  tick 1,800. Now, when the push cancels a pull, the unit steps aside: a quarter turn from the
  pull, to the side the push leans to, else always the same side, so two units meeting head-on
  step to opposite sides. A unit with no pull still settles to zero. Shared by
  `LaneFollowMovementStrategy` and `LeashedChaseMovementStrategy`; no new tuning number. Tests,
  both red first: `LaneFollowMovementStrategy.test` "steps aside, never stalls, …" ("expected 0
  to be greater than or equal to 0.25") and the structures scenario with one extra entity
  ("expected 80.50056128703002 to be greater than 111"). Hash tests compare runs, none pins a
  literal; all pass.
- Checks run: `npm run check` → exit 0: "All matched files use Prettier code style!"; core
  "Tests 1056 passed (1056)"; client "Tests 1736 passed (1736)"; "✓ built in 249ms";
  "Documentation check passed."
- Next step: pre-PR gate, then PR into phase/3; unblocks #64.

### 2026-11-04 — Phase 3 / horde steering deadlock, critic round 1 — fix/horde-guard-deadlock — sholtzman + Claude Code

- What was done: the critic (request-changes) found that no test pinned the "side the push leans
  to" rule (hard-coding one side still passed 1058/1058) and that its probe measured this rule as
  the main source of the new shuffling: 16 of 20 wedge layouts reversed almost every tick, against
  4 of 20 with a fixed side. The side step is now always a quarter turn to the left of the pull.
  Two units meeting head-on still step to opposite sides in world terms. New test
  `LaneFollowMovementStrategy.test` "steps to the left of its pull, whichever way the push that
  cancels it leans", red first with the lean rule put back ("expected { x: +0, y: -1 } to deeply
  equal { x: +0, y: 1 }"). A `ponytail:` note names the ceiling (a crowd pressed into a gap can
  shuffle) and the upgrade (10 §9 `AvoidanceStrategy`). Doc 18 §5.2 states the rule. The
  critic's whole-match probe, reversals over 120° per minion-minute: two-lane fight 240 s, 59.1
  before the fix and 68.3 with the fixed side; full match 360 s, 27.9 before and 35.4 with the
  fixed side. Remaining shuffle is an owner acceptance item.
- Checks run: `npm run check` → exit 0: "All matched files use Prettier code style!"; core
  "Tests 1059 passed (1059)"; client "Tests 1736 passed (1736)"; "✓ built in 222ms";
  "Documentation check passed." This line was filled in after that run (docs-only).
- Next step: critic re-check of this round, then PR into phase/3; unblocks #64.

### 2026-11-04 — Phase 3 / horde steering deadlock, critic round 2 — fix/horde-guard-deadlock — sholtzman + Claude Code

- What was done: the critic re-check approved (no blockers) and found one error in the round-1
  wording. **Correction to the round-1 entry above:** the side step is not "to the left of the
  pull". World +y is south, so a pull east steps south: a quarter turn to the unit's right,
  clockwise on screen. The behaviour was right; only the stated direction was wrong. Doc 18 §5.2,
  the `addSeparation` TSDoc and the test name now say "to the same side of its pull every time",
  with no direction. Test nits applied: the neighbours are named by their side
  (`neighbourSouth`/`neighbourNorth`), and the offset comes from `minSteer`, so retuning it keeps
  the test on the side-step branch. Still red with the lean rule put back. The remaining shuffle
  (round 1: 27.9 to 35.4 reversals per minion-minute, full match) is listed in the PR for owner
  acceptance; 10 §9 already allows it for the MVP.

### 2026-10-28 — Sprint 2/3 planning — docs/game-loop-and-results-plan — sholtzman + Claude Code

- What was done: wrote `docs/plan/game-loop-and-results-plan.md` (status draft, proposed) for
  the owner's game loop, the 30 s win/lose screen and the stretch post-game screen. Five readers
  mapped core, client, requirements, parallel PRs and architecture; one planner drafted; three
  independent critics (architecture, correctness, ponytail) and a reviser ran three rounds
  (39, 24 and 17 findings; 1 blocker and 15 majors in all, every finding applied or rejected
  with a reason, log in `eternalus-agent-work/game-loop-plan/critic-log.md`). The orchestrator
  checked the two round-3 majors (construction-time scoring rows, replayable human seat)
  against `11-game-ai.md:280`, `GameConfig.types.ts:49` and `GameEvents.ts:12`. The plan
  decides architectural choices A1–A19 and routes 11 product questions (GL-Q1–Q19, some IDs
  retired) to the owner. No architecture doc, ADR or INBOX item was edited; `docs/README.md`
  index regenerated.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 619 passed (619)"; client "Tests 1360 passed (1360)"; "✓ built in 207ms";
  "Documentation check passed."
- Next step: the owner answers GL-Q1, Q2, Q3 and Q10 first (they block GL-3 and GL-0); GL-1
  (director kernel) can start now on `feat/match-director`.

### 2026-10-28 — Sprint 2/3 planning (GL-0) — docs/game-loop-and-results-plan — sholtzman + Claude Code

- What was done: recorded the owner's answers to every GL-Q (chat, 2026-10-28). Plan §5c quotes
  them and wins over older plan text; §1, §2, §4.3, §5a A3/A4, §6, §7 (GL-0 to GL-4, GL-7, new
  GL-12 respawn, GL-13 names, GL-14 code rename) and §9 follow them. Decisions log batch
  DEC-71 to DEC-82; ADR 0021 (draft, proposed: the sovereign is the win objective, a generic
  `ObjectiveLostCondition`, no time limit, family `sovereign`); one INBOX item with the six
  points left open (gem look, verdict lines, rename timing, bonus against Host units, code-name
  veto, accept ADR 0021 and the §6 edits). GL-0 ran on this plan's branch, not on a separate
  one. GL-1 (`feat/match-director`) started in its own worktree.
- Checks run: `npm run docs:index`; `npm run docs:check`; Prettier on the changed docs.
- Next step: GL-1's result and its critic; GL-2 after GL-1.

### 2026-10-29 — Sprint 2/3 planning (GL-0 close-out) — docs/game-loop-and-results-plan — sholtzman + Claude Code

- What was done: the owner accepted the six open points, ADR 0021 and the plan §6 edits ("all
  accepted. continue"): DEC-83; ADR 0021 accepted (frontmatter `active`); ADR 0006 Status line
  "amended by 0021"; the INBOX item moved to Done; plan §5c settled. The critic round over GL-0
  and GL-1 (architecture reviewer, correctness and ponytail critics) led to these fixes here:
  GL-Q12 quoted in full, and the team total and FR-007 points marked as defaults, not rulings;
  "Capture points: Aryan" removed (the owner named no one); the "accepts that gap" reading of
  GL-Q3 (a) marked as the plan's; ADR 0021 places BuffTower immunity in a 05 §9 `DamageStep`;
  plan §6 gains a "Lands with" column and rows for 03, 04 §2, 05 §9, 10 §2, 12 §3/§8 and 15;
  stale `spawn-kings`/`king-slain` and the old free-number note fixed. A new INBOX item holds
  the five points the round raised (attacks during the countdown, team total, capture-points
  owner, tower-wave start, four better-than-design items). Rejected: "the INBOX item never
  existed" (it was uncommitted at INBOX.md:19; its text is kept verbatim in
  `eternalus-agent-work/game-loop-plan/owner-answers-2026-10-28.md`).
- Checks run: `npm run docs:index`; `npm run docs:check` → "Documentation check passed.";
  Prettier on the changed docs → "All matched files use Prettier code style!".
- Next step: GL-1's fixes and design-doc edits on `feat/match-director`; then GL-2.

### 2026-10-30 — Sprint 2/3 planning (DEC-88) — docs/game-loop-and-results-plan — sholtzman + Claude Code

- What: logged DEC-88 in the owner decisions log (new batch 2026-10-30, above DEC-84's batch).
  During the countdown every unit is idle and can only turn; nothing walks, dashes, is knocked
  back, attacks or casts; spawns go on. It amends DEC-84 (1). The owner's words are quoted from
  chat and from his spawn-timeline page notes; verbatim with the question:
  `eternalus-agent-work/game-loop-plan/owner-answers-2026-10-28.md`, last section. The code and
  the FR-003 / architecture 12 edits are on `feat/match-director`.
- Checks run: Prettier on the decisions log → no change to other tables (diff stat +54 −1);
  `npm run docs:check` → "Documentation check passed."
- Next step: this branch (DEC-71 to DEC-84, DEC-88) merges before the GL branches.

### 2026-10-31 — Sprint 2/3 planning (GL-3 prep: the spawn request) — docs/game-loop-and-results-plan — sholtzman + Claude Code

- What: INBOX item GL-Q22 (Samarjit agrees the sovereign's `spawn-requested` shape before GL-3
  starts). The owner chose to post the ask on PR #56 (posted, issue comment 6549022784, against
  #56 `f2b264a` and #63 `03cd1a7`) and approved fixing the structures doc (07) §6 to match the
  match director doc (12) §2: logged as DEC-136, which also covers 07 §11's event list. Plan §6's
  GL-3 spawn row now names 07 §6 and §11. The draft:
  `eternalus-agent-work/game-loop-plan/gl3-spawn-request-draft.md`; verbatim answers:
  `owner-answers-2026-10-28.md`, last section.
- Checks run: `git grep spawn-requested` over `packages` on ten refs → no match (the plan's §4.3
  already says M1 has no such path); Prettier on the changed docs; `npm run docs:check`.
- Next step: record Samarjit's answer in GL-Q22; GL-3 starts after M1 (#63) merges.

### 2026-11-05 — Phase 3 / map-object overlap check speed — fix/blocking-at-bounds — sholtzman + Claude Code

- What was done: `WorldObjectStore.blockingAt` tested every map object's polygons for each unit,
  and `NoMapObjectOverlapInvariant` calls it for every moving unit each tick. With the minion
  stack's tower guards, a generated map with map objects (1080 entities) spent 8.8 s of 8.9 s in
  that invariant over 125 ticks under `TEST_DEBUG_CONFIG`. On CI under coverage, PR #64's test
  "counts a Legend anywhere on its building floor, with map objects on" took 66 s (ubuntu) and
  73 s (windows) and timed out at 60 s. Each store record now keeps its footprints' box, and
  `blockingAt` skips an object whose box misses the circle before any shape test; the result is
  the same. The box helper moved out of `StaticCollisionIndex` to `utils/geometry.ts`
  (`boundsOf`), and both use it. The same 125 ticks now take 0.19 s (invariant 91 ms).
- Checks run: new test `WorldObjectStore.test.ts` "skips an object whose footprint box misses the
  circle, without testing its shape" (footprint points count their reads). Red with the box test
  removed ("expected 54 to be +0"), green with it. Its edge case (centre outside the box, circle
  across the edge) is red with `radius` dropped from the box test ("expected null to be 'rock'").
  `geometry.test.ts` covers `boundsOf`, including no points. `npm run check` before the gate:
  `exit=0`: core "Tests 1080 passed (1080)"; client "Tests 1754 passed (1754)".
- Pre-PR gate: critic approved, no blockers; it fuzzed the old and new `blockingAt` over 318k
  cases with 0 differences. Applied: its two should-fix items (the edge case above, this check
  result) and its nits (one `points` list, `boundsOf(points)` named for a point set, the
  empty-input box documented and tested, one fixture factory in the store test, which is also
  ponytail's two cuts). Its better-than-design items are in `INBOX.md`.
- Re-check after the gate: `npm run check` `exit=0`: core "Tests 1081 passed (1081)"; client
  "Tests 1754 passed (1754)"; "✓ built in 276ms"; "Documentation check passed.".
- Next step: a PR into `phase/3-sprint-3-work`; after it merges, PR #64 merges phase 3 again.

### 2026-11-04 — Phase 3 / owner rulings of 2026-11-04 — docs/playtest-rulings — sholtzman + Claude Code

- What was done: recorded the owner's answers of 2026-11-04 in the decisions log (two batches):
  DEC-160 to DEC-169, DEC-180 and DEC-181 (minion-stack follow-ups; DEC-160 and DEC-165 carry
  their same-day amendments) and DEC-182 to DEC-189 (playtest fixes; DEC-188 lists three defaults
  to confirm). DEC-170 to DEC-179 are other sessions' and are not written. `INBOX.md`: the M4
  done-when item is answered (DEC-167); answers added under Minion M6, M5b, M3, the unit-cap item
  and HC-Q6. Minion plan: phase M9 (crowd avoidance, DEC-180) and a stand-in row; the healing
  stand-in row names DEC-188. Phase 4 sprint 4.4: the weapon hit model (DEC-184). No design text in
  `docs/architecture/` is edited: it goes with each code PR. Second pass (2026-11-05): critic r1 fixes
  (camp-mob wording in DEC-165 and DEC-166 marked "as built"; DEC-168 list of B2 to B9 corrected
  against the audit); DEC-183, DEC-185, DEC-186, DEC-187 and DEC-188 amended with the owner's
  answers of 2026-11-05; new batch DEC-190 to DEC-193 (XP rework, sign-offs, facing chevron, stuck
  units and leash); `INBOX.md`: the deferred walkable-walls item. Open: the audit's items B3 and
  B5 have no named owner in the runner reports. The owner answered the DEC-193 leash question
  ("Lane minions only") and three minimap defaults (DEC-187) on 2026-11-05.
- Checks run (`npm run check`, 2026-11-05, log `eternalus-agent-work/playtest-2026-11-04/check-rulings-r2.log`):
  `All matched files use Prettier code style!`; core `Tests  1079 passed (1079)`; client
  `Tests  1754 passed (1754)`; `✓ built in 311ms`; `Documentation check passed.`; `exit 0`.
- Next step: the code PRs (`fix/minion-stack-followups`, `fix/click-attack-units`,
  `feat/local-minimap`, `feat/structure-xp`, `feat/out-of-combat-heal`) update the architecture
  docs and cite these DEC numbers.

### 2026-11-05 — Phase 3 / owner answers from the decision page — docs/playtest-rulings — sholtzman + Claude Code

- What was done: the owner answered 22 open calls (heal, facing, tower access, better-than-design
  B1 to B5) on a decision page. The answers are DEC-215 to DEC-218 in the owner decisions log; his
  words are verbatim in `eternalus-agent-work/playtest-2026-11-04/OWNER-ANSWERS.md` ("Round 3").
  No code changes here: the code follows on `feat/out-of-combat-heal`, `feat/unit-facing-chevron`
  and `fix/minion-stack-followups`.
- Checks run: `npx prettier --check` and `npm run docs:check` on the changed docs (docs-only).
- Next step: build DEC-215 to DEC-217 on their branches; confirm the DEC-217 (12) wall reading.

### 2026-11-05 — Phase 3 / owner answers DEC-219, two DEC pointers, follow-ups INBOX item — docs/playtest-rulings — sholtzman + Claude Code

- What was done: the owner answered four questions through the question dialog. DEC-219 records
  them: the fort wall that took the killing hit falls with its tower (confirms DEC-217 (12)), the
  guard refill counters count attempts, veteran and rallied combine as built, and DEC-217 is built
  on its own branch after `fix/minion-stack-followups`. DEC-165 now points to doc 18
  "Implementation status" (was §9, the tests section) and DEC-181 to doc 18 §7 (was §7.1). A new
  INBOX item lists the 12 better-than-design items from the follow-ups critics for sign-off.
- Checks run: `npx prettier --check` and `npm run docs:check` (docs-only).
- Next step: build DEC-217 (12), (15), (17) on a new branch after the follow-ups PR.

### 2026-11-06 — Phase 3 / owner answers DEC-220, DEC-217 (14) wording, tidy-PR and map INBOX items — docs/playtest-rulings — sholtzman + Claude Code

- What was done: the owner decisions log has a new batch with DEC-220 (the owner's 2026-11-06
  answers to the chevron critic's round 3: a unit inside a building's outline faces its centre,
  camp mobs face out from the camp centre, a guard back at its post faces outward again, the
  start-facing port goes to the tidy PR). DEC-217 (14) now says "makes less than 1 m of progress
  toward where it heads in 2 s", the owner's option (a); the batch intro records the correction.
  `INBOX.md` has two new items: the better-than-design items found on the follow-ups, chevron,
  heal and tower-ruins branches (for the tidy PR, DEC-218), and the fort overlap that the map
  generator makes with two or more towers of one kind per lane.
- Checks run: Prettier and `npm run docs:check` on the changed docs; the full `npm run check`
  runs on the phase/3 merge that follows this entry.
- Next step: merge phase/3 (#71) into this branch; push; PR #75 merges first (merge order).

### 2026-11-06 — Phase 3 / playtest rulings, merge of phase/3 (PR #71) — docs/playtest-rulings — sholtzman + Claude Code

- What was done: merged `origin/phase/3-sprint-3-work` at `2dc2b35` (PR #71). Only
  `docs/plan/PROGRESS.md` conflicted (both sides appended entries); every entry is kept, phase/3's
  first. The first check failed on Prettier: in the previous entry's INBOX text a code span broke
  across two lines, and Prettier re-indented it on each pass. The span is now one word
  (`EntityStore.reachAimOf`), wrapped at 100.
- Checks run: `npm run check` on the merge (log
  `eternalus-agent-work/playtest-2026-11-04/merge-2026-11-06/playtest-rulings.check2.log`):
  EXIT=0, core 1079 passed, client 1754 passed, docs check passed.
- Next step: push; PR #75 merges first.

### 2026-11-07 — Phase 3 / playtest rulings, merge of phase/3 (PR #80) — docs/playtest-rulings — sholtzman + Claude Code

- What was done: merged `origin/phase/3-sprint-3-work` at `ed10145` (PR #80). `INBOX.md` and
  `docs/plan/PROGRESS.md` conflicted (both sides appended). `INBOX.md`: the item from PR #80
  first, then the three items of this branch and its ticked M4 line. `PROGRESS.md`: every entry
  kept, phase/3's first. This branch is the first link of a merge chain: #74, #78, #76 and #77
  each merge the branch before them, so the five PRs merge in that order with no new conflicts.
- Checks run: `npm run check` on the merge (log
  `eternalus-agent-work/pr-merge-74-79/check-75-merge.log`): exit 0, Prettier passed, core
  `Tests 1081 passed (1081)`, client `Tests 1754 passed (1754)`, docs check passed.
- Next step: push; PR #75 merges first, then #74, #78, #76 and #77.

### 2026-10-28 — Game loop plan GL-1 (Phase 3 sprint 3.5, pulled forward) / the match director kernel — feat/match-director — sholtzman + Claude Code

- What: built GL-1 of the game loop and results plan (its §4.1, §4.2, A1, A2, A14) with the
  owner's rulings of 2026-10-28. Uncommitted in the working tree, on `feat/hud-and-character-select`
  at `81a2022`.
  - Core `match/`: `MatchDirector` (start, then per tick: fire due entries, update the phase),
    `MatchTimeline` (resolve marks to ticks, stable sort), the phase registry
    (`defaultMatchPhases.ts`: `CountdownPhase`, six rule-less phases on `PassivePhase`), the action
    registry (`defaultTimelineActions.ts`: `EnterPhaseAction`), `DirectorContext`.
    `systems/MatchDirectorSystem` runs after `DeathSystem`, before `InvariantSystem`.
  - The countdown is a freeze (owner): `MatchState.isMovementHeld` (hashed); `CountdownPhase`
    sets it on enter and clears it on exit; `MovementSystem` holds every entity while it is set.
    `Simulation` starts the director before tick 0, so the hold covers tick 0. Only movement is held.
  - `config/`: `MATCH_PHASES` and `MatchPhase` (moved from `state/`), `MatchTimelineEntry`,
    `MatchConfig.timeline` (the default built from `countdownSeconds`), `plannedMatchSeconds` 1800
    (DEC-13's 30 minutes; a planning length, not a cap), the 12 §3 validation rules.
  - `state/`: `MatchState`, `GameState.match`, `setPhase` (stamps the tick, emits
    `phase-changed`), `phaseChangesThisTick()`; `Snapshot.match` (`phase`, `phaseEnteredTick`,
    `upcoming`) replaces `Snapshot.phase`; `StateHasher` appends the match fields once the match
    leaves its initial state. `diagnostics/`: `PhaseMonotonicInvariant` (`phase-monotonic`).
  - `DefaultSystemPipeline` takes an options object (five inputs). The wander-seed-7 fixture's
    config gains the `timeline` field `GameConfig` now requires; its commands and checkpoints are
    unchanged and it still reproduces. Tests that walk from the first ticks run with
    `countdownSeconds: 0` (core: `Simulation`, follow-leader and player scenarios; client:
    `DeviceIntentSource`, `Match`).
  - Every new test was seen red under a deliberate break before it passed.
- Checks run: `npm run check` → `EXIT=0`: core "Tests 682 passed (682)", statements 99.23 %;
  client "Tests 1360 passed (1360)", statements 96.48 %; "✓ built"; "Documentation check passed."
- Next step: the pre-PR gate (critic, ponytail, re-check); then GL-2 (victory and `MatchResult`)
  on this branch.

### 2026-10-29 — Game loop plan GL-1 (Phase 3 sprint 3.5, pulled forward) / critic rounds 1 and 2, 10 s countdown — feat/match-director — sholtzman + Claude Code

- What: two critic loops on GL-1 (two of the owner's three), the owner's DEC-84 points, and doc
  fixes. Still uncommitted, on `feat/match-director` at `81a2022`. Correction to the entry above:
  the branch is `feat/match-director`, not `feat/hud-and-character-select`.
  - Round 1 fixes: the timeline must have an `enter-phase` entry, and the first one must fall at
    `round(countdownSeconds × tickRate)`; no entry enters `victory` or `defeat`
    (`TERMINAL_MATCH_PHASES`); a backward phase move throws when `debug.throwOnViolation` is set,
    else it is logged through the `Logger` port and the phase stays (`MatchDirector` takes an
    options object); a simulation with custom systems has no schedule; the freeze length is
    pinned (steps 0 to T); hash tests vary each match field alone; the countdown scenario moved
    to `match/scenarios/`. Core went from 682 to 700 tests.
  - `match/` may use the `Logger` port, `makeLogRecord` and `DebugConfig` of `diagnostics/`
    (12 §1, 02 §2, core `AGENTS.md`); `diagnostics/` never imports `match/`.
  - DEC-84 (5): the `countdownSeconds` default is 10 s (`TUNE`), was 60 s; tests moved from tick
    1,800 to tick 300.
  - Round 2 (architecture, correctness, ponytail): no blockers. Applied: the 12 §4 sketch matches
    the code (`start(state)`, `update(state)`, `DirectorContext = { state, enterPhase }`,
    `readonly` phase fields, `schedule` not hashed); FR-003 and the 12 §2 `countdown` row use
    DEC-84's words (only walking is held; attacks and casts work) and say camp units spawn in the
    countdown; the 12 frontmatter `paths` list the match files in `config/`, `state/` and
    `systems/`; the 02 §9 action row names `ACTION_RULES`; `CountdownPhase` cites DEC-81 and
    DEC-84. Rejected: one `countdownTicks` helper (two readers; the third, a `SpawnSystem`
    countdown gate, goes away under the owner's later tick-0 wave ruling); a shorter `Simulation`
    constructor (55 lines, inside the limit); always-throw, dropping the has-entry rule and
    dropping the initial-state hash rule (each conflicts with 12 §4 or an existing test).
  - A round-2 critic mutated six source files while it ran; they were restored and diffed
    against a baseline before any check counted.
- Fail-first breaks: each new test was seen red under a deliberate break, then the file was
  restored.
  - GL-1 build: entries fire one tick late, 4 red; `toSorted` removed or `round` → `floor`, 1 red
    each; `CountdownPhase.exit` keeps the hold, `EnterPhaseAction.run` does nothing, a wrong
    registry class, `MatchDirectorSystem.update` does nothing, `MovementSystem` ignores the hold,
    1 red each; `PhaseMonotonicInvariant` never flags, 3 red; `StateHasher` never appends the
    match fields, 3 red; each 12 §3 validation rule neutralised, 1 to 6 red.
  - Round 1: has-entry rule off, 1 red; countdown-tick rule off, 3 red; always throw, never
    throw, or log without skipping, 2 red each; log on forward moves, 3 red; always build a
    schedule, 1 red; entries fire one tick late or early, 12 red each; director before
    `MovementSystem`, 4 red; `phaseEnteredTick`, `timelineCursor` or `isMovementHeld` left out of
    the hash, 1 red each.
  - 10 s default: changing only `defaultGameConfig.ts` turned 7 tests red.
  - Not covered: `Simulation` passing its own `debug` to the director (hard-coding
    `throwOnViolation: true` leaves every test green). Validation keeps a backward move out of
    every valid config, so the `Simulation` API cannot reach it.
- Checks run: `npm run check` → `EXIT=0`, after every change above: core "Tests 700 passed
  (700)", statements 99.24 %; client "Tests 1360 passed (1360)", statements 96.48 %; "✓ built";
  "Documentation check passed."
- Next step: GL-2 (victory and `MatchResult`) on this branch, with a guard that rejects any move
  out of `victory` or `defeat` (12 §2 says both are terminal; round 2 found the forward check
  allows `victory` → `defeat`, unreachable until a verdict exists). Before the PR: the
  `docs/game-loop-and-results-plan` branch (DEC-71 to DEC-84) merges first, and this branch is
  rebased on the phase branch.

### 2026-10-30 — Game loop plan GL-1 (Phase 3 sprint 3.5, pulled forward) / DEC-88 countdown freeze, `match/` import list — feat/match-director — sholtzman + Claude Code

- What: the countdown now holds every unit idle (DEC-88, amends DEC-84 (1)). Still uncommitted, on
  `feat/match-director` at `81a2022`.
  - `MatchState.isMovementHeld` is renamed `isIdleHeld` (core, architecture 10 and 12; the
    entries above keep the old name). `CombatSystem.update` returns at once while it is set and
    keeps every target for after. Casting is not built (`cast-ability` goes to
    `UnsupportedCommandHandler`) and facing is not modelled, so the ability runtime's check waits
    for it; the DEC-88 row lists architecture 05 §7 as pending.
  - Tests: `CombatSystem.test.ts` "lands no attack while the match holds units idle, and keeps the
    target for after"; `countdown.scenario.test.ts` "holds attacks too: … first hits it one step
    after the countdown" replaces "holds only movement". Both were red before the fix ("expected
    55 to be 100", "expected 3 to be +0") and green after.
  - Docs: FR-003, the 12 §2 `countdown` row and the 12 §4 sketch use DEC-88's words. DEC-88 is
    logged on `docs/game-loop-and-results-plan`. The `match/` import list in 02 §2 and in the core
    `AGENTS.md` table now matches 12 §1 (`teams/` and content types; the `diagnostics/` part as a
    line under the 02 table). The minion system doc, §3.3 "The worst lane", still quotes the old
    02 list (`state/`, `config/` and `utils/` only); the PR #38 fix owns that doc.
- Checks run: `npm run check` → `EXIT=0`: core "Tests 701 passed (701)", statements 99.24 %;
  client "Tests 1360 passed (1360)", statements 96.48 %; "✓ built in 282ms"; "Documentation check
  passed."
- Next step: GL-2 (victory and `MatchResult`) on this branch, with the terminal-phase guard in
  `MatchDirector.transition` and `PhaseMonotonicInvariant`.

### 2026-10-30 — Game loop plan GL-2 (Phase 3 sprint 3.5, pulled forward) / victory, `MatchResult`, the human's seat — feat/match-director — sholtzman + Claude Code

- What: built GL-2 of the game loop and results plan (§4.3, §4.5, A2, A3, A19). Still uncommitted,
  on `feat/match-director` at `81a2022`, beside GL-1.
  - Victory (core): `ObjectiveLostCondition` (a team loses when its last `WinObjective` dies; both
    on one tick is a draw; ADR 0021, DEC-71), the `WinObjective` marker, `VictoryConditionId`,
    `MatchResult` and `Verdict` in `state/`, `defaultVictoryConditions.ts`,
    `defaultMatchDirector.ts` (the director `Simulation` and the scenario test both build). The
    director checks conditions after `DeathSystem`, builds the result (`durationTicks`, `seed`,
    `configHash` over the canonical config, `finalHash` mid-tick before the terminal phase), enters
    `victory` or `defeat` for `MatchConfig.playerTeam` (a draw enters `defeat`), emits
    `match-ended` and is inert after. No move leaves a terminal phase (`transition` and
    `phase-monotonic`). `applyCommand` refuses every command once the result is set
    (`match-ended`, FR-002).
  - The seat (A19): `MatchConfig.seat` (`{ definitionId, at }`, `null` = sim mode).
    `Simulation` spawns it through the `dev-spawn` handler after the director starts, without a
    command, and sets `state.match.humanLegendId` (in the snapshot). Client `seatedConfig.ts`;
    `createBrowserMatch` seats the config; `Match.spawnPlayer` is gone.
  - Docs (owner docs, every edit reported): FR-002 (the sovereign win), FR-021 (the Stronghold is
    not a win objective), 12 Purpose/§1/§6/§10/§12/§13, 03 §3 and §4, 02 §2, 11 §7, 17 R17a, core
    `AGENTS.md` (`config/` may import `teams/` types; `match/` may import `components/`).
  - Critic loop (two rounds, correctness + ponytail; log
    `eternalus-agent-work/game-loop-plan/critic-log.md`): applied C1, C2, C4, C9, C10, C12,
    R2-C2, R2-C4; rejected C3 (code), C5 to C8, C11 with reasons; the independent `finalHash`
    verdict kept the 12 §6 order. Deferred to GL-3 (needs a `Simulation` that can end a match):
    log only the first post-end `match-ended` rejection, and a `Simulation`-level FR-002 test.
  - Owner answer after the report (DEC-92, logged on `docs/game-loop-and-results-plan`): after
    `match-ended` the world keeps running and no unit is held; the client stops the loop a few
    seconds later (GL-5; the number of seconds is open). 12 §4 cites it. No code change.
    Follow-up: the owner set the delay to 5 s.
  - Pre-PR architecture review, round 1 (`arch-review-gl2-round-1.md`): no blockers; 1 major,
    5 minor, 13 nits. M1 (doc changes beyond the plan): the owner signed them off (DEC-113).
    Fixed: m1 (one list feeds the match-field hash check; the existing tests fail under both
    breaks, `gl2-arch-r1-breaks.md`), m2 (`ponytail:` marker on the seat spawn), n1, n2, n5, n6,
    n12, n13. Deferred to GL-3: m4 (the timeline rules filter on `enter-phase`) and m5 (FR-002
    through `Simulation`). Rejected: n3; n4 (lint `no-unnecessary-type-arguments` while the
    union has one kind); n7 (the `new-system` skill covers strategies); n8 (an API change for
    the PR); n9 (the verdict follows from hashed entity state); n11 (base test files run to 528
    lines). For the PR: n10 (GL-1, the DEC-88 hold and GL-2 on one branch).
  - Checks after those fixes: `npm run check` → `EXIT=0` (`gl2-arch-r1-check-2026-10-30.log`):
    core "Tests 758 passed (758)", statements 99.26 %; client "Tests 1365 passed (1365)",
    statements 96.38 %; "✓ built in 237ms"; "Documentation check passed."
- Fail-first breaks: each new test was seen red under a deliberate break, then the file was
  restored (`cmp`). Step A: 23 breaks, `gl2-breaks.out`. Step B: 15 breaks, `gl2-stepB-breaks.md`
  (names partly inferred from backup files). Round 1: 4 breaks, `gl2-r1-breaks.md`. All in
  `eternalus-agent-work/game-loop-plan/`.
  - Not covered: a `Simulation`-level end with `hadHuman: true` (no shipped kind has
    `WinObjective` before GL-3).
- Checks run: `npm run check` → `EXIT=0` after every change above (last log
  `gl2-r2-check-2026-10-30.log`): core "Tests 758 passed (758)", statements 99.26 %; client "Tests
  1365 passed (1365)", statements 96.38 % (was 96.48: `spawnPlayer`'s covered lines left;
  thresholds untouched); "✓ built in 234ms"; "Documentation check passed."
- Next step: GL-3 (the King) after M1 and the `spawn-requested` shape agreed with Samarjit, with
  the two deferred items above; then the pre-PR gate. Before the PR the
  `docs/game-loop-and-results-plan` branch (DEC-71 to DEC-88) merges first and this branch is
  rebased on the phase branch.

### 2026-10-30 — Game loop plan GL-4 (Phase 3 sprint 3.5, pulled forward) / match scoring — feat/match-scoring — sholtzman + Claude Code

- What: built GL-4 of the game loop and results plan (§4.4, §4.5, A5, A6; DEC-79, DEC-84 (2),
  DEC-113 (8) and (10)). Uncommitted, on `feat/match-scoring` from `feat/match-director` at
  `2aa9651`.
  - Core: `match/Scoring.ts` (+ `Scoring.types.ts`), `state/ScoringState.types.ts`
    (`LegendStats`, `TeamStats`, `ScoringState`), `state/emptyScoringState.ts`,
    `content/match/scoring.ts` (`SCORING_WEIGHTS`: Legend kill 15 and assist 7, both `TUNE`;
    death 0; mobs by kind 1, 4, 12; `ASSIST_WINDOW_SECONDS` 30, `TUNE`) and `scoring.types.ts`,
    `MobKind` in `content/mobs/mobs.types.ts`. `Simulation` passes the content values into
    `createDefaultMatchDirector`, which builds `Scoring` before the seat spawns, so the seat's
    Legend has a row from the fold of tick 0. The director folds after the phase update and before
    the victory check, so a kill on the ending tick counts; `end()` copies the rows and team totals
    into `MatchResult.legends` and `teams`. `ScoringState` sits in `state.match` and joins the
    state hash once it differs from the empty state, so the golden replay
    (`wanderSeed7.replay.ts`) is unchanged and was not re-recorded. `index.ts` exports the
    `LegendStats` and `TeamStats` types (API change for the PR).
  - Rules: only a Legend (a row) earns a kill, and a hit names its attacker, so a hit still counts
    after its Legend left the store; a non-Legend last hit gives no kill and the assists still
    count; assists are for Legend victims only, inside the window (its last tick included), and
    never for the killer; Host mobs count as `minionKills`, neutral mobs as `neutralKills`, both
    by kind; bosses, the sovereign and other families give nothing; `structureDamage` counts the
    health a Legend takes off structures, with no points; a team's score is the sum of its
    Legends' scores; nothing is buffered once the match has a result. Points for structures,
    captures and holds (FR-007) wait for the owner's values (`ponytail:` note in
    `content/match/scoring.ts`).
  - Docs (owner docs, every edit reported): 12 §5 (the accepted §6 row: weights, assist rule and
    window, FR-007 points pending, `neutralKills`, team total) and §13; 03 §2 (`TeamState` comment
    drops `score`) and §4 (`Scoring` listens to `entity-spawned` and `damage-applied`); 02 §2
    (`state/` and `content/` rows).
- Fail-first breaks: each new test was seen red under a deliberate break, then the file was
  restored (`cmp`): 27 breaks, 36 test results, `eternalus-agent-work/game-loop-plan/gl4-breaks.md`
  (script `gl4-breaks.py` beside it).
- Checks run: `npm run check` → `EXIT=0` (`gl4-check-2026-10-30.log`): core "Tests 792 passed
  (792)", statements 99.29 % (was 99.26); client "Tests 1365 passed (1365)", statements 96.38 %;
  "✓ built" (the build line); "Documentation check passed."
- Next step: the pre-PR gate for GL-1, GL-2 and GL-4 (architecture critic, then ponytail), GL-5
  (the client end flow reads `MatchResult.legends` and `teams`), and GL-3 (the King) after M1.
  Owner points still open: structure, capture and hold points (FR-007).
- Critic loop (session c2172931, 2026-10-30, two rounds; triage in
  `eternalus-agent-work/game-loop-plan/critic-log.md`):
  - Round 1 correctness: FAIL on one major. Self-kills, self-assists and ally kills scored (no
    team check). Fixed: `Scoring` compares teams as `ProgressionSystem` does (O5, 05 §18), on
    hits, Legend kills and mob kills; self-damage is still blocked by `FriendlyFireStep`, so the
    self-kill test announces the events. Owner call on `structureDamage`: shield damage included
    (DEC-123). Fixed: the `death: 0` citation (the owner's request of 2026-10-27, not DEC-79), a
    `recentHits` check, the assist-ring bound wording in 12 §13. Rejected: a throw for an unknown
    mob kind (the type guard is the narrowing; `xpFor` does the same) and no kill for a neutral
    Legend (it is an enemy Legend).
  - Round 1 ponytail (`ponytail-gl4-round-1.md`): 2 cuts rejected (a merged filter loop is no
    shorter; `PendingChange` stays in `Scoring.types.ts` by CONTRIBUTING §3.1); 12 §5 now names
    `ASSIST_WINDOW_SECONDS` instead of copying 30 s.
  - Round 2: correctness PASS (one DEC-123 wording fix, two TSDoc nits fixed); ponytail PASS,
    0 findings (`ponytail-gl4-round-2.md`).
  - Owner rulings: DEC-122 (`LegendStats` holds only filled counters; plan §4.4 cites it) and
    DEC-123, on `docs/game-loop-and-results-plan`, uncommitted.
  - Fail-first: 3 new tests red before the fix; breaks B1-B5 each red, file restored (`cmp`):
    `gl4-breaks.md`, section "Critic round 1 fixes".
- Checks after the fixes: `npm run check` → `EXIT=0` (`gl4-r2-check-2026-10-30.log`): core
  "Tests 795 passed (795)", statements 99.29 %; client "Tests 1365 passed (1365)", statements
  96.38 %; "✓ built in 251ms"; "Documentation check passed." Only this entry changed after it.

### 2026-10-30 — Game loop plan GL-4 pre-PR review round 1 (Phase 3 sprint 3.5, pulled forward) — feat/match-scoring — sholtzman + Claude Code

- What: the pre-PR architecture review of GL-4 (`2aa9651..80d0a5d`): approve, 0 blockers, 5 minor,
  4 nits (`eternalus-agent-work/game-loop-plan/arch-review-gl4-round-1.md`). Owner answers, logged
  on `docs/game-loop-and-results-plan`: DEC-130 (own-side hits and kills score nothing, as O5),
  DEC-131 (FR-007 points, structure 5, capture 3 per checkpoint, hold 1 per minute, not built),
  DEC-132 (a design critic chose the as-built per-pair list of recent damagers over the design's
  per-victim ring: the ring can drop a valid assist and keeps hits from an earlier life; neither
  serves the checkpoint damage bias, which 05 §13 gives to `ProgressionSystem`). Applied:
  - Citations: `Scoring.ts` and 12 §5 cite DEC-130; `content/match/scoring.ts`'s `ponytail:`
    note and 12 §5 cite DEC-131; the 12 §5 `damage-applied` row describes the per-pair list
    (DEC-132) and drops "and the checkpoint damage bias"; the status note says "assist store".
  - 17 R3 (add a mob type): a new weight class also adds a `minionKill` value in
    `core/content/match/scoring.ts`. `packages/core/AGENTS.md`: `match/` holds `Scoring`.
  - Correction to the GL-4 entry above (entries are not rewritten): the work there was committed
    (`3af30f3`, `80d0a5d`), not "Uncommitted"; and per DEC-123 `structureDamage` counts health and
    shield damage, not only "the health a Legend takes off structures".
  - Not changed: the legend/mob branch in `Scoring` (a handler map when a third family scores);
    the `Pick<Scoring, 'fold'>` port (the doubles work).
  - Owner docs edited (reported): 12 §5 and §13, 17 R3.
- Checks run: comment and doc edits only; the pre-commit hook (typecheck, lint) and
  `npm run docs:check` pass.
- Next step: merge `docs/game-loop-and-results-plan` first (DEC-122, 123, 129 to 132); merge this
  branch into `feat/results-flow`; GL-4's ponytail review.

### 2026-11-04 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / phase/3 merge, BD-B — feat/match-director — sholtzman + Claude Code

- What: merged `phase/3-sprint-3-work` (`387a5fd`, PR #68) into `feat/match-director`
  (`45f53d2`), then built BD-B (`INBOX.md` HC-S6, DEC-139).
  - Merge fallout forced by A19 (core spawns the seat from config): phase/3's client tests seat
    the player with `seatedConfig` (`Match.roofs.test.ts`, `createBrowserMatch.test.ts`); the
    DEC-149 adoption test now proves `Match` takes the seat's Legend, not a roster twin, before any
    tick; the ADR 0025 evidence test reads the seat from the replay config, expects no command for
    it, and watches the TRACE ring at its own `write` (the seat's ERROR `core.match` is logged
    while the match is built, before `evidence()` exists).
  - Merge fallout forced by DEC-88: phase/3's horde, map-object and destruction tests step through
    the countdown; two `DefaultInvariantRunner` calls take the phase lists. `HordeSystem` holds
    every anchor while the match holds units idle (in the merge commit: phase/3's fight test is
    red without it); 18 §4 notes the hold.
  - BD-B: `MatchViewControls` holds the nine canvas-gesture members; `Match.controls` exposes it,
    `MatchHost` gives it to `CanvasPointerControls`. Architecture 06 §10 names the new owner of
    `leaveExplorer`, `setPointerClaimed` and `attackAt` (owner doc, reported).
- Fail-first breaks: the DEC-149 test is red when `Match` adopts the first Legend of the player's
  class and team (`expected [ 'entity-886' ] to deeply equal [ 'entity-885' ]`); the evidence
  test is red when the page sinks come before the ring (`lastInRing` was the INFO seed record).
  Both files restored and compared with the index. The `HordeSystem` test was seen red in the
  previous session ("expected 10.058333333333334 to be 10").
- Not covered: an error report made while the match is built has no match evidence (no running
  match yet); it falls back to the page log tail, which holds the seat's ERROR.
- Checks run: `npm run check` → `EXIT=0` (`md-check-bdb-2026-11-04.log` in
  `eternalus-agent-work/game-loop-plan/`): core "Tests 1087 passed (1087)", statements 99.08 %;
  client "Tests 1740 passed (1740)", statements 96.82 %; "✓ built in 260ms"; "Documentation check
  passed."
- Next step: the pre-PR gate against base `387a5fd` (architecture critic, ponytail, re-check),
  then the PR into phase/3; then the same merge for `feat/match-scoring` and
  `feat/results-flow`.

### 2026-11-04 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / phase/3 merge (minions) — feat/match-director — sholtzman + Claude Code

- What: merged `phase/3-sprint-3-work` (`8e058d8`: PRs #56, #57, #58 and #66, the minion work)
  into `feat/match-director` (`12e030b`). The round-1 critic fixes follow on top.
  - Conflicts, both sides kept: `GameState` (the match state, the lane-structure index and the
    ally-damage listener; phase/3's `phase` field stays gone, the match state replaced it),
    `HordeSystem` TSDoc (the countdown hold and the objective hold), `DefaultSystemPipeline` TSDoc
    (the system order with veterancy, structures and the director), the 03 §4 event table (this
    branch's rows plus `structure-breakability-changed` and `camp-cleared`), and `PROGRESS.md`
    (phase/3's entries first, then this branch's).
  - Merge fallout forced by DEC-88: two phase/3 tests in `Simulation.structures.test.ts` step
    through the countdown first (the guard chase and the horde hold at a tower), as the horde tests
    already do.
- Fail-first: both tests were red on the merged tree before the change ("expected 0 to be greater
  than 0"; "expected 81.59251823934368 to be greater than 111",
  `md-phase3-merge-check-2026-11-04.log`).
- Checks run: see the commit's check log, `md-phase3-merge-check-2-2026-11-04.log` in
  `eternalus-agent-work/game-loop-plan/`.
- Next step: the round-1 critic fixes (`critic-log.md`, "match-director pre-PR gate").

### 2026-11-04 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / pre-PR critic round 1 fixes — feat/match-director — sholtzman + Claude Code

- What: built the "Fix" rows of the round-1 triage (`critic-log.md`, "match-director pre-PR
  gate"; reports `arch-review-md-pr-round-1.md` and `-1b.md` in
  `eternalus-agent-work/game-loop-plan/`).
  - Blocker (plan A19's stand-in removal condition was met): `MatchConfig.seat` is
    `{ definitionId } | null`. Core spawns the human's Legend at `playerTeam`'s Stronghold through
    `Simulation.spawnLegend` (the roster, Rovers and seat share it), after the roster. An unknown or
    non-Legend definition logs ERROR `core.match` (reason `unknown-definition` or `not-a-legend`)
    and leaves `humanLegendId` `null`. A seat with no map throws, and the roster's size and Unit-cap
    checks count the seat. The client's `seatedConfig` sends only the definition id; `Match` points
    the camera at the seat Legend, or at the middle of the map when there is none.
  - The director and the systems are built before the roster spawns (the same move as
    `feat/match-scoring` `ad2e8e7`).
  - `MatchDirector` takes its hasher and its terminal phases through `MatchDirectorOptions`.
  - `MatchViewControls.test.ts`: 12 tests, one or more per member.
  - Docs: the win rule in reference 00, 03 and 04 (the King's death ends the match, ADR 0021);
    03 `phase-changed` row; 08 dated note; 11 §7 and 12 §13 (the seat); 12 `paths`, `ForfeitCondition`
    post-MVP, `early-game` row, §12; 02 §2 sentence; 18 §3.3 pointer; FR-002 and FR-003; INBOX
    HC-Q35 to HC-Q41 (owner calls A to E, decision page linked) and HC-S8 to HC-S10 (GL-3 items);
    dated notes on HC-Q32 and DEC-149.
- Fail-first breaks: every new or changed test went red against a deliberate break, then the file
  was restored and compared with `cmp`. The red lines are in the agent reports (session ee12bd59).
  Removed tests whose subject is gone: the client `strongholdOf` block and "rejects a seat outside
  the world".
- Not done: `MatchDeps.player` is now unused by `Match` (left for the critic round 2 or ponytail).
- Checks run: `npm run check`, log `md-r1-fixes-check-2026-11-04.log` in
  `eternalus-agent-work/game-loop-plan/` (result in the commit message).
- Next step: critic round 2 (base `8e058d8`), ponytail, re-check, the PR into phase/3.

### 2026-11-04 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / the owner's calls on critic round 1 (DEC-170 to DEC-176) and PR #72 — feat/match-director — sholtzman + Claude Code

- What: built the owner's answers on the round-1 decision page (`INBOX.md` HC-Q35 to HC-Q41;
  verbatim in `eternalus-agent-work/game-loop-plan/owner-answers-2026-11-04-match-director-calls.md`).
  - DEC-170 (B1): `config/countdownTicks.ts`, used by every copy of the countdown-end formula.
  - DEC-171 (C1): `teams/playableTeams.ts` (`PLAYABLE_TEAMS`, `isPlayableTeam`, `opponentOf`).
  - DEC-172 (C2): `GameState.match` is read-only; `holdIdle`, `endMatch`, `seatHuman` and
    `advanceTimeline` write it.
  - DEC-173 (A2): the human's Legend is the roster's `human` slot (`RosterSlot.pilot`);
    `MatchConfig.seat` is gone; the client's `botRosterSlots` is `rosterSlots`.
  - DEC-174 (C3): `DefaultInvariantRunner` takes `DefaultInvariantRunnerOptions`.
  - DEC-175 (D1): the `end-game` mark 0.75 is the owner's ruling, cited at the value and in 12.
  - DEC-176 (E1): FR-006 states the built phases, `phase-changed` and the 30-minute length.
  - Merged PR #72 (`fix/horde-guard-deadlock`, 67c0001): the side step when separation cancels a
    pull. Our own side-step patch is dropped for it.
  - Docs: the decisions-log batch; architecture 02, 03, 08, 11 §7, 12, 15 §7, 18 §8 for A2;
    requirements FR-006; INBOX HC-Q35 and HC-Q39 to HC-Q41 answered, HC-Q42 new (DEC-80's
    Citadel spawn against the as-built lane start). The plan's A19 and §4.5 amendment note is on
    `docs/game-loop-and-results-plan` (#71, a945743).
- Fail-first breaks: `md-r2-breaks.md`, `md-a2-breaks.md` (20 breaks) and `md-c3-breaks.md`, all
  in `eternalus-agent-work/game-loop-plan/`; every file restored and compared with `cmp`.
- Checks run: `npm run check`, log `md-owner-calls-check-2026-11-04.log` in
  `eternalus-agent-work/game-loop-plan/` (result in the commit message).
- Next step: critic round 2 (base `f40811f`), ponytail, re-check, the PR into phase/3 after #71
  and #72.

### 2026-11-04 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / critic round 2 fixes and the owner's calls (DEC-177 to DEC-179) — feat/match-director — sholtzman + Claude Code

- What: fixed the round-2 critic findings (`arch-review-md-pr-round-2.md`: approve, 0 blocker,
  5 minor, 10 nit) and built the owner's three answers (`INBOX.md` HC-Q43 to HC-Q45; verbatim in
  `eternalus-agent-work/game-loop-plan/owner-answers-2026-11-04-match-director-round-2.md`).
  - DEC-177 (#3): `state/MatchRecord.ts` implements `MatchState` and holds the five match writers;
    `GameState.match` is a `MatchRecord`, and callers write through `state.match`.
  - DEC-178 (#15): core exports `opponentOf`; the client's `buildMatchSetup.ts` uses it.
  - DEC-179: `eternalus-agent-work/` is in ESLint's `globalIgnores` and in `.gitignore`.
  - #1: a bot slot whose definition is unknown or not a Legend throws before any Legend spawns
    (`Simulation.legendRefusal`, shared with the human slot). #2: a test that a refused human
    slot counts toward the caps. #5: `MatchRequest.player` is gone; `seatedConfig` is
    `withPlayerTeam`. #9: `seatHuman` takes an `EntityId`. #14: the ghost-wave end is pinned at
    three countdowns. Ponytail P1, P2: `spawnLegend` and `roverName` inlined.
  - Docs (#4, #6 to #8, #10 to #13): HC-S7 dated note; 10 and 17 `last-reviewed`; 12 `paths`
    and §4 options comment; 02 and the core `AGENTS.md` note that every folder may import
    `teams/`; the `isIdleHeld` TSDoc names `HordeSystem`; HC-Q32 note and the `wanderSeed7`
    fixture header; DEC-173's Docs cell; 03 §2 sketch for DEC-177. The decisions-log batch and
    HC-Q43 to HC-Q45 answered.
- Fail-first breaks: `md-r2fix-breaks.md` in `eternalus-agent-work/game-loop-plan/`; every source
  restored.
- Checks run: `npm run check`, log `md-r2fix-check-2026-11-04.log` in
  `eternalus-agent-work/game-loop-plan/` (result in the commit message).
- Next step: critic round 3 (the last) and ponytail on the delta, then the PR into phase/3 after
  #71; re-merge into `feat/match-scoring` and `feat/results-flow`.

### 2026-11-05 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / phase/3 merge (#69) and critic round 3 — feat/match-director — sholtzman + Claude Code

- What: merged phase/3 `a58de03` (#69) into the branch (`1108596`); one conflict, the decisions
  log's top, where both sides added a batch (all three kept, newest first). Ran the pre-PR critic's
  round 3, the last: architecture critic approve, 0 blocker, 0 major, 0 minor, 8 nit
  (`arch-review-md-pr-round-3.md`); ponytail on the round-3 delta, no cuts
  (`ponytail-md-pr-round-3.md`). Fixed the nits:
  - #2: `MatchState` is an `interface` (a class implements it; CONTRIBUTING), in code and the 12
    §4 sketch. #3: the `Match.roofs` test docblock names the map it now uses. #4: `PlayerChoice`
    moved from `Match.types.ts` to the `withPlayer` test fixture (no production reader). #5:
    `defaultMatchPhases.test.ts` compares `MatchState`'s fields, not `MatchRecord`'s JSON.
  - #6: DEC-177's Docs cell names 02 §2 and the 12 `paths`; the batch intro and DEC-179 say that
    HC-Q45 had no recommendation (Q3's options had none marked). #7: this entry. #8: a PR note
    (commit `ca2d8cc` is typed `refactor` but changes bot-slot behaviour and adds an export).
  - #1 (better than the design): `INBOX.md` HC-Q46, who can reach the match writers; not built.
- Fail-first breaks: `md-r3-breaks.md` in `eternalus-agent-work/game-loop-plan/`.
- Checks run: `npm run check` on the merge `1108596` (log `md-r3-merge-check-2026-11-05.log`):
  EXIT=0, core 224 files / 1231 tests, client 269 files / 1769 tests, docs check passed. After the
  nit fixes: log `md-r3-fix-check-2026-11-05.log` (result in the commit message and the PR).
- Next step: the PR into phase/3 (merges after #71, which must first take phase/3); re-merge into
  `feat/match-scoring` and `feat/results-flow` (16 `state.<writer>(` calls become
  `state.match.<writer>(`); tell Samarjit about the edits in his files.

### 2026-11-06 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / phase/3 merge (#71) for PR #74 — feat/match-director — sholtzman + Claude Code

- What was done: merged `origin/phase/3-sprint-3-work` at `2dc2b35` (PR #71, the game loop and
  results plan, merged 2026-11-07 UTC) into this branch, so PR #74 is no longer conflicting. One
  conflict, in this file: both sides appended entries. Kept every entry, phase/3's first, so this
  branch's diff to phase/3 stays a pure append. Git merged `INBOX.md`, the owner decisions log,
  `docs/README.md` and ADR 0006 without conflict. No DEC id appears twice in the merged log. The
  duplicate ADR numbers 0018 and 0019 were already on `a58de03`; this merge did not add them.
- Checks run: `npm run check` on the merge (log
  `eternalus-agent-work/match-director/md-merge-2dc2b35-check-2026-11-06.log`): EXIT=0, core 224
  files / 1231 tests, client 269 files / 1769 tests, docs check passed.
- Next step: push; PR #74 into phase/3.

### 2026-11-07 — Game loop plan / match director, merge of docs/playtest-rulings (PR #75) — feat/match-director — sholtzman + Claude Code

- What was done: merged `docs/playtest-rulings` (PR #75, which holds phase/3 at `ed10145`), so
  this PR merges after #75 with no conflicts (merge chain #75, #74, #78, #76, #77).
  `docs/plan/PROGRESS.md` and the owner decisions log conflicted. Decisions log: the batches of
  both sides interleaved newest first (on the same date, #75's batch first); 195 DEC rows, every
  number once; DEC-147 to DEC-149 keep this branch's text, which adds a "built" note to DEC-149.
  `PROGRESS.md`: every entry kept, #75's first.
- Checks run: `npm run check` on the merge (log
  `eternalus-agent-work/pr-merge-74-79/check-74-merge.log`): exit 0, Prettier passed, core
  `Tests 1233 passed (1233)`, client `Tests 1769 passed (1769)`, docs check passed.
- Next step: push; PR #74 merges after #75.

### 2026-11-05 — Phase 3 / Legend XP rework (code and docs) — feat/structure-xp — sholtzman + Claude Code

- What was done: code, in two commits. 77a999e (DEC-186): a destroyed structure pays XP to every
  living Legend of the destroying team, event-driven by `structure-destroyed` in
  `ProgressionSystem`, audited by the `level-matches-xp` invariant (structure must be gone, no
  ally or double award). b44714e (DEC-190): new Legend XP curve and sources in `content/progression`
  so no same-level kill or structure gives several levels; not final. Critic round 1 follow-ups:
  `Award` union tagged with `kind`; `xp-gained.cause` required (`'kill' | 'structure-destroyed'`);
  one `legendOf` helper. Docs follow: INBOX income-estimate item marked superseded plus a new
  update; `balancing.md` XP recommendations marked superseded with a pointer; architecture 05 §20
  status note and phase 4 plan status updated. The DEC-186 and DEC-190 rows are on the docs
  branch, not this one.
- Tests: `ProgressionSystem.test.ts` (structure award, team filter, level-up, neutral, buildings),
  `LevelMatchesXpInvariant.test.ts`, `xpSources.test.ts` (all 49 levels, curve sum 7,742), and a
  pipeline test in `DefaultSystemPipeline.test.ts`: a real tower destroyed through the default
  pipeline pays 120 XP to each living Legend of the other team one tick later, once, with no
  invariant violation. Red line (structure branch disabled): "expected [ +0, +0 ] to deeply equal
  [ 120, 120 ]".
- Checks run: `npm run check` → `exit 0`: "All matched files use Prettier code style!"; core
  "Tests 1066 passed (1066)"; client "Tests 1736 passed (1736)"; "✓ built in 717ms";
  "Documentation check passed." Log: `eternalus-agent-work/xp-rework/check-xp-r2.log`. This
  entry was added after that run.
- Next step: add the DEC rows on the docs branch; build "pay on respawn" with GL-12.

### 2026-11-06 — Phase 3 / Legend XP rework, merge of phase/3 (PR #71) — feat/structure-xp — sholtzman + Claude Code

- What was done: merged `origin/phase/3-sprint-3-work` at `2dc2b35` (phase/3 (PR #71)). Only `docs/plan/PROGRESS.md` conflicted
  (both sides appended entries); every entry is kept, the merged-in side's first. No line of either
  side was removed (`git diff` against both parents shows only additions).
- Checks run: `npm run check` on the merge (log
  `eternalus-agent-work/playtest-2026-11-04/merge-2026-11-06/structure-xp.check.log`): EXIT=0, core
  1089 passed, client 1754 passed, docs check passed.
- Next step: push.

### 2026-11-05 — Phase 3 / playtest fixes: click attack — fix/click-attack-units — sholtzman + Claude Code

- What was done: a click and the held attack button now target a living enemy unit under the
  cursor, not only map objects (ddc41ce). Critic round 1 fixes (d06de14): `Match.clickAt` resolves
  a click as unit, then roof, then map object; when units overlap the one drawn on top (largest y)
  wins, and an exact tie goes to the later snapshot entity (DEC-183); the click resolver gets the
  snapshot as a parameter and core owns the unit families list (`isUnitFamily`), both signed off as
  better than the design (DEC-191). Architecture 06 §10 describes the new click order. Critic
  round 2: no blockers. Each new test was turned red by a deliberate break first (runner report
  `report-click-attack-r2.md` in the work folder).
- Checks run: `npm run check` (log `check-click-docs.log` in the work folder) → `exit 0`: "All
  matched files use Prettier code style!"; core "Tests 1058 passed (1058)"; client "Tests 1746
  passed (1746)"; "✓ built in 300ms"; "Documentation check passed."
- Next step: ponytail review, then the PR into `phase/3-sprint-3-work` after the rulings PR
  (DEC-183 and DEC-191 rows).

### 2026-11-06 — Phase 3 / playtest fixes: click attack, merge of phase/3 (PR #71) — fix/click-attack-units — sholtzman + Claude Code

- What was done: merged `origin/phase/3-sprint-3-work` at `2dc2b35d` (phase/3 (PR #71)). Only `docs/plan/PROGRESS.md` conflicted
  (both sides appended entries); every entry is kept, the merged-in side's first. No line of either
  side was removed (`git diff` against both parents shows only additions).
- Checks run: `npm run check` on the merge (log
  `eternalus-agent-work/playtest-2026-11-04/merge-2026-11-06/click-attack-units.check.log`): EXIT=0, core
  1081 passed, client 1764 passed, docs check passed.
- Next step: push.

### 2026-11-07 — Phase 3 / structure XP, merge of feat/match-director (PR #74) — feat/structure-xp — sholtzman + Claude Code

- What was done: merged `feat/match-director` (PR #74, which holds #75 and phase/3 at `ed10145`),
  so this PR merges after #74 with no conflicts (merge chain #75, #74, #78, #76, #77).
  `docs/plan/PROGRESS.md` and the phase 4 plan conflicted; the plan keeps both sides (this
  branch's DEC-184 hit model note and #74's structure XP status). One semantic conflict: the
  DEC-186 test in `DefaultSystemPipeline.test.ts` now builds the pipeline and the runner from
  options objects (#74, DEC-174). The review nit on #78 is in the same merge commit:
  `ProgressionSystem` finds the structure XP team with `opponentOf` (DEC-171).
- Checks run: `npm run check` on the merge (log
  `eternalus-agent-work/pr-merge-74-79/check-78-merge.log`): exit 0, Prettier passed, core
  `Tests 1243 passed (1243)`, client `Tests 1769 passed (1769)`, docs check passed.
- Next step: push; PR #78 merges after #74.

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/capture-points — Aryan Walanj + Claude

- What was done: reworked PR #49 on `phase/2-sprint-2-work` per the architecture review. Capture
  points are `CapturePoint` zones (`entities/zones/`) with a `Capturable` component and content in
  `content/zones/`, spawned by `Simulation` from the map's `capture-point` and `cathedral`
  features. `CaptureSystem` runs after `DeathSystem` with the DEC-86 rules: weighted majority
  (Legend 10, other units 1; structures, projectiles and zones never count), ties pause, rate
  grows with the margin up to `maxMargin`, enemies drain through 0 first, neutral units retake to
  neutral, unfinished captures revert to the last locking state. Tuning in
  `GameConfig.match.capturePoints` (validated, `TUNE`). `EntitySnapshot.capture`, `StateHasher`
  fields and `CaptureProgressBoundsInvariant`. Client `CapturePointView` (shared team colours,
  checkpoint count from the snapshot). The old `capture/` folder, `capturePointsFromMap` and
  `SimulationOptions.capturePoints` are gone. Merged the phase branch (#59–#61).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  825 passed (825)"; client "Tests 424 passed (424)"; "✓ built in 1.10s"; "Documentation check
  passed." After merging the phase branch again (#62, #63, #30; `spawnZones` reads
  `GameState.world`): `EXIT=0`, core "Tests 921 passed (921)", client "Tests 438 passed (438)".
- Next step: critic and ponytail (pre-PR gate) in a Claude Code session; architecture re-review.

### 2026-11-02 — Phase 2 / sprint 2.2 — fix/pr64-local (PR #64) — sholtzman + Claude Code

- What was done: fixed PR #64's review findings for its author, at the product owner's request
  (DEC-145, DEC-146). A capture zone now covers its building's floor (`map/zoneArea.ts`,
  `components/ZoneArea.ts`): the fort court for an outer point, the whole Cathedral floor; a unit
  counts when its centre is on that floor. `checkpoint-reached` fires once per side until the
  zone changes owner, only for the side the progress leans toward. Each side's weighted presence
  is published (`CaptureSnapshot.presence`) and drawn as a split bar under the progress bar; the
  HUD density numbers are an INBOX item for the HUD branch. `EntitySnapshot.area`, StateHasher
  covers the reached marks. Critic round 1 (request-changes): the fort zone now ends at the walls'
  inner faces, a step that crosses 0 announces every checkpoint it passes, and doc fixes; ponytail
  cut `ZoneArea`'s bounding box. Every new test failed under a deliberate break first (A to H).
- Checks run: `npm run check` → `exit 0` before the critic (core "Tests 937 passed (937)") and
  after critic round 2 (approve) and the ponytail cut: "All matched files use Prettier code
  style!"; core "Tests 938 passed (938)"; client "Tests 440 passed (440)"; "✓ built in 116ms";
  "Documentation check passed."
- Next step: push to `feat/capture-points-v2` (PR #64); HUD branch: density % in
  `ObjectiveTracker` (INBOX).

### 2026-11-03 — Phase 2 / sprint 2.2 — fix/pr64-local (PR #64) — sholtzman + Claude Code

- What was done: answered the PR #64 review (head `48ba952`). `Simulation` builds one
  `EntityFactory`: `ZONE_DEFINITIONS` is one more definition source, and the second zone factory
  with its shared id counter is gone (finding 2; ids and hashes unchanged). The command factory
  can now see zones, so `DevSpawnHandler` refuses a zone with the new reason `map-only` (critic
  blocker: the step threw on a missing area; the new `Simulation.capture` test failed under a
  deliberate break first). `CaptureSystem.weightsInside` has a `ponytail:` remark for its
  O(zones × units) scan (finding 7). The PR description records the pre-PR gate; the base moves
  to `phase/3-sprint-3-work`.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core
  "Tests 939 passed (939)"; client "Tests 440 passed (440)"; "✓ built in 124ms"; "Documentation
  check passed."
- Next step: Samarjit re-reviews #64. Whichever of #64 and the minion stack (#56 → #58) lands
  second resolves their conflicts (11 files, `git merge-tree`): one helper composes the units,
  zones and structures definition sources and refuses duplicate ids, and `spawnZones` runs after
  `spawnStructures` (feature id order for both is decided there).

### 2026-11-03 — Phase 2 / sprint 2.2 — fix/pr64-local (PR #64) — sholtzman + Claude Code

- What was done: merged `phase/3-sprint-3-work` (`387a5fd`, the HUD PR #68) into #64 as
  `1d9efb8`, because #64's base moves to phase 3. The conflicts were docs only; two HUD tests
  gained the new snapshot fields (`MatchBridge.test.ts`) or leave out the zone spawns
  (`createBrowserMatch.test.ts`). Then `ZoneArea.contains` and `findBuildingAt` share one
  point-in-footprint test, `isPointInAnyPolygon` (`utils/geometry.ts`), as `INBOX.md` (PR #64
  density follow-up) asks of whichever PR lands second. They share the test, not `findBuildingAt`
  itself: the fort zone is the court inside the walls (DEC-145 (a)), not a building footprint.
  The new geometry test failed under a deliberate break first (`polygons.slice(0, 1)`: 3 tests
  red, one per caller). Dated notes record this in architecture 06 §10, DEC-149 and `INBOX.md`
  HC-S6 (b), which no longer gates #64. The critic (round 5: approve) found that the HUD still
  showed every capture point as neutral: `MatchBridge` now takes each point's owner and progress
  from the zone on its feature's position, and re-sends the last array while nothing changes
  (architecture 13 status note). Its tests failed first under three breaks: the static roster
  (1 red), a new array on each publish (2 red), and a link that misses (the whole-match test red).
  Critic round 6 (approve): a point whose zone is gone shows no capture again (neutral, no
  progress), not frozen values (break: keep the last values, 1 red); each point and its position
  are one `CaptureSite`. Its better-than-design item, a feature id on the zone's snapshot, is in
  `INBOX.md` for the owner.
- Checks run: `npm run check` on `a46e8f1` → `EXIT=0`: core "Tests 1000 passed (1000)"; client
  "Tests 1744 passed (1744)"; "Documentation check passed.". On the round 6 fixes it is not yet
  green: two runs ended with 9 and 4 core simulation tests "timed out in 60000ms" while the
  machine was swapping (5.7 of 7 GB swap used), so its later steps (`build`, `docs:check`) did
  not run. The core code is unchanged since `a46e8f1`. `MatchBridge.test.ts`,
  `createBrowserMatch.test.ts` and `AssetManifest.files.test.ts` pass alone ("Tests 19 passed
  (19)"). Critic round 7 (final loop, on `60c5b09`): approve; its nits are applied. Re-run on
  `b2d33e1` (2026-11-04, machine no longer swapping): `EXIT 0`: core "Tests 1000 passed (1000)";
  client "Tests 1744 passed (1744)"; "✓ built in 315ms"; "Documentation check passed.".
- Next step: Samarjit re-reviews #64 on base `phase/3-sprint-3-work`. The owner answers the
  feature-id item. The minion stack (#56 → #58) conflicts stay for whichever lands second.

### 2026-11-04 — Phase 2 / sprint 2.2 — fix/pr64-local (PR #64) — sholtzman + Claude Code

- What was done: the minion stack (#56, #57, #58, #66) landed in `phase/3-sprint-3-work` at
  `8e058d8` while #64 waited to be pushed, so this branch merges it. Ten files conflicted. In each
  code file both sides had added lines at one place, and both are kept: the entity and view
  registries, the `DefaultSystemPipeline` comment, `SpawnContextReader` (`laneId` and `area`),
  `StateHasher` and its test (veterancy and ally damage, capture), and `defaultGameConfig.test.ts`
  (unit cap 300, DEC-137, with `capturePoints`). Doc 15 takes phase 3's `guard-within-leash` row
  and #64's `capture-progress-bounds` row; `INBOX.md` and PROGRESS keep both sides. One conflict
  git did not show: phase 3's new `StructureView.test.ts` builds an `EntitySnapshot` without
  #64's `area` and `capture` (`error TS2739`); it now gives both as `null`, as the other view
  tests do. `spawnZones` runs after `spawnStructures` and the roster; a capture point's feature has
  no structure definition, so nothing spawns twice; `MatchBridge` links only snapshots with a
  `capture`.
- Checks run: `npm run check` on the merge, run 1: `error TS2739` in
  `StructureView.test.ts` (fixed above). Run 2: `EXIT 1`: client "Tests 1745 passed (1745)";
  core "Tests 1 failed | 1106 passed (1107)". The failing test is phase 3's
  `Simulation.structures.test.ts` "holds a horde that cannot fight in front of the first enemy
  tower on its lane (18 §6.2)": one light lane-0 minion stands at x 80.5, not within 15 of x 126.
  It is not a zone effect: the Cathedral zone moved off both lanes gives the same result, and on
  `8e058d8` alone (no #64 code) one `dev-spawn` before the first wave gives it too (0, 2 or 3
  give none). Cause, from a probe of `LaneFollowMovementStrategy` and `addSeparation`: the zone
  takes one entity id, so the horde's leader is `entity-40`; that leader walks the lane's centre
  line into a light tower guard standing at its post on the same line (77.15, 20.00), and the
  guard's separation push (strength 1.2) cancels its forward pull, so the steer falls under
  `minSteer` and it never moves on. A head-on deadlock in phase 3's steering that any extra entity
  can expose; #64 is not pushed until it is fixed.
- Next step: the owner chooses where the guard deadlock is fixed (phase 3 PR or #64). Then
  `npm run check` again, the push, and Samarjit's re-review on base `phase/3-sprint-3-work`.

### 2026-11-04 — Phase 2 / sprint 2.2 — fix/pr64-local (PR #64), merge 2 — sholtzman + Claude Code

- What was done: the owner chose a separate phase 3 PR for the guard deadlock in the entry above.
  That PR, #72, landed in `phase/3-sprint-3-work` at `c9de1a9` together with #67. `4f7c302` merges
  that head into this branch. Only `PROGRESS.md` conflicted; both sides' entries are kept.
- Checks run: `npm run check` on `4f7c302`: `EXIT 0`: core "Tests 1112 passed (1112)"; client
  "Tests 1745 passed (1745)"; "✓ built in 297ms"; "Documentation check passed.". The test that
  failed in the entry above now passes.
- Next step: push to #64 with base `phase/3-sprint-3-work`, then Samarjit's re-review.

### 2026-11-07 — Phase 2 / sprint 2.2 — fix/pr64-local (PR #64), merge 3 — sholtzman + Claude Code

- Correction to the entry above: its check was green on this machine only. On CI, head `85e70d3`
  failed on both runners (run 41979789406, from Samarjit's review): "counts a Legend anywhere on
  its building floor, with map objects on as the game ships (DEC-145)" hit "Test timed out in
  60000ms" (66222 ms on ubuntu-latest, 73035 ms on windows-latest); core "Tests 1 failed | 1111
  passed (1112)".
- What was done: the cause was phase 3's `NoMapObjectOverlapInvariant`, not this PR's code:
  `WorldObjectStore.blockingAt` tested every map object's polygons for each moving unit, each tick.
  #80 fixed that at the root in `phase/3-sprint-3-work` (`ed10145`); the test, its timeout and its
  debug config are unchanged. `6729054` merges `ed10145` (#69, #71, #80) into this branch.
  Conflicts: `06-map-and-minimap.md` `last-reviewed` (kept phase 3's later date) and this file
  (both sides' entries kept).
- Checks run: `Simulation.capture.test.ts` with coverage: the map-objects test took 1026 ms
  (Samarjit measured 31.1 s at `85e70d3` on his machine; not re-measured on this machine).
  `npm run check` on `6729054`: `exit=0`: core "Tests 1134 passed (1134)"; client "Tests 1763
  passed (1763)"; "✓ built in 231ms"; "Documentation check passed.".
- Next step: push to #64; this is done only when CI is green on both runners; then Samarjit's
  re-review.

### 2026-11-08 — Phase 2 / sprint 2.2 — fix/pr64-local (PR #64), merge 4 — sholtzman + Claude Code

- What was done: Samarjit approved `54b5c93` and CI was green on both runners, but #75, #74 (match
  director) and #78 landed in `phase/3-sprint-3-work` first, so #64 no longer merged. `0e7d389`
  merges `85b6781`. Fifteen files conflicted; each code conflict was both sides adding at one place,
  and both were kept: `capturePoints` beside `timeline` and `playerTeam` in `MatchConfig` (merged
  inside phase 3's `deepFreeze` build), `CaptureSystem` after `DeathSystem` and before
  `MatchDirectorSystem`, `spawnZones` after `spawnRoster` (which phase 3 moved below the pipeline;
  entity ids keep their order), and both sides' invariants, exports, validation rules, replay
  fixture fields and tests. Docs: both sides' rows and notes kept (03 event table, FR-021 and
  FR-031, DEC-149's two dated notes, `INBOX.md`). Phase 3's timeline rules then rejected the
  capture tests' 600 s countdown (the quarter mark came first); the test config now also sets
  `plannedMatchSeconds: 3600`, with no assertion changed.
- Checks run: the merge drops no line of either side beyond the resolved conflict lines and table
  padding (diffed against both sides and the merge base). No core code listens to
  `entity-spawned`, so zones announcing after the pipeline is built changes nothing. First
  `npm run check` on the merge: exit 1, the five capture tests ("match.timeline entries must be in
  tick order"). After the test fix: `exit=0`: core "Tests 1296 passed (1296)"; client "Tests 1778
  passed (1778)"; "✓ built in 275ms"; "Documentation check passed.".
- Next step: push to #64; done only when CI is green on both runners; then Sam merges it and
  PR-38-HELPER-25 merges phase 3 into #76 and #77.

### 2026-11-07 — Phase 3 / playtest fixes: click attack, merge of feat/structure-xp (PR #78) and review blocker — fix/click-attack-units — sholtzman + Claude Code

- What was done: merged `feat/structure-xp` (PR #78, which holds #74, #75 and phase/3 at
  `ed10145`), so this PR merges after #78 with no conflicts (merge chain #75, #74, #78, #76,
  #77). #74 moved the canvas gestures from `Match` to `MatchViewControls`, so the click order of
  this branch (unit, then roof, then map object; DEC-183, DEC-150) now lives in
  `MatchViewControls.clickAt`. It replaces `toggleRoofAt` and `attackAt`; its `snapshot`
  dependency gives the units and the map objects (was `mapObjects`). The tests call
  `match.controls.clickAt`; architecture 06 §10 keeps both sides. The explorer tests find the
  spawned dummy by `definitionId`, because #74 gives the test simulation the map and the map's
  guard posts hold other dark light mobs. Review blocker (a roof click must queue no attack):
  the `MatchViewControls` roof test puts a house under the roof and asserts that no
  `attack-target` is queued; `Match.explorer.test.ts` asserts one command after the roof click.
- Red proof: break = `clickAt` also calls `attackObjectAt` after it toggles a roof. The
  `MatchViewControls` test "clickAt cuts away the roof under the point and puts it back,
  attacking nothing (DEC-150)" went red. The new `Match.explorer.test.ts` assertion stays green
  under that break, because nothing attackable is under that roof point; the unit test is the
  guard.
- Critic loop (correctness and ponytail critics on this PR's diff over `feat/structure-xp`): no
  blockers. Fixed: the merge had dropped the line "Next step: push." from the structure-xp entry
  of 2026-11-06 (restored); comments and a test label named `Match.clickAt`, now
  `MatchViewControls.clickAt`. Not changed: `findUnitAt` treats every unit as an enemy when the
  attacker is gone from the snapshot (a test pins it; core rejects the command, so no state
  changes); `UNIT_FAMILIES` stays exported (its test reads it).
- Checks run: `npm run check:quick` exit 0 and the eight affected client test files pass; the
  full `npm run check` follows on this entry.
- Next step: full check; push; PR #76 merges after #78 once Samarjit re-approves.

### 2026-11-08 — Phase 3 / playtest fixes: click attack, merge of phase/3 after PR #64 — fix/click-attack-units — sholtzman + Claude Code

- What was done: #75, #74 and #78 merged into phase/3, then #64 (capture zones, `b02ef47`).
  Merged phase/3 `b02ef47` into this branch (`a7fd3a3`). Only `PROGRESS.md` conflicted
  (append-only; both sides kept, #64's entries first; line count ours + theirs − base = merged,
  5808). #64 added `area` and `capture` to `EntitySnapshot`, so the unit fixtures in
  `findUnitAt.test.ts`, `MatchViewControls.test.ts` and `PlayerCommands.test.ts` set both to
  `null`, as #64's own fixtures do (typecheck found them; git did not flag them).
- Checks run: `npm run check` on the merge (log
  `eternalus-agent-work/pr-merge-74-79/check-76-post64.log`): exit 0, Prettier passed, core
  `Tests 1298 passed (1298)`, client `Tests 1789 passed (1789)`, docs check passed.
- Next step: push; PR #76 merges once Samarjit re-approves; then #77.

### 2026-11-05 — Phase 3 / local minimap — feat/local-minimap — sholtzman + Claude Code

- What was done: the minimap shows a local view. Commit `e1cf2f0`: the circle of 200 world units
  around the player (DEC-182: north up, ring clip, camera focus while dead, centre marker, a click
  moves the camera). Commit `b720143`: Legends and all mobs (minions, tower guards, camp mobs;
  not bosses or the dead) as team-coloured dots (DEC-187). Commit `4068bb4` (critic round 1): unit
  markers go through `EntityView.drawMinimap` and `minimapLayer`, one `MinimapProjection` serves
  the picture and the click (DEC-191), team outline per dot (white, near-black, grey, 1.5 px).
  Docs pass (this entry, docs only): architecture 04, 06 §8 and §10, 07, 08 §5 and 17 follow the
  code; 08 §5 records `MinimapProjection` in device pixels, not the `Projection` port (critic:
  acceptable), and names `MatchCamera` as the real `Projection`; reference 15 CD-18, INBOX HC-Q6
  (4) and HC-U1 note 1 have dated "superseded" notes; the phase-2 plan sprint 2.8 notes the unit
  part is met. DEC rows are on another branch; this branch does not edit the decisions log.
- Checks run: `npm run check` → `exit 0`: "All matched files use Prettier code style!"; core
  "Tests 1056 passed (1056)"; client "Tests 1746 passed (1746)"; "✓ built in 570ms";
  "Documentation check passed." This entry was added after that run (docs-only); `prettier --check`
  and `docs:check` were re-run after it.
- Next step: add the DEC rows (DEC-187 text "Legends and all mobs", the G1 outline answer),
  merge the sibling `unit-facing-chevron` work, then the pre-PR gate.

### 2026-11-06 — Phase 3 / local minimap, merge of phase/3 (PR #71) — feat/local-minimap — sholtzman + Claude Code

- What was done: merged `origin/phase/3-sprint-3-work` at `2dc2b35` (phase/3 (PR #71)). Only `docs/plan/PROGRESS.md` conflicted
  (both sides appended entries); every entry is kept, the merged-in side's first. No line of either
  side was removed (`git diff` against both parents shows only additions).
- Checks run: `npm run check` on the merge (log
  `eternalus-agent-work/playtest-2026-11-04/merge-2026-11-06/local-minimap.check.log`): EXIT=0, core
  1079 passed, client 1764 passed, docs check passed.
- Next step: push.

### 2026-11-07 — Phase 3 / playtest fixes: local minimap, review blocker and merge of fix/click-attack-units (PR #76) — feat/local-minimap — sholtzman + Claude Code

- What was done: review blocker (DEC-187 (C), "a dot sits at the snapshot position"):
  `EntityLayer.drawMinimap` drew the interpolated position; it now draws at `entity.transform`.
  Then merged `fix/click-attack-units` (PR #76, which holds #78, #74, #75 and phase/3 at
  `ed10145`), so this PR merges after #76 with no conflicts (merge chain #75, #74, #78, #76,
  #77). #74 moved the minimap click from `Match` to `MatchViewControls`: the tests call
  `match.controls.lookAtMinimapPoint`, and architecture 06 and 08 name
  `MatchViewControls.lookAtMinimapPoint`. `MiniMapView` takes the centre (DEC-182), so the
  `MatchViewControls` test passes the camera's focus; the DEC-187 minimap test builds its
  snapshot with `Snapshot.match` (#74 replaced `Snapshot.phase`). `INBOX.md` keeps both notes on
  HC-Q6 (4), #75's (2026-11-04) first.
- Red proof: the `EntityLayer` minimap test was changed first to expect the snapshot positions 4
  and 20 at an `alpha` between 0 and 1; it failed (received the interpolated 2 and 15), then
  passed with the fix.
- Critic loop (correctness and ponytail critics on this PR's diff over `fix/click-attack-units`,
  two rounds; round 2 passed): `drawMinimap` skips an entity with no transform instead of falling
  back to the interpolated position (`show()` already drops such entities); the TUNE notes of the
  marker sizes and the outline width and colours cite the owner's acceptance (DEC-187 (C) and its
  second round); doc 06 names `MatchViewControls.lookAtMinimapPoint`. Not changed: the centre
  marker's size stays provisional (no DEC row accepts it).
- Checks run: `npm run check` at `3d0a4b2` (log
  `eternalus-agent-work/pr-merge-74-79/check-77-final.log`): exit 0, Prettier passed, core
  `Tests 1245 passed (1245)`, client `Tests 1790 passed (1790)`, docs check passed. The head of
  #76 (`f49ee99`, log `check-76-final.log`): exit 0, core `Tests 1245 passed (1245)`, client
  `Tests 1780 passed (1780)`.
- Next step: push; PR #77 merges after #76 once Samarjit re-approves; then #79 retargets.

### 2026-11-08 — Phase 3 / playtest fixes: local minimap, merge of fix/click-attack-units after PR #64 — feat/local-minimap — sholtzman + Claude Code

- What was done: #75, #74, #78 and then #64 (capture zones) merged into phase/3; #76 merged
  phase/3 `b02ef47`. Merged #76 `f2574a9` into this branch (`2954cd1`). #64 conflicts:
  `entityViews.constants.ts` (both added constants at the end; #64's capture constants first,
  then the minimap marker constants), `StructureView.test.ts` (this branch's gate fixture plus
  #64's `area` and `capture`), architecture 07 §12 (#64's capture-point glyph wording, then
  this branch's sentence that `MapView.drawMinimap` draws feature glyphs and only Legends and
  mobs have entity markers), `PROGRESS.md` (append-only). Typecheck found one more fixture: the
  DEC-187 minion in `MiniMapView.test.ts` sets `area` and `capture` to `null`. Line counts
  (ours + theirs − base = merged): `PROGRESS.md` 5879, `entityViews.constants.ts` 80.
- Checks run: `npm run check` on the merge (log
  `eternalus-agent-work/pr-merge-74-79/check-77-post64.log`): exit 0, Prettier passed, core
  `Tests 1298 passed (1298)`, client `Tests 1799 passed (1799)`, docs check passed.
- Next step: push; tell eternalus-121 the new head (#79 merges it); PR #77 merges after #76
  once Samarjit re-approves.

### 2026-11-04 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / match-director merge — feat/match-scoring — sholtzman + Claude Code

- What: merged `feat/match-director` (`12e030b`, which holds phase/3 `387a5fd`) into
  `feat/match-scoring` (`49c7117`).
  - Conflicts: `StateHasher` puts the scoring block right after the match fields, then phase/3's
    hordes, enraged, ai and world-object blocks (each only when non-empty, so the golden hashes
    hold); `GameState` keeps both imports; `GameState.test.ts` takes phase/3's five-argument
    constructor; `Simulation.ts` drops the unused `FOLLOW_LEADER_PROFILE` import; architecture 02
    and 03 tables take both sides; this file keeps every entry of both branches.
  - Merge fallout: `Simulation.scoring.test.ts` uses phase/3's
    `recordReplay(setup, plan, createTarget)` form.
  - Roster order (behaviour fix in the merge): phase/3 spawned the roster before the director, and
    `Scoring` gives a row only to a Legend whose `entity-spawned` it hears (12 §5). The roster bots
    had no scoreboard rows. `Simulation.spawnRoster` now runs after the director is built, just
    before `seatHuman`. Only `Scoring` and `seatHuman` listen to `entity-spawned`, and nothing
    spawns in between, so entity ids do not change.
- Fail-first break: the new test "gives a roster bot a bot row in the fold of tick 0" is red with
  `spawnRoster` back before the director (`expected [] to deeply equal [ ObjectContaining{…} ]`);
  file restored and compared with the backup (`cmp`).
- Checks run: `npm run check` → `EXIT=0` (`ms-check-2026-11-04.log` in
  `eternalus-agent-work/game-loop-plan/`): core "Tests 1125 passed (1125)", statements 99.1 %;
  client "Tests 1740 passed (1740)", statements 96.82 %; "✓ built in 484ms"; "Documentation check
  passed." The first run failed because this worktree had no `happy-dom` (5 client files did not
  start); `npm ci` from the unchanged lock fixed it.
- Next step: commit and push the merge, then merge `feat/match-scoring` into `feat/results-flow`
  the same way.

### 2026-11-05 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / match-director merge (the human slot, `MatchRecord`) — feat/match-scoring — sholtzman + Claude Code

- What: merged `feat/match-director` (`6d049e7`, PR #74's head with DEC-210) into
  `feat/match-scoring` (`ad2e8e7`), now rather than after #74's review (owner's call, 2026-11-05).
  - Conflicts: `MatchState` keeps #74's read-only fields and adds `scoring`; `MatchRecord` holds
    `scoring` (it starts as `createEmptyScoringState()`, which `GameState` held before);
    `MatchDirector.end()` copies the rows and team totals and hashes with `this.options.hasher`;
    `Simulation.ts` takes #74's `spawnRoster(…, logger)` (the human is a roster slot, DEC-173),
    still after the director, so `Scoring` hears every Legend's `entity-spawned`; the director and
    `GameState` tests take both sides' cases (scoring double, injected hasher and terminal phases);
    architecture 02 and 03 tables take both sides (padding-normalised `git merge-file`, Prettier,
    word diff against each side); this file keeps #74's entries, then this branch's.
  - Merge fallout: the scoring tests write through `state.match.seatHuman` and
    `state.match.endMatch`; `MatchRecord.test.ts` and `defaultMatchPhases.test.ts` read `scoring`;
    `Simulation.scoring.test.ts` puts the human in a roster slot on the two-lane map (at the light
    Stronghold) instead of `config.match.seat`, and checks that the training dummy is gone instead
    of "only a Legend is left" (the map's guard posts add mobs); architecture 12's status note
    says "the roster" instead of "the seat".
  - The human's row is still `human` although `spawnSlot` emits `entity-spawned` before
    `seatHuman`: `Scoring` reads `humanLegendId` at the fold, not at the event.
- Fail-first breaks (`Simulation.scoring.test.ts`, restored after each): `Scoring` marking every
  row `bot` turns "gives the human's Legend a human row" red; no attack command turns "counts a
  minion killed through full steps" red.
- Checks run: `npm run check` → `EXIT=0` (`ms-merge-check-2026-11-05.log` in
  `eternalus-agent-work/game-loop-plan/`): core "Tests 1269 passed (1269)", statements 99.13 %;
  client "Tests 1769 passed (1769)", statements 96.93 %; "✓ built in 384ms"; "Documentation check
  passed." (125 files).
- Next step: commit and push, then merge `feat/match-scoring` into `feat/results-flow`.

### 2026-11-08 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / phase/3 merge (#74, #75, #78, #80) — feat/match-scoring — sholtzman + Claude Code

- What: merged `origin/phase/3-sprint-3-work` at `85b6781` (PR #74 merged as `c3e178d`, after
  #80 and #75; #78 on top) into `feat/match-scoring`, so this branch's PR is based on the phase
  branch. One conflict, in this file: both sides added entries at the end. Kept every entry,
  phase/3's first, then this branch's, so the branch's diff to phase/3 only adds lines here.
  - #78 adds `cause` to `xp-gained`; `Scoring` reads `entity-spawned`, `damage-applied` and
    `entity-died` only, so no scoring code changes.
- Checks run: `npm run check` → `EXIT=0` (`ms-merge-85b6781-check-2026-11-08.log` in
  `eternalus-agent-work/game-loop-plan/`): Prettier passed; core "Tests 1281 passed (1281)",
  statements 99.13 %; client "Tests 1769 passed (1769)", statements 96.93 %; "✓ built in 282ms";
  "Documentation check passed." (127 files).
- Next step: merge `feat/match-scoring` into `feat/results-flow`; then the pre-PR gate for both.

### 2026-11-08 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / GL-4 critic round 2: the `ScoreBook` and structure points (DEC-211, DEC-212) — feat/match-scoring — sholtzman + Claude Code

- What: built the owner's calls on the GL-4 pre-PR critic, round 2
  (`eternalus-agent-work/game-loop-plan/arch-review-gl4-round-2.md`).
  - DEC-211 (1), finding 1, BTD-1: `state/ScoreBook.ts` holds the scoring data (plain data, so
    `StateHasher` hashes it) and is its only writer: `addRow`, `award`, `awardTeam`, `recordHit`,
    `takeAssists`. `MatchRecord` holds it as `scoreBook`; `MatchState.scoring` (and
    `MatchRecord.scoring`) is its read-only view: `LegendStats`, `TeamStats`, `RecentHit` and
    `ScoringState` are read-only at every depth, so `state.match.scoring.teams.light.score = 99`
    no longer compiles. `Scoring` keeps the rules and writes through `state.match.scoreBook` in its
    fold. The tests that wrote scoring directly (`MatchDirector.test.ts`, `StateHasher.test.ts`,
    `Simulation.scoring.test.ts`) use the writers; each keeps its assertions and adds one.
  - DEC-211 (3), BTD-2: the target's or victim's family picks its rule from a registry in `Scoring`
    (one for hits: Legend, structure; one for deaths: Legend, mob); no entry scores nothing.
  - DEC-211 (4), BTD-3: `match/ScoreKeeper.types.ts` (`fold`), which `Scoring` implements;
    `MatchDirectorOptions.scoring` takes it.
  - DEC-212, finding 2: `Scoring` listens to `structure-destroyed`; a fallen structure of a
    playable team gives the opposing team `SCORING_WEIGHTS.structureDestroyed` (5, `TUNE`,
    DEC-131) as team-only points and `structuresDestroyed + 1` (new `TeamStats` counter); a neutral
    camp gives nothing. The `ponytail:` note in `content/match/scoring.ts` now covers capture and
    hold points only and cites PR #64 (merged into the phase branch at `b02ef47`, not yet in this
    branch). No plan task or `INBOX.md` item schedules capture and hold scoring.
  - Findings 4 to 6: the assist window uses `TickRate.toTicks`; `ScoreBook.addRow` keeps one row
    per Legend (a second `entity-spawned` adds none); `minionKills` names "enemy team mobs (Host
    units and tower guards)" and a guard-kill test covers it (DEC-211 (2)).
  - Docs: architecture 03 §2 (`MatchRecord` sketch) and §4 (`structure-destroyed` listeners), 12
    §4 (`MatchState` sketch), §5 (rules and data apart, registry, `ScoreKeeper`, structure row,
    guards, FR-007 weights as design), §12, §13 (status; "wait for the owner's values" dropped), 02
    (state listings), 17 R3 (a scoring rule is a registry entry plus a `ScoreBook` writer),
    `packages/core/AGENTS.md` (`state/` row).
  - Hash: no fixture changed. A non-empty scoring now serialises `structuresDestroyed` per team;
    no recorded replay or checkpoint holds a non-empty scoring (the golden replay runs no
    director), and the empty check uses the new empty state, so an untouched match hashes as
    before.
- Fail-first breaks: 21, all red then restored (`cmp` equal), listed with test names and red
  messages in `eternalus-agent-work/game-loop-plan/gl4-r2-breaks.md` (b1 to b16 vitest, b17 to b21
  `tsc -b` "Unused '@ts-expect-error' directive" for the read-only view).
- Checks run: `npm run check` → `EXIT=0` (`gl4-r2-check-2026-11-08.log` in
  `eternalus-agent-work/game-loop-plan/`): "All matched files use Prettier code style!"; core "Tests
  1304 passed (1304)", statements 99.14 %; client "Tests 1769 passed (1769)", statements 96.93 %;
  "✓ built in 251ms"; "Documentation check passed." (127 files).
- Next step: the GL-4 critic re-checks this diff; `feat/results-flow` takes it with its next merge
  (its `MatchResult` literals need `structuresDestroyed: 0` per team).

### 2026-11-08 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / phase/3 merge (#64), DEC-214, GL-4 critic round 3, DEC-221 — feat/match-scoring — sholtzman + Claude Code

- What: the work on this branch after the round-2 entry above.
  - `58e66bc`: merged `origin/phase/3-sprint-3-work` at `b02ef47` (PR #64, capture points) into
    this branch. Architecture 03 §4 keeps both new event rows (`structure-destroyed` from this
    branch, `checkpoint-reached` from #64). Check: `EXIT=0`, core "Tests 1357 passed (1357)",
    client "Tests 1778 passed (1778)", "Documentation check passed."
    (`ms-merge-b02ef47-check-2026-11-08.log` in `eternalus-agent-work/game-loop-plan/`).
  - `0009ed9`: DEC-214 (owner, 2026-11-08). Capture and hold points (DEC-131) are plan task GL-15,
    built on `feat/capture-scoring`, stacked on this branch, with its PR opened after this one's
    (game-loop plan §7, `INBOX.md` GL-15). This supersedes the round-2 entry's "No plan task or
    `INBOX.md` item schedules capture and hold scoring". The `ponytail:` note in
    `content/match/scoring.ts` and the 12 §13 status note name GL-15.
  - Pre-PR critic round 3, the last (`critic-log.md`): architecture approve (0 blocker, 0 major,
    3 minor, 3 nit, 3 better-than-design; `arch-review-gl4-round-3.md`); ponytail PASS
    (`ponytail-gl4-prepr-round-3.md`).
  - `00bb99e`: minor 2 (the GL-15 plan row has all seven cells), nit 5 (`ScoreKeeper.types.ts`
    in 12 §1 and 02 §2; `state/ScoringState.types.ts` in 12 `paths:`), nit 6 (`Readonly<>`
    dropped in `MatchResult.types.ts`; the `PLAYABLE_TEAMS` map is rejected: the `{ light, dark }`
    literal is compile-checked against `Record<PlayableTeam, …>`).
  - This commit: DEC-221 (owner, 2026-11-08). Minor 1: `match/` may import the types of
    `entities/` (02 §2, 12 §1, `packages/core/AGENTS.md`). Nit 4: a new counter needs a field and
    its counter name, and a `ScoreBook` writer only if its rule is not a plain award (12 §5, 17
    R3, `scoring.ts`). The critic's BTD-1 to BTD-3 go to GL-15. The GL-5 critic's B1 is plan task
    GL-16 and an `INBOX.md` item. Minor 3 is this entry.
- Checks run: `npm run check` → `EXIT=0` (`ms-dec221-check-2026-11-08.log` in
  `eternalus-agent-work/game-loop-plan/`): core "Tests 1357 passed (1357)", client "Tests 1778
  passed (1778)", "Documentation check passed." (127 files).
- Next step: merge this branch into `feat/results-flow` (GL-5 B2, B3 and its minors) and into
  `feat/capture-scoring` (GL-4 BTD-1 to BTD-3, then the GL-15 pre-PR gate); push; open the PRs.

### 2026-11-08 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / phase/3 merge (#76, #77) — feat/match-scoring — sholtzman + Claude Code

- What: merged `origin/phase/3-sprint-3-work` at `120653b` (PR #76 click attacks, PR #77 local
  minimap) into this branch (`750fb64`), so its PR has no conflict with the phase branch. Two
  conflicts: this file (both sides only inserted; phase/3's entries first, then this branch's)
  and the `last-reviewed` line of 17 (kept 2026-11-08). No scoring code changed.
- Checks run: `npm run check` → `EXIT=0` (`ms-merge-120653b-check-2026-11-08.log` in
  `eternalus-agent-work/game-loop-plan/`): core "Tests 1359 passed (1359)", statements 99.15 %;
  client "Tests 1799 passed (1799)", statements 97.03 %; "Documentation check passed."
- Next step: push; open the GL-4 PR into the phase branch; merge this branch into
  `feat/results-flow` and `feat/capture-scoring`.

### 2026-11-08 — Phase 3 / INBOX: PR #69 critic item (Stronghold feature type) — docs/inbox-stronghold-feature-type — sholtzman + Claude Code

- What was done: Sam chose to record the PR #69 round-3 critic's optional better-than-design item
  in `INBOX.md` ("Decisions needed from Sam"): a Stronghold feature type with `wallBoundary`
  required, so the type checker catches what `strongholdRing` checks at run time today. No code
  changed.
- Checks run: `npm run check` (log `eternalus-agent-work/pr-merge-74-79/check-inbox.log`): exit
  0, Prettier passed, core `Tests 1298 passed (1298)`, client `Tests 1799 passed (1799)`, docs
  check passed. Critic (`architecture-reviewer`): approve, 3 nits fixed. Ponytail: 1 cut taken.
- Next step: Sam approves the item for a follow-up PR, or drops it.

### 2026-11-09 — Phase 3 / HUD: live level and XP — feat/hud-level-xp — sholtzman + Claude Code

- What was done: the HUD shows the human Legend's live level and XP. Core: `EntitySnapshot`
  has a `progression` group (`level`, the XP inside that level, `xpToNext`) directly after
  `health`, `null` for every entity without `Progression`. `Progression.levelProgress(curve)`
  gives the XP inside the level and `xpToNext` (`null` at the curve's cap).
  `GameState.snapshot(curves)` takes the level-curve catalogue as a required parameter, and
  `Simulation` passes the same catalogue `ProgressionSystem` gets. Client: `MatchBridge.playerOf`
  fills `level`, `xp` and `xpToNext` from the snapshot; aether stays `null`. The design's
  `Snapshot.player` (05 §15) is not built yet; this is the interim 05 §18 names (the bridge
  projects the HUD player from the player's `EntitySnapshot`). The `damage-applied` and
  `entity-died` payloads are unchanged. Status notes: 03 §12, 05 §18, 13 §10, INBOX HC-F6.
- Owner answers (DEC-224, 2026-11-09, question dialog): the per-Legend `progression` group and
  the nullable `xpToNext` become the design (the critic's better-than-design item; 03 §5 and
  05 §15 sketches updated), and the HUD's XP ring is full at the level cap
  (`hudSlice.selectXpFraction`).
- Critic (architecture-reviewer, base `120653b2`): PASS WITH NOTES, no blockers. Fixed: 13 §10
  HUD data, the `MatchBridge.playerOf` TSDoc, `LevelProgress` in `Progression.types.ts` (the
  snapshot type reuses it), this entry's checks, `xpToNext` is `null` from `curve.cap` (not
  from the step list), tests for a player without progression, the cap in the bridge and a
  Leveller in the structured-clone test. Not changed: `GameState.ts` is over ~300 lines (315 at
  the base, 335 now); splitting it would cross open PRs #79 and #86, which edit it. Round 2
  (the delta after round 1 and DEC-224): PASS WITH NOTES, no blockers; fixed the `LevelBadge`
  TSDoc (full ring at the cap, DEC-224) and early returns in `selectXpFraction`; not changed: a
  badge-level cap test (the slice test and the badge's full-ring test cover it) and an assert on
  short curve tables (`loadLevelCurves` rejects them). Ponytail: nothing to cut.
- Red proof (logs in `eternalus-agent-work/hud-level-xp/`): `red-before.log`, the five new or
  changed tests failed before the change (`levelProgress is not a function`, `progression`
  undefined three times, the HUD's level and XP `null`); `red-critic-r1.log`, the cap test
  (`xpToNext: 150` at the cap); `red-critic-r1-b.log`, deliberate breaks (the bridge maps a
  missing `xpToNext` to 0; the snapshot group holds a function) turn the bridge and
  structured-clone tests red; `red-dec224.log`, the full-ring test (`expected null to be 1`).
- Checks run: `npm run check` on the final code (log
  `eternalus-agent-work/hud-level-xp/check-5.log`): exit 0, Prettier passed, core
  `Tests 1302 passed (1302)`, client `Tests 1800 passed (1800)`, docs check passed.
- Next step: push and open the PR into phase/3; whichever of this PR and the aether PR lands
  second resolves the adjacent `Snapshot.types.ts` lines.

### 2026-11-09 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / phase/3 merge (#88) — feat/match-scoring — sholtzman + Claude Code

- What: merged `phase/3-sprint-3-work` (`089617e6`, PR #88 HUD level and XP) into GL-4 (`7ddc20e0`),
  so PR #93 merges again. Conflicts: 03 and the decisions log `last-reviewed` (took 2026-11-09);
  the decisions log batches (DEC-224's batch first, newest first, then GL-4's); this file (both, in
  date order). No code conflict.
- Checks run: `npm run check` on `7ddc20e0` → `EXIT=0` (`gl4-merge-88-check-2026-11-09.log` in
  `eternalus-agent-work/game-loop-plan/`): Prettier "All matched files use Prettier code style!";
  core "Tests 1363 passed (1363)", statements 99.15 %; client "Tests 1800 passed (1800)",
  statements 97.04 %; "Documentation check passed."
- Next step: merge this head into GL-5 (`feat/results-flow`) and GL-15 (`feat/capture-scoring`),
  then GL-5 into GL-16 (`refactor/map-feature-link`); push all four.

### 2026-11-09 — Phase 3 / merge: #88 then #87 into phase/3 — docs/inbox-stronghold-feature-type — sholtzman + Claude Code

- What was done: a teammate approved #87 and #88 (CI green on both). Both append a PROGRESS entry,
  so they conflict in either order. #88 merges first, with a merge commit, because
  `feat/hud-aether-bar` stacks on its head `27319382`. This branch merged `27319382` and kept
  both entries in date order; `INBOX.md` merged cleanly.
- Checks run: Prettier on `PROGRESS.md` and `INBOX.md` passed; `npm run docs:check` passed; the
  pre-commit `check:quick` passed. CI runs the full `npm run check` on the pushed head.
- Next step: Sam's script merges #88, pushes this branch, waits for CI, then merges #87.

### 2026-11-09 — Game loop plan (Phase 3 sprint 3.5, pulled forward) / phase/3 merge (#87) — feat/match-scoring — sholtzman + Claude Code

- What: merged `phase/3-sprint-3-work` (`86b4fc04`, PR #87: one `INBOX.md` item and its PROGRESS
  entries) into GL-4 (`ec13abfc`), so PR #93 merges again. Conflict: this file (both, in date
  order). Docs only: `git diff --stat 7ddc20e0 ec13abfc` lists only `INBOX.md` and this file.
- Checks run: `npx prettier --check INBOX.md docs/plan/PROGRESS.md` → "All matched files use
  Prettier code style!"; `npm run docs:check` → "Documentation check passed." The full check of
  `7ddc20e0` (the entry above) holds for the code.
- Next step: merge this head into GL-5 and GL-15, then GL-5 into GL-16; push all four.
