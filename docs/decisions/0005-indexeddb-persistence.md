---
title: 0005. IndexedDB behind a single PersistenceController
description: Chooses the browser's IndexedDB, wrapped by one controller, typed repositories and a StorageAdapter port, as the "database configuration" for a no-server game; read this before touching profiles, loadouts, settings, match history or replays.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [adr, persistence, indexeddb, dbms]
related:
  [
    'docs/architecture/14-persistence-and-resources.md',
    'docs/research/persistence-input-diagnostics-research.md',
  ]
---

# 0005. IndexedDB behind a single PersistenceController

- Status: accepted (product owner decision, 2026-09-30)
- Date: 2026-09-30

## Context

The requirements ask for a "database configuration (single access with a controller in
front)" covering persistent storage (profiles, saved loadouts, settings and keybindings, match
history, achievements) and game resources, while the scaffold is explicitly "browser-only, no
server". Data must survive reloads, be versioned, and be replaceable by a real server database
later without touching game code.

Options considered:

1. IndexedDB behind one `PersistenceController` facade, repositories and a `StorageAdapter` port.
2. `localStorage` JSON behind the same facade (simplest; 5 MiB cap; synchronous).
3. A local Node + SQLite server with a REST controller (a real DBMS, but a second runtime and
   deployment surface, contradicting "no server").

## Decision

**Option 1.** IndexedDB is the browser's database: object stores, indexes, transactions,
integer schema versions with `onupgradeneeded` migrations, and per-origin quotas in the
gigabytes (research report §A). It is wrapped once (`data/persistence/idbPromises.ts`, ~30
lines, no dependency), used only by `IndexedDbStorageAdapter`, and exposed to the rest of the
client only through `PersistenceController`, the single access point. Repositories map
versioned DTOs to domain objects and validate on read; corrupt records are quarantined, never
fatal. A `MemoryStorageAdapter` serves tests and private-mode fallback; an `HttpStorageAdapter`
can replace IndexedDB later with no change above the port. Game resources go through a
parallel `ResourceController` (assets are content, not records).

## Consequences

- Schema changes are migrations in one ladder; DTOs are versioned (`…DtoV1`); IDs of content
  referenced by saved data never change.
- Replays are stored as seed + command log + versions, not full state, so determinism is a
  hard requirement for persistence too.
- Safari's seven-day eviction and private mode mean local data is a cache the player can
  export/import; `navigator.storage.persist()` is requested once.
- No new npm dependency (`idb` is not added); the wrapper is tested with an adapter contract
  suite run against both adapters.
