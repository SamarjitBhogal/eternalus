---
title: Multiplayer and scalability plan
description: Draft plan for the two Sprint 3 requirements the course instructor set (Duel multiplayer, DEC-36; a server for hundreds or thousands of concurrent players, DEC-37) - the proposed design in brief, the rule conflicts found, the Sprint 1 audit prerequisites, a proposed re-cut of Sprints 2 to 4 with what moves or is cut and which branch the work lands in, work items, the Sprint 2 spikes with pass/fail criteria, risks and the consolidated owner questions; read this before planning Sprint 2 or starting any Duel, server or matchmaking work.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-10
tags: [plan, multiplayer, duel, server, scalability, sprint-2, sprint-3]
related:
  - 'docs/plan/README.md'
  - 'docs/decisions/0016-multiplayer-server-authoritative-duel.md'
  - 'docs/decisions/0017-balanced-asymmetric-camp-placement.md'
  - 'docs/decisions/0007-phase-branching-model.md'
  - 'docs/research/multiplayer-and-netcode-research.md'
  - 'docs/research/server-scalability-and-matchmaking-research.md'
  - 'docs/reviews/2026-10-10-new-requirements-impact.md'
  - 'docs/requirements/06-mvp-requirements.md'
  - 'docs/reference/game-design/13-owner-decisions-log.md'
---

# Multiplayer and scalability plan

## Purpose

Read this before planning Sprint 2 or starting any Duel, server, matchmaking or load-test work. It
turns the two new requirements (set by the course instructor, relayed by the owner) into a schedule
proposal, names what blocks them and collects every open owner question in one place. It decides
nothing: the re-cut in §5 replaces nothing in [the delivery plan](README.md) until the owner
approves it, and the designs it relies on are **proposed**
([ADR 0016](../decisions/0016-multiplayer-server-authoritative-duel.md),
[ADR 0017](../decisions/0017-balanced-asymmetric-camp-placement.md)). Sources: the
[netcode research](../research/multiplayer-and-netcode-research.md), the
[scalability research](../research/server-scalability-and-matchmaking-research.md), the
[impact review](../reviews/2026-10-10-new-requirements-impact.md) (its ids `N-`, `DU-`, `W`, `Q`
are used here) and the Sprint 1 audit (`docs/reviews/2026-10-09-sprint-1-audit.md` on
`origin/chore/sprint-1-audit`, ids `AK-`, `AS-`, `AC-`, `AM-`, `A22-`, `A23-`).

## 1. The requirements and their source

The course instructor set both requirements: the owner said in chat on 2026-10-10 that "our prof"
set them, as an intentional curveball. The owner relayed them in `INBOX.md` ("Feedback", committed
in `8d0d308`); they are recorded as DEC-36 and DEC-37 in the
[decisions log](../reference/game-design/13-owner-decisions-log.md) and catalogued as FR-113 to
FR-118 and NFR-034 in [06-mvp-requirements.md](../requirements/06-mvp-requirements.md). Deadline
for both: planned now; must be implemented by the end of Sprint 3 (2026-11-13). The relayed text
opens "By the end of Sprint 3, two new items must be implemented, and therefore we must plan for
them" and continues:

> **1. Multiplayer support (DEC-36).** We must be able to have at least 1 player playing against
> another. We have decided the best way to have this work is to do a second game mode called
> "Duel". Duel has matchmaking, looking for any other player currently waiting in a Duel queue.
> Duel spawns both players inside the Cathedral where the doors are closed and the surrounding
> world is deactivated to no longer spawn units or carry structures (environmental buildings,
> trees, etc., unaffected). The players compete in a 1v1, first-to-10-kills match with a
> match-point system. After each kill, like in a standard fighting game, the players reset. any
> damage done to the map during this battle remains in place; only the players reset. Ultimate
> abilities have continuous cooldown, while other abilities do not. Meaning: Your cooldown for an
> ultimate persists through life and death, where your other abilities have standard cooldown and
> reset to fully cooled down upon death. We would like to set up a simple database in the future
> where we can track player's profiles, game IDs, stats, etc. Tracking stats / history will allow
> us to also implement performance-based matchmaking, prioritizing better players against better
> players (more wins against better players, fewer losses against worse players, win streak,
> losing streak, number of total matches played online and offline, etc)
>
> **2. Speed and Support (DEC-37).** Our second requirement is to make a server capable of
> supporting hundreds or thousands of concurrent players. This would mean that scalability is now
> something that needs to be considered. e.g., 50 players doing solo 10v10 battles against bots, 10
> players in 1v1 duels, 6 players idle on home screen, 3 logging in, 1 logging off, etc. Prep for
> this will also put us on the right track to eventually have the 10 v 10 games being all players,
> while still supporting the large legions of mobs. This should actively be planned for, but is not
> yet a hard requirement (not until sprint 3)

## 2. Proposed design in brief

[ADR 0016](../decisions/0016-multiplayer-server-authoritative-duel.md) (proposed) holds the design;
the research holds the evidence. In one paragraph, if the owner accepts it: one Node process
(`apps/server`) would run the same core `Simulation` for each Duel, with no networking code in core;
browsers would send their per-tick `intent` over WebSocket and draw per-seat snapshots, which core
filters for what each seat may see (Veil, reveals), the opponent interpolated; solo matches against
bots would stay in the browser (its own question, 25); identity would be a server-issued guest
token; wire types would live in `packages/protocol`; the database and rating would wait for a later
ADR. The Duel itself would be configuration and content selected by a mode id, not
`if (mode === 'duel')` in systems (impact DU-1, rule 12). Scale would be shown, not assumed:
headless TypeScript bot clients play real Duels against the deployed server while it reports
connections, active Duels, tick and event-loop percentiles (scalability research Q5).

## 3. The Duel rules and the conflicts found

The rules as stated map onto the design as in netcode research §5 and impact §2. Each conflict
below blocks the Duel rules work (W10) until the owner answers the question named (§9).

| Conflict                                                                                                                                                                                                                                                                                                                                                                            | Question |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Ultimate "cooldown" vs the charge meter.** The ultimate has no cooldown in the design: it is a meter filled by kills, assists and objective damage that loses a share on death (FR-059, architecture 05 §6 `UltimateChargeRule`, reference 06). Ability state also dies with the entity (05 §6), so per-player state across lives is needed either way (impact §2.5).             | 36, 37   |
| **Forward-only phases vs repeating rounds.** Architecture 12 §2 makes phase transitions strictly forward, with `victory`/`defeat` terminal for one `playerTeam` (12 §4, §10: `playerTeam`, `hadHuman`). A Duel loops rounds and has two humans: rounds as a sub-state of one in-play phase and a `winner` each client reads (impact DU-2). An architecture change for the owner.    | 24, W2   |
| **The Cathedral interior is presentation only.** `CathedralInteriorBuilder` has no colliders, terrain or doors, is typed as a `MapDefinition` (A22-15) and sits inside blocker A22-1, which moves presentation builders to the client. Its drawn size is larger than the world it stands in (impact DU-4). The arena's gameplay geometry must stay in core when A22-1 lands (DU-3). | 41, 42   |
| **One human per match.** FR-001 (the human player's team), FR-046, architecture 11 §7 (`humanLegendId`) and 12 §4 assume exactly one human; reference 14 §1 has exactly one match type and no picker (impact N-1d, N-1e, N-1g).                                                                                                                                                     | 24, 45   |
| **Fear is bot-only** (`more-abilities.md`), so Colossus Roar does less in a Duel between humans (impact AB-7).                                                                                                                                                                                                                                                                      | 1, 2     |

## 4. Prerequisites from the Sprint 1 audit

Networking builds on these; all are core or client fixes with no product dependency (impact §1.3,
W3 to W5).

| Item                          | Why it blocks networking                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AK-6                          | The entity id counter lives in the factory, outside `GameState` and the hash: two equal hashes can issue different ids, and a server cannot restore a match.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| AK-4                          | A malformed `dev-spawn` throws out of `Simulation.step()`; on a server that ends the match for both players. Handlers must reject.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| AK-3, AM-10 and the map files | `Math.hypot` and `**` are engine-approximated (netcode research §2). Beyond the audit's `Movement.ts`, `FiniteTransformsInvariant.ts` and `utils/geometry.ts`, a grep on 2026-10-10 finds `Math.hypot` in `map/MapVillageBuilder.ts`, `map/MapDecorationBuilder.ts` and `map/CathedralInteriorBuilder.ts`, and `**` in `map/MapVillageBuilder.ts`, `map/MapSceneryBuilder.ts` and `map/MapDecorationBuilder.ts`. Fixed in W3 whatever the netcode: ADR 0012 already has reviewers treat `**` like `Math.pow`, and AK-3 says to fix them. Only adding them to the lint is the owner's call (question 28); it becomes necessary if clients generate the arena. |
| AK-5 (with AE-4, AK-12)       | Injected content skips validation, catalogues are built at import and `deepFreeze` misses children: one server process hosts many matches over shared content.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| AS-1, AC-1, AC-2              | The `Match` lives as long as the viewport, ignores the session's seed, team and class, and its composition root is untested. Online play needs one testable `createMatch(setup)` with an injected command source and a server-chosen seed.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| The `intent` command (N-7)    | `intent` is still `UnsupportedCommandHandler` (`TODO(sholtzman)` in `commands/defaultCommandHandlers.ts`), so `Match` turns intents into `move`/`stop` in the client. The server needs `PlayerController` and the `intent` handler in core.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| A23-20, AK-7                  | The player is spawned with `dev-spawn`, which a server must refuse from clients; replays carry no `versions`, so two builds can disagree silently.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

Sprint 2 code must also not foreclose later all-human matches: impact §3.3 lists the six rules
(all state in `GameState`, no shared mutable state in core, players keyed by seat, and so on).

## 5. Proposed re-cut of Sprints 2 to 4

**Proposal for the owner's approval; [the delivery plan §0](README.md) stays in force until he
approves it.** The current plan has the combat a Duel needs in S2 to S3 and abilities in S4, so a
Duel within the deadline (§1) needs a third track and a reorder. The tracks keep the plan's lanes:
Track A core simulation, Track B client shell, and a new **Track N** for the network and the Duel.

| Sprint                                 | Track A: core simulation                                                                                                                                                                                                                                            | Track N: network and Duel (new)                                                                                                                                                                                                                  | Track B: client shell                                                                                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **S2** Oct 19 – Oct 30                 | Phase 1 close; prerequisites W3 and W4 (§4) in week 1; Phase 2 reordered, sprint 2.2 first (damage pipeline, killer tracking, `CombatSystem` v1), then 2.1; map W7 (A8-1, then DEC-15 if ADR 0017 is accepted); PROTO-01 removal per DEC-35 and its timing question | Decisions (W1, W2: ADR 0016, ADR 0017, dependencies, folders); netcode spike and scale spikes (§7); arena geometry design with the A22-1 split (W9)                                                                                              | W5 `createMatch(setup)` and the match lifetime (AS-1, AC-1, AC-2, A24-1, A24-2); persistence 5.1 and developer menu v1 kept; **loadout and profile screens move to S4**                                |
| **S3** Nov 2 – Nov 13                  | Phase 2 rest a 10v10 needs (2.3, 2.4, 2.6, 2.7; 2.5 shared with the arena); Phase 3.1 to 3.3 (hordes, pathing, minion controller); a minimal 3.5 (phase registry and victory conditions, shared with the Duel); **4.2 ability framework pulled in from S4**         | `packages/protocol`; `apps/server` (gateway with the security checklist, presence, FIFO Duel queue, match host, `/metrics`, drain); Duel mode and rules in core (W10); arena geometry in core; bot load test and capacity table on the real host | Duel entry, queue and connecting phases, network `IntentSource` and a snapshot-driven match variant with interpolation, Duel score and match-point HUD and results; ability bar only as the Duel needs |
| **S4** Nov 16 – Nov 27 (freeze Nov 20) | Phase 3.4 (forest camps), 3.6 (mini-bosses), 3.7 (Legend bots), 3.8 (sim mode, soak); 4.1 and 4.3 class kits per DEC-11 (item 4 below); 4.5 minimal; Phase 6 hardening from Nov 20                                                                                  | Duel hardening and a rehearsal on the real host before the freeze; client prediction only if the spike said go; database and rating only if the owner schedules them before Nov 27                                                               | Phase 4 HUD rest, settings overlay, loadout and profile screens, art and audio, demo script                                                                                                            |

**What moves later or is cut (each a proposal):**

1. Loadout and profile screens: S2 → S4 (the persistence layer stays in S2; loadout variety is
   already cut 8).
2. Phase 3.4, 3.6, 3.7 and 3.8: S3 → S4. Legend bots are MVP-core, so this is the plan's largest
   risk (§8); cuts 5 and 6 (mini-bosses, GreaterBoss) are decided at the S3 review on Nov 13.
3. Cut order items 1 to 4 (art polish, pick-up and throw, manual turret control, corner camps) are
   applied now instead of when late; DEC-12's volatile crystals go with the corner camps.
4. Phase 4 grows with DEC-11. The owner's answers in chat on 2026-10-10 (§9) make every approved
   ability MVP, keep each class's original kit, and keep 3 abilities and 1 ultimate per loadout,
   chosen from the class's set: 13 abilities and 8 ultimates in all (impact §4). What the Sprint 3
   Duel needs (question 30) comes first; the rest lands in S4 after the Duel ships.
5. Server database, saved guest accounts, rating and skill-based matchmaking: after S3; in S4 only
   if the owner wants them in the presentation (question 35), otherwise post-MVP.
6. Client prediction: S4 at the earliest, only on a spike "go"; WebTransport, binary snapshots,
   worker pools and more processes: post-MVP unless a measurement asks for them.
7. All-human 10v10: post-MVP, kept open by impact §3.3.

**Staffing (judgement).** Track N needs about two people through S3. The repo records two roles:
Samarjit Bhogal owns mobs and minions (DEC-33, DEC-35), so Track A's Phase 3 work; Sam Holtzman is
the architecture owner and approves every design change. Everything else is unassigned until the
owner names people (question 31).

**Branches and the deadline (ADR 0007).** `Recommendation:` Track N's task branches target the
phase branch that is open when they merge, as every other track's do
(`docs/process/git-workflow.md`): `phase/2-structures-and-combat` in S2 and, once it is stacked on
that, `phase/3-minions-hordes-and-ai` in S3; the spikes' throwaway branches merge nowhere. The demo
server deploys from a tagged commit of that phase branch, never from a task branch or an untagged
head. `main` takes only finished phases (ADR 0007), and under this re-cut Phase 3 finishes in S4,
so "implemented by the end of Sprint 3" can then only mean: merged into the phase branch with
`npm run check` green, deployed from that tag and shown at the S3 review on Nov 13. The Duel reaches
`main` with its phase PR. If the deadline instead requires the Duel on `main`, it needs a phase that
closes by the end of Sprint 3, and the re-cut changes (question 29).

## 6. Work items

`W` ids are the impact review's (§7), never reused; `MP-` ids are new here. "Unassigned" means the
repo records no role for it.

| Id   | Work                                                                                                                                                                                                                                | Sprint        | After                                                                              | Suggested owner                                                                                                          |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| W1   | Owner answers (§9) and approval of this re-cut                                                                                                                                                                                      | before S2     | —                                                                                  | Sam (owner)                                                                                                              |
| W2   | ADR and doc batch: ADR 0016, ADR 0017, an ADR 0012 amendment if asked, the catalogue edits, the queued status notes (§10)                                                                                                           | S2 week 1     | W1                                                                                 | Sam (architecture owner)                                                                                                 |
| W3   | Determinism and state hygiene: AK-6, AK-4, AK-3, AM-10 and the map files, AK-5, AE-4, AK-12, AK-7                                                                                                                                   | S2 week 1     | —                                                                                  | unassigned                                                                                                               |
| W4   | `PlayerController` and the `intent` handler; a non-developer spawn path for match setup (A23-20); `dev-remove-entity` through `DeathSystem` (A13-1); AK-8 and AK-24 per the W2 ruling                                               | S2            | W3                                                                                 | an upcoming session (the INBOX heading: "THESE DECISIONS MUST BE MADE BY UPCOMING SESSIONS"); Sam approves only doc text |
| W5   | `createMatch(setup)`, match lifetime, `IntentSource` port (AC-20), A24-1, A24-2                                                                                                                                                     | S2            | question 46 (AS-7 C2 / AC-25)                                                      | unassigned                                                                                                               |
| W6   | PROTO-01 removal (18 markers)                                                                                                                                                                                                       | S2            | questions 20, 21; W4 if the spawn path moves                                       | Samarjit (DEC-33, DEC-35)                                                                                                |
| W7   | Map: AM-1, A8-1, then DEC-15 (ADR 0017), then AM-3                                                                                                                                                                                  | S2            | W2                                                                                 | unassigned; reviewer Aryan Walanj (DEC-04)                                                                               |
| W8   | Combat with kill credit: sprint 2.2 plus a basic attack                                                                                                                                                                             | S2            | —                                                                                  | unassigned                                                                                                               |
| W9   | Arena geometry: gameplay layout in core, dressing in the client, closed doors, destructible props (DU-3 to DU-5)                                                                                                                    | S2 design, S3 | questions 41, 42; A22-1                                                            | unassigned; reviewer Aryan Walanj (DEC-04)                                                                               |
| MP-1 | Netcode spike (§7)                                                                                                                                                                                                                  | S2            | `ws` for the spike (question 27); W4 for `intent`, or `move`/`stop` until W4 lands | unassigned                                                                                                               |
| MP-2 | Scale spikes A and B (§7)                                                                                                                                                                                                           | S2            | B after `ws` (question 27)                                                         | unassigned                                                                                                               |
| MP-6 | DEC-13: `plannedMatchSeconds` 1200 → 1800 in `packages/core/src/config/defaultGameConfig.ts`, its "DEC-13 pending" TUNE note removed (impact §5.2); the 03 §10 and 12 §3 prose that quotes the old length, for the owner's approval | S2            | — (the value is answered); questions 10, 11 for the cap and anchors                | unassigned; Sam approves the 03 and 12 text                                                                              |
| MP-7 | DEC-34: the SD-1 and SD-2 text from impact §5.4 (13 §2 `character-select` row, 13 §5, `apps/client/AGENTS.md`), applied by an agent as delegated or after the owner approves it                                                     | S2            | question 19                                                                        | unassigned (client lane); Sam approves the text                                                                          |
| 4.2  | Ability framework (phase 4 sprint 4.2), pulled forward                                                                                                                                                                              | S3 week 1     | W8                                                                                 | unassigned                                                                                                               |
| W10  | Mode seam and Duel rules: mode id, round loop, `KillCountCondition`, round reset, per-player ability state, the cooldown rule; **the per-seat snapshot and its visibility filter in core** (03 §5/§6 change, ADR 0016 point 1)      | S3            | W8, W9, 4.2; questions 36-40                                                       | unassigned                                                                                                               |
| MP-3 | `packages/protocol`: versioned message union and validators                                                                                                                                                                         | S3 week 1     | ADR 0016                                                                           | unassigned                                                                                                               |
| MP-4 | `apps/server`: gateway, presence, FIFO queue, match host (sends each seat the snapshot core filters, filters nothing itself), `/metrics`, drain (impact W11)                                                                        | S3            | MP-3, W3-W5, W10's per-seat snapshot                                               | unassigned                                                                                                               |
| MP-5 | Headless bot clients, load test, capacity table, rehearsal on the real host; MP-1 step 1 and MP-2 spike A re-measured on the real arena (W9) with the Duel rules (W10); CI and branch protection for the new app (AD-1)             | S3 week 2     | MP-4; questions 32, 33                                                             | unassigned; CI and protection: SamarjitBhogal (`main` maintainer)                                                        |
| W12  | Duel screens and the network match variant (DU-9 to DU-12)                                                                                                                                                                          | S3            | W5, MP-3                                                                           | unassigned                                                                                                               |
| W13  | Server database, guest accounts kept, rating, offline-summary upload                                                                                                                                                                | S4 or later   | question 35; a database ADR                                                        | unassigned                                                                                                               |
| W14  | DEC-11 content (every approved ability and each class's original kit, MVP per the owner's answers); DEC-12 only if corner camps survive                                                                                             | S4            | W1, W2                                                                             | unassigned (Phase 4 owners unrecorded, AD-17)                                                                            |

**Scope against impact §7.** Each `W` id keeps the review's meaning; where this plan's row differs:

- W1 covers every §9 question, not only the review's Q1 to Q3 and Q13.
- W2 takes the ADR 0012 lint amendment from the review's W3 (ADR 0017 is the review's ADR 0009
  amendment, CW-1). DEC-13 and SD-1/SD-2, which the review put in W2, are split out as MP-6 and
  MP-7 because they carry code or delegated text.
- W3 adds the map files with `Math.hypot` and `**`.
- W10 adds the per-seat snapshot and its visibility filter in core (ADR 0016 point 1).
- W11 is split into MP-3 (protocol) and MP-4 (server); the id W11 is not used here.
- W12 adds the client's network match variant and its transport port (ADR 0016 point 3).
- W13 is the server database, rating and offline upload, S4 or later; the review's W13 is online
  identity, an `HttpStorageAdapter` and stats integrity after W11.
- W4 to W9 and W14 match the review.

## 7. Sprint 2 spikes

Both run on throwaway branches that are never merged; the output is measurements in `PROGRESS.md`
and a go or no-go, not production code. Each threshold carries the label it has in the research,
and the owner may change any of them: the capacity inputs I1, I2 and I5 are **assumptions**
(scalability research, "Capacity estimate"); the scaling-ladder thresholds (scalability research
Q1) and the prediction trigger (netcode research, spike step 3) are `Recommendation:` values.

**Stand-in arena.** The Cathedral interior has no gameplay geometry until W9 (DU-3), so the S2
spikes use the default generated map, with both Legends placed at the middle lane's Cathedral
capture point and nothing else spawned. Its numbers are provisional: MP-5 re-measures them in S3 on
the real arena with the Duel rules.

**MP-1, netcode** (netcode research, "Spike plan", steps 1 to 5):

| Step                                                                                                              | Pass                                                                                                                                                                                        | Fail, and what follows                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Headless loop: two Legends in the stand-in arena, stepped in Node at the tick rate                                | Step p95 recorded and at or below the Duel tick cost assumed in the scalability research (capacity input I2, an assumption)                                                                 | Above I2: re-derive the capacity table. Above the NFR-021 per-tick budget: one Duel costs a full 10v10, so revisit ADR 0016 |
| Two browser tabs through the server, `intent` up (or `move`/`stop` until W4 lands), JSON snapshots down           | A Duel plays on the LAN and to a remote host; bytes per second each way and round-trip time recorded; the owner rates feel at each injected delay                                           | The server misses ticks with two clients, or the clients' view drifts from the server's beyond one snapshot                 |
| Movement prediction                                                                                               | **Go** into S3 if movement feels unplayable without it at 100 ms of injected delay and the prototype corrects rarely (`Recommendation:`, netcode research spike step 3); otherwise post-MVP | —                                                                                                                           |
| Cross-engine probe (Chrome, Firefox, Safari, Node)                                                                | Selects the arena path, it cannot fail: equal geometry hashes let clients generate the arena behind a map-hash check; unequal ones mean the server sends geometry                           | —                                                                                                                           |
| Robustness: spoofed `actorId`, `dev-spawn`, malformed and oversized messages, a `randomCommands` fuzz run (15 §9) | Each is rejected and the match keeps stepping                                                                                                                                               | Any input ends the match: fix before S3 starts                                                                              |

**MP-2, scale** (scalability research, "Phased plan", spikes A and B):

| Spike                                                                                                          | Pass                                                                                                                                                                                              | Fail, and what follows                                                              |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| A: `Simulation` headless at Duel size and at the largest size Phases 1-2 support; tick p50/p95, heap per match | One Node thread steps the owner's example (five Duels) with event-loop delay p99 under the ladder's first event-loop threshold (a `Recommendation:`, scalability research Q1); I1 and I2 replaced | It cannot: the worker pool (ladder rung b) moves into S3                            |
| B: 1,000, 2,000 and 5,000 idle authenticated connections; RSS per connection, event-loop delay                 | One process holds 1,000 with event-loop delay p99 under the same threshold; I5 replaced                                                                                                           | Fewer than 1,000: "thousands" needs more processes (rung c); re-plan MP-4 before S3 |

Glicko-2 (the research's spike C) waits for the database decision (question 35) and for whether the
owner's matchmaking factors must be explicit inputs (question 49).

## 8. Risks

| Risk                                                                                           | Likelihood | Mitigation                                                                                                          |
| ---------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Duel, server and the 10v10 MVP-core do not all fit by the Nov 20 freeze with five people       | High       | §5 cuts now; the S3 review decides cuts 5 and 6; the Duel and the 10v10 share combat, abilities and the director    |
| DEC-11 makes Phase 4 13 abilities and 8 ultimates, all MVP, in S4 before the Nov 20 freeze     | High       | 4.2 in S3 (the Duel needs it anyway); `TUNE` placeholders if the owner allows them (question 3); S3 review re-plans |
| Approvals (ADR 0016, folders, `ws`) arrive late and block the spike, then S3                   | High       | Ask in W1 before Oct 19; the spike needs `ws` (question 27)                                                         |
| Agents keep treating server work as out of scope (`AGENTS.md:8-9`)                             | High       | The owner edits `AGENTS.md` when he accepts ADR 0016                                                                |
| Prerequisites slip and the server is built on the client-side `Match`                          | Medium     | W3 to W5 first in S2; MP-4 starts only after them                                                                   |
| The arena is not playable geometry in time (presentation-only interior, A22-1, scale mismatch) | Medium     | W9 design in S2; questions 41 and 42 answered in W1                                                                 |
| Rule conflicts (§3) stay open and block W10                                                    | Medium     | Questions 36 to 40 in W1                                                                                            |
| Three tracks collide in `Simulation`, `Match` and `SessionController`                          | Medium     | `createMatch` (W5) before W12; disjoint file sets per task                                                          |
| Demo-day hosting: sleeping tier, TLS, campus network                                           | Medium     | Rehearse on the real host before the freeze; never deploy during a demo; avoid sleeping tiers                       |
| The opponent drawn in the past feels unfair                                                    | Medium     | Measured in MP-1 at injected delays; prediction on a "go"                                                           |
| A public server is abused                                                                      | Low        | ADR 0016 point 7; tokens stored hashed when stored at all                                                           |
| A Node upgrade changes `sin`/`cos` bits and old replays diverge                                | Low        | Node pinned in `.nvmrc`; recorded with replay versions once 03 §9 changes (ADR 0016 point 8)                        |

## 9. Open questions for the owner

One de-duplicated list from the netcode research, the scalability research, the impact review (its
`Q` id is shown where one exists), `INBOX.md` "Decisions needed from Sam", ADR 0017 and the
architecture review of this plan. Answer inline here or in `INBOX.md`.

**Answered by the owner in chat on 2026-10-10 (quoted exactly) and removed from this list:**

- "all of these for MVP": Fan of Sorrows, Sunder, Colossus Roar, Aether Lance and the
  Sunder–Sanctuary combo are MVP (DEC-11's MVP status).
- "on top of the abilities that i had originally put forward in the reference docs": each class
  keeps its original kit, including the ultimates Fury; Berserk and Meteor Fall; Death Ray and
  Nova, and the approvals add to it (Q3's Rip & Tear part, Q4).
- "a player chooses 3 abilities and 1 ultimate from the set of abilities and ultimates that are
  available to their class when selecting/creating their loadout": the approvals are a loadout
  pool and the 3 + 1 rule stands (Q3).
- The source of DEC-36 and DEC-37: the course instructor ("our prof"), §1.

**DEC-11, abilities**

1. What does a `feared` unit do, and does `control-immune` cover it? (Q5)
2. Your Colossus Roar row gives Legends only the slow: does that hold in a Duel between humans? (Q14)
3. Costs, cooldowns and magnitudes for the unpriced abilities, or may agents use `TUNE` placeholders?
4. Approve the architecture 05 §8 and §17 edits: `feared`, `insanity`, `summon`, `reveal` and combos as MVP?

**DEC-12, volatile crystals (only if corner camps survive the cut)**

5. Do crystals turn volatile on `boss-summoned` or at the mid-game mark, and ever if the boss is cut? (Q15)
6. What does `insanity` do, for how long, and what are its display name and icon? (Q15)
7. What are the shockwave's radius and damage, and does it hit every team?
8. How much health does a volatile crystal have, and who may break it?
9. Does a destroyed corner camp stay gone for the rest of the match?

**DEC-13, 30-minute match**

10. Score cap: scale it to 4050 s (the scaled default) or keep 2700 s? (Q16)
11. What are your numbers for the balance anchors tied to the old length (boss levels, match-length metrics, soak)?

**DEC-15, camps ([ADR 0017](../decisions/0017-balanced-asymmetric-camp-placement.md))**

12. Does random, parity-checked placement also apply to the corner camps? (Q17)
13. Is parity checked per side only, or per corridor too? (Q17)
14. Which classes does a corridor with other than three camps hold?
15. One side's camps may sit nearer its lanes or Stronghold: acceptable, or should the generator bound it?
16. Class by depth band (ADR 0017's proposal) or by depth rank within the corridor (impact CW-4)?
17. If a corridor is too narrow for a class's band, is a rejected config acceptable, or should it fall back?
18. Accept ADR 0017?

**Session D (DEC-34)**

19. Approve the SD-1 and SD-2 text (impact §5.4), or confirm agents apply it as delegated?

**PROTO-01 (DEC-35)**

20. Is the escort deleted before real hordes exist, or together with them? (Q18)
21. Is "this sprint" S1 (ends Oct 16) or S2? (Q18)
22. May the bot-AI system's file live under `systems/`, or must it stay in `ai/`? (Q18)
23. Add the `PROTOTYPE(<id>) TEMPORARY` marker convention to `AGENTS.md`? (Q18)

**Multiplayer approvals**

24. Accept [ADR 0016](../decisions/0016-multiplayer-server-authoritative-duel.md), the server-authoritative Duel? (Q2)
25. Separately: may solo 10v10 matches stay in the browser, with those players connected to the server but not simulated there? (Q13)
26. Approve `apps/server`, `packages/protocol`, `ws` and, if needed, `@types/ws`?
27. May the Sprint 2 spike use `ws` on a throwaway branch before ADR 0016 is accepted?
28. Amend ADR 0012 so the lint also bans `Math.hypot` and `**` in core (W3 fixes them either way)?
29. Approve or change the re-cut (§5), incl. applying cuts 1 to 4 now (cutting corner camps drops DEC-12) and the branch rule? (Q1)

**Scope, staffing and the demo**

30. What does the Sprint 3 Duel include: basic attacks only, or abilities, and which kits? (Q1)
31. Who staffs Track N in Sprints 2 and 3?
32. Which concurrency figure must the S3 review and the Nov 27 presentation show; do bot clients count? (Q19)
33. Where does the demo server run, on which accounts or credits, within what budget; is the client on HTTPS?
34. Which browsers must the Duel support; desktop only?
35. Is the database (profiles, match records, ratings) wanted before the Nov 27 presentation, or after the MVP?

**Duel rules**

36. Is the Duel ultimate a timed cooldown, or the FR-059 meter kept through death; does the loss on death apply? (Q9)
37. Do non-ultimate cooldowns also reset on death in the 10v10 mode? (Q10)
38. What does match point change: an announcement only, win by two, sudden death? (Q8)
39. How do simultaneous kills, self-kills and environment kills score? (Q8)
40. Round reset: the delay; projectiles and zones in flight; ability-placed summons such as Shield Wall and burning ground (map damage or player state?); aether; statuses; side swap?
41. How large is the Duel arena in metres? (Q6)
42. Does the outer world exist in a Duel, and are its structures inert or absent? (Q7)
43. May a player pause an online Duel?
44. Disconnects: the reconnect window, forfeit on timeout, does a forfeit count in stats, may a deploy void a Duel?
45. Which pre-match screens does a Duel keep, and does the server assign sides?
46. Who owns and creates the `Match`: `SessionController`, `GameCanvas` or `Match` itself (audit AS-7 C2 / AC-25)?

**Matchmaking, identity and data**

47. Sprint 3 queue: first-come pairing; how long may a player wait, and is a bot Duel offered then?
48. Rating, once it exists: from the first match or after placement matches; a number, tiers or hidden?
49. Must your matchmaking factors (streaks, online and offline match counts) be explicit rating inputs?
50. Identity: guest-only for Sprint 3; which later login; display names; any personal data? (Q11)
51. Do solo matches against bots count toward rating, or only toward history? (Q12)
52. May the server re-simulate submitted replays to verify results? (Q12)

## 10. Orphaned agent requests in `INBOX.md`

The sessions that wrote "Requests for the agent" are gone, and the INBOX heading says "THESE
DECISIONS MUST BE MADE BY UPCOMING SESSIONS". Upcoming sessions absorb them as the impact review's
§6 maps them; Sam keeps only the approval of architecture, ADR and `AGENTS.md` text.

| Request (author, date)                                                                                          | Absorbed by                                                            |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Session C → Sam, 2026-10-08: `PlayerController` and the `intent` handler                                        | W4, S2, by an upcoming session; a Duel prerequisite                    |
| Session C → Sam, 2026-10-08: focus-loss release and `IntentSource` (optional)                                   | Ruling in W2 (AC-20, AC-21); built in W5; the port is the network seam |
| Session A (from B), 2026-10-07: stand-in swap to `GameConfig` and `SeededRandom`                                | W7 (A8-1 after AM-1), before DEC-15                                    |
| Session C (from B), 2026-10-07: kernel checklist, all done but (3)                                              | W4; then the item moves to Done                                        |
| Session C → Sam, 2026-10-07: `dev-remove-entity` through `DeathSystem`; may `diagnostics/` import `components/` | W4, option (a) with the fixture re-recorded; AK-2 ruling in W2         |
| Session C → session H, 2026-10-07: `Simulation` takes one options object                                        | Done already (AD-20); move to Done                                     |
| Session C → Sam, 2026-10-07: pipeline and invariants as classes; seed and severity on violations                | Ruling in W2 (AK-8, AK-24), then W4                                    |
| Session C → Sam, PR #14 review items (1) to (10)                                                                | W2, one doc and approval batch                                         |
| Session H → Sam and F, 2026-10-07: log sinks' folder; first-frame tick count                                    | W2 (docs); W5 wires the sinks                                          |
| Session C/H → Sam, 2026-10-09: status notes for 08 §11 and 09 §11                                               | W2 (AC-3)                                                              |
| F → G, 2026-10-06: mount the pause overlay                                                                      | W5 (A24-2); pausing an online Duel is question 43                      |
| F → session H, 2026-10-09: settings and bindings inside the match                                               | W5 (A24-1)                                                             |

## Related

- [Delivery plan](README.md) · [PROGRESS.md](PROGRESS.md) · [post-MVP backlog](backlog-post-mvp.md)
- [ADR 0016](../decisions/0016-multiplayer-server-authoritative-duel.md) ·
  [ADR 0017](../decisions/0017-balanced-asymmetric-camp-placement.md) ·
  [ADR 0005](../decisions/0005-indexeddb-persistence.md) ·
  [ADR 0007](../decisions/0007-phase-branching-model.md) ·
  [ADR 0009](../decisions/0009-config-driven-map-generation.md)
- [Netcode research](../research/multiplayer-and-netcode-research.md) ·
  [Scalability research](../research/server-scalability-and-matchmaking-research.md) ·
  [Impact review](../reviews/2026-10-10-new-requirements-impact.md)
- [MVP requirements](../requirements/06-mvp-requirements.md) ·
  [Owner decisions log](../reference/game-design/13-owner-decisions-log.md)
