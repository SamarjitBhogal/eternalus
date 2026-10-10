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
