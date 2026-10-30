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

### 2026-10-30 — Phase 2 / sprint 2.2 — feat/minion-m5a-modifiers — SamarjitBhogal + Claude Code

- What was done: merged the updated M2b (#44, now with M4's flow fields joined in) into PR #45.
  Conflicts: `DefaultSystemPipeline` imports (both kept), doc 18's status note (M4 and M5a
  sentences both kept) and `PROGRESS.md` (both sides' entries in date order).
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests
  727 passed (727)"; client "Tests 415 passed (415)"; "✓ built in 157ms"; "Documentation check
  passed."
- Next step: review and merge after M2b.

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
