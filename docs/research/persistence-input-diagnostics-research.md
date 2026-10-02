---
title: Persistence, input/keybindings and runtime diagnostics for a browser-only TypeScript game
description: Sourced findings on IndexedDB as a DBMS (quotas, eviction, transactions, migrations, DTOs, replays), resource loading, keyboard/mouse/gamepad input and rebinding, and runtime diagnostics (invariants, structured logging, frame timing, replay and soak testing); read before touching persistence, input or the diagnostics layer.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [research, persistence, indexeddb, input, keybindings, diagnostics, testing]
related:
  - 'docs/research/README.md'
  - 'docs/research/works-cited.md'
  - 'docs/architecture/09-hardware-abstraction.md'
  - 'docs/architecture/14-persistence-and-resources.md'
  - 'docs/architecture/15-diagnostics-and-runtime-testing.md'
  - 'docs/requirements/05-engineering-standards.md'
---

# Persistence, input/keybindings and runtime diagnostics for a browser-only TypeScript game

Research report for Eternalus (`docs/research/`). Written 2026-09-30. Every claim cites a source
in "Works cited" by number, e.g. [1]; all sources were fetched on 2026-09-30 and each entry
records the publisher's own last-modified/publication date. Constraints assumed throughout:
browser-only, no server, no game engine, no new npm dependencies, `packages/core` stays pure
TypeScript (no DOM/Node APIs), `console` is banned in app code, and the simulation advances in
fixed 30 Hz ticks driven by `Command`s (AGENTS.md, `docs/architecture/`).

## Summary

- Use IndexedDB as the "database" for everything that is data (profiles, loadouts, settings,
  keybindings, match history, replays). Per-origin quota is generous: Chromium gives an origin up
  to 60% of total disk, Firefox min(10% of disk, 10 GiB) best-effort, Safari 17+/macOS 14+ about
  60% of disk for browser apps; localStorage is capped at 5 MiB per origin and is synchronous [1][7].
- Two eviction facts drive design: Safari deletes all script-writable storage after seven days of
  Safari use without user interaction on the site [8][1], and private/incognito sessions keep
  IndexedDB in memory only and drop it when the session ends [2][13]. Treat local data as a cache
  the player can export, and call `navigator.storage.persist()` once [3].
- Do not add the `idb` package; a ~40-line promise wrapper (`requestToPromise`, `transactionDone`,
  `openDatabase` with an `oldVersion` migration ladder) reproduces the parts we need [10][12][2].
- Schema versioning is an integer `open(name, version)` plus an `onupgradeneeded` handler that
  runs `if (oldVersion < N)` steps; only that handler may change object stores/indexes, and
  another tab holding an old connection blocks the upgrade until it closes on `versionchange` [2][10].
- Store deterministic replays (seed + ordered command log + content/schema version), not full
  state; this is the standard approach in games and is exactly what Riot built LoL's server
  determinism on [22][20][21].
- Bind controls with `KeyboardEvent.code` (physical key, layout-independent) and display them with
  `KeyboardEvent.key` or a glyph table; `code` is supported in every desktop engine (Chrome 48+,
  Firefox 38+, Safari 10.1+) but is empty on mobile virtual keyboards, so keep a `key` fallback [23][24].
- Gamepads are polled, not event-driven: call `navigator.getGamepads()` every frame, read by
  `index`, expect `null` slots, and expect an empty list until the player presses a button
  (fingerprinting mitigation); `mapping === "standard"` gives the 17-button/4-axis layout [25][26].
- Model input as data: device chord -> `InputAction` -> game `Command`. The Command pattern is
  what makes rebinding, bots and replays share one interface [22]; remappable controls are the
  single highest-value accessibility feature and prompts should reflect the current mapping [35].
- Invariant checks belong in core as cheap "light" assertions every tick plus "heavy" full-state
  checks every N ticks or in debug/soak builds; assertions must have no side effects and are not
  error handling [40][41]. Log violations through a `Logger` port (OpenTelemetry severity numbers,
  structured attributes: tick, entity id, last commands) with `console` only inside a sink [42].
- Regression-test the simulation by replaying recorded command logs headlessly in Vitest and
  comparing a golden hash of the state (FNV-1a over a canonical serialization) at checkpoints;
  measure frames with `performance.mark/measure`, a `PerformanceObserver` on
  `long-animation-frame`, and periodic `measureUserAgentSpecificMemory()` where available [44][46][37][38][39].

## A. Persistence designed like a DBMS

### A1. IndexedDB fundamentals and browser behaviour

**Data model.** An IndexedDB database is a set of object stores (not tables) holding key/value
records; keys come from a `keyPath`, a key generator (`autoIncrement`) or an explicit key, and
indexes (optionally `unique`, optionally compound via an array key path) allow lookup by a
property other than the primary key. `getAll()`/`getAllKeys()` read whole ranges; cursors iterate
lazily and are cheaper when you only need keys; `IDBKeyRange` bounds a query and direction
`prev`/`nextunique` control iteration [2][10].

**Transactions.** Three modes: `readonly` (default), `readwrite`, and `versionchange` (only inside
the upgrade). Any number of read-only transactions may run concurrently even with overlapping
scopes; a read/write transaction waits for earlier overlapping transactions and is the only one
touching its stores until it finishes; a transaction created later sees the earlier one's writes
[10]. Scope only the stores you need so non-overlapping transactions can run in parallel [2].
Transactions are tied to the event loop: once there are no pending requests when control returns
to the event loop, the transaction commits (or becomes inactive), which is why you must not
`await` unrelated work (a `fetch`, a timer) between requests of one transaction [2][12].
IndexedDB 3.0 adds a `durability` option on `transaction(stores, mode, { durability })`:
`"strict"` (flush OS buffers before `complete`), `"relaxed"` (commit once handed to the OS,
recommended for caches and quickly changing records) and `"default"` [10][11]. Firefox's
`readwriteflush` mode is non-standard [2][11].

**Errors.** Request errors bubble request -> transaction -> database; an unhandled request error
aborts the whole transaction and rolls it back. Calling `event.preventDefault()` in the request's
`onerror` keeps the transaction alive (for example to tolerate a unique-index conflict) [2][10].
Exceeding quota surfaces as a `QuotaExceededError` (on the transaction's abort/error path for
IndexedDB, as a rejection for the Cache API); writes must be wrapped so this is handled [1][7].
On browser shutdown, disk removal or permission loss, every open transaction is aborted with
`AbortError`, then the connection receives a `close` event; there is no way to guarantee a
transaction completes, so never start saves in `unload`/`beforeunload`, and put "clear then
rewrite" into one transaction so a crash cannot leave an empty store [2].

**Versioning and migrations.** `indexedDB.open(name, version)` takes an integer version (2.4
rounds to 2). If the stored version is lower, `upgradeneeded` fires with an exclusive
`versionchange` transaction; this is the only place object stores and indexes can be created,
renamed or deleted. Changing a store's `keyPath` means delete and recreate (data loss unless you
copy it first). If the stored version is higher than requested you get `VersionError` [2][10]. The
specification's own migration example is a ladder inside one handler:

```ts
request.onupgradeneeded = (event) => {
  const db = request.result;
  if (event.oldVersion < 1) {
    /* create v1 stores + indexes */
  }
  if (event.oldVersion < 2) {
    request.transaction.objectStore('books').createIndex('by_year', 'year');
  }
  if (event.oldVersion < 3) {
    db.createObjectStore('magazines');
  }
};
```

The upgrade cannot start while another tab holds an older connection: the opener gets `blocked`,
the old tab gets `versionchange` and should save, `close()` and reload (the spec's example reloads
only when `!document.hasFocus()`), and every client should also handle `VersionError` [2][10].

**Structured clone limits.** Values are stored via the structured clone algorithm: plain objects,
arrays, primitives (except `symbol`), `Date`, `RegExp` (without `lastIndex`), `Map`, `Set`,
`ArrayBuffer`/typed arrays, `Blob`/`File`, `ImageBitmap`, `ImageData` and `Error` types clone;
functions and DOM nodes throw `DataCloneError`; getters/setters, property descriptors, the
prototype chain and class private fields are not preserved [5]. Practical rule: persist plain
data objects (DTOs), never class instances or closures.

**Promise wrapper without a library.** MDN and web.dev both recommend a promise wrapper such as
`idb` (about 1.19 kB brotli) [2][7][12], but its whole value is three helpers we can write
ourselves in `apps/client/src/game/engine/` (or a `persistence/` sibling proposed via ADR):

```ts
export function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}
export function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}
export function openDatabase(
  name: string,
  version: number,
  migrate: (db: IDBDatabase, oldVersion: number, tx: IDBTransaction) => void,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = (e) => migrate(req.result, e.oldVersion, req.transaction!);
    req.onblocked = () => reject(new Error('Database upgrade blocked by another tab'));
    req.onsuccess = () => {
      req.result.onversionchange = () => req.result.close();
      resolve(req.result);
    };
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}
```

`idb`'s README documents the same contract: every `IDBRequest` becomes a promise, `tx.done`
resolves on `complete` and rejects with the transaction error, and `openDB` exposes `upgrade`,
`blocked`, `blocking` and `terminated` callbacks [12]. The one rule to teach the team is idb's:
"Do not `await` other things between the start and end of your transaction" [12].

**Storage quotas (2025-2026 numbers).**

| Browser                                              | Per-origin quota (best-effort)                       | Persistent mode                            | Notes                                                                                                                      |
| ---------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Chromium (Chrome, Edge)                              | up to 60% of total disk                              | same 60%                                   | Browser overall cap 80% of disk; incognito about 5% of disk; "clear site data on close" caps at about 300 MB [1][7]        |
| Firefox                                              | smaller of 10% of disk or 10 GiB (site group limit)  | 50% of disk, capped 8 TiB, no group limit  | User is prompted when `persist()` is called [1]                                                                            |
| Safari 17+ / macOS 14 / iOS 17 (WebKit browser apps) | about 60% of total disk                              | heuristic grant (e.g. Home Screen web app) | Overall 80% of disk; embedded WebViews 15%/20%; cross-origin frames get 1/10 of parent; Safari 17 no longer prompts [1][9] |
| Older Safari                                         | 1 GiB, then a prompt in 200 MB steps                 | n/a                                        | Still documented for legacy versions [1][7]                                                                                |
| Web Storage (localStorage + sessionStorage)          | 5 MiB + 5 MiB per origin, 10 MiB total, all browsers | n/a                                        | Throws `QuotaExceededError` [1]                                                                                            |

Quotas are computed from total disk size, not free space, to limit fingerprinting, so an origin may
hit disk-full before reaching its quota [1][7]. `navigator.storage.estimate()` returns
`{ usage, quota, usageDetails }` in bytes; values are deliberately imprecise, quota can vary with
site engagement, and it is Baseline since September 2023 [4][9]. Chrome's web.dev guide notes that
DevTools > Application > Storage can simulate a custom quota for testing [7].

**Eviction and persistence.** Storage is best-effort by default: under storage pressure browsers
evict whole origins least-recently-used first, and only origins granted persistence are skipped;
an origin's data is deleted all at once, never partially [1][9]. `navigator.storage.persist()`
returns a promise of `true` when granted; Firefox shows a permission prompt, Chromium and Safari
decide silently from engagement heuristics; it needs a secure context and is Baseline since
December 2021 [3][1][9]. Chrome's research says regularly visited sites are very rarely evicted [1].

**Safari's proactive eviction.** Since Safari 13.1/iOS 13.4 (March 2020), Intelligent Tracking
Prevention deletes all of a site's script-writable storage (IndexedDB, localStorage,
sessionStorage, Cache API, service-worker registrations) after seven days of Safari use without
user interaction on the site; web apps added to the Home Screen keep their own counter and are not
expected to lose data [8]. MDN lists this as Safari-only "proactive eviction" and WebKit's 2023
policy post confirms ITP-based eviction still applies alongside LRU eviction [1][9].

**Private browsing.** IndexedDB in private modes lasts only in memory until the session closes [2];
localStorage for a private session is cleared when the last private tab closes [13]; browsers may
apply different quotas in private mode [1].

### A2. Which storage to use for what

| Data                                                  | Store                                                                                                                                                                     | Why                                                                                                                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Profiles, loadouts, match history, replays            | IndexedDB (object stores + indexes)                                                                                                                                       | Structured records, ranges by date/score via indexes, transactions, large quota; web.dev's default for "other data" [7][2]                                                           |
| Settings and keybindings                              | IndexedDB `settings` store (one record per settings group); optional mirror of a tiny "last profile id"/"reduced motion" flag in localStorage for synchronous first paint | localStorage is synchronous, string-only, 5 MiB and blocks the main thread [7][13][1]; keybindings are small but should live in the same versioned schema so migrations cover them   |
| Game resources: sprites, audio, content JSON          | HTTP + `fetch()`; decode with `createImageBitmap` / `decodeAudioData`; optionally Cache API keyed by manifest version                                                     | Cache API stores Request/Response pairs, ignores HTTP caching headers, never expires entries and must be versioned by cache name; usable from `window` without a service worker [14] |
| Very large binary files edited in place (not planned) | OPFS                                                                                                                                                                      | Origin-private file system with in-place writes and synchronous access handles in workers; subject to the same quota; Baseline March 2023 [6][7]                                     |

web.dev's summary: Cache Storage for the resources needed to load the app, OPFS for file-based
content, IndexedDB for other data, and avoid localStorage as primary storage [7].

### A3. Patterns: repository, unit of work, facade, DTOs, migrations, replays

- **Repository.** "Mediates between the domain and data mapping layers using a collection-like
  interface for accessing domain objects" and keeps a one-way dependency from domain to data
  mapping [17]. For Eternalus: `ProfileRepository`, `LoadoutRepository`, `MatchHistoryRepository`,
  `ReplayRepository`, `SettingsRepository`, each an `interface` (contract classes implement) with
  an IndexedDB implementation and an in-memory implementation for tests.
- **Unit of Work.** "Maintains a list of objects affected by a business transaction and coordinates
  the writing out of changes" so you do not make many tiny database calls [18]. In IndexedDB the
  unit of work is one `readwrite` transaction spanning the stores it touches; a `SaveMatchResult`
  use case writes the history row, updates the profile's stats and stores the replay in one
  transaction so a crash cannot leave them inconsistent (the MDN guidance on "clear + write in a
  single transaction") [2].
- **Single data-access facade.** One `PersistenceController`/`GameDatabase` class owns the open
  connection, the schema version constant, the migration ladder, `onversionchange` handling and
  quota errors; repositories receive it. This is the only client module allowed to touch
  `indexedDB`, mirroring the existing rule that only `Renderer` touches the Canvas context.
- **DAO vs DTO.** A DTO is "an object that carries data between processes ... it needs to be
  serializable" and an assembler maps DTO <-> domain objects; encapsulating serialization in DTOs
  isolates the rest of the code from format changes [19]. Persist versioned DTOs (`ProfileDtoV2`)
  that are structured-cloneable plain objects [5]; map to/from core domain types at the repository
  boundary; never store core class instances.
- **Schema versioning.** One `DB_VERSION` integer and a `migrations: readonly Migration[]` array
  where migration `n` upgrades from `n-1` to `n` inside the `versionchange` transaction [10][2].
  Record-level shape changes that do not need new stores are handled by a `schemaVersion` field on
  the DTO plus an upgrade function applied on read (lazy) or in a migration cursor (eager).
- **Deterministic replays instead of full state.** Record `{ seed, contentVersion, coreVersion,
commands: [{ tick, command }] }`. Game Programming Patterns: a naive replay records the entire
  state every frame and uses too much memory; instead "many games record the set of commands every
  entity performed each frame. To replay the game, the engine just runs the normal game simulation,
  executing the pre-recorded commands" [22]. Riot's Server Network Recordings are "a complete record
  of the inputs, match settings, and configurations used to play the game" and are replayed to
  restore the server to any earlier tick; the determinism work started from "a desire to create
  fast, repeatable tests driven from a set of recordable inputs" [20]. Replays are small, and the
  architecture already promises "same seed + same command stream = same match" (`docs/architecture/`).

### A4. Game resources: manifests, preloading, caching, progress

- **Manifest.** A generated `assets/manifest.json` listing `{ id, url, type, bytes, hash }` per
  asset with a top-level `version`. The version doubles as the Cache API cache name so stale caches
  are deleted on activate, the pattern MDN shows (`CURRENT_CACHES`) [14].
- **Loading.** `fetch(url)` -> `response.blob()` -> `createImageBitmap(blob)`; `createImageBitmap`
  accepts `Blob`, `ImageData`, canvases and more, can crop a sprite from a sheet
  (`createImageBitmap(image, sx, sy, sw, sh)`), and returns a promise (Baseline September 2021)
  [15]. Audio: `fetch` -> `arrayBuffer()` -> `audioContext.decodeAudioData()` (promise; Baseline
  April 2021) [16]. Content JSON: `fetch` + `response.json()` validated against the content schema
  in core.
- **Progress.** Sum `bytes` from the manifest and report loaded bytes per asset; render the loading
  screen in React from a `bridge` store slice so the game loop never touches DOM.
- **Cache API / service worker: worth it for a course MVP?** Not for the first milestone. The
  Cache API's benefits are offline play and skipping the HTTP cache; costs are cache versioning,
  quota handling and, for a service worker, a second lifecycle to debug [14][7]. HTTP caching with
  hashed file names from Vite already gives fast reloads. Revisit if the course requires offline
  play; when you do, `caches.open(name)` and `cache.addAll(urls)` work from the page thread [14].

### What this means for Eternalus (A)

1. Add a `GameDatabase` facade (single IndexedDB connection, `DB_VERSION`, migration ladder,
   `versionchange` handling) and repositories with in-memory test doubles; repositories return DTOs
   mapped to core types at the boundary. Propose the folder (`apps/client/src/persistence/` or under
   `game/engine/`) via ADR since AGENTS.md says not to invent top-level folders.
2. Object stores for v1: `profiles` (keyPath `id`), `loadouts` (keyPath `id`, index `by_profile`),
   `settings` (keyPath `key`, includes `keybindings`), `matches` (keyPath `id`, indexes
   `by_profile_and_date` compound, `by_profile`), `replays` (keyPath `matchId`), `meta` (schema and
   content versions). Use `durability: "relaxed"` for autosaves and `"strict"` for match results [11].
3. Call `navigator.storage.persist()` at first launch and show a one-line warning (and an
   export/import of the profile as JSON) because Safari can wipe data after seven days of
   non-use and private windows never persist [8][2][13].
4. Handle `QuotaExceededError` by evicting old replays first (they are the largest records) and
   surfacing `navigator.storage.estimate()` in the settings screen [1][4].
5. Save replays as seed + command log; they are the foundation of C3's regression tests.
6. Skip service workers and the Cache API for the MVP; ship a manifest + `fetch` +
   `createImageBitmap`/`decodeAudioData` loader with byte-based progress.

## B. Input and keybindings

### B1. Platform facts

**`code` vs `key`.** `KeyboardEvent.code` "represents a physical key on the keyboard ... a value
that isn't altered by keyboard layout or the state of the modifier keys"; the same `"KeyQ"` is Q on
QWERTY, `'` on Dvorak and A on AZERTY, so it is right for gamepad-like controls and wrong for
showing the user a label, for which `KeyboardEvent.key` exists [23]. MDN's own game example binds
`KeyW/KeyA/KeyS/KeyD` plus arrows on `keydown`, calls `preventDefault()` except for `Tab`, and
notes real games should track `keydown`/`keyup` rather than rely on auto-repeat [23]. Support:
Chrome 48+, Edge 79+, Firefox 38+, Safari 10.1+, iOS Safari 10.3+; MDN marks it "not Baseline",
and caniuse shows the gaps are Chrome for Android and Samsung Internet (disabled by default) plus
mobile virtual keyboards, which report `""` [23][24]. Auto-repeat is detectable with `KeyboardEvent.repeat` (Baseline May 2025) [31].

**Gamepad API (polling model).** `gamepadconnected` reaches the focused page when a pad connects,
or on the first button press/axis move if it was already connected; Firefox only exposes pads
after interaction to limit fingerprinting [25]. The spec makes this normative: `getGamepads()`
returns an empty list until a "gamepad user gesture" has been seen and returns a snapshot, with
`null` in slots of disconnected pads [26]. MDN's guidance: keep `gamepad.index` as the stable key,
"call `navigator.getGamepads()` each frame and read the latest object for that `index`", not a
long-lived reference; `index` may be reused after reconnect; `buttons[i].pressed` is boolean,
`buttons[i].value` is 0.0..1.0 for analog triggers, `axes[i]` is -1.0..1.0, `mapping === "standard"`
means the browser remapped to the standard layout [25]. Standard layout: buttons 0-3 right cluster
(0 bottom, 1 right, 2 left, 3 top), 4/5 shoulders, 6/7 triggers, 8/9 select/start, 10/11 stick
clicks, 12-15 d-pad (up, down, left, right), 16 centre; axes 0/1 left stick, 2/3 right stick,
negative is left/up [26].

**Mouse buttons.** `MouseEvent.button`: 0 main, 1 auxiliary (wheel), 2 secondary, 3 fourth
(browser back), 4 fifth (browser forward); it is only meaningful on press/release events and users
may swap buttons [27]. Pointer Events give the matching `buttons` bitmask (1 left, 4 middle, 2
right, 8 X1/back, 16 X2/forward, 32 pen eraser) [30]. `auxclick` fires for any non-primary button
after `mousedown`/`mouseup` (Baseline December 2024); `preventDefault()` on it cancels
middle-click-opens-tab, but Windows autoscroll and Linux paste-on-middle must be cancelled on
`mousedown`/`pointerdown`, and the context menu on `contextmenu` [28]. `contextmenu` fires on
right-click or the menu key; cancelling it suppresses the browser menu except Firefox's
Shift+right-click escape hatch [29].

**Pointer Events.** One event model for mouse, pen and touch (`pointerdown/move/up/cancel`,
`pointerType`, `isPrimary`, pointer capture with `setPointerCapture`, `touch-action` CSS to stop
browser panning); Baseline July 2020 and `PointerEvent` inherits every `MouseEvent` property, so
the canvas can listen to pointer events only [30].

**Focus loss.** `window` `blur` fires when the window loses focus (not cancelable) and MDN's example
pauses on `blur`, resumes on `focus` [33]; `visibilitychange` with `document.hidden` fires on tab
switch, minimise or app switch and is "the last event that's reliably observable", the right point
to stop UI work [34]. No `keyup` arrives for keys held across a focus loss, so the input layer must
clear all held keys/buttons on both events.

**Keyboard Lock.** `navigator.keyboard.lock(["KeyW", ...])` captures the listed `code`s including
modifier combinations (so Ctrl+W no longer closes the tab); MDN marks it experimental and "limited
availability" (not Baseline), it needs a secure context and transient user activation, and each
call replaces the previous lock [32]. Treat it as progressive enhancement guarded by `"keyboard" in navigator`.

**Preventing default browser actions.** `preventDefault()` on `keydown` for bound keys (never
`Tab`, `F5`/`F12` or Ctrl/Meta chords), on `contextmenu` for the canvas, and on
`pointerdown`/`auxclick` for middle/side buttons [23][28][29].

### B2. Rebinding UX and data representation

- **Why.** Remappable controls are "one of the best value accessibility features"; offer presets
  plus a fully custom option; in-game remapping (rather than OS-level) lets prompts reflect the
  current mapping and helps AZERTY users [35].
- **Bindings as data.** `type Binding = { action: InputAction; chords: readonly InputChord[] }`
  where `InputChord = { device: "keyboard"; code: string; modifiers?: ... } | { device: "mouse";
button: 0|1|2|3|4 } | { device: "gamepad"; button: number } | { device: "gamepad-axis"; axis:
number; sign: -1|1; deadzone: number }`. An action lists chords from any device ("any device"
  binding) so a player can hold a keyboard key or a pad button for the same action. Defaults live
  in `apps/client/src/game/input/keybindings.ts` (already named in `docs/architecture/`);
  the persisted DTO is `{ schemaVersion, bindings }` in the `settings` store.
- **Press-to-bind flow.** Enter listen mode on the settings screen; the next `keydown` (ignoring
  `repeat` and `Escape` to cancel), `pointerdown` or gamepad `pressed` edge becomes the chord [31].
  Conflict detection: build a `Map<chordKey, InputAction>` and either refuse or swap; reset to
  default per action and globally.
- **Prompts and glyphs.** Tutorial text is rendered from the current binding, never hard-coded
  ("press {action:jump}"). Keyboard labels use `KeyboardEvent.key` observed at bind time (store
  `label` next to `code`) [23]; gamepad glyphs come from a lookup table `{ standardButtonIndex ->
glyph }` per family (Xbox, PlayStation, Switch) chosen from `gamepad.id`. Kenney's Input Prompts
  set is CC0, 1,500 files at 64x64 covering Xbox, PlayStation, Switch, Steam Deck, keyboard/mouse
  and generic glyphs, so it can be added without licence risk (AGENTS.md forbids unlicensed assets) [36].
- **Abstraction layers.** Device events -> `InputSnapshot` (held codes, buttons, axes) ->
  `InputAction` set (via bindings) -> `Command` for the next tick. The Command pattern replaces
  hard-wired `jump()` calls with objects so buttons can be reconfigured, input and AI produce the
  same `Command` stream, and serializable commands can be recorded and replayed; a "null command"
  avoids checks for unbound buttons [22].

### What this means for Eternalus (B)

1. In `apps/client/src/game/input/`: `KeyboardInput` keyed by `event.code` with `key` labels,
   `PointerInput` on the canvas (pointer events, `contextmenu` and `auxclick` suppressed),
   `GamepadInput` polled from `GameLoop` each frame via `getGamepads()`, and a `BindingResolver`
   turning device state into `InputAction`s; `PlayerCommandSource.poll()` stays the only producer of
   `Command`s.
2. Clear all held input on `window` `blur` and on `visibilitychange` to hidden; the fixed-step loop
   already clamps the accumulator, so a hidden tab resumes cleanly.
3. Persist bindings in the `settings` store as a versioned DTO; ship presets ("WASD", "Arrows",
   "Gamepad") plus custom; expose glyph lookup for HUD/tutorial prompts.
4. Guard mobile: if `event.code === ""` fall back to `event.key`; keep `Keyboard.lock()` optional.

## C. Runtime diagnostics and invariant monitoring

### C1. Contracts, invariants and post-mortem context

Design by Contract (Meyer, 1986) specifies preconditions, postconditions and class invariants;
contract checks "should never be violated during execution of a bug-free program", are typically
enabled only in debug builds, and complement external tests with internal self-tests that detect
errors earlier and more specifically [41]. Regehr's rules for assertions: an assertion is "a Boolean
expression ... which will be true unless there is a bug in the program", so it is not error
handling (a quota error is an error, an entity inside a wall is a bug); assertions must have no side
effects; "light" assertions run in small constant time on metadata and may stay on in release,
"heavy" ones (a `checkRep()` over whole structures) are for testing and are disabled in production;
their value is that they shrink the distance between a bug and its visible effect [40].

Applied to a tick-based simulation:

| Invariant                                                                      | Kind                            | When                                             |
| ------------------------------------------------------------------------------ | ------------------------------- | ------------------------------------------------ |
| Entity ids unique; every component references a live entity                    | light                           | every tick, `Simulation.step()` end              |
| No entity inside a solid obstacle after movement resolution                    | heavy (O(entities x obstacles)) | every N ticks in debug, every tick in soak tests |
| No entity removed without a `entity-removed` event carrying a cause            | light                           | assert in the removal path                       |
| No death without a killer/cause; damage never negative; health within [0, max] | light                           | in the damage/death system                       |
| Command queue drained; tick counter advanced exactly once                      | light                           | `step()` postcondition                           |
| Golden hash of state equals recorded hash at checkpoint ticks                  | heavy                           | replay tests (C3)                                |

Cheap execution: a `DebugConfig` in core (`{ assertLevel: "off" | "light" | "heavy"; heavyEvery: 30 }`)
set by the client (debug builds/overlay) or tests; check `heavy` only when `tick % heavyEvery === 0`
or on a sampled subset of entities. Violations throw in tests and log in the browser. Each
violation report carries `{ tick, seed, entityId, invariant, recentCommands, recentEvents }`
taken from a fixed-size ring buffer of the last few hundred `Command`s and `GameEvents` kept by
core (overwrite oldest; O(1) append), which is the post-mortem context a bug report needs.

### C2. Structured logging, timing, memory and a developer overlay

- **Logger port.** AGENTS.md bans `console` in app code, so define `interface Logger { log(record:
LogRecord): void }` in core (pure) and inject sinks from the client: `ConsoleSink` (the only file
  that calls `console`, with an ESLint disable naming the rule and reason), `RingBufferSink` (for the
  overlay and bug reports), and later `RemoteSink`. Use OpenTelemetry's log data model for the
  record: `timestamp` (tick for core, `performance.now()` for client), `severityNumber` (TRACE 1-4,
  DEBUG 5-8, INFO 9-12, WARN 13-16, ERROR 17-20, FATAL 21-24), `severityText`, `body`,
  `attributes` (tick, entityId, system), `eventName` for typed events and an instrumentation scope
  (category) [42]. Filtering by category and minimum severity happens in the sink.
- **Frame timing.** `performance.mark()`/`performance.measure(name, { start, end, detail })`
  create timeline entries; `detail` must be structured-cloneable and a `devtools` object can put
  the measure on a custom track in Chrome's Performance panel (Baseline September 2017) [37]. Mark
  `tick-start`/`tick-end` and `render-start`/`render-end` in `GameLoop`; keep a frame-time
  histogram (fixed buckets, e.g. <8, <16, <33, <50, >=50 ms) updated from the measures.
- **Long frames.** A `PerformanceObserver` on `{ type: "long-animation-frame", buffered: true }`
  reports frames delayed beyond 50 ms with `blockingDuration` and `scripts` attribution
  (`sourceFunctionName`, `invoker`); the buffer holds only 200 entries so observe rather than poll;
  feature-detect with `PerformanceObserver.supportedEntryTypes`; the older Long Tasks API has the
  same 50 ms threshold but less attribution [38].
- **Memory.** `performance.measureUserAgentSpecificMemory()` returns `{ bytes, breakdown }` for the
  page, iframes and workers; it is experimental/Chromium, requires a secure and cross-origin-isolated
  context, values are not comparable across browsers, and it should be sampled periodically at a
  random interval to spot leaks over a session [39]. Guard with `crossOriginIsolated`.
- **Developer overlay.** A React panel in `ui/` fed by the bridge store: FPS/tick histogram, last
  LoAF, memory sample, ring-buffer log tail, invariant violations, and buttons that dispatch debug
  intents ("spawn N mobs", "toggle sim mode", "dump replay") over `bridge/eventBus`; `Match` turns
  intents into debug `Command`s so even cheats flow through the command log and stay replayable.
  Gate the overlay behind a build flag/query parameter.

### C3. Testing a running game: properties, replays, golden hashes, soak tests

- **Property-based ideas.** Property testing generates random inputs, runs each property many times
  (100 by default in fast-check), shrinks failing cases, and stays deterministic by seeding its
  RNG [43]. fast-check would be a new dependency (needs approval); without it, write a tiny loop:
  for `seed` in 1..N, build a match from the seed, drive it with a seeded random command generator
  for M ticks and assert invariants after every tick. Shrinking is lost, but the failing seed is a
  reproducible bug report.
- **Replay-based regression tests.** Riot's workflow: record inputs and a state log from a real
  game, play the recording back on another machine, compare the logs, and bisect the first
  divergence; the "common technique ... is to checksum game memory and compare the results ... after
  some period of game update frames", while Riot logs hierarchical key-value state only when values
  change to keep files small [21]. For Eternalus: commit replay fixtures (seed + commands + expected
  checkpoint hashes) under `packages/core/src/**/__fixtures__`, replay them in Vitest and assert the
  hashes; a mismatch either exposes a bug or documents an intended balance change (regenerate).
- **Golden-state hashing.** Serialize the state canonically (sorted keys, integers only; no floats
  from `performance.now()`, which core cannot use anyway) and hash with FNV-1a 32-bit: offset
  basis 2166136261 (0x811c9dc5), prime 16777619 (0x01000193), XOR each byte then multiply
  (`Math.imul` in TS); it is public domain, trivial to implement in pure TypeScript, and fast, but
  not cryptographic, which is fine for regression detection [46]. Vitest snapshots
  (`toMatchInlineSnapshot`, `toMatchFileSnapshot`) are a convenient store for hashes and small
  state dumps; in CI Vitest never writes snapshots and any mismatch fails the run, update with
  `vitest -u` [44].
- **Soak tests headless in Node.** Core has no DOM dependency, so a Vitest test can step
  `Simulation` for tens of thousands of ticks with bots only, checking heavy invariants every N
  ticks and that memory-like counters (entity count, event-listener count, ring-buffer size) stay
  bounded. Vitest's default `testTimeout` is 5,000 ms in Node and `0` disables it, so give soak
  tests an explicit timeout and tag them (e.g. run under `npm run test:soak` or on a nightly job) [45].

### What this means for Eternalus (C)

1. Add `assert.ts` to core with `assertLight`/`assertHeavy` driven by a `DebugConfig`, a
   `RingBuffer<T>` for recent commands/events, and an `InvariantChecker` run at the end of
   `Simulation.step()`; violations produce structured `LogRecord`s and, in tests, throw.
2. Add a `Logger` port in core and sinks in the client; the console sink is the only `console`
   user. Use OpenTelemetry severity numbers so the level filter is a plain integer comparison [42].
3. Instrument `GameLoop` with `performance.mark/measure`, a LoAF observer and optional memory
   sampling; show them in a gated developer overlay whose actions are debug `Command`s.
4. Make replay fixtures + FNV-1a checkpoint hashes part of `npm run test`; add a seeded random-
   command soak test with a generous `testTimeout`. Every bug fix that came from a replay adds that
   replay as a fixture (AGENTS.md: every bug fix comes with a test that failed before it).

## Works cited

All accessed 2026-09-30.

1. "Storage quotas and eviction criteria", MDN Web Docs (Mozilla), last modified 2026-01-05. https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
2. "Using IndexedDB", MDN Web Docs (Mozilla), last modified 2026-09-11. https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
3. "StorageManager: persist() method", MDN Web Docs (Mozilla), last modified 2024-07-26. https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
4. "StorageManager: estimate() method", MDN Web Docs (Mozilla), last modified 2025-10-31. https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
5. "The structured clone algorithm", MDN Web Docs (Mozilla), last modified 2025-06-29. https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
6. "Origin private file system", MDN Web Docs (Mozilla), last modified 2025-07-14. https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
7. Pete LePage, "Storage for the web", web.dev (Google), last updated 2024-09-23. https://web.dev/articles/storage-for-the-web
8. John Wilander, "Full Third-Party Cookie Blocking and More", WebKit blog (Apple), 2020-03-24. https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
9. Sihui Liu, "Updates to Storage Policy", WebKit blog (Apple), 2023-08-10. https://webkit.org/blog/14403/updates-to-storage-policy/
10. "Indexed Database API 3.0", W3C Editor's Draft, 2025-08-13. https://w3c.github.io/IndexedDB/
11. "IDBDatabase: transaction() method", MDN Web Docs (Mozilla), last modified 2025-06-23. https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction
12. Jake Archibald, "idb: IndexedDB, but with promises" (README, v8), GitHub, undated (accessed 2026-09-30). https://github.com/jakearchibald/idb
13. "Window: localStorage property", MDN Web Docs (Mozilla), last modified 2026-07-28. https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
14. "Cache", MDN Web Docs (Mozilla), last modified 2026-09-11. https://developer.mozilla.org/en-US/docs/Web/API/Cache
15. "Window: createImageBitmap() method", MDN Web Docs (Mozilla), last modified 2025-06-23. https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap
16. "BaseAudioContext: decodeAudioData() method", MDN Web Docs (Mozilla), last modified 2024-07-29. https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData
17. Edward Hieatt and Rob Mee, "Repository", Patterns of Enterprise Application Architecture catalog, martinfowler.com, 2003-03-05. https://martinfowler.com/eaaCatalog/repository.html
18. Martin Fowler, "Unit of Work", PoEAA catalog, martinfowler.com, 2003-03-05. https://martinfowler.com/eaaCatalog/unitOfWork.html
19. Martin Fowler, "Data Transfer Object", PoEAA catalog, martinfowler.com, 2003-03-05 (note added 2013-08-11). https://martinfowler.com/eaaCatalog/dataTransferObject.html
20. Rick Hoskinson, "Determinism in League of Legends: Introduction", Riot Games Technology Blog, 2017-06-20. https://technology.riotgames.com/news/determinism-league-legends-introduction
21. Rick Hoskinson, "Determinism in League of Legends: Fixing Divergences", Riot Games Technology Blog, 2018-05-01. https://technology.riotgames.com/news/determinism-league-legends-fixing-divergences
22. Robert Nystrom, "Command", Game Programming Patterns (book source, `book/command.markdown`), GitHub, book published 2014 (accessed 2026-09-30). https://raw.githubusercontent.com/munificent/game-programming-patterns/master/book/command.markdown
23. "KeyboardEvent: code property", MDN Web Docs (Mozilla), last modified 2025-10-13. https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
24. "KeyboardEvent.code", Can I use (Alexis Deveria), usage data August 2026. https://caniuse.com/keyboardevent-code
25. "Using the Gamepad API", MDN Web Docs (Mozilla), last modified 2026-04-13. https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
26. "Gamepad", W3C Editor's Draft (living document), undated (accessed 2026-09-30). https://w3c.github.io/gamepad/
27. "MouseEvent: button property", MDN Web Docs (Mozilla), last modified 2026-02-13. https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
28. "Element: auxclick event", MDN Web Docs (Mozilla), last modified 2026-08-15. https://developer.mozilla.org/en-US/docs/Web/API/Element/auxclick_event
29. "Element: contextmenu event", MDN Web Docs (Mozilla), last modified 2026-07-28. https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event
30. "Pointer events", MDN Web Docs (Mozilla), last modified 2026-08-28. https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
31. "KeyboardEvent: repeat property", MDN Web Docs (Mozilla), last modified 2023-04-07 (Baseline 2025). https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat
32. "Keyboard: lock() method", MDN Web Docs (Mozilla), last modified 2026-08-22. https://developer.mozilla.org/en-US/docs/Web/API/Keyboard/lock
33. "Window: blur event", MDN Web Docs (Mozilla), last modified 2026-08-21. https://developer.mozilla.org/en-US/docs/Web/API/Window/blur_event
34. "Document: visibilitychange event", MDN Web Docs (Mozilla), last modified 2026-02-20. https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
35. "Allow controls to be remapped / reconfigured", Game Accessibility Guidelines, undated (accessed 2026-09-30). https://gameaccessibilityguidelines.com/allow-controls-to-be-remapped-reconfigured/
36. "Input Prompts" (v1.5a, CC0), Kenney, first released 2024 (accessed 2026-09-30). https://kenney.nl/assets/input-prompts
37. "Performance: measure() method", MDN Web Docs (Mozilla), last modified 2026-09-02. https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure
38. "Long animation frame timing", MDN Web Docs (Mozilla), last modified 2026-03-27. https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Long_animation_frame_timing
39. "Performance: measureUserAgentSpecificMemory() method", MDN Web Docs (Mozilla), last modified 2025-11-30. https://developer.mozilla.org/en-US/docs/Web/API/Performance/measureUserAgentSpecificMemory
40. John Regehr, "Use of Assertions", Embedded in Academia, 2014-02-02. https://blog.regehr.org/archives/1091
41. "Design by contract", Wikipedia, accessed 2026-09-30. https://en.wikipedia.org/wiki/Design_by_contract
42. "Logs Data Model", OpenTelemetry Specification 1.61.0 (status: Stable), accessed 2026-09-30. https://opentelemetry.io/docs/specs/otel/logs/data-model/
43. Nicolas Dubien, "What is Property-Based Testing?", fast-check documentation, last updated 2026-02-07. https://fast-check.dev/docs/introduction/what-is-property-based-testing/
44. "Snapshot", Vitest guide (v5.0.2), VoidZero and Vitest contributors, accessed 2026-09-30. https://vitest.dev/guide/snapshot
45. "testTimeout", Vitest config reference (v5.0.2), VoidZero and Vitest contributors, accessed 2026-09-30. https://vitest.dev/config/testtimeout
46. "Fowler-Noll-Vo hash function", Wikipedia, accessed 2026-09-30. https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function
