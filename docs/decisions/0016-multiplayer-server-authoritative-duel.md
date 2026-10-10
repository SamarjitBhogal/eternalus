---
title: 0016. Server-authoritative Duel on one Node process
description: Proposed decision for the owner's Duel and server-scalability requirements (DEC-36, DEC-37) - the server runs the unchanged core simulation for each Duel in one Node process over WebSocket, solo matches against bots stay in the browser, identity is guest-first and a server database comes later - with the constraints it would supersede, the dependency and folders it asks approval for, and the alternatives rejected; read this before building any networked play or server code.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-10
tags: [adr, multiplayer, server, netcode, duel, scalability]
related:
  - 'docs/research/multiplayer-and-netcode-research.md'
  - 'docs/research/server-scalability-and-matchmaking-research.md'
  - 'docs/reviews/2026-10-10-new-requirements-impact.md'
  - 'docs/plan/multiplayer-and-scalability-plan.md'
  - 'docs/decisions/0001-monorepo-npm-workspaces.md'
  - 'docs/decisions/0003-typescript-everywhere.md'
  - 'docs/decisions/0005-indexeddb-persistence.md'
  - 'docs/decisions/0012-determinism-lint-for-transcendental-math.md'
  - 'docs/requirements/README.md'
  - 'docs/requirements/06-mvp-requirements.md'
---

# 0016. Server-authoritative Duel on one Node process

- Status: proposed (drafted 2026-10-10 for DEC-36 and DEC-37; nothing here is binding until the
  product owner accepts it, and no code, config or dependency changes before then)
- Date: 2026-10-10

## Context

The owner added two requirements due by the end of Sprint 3 (2026-11-13), recorded as DEC-36 and
DEC-37 in `docs/reference/game-design/13-owner-decisions-log.md` (his words are in `INBOX.md`,
"Feedback", committed in `8d0d308`):

- **DEC-36, Duel.** "We must be able to have at least 1 player playing against another", through a
  second game mode, Duel, with matchmaking "looking for any other player currently waiting in a
  Duel queue", a 1v1 inside the closed Cathedral, first to 10 kills. A player database and
  performance-based matchmaking come "in the future".
- **DEC-37, scale.** "Make a server capable of supporting hundreds or thousands of concurrent
  players", with a mixed example (solo matches against bots, Duels, idle and logging-in players),
  "actively … planned for, but … not yet a hard requirement (not until sprint 3)", and a later goal
  of 10v10 matches where every Legend is a human.

Both contradict a written constraint: "browser-only … single player vs. AI bots, no server"
(`AGENTS.md:8-9`, `README.md`, the Runtime row of `docs/requirements/README.md`), the browser as the
only trust boundary (NFR-013, AP-14, ES-08), "browser-only, no server (D3)" in NFR-033, and ADR
0005, whose context rejected a local server as "contradicting no server". Under NFR-010 a
requirement changes only through an ADR plus a catalogue edit; this is that ADR.

What already fits (impact review §1.2): core is pure TypeScript and already runs in Node (its tests
use Vitest's `node` environment); all input is a serialisable `Command` applied on the next tick
(rule 9), and `intent` is already the per-tick input command (03 §3); the `Snapshot` is
structured-clone safe (03 §5); `StateHasher` and seed-plus-commands replays exist (03 §9).
Determinism is promised per machine and browser only (03 §8): the ECMAScript spec leaves `sin`,
`cos`, `atan2`, `exp`, `pow`, `hypot` and `**` implementation-approximated, and engines, even two
versions of V8, differ in practice (netcode research §2).

Forces: about four weeks of a five-student team; hidden state (the Warrior's Veil) that a
competitive mode must not leak; the long-term 10v10 with hordes; and cost. The scalability
research's capacity estimate shows that hosting solo matches against bots on the server would need
tens of vCPUs for the owner's example mix alone, while the Duels in it need a fraction of one core.

## Decision

Proposed; each point names where its detail lives instead of repeating it.

1. **Authority.** The server runs the unchanged `@eternalus/core` `Simulation` for each Duel at the
   fixed tick rate (D9). A client sends only its per-tick `intent` command with a sequence number;
   the server stamps `actorId` from the connection, validates the message, enqueues it for the
   next tick, and sends each client its own `Snapshot`, leaving out what that player may not see (an
   invisible opponent). Clients draw the opponent interpolated between two snapshots. Predicting
   the player's own Legend with server reconciliation is a later step, taken only if the Sprint 2
   netcode spike says the game needs it (netcode research, "Spike plan").
2. **Topology.** One Node process, `apps/server`, hosts the gateway, presence, the Duel queue, the
   match host and later the persistence API as modules. Every Duel steps on the main thread until a
   measured metric breaks the scalability research's ladder (Q1: worker threads, then more
   processes with matchmaker-assigned addresses). No Redis, Kubernetes or separate services.
3. **Transport.** WebSocket: the browser's built-in client and the `ws` library on the server, each
   behind one transport port so WebTransport or a binary encoding can replace them locally later.
   JSON messages first; a binary format only when a measurement asks for it.
4. **Solo matches against bots stay in the browser**, as today. They cost the server nothing, still
   work offline, and their results are client-reported, so they are never trusted for ranking.
5. **Identity is guest-first.** On first online use the server issues an opaque random token that
   the client keeps through `PersistenceController` (one new repository in ADR 0005's shape). No
   passwords, OAuth or personal data. The server database for profiles, match records and ratings
   (DEC-36's "in the future") is a separate, later ADR; the scalability research (Q4) sketches it.
6. **Wire types live in a new `packages/protocol`**: pure TypeScript that imports only core's types.
   The client and the server depend on protocol and core; nothing depends on the client or the
   server; core gains no networking code, so rules 1 to 4 of `AGENTS.md` hold for core unchanged.
7. **The trust boundary moves to the server.** It validates every message (type, enums, finite
   numbers, ranges, size), drops `dev-*` commands from remote players, limits message rate and
   connections, and serves only `wss://` outside development (scalability research Q6 checklist).
   Command handlers reject and never throw, so one bad message cannot end a shared match (audit
   AK-4 is fixed first).
8. **Runtime.** The server is TypeScript (ADR 0003) in the npm workspaces (ADR 0001), on the Node
   version pinned in `.nvmrc`, which every replay records beside its versions (03 §9) so a Node
   upgrade cannot silently change old replays. How the server bundles core (the scalability
   research proposes Vite's SSR build, already installed) is settled by the spike.

### Approval asked for

- **Folders:** `apps/server` (the server's composition root, inside the existing `apps/*`
  workspace glob) and `packages/protocol`. Each adds a root `tsconfig.json` reference and `knip.json`
  entries (ADR 0001), an ESLint block (the server may use Node APIs; core still may not) and test
  and CI wiring: guardrail changes this ADR would authorise.
- **Dependency:** `ws` (MIT) as the server's one runtime dependency, plus `@types/ws` as a
  development dependency if `ws` does not ship its own typings (neither is installed; the spike
  confirms). A database client is not requested here.

### What this would supersede or amend, if accepted

Records are not rewritten (ADR 0011); each change below is the owner's edit, made in the PR that
accepts this ADR or right after it.

| Document                                                                                                  | Change                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR 0005                                                                                                  | Amended in scope: IndexedDB stays the client's store and its one door; the server's own data is a later ADR. Status line notes 0016                                           |
| `AGENTS.md:8-9`, its architecture rules 1-2 and "Where code goes"                                         | Name the Duel server; add the server → core and client/server → protocol directions; add `apps/server` and `packages/protocol` rows                                           |
| `README.md` (opening paragraph)                                                                           | "Single player against AI bots, no server" gains the online Duel                                                                                                              |
| `docs/requirements/README.md`, Runtime row                                                                | Browser-first; a Duel server; no accounts beyond guest tokens until the database ADR                                                                                          |
| NFR-013, AP-14, ES-08                                                                                     | The threat model gains the server boundary (the checklist in point 7)                                                                                                         |
| NFR-033                                                                                                   | "No server (D3)" lifted for the Duel server; the runtime dependency list gains `ws` on the server only                                                                        |
| FR-046, FR-059, FR-088 (and FR-113 to FR-118, NFR-034)                                                    | One human per 10v10 match stays; Duel rows and their conflicts are settled by the owner's answers (plan, open questions)                                                      |
| Architecture 01, 02, 03 §3/§8/§9, 08, 09, 11 §7, 12, 13 §2, 14, 15                                        | A server layer and its import rules, actor stamping, more than one human, Duel rounds, queue phases, server logging; and a new architecture doc for networking and the server |
| `docs/architecture/README.md` (D3 row), `docs/plan/backlog-post-mvp.md` (server persistence), phase 5 doc | "No server" wording                                                                                                                                                           |

ADR 0012 is not changed by this ADR. Banning `Math.hypot` and `**` in core (audit AK-3) is a
separate owner call, needed only if clients generate the Duel arena themselves instead of receiving
it from the server (netcode research §2).

## Consequences

- **Easier.** Only the server decides outcomes, so the per-machine determinism core already has is
  enough: no cross-browser bit-exactness project. Hidden state stays on the server. A player can
  cheat only through their own inputs. The server owns each Duel's seed and command log, which
  become its record, its replay and its dispute evidence. The same model grows to all-human 10v10
  with delta snapshots and relevance filtering (netcode research §4), which lockstep and rollback do
  not.
- **Harder.** The opponent is drawn about two snapshot intervals in the past, and the player's own
  movement waits a round trip until prediction exists. Someone must host, update and secure a
  public server, and a demo now depends on the network. A new workspace, dependency and CI surface
  arrive, and agents treat server work as out of scope until `AGENTS.md` changes.
- **Prerequisites before networking** (plan, "Prerequisites"): AK-4 (a bad command throws out of
  `step()`), AK-6 (the entity id counter outside `GameState` and the hash), the `intent` handler and
  `PlayerController` in core, a non-developer spawn path for match setup (A23-20), one testable
  `createMatch(setup)` (AS-1, AC-1, AC-2), and AK-5, AE-4 and AK-12, because one process now hosts
  many `Simulation`s over shared content.
- **Watch.** Event-loop delay and tick-time percentiles on `/metrics` decide each scaling step;
  the arena geometry must be identical on client and server (a map hash in the match-start
  message, or geometry sent by the server); the Node version is pinned and recorded.

## Alternatives considered

1. **Deterministic lockstep** (inputs relayed, every client simulates). Bandwidth does not grow
   with entity count, but it needs bit-identical simulation in every browser: fdlibm-style ports of
   every approximated `Math` function, an ADR 0012 amendment, and a golden-hash test in Chromium,
   Firefox and WebKit, which needs a browser test runner (a new dependency). The slowest player sets
   everyone's input delay, every client holds the full state (Veil leaks), and a 20-player 10v10
   compounds all three. Rejected.
2. **Rollback (GGPO-style), peer-to-peer over WebRTC.** The fighting-game default with the best
   local feel, but it inherits lockstep's determinism cost, adds a full `GameState` save and
   restore that does not exist, needs signalling plus TURN for some peers, leaks Veil, has no
   referee for a disputed result, and cannot re-simulate a 10v10 with hordes within a frame at the
   NFR-021 tick budget (netcode research §4). Rejected.
3. **A room framework (Colyseus).** Gives rooms, matchmaking and reconnection, but its state
   synchronisation duplicates core's commands and snapshots and it is pre-1.0. Not now; revisit if
   the server outgrows one process.
4. **Running solo matches against bots on the server too.** Verifiable results, but tens of vCPUs
   for the owner's example, no offline play, and no gain while those matches are unranked.
   Rejected.
5. **WebRTC data channels or WebTransport now.** Unreliable delivery avoids head-of-line blocking,
   but WebRTC needs NAT traversal and WebTransport has no built-in Node server; at the tick rate on
   a campus network TCP costs little. Deferred behind the transport port.
6. **Socket.IO.** Not a WebSocket implementation: the browser would need its client library.
   Rejected.
