---
title: Multiplayer and scalability plan
description: Draft plan for the owner's two Sprint 3 requirements (Duel multiplayer, DEC-36; a server for hundreds or thousands of concurrent players, DEC-37) - the target design in brief, the rule conflicts found, the Sprint 1 audit prerequisites, a proposed re-cut of Sprints 2 to 4 with what moves or is cut, work items, the Sprint 2 spikes with pass/fail criteria, risks and the consolidated owner questions; read this before planning Sprint 2 or starting any Duel, server or matchmaking work.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-10
tags: [plan, multiplayer, duel, server, scalability, sprint-2, sprint-3]
related:
  - 'docs/plan/README.md'
  - 'docs/decisions/0016-multiplayer-server-authoritative-duel.md'
  - 'docs/decisions/0017-balanced-asymmetric-camp-placement.md'
  - 'docs/research/multiplayer-and-netcode-research.md'
  - 'docs/research/server-scalability-and-matchmaking-research.md'
  - 'docs/reviews/2026-10-10-new-requirements-impact.md'
  - 'docs/requirements/06-mvp-requirements.md'
  - 'docs/reference/game-design/13-owner-decisions-log.md'
---

# Multiplayer and scalability plan

## Purpose

Read this before planning Sprint 2 or starting any Duel, server, matchmaking or load-test work. It
turns the owner's two new requirements into a schedule proposal, names what blocks them and
collects every open owner question in one place. It decides nothing: the re-cut in §5 replaces
nothing in [the delivery plan](README.md) until the owner approves it, and the designs it relies on
are **proposed** ([ADR 0016](../decisions/0016-multiplayer-server-authoritative-duel.md),
[ADR 0017](../decisions/0017-balanced-asymmetric-camp-placement.md)). Sources: the
[netcode research](../research/multiplayer-and-netcode-research.md), the
[scalability research](../research/server-scalability-and-matchmaking-research.md), the
[impact review](../reviews/2026-10-10-new-requirements-impact.md) (its ids `N-`, `DU-`, `W` are
used here) and the Sprint 1 audit (`docs/reviews/2026-10-09-sprint-1-audit.md` on
`origin/chore/sprint-1-audit`, ids `AK-`, `AS-`, `AC-`, `AM-`, `A22-`, `A23-`).

## 1. The requirements, in the owner's words

Committed verbatim in `INBOX.md` ("Feedback", `8d0d308`), recorded as DEC-36 and DEC-37 in the
[decisions log](../reference/game-design/13-owner-decisions-log.md), catalogued as FR-113 to FR-118
and NFR-034 in [06-mvp-requirements.md](../requirements/06-mvp-requirements.md). "By the end of
Sprint 3, two new items must be implemented":

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

## 2. Target design in brief

[ADR 0016](../decisions/0016-multiplayer-server-authoritative-duel.md) (proposed) holds the design;
the research holds the evidence. In one paragraph: one Node process (`apps/server`) runs the
unchanged core `Simulation` for each Duel; browsers send their per-tick `intent` over WebSocket and
draw per-player snapshots, the opponent interpolated; solo matches against bots stay in the browser;
identity is a server-issued guest token; wire types live in `packages/protocol`; the database and
rating wait for a later ADR. The Duel itself is configuration and content selected by a mode id,
not `if (mode === 'duel')` in systems (impact DU-1, rule 12). Scale is shown, not assumed: headless
TypeScript bot clients play real Duels against the deployed server while it reports connections,
active Duels, tick and event-loop percentiles (scalability research Q5).

## 3. The Duel rules and the conflicts found

The rules as stated map onto the design as in netcode research §5 and impact §2. Each conflict
below blocks the Duel rules work (W10) until the owner answers the question named.

| Conflict                                                                                                                                                                                                                                                                                                                                                                            | Question |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Ultimate "cooldown" vs the charge meter.** The ultimate has no cooldown in the design: it is a meter filled by kills, assists and objective damage that loses a share on death (FR-059, architecture 05 §6 `UltimateChargeRule`, reference 06). Ability state also dies with the entity (05 §6), so per-player state across lives is needed either way (impact §2.5).             | 11, 12   |
| **Forward-only phases vs repeating rounds.** Architecture 12 §2 makes phase transitions strictly forward, with `victory`/`defeat` terminal for one `playerTeam` (12 §4, §10: `playerTeam`, `hadHuman`). A Duel loops rounds and has two humans: rounds as a sub-state of one in-play phase and a `winner` each client reads (impact DU-2). An architecture change for the owner.    | 1, W2    |
| **The Cathedral interior is presentation only.** `CathedralInteriorBuilder` has no colliders, terrain or doors, is typed as a `MapDefinition` (A22-15) and sits inside blocker A22-1, which moves presentation builders to the client. Its drawn size is larger than the world it stands in (impact DU-4). The arena's gameplay geometry must stay in core when A22-1 lands (DU-3). | 15, 16   |
| **One human per match.** FR-046, architecture 11 §7 (`humanLegendId`) and 12 §4 assume exactly one human; reference 14 §1 has exactly one match type and no picker (impact N-1d, N-1e, N-1g).                                                                                                                                                                                       | 1, 19    |
| **Fear is bot-only** (`more-abilities.md`), so Colossus Roar does less in a Duel between humans (impact AB-7).                                                                                                                                                                                                                                                                      | INBOX    |

## 4. Prerequisites from the Sprint 1 audit

Networking builds on these; all are core or client fixes with no product dependency (impact §1.3,
W3 to W5).

| Item                          | Why it blocks networking                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AK-6                          | The entity id counter lives in the factory, outside `GameState` and the hash: two equal hashes can issue different ids, and a server cannot restore a match.                                                                                                                                                                                                                                                                                                         |
| AK-4                          | A malformed `dev-spawn` throws out of `Simulation.step()`; on a server that ends the match for both players. Handlers must reject.                                                                                                                                                                                                                                                                                                                                   |
| AK-3, AM-10 and the map files | `Math.hypot` and `**` are engine-approximated (netcode research §2). Beyond the audit's `Movement.ts`, `FiniteTransformsInvariant.ts` and `utils/geometry.ts`, a grep on 2026-10-10 finds `Math.hypot` in `map/MapVillageBuilder.ts`, `map/MapDecorationBuilder.ts` and `map/CathedralInteriorBuilder.ts`, and `**` in `map/MapVillageBuilder.ts`, `map/MapSceneryBuilder.ts` and `map/MapDecorationBuilder.ts`. Matters if clients generate the arena (question 3). |
| AK-5 (with AE-4, AK-12)       | Injected content skips validation, catalogues are built at import and `deepFreeze` misses children: one server process hosts many matches over shared content.                                                                                                                                                                                                                                                                                                       |
| AS-1, AC-1, AC-2              | The `Match` lives as long as the viewport, ignores the session's seed, team and class, and its composition root is untested. Online play needs one testable `createMatch(setup)` with an injected command source and a server-chosen seed.                                                                                                                                                                                                                           |
| The `intent` command (N-7)    | `intent` is still `UnsupportedCommandHandler` (`TODO(sholtzman)` in `commands/defaultCommandHandlers.ts`), so `Match` turns intents into `move`/`stop` in the client. The server needs `PlayerController` and the `intent` handler in core.                                                                                                                                                                                                                          |
| A23-20, AK-7                  | The player is spawned with `dev-spawn`, which a server must refuse from clients; replays carry no `versions`, so two builds can disagree silently.                                                                                                                                                                                                                                                                                                                   |

Sprint 2 code must also not foreclose later all-human matches: impact §3.3 lists the six rules
(all state in `GameState`, no shared mutable state in core, players keyed by seat, and so on).

## 5. Proposed re-cut of Sprints 2 to 4

**Proposal for the owner's approval; [the delivery plan §0](README.md) stays in force until he
approves it.** The current plan has the combat a Duel needs in S2 to S3 and abilities in S4, so a
Duel by Nov 13 needs a third track and a reorder. The tracks keep the plan's lanes: Track A core
simulation, Track B client shell, and a new **Track N** for the network and the Duel.

| Sprint                                 | Track A: core simulation                                                                                                                                                                                                                                            | Track N: network and Duel (new)                                                                                                                                                                                                                  | Track B: client shell                                                                                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **S2** Oct 19 – Oct 30                 | Phase 1 close; prerequisites W3 and W4 (§4) in week 1; Phase 2 reordered, sprint 2.2 first (damage pipeline, killer tracking, `CombatSystem` v1), then 2.1; map W7 (A8-1, then DEC-15 if ADR 0017 is accepted); PROTO-01 removal per DEC-35 and its timing question | Decisions (W1, W2: ADR 0016, ADR 0017, dependencies, folders); netcode spike and scale spikes (§7); arena geometry design with the A22-1 split (W9)                                                                                              | W5 `createMatch(setup)` and the match lifetime (AS-1, AC-1, AC-2, A24-1, A24-2); persistence 5.1 and developer menu v1 kept; **loadout and profile screens move to S4**                                |
| **S3** Nov 2 – Nov 13                  | Phase 2 rest a 10v10 needs (2.3, 2.4, 2.6, 2.7; 2.5 shared with the arena); Phase 3.1 to 3.3 (hordes, pathing, minion controller); a minimal 3.5 (phase registry and victory conditions, shared with the Duel); **4.2 ability framework pulled in from S4**         | `packages/protocol`; `apps/server` (gateway with the security checklist, presence, FIFO Duel queue, match host, `/metrics`, drain); Duel mode and rules in core (W10); arena geometry in core; bot load test and capacity table on the real host | Duel entry, queue and connecting phases, network `IntentSource` and a snapshot-driven match variant with interpolation, Duel score and match-point HUD and results; ability bar only as the Duel needs |
| **S4** Nov 16 – Nov 27 (freeze Nov 20) | Phase 3.4 (forest camps), 3.6 (mini-bosses), 3.7 (Legend bots), 3.8 (sim mode, soak); 4.1 and 4.3 class kits per the DEC-11 answers; 4.5 minimal; Phase 6 hardening from Nov 20                                                                                     | Duel hardening and a rehearsal on the real host before the freeze; client prediction only if the spike said go; database and rating only if the owner schedules them before Nov 27                                                               | Phase 4 HUD rest, settings overlay, loadout and profile screens, art and audio, demo script                                                                                                            |

**What moves later or is cut (each a proposal):**

1. Loadout and profile screens: S2 → S4 (the persistence layer stays in S2; loadout variety is
   already cut 8).
2. Phase 3.4, 3.6, 3.7 and 3.8: S3 → S4. Legend bots are MVP-core, so this is the plan's largest
   risk (§8); cuts 5 and 6 (mini-bosses, GreaterBoss) are decided at the S3 review on Nov 13.
3. Cut order items 1 to 4 (art polish, pick-up and throw, manual turret control, corner camps) are
   applied now instead of when late; DEC-12's volatile crystals go with the corner camps.
4. Phase 4 grows with DEC-11; whatever the owner keeps beyond three abilities and one ultimate per
   class lands after the Duel ships (question 5 and the DEC-11 item in `INBOX.md`).
5. Server database, saved guest accounts, rating and skill-based matchmaking: after S3; in S4 only
   if the owner wants them in the presentation (question 10), otherwise post-MVP.
6. Client prediction: S4 at the earliest, only on a spike "go"; WebTransport, binary snapshots,
   worker pools and more processes: post-MVP unless a measurement asks for them.
7. All-human 10v10: post-MVP, kept open by impact §3.3.

**Staffing (judgement).** Track N needs about two people through S3. The repo records two roles:
Samarjit Bhogal owns mobs and minions (DEC-33, DEC-35), so Track A's Phase 3 work; Sam Holtzman is
the architecture owner and approves every design change. Everything else is unassigned until the
owner names people (question 6).

## 6. Work items

`W` ids are the impact review's (§7), never reused; `MP-` ids are new here. "Unassigned" means the
repo records no role for it.

| Id   | Work                                                                                                                                        | Sprint        | After                        | Suggested owner                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------- | ----------------------------------------------------------------- |
| W1   | Owner answers (§9) and approval of this re-cut                                                                                              | before S2     | —                            | Sam (owner)                                                       |
| W2   | ADR and doc batch: ADR 0016, ADR 0017, an ADR 0012 amendment if asked, the catalogue edits, the queued status notes (§10)                   | S2 week 1     | W1                           | Sam (architecture owner)                                          |
| W3   | Determinism and state hygiene: AK-6, AK-4, AK-3, AM-10 and the map files, AK-5, AE-4, AK-12, AK-7                                           | S2 week 1     | —                            | unassigned                                                        |
| W4   | `PlayerController` and the `intent` handler; a non-developer spawn path for match setup (A23-20); `dev-remove-entity` through `DeathSystem` | S2            | W3                           | Sam (`TODO(sholtzman)` on `intent`); rest unassigned              |
| W5   | `createMatch(setup)`, match lifetime, `IntentSource` port (AC-20), A24-1, A24-2                                                             | S2            | the AS-7 C2 / AC-25 ruling   | unassigned                                                        |
| W6   | PROTO-01 removal (18 markers)                                                                                                               | S2            | its timing question in INBOX | Samarjit (DEC-33, DEC-35)                                         |
| W7   | Map: AM-1, A8-1, then DEC-15 (ADR 0017), then AM-3                                                                                          | S2            | W2                           | unassigned; reviewer Aryan Walanj (DEC-04)                        |
| W8   | Combat with kill credit: sprint 2.2 plus a basic attack                                                                                     | S2            | —                            | unassigned                                                        |
| W9   | Arena geometry: gameplay layout in core, dressing in the client, closed doors, destructible props (DU-3 to DU-5)                            | S2 design, S3 | questions 15, 16; A22-1      | unassigned; reviewer Aryan Walanj (DEC-04)                        |
| MP-1 | Netcode spike (§7)                                                                                                                          | S2            | `ws` approved (question 2)   | unassigned                                                        |
| MP-2 | Scale spikes A and B (§7)                                                                                                                   | S2            | B after `ws` (question 2)    | unassigned                                                        |
| 4.2  | Ability framework (phase 4 sprint 4.2), pulled forward                                                                                      | S3 week 1     | W8                           | unassigned                                                        |
| W10  | Mode seam and Duel rules: mode id, round loop, `KillCountCondition`, round reset, per-player ability state, the cooldown rule               | S3            | W8, W9, 4.2; questions 11-14 | unassigned                                                        |
| MP-3 | `packages/protocol`: versioned message union and validators                                                                                 | S3 week 1     | ADR 0016                     | unassigned                                                        |
| MP-4 | `apps/server`: gateway, presence, FIFO queue, match host, `/metrics`, drain (impact W11)                                                    | S3            | MP-3, W3-W5                  | unassigned                                                        |
| MP-5 | Headless bot clients, load test, capacity table, rehearsal on the real host; CI and branch protection for the new app (AD-1)                | S3 week 2     | MP-4; question 8             | unassigned; CI and protection: SamarjitBhogal (`main` maintainer) |
| W12  | Duel screens and the network match variant (DU-9 to DU-12)                                                                                  | S3            | W5, MP-3                     | unassigned                                                        |
| W13  | Server database, guest accounts kept, rating, offline-summary upload                                                                        | S4 or later   | question 10; a database ADR  | unassigned                                                        |
| W14  | DEC-11 content; DEC-12 only if corner camps survive                                                                                         | S4            | W1, W2                       | unassigned (Phase 4 owners unrecorded, AD-17)                     |

## 7. Sprint 2 spikes

Both run on throwaway branches that are never merged; the output is measurements in `PROGRESS.md`
and a go or no-go, not production code. Thresholds are `Recommendation:` values for the owner to
change; each names where its yardstick lives.

**MP-1, netcode** (netcode research, "Spike plan", steps 1 to 5):

| Step                                                                                                              | Pass                                                                                                                                                              | Fail, and what follows                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Headless loop: two Legends in the arena, stepped in Node at the tick rate                                         | Step p95 recorded and at or below the scalability research's Duel assumption (capacity input I2)                                                                  | Above I2: re-derive the capacity table. Above the NFR-021 per-tick budget: one Duel costs a full 10v10, so revisit ADR 0016 |
| Two browser tabs through the server, `intent` up, JSON snapshots down                                             | A Duel plays on the LAN and to a remote host; bytes per second each way and round-trip time recorded; the owner rates feel at each injected delay                 | The server misses ticks with two clients, or the clients' view drifts from the server's beyond one snapshot                 |
| Movement prediction                                                                                               | **Go** into S3 if movement feels unplayable without it at 100 ms of injected delay (research spike step 2) and the prototype corrects rarely; otherwise post-MVP  | —                                                                                                                           |
| Cross-engine probe (Chrome, Firefox, Safari, Node)                                                                | Selects the arena path, it cannot fail: equal geometry hashes let clients generate the arena behind a map-hash check; unequal ones mean the server sends geometry | —                                                                                                                           |
| Robustness: spoofed `actorId`, `dev-spawn`, malformed and oversized messages, a `randomCommands` fuzz run (15 §9) | Each is rejected and the match keeps stepping                                                                                                                     | Any input ends the match: fix before S3 starts                                                                              |

**MP-2, scale** (scalability research, "Phased plan", spikes A and B):

| Spike                                                                                                          | Pass                                                                                                                                                  | Fail, and what follows                                                              |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| A: `Simulation` headless at Duel size and at the largest size Phases 1-2 support; tick p50/p95, heap per match | One Node thread steps the owner's example (five Duels) with event-loop delay p99 under the research's first ladder threshold (Q1); I1 and I2 replaced | It cannot: the worker pool (ladder rung b) moves into S3                            |
| B: 1,000, 2,000 and 5,000 idle authenticated connections; RSS per connection, event-loop delay                 | One process holds 1,000 with event-loop delay p99 under the same threshold; I5 replaced                                                               | Fewer than 1,000: "thousands" needs more processes (rung c); re-plan MP-4 before S3 |

Glicko-2 (the research's spike C) waits for the database decision (question 10).

## 8. Risks

| Risk                                                                                           | Likelihood | Mitigation                                                                                                       |
| ---------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Duel, server and the 10v10 MVP-core do not all fit by the Nov 20 freeze with five people       | High       | §5 cuts now; the S3 review decides cuts 5 and 6; the Duel and the 10v10 share combat, abilities and the director |
| Approvals (ADR 0016, folders, `ws`) arrive late and block the spike, then S3                   | High       | Ask in W1 before Oct 19; the spike needs `ws` (question 2)                                                       |
| Agents keep treating server work as out of scope (`AGENTS.md:8-9`)                             | High       | The owner edits `AGENTS.md` when he accepts ADR 0016                                                             |
| Prerequisites slip and the server is built on the client-side `Match`                          | Medium     | W3 to W5 first in S2; MP-4 starts only after them                                                                |
| The arena is not playable geometry in time (presentation-only interior, A22-1, scale mismatch) | Medium     | W9 design in S2; questions 15 and 16 answered in W1                                                              |
| Rule conflicts (§3) stay open and block W10                                                    | Medium     | Questions 11 to 14 in W1                                                                                         |
| Three tracks collide in `Simulation`, `Match` and `SessionController`                          | Medium     | `createMatch` (W5) before W12; disjoint file sets per task                                                       |
| Demo-day hosting: sleeping tier, TLS, campus network                                           | Medium     | Rehearse on the real host before the freeze; never deploy during a demo; avoid sleeping tiers                    |
| The opponent drawn in the past feels unfair                                                    | Medium     | Measured in MP-1 at injected delays; prediction on a "go"                                                        |
| A public server is abused                                                                      | Low        | ADR 0016 point 7; tokens stored hashed when stored at all                                                        |
| A Node upgrade changes `sin`/`cos` bits and old replays diverge                                | Low        | Node pinned in `.nvmrc` and recorded with replay versions                                                        |

## 9. Open questions for the owner

De-duplicated from the netcode research ("N"), the scalability research ("S") and the impact review
("Q"), plus three from this plan. Questions about DEC-11, DEC-12, DEC-13, DEC-15 and PROTO-01
(impact Q3 to Q5, Q14 to Q18) are asked in `INBOX.md`, "Decisions needed from Sam"; DEC-15's also
in [ADR 0017](../decisions/0017-balanced-asymmetric-camp-placement.md).

**A. Approvals**

1. Accept [ADR 0016](../decisions/0016-multiplayer-server-authoritative-duel.md): a
   server-authoritative Duel, with solo matches against bots kept in the browser? (N1, Q2, S1, Q13)
2. Approve `apps/server`, `packages/protocol` and `ws` (plus `@types/ws` if needed), and may the
   Sprint 2 spike use `ws` on a throwaway branch before the ADR is accepted? (N2, N3, S8)
3. Amend ADR 0012 to ban `Math.hypot` and `**` in core? Needed if clients generate the arena. (N13,
   audit AK-3)
4. Approve, change or reject the re-cut in §5, including applying cuts 1 to 4 now. (Q1, N12)

**B. Scope, staffing and the demo**

5. What does the Sprint 3 Duel include: basic attacks only, or the ability framework and which
   class kits? (Q1)
6. Who staffs Track N in Sprints 2 and 3, next to Phase 3? (S9, N12)
7. Which concurrency figure must the Sprint 3 review and the Nov 27 presentation show, and do
   headless bot clients count as players? (S7, Q19)
8. Where does the server run for the demo, on which accounts or student credits, within what
   monthly budget, and is the client served over HTTPS? (N4, S5)
9. Which browsers must Duel support, desktop only? (N11)
10. Is the database (profiles, match records, ratings) wanted before the Nov 27 presentation, or
    after the MVP? DEC-36 says "in the future". (this plan)

**C. Duel rules**

11. In a Duel, is the ultimate a timed cooldown, or the charge meter of FR-059 kept through death?
    Does the loss on death apply? (N5, Q9)
12. Do non-ultimate cooldowns also reset on death in the 10v10 mode? (Q10)
13. What does the match-point system change: an announcement only, win by two, sudden death? How do
    simultaneous kills, self-kills and kills by the environment score? (N6, Q8)
14. Round reset: the delay, projectiles and zones still in flight, aether, status effects, and
    whether players swap spawn sides. (N7)
15. How large is the Duel arena in metres? (Q6)
16. Does the outer world exist in a Duel, or only the interior; inert structures, or none? (Q7)
17. May a player pause an online Duel? (N9)
18. Disconnects: reconnect window, play on or pause, forfeit on timeout, does a forfeit count in
    stats, and may a deploy void a running Duel? (N8, S6)
19. Which pre-match screens does a Duel keep (the timed character select, the pre-launch reveal),
    and are sides assigned by the server? (impact DU-11)

**D. Matchmaking, identity and data**

20. Sprint 3 queue: pure first-come pairing with no rating? If nobody else is waiting, how long does
    a player wait, and is a bot Duel offered? (N10, S3)
21. Rating, once it exists: from the first match or after placement matches; shown as a number,
    tiers or hidden; should streaks change anything beyond the rating's own volatility? (S2)
22. Identity: guest-only for Sprint 3? Later password, GitHub or Google login, or school email?
    Display names free, unique, moderated? Any personal data? (S4, Q11)
23. Do solo matches against bots count only toward history, or also toward rating, and may the
    server re-simulate submitted replays to verify them? (S1, Q12)

## 10. Orphaned agent requests in `INBOX.md`

The sessions that wrote "Requests for the agent" are gone; upcoming sessions absorb them as the
impact review's §6 maps them, with the owner approving any architecture or `AGENTS.md` text.

| Request (author, date)                                                                                          | Absorbed by                                                            |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Session C → Sam, 2026-10-08: `PlayerController` and the `intent` handler                                        | W4, S2; a Duel prerequisite                                            |
| Session C → Sam, 2026-10-08: focus-loss release and `IntentSource` (optional)                                   | Ruling in W2 (AC-20, AC-21); built in W5; the port is the network seam |
| Session A (from B), 2026-10-07: stand-in swap to `GameConfig` and `SeededRandom`                                | W7 (A8-1 after AM-1), before DEC-15                                    |
| Session C (from B), 2026-10-07: kernel checklist, all done but (3)                                              | W4; then the item moves to Done                                        |
| Session C → Sam, 2026-10-07: `dev-remove-entity` through `DeathSystem`; may `diagnostics/` import `components/` | W4, option (a) with the fixture re-recorded; AK-2 ruling in W2         |
| Session C → session H, 2026-10-07: `Simulation` takes one options object                                        | Done already (AD-20); move to Done                                     |
| Session C → Sam, 2026-10-07: pipeline and invariants as classes; seed and severity on violations                | Ruling in W2 (AK-8, AK-24), then W4                                    |
| Session C → Sam, PR #14 review items (1) to (10)                                                                | W2, one doc and approval batch                                         |
| Session H → Sam and F, 2026-10-07: log sinks' folder; first-frame tick count                                    | W2 (docs); W5 wires the sinks                                          |
| Session C/H → Sam, 2026-10-09: status notes for 08 §11 and 09 §11                                               | W2 (AC-3)                                                              |
| F → G, 2026-10-06: mount the pause overlay                                                                      | W5 (A24-2); pausing an online Duel is question 17                      |
| F → session H, 2026-10-09: settings and bindings inside the match                                               | W5 (A24-1)                                                             |

## Related

- [Delivery plan](README.md) · [PROGRESS.md](PROGRESS.md) · [post-MVP backlog](backlog-post-mvp.md)
- [ADR 0016](../decisions/0016-multiplayer-server-authoritative-duel.md) ·
  [ADR 0017](../decisions/0017-balanced-asymmetric-camp-placement.md) ·
  [ADR 0005](../decisions/0005-indexeddb-persistence.md) ·
  [ADR 0009](../decisions/0009-config-driven-map-generation.md)
- [Netcode research](../research/multiplayer-and-netcode-research.md) ·
  [Scalability research](../research/server-scalability-and-matchmaking-research.md) ·
  [Impact review](../reviews/2026-10-10-new-requirements-impact.md)
- [MVP requirements](../requirements/06-mvp-requirements.md) ·
  [Owner decisions log](../reference/game-design/13-owner-decisions-log.md)
