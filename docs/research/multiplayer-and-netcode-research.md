---
title: Multiplayer and netcode research
description: Sourced comparison of lockstep, rollback and server-authoritative netcode for the Duel mode, with cross-engine determinism limits, 2026 browser transports and Node server libraries, bandwidth estimates for a Duel and a 10v10 match, how the Duel rules map onto the simulation, a recommendation, risks, a Sprint 2 spike plan and the owner's open questions; read it before designing or building any networked play.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-10
tags: [research, multiplayer, netcode, determinism, networking, duel]
related:
  - 'docs/research/README.md'
  - 'docs/research/works-cited.md'
  - 'docs/research/game-architecture-and-performance-research.md'
  - 'docs/architecture/03-game-model.md'
  - 'docs/architecture/08-game-engine.md'
  - 'docs/architecture/15-diagnostics-and-runtime-testing.md'
  - 'docs/decisions/0012-determinism-lint-for-transcendental-math.md'
  - 'INBOX.md'
---

# Multiplayer and netcode research

## Purpose

Read this before planning, designing or building the Duel mode or any other networked play. The
course instructor set a new requirement (the owner said in chat on 2026-10-10 that "our prof" set
it) and the owner relayed it (`INBOX.md`, "Feedback" → "NEW REQUIREMENTS"): a 1v1 online **Duel**,
planned now; must be implemented by the end of Sprint 3 (2026-11-13). It asks for matchmaking
against any waiting player, both Legends inside the closed Cathedral with the outer world
deactivated, first to 10 kills with a match-point system, Legends reset after each kill while map
damage persists, and ultimate cooldowns that persist through death while other abilities reset.
A profile/stats database and skill-based matchmaking come later. Server scalability is a separate
requirement researched in parallel; this report touches it only where the netcode model changes the
server's load.

Research informs decisions; it does not make them ([README](README.md)). External sources were
accessed on 2026-10-09 or 2026-10-10; bracketed numbers refer to [Works cited](#works-cited).
Numbers marked **estimate** are back-of-envelope arithmetic, not measurements; the spike measures
them.

## Summary and recommendation

- **Recommendation: server-authoritative simulation.** A Node process runs the same core
  `Simulation` (`@eternalus/core`), with no networking code in core, at 30 ticks/s; browsers send
  their per-tick `intent` `Command` (03 §3) with a sequence number; the server stamps the `actorId`
  from the connection, enqueues it for the next tick (rule 9 holds), and sends each client its own
  per-seat `Snapshot`, which core filters for what that seat may see (§5). Clients draw the
  opponent interpolated between snapshots and, as a second step, predict their own Legend's
  movement with server reconciliation [8][10][13][14].
- **Why it fits this codebase.** Only the server's engine decides outcomes, so the single-machine
  determinism that ADR 0012 already gives is enough; no cross-browser bit-exactness project is
  needed [8][10]. The server can withhold hidden state (the Warrior's Veil invisibility, `Vision`
  reveals), which lockstep and rollback put on the opponent's machine [17][18]. Commands, the
  structured-clone-safe `Snapshot`, `StateHasher` and replays all keep their roles: the server owns
  the canonical seed + command log, which becomes the match record, the dispute and debugging
  tool and a recovery path (Riot made the League of Legends server deterministic for testing and
  to rewind live games after bugs [19]). Core already runs in Node (its Vitest environment is `node`).
- **Why not rollback, the fighting-game default.** Rollback answers input at once and suits fighting games [7][20], but it
  needs bit-identical simulation across Chrome, Firefox and Safari (the spec lets `sin`, `cos`,
  `atan2`, `exp`, `pow`, `hypot` and `**` differ, and they do differ in practice [1][2][3][5]), a
  full `GameState` save/restore that does not exist, peer-to-peer signalling plus TURN, and it
  leaks Veil. It does not scale to 10v10 with hordes: our own step budget makes re-simulation
  impossible there (§4). Lockstep has the same determinism cost and the worst feel [6][11].
- **Transport: WebSocket now, WebTransport later.** WebSocket needs no client dependency and one
  small MIT server library (`ws`) [24][35]; WebTransport datagrams are Baseline since March 2026
  (Safari 26.4) but Node has no built-in server [21][22][31]. Hide both behind one port so the
  swap stays local. WebRTC is only needed if the owner picks peer-to-peer.
- **Sprint 2 spike:** two browser tabs duelling through a throwaway Node server on the LAN and on
  a remote host, measuring bandwidth, round-trip time, feel at injected delays, prediction
  corrections, and a cross-engine probe of the map generator's hash (Spike plan).
- **Prerequisites from the Sprint 1 audit:** AK-6 (id counter outside `GameState` and the hash)
  and AK-4 (a bad command throws out of `step()`, which on a server ends the match for both
  players) must be fixed before networking; AK-3 and AM-10 (`Math.hypot`, `**`) matter even under
  server authority if clients generate the Cathedral locally (§2).

## 1. Netcode models for a fast 1v1 duel

**Deterministic lockstep.** Every peer sends only its inputs and advances tick _n_ only when it
holds every player's input for _n_ [6][11]. Bandwidth depends on input size, not object count
("network a physics simulation of one million objects with the same bandwidth as just one")
[11], which is why RTS games use it [16]. The costs: input delay "directly proportional to
latency" plus a jitter buffer, and the slowest connection sets it for everyone [6][10]; strict
bitwise determinism, with per-tick checksums to catch desyncs (Age of Empires stopped the game on
"out of sync") [6][16]; late join or reconnect by replaying the whole log or transferring state
[6]; and every client holds the full state, so maphacks (information exposure) are the standard
cheat [17]. SnapNet calls it a poor fit for fighting games and shooters [6].

**Rollback (GGPO-style).** Each client runs its own inputs immediately, predicts the remote
player by carrying the last known input forward, and when the real input arrives restores the
last confirmed state and re-simulates to the present [7][20]. It inherits lockstep's determinism
requirement and adds full-state save/load; re-simulation must fit in one frame (SnapNet's
example: 15 ticks in 16.66 ms, about 1.1 ms per tick), and prediction beyond roughly 100–150 ms
"tends to get unplayable quickly", so a small fixed input delay is the usual tuning knob [7]. It
suits fighting and sports games [7]. Hidden information is exposed exactly as in lockstep.
NetplayJS shows the model in TypeScript over WebRTC, but its last npm release is from 2023 and its
README marks the netcode as work in progress [30][35]: a reference, not a dependency.

**Server authority with prediction, reconciliation and interpolation.** Clients send inputs; the
server simulates and sends snapshots [8][10]. The client predicts its own character and, when a
snapshot acknowledges input _k_, adopts the server state and replays its unacknowledged inputs
[13]. Other entities are drawn in the past between two received snapshots (Gambetta's example:
100 ms at 10 updates/s) [14]; lag compensation rewinds the server to what a shooter saw, at the
cost of occasional hits "behind cover" [15]. No strict determinism is required [8][10]. Snapshot
size grows with the world, so delta compression against the last acknowledged snapshot,
quantisation and per-client relevance matter at scale [8][12]. Because the server chooses what to
send, it can withhold what a player cannot see (VALORANT's fog of war costs under 2% of server
frame time after optimisation) [18]. Colyseus 0.18 ships this model as a TypeScript framework
(fixed server timestep, client prediction, rewind), tied to its own Schema state [28].

**Fit with what exists.** All three models carry the same `Command` union, and the `intent`
command (03 §3) is already the per-tick network input. Lockstep and rollback would exchange
`Simulation.hash()` every N ticks as the desync detector; server authority uses it for
server-side replay checkpoints and tests (15 §7). `Simulation` today exposes `tick`,
`enqueueCommand`, `step`, `snapshot`, `on` and `hash`, with no state save/restore, which only
rollback needs. Server authority needs one new core capability for a first version: a snapshot per
seat that leaves out what that seat may not see (Veil, reveals), provided by core, for example as a
viewer argument to `snapshot()` or a filter strategy in core, because only core knows `Vision` and
`snapshot()` has no viewer today (03 §6). Actor stamping and command filtering sit at the server
boundary.

## 2. Cross-environment determinism

**What the spec guarantees.** ECMA-262 performs `+`, `-`, `*` and `/` "according to the rules of
IEEE 754-2019 binary double-precision arithmetic" and defines `Math.sqrt` as the exact square
root [1][2]. The Math section's note says the behaviour of `acos` … `tanh`, explicitly including
`atan2`, `cos`, `exp`, `hypot`, `pow` and `sin`, "is not precisely specified", and only
recommends fdlibm [1]. `Math.hypot` returns "an implementation-approximated Number value" [1],
and both `Math.pow` and the `**` operator go through `Number::exponentiate`, which is
implementation-approximated too [1][2]. The spec therefore confirms the audit's AK-3 reading:
`hypot` and `**` belong in the same class as the five functions ADR 0012 already bans. One more
subtlety: `Number::toString` leaves the last digit "not always uniquely determined" [2], so a
hash over `JSON.stringify` output (what `StateHasher` does) is only as portable as each engine's
number formatting; hashing the raw float bits would remove that dependency.

**What engines do.** Mozilla's tracker records several distinct `Math` results per platform and
differences between 32- and 64-bit builds [3], and Firefox chooses between the platform `libm`
and fdlibm for `sin`/`cos`/`tan` depending on its fingerprinting-resistance mode [4]. In August
2026 a JavaScript physics engine found that `sin` and `cos` differ between Node 20 (V8 11.3) and
Chrome 149 (V8 14.9), two versions of the **same** engine, while `sqrt` matched; fdlibm-derived
kernels built only from `+ - * /` made both agree at about 1 ULP error and 1.1× cost [5]. So
"everyone uses Chrome" does not make lockstep safe, and a server's Node upgrade can change the bits
of a recorded replay.

**What the repo does.** ADR 0012 bans `Math.sin`, `cos`, `atan2`, `exp` and `pow` outside
`utils/deterministicMath.ts`, whose bodies still call `Math` and whose header already says to
replace them with table or polynomial approximations "if cross-browser replays ever matter".
`**` is review-only and `hypot` is not banned. A grep of this worktree on 2026-10-10 found
`Math.hypot` in `components/Movement.ts` (per-tick movement, AK-3) and also in
`map/MapVillageBuilder.ts` and `map/CathedralInteriorBuilder.ts`, and `**` in
`utils/geometry.ts` (AM-10) and `map/MapSceneryBuilder.ts`; the map files are not in the audit's
lists, and the Cathedral builder generates the Duel arena.

**What lockstep or rollback would need:** fdlibm-style ports of every approximated function in
`deterministicMath.ts`; an ADR 0012 amendment banning `hypot` and `**` (owner's call, per AK-3);
a golden-hash test run in Chromium, Firefox, WebKit and Node, which needs a browser test runner
(a new dependency); hashing float bits instead of decimal strings; AK-6; and, for rollback, a full
`GameState` save/restore. The game architecture research
([§1](game-architecture-and-performance-research.md#1-fixed-timestep-interpolation-and-determinism))
already lists the non-`Math` hazards (iteration order, comparators, update order), which hold in
every model.

**What server authority avoids, and what it does not.** Client prediction runs the same core, but
a 1-ULP difference only causes a correction the reconciliation step already handles [10][13].
Two things remain. The server should pin its Node version and record it with the replay
`versions` (03 §9) so a runtime upgrade cannot silently break old replays [5]. And if each client
generates the Cathedral from the seed, its walls must match the server's for prediction and
drawing; either the generator is made cross-engine exact (AK-3, AM-10 and the two map files
above) or the match-start message carries a map hash and the client falls back to geometry sent
by the server.

## 3. Browser transports and Node server libraries (2026)

| Transport               | Delivery                                                                                                            | Browser support                                                               | Server side                                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WebSocket               | Reliable, ordered, over TCP, so one lost packet delays the ones behind it [21]; no backpressure [24]                | Stable with good browser support; the safe choice for wide compatibility [24] | Node (v26 docs) ships only a browser-compatible WebSocket client, no server [31], so a library is needed                                                                                                |
| WebRTC `RTCDataChannel` | `ordered: false` plus `maxRetransmits` (or `maxPacketLifeTime`) gives unordered, unreliable, UDP-like delivery [23] | Baseline, widely available since January 2020 [23]                            | Needs a WebRTC stack and NAT traversal: STUN suffices "around 85% of the time" by Twilio's estimate, the rest need TURN [25]; geckos.io needs a UDP port range open and advises your own STUN/TURN [26] |
| WebTransport (HTTP/3)   | Reliable streams and unreliable datagrams on one connection, no head-of-line blocking between streams [21][22]      | Baseline 2026 "newly available" since March 2026 [21]; Safari 26.4 [22]       | No built-in Node server in the docs read [31]; MDN points Node users to `@fails-components/webtransport` [21]; needs HTTPS with a certificate [21]                                                      |

Server libraries (licence, latest version and date from npm or GitHub on 2026-10-09 [35]):

| Library                          | Licence       | Latest               | What it gives                                                                                                                                           |
| -------------------------------- | ------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ws`                             | MIT           | 8.22.0, 2026-09-26   | A plain WebSocket server; the browser uses its built-in `WebSocket`                                                                                     |
| `uWebSockets.js`                 | Apache-2.0    | v20.71.0, 2026-09-16 | A C++ WebSocket server for Node; released on GitHub, not on the npm registry [35]                                                                       |
| `socket.io`                      | MIT           | 4.8.4, 2026-09-25    | Rooms, reconnection and buffering, but "NOT a WebSocket implementation": the browser needs its client library [34]                                      |
| `colyseus`                       | MIT           | 0.18.9, 2026-09-30   | Rooms, built-in matchmaking, `allowReconnection`, custom messages, Schema state sync; 0.18 is "intended to be the last release before 1.0" [27][28][29] |
| `@geckos.io/server`              | BSD-3-Clause  | 3.1.0, 2026-03-27    | Unreliable, unordered DataChannel messages between browser and Node, built on `node-datachannel` [26]                                                   |
| `node-datachannel` / `werift`    | MPL-2.0 / MIT | 0.33.4 / 0.25.0      | WebRTC for Node: libdatachannel bindings (C++), or a TypeScript implementation [35]                                                                     |
| `@fails-components/webtransport` | BSD-3-Clause  | 1.6.9, 2026-10-09    | WebTransport support for Node [21][35]                                                                                                                  |

**Reading.** For a 30 Hz Duel on a campus network, TCP head-of-line blocking costs little, and
WebSocket needs no client dependency and one small server one. Colyseus would add matchmaking and
reconnection, but its prediction and state sync are built on its Schema state [28], which
duplicates our `Snapshot` path, and it is still pre-1.0. `ws` with a one-file FIFO queue covers a
1v1 queue; Colyseus is worth revisiting if the scalability research picks a room framework. Any
library is a new dependency and needs the owner's approval.

## 4. Tick rate, bandwidth and scaling

**Tick and send rates.** Keep the simulation at 30 ticks/s (D9). For a Duel the server can send
a snapshot every tick; Colyseus defaults to 20 Hz [29] and Gambetta's example uses 10 Hz [14].
Interpolation needs two snapshots, so the opponent appears about two send intervals in the past:
roughly 67 ms at 30 Hz or 133 ms at 15 Hz, plus jitter (**estimate**).

**Duel (2 Legends, up to ~10 projectiles, occasional destructible updates), estimate:**

| Direction                         | Binary, quantised                                | JSON of today's shapes            |
| --------------------------------- | ------------------------------------------------ | --------------------------------- |
| Client → server, `intent` at 30/s | ~10 B payload + ~60 B TCP/IP/WS headers ≈ 2 KB/s | ~100 B payload ≈ 5 KB/s           |
| Server → client, snapshot at 30/s | ~150–200 B ≈ 5–6 KB/s (≈ 50 kbit/s)              | ~3–4 KB ≈ 100 KB/s (≈ 0.8 Mbit/s) |
| Lockstep or rollback, each way    | inputs only, ≈ 2 KB/s                            | ≈ 5 KB/s                          |

JSON is fine for the spike and probably for the Sprint 3 demo; a binary encoding is an
optimisation, not a prerequisite. Map damage is rare and small (a piece id and its health).

**10v10 humans with hordes (the owner's long-term goal), estimate.** At the planned cap of about
300 units (08 §9), a quantised full snapshot of ~10 B per entity is ~3 KB, which exceeds one
packet; at 20 Hz that is ~0.5 Mbit/s per client and ~10 Mbit/s per match before delta compression
and relevance filtering, and JSON (~100 KB per snapshot) is out of the question. Snapshot models
scale with **entity count**; the known remedies are deltas against the last acknowledged snapshot,
quantisation, per-client relevance and per-object priority under a bandwidth budget [8][9][12].
Lockstep scales with **input count**: 20 players' inputs are ~8 KB/s per client whatever the mob
count [11], but the slowest of 20 connections sets everyone's delay, fog of war in a MOBA becomes
a maphack, and 20 browsers must agree bit for bit [6][10][17]. Rollback scales with **input count
times re-simulation cost**: with our budget of 8 ms per step at 300 units (08 §9), rolling back
three ticks costs 24 ms, more than a 16.7 ms frame, so it is infeasible there [7]. The long-term
game has many entities, hidden information and many players, which points to server authority
with relevance filtering; sending hordes as aggregates (`HordeSnapshot`, 03 §5) is a design option
to study then.

## 5. How the Duel rules map onto the model

- **Mode and arena.** A Duel is a `GameConfig` and content choice, not code (rule 11, 03 §10): a
  map preset with the Cathedral closed, the spawn timeline empty and one Legend per team. Trees
  and buildings are map features, so "outer world deactivated" means spawners and structures do
  not activate, not that the map changes. The kill target (10) lives in config, never in a system.
- **Kills and match point.** A Duel victory condition (12 §6) counts `entity-died` events whose
  victim is a Legend, credits the killer, and emits a match-point event when a player reaches
  one kill short of the target, for the HUD and announcer.
- **Round reset.** On a Legend's death, a Duel rules system ends the round and, after a reset
  delay, respawns both Legends at their spawn points with full health and aether and no status
  effects. Persistent map damage needs no work: only Legends are reset. Doc 12 makes phases
  strictly forward with terminal `victory`/`defeat` for one `playerTeam`; a Duel loops rounds and
  has two humans, so rounds belong inside one in-play phase and the result is a `winner` that
  each client turns into victory or defeat. That is a change to 12 for the owner to sign off.
- **Cooldowns.** `AbilityRuntime.cooldownUntilTick` is stamped at cast and never decremented
  (05), so a cooldown that persists through death needs no timer: the reset sets the
  non-ultimate slots ready and leaves the ultimate slot alone. Which slots reset should be data
  for the mode, not a `switch` on the slot (rule 12). This conflicts with 05/06, where the
  ultimate is a **charge** filled by kills, assists and objective damage that loses N% on death,
  not a cooldown (open question).
- **Disconnect and reconnect.** The server keeps the match; a dropped client gets a grace window
  (Colyseus's `allowReconnection` pattern [29]), then a full snapshot on return. A hidden tab
  stops `requestAnimationFrame` (research §1) and Chrome checks a hidden page's timers once per
  second, and under some conditions once per minute after five minutes hidden [32], so the server must treat input
  silence as "no input", never wait for it. Under lockstep or rollback the other player would
  stall or keep predicting.
- **Pause and forfeit.** Forfeit is a `Command`, so it is in the log and replayable. A pause in an
  online 1v1 is abusable; whether to allow it is the owner's call.
- **Trust boundary.** The server sets `actorId` from the connection and drops `dev-*` commands
  (03 §3 already forwards them only when the developer menu is on). Handlers must reject, never
  throw: AK-4 shows a malformed `dev-spawn` throwing out of `step()`.
- **Per-seat snapshots.** `Snapshot.player` is the HUD of "the human Legend" (03 §5), so core
  builds one snapshot per seat, on the server's request, and omits an invisible opponent unless
  `Vision.isRevealedAt` says the opponent is revealed (the VALORANT pattern [18]). The filter is
  core's (§1), so the server only sends what core returns.
- **Matchmaking.** Sprint 3: a FIFO queue that pairs the first two waiting players, which is the
  owner's wording. Later, with the database, a rating such as Glicko-2 (public domain [33]) can
  drive skill-based pairing.

## Options compared

| Criterion                       | Lockstep with input delay                                | Rollback (GGPO-style), peer-to-peer                              | Server-authoritative + prediction + interpolation                            |
| ------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Latency feel in a Duel          | Every action delayed by latency plus a jitter buffer [6] | Immediate locally; remote corrections, poor past ~100–150 ms [7] | Own movement immediate once predicted; opponent ~2 snapshots behind [13][14] |
| Duel bandwidth (estimate)       | ~2 KB/s each way                                         | ~2 KB/s each way                                                 | ~2 KB/s up; ~6 KB/s binary or ~100 KB/s JSON down                            |
| Grows with                      | Players' inputs; slowest player sets the delay [6][10]   | Inputs × re-simulation CPU [7]                                   | Entities per snapshot; needs deltas and relevance at scale [8][12]           |
| Hidden state (Veil, fog)        | On every client: maphack [17]                            | On every client: maphack [17]                                    | Server can withhold it [18]                                                  |
| Speed and state hacks           | Caught as desync, not prevented from reading state [16]  | Same; peer-to-peer has no referee for a disputed desync          | Server simulates; clients only send inputs [13]                              |
| Desync risk across browsers     | High: needs bit-exact maths [1][3][5]                    | High, plus save/restore bugs [7]                                 | None by design; mispredictions are corrected [10][13]                        |
| Infrastructure                  | Relay or signalling server                               | Signalling server, plus TURN for some peers [25]                 | A simulation server per match                                                |
| New core work                   | Math ports, lint amendment, cross-browser hash CI        | All of lockstep's, plus `GameState` save/restore and AK-6        | AK-4, AK-6, per-seat snapshot filter in core; prediction later               |
| Cost for 5 students in ~4 weeks | Medium-high (judgement)                                  | High (judgement)                                                 | Medium; low-medium without prediction (judgement)                            |
| 10v10 humans with hordes        | Bandwidth fine; delay, fog leaks, 20-way determinism bad | Infeasible re-simulation cost (§4)                               | Works with deltas, relevance and priority [8][9][12]                         |

## Risks

| Risk                                                                                                     | Mitigation                                                                                              |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Hosting: the server must be reachable from the demo network, with TLS if the client is served over HTTPS | Spike step 2 runs on a remote host; agree the host with the scalability research                        |
| The opponent drawn in the past makes hits feel unfair                                                    | Measure in the spike at injected delays; lag compensation for instant-hit abilities only if needed [15] |
| Client prediction takes longer than planned                                                              | Ship v1 without it if LAN feel is acceptable; add movement-only prediction second                       |
| Client and server disagree on the Cathedral geometry                                                     | Map hash in the match-start message; spike probe; fix AK-3/AM-10 and the map files                      |
| A Node upgrade changes `sin`/`cos` bits and old replays diverge [5]                                      | Pin the server's Node version; record it with the replay versions                                       |
| A malformed command crashes a shared match (AK-4)                                                        | Fix AK-4 first; fuzz the server boundary with `randomCommands` (15 §9)                                  |
| JSON snapshots cost bandwidth or garbage collection                                                      | Measure in the spike; binary encoding later behind the same port                                        |
| Sprint 3 already holds Phase 3 (hordes, flow fields, controllers)                                        | The owner re-cuts Sprint 3; Duel needs none of Phase 3                                                  |
| New dependency and new folder approvals arrive late                                                      | Ask now (open questions 2 and 3)                                                                        |

## Spike plan (Sprint 2, Oct 19–30)

Two people, about a week each, on a throwaway spike branch that is never merged; the output is
numbers and a recommendation, not production code.

1. **Headless server loop (days 1–2).** A Node script runs `Simulation` at 30 ticks/s with two
   Warriors in the Cathedral; measure step time. Depends on Phase 1 close (player moves on the
   generated map, plan S2).
2. **Dumb clients (days 2–4).** WebSocket server (`ws`, once approved) and two browser tabs:
   `intent` up, JSON snapshot down, the opponent interpolated, no prediction. Measure bytes per
   second each way, round-trip time on the LAN and to a remote host, and feel with 0, 50, 100 and
   150 ms of delay injected on the server.
3. **Movement prediction (days 4–6).** Predict and reconcile the local Legend's movement
   [13]; count corrections per minute and their size. `Recommendation:` go for Sprint 3 if
   movement feels unplayable without prediction at 100 ms of injected delay and the prototype
   corrects rarely; otherwise prediction is post-MVP.
4. **Cross-engine probe (one day, in parallel).** One page that hashes a fixed set of `sin`,
   `cos`, `atan2`, `exp`, `pow`, `hypot` and `**` results and the Cathedral's generated geometry,
   run in Chrome, Firefox, Safari and Node. Decides whether clients may generate the map
   themselves.
5. **Robustness (days 6–7).** Close and reopen a tab inside a grace window; send a spoofed
   `actorId`, a `dev-spawn` and malformed JSON, and check the server rejects each without stopping.

**Exit:** a spike note in `PROGRESS.md` with the measurements, a go or no-go on prediction for
Sprint 3, approved dependencies and folder, and an ADR draft for the chosen netcode model. Sprint
3 then builds the Duel config and rules in core with tests and a replay fixture, the server, a
client match variant that sends input and draws server snapshots, the FIFO queue, and the score
and match-point HUD.

## Open questions for the owner

1. Approve server-authoritative netcode for Duel (an ADR), rather than peer-to-peer rollback?
2. Where do the server and the shared wire-message types live (for example `apps/server/`, and
   message types in core or a new package)? `AGENTS.md` forbids inventing top-level folders.
3. Approve `ws` as the server dependency, or evaluate Colyseus with the scalability research?
4. Where does the Duel server run for the demo (campus machine, cloud host, a laptop on the
   LAN), and is the client served over HTTPS?
5. In Duel, is the ultimate a timed cooldown, or the kill-charged meter of 05/06 kept through
   death? Does the "lose N% on death" rule apply?
6. What does the match-point system change: an announcement only, win by two, sudden death? How
   do simultaneous kills, self-kills and environment kills score?
7. Round reset details: the delay, projectiles and zones still in flight, aether, status effects,
   and whether players swap spawn sides.
8. Disconnects: grace window length, pause or play on, forfeit on timeout, and whether a
   forfeit counts in future stats.
9. May a player pause an online Duel?
10. Matchmaking in Sprint 3: pure FIFO with no rating? What happens if nobody else is queued
    (keep waiting, offer a bot)?
11. Which browsers must Duel support (Chrome, Firefox, Safari; desktop only)?
12. Does Sprint 3's Phase 3 scope move to make room for Duel?
13. Amend ADR 0012 to ban `Math.hypot` and `**` (AK-3)? Needed if clients generate the arena.

## Works cited

1. Ecma TC39, ECMA-262 (ECMAScript 2027 draft), §21.3.2 "Function Properties of the Math Object" (note; `Math.hypot`, `sin`, `cos`, `atan2`, `exp`, `pow`, `sqrt`). https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-function-properties-of-the-math-object (accessed 2026-10-09)
2. Ecma TC39, ECMA-262 (ECMAScript 2027 draft), §6.1.6.1 "The Number Type" (`Number::exponentiate`, `Number::add`, `Number::multiply`, `Number::toString` notes). https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-numeric-types-number-exponentiate (accessed 2026-10-09)
3. Mozilla Bugzilla, Bug 531915 "Floating point differences between platforms" (fixed in Firefox 93). https://bugzilla.mozilla.org/show_bug.cgi?id=531915 (accessed 2026-10-10)
4. Mozilla Bugzilla, Bug 1823880 "Make fdlibm (sin/cos/tan) fingerprinting resistance precise" (fixed in Firefox 113). https://bugzilla.mozilla.org/show_bug.cgi?id=1823880 (accessed 2026-10-09)
5. digitalbreed, "Simulation diverges between JS engines: Math.sin/Math.cos in the per-step integrator", perplexdotgg/bounce issue #8, Codeberg, 2026-08-03. https://codeberg.org/perplexdotgg/bounce/issues/8 (accessed 2026-10-09)
6. Jay Mattis, "Netcode Architectures Part 1: Lockstep", SnapNet blog, 2023-03-28. https://www.snapnet.dev/blog/netcode-architectures-part-1-lockstep/ (accessed 2026-10-09)
7. Jay Mattis, "Netcode Architectures Part 2: Rollback", SnapNet blog, 2023-04-18. https://www.snapnet.dev/blog/netcode-architectures-part-2-rollback/ (accessed 2026-10-09)
8. Jay Mattis, "Netcode Architectures Part 3: Snapshot Interpolation", SnapNet blog, 2023-06-07. https://www.snapnet.dev/blog/netcode-architectures-part-3-snapshot-interpolation/ (accessed 2026-10-09)
9. Jay Mattis, "Netcode Architectures Part 4: Tribes", SnapNet blog, 2023-09-27. https://www.snapnet.dev/blog/netcode-architectures-part-4-tribes/ (accessed 2026-10-09)
10. Glenn Fiedler, "What Every Programmer Needs To Know About Game Networking", Gaffer On Games, 2010-02-24. https://gafferongames.com/post/what_every_programmer_needs_to_know_about_game_networking/ (accessed 2026-10-10)
11. Glenn Fiedler, "Deterministic Lockstep", Gaffer On Games (undated). https://gafferongames.com/post/deterministic_lockstep/ (accessed 2026-10-09)
12. Glenn Fiedler, "Snapshot Compression", Gaffer On Games, 2015-01-04. https://gafferongames.com/post/snapshot_compression/ (accessed 2026-10-09)
13. Gabriel Gambetta, "Client-Side Prediction and Server Reconciliation", Fast-Paced Multiplayer part II (undated). https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html (accessed 2026-10-09)
14. Gabriel Gambetta, "Entity Interpolation", Fast-Paced Multiplayer part III (undated). https://www.gabrielgambetta.com/entity-interpolation.html (accessed 2026-10-09)
15. Gabriel Gambetta, "Lag Compensation", Fast-Paced Multiplayer part IV (undated). https://www.gabrielgambetta.com/lag-compensation.html (accessed 2026-10-10)
16. Paul Bettner and Mark Terrano, "1500 Archers on a 28.8: Network Programming in Age of Empires and Beyond", Game Developer, 2001-03-22. https://www.gamedeveloper.com/programming/1500-archers-on-a-28-8-network-programming-in-age-of-empires-and-beyond (accessed 2026-10-09)
17. Chris Chambers, Wu-chang Feng, Wu-chi Feng, Debanjan Saha, "Mitigating information exposure to cheaters in real-time strategy games", NOSSDAV 2005. https://research.ibm.com/publications/mitigating-information-exposure-to-cheaters-in-real-time-strategy-games (accessed 2026-10-10)
18. Paul Chamberlain, "Demolishing Wallhacks with VALORANT's Fog of War", Riot Games, 2020-04-14. https://www.riotgames.com/en/news/demolishing-wallhacks-valorants-fog-war (accessed 2026-10-09)
19. Rick Hoskinson, "Determinism in League of Legends: Introduction", Riot Games, 2017-06-20. https://www.riotgames.com/en/news/determinism-league-legends-introduction (accessed 2026-10-10)
20. pond3r, "GGPO" README, GitHub (MIT; no releases, last push 2024-06-26 per [35]). https://github.com/pond3r/ggpo (accessed 2026-10-09)
21. MDN, "WebTransport API" (last modified 2026-09-25). https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API (accessed 2026-10-09)
22. Jen Simmons, "WebKit Features for Safari 26.4", WebKit blog, 2026-03-24. https://webkit.org/blog/17862/webkit-features-for-safari-26-4/ (accessed 2026-10-09)
23. MDN, "RTCPeerConnection: createDataChannel() method" (last modified 2026-09-14). https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel (accessed 2026-10-09)
24. MDN, "The WebSocket API (WebSockets)" (last modified 2026-09-12). https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API (accessed 2026-10-10)
25. Twilio, "Network Traversal Service (STUN/TURN)" (undated, © 2026). https://twilio.com/en-us/stun-turn (accessed 2026-10-09)
26. Yannick Deubel, "geckos.io" README, GitHub (BSD-3-Clause). https://github.com/geckosio/geckos.io (accessed 2026-10-09)
27. Colyseus, "colyseus" README, GitHub (MIT). https://github.com/colyseus/colyseus (accessed 2026-10-09)
28. Colyseus, "Colyseus 0.18 is here", 2026-08-20. https://colyseus.io/blog/colyseus-018-is-here/ (accessed 2026-10-09)
29. Colyseus documentation (0.18), "Room". https://docs.colyseus.io/room (accessed 2026-10-09)
30. Varun Ramesh, "NetplayJS" README, GitHub (ISC). https://github.com/rameshvarun/netplayjs (accessed 2026-10-09)
31. Node.js v26.11.1 documentation, "Global objects" (`WebSocket`). https://nodejs.org/api/globals.html (accessed 2026-10-10)
32. MDN, "Window: setTimeout() method", section "Timeouts in inactive tabs" (last modified 2026-09-03). https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout (accessed 2026-10-10)
33. Mark Glickman, "The Glicko system" (Glicko and Glicko-2 are public domain; glicko2.pdf revised 2022-03-22). http://www.glicko.net/glicko.html (accessed 2026-10-10)
34. Socket.IO, "Introduction" (v4 documentation). https://socket.io/docs/v4/ (accessed 2026-10-10)
35. Package metadata: GitHub REST API (`https://api.github.com/repos/<owner>/<repo>` and `/releases/latest`) for colyseus/colyseus, websockets/ws, uNetworking/uWebSockets.js, geckosio/geckos.io, rameshvarun/netplayjs, murat-dogan/node-datachannel, shinyoshiaki/werift-webrtc, fails-components/webtransport, socketio/socket.io and pond3r/ggpo; npm registry (`https://registry.npmjs.org/<package>`) for the npm packages in §3 (`uWebSockets.js` returned "not found"). (queried 2026-10-09)
