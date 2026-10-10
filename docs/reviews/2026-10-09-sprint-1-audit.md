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

_Review in progress._

## PR #23 — escort minions prototype (`feat/minion-follow-prototype`)

**Review:** an independent critic reviewed it after the merge (`8fe091f`), against the docs at `8fe091f^1`. In a fresh clone, `npm run check` gave `EXIT=0` (core 459/459, client 292/292).

**What conforms:**

- AI acts only through `Command`s applied on the next tick (rule 9), and replays do not double them.
- `ai/` imports stay inside its allowed list, and there is no `switch (kind)`.
- The new core code is deterministic.
- No guardrail was weakened.
- The prototype code carries 18 `PROTOTYPE(PROTO-01)` markers.

**Verdict:** request changes.

- [ ] **A23-1** (blocker before phase 1 → `main`) `INBOX.md` PROTO-01 is still open, and the decisions log has no entry for it. The owner's ruling is needed on three things: escort minions instead of lanes, speed 5.4 against `balancing.md`'s 3.5 (and mass 0.5), and Phase 3 code living in phase 1. Record the ruling, or gate or remove the escort before the phase merges.
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
