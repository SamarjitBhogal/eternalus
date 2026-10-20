---
title: 'PR: feat/session-shell-home'
description: The pull-request description for feat/session-shell-home into phase/1-simulation-kernel-and-world (session D) - the bridge contract names E/F/G depend on, the SessionController phase machine, App routing, the home screen and theme tokens, the deviations from the design and the pre-PR gate results; read this when reviewing that PR or building on it.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-06
tags: [changelog, pull-request, ui, bridge, session, sprint-1]
related:
  [
    'docs/agents/prompts/2026-10-03-ultracode-sessions.md',
    'docs/architecture/13-game-interface.md',
    'docs/reference/game-design/14-interface-and-screen-flow.md',
  ]
---

# PR: feat/session-shell-home

**Purpose.** The description for the pull request from `feat/session-shell-home` into
`phase/1-simulation-kernel-and-world`. Reviewer: a UI-minded teammate (DEC-05: the feature owner
picks). Title:

`feat(client): session shell, bridge store and home screen (sprint 1, session D)`

---

## Summary

Session D of the Sprint 1 prompts: the client's session shell. It adds the bridge (event map,
typed bus, the seven slices, bus → store wiring) and `SessionController`, a State pattern over
the eight `SessionPhase`s with 60 s / 10 s countdowns on an injected `SessionClock`. It also adds
`App.tsx` routing (phase → screen, menu route → screen), the home screen with its menu shells,
and the §2.4 theme tokens. `npm run dev` now opens on the home menu. Start match runs loading →
character select → pre-launch → match loading → match, on placeholder screens until E and G land.

## Why

E, F, G and H build on these names (contract §2.3). The owner's screen flow (reference 14) needs
a session phase machine with session-time countdowns, team assignment and data-built rosters
before the simulation exists.

## Names other sessions depend on

| Area       | Names                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Store      | `store.ts`: `store`, `createAppStore(preloaded?)`, `RootState`, `AppDispatch`; `combineSlices(sessionSlice, matchSetupSlice, loadingSlice, settingsSlice, hudSlice, matchSlice, contentSlice)`; `hooks.ts`: `useAppSelector` (no `useAppDispatch`, see INBOX)                                                                                                                                                                                                                                                                                                                            |
| Bus        | `TypedEventBus<BridgeEventMap>` (`on` → unsubscribe, `emit`, `listenerCount`); `eventBus.ts`: `eventBus`, `emitIntent(intent)` (the only way the UI talks to the game); `connectBusToStore(bus, dispatch)`                                                                                                                                                                                                                                                                                                                                                                               |
| Events     | `ui-intent`, `session-phase {phase, reason}`, `loading-progress`, `match-clock {tick, seconds}`, `hud-state` (`HudSnapshot`), `announcement` (§2.3), plus `menu-route {route}`, `overlay {overlay}`, `content-catalogue` (`DisplayCatalogue`), `match-setup` (`MatchSetupDraft \| null`), `class-selection` (`ClassSelection`), `countdown {kind: 'select' \| 'reveal', remainingMs}`, `settings` (`SettingsSliceState`)                                                                                                                                                                 |
| `UiIntent` | `start-match`, `navigate {route}`, `select-class {classId, specId?}`, `confirm-selection`, `cancel-match`, `leave-match`, `open-overlay {overlay}`, `close-overlay`, `update-binding {action, chord, onConflict}`, `reset-bindings {action \| null}`, `update-settings {patch}`                                                                                                                                                                                                                                                                                                          |
| Types      | `SESSION_PHASES` / `SessionPhase`, `MenuRoute` (`'home' \| 'loadouts' \| 'profile' \| 'settings' \| 'about'`), `Overlay`, `RosterEntry` (+ `isRover`), `LegendClassCard`, `BackgroundSet` / `BackgroundLayer`, `AssetGroup`, `LoadingProgress`; `domain.types.ts`: `PlayableTeam`, `Team`, `LegendClassId` (mirrors until core exports them); `Binding.types.ts`: `InputAction`, plus `InputChord`/`Binding` from F's brief                                                                                                                                                              |
| Slices     | `sessionSlice` {phase, reason, menuRoute, overlay}; selectors `selectSessionPhase`, `selectSessionReason`, `selectMenuRoute`. `matchSetupSlice` reducers `setTeam`, `setRosters`, `select`, `setCountdown`, `setReveal`, `reset` (E owns the body and selectors). `loadingSlice.progressChanged`. `settingsSlice.settingsChanged`, `SettingsPatch` (F). `hudSlice.hudStateChanged`, `announced` (G). `matchSlice.clockChanged`, `selectMatchResult` (H). `contentSlice.catalogueLoaded`; selectors `selectLegendClasses`, `selectProfileDisplayName`, `selectBackgroundSet(state, team)` |
| Game       | `SessionController({bus, clock, states, catalogue, matchConfig, playerName, seedSource, createRng, themeRoot})`, `start()`, `destroy()`, `phase`; `SessionState {phase, enter?, exit?, handleIntent?}`; `createDefaultSessionStates()`; `SessionClock` + `PerformanceSessionClock` / `FakeSessionClock` + `describeSessionClock`; `CatalogueSource`, `placeholderCatalogue`                                                                                                                                                                                                              |
| UI         | `App` (`viewport` prop); `ScreenProps {viewport?}` (`ui/screens/screen.types.ts`); `PlaceholderScreen`; `Button`, `MenuList`, `Panel`, `ThemedBackground {set}`, `ScreenFrame {team?}`; `ui/strings.ts` `STRINGS`; tests: `ui/testStore.tsx` `renderWithStore`, `sessionAt`, `TEST_CONTENT`, `buttonNames`                                                                                                                                                                                                                                                                               |

**Shared files to append to, not own:** `ui/strings.ts`, `ui/testStore.tsx` and
`ui/screens/screen.types.ts` are outside §2.6's list for D. E, F and G will add labels or import
helpers from them, so expect small append-only merges.

**Replace one line each in `App.tsx`:** E: `loading`, `character-select`, `pre-launch`,
`match-loading` (and optionally `boot`); G: `match: MatchScreen`. After F merges, whoever merges
second adds `settings: SettingsScreen` to `MENU_SCREENS` and F's persistence /
`SettingsController` lines in `main.tsx`; F recorded both in `INBOX.md` on its branch.

## Behaviour

- `boot` → `menu` immediately: content projected into `contentSlice`, a `ready` `boot` load.
- **Start match** draws a seed and a random team, builds 10 + 10 rosters (the player is their
  team's Rover, the enemy Rover is a bot; bots take the classes in catalogue order), sets
  `data-team` on `<html>` and enters `loading`. A placeholder load (1.5 s, `PLACEHOLDER_LOAD_MS`,
  `// TUNE`) goes to `character-select`.
- `character-select`: the countdown publishes once per second. Confirm, or the countdown ending
  with a class selected → `pre-launch`; ending with none → `menu`, reason `select-timeout`
  (the home screen shows "Match cancelled: no character selected."); `cancel-match` → `menu`,
  reason `cancelled`.
- `pre-launch`: 10 s → `match-loading` → placeholder load → `match`. `open-overlay` /
  `close-overlay` set `sessionSlice.overlay`; `leave-match` → `menu` (setup and theme cleared).
- `results` → `menu` (with the route) or a rematch with the **same** setup. A published setup
  always resets `matchSetupSlice` first.
- Any phase pair outside the 13 rows of architecture 13 §2 throws `IllegalSessionTransition`.

## How it was tested

- 38 client test files, 188 tests: every one of the 64 phase pairs (legal moves and throwing
  illegal ones), the full flow on `FakeSessionClock` through a real store, select-timeout with
  and without a selection, cancel from loading and character select (old timers never fire),
  rematch, destroy (0 listeners), roster sizes, Rover and team mirroring, seeded determinism,
  the `SessionClock` contract on both adapters (the performance one under Vitest fake timers),
  the bus, every slice reducer through `connectBusToStore`, and server renders of every screen
  (button names, banner, verdicts, App for every phase and route).
- Bug found by a test: consecutive seeds all drew Light from the plain LCG. The seed is now
  mixed first (murmur3 fmix32), with a regression test.
- `npm run dev` in headless Chrome: the home screen renders with the options stacked left over
  the themed background and "Start match" focused. Clicking through the flow was not checked in
  a browser; the flow tests above cover it.

## Deviations from the design (the critic marked them acceptable)

- **Additions to the §2.3 surface:** the extra events above, `RosterEntry.isRover` (the brief's
  "player isRover"), `sessionSlice.menuRoute` / `overlay` (architecture 13 §5), and
  `contentSlice` `backgroundSets` / `profileDisplayName` ("Chronicle" from content, §2.5 sets).
- **Changed at session F's request:** `update-binding` gains `onConflict`, `reset-bindings` takes
  an action or `null`, and `update-settings` plus the `settings` event are new.
  `Binding.types.ts` also holds `InputChord`/`Binding`, copied from F's brief, because the §2.3
  intents need them; F's body replaces them.
- `MenuRoute` uses `'home'` (§2.3), not architecture 13's `'main'`; `start-match` carries no
  setup (§2.3).
- `SessionState.enter/exit` are synchronous; asynchronous work (loads, timers) ends by calling
  `context.transition` from its callback. There are no persistence, resources or logger
  dependencies yet (S2 / F / H).
- Interim stand-ins with `TODO(sam)`: `LcgRng` (core `SeededRandom`), `PLACEHOLDER_MATCH_CONFIG`
  (core `GameConfig.match`), `PLACEHOLDER_PLAYER_NAME` (profile), `domain.types.ts` (core types),
  `placeholderCatalogue` (core `LEGEND_CLASSES`), and `ui/strings.ts` verdict lines (core
  narrative content).
- Built at **Start match**, not in `character-select`: the team and rosters. The loading screen
  needs the team theme, and reference 14 §5 builds rosters "when the match setup is created".
  Architecture 13 §2's `character-select` row contradicts its own `menu` row (INBOX).
- The phase-1 checkboxes for the bridge bus and the coverage ratchet stay unticked with a note:
  this branch delivers only part of each.
- Not every source file has a sibling test: the state classes are tested through
  `SessionController.test.ts` (the architecture's own plan for the table). The F/G/H/E slice
  bodies are left for their owners' tests, so their test files don't collide.

## Better than the design (needs sign-off; see INBOX)

- No `useAppDispatch`: the UI never writes the store, and knip fails an unused export. Leaving it
  out enforces architecture 13 §5's single path. On sign-off, update `apps/client/AGENTS.md`
  "Adding code" and architecture 13 §5; otherwise add the hook back with its first caller.

## Notes for the reviewer

- **Merging F after this:** `git merge-tree` shows add/add conflicts with
  `feat/settings-keybindings` in `bridge/slices/settingsSlice.ts` and `bridge/Binding.types.ts`.
  Take F's side; the names match. After F merges, `events.ts`'s inline `'swap' | 'replace'` can
  become F's `BindingConflictPolicy`.
- `SessionState.enter` is optional, like `exit` and `handleIntent` (ponytail cut, in `0570d70`).

- Commit `5d7891f` uses `emitIntent`, which lands one commit later in `ac33c9a`. The branch tip
  builds, but `5d7891f` alone does not typecheck. A merge commit or squash avoids a broken
  bisect step.
- `vitest.config.ts`: client coverage thresholds 45/50/45/45 → 55/55/55/55 (ratchet up only).

## Checklist

- [x] `npm run check` passes locally
- [x] Tests added or updated (bug fixes include a test that failed before the fix)
- [x] No guardrail changes, **or** justified here with a link to the ADR — thresholds only raised
- [x] No new dependencies, **or** each one justified here in one line and approved by a human
- [x] Changes stay within the scope of the task (plus session F's requested bridge additions)
- [x] Docs updated where behaviour or workflow changed (PROGRESS, phase-1 notes, INBOX)

### Pre-PR gate (`AGENTS.md`, ADR 0010), after everything above

- [x] Architecture critic run against the base commit's design docs: verdict and any
      better-than-design items (signed off and folded into the docs) noted below
- [x] `/ponytail-review` + `/ponytail` run on the diff: cuts applied and net lines noted below
- [x] `npm run check` re-run on the post-ponytail code and passes (result pasted below)

**Critic, pass 1 (base `27e7e12`, head `ac33c9a`): FAIL.** The one blocker was process: the
PROGRESS entry and this description did not exist yet. Code findings fixed in `0570d70`:
same-setup rematch (F3), `IllegalSessionTransition` (F4), one CSS module per screen (F6), verdict
TODO (F7), `--theme-on-primary` (F8: text on the Dark primary was 3.35:1, now 5.64:1), sibling
tests (F9), `DisplayCatalogue` rename (F15), the viewport comment (F16), the test split and the
`as` cast (F17). F2 went to INBOX; F5 is listed above; F10–F14 were marked acceptable.

**Critic, pass 2 (base `27e7e12`, diff `ac33c9a..d54e8f1`): PASS WITH NON-BLOCKERS.** It
confirmed the fixes and the contrast ratios. Fixed afterwards: the rematch test used a constant
seed, so it could not tell a repeated setup from a rebuilt one. The seed source is now a counter,
and the test fails if `ResultsState` builds a new setup (checked by reintroducing the bug).
Also fixed: the untested "no setup to repeat" throw, an overclaiming contrast comment in
`global.css`, and a PROGRESS entry over 15 lines. Marked acceptable: F's shape changes (see
merge notes), the optional `enter`, the test-file split.

**Ponytail:** `/ponytail-review` found three cuts (net −13 lines possible). Applied: a stable
sort in `FakeSessionClock.advance` and an optional `SessionState.enter`, which removed two empty
`enter()` stubs. Rejected: `Object.values(...).reduce` in `TypedEventBus.listenerCount`, because
it infers `any` on the generic mapped type and fails `no-unsafe-*` lint. Kept on purpose: the
ports with one adapter (`CatalogueSource`, `Rng`, `SessionClock`), the `image` layer kind
(§2.5), the F/G/H slice shapes (§2.3) and the constants companion.

**Final `npm run check`:**

```text
$ npm run check   # at f42a25b + these docs, exit 0
All matched files use Prettier code style!
> eslint --max-warnings 0 .
> tsc -b
> knip
Configuration hints (1)
@eternalus/core  apps/client  knip.json  Remove from ignoreDependencies
 Test Files  10 passed (10)          # core
      Tests  37 passed (37)
Statements   : 100% ( 106/106 )
 Test Files  38 passed (38)          # client
      Tests  188 passed (188)
Statements   : 89.9% ( 472/525 )
Branches     : 88% ( 110/125 )
Functions    : 90.2% ( 175/194 )
Lines        : 90.66% ( 447/493 )
✓ 92 modules transformed.
✓ built in 85ms
Checked 94 Markdown files under docs/.
Documentation check passed.
```

Lines marked `#` are annotations; the rest is copied from the output. The knip configuration hint
was already printed by the baseline `npm run check` at `27e7e12`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
