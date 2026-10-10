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

_Review in progress._

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

_None yet._

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
