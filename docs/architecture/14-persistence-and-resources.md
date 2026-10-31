---
title: Persistence and resources
description: The "single access with a controller in front" design for local data and assets - the PersistenceController facade over repositories and the StorageAdapter port (IndexedDB, memory, later HTTP), schema versioning and migrations, transactions as units of work, versioned DTOs with validation-on-read and quarantine, quota and eviction, export/import, replays, the record catalogue, and the ResourceController with its manifest, loaders and cache; read this before touching apps/client/src/data/.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-30
tags: [architecture, persistence, indexeddb, repositories, dto, migrations, resources, assets]
paths: ['apps/client/src/data/**']
related:
  [
    'docs/architecture/03-game-model.md',
    'docs/architecture/09-hardware-abstraction.md',
    'docs/architecture/12-game-story-and-match-director.md',
    'docs/architecture/13-game-interface.md',
    'docs/plan/phase-5-meta-ui-and-persistence.md',
    'docs/research/persistence-input-diagnostics-research.md',
  ]
---

# Persistence and resources

**Purpose.** Read this when something must survive a reload (a profile, a loadout, settings and
keybindings, match history, a replay) or must be loaded from disk (a sprite atlas, a sound, a
JSON file). The requirements doc asks for a "database configuration: single access with a
controller in front"; the decision is IndexedDB behind ONE `PersistenceController` facade with
repositories and a `StorageAdapter` port, and assets through ONE `ResourceController` (D3,
ADR 0005, AP-08). No server. Local data is a cache the player can export
([research A, "What this means"](../research/persistence-input-diagnostics-research.md#what-this-means-for-eternalus-a)).
Every block is a **sketch**; §14 says what is built.

## 1. Where it sits and the one-door rule

`apps/client/src/data/` is L3 (the facades and repositories) with L1 adapters inside it
([01](01-layered-oop-model.md) §3). It imports core as `import type` only (the domain types that
cross the DTO boundary) and `data/`; never `game/`, `ui/` or `bridge/`. Consequences that make
this a layer and not a folder: `IndexedDbStorageAdapter` is the only file that names
`indexedDB`/`IDBDatabase`; the loaders are the only `fetch`, `createImageBitmap` and audio
decoding callers; nothing reads `localStorage`; `SessionController` and the screens reach storage
only through the facade (plan Phase 5, sprint 5.1). Progress and status leave `data/` through
callbacks that `SessionController` turns into bridge events (`loading-progress`,
`persistence-status`, [13](13-game-interface.md) §5).

```text
data/persistence/   PersistenceController.ts (facade), StorageAdapter.ts (port + .contract.ts), IndexedDbStorageAdapter.ts
                    (+ idbPromises.ts), MemoryStorageAdapter.ts, schema/migrations.ts, repositories/<Name>Repository.ts
                    (interface) + Storage<Name>Repository.ts (class), dto/<Name>Dto.ts (+ validate/upgrade/mappers),
                    StorageError.ts, EvictionPolicy.ts, profileExport.ts
data/resources/     ResourceController.ts, AssetManifest.ts (+ one file per asset group), AssetCache.ts, loaders/AssetLoader.ts (port) + AssetLoader.contract.ts, ImageLoader.ts, UiImageLoader.ts, FontLoader.ts, AudioLoader.ts, JsonLoader.ts
```

## 2. `PersistenceController`

The facade is the only entry point. Its API is async and grouped by repository, so a caller reads
`persistence.loadouts.listByProfile(id)` and never sees a transaction, a store name or a DTO.

```ts
// Sketch: apps/client/src/data/persistence/PersistenceController.ts
export type PersistenceStatus = 'opening' | 'ready' | 'degraded'; // degraded = MemoryStorageAdapter fallback, nothing survives the session

export class PersistenceController {
  public readonly profiles: ProfileRepository;
  public readonly loadouts: LoadoutRepository;
  public readonly settings: SettingsRepository;
  public readonly matches: MatchHistoryRepository;
  public readonly replays: ReplayRepository;

  public constructor(deps: {
    adapter: StorageAdapter; // IndexedDbStorageAdapter in the browser, MemoryStorageAdapter in tests
    fallback: () => StorageAdapter; // built only when open() fails (§10)
    schema: StorageSchema; // DB_NAME, DB_VERSION, MIGRATIONS
    eviction: EvictionPolicy;
    storage: Pick<StorageManager, 'persist' | 'persisted' | 'estimate'> | null; // navigator.storage, feature-detected
    now: () => number; // wall-clock ms for playedAt and quarantinedAt; main.tsx passes the engine Clock's now (data/ may not import engine/)
    logger: Logger;
    knownActions: ReadonlySet<string>; // for the bindings validator; main.tsx injects it from keybindings.ts
  }) {}

  public open(): Promise<PersistenceStatus>; // migrations, versionchange handling, persist() on first launch
  public get status(): PersistenceStatus;
  public onStatusChange(
    handler: (status: PersistenceStatus, detail: string | null) => void,
  ): Unsubscribe;
  public unitOfWork(
    stores: readonly StoreName[],
    work: (tx: StorageTx) => Promise<void>,
    options?: { durability: 'relaxed' | 'strict' },
  ): Promise<void>;
  public saveMatchResult(input: SaveMatchResultInput): Promise<MatchRecordId>; // §6: history + profile stats + replay, atomically
  public exportProfile(profileId: ProfileId): Promise<ProfileExportV1>; // §9
  public importProfile(json: unknown): Promise<ImportReport>;
  public estimate(): Promise<{ usage: number; quota: number; persisted: boolean } | null>;
  public close(): void;
}
```

SOLID: the controller has one reason to change (how the database is opened and kept healthy,
SRP); it depends on the `StorageAdapter` port and the repository interfaces, never on IndexedDB
(DIP); a caller that needs one repository takes that interface, not the facade (ISP); `main.tsx`
injects the adapter (rule D, no singleton). The single place of change for "a new persisted
record" is one repository property here plus one migration entry (§5).

## 3. Repositories

A repository "mediates between the domain and data mapping layers using a collection-like
interface" ([research A3](../research/persistence-input-diagnostics-research.md#a3-patterns-repository-unit-of-work-facade-dtos-migrations-replays)).
Each is an `interface` plus one class over the port (`StorageProfileRepository`); test doubles
are unnecessary because `MemoryStorageAdapter` makes the real class fast in Node (LSP at the
adapter, not the repository). Repositories return domain types mapped from DTOs at their boundary
(§8) and never class instances from core.

| Repository               | Store(s)   | Domain type it returns                                                | Methods (sketch)                                                                                                                |
| ------------------------ | ---------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `ProfileRepository`      | `profiles` | `Profile` (name, aggregate stats, achievements, timestamps)           | `get(id)`, `list()`, `create(name)`, `save(profile)`, `applyMatch(tx, profileId, result, achievements)` (inside a unit of work) |
| `LoadoutRepository`      | `loadouts` | core `Loadout` (repaired by `repairLoadout` when content moved)       | `listByProfile(profileId)`, `getByProfileAndClass(profileId, classId)`, `save(profileId, loadout)`, `delete(id)`                |
| `SettingsRepository`     | `settings` | `Settings` = `{ bindings, audio, accessibility, developer, storage }` | `load(profileId)` (defaults for missing groups), `saveGroup(profileId, group, value)`                                           |
| `MatchHistoryRepository` | `matches`  | `MatchHistoryRecord` (core `MatchResult` + identity and time)         | `listByProfile(profileId, { limit, before })` newest first via `by_profile_and_date`, `get(id)`, `append(tx, record)`           |
| `ReplayRepository`       | `replays`  | core `Replay` ([03](03-game-model.md) §9)                             | `get(matchId)`, `put(tx, matchId, profileId, replay)`, `listOldest(count)` (for eviction), `delete(matchId)`                    |

## 4. `StorageAdapter` and its adapters

```ts
// Sketch: apps/client/src/data/persistence/StorageAdapter.ts (the port from 09 §7, completed)
export interface StorageAdapter {
  open(schema: StorageSchema): Promise<void>; // runs the migration ladder to schema.version
  get<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined>; // short-hands: one readonly transaction
  getAll<T>(store: StoreName, query?: IndexQuery): Promise<readonly T[]>;
  transaction(
    stores: readonly StoreName[],
    mode: 'readonly' | 'readwrite',
    work: (tx: StorageTx) => Promise<void>,
    options?: TxOptions,
  ): Promise<void>;
  onVersionChange(handler: () => void): Unsubscribe; // another tab wants to upgrade: save, close, reload prompt
  estimate(): Promise<{ usage: number; quota: number } | null>; // navigator.storage.estimate(); null in memory
  close(): void;
}
export type IndexQuery = {
  readonly index?: string;
  readonly range?: KeyRangeSpec;
  readonly limit?: number;
  readonly direction?: 'next' | 'prev';
};
export interface StorageTx {
  get<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined>;
  getAll<T>(store: StoreName, query?: IndexQuery): Promise<readonly T[]>;
  put<T>(store: StoreName, value: T): Promise<void>; // value must be structured-clone-safe
  delete(store: StoreName, key: IDBValidKey): Promise<void>;
}
```

`IndexedDbStorageAdapter` (**MVP**) wraps `indexedDB` with the promise helpers below and maps
native errors to `StorageError` (§10). `MemoryStorageAdapter` (**MVP**) serves tests, the
`?memory` dev flag and the runtime fallback, and `structuredClone`s every value so non-cloneable
data fails in tests too. `HttpStorageAdapter` (**post-MVP**) is a server behind the same port and
contract suite; the repositories do not change. The zero-dependency promise wrapper is the whole
reason not to add `idb` ([research A1](../research/persistence-input-diagnostics-research.md#a1-indexeddb-fundamentals-and-browser-behaviour)):

```ts
// Sketch: apps/client/src/data/persistence/idbPromises.ts (~30 lines, the only IDB plumbing)
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
  migrate: MigrateFn,
  onVersionChange: () => void,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version); // 'VersionError' when the stored version is newer
    req.onupgradeneeded = (e) => migrate(req.result, e.oldVersion, req.transaction!);
    req.onblocked = () => reject(new StorageError('blocked', 'upgrade blocked by another tab'));
    req.onsuccess = () => {
      req.result.onversionchange = () => {
        req.result.close();
        onVersionChange();
      };
      resolve(req.result);
    };
    req.onerror = () => reject(StorageError.fromNative(req.error));
  });
}
```

The one rule to teach the team, from idb's README: never `await` anything unrelated between the
requests of one transaction, or it auto-commits ([research A1](../research/persistence-input-diagnostics-research.md#a1-indexeddb-fundamentals-and-browser-behaviour)).

## 5. Schema versioning and migrations

`DB_VERSION` is one integer; the ladder is data both adapters interpret, so a migration test runs
in Node on `MemoryStorageAdapter` and in the browser (or an IndexedDB fake) on
`IndexedDbStorageAdapter`.

```ts
// Sketch: apps/client/src/data/persistence/schema/migrations.ts — the ONLY file that alters stores (02 §9)
export const DB_NAME = 'eternalus';
export const DB_VERSION = 1;
export type Migration = {
  readonly version: number; // upgrades version - 1 → version
  readonly createStores?: readonly {
    name: StoreName;
    keyPath: string | readonly string[];
    autoIncrement?: boolean;
  }[];
  readonly createIndexes?: readonly {
    store: StoreName;
    name: string;
    keyPath: string | readonly string[];
    unique?: boolean;
  }[];
  readonly transform?: {
    readonly store: StoreName;
    readonly upgrade: (record: unknown) => unknown;
  }; // eager record rewrite via cursor
};
export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    createStores: [
      { name: 'profiles', keyPath: 'id' },
      { name: 'loadouts', keyPath: 'id' },
      { name: 'settings', keyPath: ['profileId', 'group'] },
      { name: 'matches', keyPath: 'id' },
      { name: 'replays', keyPath: 'matchId' },
      { name: 'meta', keyPath: 'key' },
      { name: 'quarantine', keyPath: 'id', autoIncrement: true },
    ],
    createIndexes: [
      { store: 'loadouts', name: 'by_profile', keyPath: 'profileId' },
      { store: 'loadouts', name: 'by_profile_and_class', keyPath: ['profileId', 'classId'] },
      { store: 'matches', name: 'by_profile', keyPath: 'profileId' },
      { store: 'matches', name: 'by_profile_and_date', keyPath: ['profileId', 'playedAt'] },
      { store: 'replays', name: 'by_played_at', keyPath: 'playedAt' },
      { store: 'quarantine', name: 'by_store', keyPath: 'store' },
    ],
  },
];
```

- `IndexedDbStorageAdapter.open` runs `for (const m of MIGRATIONS) if (oldVersion < m.version) apply(m)`
  inside `onupgradeneeded`, the only place stores and indexes may change. Changing a `keyPath`
  means a new store plus a `transform` copy, never an in-place edit.
- `versionchange` (another tab opened a newer version): the adapter closes its connection and
  the controller reports `degraded` with a "reload to continue" detail; a save never starts in
  `beforeunload`. `blocked`: the opener surfaces the same prompt. `VersionError` (this build is
  older than the stored schema): a typed error, never a hang, and the memory fallback (§10).
- Record-level shape changes that need no new store are handled lazily on read by
  `upgrade<Name>Dto()` keyed on the DTO's `schemaVersion` (§8); eager rewrites use `transform`.
  The v1 store list is the research's plus `quarantine` (plan Phase 5, sprint 5.1); the two
  extra indexes are `Recommendation:`s.

## 6. Transactions as units of work

A use case is one `readwrite` transaction spanning the stores it touches, so a crash leaves
either everything or nothing ([research A3](../research/persistence-input-diagnostics-research.md#a3-patterns-repository-unit-of-work-facade-dtos-migrations-replays),
ES-10). `PersistenceController.unitOfWork` opens it; repositories expose `tx`-taking methods
for use inside it and plain methods that open their own short transaction.

```ts
// Sketch: the one use case that touches three stores
public async saveMatchResult(input: SaveMatchResultInput): Promise<MatchRecordId> {
  const id = crypto.randomUUID(); // client-side identity; core never sees it
  await this.unitOfWork(['matches', 'profiles', 'replays'], async (tx) => {
    await this.matches.append(tx, toMatchHistoryRecord(id, input, this.now()));
    await this.profiles.applyMatch(tx, input.profileId, input.result, input.achievements);
    if (input.replay !== null) await this.replays.put(tx, id, input.profileId, input.replay);
  }, { durability: 'strict' }); // match results flush; autosaves (settings, loadouts) use 'relaxed'
  return id;
}
```

Scoping only the stores a unit of work needs lets non-overlapping transactions run in parallel;
`durability` follows the research (`'relaxed'` for quickly changing records, `'strict'` for the
records the player would miss).

## 7. Record catalogue

Every stored value is a versioned, structured-clone-safe DTO (`…DtoV1`): plain objects, arrays,
numbers, strings, booleans, `null`; no class instances, functions, `Map`s or `Date`s
([research A1, structured clone](../research/persistence-input-diagnostics-research.md#a1-indexeddb-fundamentals-and-browser-behaviour)).
Wall-clock fields exist only here, never in core.

| Store        | Key                  | DTO                       | Fields (sketch)                                                                                                                                                                                                                                                                                                                                                                                            | Status                                |
| ------------ | -------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `profiles`   | `id`                 | `ProfileDtoV1`            | `schemaVersion: 1`, `id`, `name`, `createdAt`, `lastPlayedAt`, `stats { matches, wins, losses, kills, deaths, assists, structuresDestroyed, playTimeTicks }`, `achievements: { id, matchId, unlockedAt }[]`                                                                                                                                                                                                | **MVP**; achievements **MVP-if-time** |
| `loadouts`   | `id`                 | `SavedLoadoutDtoV1`       | `schemaVersion`, `id`, `profileId`, `classId`, `name`, `updatedAt`, `loadout: LoadoutDtoV1` (mirrors core `Loadout`, [05](05-abilities-weapons-and-loadouts.md) §12: `primaryWeaponId`, `abilities[3]`, `ultimate`, `artifacts[2]`, …)                                                                                                                                                                     | **MVP**                               |
| `settings`   | `[profileId, group]` | `SettingsGroupDtoV1`      | `schemaVersion`, `profileId`, `group: 'bindings' \| 'audio' \| 'accessibility' \| 'developer' \| 'storage'`, `value`: bindings `{ preset, bindings: BindingDtoV1[] }` (`{ action, chords: ChordDtoV1[] }`, [13](13-game-interface.md) §6); audio `{ master, music, sfx }`; accessibility `{ reducedMotion }`; developer `{ menuEnabled, assertLevel }`; storage `{ recordSimulatedMatches, storeReplays }` | **MVP**                               |
| `matches`    | `id`                 | `MatchHistoryRecordDtoV1` | as in [mechanics-ideas §8](../reference/suggestions/mechanics-ideas.md#8-match-history-record-contents): `id`, `profileId`, `playedAt`, `durationTicks`, `tickRate`, `seed`, `mapPresetId`, `configHash`, `coreVersion`, `contentVersion`, `isSimulation`, `result`, `player`, `legends: LegendScoreDtoV1[]`, `teams`, `timeline`, `achievements`, `replayId`                                              | **MVP**                               |
| `replays`    | `matchId`            | `ReplayDtoV1`             | `schemaVersion`, `matchId`, `profileId`, `playedAt`, `replay: Replay` (core: `versions { core, content, schema }`, `seed`, `config`, `commands[{ tick, command }]`, `checkpoints[{ tick, hash }]`)                                                                                                                                                                                                         | **MVP** (cut line 9 in the plan)      |
| `meta`       | `key`                | `MetaDtoV1`               | `key: 'schema'`, `dbVersion`, `coreVersion`, `contentVersion`, `persistRequestedAt`, `lastOpenedAt`                                                                                                                                                                                                                                                                                                        | **MVP**                               |
| `quarantine` | `id` (auto)          | `QuarantineRecordDtoV1`   | `id`, `store`, `key`, `reason`, `quarantinedAt`, `value: unknown`                                                                                                                                                                                                                                                                                                                                          | **MVP**                               |

Replays store seed + command log + versions, never full state ([research A3](../research/persistence-input-diagnostics-research.md#a3-patterns-repository-unit-of-work-facade-dtos-migrations-replays)):
`ReplayRecorder` in core records the commands that enter through `Simulation.enqueueCommand`
(the human's `intent`s and `dev-*` commands); bot commands are regenerated by `AiSystem` from the
seed, so a 20-minute match is hundreds of kilobytes at most (`Recommendation:` estimate; measure
in Phase 5). `versions` let `runReplay` refuse a replay recorded under other content or schema.

## 8. DTO ↔ domain mapping, validation-on-read, quarantine

Stored data is never trusted (ES-08). Every read goes through a type guard and, if needed, a
version upgrade; every write goes through a mapper. Both live in `dto/`, one file per record.

```ts
// Sketch: apps/client/src/data/persistence/dto/SavedLoadoutDto.ts and repositories/readOrQuarantine.ts
export function validateSavedLoadoutDto(
  value: unknown,
): { ok: true; dto: SavedLoadoutDtoV1 } | { ok: false; reason: string };
export function upgradeSavedLoadoutDto(dto: SavedLoadoutDtoAnyVersion): SavedLoadoutDtoV1; // lazy per-record ladder on schemaVersion
export function toLoadout(dto: SavedLoadoutDtoV1): Loadout; // core type
export function fromLoadout(profileId: ProfileId, loadout: Loadout, now: number): SavedLoadoutDtoV1;

// One function shared by every repository, not a private copy in each.
export async function readOrQuarantine<T>(
  tx: StorageTx,
  { store, key, validate }: { store: StoreName; key: IDBValidKey; validate: Validator<T> },
  deps: { now: () => number; logger: Logger }, // the repository's, the same for every read
): Promise<T | null> {
  const raw = await tx.get<unknown>(store, key);
  if (raw === undefined) return null;
  const checked = validate(raw);
  if (checked.ok) return checked.dto;
  await tx.put('quarantine', {
    store,
    key,
    reason: checked.reason,
    quarantinedAt: deps.now(),
    value: raw,
  }); // a QuarantineRecordDtoV1 (§7)
  await tx.delete(store, key);
  deps.logger.log(
    makeLogRecord('WARN', 'client.persistence', 'record quarantined', {
      store: String(store),
      reason: checked.reason,
    }),
  ); // 15 §4
  return null; // the caller substitutes a default: autoBuildLoadout, DEFAULT_CHORDS, a fresh profile
}
```

A corrupt record is copied to `quarantine`, removed from the live store, logged at WARN through
`Logger` and replaced by a default; it is never fatal and no screen can crash on stored data
(plan Phase 5, sprint 5.1). Semantic checks that need knowledge `data/` may not import are
injected: the bindings validator receives `knownActions` from `main.tsx`, and `LoadoutRepository`
calls core's `repairLoadout` (public API) for content ids that no longer exist.

## 9. Durable storage, quota, eviction, export and import

- `navigator.storage.persist()` is requested once at first launch (recorded in `meta`);
  `persisted()` and `estimate()` run at every boot and feed the storage panel of `SettingsScreen`.
  Safari deletes all script-writable storage after seven days of Safari use without interaction
  on the site, private windows keep IndexedDB in memory only, and best-effort origins are evicted
  whole under storage pressure; the boot screen shows a one-line warning when not persisted
  ([research A1, quotas and eviction](../research/persistence-input-diagnostics-research.md#a1-indexeddb-fundamentals-and-browser-behaviour)).
  Everything is feature-detected (`storage: null` in Node).
- `QuotaExceededError` (mapped to `StorageError('quota-exceeded')`) triggers the injected
  `EvictionPolicy`: `OldestReplaysFirstEvictionPolicy` deletes the `N` oldest replays via
  `by_played_at`, the write is retried once, and a second failure degrades with a warning.
  Replays are the largest records, so they go first; history rows (about 3 KB each) stay.
- `exportProfile(id)` returns `ProfileExportV1 = { formatVersion: 1, schemaVersion, exportedAt, coreVersion, contentVersion, profile, loadouts, settings, matches, replays? }`
  as JSON for download; `importProfile(json)` validates through the same guards and upgrades,
  refuses a tampered file naming the field, and writes in one unit of work. Import is the
  player's answer to eviction, so it shares the read path rather than duplicating it (DRY).

## 10. Error-handling policy

`StorageError` is the one error type that leaves `data/`; its `kind` drives the policy. Core
fails fast; the edges degrade and never swallow (CP-12).

| `kind`           | Raised when                                              | Controller does                                                        | Status shown by `persistenceSlice`              |
| ---------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------- |
| `unavailable`    | `indexedDB` missing, open rejected, private-mode failure | builds the `fallback()` `MemoryStorageAdapter`, reopens, logs at ERROR | `degraded`: "progress will not be saved"        |
| `version`        | stored schema newer than `DB_VERSION`                    | no downgrade attempt; fallback as above                                | `degraded`: "newer data found; update the game" |
| `blocked`        | another tab holds an old connection during upgrade       | waits, then fallback                                                   | "close other tabs and reload"                   |
| `quota-exceeded` | a write exceeds the origin quota                         | eviction policy, one retry, then warn                                  | `ready` with a storage warning                  |
| `aborted`        | transaction aborted (shutdown, disk removed)             | the unit of work rejects; nothing partial; caller may retry            | transient banner                                |
| `data-clone`     | a non-cloneable value reached `put`                      | a bug: throws in tests, logs at ERROR in the browser                   | —                                               |
| `corrupt`        | a record failed validation                               | quarantine (§8)                                                        | none (logged)                                   |

## 11. `ResourceController`

The single access for game resources, mirroring the persistence design: one facade, a manifest
as the registry, one loader per asset type, one cache.

```ts
// Sketch: apps/client/src/data/resources/AssetManifest.ts — the ONLY list of assets (02 §9); a script checks files, bytes, hash and licence in CI
export type AssetType = 'image' | 'audio' | 'json' | 'ui-image' | 'font'; // 'ui-image': decoded for the DOM; 'font': DEC-51
export type AssetGroup =
  // a session loads only its layout's and its effects renderer's art (DEC-52, DEC-54)
  | 'boot'
  | 'selection'
  | 'selection-primary'
  | 'selection-alternate'
  | 'selection-raster'
  | 'selection-primary-raster'
  | 'match';
export type AssetManifestEntry = {
  readonly id: AssetId;
  readonly file: AssetFile; // { url, bytes, hash } at device pixel ratio 1
  readonly file2x?: AssetFile; // the same at 2, chosen once per session
  readonly renditions?: Readonly<Partial<Record<RenditionKey, RenditionFiles>>>; // per-use exports (size, rotation, mirroring), each with its files and optional box
  readonly box?: RasterBox; // the draw box of an image placed at the slot it was baked for (a plate, a HUD weapon art)
  readonly type: AssetType;
  readonly group: AssetGroup;
  readonly bytes: number;
  readonly hash: string;
  readonly licence: string;
  readonly source: string;
};
export const ASSET_MANIFEST = {
  version: '1',
  assets: [/* one line per asset */],
} as const satisfies AssetManifest;

// Sketch: apps/client/src/data/resources/ResourceController.ts
export interface AssetLoader<T> {
  readonly type: AssetType;
  load(entry: AssetManifestEntry, onBytes: (loaded: number) => void): Promise<T>;
}
export class ImageLoader implements AssetLoader<ImageBitmap> {} // fetch → blob → createImageBitmap (crops sprite frames from a sheet)
export class AudioLoader implements AssetLoader<AudioBuffer> {} // fetch → arrayBuffer → injected decode (WebAudioOutput's decodeAudioData)
export class JsonLoader implements AssetLoader<Json> {} // fetch → json → injected validator (atlas frame tables; content stays TS in core)
export class UiImageLoader implements AssetLoader<HTMLImageElement> {} // an image decoded for the DOM (decode()); its URL reaches ui/ through the store (DEC-51)
export class FontLoader implements AssetLoader<LoadableFace> {} // a FontFace added to document.fonts; no @font-face, no CDN (DEC-51)
export class AssetCache {
  get<T>(id: AssetId): T;
  has(id: AssetId): boolean;
  set(id: AssetId, group: AssetGroup, value: unknown): void;
  release(group: AssetGroup): void;
} // Flyweight: one decoded object shared by every view
export class ResourceController {
  public constructor(deps: {
    manifest: AssetManifest;
    loaders: readonly AssetLoader<unknown>[];
    cache: AssetCache;
    fetch: typeof fetch;
    logger: Logger;
  }) {}
  public load(group: AssetGroup, onProgress: (p: LoadProgress) => void): Promise<void>; // LoadProgress = { group, loadedBytes, totalBytes, failed: AssetId[] }
  public get<T>(id: AssetId): T; // throws on an unknown id at boot, never mid-frame
  public release(group: AssetGroup): void; // ImageBitmap.close(), drop buffers
}
```

- **Images the DOM shows** (screens and the HUD are React, [13](13-game-interface.md) §3) are
  decoded for the DOM, not as `ImageBitmap`s: `SessionController` publishes the loaded group's
  asset id → URL map as the `asset-urls` event, and `ui/` resolves an id with a selector, so `ui/`
  never names a file (rule 13; DEC-51). Fonts are assets too: `FontLoader` adds Cinzel to
  `document.fonts` from the `boot` group, and `--font-game` names the family first.
- **Density and groups.** The device pixel ratio is read once per session and picks each entry's
  `file` or `file2x`; art only one class-step layout or one effects renderer draws sits in its own
  group, so a session never loads the other's.
- Progress is byte-based from the manifest (`loadedBytes / totalBytes`), monotonic, and ends at
  the manifest sum when every file loads: only the loaded files of a loaded entry count, so a load
  with a failed file ends below the sum; `SessionController` publishes it as `loading-progress` for
  `BootScreen`
  ([research A4](../research/persistence-input-diagnostics-research.md#a4-game-resources-manifests-preloading-caching-progress)).
- Decoders are injected (`createImageBitmap`, the audio decode function, `fetch`), so loader
  tests run in Node with fakes; the cache deduplicates concurrent loads of one id. The typed
  `ASSET_MANIFEST` is the source of truth; the plan's generated `assets/manifest.json` and the
  CI check (files exist, bytes and hash match, `licence` present, ids unique) come from one
  script in `scripts/` (`Recommendation:`).
- No service worker and no Cache API for the MVP: hashed file names from Vite give HTTP caching
  for free; revisit only if offline play becomes a requirement (research A4). Content and
  tuning are TypeScript data in core (`ContentCatalogue`), not assets; the only JSON assets are
  atlas frame tables. The manifest's `licence` and `source` feed `AboutScreen` and the asset
  policy check (plan Phase 6, sprint 6.3).

## 12. Tests

- **Adapter contract suite** (`StorageAdapter.contract.ts` exporting `describeStorageAdapter(name, factory)`,
  [09](09-hardware-abstraction.md) §9): CRUD round trips of structured-cloneable DTOs, index and
  range queries, `readonly` isolation, abort rollback (an error mid-work leaves 0 writes),
  `close` then `open`. Runs against `MemoryStorageAdapter` in Node and `IndexedDbStorageAdapter`
  against an IndexedDB fake (`Recommendation:` `fake-indexeddb`, a dev dependency needing
  approval per `AGENTS.md`; fallback: a hand-written fake of the used subset).
- **Migrations**: open at v1, seed fixtures, reopen with a test `Migration` at v2 adding an
  index and a `transform`; 100 % of records survive; v2 data under v1 code fails with
  `StorageError('version')`, never a hang.
- **Validation, quarantine, units of work**: a corrupt-record fixture set (bad shape, unknown
  content id, unknown action, future version) yields defaults, one quarantine row each and 0
  throws; `saveMatchResult` is atomic on both adapters; the stored replay reproduces the final
  hash in core's replay harness ([15](15-diagnostics-and-runtime-testing.md) §7).
- **Quota, persist, export/import**: exactly one `persist()` call on a fake `navigator.storage`;
  a simulated quota error evicts replays in date order; export → clear → import round-trips equal
  DTOs; a tampered file is refused naming the field.
- **Resources**: a fake `fetch` streams bytes and each loader reports progress; one failed asset
  is a typed error, not a failed group; two parallel `get`s load once; every manifest entry has a
  file, matching bytes and a licence.

## 13. Recipes

| I am adding…                  | Files                                                                                                                                                                       | Plus                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| A persisted record type       | `dto/<Name>Dto.ts` (+ `validate`, `upgrade`, `to`/`from` mappers), `repositories/<Name>Repository.ts` + `Storage<Name>Repository.ts`                                        | one `Migration` entry (store + indexes), one property on `PersistenceController`, contract-suite fixtures     |
| A field or a settings group   | bump `schemaVersion`, extend `upgrade<Name>Dto` and the mappers; or one `group` literal with its `value` DTO and default                                                    | a fixture at the old version in the migration test; one `settingsSlice` field ([13](13-game-interface.md) §5) |
| An asset or a storage backend | one line in its asset group's manifest file (concatenated into `ASSET_MANIFEST`) with `licence` and `source`; or `<Tech>StorageAdapter.ts` passing `describeStorageAdapter` | nothing else (views ask by id); one line in `main.tsx`                                                        |

## 14. Implementation status

Built in Sprint 1 (session F), settings only: `PersistenceController` with `open`,
`loadSettings`, `saveSettings` and `close` (the Sprint 1 brief's facade, in place of §2's
`persistence.settings` repository and `status`); the `StorageAdapter` port with `open`,
`transaction` and `close` (reads return `unknown`; `getAll`, `onVersionChange` and `estimate`
come with their first caller); `MemoryStorageAdapter`, which runs transactions one at a time in
call order, and the `describeStorageAdapter` contract suite; `schema/migrations.ts` v1 with the
`settings` and `quarantine` stores only; `SettingsRepository` (a class, no interface yet), which
reads through the shared `readOrQuarantine`. Interim gaps, to settle before
`IndexedDbStorageAdapter` (S2) fixes v1 on disk:

- Settings are one `SettingsDtoV1` record per profile keyed by `profileId`, not §7's
  `SettingsGroupDtoV1` keyed by `[profileId, group]`; the groups are `audio`, `video` and
  `accessibility` (the Sprint 1 contract's `settingsSlice`), with no `developer` or `storage`
  group yet. Changing the key path after IndexedDB ships needs a new store and a `transform`.
- One profile (`LOCAL_PROFILE_ID`) until the profiles store exists.
- The validation helpers (`isRecord`, `groupProblem`, field checks) are private to
  `dto/SettingsDto.ts`; when S2 adds the second DTO, the common ones move to a shared
  `dto/dtoCheck.ts` beside `DtoCheck.types.ts` (PR #24 review).
- A quarantine is reported through an injected `warn` callback, because `data/` imports core
  types only (§1); `main.tsx` turns it into a `Logger` record. No `degraded` status or memory
  fallback yet (§10): a failed open leaves the settings on defaults.
- **Stored chord modifiers (2026-10-30).** A stored keyboard chord has an optional `modifiers`
  field (DEC-105), added inside schema version 1: records saved before it still read, because the
  field is optional, so no upgrade step was needed and none was written. §13's recipe "A field or
  a settings group" says to bump `schemaVersion`. The branch reads that rule as applying to a
  field old records cannot satisfy (a required, renamed or retyped field); an optional field that
  old records simply lack needs no bump. That reading waits for the owner (`INBOX.md` HC-B4); if he
  keeps the recipe as written, the settings record moves to version 2 with a pass-through upgrade.
  `CHORD_MODIFIERS` in `dto/SettingsDto.ts` lists the allowed names, and a test in
  `settingsState.test.ts` ties that list to the bridge's `ChordModifier` type, so the two cannot
  drift apart.

Resources (`feat/hud-and-character-select`, 2026-10-24; the owner's art and the Cinzel font,
DEC-51). §1 and §11 say this since 2026-10-28 (the owner approved them, `INBOX.md` HC-T1); the
detail:

- **A minimal `ResourceController`** (`data/resources/ResourceController.ts`):
  `load(group, onProgress)` with byte progress from the manifest, `isLoaded`, `progress`,
  `urls(group)` (the URLs the DOM shows), `boxes(group)` (the draw boxes the manifest declares)
  and `release(group)`. The device pixel ratio is read once, so each image's
  1x or 2x file is fixed for the session. Not built yet: `get`, `AssetCache` and the canvas
  `ImageBitmap` path (no sprite atlas exists; Phase 6, sprint 6.3), and the audio and JSON loaders
  (no such assets).
  An asset that fails to load never rejects its group: it is warned about through an injected
  callback and listed in the load's outcome, and a failed rendition falls back to the entry's own
  file; §12's typed error is not built. Progress counts an entry's loaded files once the entry is
  cached, so a failed file never counts (`ResourceController.load`; HC-T1 T-153).
- **The manifest** is typed TypeScript in `data/resources/`: `AssetManifest.ts` concatenates one
  file per asset group (the ~300-line file rule; `selectionAssets.ts` and `matchAssets.ts` join part
  files) into the one `ASSET_MANIFEST`. An entry has a `file` and an optional `file2x` (each with
  URL, bytes and hash), its per-use `renditions`, a `licence` and a `source`. An image placed at the
  spot it was baked for (a plate, a weapon art) also carries its draw `box` (origin and size in px
  of the 1920 × 1080 frame), on the entry or on a rendition. `AssetType` is `'ui-image' | 'font'`.
  The seven groups (`boot`, `selection`, `selection-primary`, `selection-alternate`,
  `selection-raster`, `selection-primary-raster`, `match`) let a session load only its layout's art
  and, with the `'css'` effects renderer, no Figma plates (`game/session/selectionAssetGroups.ts`).
  The build emits every asset as its own file and inlines none into the JavaScript
  (`assetsInlineLimit: 0` in `apps/client/vite.config.ts`, tested), so a group's bytes download
  only when the group loads.
- **Loaders** sit behind the `AssetLoader` port in `data/resources/loaders/`, with the
  `describeAssetLoader` contract suite: `UiImageLoader` decodes images for the DOM, whose URLs reach
  `ui/` through the `asset-urls` event and `assetsSlice` (the event carries the group's draw boxes
  beside its URLs, and `ui/` reads a box by asset id with `useAssetBox`), and `FontLoader` adds
  Cinzel to `document.fonts` from the `boot` group (no `@font-face`, no CDN). Releasing a group
  clears its images' sources and deletes its fonts; no object URLs are created, so none is revoked.
- **Checks.** File integrity is a Vitest test (`AssetManifest.files.test.ts`: every file exists
  with its bytes and SHA-256, and no file in `assets/` lacks an entry), not a `scripts/` check,
  and no `assets/manifest.json` is generated. `AboutScreen` lists the manifest's credits, each
  with its licence text (the `credits` event into `assetsSlice`), so the OFL and MIT notices ship
  in the built game.

## Related

- [03-game-model.md](03-game-model.md) and [12-game-story-and-match-director.md](12-game-story-and-match-director.md): `Replay`, `runReplay`, `GameConfig`, `MatchResult`.
- [09-hardware-abstraction.md](09-hardware-abstraction.md): the `StorageAdapter` port and contract tests.
- [13-game-interface.md](13-game-interface.md) and [15-diagnostics-and-runtime-testing.md](15-diagnostics-and-runtime-testing.md): `SessionController`, `persistenceSlice`, `loadingSlice`, bindings, `Logger`, replay fixtures.
- [../reference/game-design/08-loadout.md](../reference/game-design/08-loadout.md), [11-mvp-scope.md](../reference/game-design/11-mvp-scope.md), [10-art-and-lore.md](../reference/game-design/10-art-and-lore.md): loadouts saved to the profile, the boot menu, the asset policy.
- [../reference/suggestions/mechanics-ideas.md](../reference/suggestions/mechanics-ideas.md): the match history DTO, sim mode, achievements.
- [../plan/phase-5-meta-ui-and-persistence.md](../plan/phase-5-meta-ui-and-persistence.md): sprints 5.1 and 5.2.
- Research: [persistence A1–A4](../research/persistence-input-diagnostics-research.md#a-persistence-designed-like-a-dbms); [ES-10](../requirements/05-engineering-standards.md).
