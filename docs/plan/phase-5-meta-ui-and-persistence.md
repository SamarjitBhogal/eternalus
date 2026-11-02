---
title: Phase 5 — Meta UI and persistence
description: Sprint checklists for the persistence layer (IndexedDB behind PersistenceController), resources and boot, the menu screens, settings with press-to-bind rebinding, match results and the completed developer menu; read this before starting any Phase 5 task.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-29
tags: [plan, phase-5, persistence, resources, ui, settings, keybindings, developer-menu]
paths: ['apps/client/src/data/**', 'apps/client/src/ui/**', 'apps/client/src/game/input/**']
related:
  [
    'docs/plan/README.md',
    'docs/architecture/13-game-interface.md',
    'docs/architecture/14-persistence-and-resources.md',
    'docs/reference/game-design/09-controls.md',
  ]
---

# Phase 5 — Meta UI and persistence

## Purpose

Read this when you pick up a Phase 5 task or review the Phase 5 PR. Phase 5 wraps the match in
a game: the persistence layer (IndexedDB behind ONE `PersistenceController` facade with
repositories and a `StorageAdapter` port, D3), assets through ONE `ResourceController`, the
`SessionController` (boot → menu → loading → match → results), the requirements doc's boot menu
(loadouts saved to the profile, a profile with match history and achievement hooks, settings
with press-to-bind rebinding, about), match results saved with their replays, and the developer
menu completed as debug `Command`s. Everything here is client lane (L3 `data/`, `game/`,
`bridge/`, L4 `ui/`); core only gains plain DTO types. No server (D3): local data is a cache the player can export, per [research A](../research/persistence-input-diagnostics-research.md#what-this-means-for-eternalus-a).

- **Branch:** `phase/5-meta-ui-and-persistence` (stacked on `phase/4-…` until it merges; sprint
  5.1 starts early from `phase/3-…`, the roadmap's stacking rule).
- **Weeks:** 6–9 (2026-11-09 → 2026-12-04). Week 6: sprint 5.1; week 7: 5.2; week 8: 5.3;
  week 9: 5.4 and 5.5 in parallel (UI owner and persistence owner).
- **Requirement areas served:** "FR: boot menu & loading screen", "FR: loadouts" (saved to the
  profile), "FR: profile & match history", "FR: controls & rebinding" (press-to-bind, mouse side
  buttons, dynamic prompts), "FR: developer menu", "NFR: persistence", "NFR: no hardcoding".
- **Depends on:** Phase 1 (`keybindings.ts`, `InputMapper`, `DeveloperMenu` v0, `PerfOverlay`
  v1), Phase 3 (`MatchResult`, sim mode), Phase 4 (`Loadout` validation, `autoBuild`,
  `<KeyGlyph/>`). INBOX decisions wanted by week 8: the profile screen's themed name (OQ-15;
  `Recommendation:` "Chronicle" per [naming.md](../reference/suggestions/naming.md)), the IndexedDB test fake (5.1).

## Sprint 5.1 — Persistence layer

Owner: _ (persistence owner). Week 6. In `apps/client/src/data/persistence/`. Follows
[14-persistence-and-resources.md](../architecture/14-persistence-and-resources.md) and
[research A3](../research/persistence-input-diagnostics-research.md#a3-patterns-repository-unit-of-work-facade-dtos-migrations-replays).

- [ ] **`StorageAdapter` port + `MemoryStorageAdapter`** (`open(schema)`, `get`, `getAll` by key
      range or index, `put`, `delete`, `transaction(stores, mode, fn)`; the memory adapter
      structured-clones values so non-cloneable data fails in tests). Owner: _. Test: one shared
      contract suite (`describeStorageAdapter(factory)`): CRUD, index ranges, isolation, abort rollback. Done when: no module outside the adapters names `indexedDB`.
- [ ] **`IndexedDbStorageAdapter`** (a ~40-line promise wrapper: `requestToPromise`,
      `transactionDone`, `openDatabase`; `onversionchange` closes and raises a "reload" event;
      `QuotaExceededError` and `VersionError` mapped to typed `StorageError`s). Owner: _.
      Test: the contract suite against an IndexedDB fake (`Recommendation:` `fake-indexeddb`, a
      dev dependency needing human approval per `AGENTS.md`; fallback: a hand-written fake of the
      used subset) plus one manual browser run. Done when: it is the only file naming `IDBDatabase`.
- [ ] **Versioned schema + migration ladder** in `schema/` (`DB_VERSION`; a `Migration[]`
      ladder; `onupgradeneeded` runs `if (oldVersion < n)` steps; v1 stores `profiles`,
      `loadouts` (index `by_profile`), `settings`, `matches` (indexes `by_profile`,
      `by_profile_and_date`), `replays`, `meta`, `quarantine`). Owner: _. Test: open at v1, seed
      fixtures, reopen at v2 with a test migration adding an index and a field: 100% of records
      survive; v1 code opening a v2 database fails with a typed error, never a hang.
      Done when: only the ladder alters stores; a new store is one migration entry.
- [ ] **Repositories** (`ProfileRepository`, `LoadoutRepository`, `SettingsRepository`,
      `MatchHistoryRepository`, `ReplayRepository`: an `interface` each, one implementation over
      `StorageAdapter`). Owner: _. Test: loadouts by profile and class; history newest first;
      replay by match id; `structuredClone` of every stored value succeeds. Done when:
      repositories return DTOs mapped to core types at the boundary, never class instances.
- [ ] **Versioned DTOs + validation-on-read with quarantine** (`dto/*` carry `schemaVersion`;
      `validateDto()` type guards; a failing record is copied to `quarantine` with store, key,
      reason and time, removed from the live store, logged at WARN through `Logger`; the caller
      gets the default, e.g. auto-build for a loadout per [08-loadout.md](../reference/game-design/08-loadout.md)).
      Owner: _. Test: a corrupt-record fixture set (bad shape, unknown content id, future
      version) yields defaults, one quarantine row each, 0 throws. Done when: no screen can crash on stored data.
- [ ] **`PersistenceController` facade + unit of work** (owns the connection, `DB_VERSION`, the
      ladder and `onversionchange`; exposes the repositories and `unitOfWork(stores, fn)` = one
      `readwrite` transaction; `durability: 'relaxed'` for autosaves, `'strict'` for match
      results; a `persistenceSlice` reports `opening | ready | degraded`). Owner: _. Test: an
      error thrown mid-unit-of-work leaves 0 writes behind on both adapters. Done when:
      `SessionController` and screens reach storage only through this facade.
- [ ] **Durable storage, quota and export/import** (`navigator.storage.persist()` once at first
      launch, `persisted()` and `estimate()` at every boot, a warning when not persisted (Safari
      evicts after seven days without use; private windows never persist); `QuotaExceededError`
      → an `EvictionPolicy` strategy evicting the oldest replays first; `exportProfile(id)` →
      JSON with `formatVersion` and `schemaVersion`; `importProfile(json)` validates through the
      read path and writes in one unit of work). Owner: _. Test: exactly one `persist()` call on
      a fake `navigator.storage`; a simulated quota error evicts replays in date order; export →
      clear → import round-trips equal DTOs; a tampered file is refused naming the field.
      Done when: everything is feature-detected; import shares the quarantine and migration code.

**Success metric:** the adapter contract suite passes 100% on both adapters from one shared
`describe`; the v1 → v2 migration keeps 100% of fixture records and refuses a downgrade; the
corrupt-record fixture set produces 0 throws.

## Sprint 5.2 — Resources and boot

Owner: _ (UI owner + persistence owner). Week 7. Depends on 5.1. In
`apps/client/src/data/resources/`. Follows
[research A4](../research/persistence-input-diagnostics-research.md#a4-game-resources-manifests-preloading-caching-progress).

- [ ] **`AssetManifest`** (generated `assets/manifest.json` with a `version` and one entry
      `{ id, url, type, bytes, hash, licence, source }` per asset; a script in `scripts/`). Owner: _.
      Test: every referenced file exists; byte sizes match; a missing `licence` or a duplicate id
      fails validation. Done when: no asset URL or file name appears outside the manifest.
- [ ] **Loaders** (`ImageLoader`: `fetch` → blob → `createImageBitmap`; `AudioLoader`: `fetch`
      → `arrayBuffer` → `decodeAudioData` through the `AudioOutput` port; `JsonLoader`: `fetch`
      → `validateContent()` from core; decoders injected by constructor so Node tests use
      fakes). Owner: _. Test: a fake `fetch` streams bytes and each loader reports byte progress;
      one failed asset yields a typed error, not a failed group. Done when: loaders are the only
      `fetch` callers for assets.
- [ ] **`ResourceController` facade + `AssetCache` + `loadingSlice`** (`load(group)`, `get(id)`,
      `release(group)`; groups `boot`, `menu`, `match`; the cache deduplicates concurrent loads
      and calls `ImageBitmap.close()` on release; progress = loaded bytes / manifest bytes,
      published through the bridge; no service worker or Cache API for the MVP, per research A4).
      Owner: _. Test: loading `match` emits monotonic progress ending at the manifest sum; two
      parallel `get` calls load once; an unknown id fails at boot. Done when: views ask for assets by id, never by URL.
- [ ] **`BootScreen`** (progress bar from `loadingSlice`, status from `persistenceSlice`, error
      state with retry; `Recommendation:` the same component renders the `loading` session state
      for the `match` group, so the "simple loading screen" is one screen). Owner: _. Test:
      `react-dom/server` snapshots at 0%, 50%, error, "storage not persisted". Done when: the
      screen reads the store only.
- [ ] **`SessionController`** (State pattern over boot → menu → loading → match → results →
      menu; menu sub-screens are a `menuRoute` in the store, not session states; owns the
      `Match` lifetime and calls `Match.destroy()` on leaving `match`; creates the default profile
      on first boot). Owner: _. Test: the transition table; an illegal transition throws; leaving
      a match leaves 0 listeners and 0 scheduled frames; first boot creates exactly one profile.
      Done when: `main.tsx` mounts `<App/>` behind the Redux `Provider`.

**Success metric:** cold boot to the main menu in ≤ 2 s with a warm HTTP cache on the reference
laptop (`Recommendation:`); the loading bar ends exactly at the manifest byte sum for the
`match` group; the session transition table is 100% covered by tests.

## Sprint 5.3 — Menus

Owner: _ (UI owner). Week 8. Depends on 5.2 and Phase 4 sprint 4.5 (`Loadout` validation,
`autoBuild`). Follows the boot-menu structure in [11-mvp-scope.md](../reference/game-design/11-mvp-scope.md#boot-menu-structure-mvp).

- [ ] **`App` shell + `MainMenuScreen`** (Start match, Loadouts, Profile (themed name pending),
      Settings, About; the player's team is chosen at random at match start; keyboard-navigable
      with a visible focus ring; Escape returns to the menu). Owner: _. Test: `react-dom/server`
      render; each item dispatches its session event or `menuRoute`. Done when: labels live in one strings file.
- [ ] **`LoadoutScreen`** (per class, the slots of [08-loadout.md](../reference/game-design/08-loadout.md):
      primary weapon, artifacts 1–2, abilities 1–3 with varieties, ultimate; secondary weapon and
      passive **MVP-if-time**; saved loadouts per profile and class; an auto-build button;
      validation runs in L3 behind the bridge so `ui/` never imports core). Owner: _. Test: an
      invalid pick lists every violation from `validateLoadout`; auto-build fills every slot for
      all three classes; save → reload → identical loadout; a missing content id is repaired by
      auto-build and logged. Done when: the validator here is the one `EntityFactory` runs at spawn.
- [ ] **`ProfileScreen` (themed name pending)** (profile name, aggregate stats, match history
      newest first via `by_profile_and_date`, per-match Legend scores; an achievements panel fed
      by an `AchievementHook` interface + registry with 0 MVP achievements, so "achievements do
      not exist yet; must be an easy add" holds). Owner: _. Test: a three-match fixture renders
      in date order; a fake achievement registered in a test appears with 0 screen changes.
      Done when: a new achievement is one class, one registry line and one DTO field.
- [ ] **`AboutScreen`** (credits, version from `package.json`, a licence list generated from the
      manifest's `licence` and `source` fields). Owner: _. Test: every manifest asset appears once
      with its licence. Done when: nothing in the licence list is typed by hand.

**Success metric:** a reviewer saves a loadout for each class, closes the tab, reopens the app
and finds all three intact; the achievements panel has 0 kind-specific code (registry only).

## Sprint 5.4 — Settings and keybindings

Owner: _ (UI owner + one client-lane reviewer). Week 9. Depends on 5.1, Phase 1 sprint 1.5
(`keybindings.ts`, `InputMapper`, devices) and Phase 4 sprint 4.7 (`<KeyGlyph/>`). Follows
[09-controls.md](../reference/game-design/09-controls.md) and
[research B2](../research/persistence-input-diagnostics-research.md#b2-rebinding-ux-and-data-representation).

- [ ] **`Binding` data finalised, persisted and loaded** (`{ action, chords }`; a chord is
      `{ device: 'keyboard', code, label }` keyed by `KeyboardEvent.code` with the `key` label
      observed at bind time (fallback to `key` when `code` is empty), a mouse chord with
      `button` 0–4, or a reserved gamepad chord; presets `wasd`, `arrows`; a `SettingsDto` with
      `schemaVersion`, `bindings`, `audio` and `accessibility`, saved through `SettingsRepository`
      and loaded at boot into a `settingsSlice`; `InputMapper` gets bindings from the bridge).
      Owner: _. Test: DTO round trip; every `InputAction` has a default; no two defaults
      conflict; save → fresh store and page load → bindings restored; an unknown action in the
      DTO is quarantined. Done when: `keybindings.ts` remains the only place a default key is
      written and no code path reads `localStorage`.
- [ ] **`SettingsScreen` with press-to-bind** (select an action with Enter or click → listen
      mode → the next `keydown` (ignoring `repeat`; Escape cancels; `Tab`, `F5`, `F12` and
      Ctrl/Meta chords excluded) or `pointerdown` including side buttons 3 and 4 (`auxclick` and
      `contextmenu` suppressed) becomes the chord → Enter saves; conflicts offer swap or refuse
      (`Recommendation:` swap after a confirm); reset per action and global reset; presets).
      Owner: _. Test: the requirements doc's scenario: select `move-up` (W), press Up Arrow,
      press Enter → the binding is `ArrowUp`; `InputMapper` yields `move` (0, −1) for `ArrowUp`
      and nothing for `KeyW`; `gadget-1` Z → mouse button 3; a conflict is reported before save.
      Done when: no key name exists in the screen's code.
- [ ] **Prompts and tutorials reflect bindings** (`<KeyGlyph action="…"/>` in every HUD slot,
      turret prompt, tutorial hint and loadout row; prompt strings are templates holding
      `{action:turret-toggle}` placeholders, never a key; a test walks every template). Owner: _. Test
      (the requirements doc's acceptance test): server-render the movement tutorial prompt,
      dispatch the W → Up Arrow rebinding, re-render: "W" becomes the Up Arrow label with 0 code
      changes; the template walk finds 0 literals. Done when: a grep for key names in `ui/` hits only `keybindings.ts`.
- [ ] **Audio, accessibility and storage settings** (master/music/sfx volume → `AudioOutput`
      gains; reduced motion; storage status: persisted flag and `estimate()`; export/import
      buttons from 5.1). Owner: _. Test: a slider change reaches a fake `AudioOutput`; the storage
      panel shows the fake estimate. Done when: each settings group is one DTO with a migration path.

**Success metric:** the W → Up Arrow and Z → mouse side button scenarios pass as automated tests
and a reviewer reproduces each in the browser in under 30 s; 100% of prompts render from bindings.

## Sprint 5.5 — Match results and developer menu completion

Owner: _ (persistence owner + sim lane). Week 9. Depends on Phase 3 sprints 3.5 (`MatchResult`)
and 3.8 (sim mode), Phase 2 sprint 2.7 (spawn origins), Phase 1 sprint 1.5 (`DeveloperMenu` v0).

- [ ] **`ResultsScreen` + `MatchResult` → `MatchHistoryRecord` + replay** (match id, seed,
      date, config hash, content version, winner, victory condition, duration, per-Legend scores)
      written by `PersistenceController.saveMatchResult` in one unit of work with the profile's
      aggregate stats and the replay (seed + ordered command log + versions; cut line 9 if late);
      a developer action "save replay as fixture" writes the Phase 1 fixture format. Owner: _.
      Test: a finished sim-mode match writes one history row, one replay and the profile update
      atomically; the stored replay reproduces the final `StateHasher` hash in the core replay
      harness. Done when: the results screen is a pure view of the DTO; one replay format exists.
- [ ] **`DeveloperMenu` complete** (enabled by `?dev=1` or a persisted settings toggle, opened
      in-game by a rebindable `dev-menu-toggle` action: add/remove Legends with class and team
      pickers (≤ 10 per team); spawn mobs from origin points, i.e. Stronghold gates, tower slots
      and camp slots (≤ 144 per team, refused with a diagnostic at the cap); sim mode toggle;
      invariant level `off | light | heavy` and heavy cadence; `PerfOverlay` toggle; seed
      display; match phase jump; every action a debug `Command` through `Simulation`). Owner: _.
      Test: a spy on `Simulation.enqueueCommand` sees one `Command` per button and no direct
      state access; an 11th Legend and a 145th unit are refused; a menu-driven sim-mode match is
      replayable. Done when: the menu has no reference to `GameState`.
- [ ] **Invariant and perf overlays** (`PerfOverlay` v2: tick and frame histograms, last
      long-animation-frame, memory sample when `crossOriginIsolated`, `RingBufferSink` log tail,
      invariant violations with a "copy repro" button carrying seed, tick and the last 32
      commands). Owner: _. Test: an injected violation appears with a repro payload equal to the
      `Logger` record. Done when: the overlay reads the bridge store only.
- [ ] **Accessibility minimums** (`Recommendation:`, beyond the sources' remappable controls:
      every screen operable by keyboard alone; visible focus; `prefers-reduced-motion` honoured;
      HUD text contrast ≥ 4.5:1 from the `global.css` tokens; team never signalled by colour
      alone on HUD and minimap glyphs). Owner: _. Test: a server-render walk asserts every
      interactive element has an accessible name; a token test checks contrast pairs.
      Done when: the checklist lives in [checklists.md](../agents/checklists.md).

**Success metric:** 100% of developer-menu actions are `Command`s (spy test); a menu-started
sim-mode match ends with a history row and a replay that reproduces the final hash; every screen
passes the keyboard-only walk.

## Success metrics (phase level)

| Metric                                  | Target                                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| Persistence contract                    | one suite, 100% green on `MemoryStorageAdapter` and the IndexedDB fake                 |
| Migration ladder                        | v1 → v2 keeps 100% of fixture records; downgrade refused with a typed error            |
| Bad-data resilience                     | 0 throws over the corrupt-record fixture set; 1 quarantine row per record              |
| Rebinding acceptance (requirements doc) | W → Up Arrow and Z → mouse side button scenarios green; 0 literal key names in prompts |
| Loadouts saved to the profile           | save → reload identical for all 3 classes                                              |
| Developer menu                          | 100% of actions are debug `Command`s; caps 10 Legends / 144 units enforced             |
| Match history + replay                  | one atomic write per match; the replay reproduces the final hash                       |
| Coverage; lint, knip, docs check        | core ≥ 85%, client ≥ 65% (`Recommendation:`, roadmap ratchet); all green               |

## Exit criteria

1. All five sprint metrics pass and are recorded in [PROGRESS.md](PROGRESS.md) with the machine
   and browser versions used for the manual runs.
2. The demo script below runs end to end for a reviewer who did not build it, in Chrome and one
   other browser.
3. Architecture docs 13 and 14 match the code, or an ADR records the deviation; the IndexedDB
   test-fake decision is recorded; the profile screen's themed name is decided (INBOX OQ-15) or
   still visibly marked "(themed name pending)".
4. Phase PR approved (sholtzman + sim lane lead), CI green on Linux and Windows, merged by SamarjitBhogal.

## Demo script

1. `npm run dev` with cleared site data: the boot screen loads the manifest with a byte-accurate
   bar, opens the database (schema v1) and lands on the main menu.
2. Loadouts → Magus → change ability 2's variety, save; Profile shows an empty history.
3. Settings → `move-up`: Enter, press Up Arrow, Enter; `gadget-1`: click, press a mouse side
   button; the ability bar glyphs and the movement tutorial prompt update immediately.
4. Start match → loading screen → walk with the arrow keys; developer menu: add a Legend, spawn
   a horde from a camp origin, set invariants to `heavy`, show the overlay, toggle sim mode.
5. Let the bots finish (or jump to `ended`): results screen → Profile lists the match with
   scores; export the profile JSON; reload: everything persists; clear site data, import: back.
6. `npm run test`: the contract suite on both adapters, migrations, the W → Up Arrow test.

## Risks

| Risk                                                                     | Mitigation                                                                                                                                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IndexedDB fake needs a new dependency; browser APIs hard to test in Node | Ask early (INBOX); the contract suite is adapter-agnostic, so a hand-written fake is the fallback; injected decoders, fake `navigator.storage` and `fetch`, `react-dom/server`. |
| Safari eviction and private windows lose data                            | `persist()` at first launch, status in settings, export/import JSON, memory fallback with a "not saved" banner (Phase 6.4).                                                     |
| Settings DTO churn breaks saved data                                     | Migrations and `schemaVersion` from day 1; quarantine instead of crashes; the corrupt-record fixture set grows with each bug.                                                   |
| Phase 4 `<KeyGlyph/>` lands late; menu scope creep                       | Stub glyph until 4.7 merges, acceptance test first; skins, armour slot and multiple profiles stay post-MVP ([backlog](backlog-post-mvp.md)).                                    |

## Related

- [README.md](README.md)
- [phase-4-legends-abilities-and-loadouts.md](phase-4-legends-abilities-and-loadouts.md)
- [phase-6-hardening-balance-and-release.md](phase-6-hardening-balance-and-release.md)
- [backlog-post-mvp.md](backlog-post-mvp.md)
- [PROGRESS.md](PROGRESS.md)
- [../architecture/13-game-interface.md](../architecture/13-game-interface.md)
- [../architecture/14-persistence-and-resources.md](../architecture/14-persistence-and-resources.md)
- [../reference/game-design/08-loadout.md](../reference/game-design/08-loadout.md)
- [../reference/game-design/09-controls.md](../reference/game-design/09-controls.md)
- [../research/persistence-input-diagnostics-research.md](../research/persistence-input-diagnostics-research.md)
