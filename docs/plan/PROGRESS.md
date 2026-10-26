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

### 2026-10-17 — Phase 2 sprint 2 / minion docs, DEC renumber — docs/minion-system-design — SamarjitBhogal + Claude Code

- What was done: the owner rulings from the PR #33 review, logged earlier as DEC-38 to DEC-42,
  are renumbered DEC-43 to DEC-47. DEC-38 (Legend skins), DEC-39 (the Phase 1 waiver) and DEC-40
  to DEC-42 (PR #36's status rulings) were already taken. Changed in the decisions log, doc 18
  (MS-23 to MS-25) and the Phase 3 plan; the earlier entries in this log keep the old numbers as
  written.
- Checks run: `npm run check` → `EXIT=0`: "All matched files use Prettier code style!"; core "Tests 466 passed (466)"; client "Tests 416 passed (416)"; "Documentation check passed."
- Next step: merge into `feat/minion-m1-marching`.

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
