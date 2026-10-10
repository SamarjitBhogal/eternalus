---
title: Server scalability, matchmaking and player data research
description: Sourced findings and a phased recommendation for the Sprint 3 online requirements (where solo, Duel and future all-human matches run and what each costs, the smallest server that meets "hundreds or thousands" of players, Duel matchmaking and rating, guest accounts and a minimal schema beside IndexedDB, student-budget hosting, load testing, monorepo placement and security); read it before planning or building any server, account, matchmaking or online-stats work.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-10
tags: [research, server, scalability, matchmaking, rating, accounts, hosting, security]
related:
  - 'docs/research/README.md'
  - 'docs/research/works-cited.md'
  - 'docs/decisions/0001-monorepo-npm-workspaces.md'
  - 'docs/decisions/0005-indexeddb-persistence.md'
  - 'docs/architecture/03-game-model.md'
  - 'docs/architecture/14-persistence-and-resources.md'
  - 'docs/requirements/06-mvp-requirements.md'
  - 'docs/plan/README.md'
---

# Server scalability, matchmaking and player data research

## Purpose

Read this before planning or building anything that needs a server: Duel matchmaking, accounts,
online stats, performance-based matchmaking, or "hundreds or thousands of concurrent players"
([`INBOX.md`](../../INBOX.md), "Feedback", "NEW REQUIREMENTS"). It informs ADRs and decides
nothing. The game is browser-only with no server and no accounts today (the runtime row of
[`requirements/README.md`](../requirements/README.md), NFR-013 and NFR-033 in
[`06-mvp-requirements.md`](../requirements/06-mvp-requirements.md),
[ADR 0005](../decisions/0005-indexeddb-persistence.md)); a server, package or dependency needs an
ADR, a catalogue edit (NFR-010) and the owner's approval. Written 2026-10-10. A sibling report
chooses the netcode model (lockstep or server-authoritative); claims that depend on it are marked
**[netcode]**. Values owned by other docs are named, not restated, except as labelled inputs to
the [Capacity estimate](#capacity-estimate).

## Summary and recommendation

- **Keep solo vs-bot 10v10 on the client.** It is the biggest lever: on the server a full-horde
  match at the NFR-021 tick budget costs about a quarter of a core, so the owner's example of 50
  solo players needs 25 to 50 vCPUs; on the client it costs nothing and keeps offline play. Its
  results are client-reported, so they count as offline stats, never toward rating [1].
  Only Duel runs on the server in Sprint 3; one thread should hold tens of Duels (measure it).
- **Smallest architecture: one Node.js 24 process** (`apps/server`) with gateway, presence, Duel
  queue, match host and persistence API as modules, one database, no Redis, no Kubernetes. Grow by
  moving matches to a `worker_threads` pool, then to more processes whose addresses the matchmaker
  hands out [2][3].
- **Rating: Glicko-2 after every Duel**, about 100 lines of pure TypeScript tested against
  Glickman's worked example. Upset wins gain more, losses to weaker players cost more, rating
  deviation tracks games played and inactivity, volatility tracks streaky play [4][5].
  OpenSkill (MIT) is the upgrade for team ratings [6].
- **Matchmaking: one in-memory queue whose rating window widens with wait time** until it accepts
  anyone [7]; with tens of players online a strict skill match means no match.
- **Accounts: guest-first.** The server issues a random 128-bit token the client keeps beside its
  IndexedDB profile [8]; password or OAuth claiming comes later [9].
- **Data: four tables** (players, ratings, matches, match participants) in SQLite via Node's
  built-in `node:sqlite`, or managed PostgreSQL if the host has no disk [10][11].
  IndexedDB keeps offline data; the server owns identity, ratings and online matches; offline
  summaries upload append-only, so there is nothing to merge.
- **Stack: Node 24 (pinned) plus `ws`** (MIT, the one dependency to approve), bundled by Vite 8's
  SSR build (installed), because Node's type stripping cannot run core's source
  [12][13][14]. Wire types go in a new `packages/protocol`.
- **Show scale with headless TypeScript bot clients** playing real Duels through Node's built-in
  WebSocket client, while the server reports connections, tick p99 and event-loop delay p99
  [15][16]. Hosting is the owner's call; Oracle Always Free, Azure for
  Students and Render free all fit a demo, each with a catch ([Options compared](#options-compared)).

## Q1. Server topology for the mixed workload

### Findings

- **Authority.** "Don't trust the player": the server runs the game and clients are "privileged
  spectators" that send inputs [1]. A rating change must come from a server-run match.
- **Lockstep [netcode].** Cheap on bandwidth, but the slowest player sets the pace; Fiedler caps it
  at about 2 to 4 players [17]. Duel fits; all-human 10v10 does not.
- **Threads.** Worker threads "are useful for performing CPU-intensive JavaScript operations" and
  "do not help much with I/O-intensive work"; unlike `child_process` or `cluster` they share memory
  by transferring `ArrayBuffer`s [2]. `monitorEventLoopDelay` reports event-loop delay
  percentiles [16]: when p99 nears a tick (33 ms), matches miss ticks.
- **Routing.** In Colyseus "each Room belongs to a single Colyseus process", clients connect to it
  directly, processes coordinate through Redis, and since 0.15 each process has its own public
  address instead of a sticky proxy [3]. Cloud Run's affinity is "best effort" and its
  instances "do not coordinate or share data" [18]; Fly.io routes to one named machine
  with a `fly-replay: instance=` header [19].
- **Drain.** On SIGTERM Colyseus stops placing rooms on the process, locks its rooms, runs
  `onBeforeShutdown`, waits for zero rooms, then exits [20]. Fly's `kill_timeout`
  defaults to 5 s, maximum 300 s, best-effort [21]. Agones allocates a Kubernetes pod per
  session from fleets, for studios with dedicated-server fleets [22].

### What this means for Eternalus

1. **Solo vs bots stays client-side**, uploading a summary when online. **Duel runs on the server
   [netcode]:** one core `Simulation` per match stepped at 30 Hz by a
   fixed-step loop in `apps/server` (server-authoritative), or a per-tick command relay with an
   optional shadow `Simulation` that decides the result (lockstep). Core stays timer-free; the
   server loop owns time as `GameLoop` does ([03 §7](../architecture/03-game-model.md#7-the-fixed-timestep-contract)).
2. **Scaling ladder; climb only when a metric breaks:** (a) every match on the main thread, until
   tick work passes about 70% of a core or event-loop delay p99 passes about 10 ms; (b) a
   `worker_threads` pool, one worker per core, sockets on the main thread, buffers transferred;
   (c) more processes or machines, the matchmaker returning a process address and a one-time join
   ticket, no sticky load balancer; (d) a container per match, beyond this course.
3. **Drain on deploy:** leave the queue, refuse new matches, let Duels finish up to a cap below the
   host's grace period, void the rest (no rating change), exit. Never deploy during a demo.
4. **All-human 10v10 with hordes** costs the full NFR-021 budget per match plus 20 snapshot streams
   that need delta compression and interest management [23] **[netcode]**. Keep the
   seams (one `Simulation` per match, `packages/protocol`, a match-host module); build it later.

## Q2. Services: what is needed and what is premature

| Service              | Job                                                                           | Sprint 3 form                                                              | Premature now                        |
| -------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------ |
| Gateway              | TLS (at the host), upgrade, origin allowlist, auth, size and rate limits [24] | `node:http` plus `ws` in `noServer` mode, auth in the `upgrade` event [25] | Separate edge tier, API gateway      |
| Session and presence | Who is online and where (home, queue, match), heartbeat, reconnect            | In-memory `Map` keyed by account id                                        | Redis presence (only past 1 process) |
| Duel queue           | Pair queued players, widen the window over time                               | In-memory queue scanned once a second                                      | Open Match, FlexMatch, own process   |
| Match host           | Create, place and run matches; report results                                 | In-process; worker pool when measured                                      | Agones fleets, container per match   |
| Persistence API      | Accounts, ratings, match records, offline-stat upload                         | Repositories over one database, a few HTTP endpoints                       | Data service, ORM, cache layer       |
| Observability        | Metrics and structured logs                                                   | `/metrics` JSON; core's `Logger` port                                      | Prometheus and Grafana stack         |

One such process on one small VM meets "hundreds or thousands" ([Capacity estimate](#capacity-estimate));
all-human 10v10 keeps the same modules, with matches moved to workers and then match processes.

## Q3. Matchmaking and rating

### Findings

- **Elo** measures no reliability: a player back after years and a weekly player move by the same
  points. **Glicko** adds a rating deviation (RD): "game outcomes always decrease a player's RD"
  and idle time "always increases" it; a rating period can be "as short as one minute" [4].
- **Glicko-2** adds volatility, "high when a player has erratic performances (e.g., when the player
  has had exceptionally strong results after a period of stability)"; τ between 0.3 and 1.2; new
  players start at 1500, RD 350, volatility 0.06; it "works best" with 10 to 15 games per player
  per period [5]. Fractional periods allow updates "directly after every game"
  [26]; Lichess runs Glicko-2 [27].
- **TrueSkill** generalises Elo to teams and "any number of competing entities" [28], but is
  patented (US 8,538,910 B2, assignee Microsoft) [29]; TrueSkill 2 adds signals such
  as experience and quit tendency [30]. **OpenSkill** (Weng-Lin) is open-licence,
  multi-team and benchmarked as comparable to TrueSkill [6]; its npm package is MIT
  [31]. Elo lacks reliability, TrueSkill carries licence risk, so Glicko-2 suits 1v1
  and OpenSkill suits teams.
- **Queue widening.** FlexMatch "expansions" relax a rule as tickets wait (its example widens a
  skill gap from 5 to 10 at 15 s and 20 at 25 s; wait times are absolute) [7].

### What this means for Eternalus

| Owner's ask                          | Covered by                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| "More wins against better players"   | Glicko-2's expected score: an upset win moves the rating most [5]                    |
| "Fewer losses against worse players" | The same: a loss to a lower-rated opponent costs more                                |
| Win and losing streaks               | Volatility rises with erratic results [5]; streak counters are derived display stats |
| Matches played online                | RD falls per rated match, rises with inactivity [4]; "provisional" while RD is high  |
| Matches played offline               | Display stat only; client-reported results never change the rating [1]               |

- **Queue (Sprint 3).** Entries hold account id, rating, RD and enqueue time. Once a second,
  oldest first, pair each entry with the closest-rated entry inside a window that grows with wait
  time and is never narrower than the pair's RDs; past a maximum wait, pair with anyone. Window,
  growth and maximum wait are tuning numbers in server config, set by the owner (question 3).
  Record wait p50/p95 and each match's rating gap. Widening to "anyone" is what makes a queue of a
  few players work.
- **Placement.** Only the server computes ratings, so the pure Glicko-2 function lives in
  `apps/server`, tested with Glickman's example [5]. Team ratings (OpenSkill) wait for
  all-human 10v10.

## Q4. Accounts and player data

### Findings

- **Tokens.** Session ids need at least 64 bits of entropy from a CSPRNG; cookies `Secure`,
  `HttpOnly`, `SameSite` [8]. Browsers send cookies on the WebSocket handshake, so
  validate `Origin`, prefer a token in the first message over WSS, keep tokens out of URLs [24].
- **Passwords.** Argon2id (19 MiB, 2 iterations) or scrypt (N = 2^17, r = 8, p = 1) [9].
  Checked locally on Node 24.21.0: those scrypt parameters fail Node's default `maxmem`
  (`ERR_CRYPTO_INVALID_SCRYPT_PARAMS`), need about 128 MiB per hash, and one hash took about 170 ms
  on the development laptop (one run). Password logins are memory-bound.
- **Hosted auth.** Supabase anonymous users convert by linking an identity and "the user id remains
  the same" [32]. Lucia was deprecated in March 2025 [33].
- **Databases.** SQLite "works great" for most low-to-medium-traffic sites and trades high
  concurrency for simplicity [11]; `node:sqlite` needs no flag and is "Stability: 1.2 -
  Release candidate" in Node 24.21.0 [10].

### What this means for Eternalus

- **Guest-first.** On first online use the client calls `POST /accounts` and gets an account id
  (UUID) and a 128-bit random token; the server stores only its SHA-256 (slow hashing protects
  low-entropy passwords, not random tokens: our reasoning). The client keeps both through
  `PersistenceController`, one new repository in ADR 0005's shape. Safari's seven-day eviction and
  private windows can erase them (ADR 0005); claiming the account is the later fix (question 4).
- **Minimum schema.** Wins, losses, streaks and online versus offline counts are queries over
  `match_participants` joined to `matches.source`; cache them only when a query is measured slow.
  Replays (seed plus command log, [03 §9](../architecture/03-game-model.md#9-statehasher-and-replays))
  can be a blob table later.

```sql
-- Sketch (SQLite dialect); names are proposals, not decisions.
CREATE TABLE players (id TEXT PRIMARY KEY, display_name TEXT NOT NULL, token_hash BLOB NOT NULL,
  password_hash TEXT, created_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL);
CREATE TABLE ratings (player_id TEXT NOT NULL REFERENCES players(id), mode TEXT NOT NULL,
  rating REAL NOT NULL, rd REAL NOT NULL, volatility REAL NOT NULL, rated_matches INTEGER NOT NULL,
  updated_at INTEGER NOT NULL, PRIMARY KEY (player_id, mode));
CREATE TABLE matches (id TEXT PRIMARY KEY, mode TEXT NOT NULL,         -- 'duel' | 'solo-bots'
  source TEXT NOT NULL,                                                -- 'server' | 'client' (unverified)
  seed INTEGER, core_version TEXT NOT NULL, content_version TEXT NOT NULL,
  started_at INTEGER NOT NULL, ended_at INTEGER, end_reason TEXT);     -- 'completed' | 'forfeit' | 'voided'
CREATE TABLE match_participants (match_id TEXT NOT NULL REFERENCES matches(id),
  player_id TEXT NOT NULL REFERENCES players(id), team INTEGER NOT NULL, outcome TEXT NOT NULL,
  kills INTEGER NOT NULL, deaths INTEGER NOT NULL, rating_before REAL, rating_after REAL,
  PRIMARY KEY (match_id, player_id));
```

| Data                                           | Source of truth              | Flow                                                                                       |
| ---------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| Settings, keybindings, loadouts, local profile | IndexedDB (ADR 0005)         | None in Sprint 3; later `HttpStorageAdapter` sync ([backlog](../plan/backlog-post-mvp.md)) |
| Offline (solo) match history                   | IndexedDB                    | Summary uploads append-only, `source = 'client'`, keyed by a client-made id                |
| Account id and token                           | Server issues; client caches | Server to client once                                                                      |
| Ratings, online match records                  | Server                       | Server to client, read-only                                                                |

Every record has one writer and uploads are idempotent (`INSERT OR IGNORE` on the client's match
id), so no merge policy is needed, and solo play works with no network.

## Q5. Hosting, cost and demonstrating scale

### Findings

- **Offers** are compared in table E of [Options compared](#options-compared); tutorials still
  quote Oracle's pre-2026 free allowance, which was halved [34][35].
- **Baseline.** "a small cloud server (1 vCPU, 1GB RAM) can typically handle 1,000-2,000 concurrent
  connections for simple games", fewer when the game loop is CPU-heavy [36].
- **Tools.** `k6/websockets` implements the browser WebSocket API on a global event loop [37];
  Artillery's `ws` engine scripts `connect`, `send`, `think`, `loop` and `function` steps
  [38]. Node's WebSocket client is stable since v22.4.0, but Node "does not provide a
  built-in native WebSocket server" [15].

### What this means for Eternalus

- **Bots.** A TypeScript script, built like the server, runs N guest clients in the owner's mix
  (idle on home, queueing, playing real Duels with core's bot controllers, logging in and out),
  from another machine so their CPU does not distort the server's.
- **Procedure.** Ramp 100, 500, 1,000, 2,000 connections, five minutes per step; the last step
  with tick p99 and event-loop delay p99 in budget is the measured capacity.
- **Metrics** (at `/metrics`): connections by state, active Duels, tick p50/p95/p99 and missed
  ticks, event-loop delay p99 [16], CPU, RSS, messages and bytes per second, queue wait
  p50/p95, rating gap, login latency p95, disconnects. The claim: "N players on one X-vCPU server,
  M in K Duels, tick p99 under Y ms", measured, plus the arithmetic below for thousands.

## Q6. Monorepo placement, runtime, libraries and security

### Findings

- **Running TypeScript.** Type stripping is stable since Node v24.12.0 [39] but supports
  only erasable syntax (parameter properties need `--experimental-transform-types`), requires file
  extensions in imports and ignores `tsconfig.json` [12]. Core uses parameter properties
  (`packages/core/src/utils/SeededRandom.ts`) and extensionless imports, so Node cannot run it as
  source. `vite build --ssr <entry>` targets Node, and `ssr.noExternal: true` bundles every
  dependency [13]; Vite 8.3.1 is already installed.
- **`ws`** is MIT [14]; its `maxPayload` defaults to 100 MiB, and `verifyClient` "is
  discouraged" in favour of authenticating in the HTTP `upgrade` event [25]. Alternatives are
  in [Options compared](#options-compared), table F.
- **Security.** Validate `Origin` on every handshake; never `ws://` in production; validate every
  message against schemas and allowlists; 64 KB or less per message; rate limits (OWASP's starting
  point is 100 messages a minute for general apps); per-user connection limits [24].

### What this means for Eternalus

- **Placement.** `apps/server` is the server's composition root. `packages/protocol` holds the wire
  messages and validators as pure TypeScript importing only core's `Command` and `Snapshot` types.
  Rule: client and server depend on protocol and core; nothing depends on client or server. Wire
  types in `apps/server` would make the client import the server; in core they would make the
  simulation own networking. Needs an ADR; a package also touches the root `tsconfig.json` and
  `knip.json` ([ADR 0001](../decisions/0001-monorepo-npm-workspaces.md)).
- **Runtime and libraries.** Node 24 (`.nvmrc`, `engines`); `ws` is the one dependency to
  approve, a PostgreSQL client a second only if the host forces PostgreSQL. Validators follow the
  client's hand-written `DtoCheck<T>` (`apps/client/src/data/persistence/dto/`), not a schema library.
- **Security checklist** (the trust boundary moves to the server, so NFR-013 needs a server clause):
  1. `wss://` only; `Origin` allowlist at upgrade; token in the first message; drop sockets that do
     not authenticate within seconds; `maxPayload` of 64 KB or less, not 100 MiB [25][24].
  2. A token bucket per connection, one live connection per account, per-IP limits on sign-up and login.
  3. Validate every message (type, enums, finite numbers, ranges) before core sees it; stamp each
     `Command` with the sender's own entity; no developer commands online.
  4. The server alone decides kills, outcome and rating; client results are flagged unverified.
  5. Store token hashes only, never log tokens, parameterised SQL only; `npm audit` stays in
     `npm run check` (NFR-015).

## Options compared

**A. Where matches run** (CPU from the [Capacity estimate](#capacity-estimate)).

| Option                             | Server CPU per match              | Offline | Cheat resistance                                  | Verdict                   |
| ---------------------------------- | --------------------------------- | ------- | ------------------------------------------------- | ------------------------- |
| Solo vs bots on the client (today) | 0                                 | Yes     | Not needed: unrated                               | **Recommended**           |
| Solo vs bots on the server         | 0.24 to 0.48 core                 | No      | High                                              | Rejected: cost, no gain   |
| Duel, server-authoritative         | 0.03 to 0.06 core (assumed)       | No      | High                                              | **Recommended [netcode]** |
| Duel, lockstep relay               | About 0, plus optional shadow sim | No      | Verifying results needs cross-machine determinism | Candidate [netcode]       |
| All-human 10v10 with hordes        | 0.24 to 0.48 core plus 20 streams | No      | High                                              | Later                     |

**B. Process model.**

| Option                       | Strengths                            | Costs                                              | When                               |
| ---------------------------- | ------------------------------------ | -------------------------------------------------- | ---------------------------------- |
| Main thread                  | Simplest; one deploy                 | Ticks share a core with sockets                    | Sprint 3                           |
| `worker_threads` pool        | Every core; transferable buffers [2] | Workers must be restarted on crash                 | When tick or event-loop p99 breaks |
| Processes or machines        | Isolation, horizontal growth [3]     | Matchmaker hands out addresses, shares queue state | When one machine is not enough     |
| Container per match (Agones) | Isolation, fleet autoscaling [22]    | Kubernetes                                         | Premature                          |

**C. Accounts.**

| Option                                 | Strengths                            | Costs                                                            | Verdict                    |
| -------------------------------------- | ------------------------------------ | ---------------------------------------------------------------- | -------------------------- |
| Server-issued guest token              | No dependency, no personal data      | Lost if local storage is wiped                                   | **Sprint 3**               |
| Password claim (`node:crypto` scrypt)  | No dependency                        | About 128 MiB and 170 ms per hash at OWASP minimums; reset flows | Later                      |
| OAuth (GitHub, Google, school)         | No passwords stored                  | App registration, redirect flow                                  | Later, owner's call        |
| Supabase Auth (anonymous, then linked) | Hosted; guests convert in place [32] | Ties auth and data to Supabase; free projects pause [40]         | If Supabase hosts the data |

**D. Databases.**

| Option                                   | Strengths                                        | Costs                                                 | Verdict                    |
| ---------------------------------------- | ------------------------------------------------ | ----------------------------------------------------- | -------------------------- |
| SQLite file via `node:sqlite`            | Built in [10]; one writer suits one process [11] | Release-candidate API; needs a persistent disk        | **If the host has a disk** |
| Neon PostgreSQL (free)                   | 100 CU-hours, 1 GB per project [41]              | Suspends after 5 idle minutes [41]; client dependency | If no disk                 |
| Supabase PostgreSQL (free)               | 500 MB, 2 projects, auth included [40]           | Pauses after 7 idle days [40]                         | Alternative                |
| Azure Database for PostgreSQL (students) | 750 h of B1MS for 12 months [42]                 | Credit and time limits; client dependency             | If the team uses Azure     |
| Render PostgreSQL (free)                 | Beside a Render server                           | Expires 30 days after creation [43]                   | Rejected                   |

**E. Hosting** (no team cloud account assumed).

| Platform                   | Free or student offer                                          | WebSockets                                        | Catch                                                                          |
| -------------------------- | -------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Oracle Cloud Always Free   | 2 Arm OCPUs and 12 GB (Ampere A1), two 1/8-OCPU micro VMs [34] | Yes (a VM)                                        | Halved in 2026 [35]; the team runs the VM, TLS and updates                     |
| Azure for Students         | USD 100 for 12 months, no card, full-time students [42]        | Yes on a VM                                       | Free App Service allows "1 hour per day" [42]; the credit runs out             |
| Render free web service    | 750 instance-hours a month [43]                                | Yes; messages keep it awake since 2026-02-24 [44] | Sleeps after 15 idle minutes, then cold-starts [43]                            |
| Fly.io                     | None; trial of 2 machine-hours or 7 days [45]                  | Yes                                               | USD 2.19 a month for 256 MB, 6.70 for 1 GB; egress USD 0.02/GB [45]            |
| Google Cloud Run           | Not researched                                                 | Yes, up to 60 minutes per connection [18]         | Best-effort affinity; billed as active while any socket is open [18]           |
| Cloudflare Durable Objects | 100,000 requests and 13,000 GB-s a day [46]                    | Yes, with hibernation                             | Another runtime; a 30 Hz match never hibernates and bills wall-clock time [46] |

**F. Runtime, libraries and load tools.**

| Option                   | Notes                                                                                                              | Verdict                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Node 24 + `ws`           | Already pinned; MIT [14]                                                                                           | **Recommended**                                                  |
| Node + uWebSockets.js    | Apache-2.0 native addon, "not in the NPM registry" [47]                                                            | Only if `ws` is measured as the bottleneck                       |
| Bun or Deno              | Built-in servers; Bun claims 7x Node with `ws` (Bun 0.2.1 against Node 18.10.0) [48]; `Deno.upgradeWebSocket` [49] | Rejected: splits the toolchain                                   |
| Colyseus                 | MIT "Authoritative Multiplayer Framework for Node.js" [50]: rooms, matchmaking, Redis scaling, drain [3][20]       | Not now: its state sync duplicates core's commands and snapshots |
| Headless TypeScript bots | Node's WebSocket client [15] plus core's bots; real Duels                                                          | **Recommended** for load tests                                   |
| k6 or Artillery          | External tools [37][38]; cannot reuse core                                                                         | Raw connection counts only                                       |

## Capacity estimate

Inputs (spikes A and B in the phased plan replace I1, I2 and I5):

| Id  | Input                                                                   | Value used                      | Status                                           |
| --- | ----------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------ |
| I1  | Tick cost of a full-horde match at the FR-043 cap, reference laptop     | 8 ms (the NFR-021 p95 budget)   | A budget; Phase 3 measures the real cost         |
| I2  | Tick cost of a Duel (two Legends, projectiles, Cathedral, spawning off) | 1 ms                            | Assumption                                       |
| I3  | Server vCPU slowdown versus the reference laptop, `f`                   | 1 to 2                          | Assumption (shared vCPUs)                        |
| I4  | Usable share of a core for ticks                                        | 70%                             | Assumption (GC and I/O headroom)                 |
| I5  | Memory per connection, application state included                       | 100 KB                          | Assumption                                       |
| I6  | Snapshot size and rate                                                  | 16 bytes per entity, every tick | Pessimistic: no deltas, no culling **[netcode]** |
| I7  | Egress price                                                            | USD 0.02/GB                     | Fly.io, North America and Europe [45]            |

1. **Per match.** Horde: 8 ms × 30 ticks/s = 240 ms/s = 0.24 core (0.48 at `f` = 2); Duel: 1 ms ×
   30 = 0.03 core (0.06). Per thread at 70%: horde 0.70 / 0.24 ≈ 2.9, so 2 matches (1 at `f` = 2);
   Duel 0.70 / 0.03 ≈ 23 (11 at `f` = 2).
2. **The owner's example:** 50 solo, 10 in 5 Duels, 6 idle, 3 logging in, 1 logging out, so 70
   connections. Solo on the client: 5 × 0.03 to 0.06 = 0.15 to 0.30 core and 70 × 100 KB = 7 MB,
   one process on one vCPU. Solo on the server adds 50 matches at 2 or 1 per thread: 25 to 50 vCPUs.
3. **1,000 players, same mix:** 714 solo, 143 in 72 Duels, 143 other. Solo on the client: 72 ×
   0.03 to 0.06 = 2.2 to 4.3 cores, so 4 to 7 Duel threads (72 / 23, 72 / 11) on one 4 to 8 vCPU
   machine, plus 100 MB for connections. Duel traffic at about 20 entities: 20 × 16 B × 30 =
   9.6 KB/s per player, × 143 = 1.4 MB/s, about 4.9 GB or USD 0.10 an hour. Solo on the server
   instead: 714 × 0.24 to 0.48 = 171 to 343 cores.
4. **All-human 10v10 with hordes (future):** about 400 entities (two capped hordes, 20 Legends,
   structures, projectiles), so 400 × 16 B × 30 = 192 KB/s (1.5 Mbit/s) per player, × 20 = 3.8 MB/s
   per match, about 13.8 GB or USD 0.28 an hour. 1,000 players = 50 matches = 12 to 24 cores of
   tick work (25 to 50 threads at 70%), about 190 MB/s (1.5 Gbit/s) and USD 14 an hour of egress,
   until delta snapshots and interest management cut it by an order of magnitude [23].

**In one line:** with solo matches on the client, the owner's example needs 0.15 to 0.3 of one core,
and 1,000 players in that mix need 2.2 to 4.3 cores (4 to 7 threads) for 72 Duels; hosting solo
matches on the server would need 25 to 50 vCPUs for the example alone. I2 dominates the Duel
figures: a measured 0.3 ms would cut them threefold.

## Risks

| Risk                                                                                                                 | Likelihood | Mitigation                                                                                 |
| -------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| Server work collides with Phase 3 hordes and AI in Sprint 3 ([plan](../plan/README.md))                              | High       | Staff it explicitly (question 9); use the cut order below                                  |
| Determinism is promised only per machine and browser ([03 §8](../architecture/03-game-model.md#8-determinism-rules)) | Medium     | Matters for lockstep and replay verification **[netcode]**; server-authoritative avoids it |
| `node:sqlite` is a release candidate                                                                                 | Medium     | Node is pinned; repositories hide it; a PostgreSQL adapter is the fallback                 |
| Free tiers change without notice [35]                                                                                | Medium     | Re-check terms the week of deployment; budget USD 5 to 10 a month as a fallback            |
| Guest identity lost to browser storage eviction                                                                      | Medium     | `navigator.storage.persist()` (ADR 0005); account claiming later                           |
| A sleeping or cold-starting service on demo day                                                                      | Medium     | Warm it before the demo; avoid sleeping tiers for the demo                                 |
| The team's first public server is abused                                                                             | Low        | The Q6 checklist and rate limits; only token hashes stored                                 |
| Building Redis, Kubernetes or microservices before a measurement asks for them                                       | Medium     | The Q1 ladder: each rung needs a broken metric                                             |

## Phased plan (Q7)

**Sprint 2 (Oct 19 to 30): spikes and decisions.** Nothing joins the game path before its ADR.

1. ADRs via `/adr`: online play and a server (amends the requirements runtime row, NFR-013,
   NFR-033 and ADR 0005's "no server" context); the packages and dependency rule; database and
   accounts; approval of `ws`. The owner answers the open questions, hosting first.
2. Spike A: core's `Simulation` headless in Node at Duel size and at the largest size Phases 1 and
   2 support; ms per tick (p50/p95) and heap per match (replaces I1, I2).
3. Spike B (once `ws` is approved): RSS per connection and event-loop delay at 1,000, 2,000 and
   5,000 idle connections (replaces I5). Spike C: Glicko-2 tested against Glickman's example [5].

**Sprint 3 (Nov 2 to 13): must exist.**

1. `packages/protocol`: a versioned message union (auth, presence, queue join and leave, match
   found, input, state, match end) with validators.
2. `apps/server`: the gateway with the Q6 checklist, guest accounts, presence, the Duel queue with
   widening, the in-process match host with its 30 Hz loop and drain, Glicko-2 at match end, the
   four tables with a migration ladder, `/metrics`, logging.
3. Client: Duel in the menu, a queue screen, connection state, the guest token through
   `PersistenceController`, offline summary upload.
4. Bot load test, measured capacity table and a rehearsal on the real host, before the Nov 20 freeze.
5. Cut order if late: offline upload, then window widening (plain FIFO), then the worker pool.
   Duel over the server, guest accounts, stored results and the load test stay.

**Later.** Account claiming and display-name rules; worker pool, then more processes with
matchmaker-assigned addresses; PostgreSQL once a second process writes; Redis only with a second
matchmaker; all-human 10v10 with server-hosted hordes, delta snapshots, interest management,
OpenSkill and backfill; settings and loadout sync ([backlog](../plan/backlog-post-mvp.md));
verifying offline results by replay; Agones only beyond the course.

## Open questions for the owner

1. May solo vs-bot matches stay client-side, counting only as "offline matches played"?
2. Is Duel rated from the first match or after placement matches, and is the rating shown as a
   number, as tiers, or hidden? Should streaks change anything beyond Glicko-2's volatility?
3. How long may a player wait before "match anyone"? Should a bot Duel be offered after a timeout?
4. Is guest-only acceptable for Sprint 3? Later: password, GitHub or Google OAuth, or school email?
   Are display names free text, unique, moderated?
5. Which cloud accounts or student credits does the team have, and what monthly budget is
   acceptable (USD 0, or 5 to 10)?
6. Duel disconnects: how long is the reconnect window, is a timeout a forfeit, and may a deploy
   void a running Duel (no rating change)?
7. Which concurrency figure should the Sprint 3 review and the Nov 27 presentation show, and do
   headless bot clients count as "players" for it?
8. Do you approve `apps/server`, `packages/protocol` and `ws` (and a PostgreSQL client if needed)?
9. Who builds the server in Sprint 3, alongside Phase 3?

## Sources

All accessed 2026-10-09 or 2026-10-10. "Read through search excerpts" means the page was read from
search-engine extracts, not fetched in full.

1. Gabriel Gambetta, "Fast-Paced Multiplayer (Part I): Client-Server Game Architecture", gabrielgambetta.com, undated. https://www.gabrielgambetta.com/fpm1.html
2. OpenJS Foundation, "Worker threads", Node.js v26.11.1 documentation, undated. https://nodejs.org/api/worker_threads.html
3. Colyseus, "Scalability", Colyseus 0.18 documentation, undated. https://docs.colyseus.io/scalability
4. Mark E. Glickman, "The Glicko system", glicko.net, undated. http://www.glicko.net/glicko/glicko.pdf
5. Mark E. Glickman, "Example of the Glicko-2 system", glicko.net, 2022-03-22. http://www.glicko.net/glicko/glicko2.pdf
6. Vivek Joshy, "OpenSkill: A faster asymmetric multi-team, multiplayer rating system", Journal of Open Source Software 9(93) 5901, 2024-01-09 (read through search excerpts). https://joss.theoj.org/papers/10.21105/joss.05901
7. Amazon Web Services, "Allow requirements to relax over time", Amazon GameLift Servers FlexMatch developer guide, undated (read through search excerpts). https://docs.aws.amazon.com/gameliftservers/latest/flexmatchguide/match-rulesets-components-expansion.html
8. OWASP, "Session Management Cheat Sheet", OWASP Cheat Sheet Series, undated. https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
9. OWASP, "Password Storage Cheat Sheet", OWASP Cheat Sheet Series, undated. https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
10. OpenJS Foundation, "SQLite", Node.js v24.21.0 documentation, undated. https://nodejs.org/docs/latest-v24.x/api/sqlite.html
11. SQLite, "Appropriate Uses For SQLite", sqlite.org, undated (read through search excerpts). https://sqlite.org/whentouse.html
12. OpenJS Foundation, "Modules: TypeScript", Node.js v24.21.0 documentation, undated. https://nodejs.org/docs/latest-v24.x/api/typescript.html
13. Vite, "Server-Side Rendering", Vite v8.3.4 documentation, undated. https://vite.dev/guide/ssr
14. websockets, `ws` repository README (MIT licence), GitHub, undated. https://github.com/websockets/ws
15. OpenJS Foundation, "WebSocket client" (Learn), nodejs.org, undated. https://nodejs.org/en/learn/getting-started/websocket
16. OpenJS Foundation, "Performance measurement APIs" (`monitorEventLoopDelay`), Node.js v24.21.0 documentation, undated. https://nodejs.org/docs/latest-v24.x/api/perf_hooks.html
17. Glenn Fiedler, "State Synchronization", Gaffer On Games, undated. https://gafferongames.com/post/state_synchronization/
18. Google Cloud, "Using WebSockets" (Cloud Run), last updated 2026-10-07. https://docs.cloud.google.com/run/docs/triggering/websockets
19. Fly.io, "Dynamic request routing" (`fly-replay`), undated (read through search excerpts). https://fly.io/docs/networking/dynamic-request-routing/
20. Colyseus, "Graceful Shutdown", Colyseus documentation, undated (read through search excerpts). https://docs.colyseus.io/server/graceful-shutdown
21. Fly.io, "App configuration (fly.toml)": `kill_signal` and `kill_timeout`, undated (read through search excerpts). https://fly.io/docs/reference/configuration/
22. Agones, "GameServerAllocation Specification", agones.dev, undated (read through search excerpts). https://agones.dev/site/docs/reference/gameserverallocation/
23. Glenn Fiedler, "Snapshot Compression", Gaffer On Games, undated. https://gafferongames.com/post/snapshot_compression/
24. OWASP, "WebSocket Security Cheat Sheet", OWASP Cheat Sheet Series, undated. https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html
25. websockets, `ws` API documentation (`doc/ws.md`), GitHub, undated. https://github.com/websockets/ws/blob/master/doc/ws.md
26. "instant-glicko-2" crate documentation, docs.rs, undated. https://docs.rs/instant-glicko-2
27. Lichess, "Rating systems", lichess.org, undated. https://lichess.org/page/rating-systems
28. Ralf Herbrich, Tom Minka, Thore Graepel, "TrueSkill(TM): A Bayesian Skill Rating System", Advances in Neural Information Processing Systems 20, MIT Press, 2007-01. https://www.microsoft.com/en-us/research/publication/trueskilltm-a-bayesian-skill-rating-system/
29. Google Patents, "US8538910B2 - Determining relative skills of players" (assignee Microsoft Technology Licensing, LLC), undated (read through search excerpts). https://patents.google.com/patent/US8538910B2/en
30. Tom Minka, Ryan Cleven, Yordan Zaykov, "TrueSkill 2: An improved Bayesian skill rating system", Microsoft Research MSR-TR-2018-8, 2018 (read through search excerpts). https://www.microsoft.com/en-us/research/publication/trueskill-2-improved-bayesian-skill-rating-system/
31. Philihp Busby et al., `openskill` (openskill.js, MIT), npm, undated (v4.1.x) (read through search excerpts). https://npmjs.com/package/openskill
32. Supabase, "Anonymous Sign-Ins", Supabase docs, undated (read through search excerpts). https://supabase.com/docs/guides/auth/auth-anonymous
33. Lucia, `lucia` repository README (deprecation notice), GitHub, undated (read through search excerpts). https://github.com/lucia-auth/lucia
34. Oracle, "Always Free Resources", OCI documentation, undated (copyright 2026). https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm
35. InfoQ, report on the Oracle Cloud Always Free Ampere A1 reduction effective 2026-06-15, 2026-07 (read through search excerpts). https://infoq.com/news/2026/07/oracle-cloud-free-tier-limits/
36. Colyseus, "FAQ", Colyseus 0.18 documentation, undated. https://docs.colyseus.io/faq
37. Grafana Labs, "k6/websockets", k6 documentation (latest), undated. https://grafana.com/docs/k6/latest/javascript-api/k6-websockets/
38. Artillery, "WebSocket" engine reference, artillery.io, undated. https://www.artillery.io/docs/reference/engines/websocket
39. OpenJS Foundation, "Node.js v24.12.0 (LTS)" release notes, 2025-12-10. https://nodejs.org/blog/release/v24.12.0
40. Supabase, "Pricing", supabase.com, undated. https://supabase.com/pricing
41. Neon, "Pricing", neon.com, undated. https://neon.com/pricing
42. Microsoft, "Azure for Students", azure.microsoft.com, undated. https://azure.microsoft.com/en-us/free/students
43. Render, "Deploy for Free", Render docs, undated. https://render.com/docs/free
44. Render, "Free web services now remain active while receiving WebSocket messages", Render changelog, 2026-02-24. https://render.com/changelog/free-web-services-now-remain-active-while-receiving-websocket-messages
45. Fly.io, "Resource pricing", Fly.io docs, undated (mentions 2026 snapshot charges). https://docs.fly.io/about/pricing
46. Cloudflare, "Pricing" (Durable Objects), Cloudflare docs, last updated 2026-09-30. https://developers.cloudflare.com/durable-objects/platform/pricing/
47. uNetworking, `uWebSockets.js` repository README, GitHub, undated. https://github.com/uNetworking/uWebSockets.js
48. Oven, "WebSockets", Bun documentation, undated. https://bun.com/docs/runtime/http/websockets
49. Deno, "Deno.upgradeWebSocket", Deno API documentation, undated (read through search excerpts). https://docs.deno.com/api/deno/~/Deno.upgradeWebSocket
50. Colyseus, `colyseus` repository README (MIT licence), GitHub, undated. https://github.com/colyseus/colyseus

Not verified: Microsoft's licence terms for TrueSkill; whether Render's free tier keeps a
persistent disk; Cloud Run's free tier; Ampere capacity availability on Oracle's free tier; `ws`
memory per connection (published figures disagree widely, hence spike B); every tick cost, which is
a budget or an assumption until spikes A and B run.
