---
title: 'PR: feat/settings-keybindings'
description: The pull-request description for feat/settings-keybindings into phase/1-simulation-kernel-and-world (session F) - keybindings data, the input layer, settings persistence, the settings screen with press-to-bind and the pause overlay, the InputAction ids G and H depend on, the deviations from the design and the pre-PR gate results; read this when reviewing that PR or building on it.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-09
tags: [changelog, pull-request, input, keybindings, settings, persistence, ui, sprint-1]
related:
  [
    'docs/agents/prompts/2026-10-03-ultracode-sessions.md',
    'docs/architecture/09-hardware-abstraction.md',
    'docs/architecture/13-game-interface.md',
    'docs/architecture/14-persistence-and-resources.md',
    'docs/decisions/0013-agents-push-task-branches-and-open-prs.md',
  ]
---

# PR: feat/settings-keybindings

**Purpose.** The description for the pull request from `feat/settings-keybindings` into
`phase/1-simulation-kernel-and-world`. Reviewer: a UI-minded teammate (DEC-05: the feature owner
picks). Title:

`feat(client): keybindings, input devices, settings screen and pause overlay (sprint 1, session F)`

---

## Summary

Session F of the Sprint 1 prompts. Controls are data: `keybindings.ts` is the only place a
default key is written, `InputMapper` turns device state into core's `InputIntent` through the
bindings, and `KeyboardDevice`/`MouseDevice` feed it. Settings persist through the
`PersistenceController` facade (memory adapter for now) and `SettingsController` keeps them in
sync across store, storage and game. The settings screen rebinds by pressing a key or mouse button
(side buttons included), resolves conflicts by swap or replace, resets one action or all, and
sets audio, video and accessibility options. The pause overlay offers Resume, Settings and Leave
match. Every `<KeyGlyph>` and `<Prompt>` follows a rebinding with no code change.

## Why

The requirements doc's acceptance tests: "press Enter on W, press Up Arrow, then press Enter to
save", a gadget moved to a mouse side button, and prompts that follow the bindings "with no work
needed from anyone". Sprint 1.5 needs the input layer for the playable demo (§4 of the prompts
file: Esc opens the pause overlay, W → ArrowUp updates the HUD glyphs).

## Names other sessions depend on

**`InputAction` ids (for G's `<KeyGlyph action>` and H's/#19's `Match`), with their defaults:**
`move-up` W, `move-down` S, `move-left` A, `move-right` D, `attack` LMB, `ability-1`…`ability-3`
1–3, `ability-4` 4 (ultimate), `gadget-1` Z, `gadget-2` C, `sprint` Shift, `interact` E,
`turret-toggle-control` P, `turret-switch-ammo` T, `camera-zoom-in` =, `camera-zoom-out` -,
`toggle-minimap` M, `pause-menu` Esc, `toggle-developer-menu` F1, `toggle-perf-overlay` F9.

| Area                                 | Names                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bindings (`bridge/Binding.types.ts`) | `InputAction`, `InputChord { device, code, label }` (mouse `code` = `MouseEvent.button` as a string), `Binding`, `BindingPreset`, `BindingConflictPolicy`                                                                                                                                                                                                 |
| Defaults (`game/input/`)             | `keybindings.ts`: `DEFAULT_CHORDS`, `INPUT_ACTIONS`, `PRESETS` (`wasd`, `arrows`), `withDefaults(saved)`, `SavedBinding`; `bindingEdits.ts`: `rebind(bindings, action, chord, policy)`, `resetBindings(bindings, action \| null)`; `chordKey(chord)`; `BindingResolver` (`setBindings`, `actionsFor`, `conflicts`)                                        |
| Mapping                              | `new InputMapper(bindings)`: `setBindings`, `isBound(code)`, `resolve(snapshot) → ActionState { held, pressed, released, pointer }`, `toIntent(actions, projection) →` core `InputIntent { move, aim, triggered }`; `Projection { screenToWorld }` (`engine/input/Projection.types.ts`)                                                                   |
| Devices (`game/engine/input/`)       | `InputDevice` (`attach`, `detach`, `writeInto`, `releaseAll`), `InputSnapshot` / `MutableInputSnapshot { keys, mouseButtons: Set<number>, pointer }`, `ScreenPoint`; `new KeyboardDevice(isBound)`, `MouseDevice`, `FakeInputDevice` (`press`, `pressButton`, `movePointer`…); `describeInputDevice`, `syntheticEvent`                                    |
| Settings                             | `settingsSlice`: `settingsChanged`; selectors `selectBindings`, `selectBindingLabel(state, action)`, `selectChordOwner(state, chord)`, `selectAudio`, `selectVideo`, `selectAccessibility`; `SettingsPatch`. `game/settings/`: `new SettingsController({ bus, persistence, logger })` (`start`, `destroy`), `settingsWithDefaults`, `applySettingsIntent` |
| Persistence (`data/persistence/`)    | `new PersistenceController({ adapter, knownActions, now, warn })`: `open`, `loadSettings`, `saveSettings`, `close`; `StorageAdapter` port, `MemoryStorageAdapter`, `describeStorageAdapter`; `SettingsDtoV1`, `validateSettingsDto`                                                                                                                       |
| UI                                   | `<KeyGlyph action>`, `<Prompt template="… {action:<id>} …">`, `<SettingsScreen isOverlay?>` (menu route `settings`), `<PauseOverlay />` (renders only while `session.overlay` is set); `STRINGS.settings`, `STRINGS.pause`, `STRINGS.unbound`, `ACTION_LABELS` in `ui/strings.ts`                                                                         |

**G:** mount `<PauseOverlay />` in `MatchScreen` and use `<KeyGlyph action="ability-1" />` (etc.)
in the ability bar. **H / PR #19:** see the INBOX handover; `Match` re-reads bindings on the
`settings` event and toggles the pause overlay on a `pause-menu` press edge.

## Behaviour

- At start, `SettingsController` loads the saved settings (memory adapter), fills every missing
  binding from `DEFAULT_CHORDS` and publishes them on the `settings` event; the store follows.
  A failed load starts from defaults with a WARN, a failed save logs an ERROR.
- **Settings screen** (menu → Settings, or pause → Settings): Controls, Audio, Video and
  Accessibility tabs. Selecting a row listens for the next key or mouse button (buttons 0–4, side
  buttons included); Enter saves, Escape cancels; Tab, F5, F12 and Ctrl/Meta chords stay with the
  browser. A conflict opens a dialog (Swap, Replace, Cancel) with focus on Swap. Each row has a
  reset, the screen a reset-all. Volumes, fullscreen, render scale, reduce motion and colour-blind
  mode emit `update-settings`.
- Every edit keeps bindings conflict-free and is saved; `KeyGlyph` and `Prompt` re-render from
  the store.
- **Pause overlay:** Resume (`close-overlay`), Settings (`open-overlay settings`, the screen
  embedded, Back returns to the pause menu), Leave match (`leave-match`).
- **Devices** (used by `Match` once H/#19 wires them): keyboard by `code`, no auto-repeat presses,
  defaults prevented only for bound keys (never Tab, F5, F12, Ctrl/Meta), release-all on blur and
  `visibilitychange`; mouse buttons from the `buttons` bitmask as `MouseEvent.button` numbers,
  context menu and middle-click suppressed, pointer captured while pressed.

## How it was tested

- 345 client tests (61 files): presets complete and conflict-free; rebind swap/replace and reset;
  resolver and mapper (diagonals, edges, slots, aim projection, `isBound`); the `InputDevice`
  contract on `KeyboardDevice`, `MouseDevice` and `FakeInputDevice` with synthetic events (code
  vs key, repeat, Tab/F5/F12/Ctrl, blur and `visibilitychange`, side buttons, chorded buttons,
  pointer capture, `pointercancel`); the `StorageAdapter` contract on `MemoryStorageAdapter`
  (round trips, compound keys, copies, rollback, readonly, clone errors, auto-increment, ordering,
  migration, newer-schema refusal); settings DTO validation (each bad field named); quarantine of
  bad shape / unknown action / future version (one row and one warning each); `SettingsController`
  (defaults, persist across sessions, failure paths, destroy); the capture state machine
  (including exempt controls); server renders of every component with accessible-name checks.
- **The requirements doc's scenario end to end** (`SettingsScreen.rebind.test.tsx`): capture
  ArrowUp for move-up, Enter → bus → `SettingsController` → store, storage and `InputMapper`;
  the prompt shows ↑, ArrowUp moves up, W does nothing, the reload returns ArrowUp. Also: W →
  ArrowUp updates every `KeyGlyph`; Z → mouse side button fires `gadget-1`.
- Bug found by a contract test: overlapping memory transactions could commit stale copies; the
  ordering test failed (1 of 13) before the fix in `b76bca0` and passes after.
- Not checked in a browser: press-to-bind's `window` listener and focus handling
  (`useBindingCapture.ts`, 15.6 % covered). Node tests have no DOM; a DOM test environment needs a
  dependency approval (09 §9).

## Deviations from the design (the critic marked them acceptable)

Each is recorded in the "Implementation status" notes (09 §11, 13 §10, 14 §14):

- **Sprint 1 contract (§2.3):** flat `InputChord`; `update-binding` / `reset-bindings` /
  `update-settings` intents with swap/replace (Cancel refuses); `INPUT_ACTIONS` derived in
  `keybindings.ts`; selectors in the slice (D's convention).
- **Brief F:** facade `loadSettings` / `saveSettings` (no `persistence.settings`, no status);
  one `SettingsDtoV1` per profile keyed by `profileId` (not `[profileId, group]`; settle before
  IndexedDB); `SettingsRepository` without an interface; `toIntent` only (no `clientActions`); no
  `poll()` or gamepad fields; F1 opens the developer menu.
- **Layering:** quarantine is reported through an injected `warn` because `data/` imports core
  types only; runtime logs go to `NullLogger` until the client sinks land (`TODO(sam)`).
- **Boot:** settings load beside the phase machine; the store has no bindings until the first
  `settings` event (immediate with the memory adapter).
- **No presets on the screen yet** (`PRESETS` exists; no preset intent in §2.3).
- **Files outside the §2.6 globs:** `Prompt.tsx` (named by brief F), `useBindingCapture.ts`
  (named by 13 §6.3), `game/settings/` (critic M1), `ui/strings.ts` (a shared file per D's PR
  description), and the `main.tsx` / `App.tsx` wiring (owner decision DEC-26).
- **`SettingsScreen.rebind.test.tsx`** imports `game/` and `data/`: it is architecture 13 §8's
  acceptance test, at that path. Production `ui/` imports only `bridge/`, `ui/` and `styles/`.

## Better than the design (signed off: DEC-27…DEC-29)

- **DEC-27 `SettingsController`** owns settings in every phase (load, apply, publish, save) in
  `game/settings/`, instead of `SessionController`; the critic rated it better than the design
  and its conditions are met. Folded into 13 §1, §2, §5, §6.3 and 02 §3.
- **DEC-28 snapshot shape:** button numbers, no key labels (09 §2).
- **DEC-29 conflict-free edits** as an invariant (13 §6.3).

## Notes for the reviewer

- **PR #19 (`feat/player-input`) overlaps this branch** on `bridge/Binding.types.ts`,
  `game/input/{keybindings,InputMapper}*` and `game/engine/input/*`. The owner made this
  branch's versions canonical (DEC-26); `InputMapper` takes #19's calls. #19 then drops its copies
  and adapts `DeviceIntentSource` (INBOX has the steps).
- **Guardrail change (ADR 0013, accepted; DEC-25):** `.claude/settings.json` lets agents push
  `feat|fix|docs|refactor|chore/*` branches and open PRs; force pushes, `:`/`+` refspecs,
  deletions, `--no-verify`, `main`/`phase/` pushes and `gh pr merge` are denied. Patterns are
  best-effort: extra arguments after a task-branch name (`--tags`, `--prune`) are not denied.
- `.githooks`, CI, coverage thresholds and ESLint config are unchanged.
- Known nits left: `selectChordOwner` restates `chordKey` (bridge may not import `game/`);
  `Prompt` renders an unknown `{action:…}` id as "—"; focus does not return to the row after the
  dialog closes.

## Checklist

- [x] `npm run check` passes locally
- [x] Tests added or updated (bug fixes include a test that failed before the fix)
- [x] No guardrail changes, **or** justified here with a link to the ADR: ADR 0013 (push rules)
- [x] No new dependencies, **or** each one justified here in one line and approved by a human
- [x] Changes stay within the scope of the task (plus the owner-approved wiring and ADR 0013)
- [x] Docs updated where behaviour or workflow changed (02, 09, 13, 14, decisions log,
      PROGRESS, phase-1 sprint 1.5, INBOX, tool-setup, git-workflow)

### Pre-PR gate (`AGENTS.md`, ADR 0010), after everything above

- [x] Architecture critic run against the base commit's design docs: verdict and any
      better-than-design items (signed off and folded into the docs) noted below
- [x] `/ponytail-review` + `/ponytail` run on the diff: cuts applied and net lines noted below
- [x] `npm run check` re-run on the post-ponytail code and passes (result pasted below)

**Critic, pass 1 (base `4c096c0`, head `6972b7c`): not ready.** Blockers: B1, the push rules
also allowed `+`/`:` refspecs, deletions and `--no-verify` (fixed in `eb97fa9`); B2, PROGRESS,
the PR description and the sprint boxes were missing. Majors: M1, `SettingsController` was in
`game/input/` (moved, `cf2f15e`); M2, Enter or Space on the dialog and reset buttons was captured
(fixed, `9f45829`); M3, Safari and Firefox do not focus a clicked row (keys now read on `window`,
`9f45829`). Minors m1–m6 fixed (`cf2f15e`, `896e776`, `eb97fa9`). Better than the design:
`SettingsController` (BD1), snapshot shape (BD2), conflict-free edits (BD3); signed off as
DEC-27…DEC-29.

**Critic, pass 2 (head `667cf6d`): ready once PROGRESS and this description exist.** Every earlier
finding resolved, except nits n3 and n5 (listed above). Recommended and done in `233dbe1` /
`86b5ccb`: drop the cross-file `composes` that added a PostCSS warning (N1), 13's `paths` (N3),
two stale lines in 09 (BD2). Left as a recorded gap: N2 (the capture hook's DOM glue untested).

**Critic, pass 3 (post-ponytail diff `667cf6d..86b5ccb`): ready for PR.** No violations; the
strings fold, the N1/N3/N4 fixes and the 09 lines check out, with no dangling references. One
new nit: `SettingsScreenOptions` spells out its tab union instead of deriving it from `TABS`
(still compile-safe).

**Ponytail** (`/ponytail-review` on `4c096c0...HEAD`): three cuts. (1) and (3) applied in
`233dbe1`: the settings and pause labels moved into `ui/strings.ts`, reusing `STRINGS.back` and
one unbound dash (net −9 lines). (2) `.chord` composing `KeyGlyph`'s style was applied and then
reverted for the critic's N1 (net 0). Everything else was architecture-required.

**`npm run check` on the post-ponytail code (`86b5ccb`):**

```
> npm run format:check && npm run check:no-js && npm run lint && npm run typecheck && npm run knip && npm run test:coverage && npm run build && npm run docs:check
All matched files use Prettier code style!
 Test Files  42 passed (42)
      Tests  295 passed (295)
All files          |   98.78 |    91.48 |    99.1 |   98.69 |
 Test Files  61 passed (61)
      Tests  345 passed (345)
All files          |   90.97 |    85.75 |   88.32 |   91.13 |
✓ built in 88ms
Documentation check passed.
EXIT=0
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)
