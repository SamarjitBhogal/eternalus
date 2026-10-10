---
title: New requirements impact (2026-10-10)
description: Repo-grounded impact map of the owner's INBOX answers of 2026-10-09 (DEC-11, DEC-12, DEC-13, DEC-15, session D, PROTO-01) and the two new Sprint 3 requirements (Duel multiplayer, server scalability) on code, docs and plan, with the approvals, risks, dependency order, open owner questions and who needs to know; read this before planning Sprint 2 or touching anything these decisions change.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-10
tags: [review, impact, multiplayer, duel, scalability, sprint-2, planning]
related:
  [
    'docs/reference/game-design/13-owner-decisions-log.md',
    'docs/plan/README.md',
    'docs/requirements/06-mvp-requirements.md',
    'docs/decisions/0005-indexeddb-persistence.md',
    'docs/decisions/0009-config-driven-map-generation.md',
    'docs/architecture/12-game-story-and-match-director.md',
  ]
---

# New requirements impact (2026-10-10)

**Purpose.** The owner answered six INBOX items in `8d0d308` and added two requirements due by the
end of Sprint 3: multiplayer through a **Duel** mode, and a server for hundreds or thousands of
concurrent players. This review maps each onto code, docs and plan at `8d0d308` (phase tip
`1997435` plus the INBOX commit). It decides nothing; product questions are in §8. Sprint 1 audit
findings (`docs/reviews/2026-10-09-sprint-1-audit.md` on `origin/chore/sprint-1-audit`, which also
holds DEC-32 and DEC-33 so far) are cited by id, not repeated.

**Conventions.** Impact ids (`N-`, `DU-`, `AB-`, `CR-`, `CW-`, `SD-`, `PR-`) and work items (`W`)
are never reused. **Approval: owner** means the change edits `docs/architecture/`,
`docs/decisions/`, an `AGENTS.md` or the requirements catalogue (NFR-010: ADR plus catalogue edit).
Risk is H/M/L. Line numbers are at `8d0d308`.

## Summary

- **Schedule.** Plan README §0 puts Sprint 3 at Nov 2–13. A Duel needs combat and kill credit
  (Phase 2, sprint 2.2) and abilities with cooldowns (Phase 4, scheduled for S4). So the
  requirement cannot be met on the current plan without a re-cut (W1, Q1).
- **"No server, single player" is a written constraint** in 15+ places, including ADR 0005, AP-14,
  ES-08, NFR-013, NFR-033 and `AGENTS.md:8-9`. Lifting it needs a superseding ADR and catalogue
  edits before any server code lands (N-1).
- **The simulation is a good base for networking.** Core is pure and deterministic, input is
  `Command`s applied next tick, and replays are seed plus commands. The gaps are the known audit
  items (AK-6, AK-3, AK-5, AS-1/AC-1/AC-2, A23-20) plus a single-human model in 11 and 12 (N-1e,
  §1.3).
- **DEC-15 breaks the mirror invariant** that ADR 0009, 06 and the generator tests enforce. The
  change is contained to camps, but it needs an ADR amendment and a new parity invariant (CW-1).
- **DEC-11 approves more abilities than slots.** Warrior has 4 abilities for 3 slots, Sentinel 5
  and Magus 4, with up to three ultimates each. The loadout design (05 §12) already allows a
  pool, but FR-058 and Phase 4 scope grow (AB-1).

## 1. Multiplayer and the "no server" assumptions

### 1.1 Where the docs and code assume one human, the browser and no server

| Id   | Location (section)                                                                                                                                                                                                                                                                           | Assumption                                                                                                        | Approval |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| N-1a | `AGENTS.md:8-9`; `README.md:3`; `docs/requirements/README.md:66` (Constraints, Runtime)                                                                                                                                                                                                      | "browser-only … single player vs. AI bots, no server", "no accounts"                                              | owner    |
| N-1b | `01-architecture-principles.md` AP-14 (:257); `05-engineering-standards.md` ES-08 (:149-158); `06-mvp-requirements.md` NFR-013, NFR-033 (D3)                                                                                                                                                 | Threat model: the browser is the trust boundary; no remote attack surface                                         | owner    |
| N-1c | ADR 0005 (Context, option 3 rejected as "contradicting no server"); `architecture/README.md:127` (D3); `14-persistence-and-resources.md:28` and §11 (:452); `plan/phase-5-meta-ui-and-persistence.md:30`; `backlog-post-mvp.md:68` (server persistence post-MVP); `discrepancies.md` DISC-03 | Local IndexedDB is the only database; server persistence is post-MVP behind an `HttpStorageAdapter`               | owner    |
| N-1d | `reference/game-design/00-overview-and-status-legend.md:31-32`; FR-001 (:60), FR-046 (:126); `11-mvp-scope.md:59`                                                                                                                                                                            | One human Legend per match; every other Legend a bot                                                              | owner    |
| N-1e | `11-game-ai.md` §7 (`MatchConfig.humanLegendId: EntityId \| null`); `12-game-story…` §4 (`MatchState.playerTeam`, `humanLegendId`), §10 (`MatchResult.playerTeam`, `hadHuman`); `03-game-model.md` §3 ("the client enqueues the human's commands first")                                     | Exactly one human, one perspective, one command source                                                            | owner    |
| N-1f | `03-game-model.md` §8 (Floats row: "revisit fixed point only for networked lockstep"); `10-physics.md` §10 (:251-253); ADR 0012 (:27)                                                                                                                                                        | Bit-exactness is claimed per machine and browser; cross-browser only through the `deterministicMath` wrappers     | owner    |
| N-1g | `reference/game-design/14-interface-and-screen-flow.md` §1 ("the MVP has exactly one" match type), §2.2 ("matchmaking … is full-game"), §4; `apps/client/src/ui/screens/mainMenuItems.ts:7`                                                                                                  | One match type, no picker; random team                                                                            | owner    |
| N-1h | `apps/client/src/game/Match.ts:91-145`                                                                                                                                                                                                                                                       | The player's entity is found by `kind` and `team` on `entity-spawned` and spawned with `dev-spawn` (A23-20, AM-4) | —        |

N-1 is one change: an ADR superseding D3's "no server", with the catalogue edits (N-1a…N-1d) in the
same PR. **Risk H:** every agent reads `AGENTS.md:8-9` and will treat server work as out of scope
until it changes. **Depends on** the networking model (Q2) and the sibling research.

### 1.2 What the architecture already provides

- **Pure core** (rule 1): the same `Simulation` runs in a browser, a Worker (08 §10) or a Node
  process (NFR-026, "headless in Node").
- **Commands applied next tick** (rule 9; 03 §3, §7): one serialisable union with an `actorId`, so
  remote input is one more producer.
- **Seeded randomness, ticks only, `StateHasher` over all state** (03 §8-§9, ADR 0012): the hash is
  the desync check a networked match needs.
- **Replays are seed + config + commands** (03 §9): a server can re-simulate a submitted replay and
  compare `finalHash` (12 §10) to verify reported stats (§2.7).
- **The map is a pure function of config and seed** (ADR 0009): peers exchange a seed, not a map.
  DEC-15's random camps stay inside that function (CW-4).
- **`dev-*` are ordinary commands** (03 §3), forwarded by `Match` only with the developer menu. An
  authority must reject them from remote players whatever the client flag says.
- **`IntentSource` port** in `Match` (audit AC-20): a network source plugs in there.

### 1.3 Gaps that block networking

| Id  | Gap                                                                                                      | Where                                                                                            | Audit               | Why it matters online                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| N-2 | Entity id counter outside `GameState` and the hash                                                       | `entities/EntityFactory.ts:22`                                                                   | AK-6                | Two peers can hash equal yet issue different ids; resync and save-resume cannot restore it                                     |
| N-3 | `Math.hypot`, bare `**` in core                                                                          | `Movement.ts`, `geometry.ts`, `FiniteTransformsInvariant.ts`; also `CathedralInteriorBuilder.ts` | AK-3, AM-10         | Cross-machine determinism holds only if every engine-dependent call goes through `deterministicMath`; extend the ADR 0012 lint |
| N-4 | Injected content skips validation; catalogues built at import; `deepFreeze` misses children              | `Simulation.ts:55-58`; `legendCatalogue.ts`, `mobCatalogue.ts`; `utils/deepFreeze.ts`            | AK-5, AE-4, AK-12   | A server runs many matches per process over shared content; a mutable child leaks between matches                              |
| N-5 | `Match` lives as long as the viewport, ignores the setup seed, team and class; composition root untested | `useMatch.ts`, `Match.ts`, `PlaceholderScreen.tsx`                                               | AS-1, AC-1, AC-2    | Online play needs one testable `createMatch(setup)` that can take a remote command source and a server-chosen seed             |
| N-6 | Player spawned with `dev-spawn` from the client; spawn point found in the client                         | `Match.ts:91-145`                                                                                | A23-20, AM-4, A23-8 | An authority must reject client `dev-*`; match setup needs a non-dev path (setup data or a `spawn-legend` command)             |
| N-7 | The `intent` command is still unsupported; `Match` turns intents into `move`/`stop`                      | `commands/defaultCommandHandlers.ts`; `Match.ts`; 11 §4.1                                        | (INBOX :88)         | Gameplay rules in the client are not replicated; `PlayerController` must live in core                                          |
| N-8 | `dev-spawn` team unvalidated; a bad command throws out of `step()`                                       | `DevSpawnHandler.ts:16-44`                                                                       | AK-4                | A malformed remote command must be rejected, never crash the shared match                                                      |
| N-9 | Replays have no `versions`; the replay test never runs the shipped pipeline                              | 03 §12; `diagnostics/replay.test.ts`                                                             | AK-7                | Peers on different builds desync silently; a version handshake and a real-pipeline golden replay are the safety net            |

## 2. Duel mode

### 2.1 Game modes today

There are none. `GameConfig` (`config/GameConfig.types.ts`) has `map`, `match` and `limits` but no
mode. `SESSION_PHASES` (`bridge/events.ts:12-21`) is one linear flow. `MatchPhase`
(`state/GameState.types.ts:3`; 12 §2) is the 10v10 timeline. Architecture 12 (not built yet; core
has no `match/`) has the right seams: `MatchPhaseState`s from a registry (`defaultMatchPhases.ts`),
`MatchTimeline` as data and a `VictoryCondition` list (`defaultVictoryConditions.ts`). A Duel can be
a different timeline, phase set and condition list chosen by a mode id, with no director change.

| Id   | Impact                                                                                                                                                                                                                                                                   | Docs and code                       | Approval | Risk |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | -------- | ---- |
| DU-1 | A mode id in config (for example `GameConfig.match.mode` or a `MatchRules` content id) that selects the timeline, phases, victory conditions, spawn rules and map source                                                                                                 | 03 §10; 12 §1-§6; `config/`; FR-006 | owner    | M    |
| DU-2 | 12 §2 says transitions are "strictly forward" and `victory`/`defeat` terminal (`assertForward`). Duel rounds repeat, so either the round loop is a sub-state in `state.match` (round number, kills) or the Duel gets its own phase order. Architecture call, not product | 12 §2, §4                           | owner    | M    |

### 2.2 The Cathedral interior as the arena

DEC-32 made the enterable interior part of the design. Today it is `CathedralInteriorBuilder` in
`packages/core/src/map/`. It is presentation only: no lanes, no terrain, no colliders, one
capture-point marker (`CathedralInteriorBuilder.ts:9-12`). It is typed as a `MapDefinition`
(A22-15), and it sits inside audit blocker A22-1, which moves presentation builders to the client.

| Id   | Impact                                                                                                                                                                                                                                                                                                                                         | Approval | Risk |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---- |
| DU-3 | Split the interior into **gameplay geometry** (walls, rooms, doors, spawn points, breakable props, kept in core content or `map/` and stamped into a `WorldMap`) and **dressing** (moved to the client with A22-1). A22-1's fix must not move the arena layout out of core. 06 §4, §6, §10 and A22-21's doc text change                        | owner    | H    |
| DU-4 | **Scale.** The interior is 1800 × 2200 units (`map1Landforms.ts:47-48`), while the cathedral it stands in is about 200 × 236 m on the default map (`cathedralHalfWidth`/`Height` scaled by `world.width / SKETCH_WIDTH`). With 1 unit = 1 m (DEC-06), the arena is larger than the 1600 × 900 world. The arena size needs a sourced value (Q6) | owner    | M    |
| DU-5 | **"Doors closed"** means the arena's exits are closed `gate`s (07 §4) or unbreakable walls during a Duel. "Any damage done to the map remains" means arena props are destructible entities on the 07 §10 pipeline that are not reset between rounds                                                                                            | owner    | M    |

### 2.3 "World deactivated"

The world "no longer spawn[s] units or carr[ies] structures (environmental buildings, trees, etc.,
unaffected)". One reading: no structure entities or spawners, only scenery and obstacles. If the
arena is its own map (DU-3), the outer world need not be simulated at all (Q7). Either way the
mode's spawn rules come from DU-1, never `if (mode === 'duel')` in a system (rule 12).

### 2.4 Rounds, reset, kill counter and match point

| Id   | Impact                                                                                                                                                                                                                                                                                                                   | Where                                        | Approval | Risk |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | -------- | ---- |
| DU-6 | **Kill credit.** First-to-10 needs `entity-died` with a killer. Today `DeathSystem` polls `Health` and removes with no killer (AK-10); killer tracking is sprint 2.2 (`DamagePipeline`). `KillCountCondition` would be a new `VictoryCondition`, with the target in mode config                                          | 12 §5-§6; `systems/DeathSystem.ts`; plan 2.2 | owner    | H    |
| DU-7 | **Round reset.** Players return to their spawn points at full health with statuses cleared, while the arena's damage stays. That is a new director action (a timeline or event handler, 12 §3) that emits a reset request. The owning systems apply it (rule 12). The reset is recorded and hashed like any state change | 12 §3-§4; 03 §4                              | owner    | M    |
| DU-8 | **Match point** is an announcer line plus a HUD score (`announce`, 12 §8; `Scoreboard`, 13 §3). Its exact rule (announce at 9, or win by 2) is Q8                                                                                                                                                                        | 12 §8; 13 §3                                 | owner    | L    |

### 2.5 Cooldown rules across death

The rule: "your cooldown for an ultimate persists through life and death, where your other
abilities … reset to fully cooled down upon death."

- **Conflict (Q9).** The ultimate is not on a cooldown in the design. It is a charge meter that fills
  from kills, assists and objective damage, never passively, and loses N% on death (FR-059; 05 §6
  `UltimateChargeRule`; reference 06 "Ultimates"). In a Duel with no minions or structures, charge
  comes only from kills and assists. "Continuous cooldown" could mean a time cooldown for Duel
  ultimates, or a meter with `death` loss 0. Both fit the rule table: a `death` rule per mode, or a
  per-mode ultimate definition.
- **State must outlive the entity.** `DeathSystem` removes the dead (03 §4), and an entity's
  `AbilityRuntime`s die with it (05 §6). FR-051 already asks a respawned Legend to keep "the retained
  ultimate charge", so per-player ability state across lives is needed in both modes. Proposed:
  plain data in `GameState` keyed by player or seat, so it is hashed (03 §9). Docs: 05 §6, 04 §2
  (owner).
- **Non-ultimate reset on death** is one content rule in the same table (`on: 'death'` →
  `resetCooldowns`). Whether it applies outside the Duel is Q10.

### 2.6 Matchmaking, queue and screens

| Id    | Impact                                                                                                                                                                                                                                                                                      | Docs and code                              | Approval | Risk |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------- | ---- |
| DU-9  | Home screen gains a Duel entry: reference 14 §1 and §4 ("no match-type picker") and `mainMenuItems.ts` change                                                                                                                                                                               | ref 14 §1, §4; 13 §3                       | owner    | L    |
| DU-10 | New session phases for the queue (searching, cancel, match found, connecting) and disconnect handling. `SESSION_PHASES` and `SESSION_TRANSITIONS` (`game/SessionController.constants.ts:4`) are exhaustive and tested pair by pair, so each phase is a state class, a table row and tests   | 13 §2; ref 14 §2, §5                       | owner    | M    |
| DU-11 | Which selection screens a Duel keeps (60 s character select with nine allied pedestals and the pre-launch reveal do not fit 1v1), how teams are assigned (today `playerTeam` is drawn from the seed, FR-001), and whether countdowns become server time (today `SessionClock`, client only) | 13 §2; ref 14 §2, §5; `buildMatchSetup.ts` | owner    | M    |
| DU-12 | A `ResultsScreen` and HUD for kills per side and the round number (`matchSlice`, `Scoreboard`)                                                                                                                                                                                              | 13 §3; 12 §10                              | owner    | L    |

### 2.7 Profiles, stats and the database

- **Identity.** `ProfileDtoV1` (14 §7) is local, and the constraints say "no accounts".
  Matchmaking needs an identity that holds across devices: accounts or server ids (N-1, Q11).
- **Trust.** Rating inputs (wins against better players, streaks, online and offline counts)
  cannot come from an editable IndexedDB record (ES-08's own threat). Either the server hosts or
  verifies the match (re-simulates the replay, checks `finalHash`), or offline matches feed history
  but not rating (Q12).
- **Data shape.** `ProfileDtoV1.stats` lacks streaks, rating and online/offline counts;
  `MatchResult` (12 §10) has one `playerTeam` and `hadHuman`, and `LegendStats` no player id. The
  rating algorithm itself is premature (§3.2).
- **Seam.** ADR 0005's `HttpStorageAdapter` behind `StorageAdapter` (`backlog-post-mvp.md:68`)
  keeps the repositories; the sync and conflict policy is new (a 14 section plus an ADR, owner).

## 3. Scalability

### 3.1 Docs and NFRs that need new entries

| Area         | Today                                                                                               | New entry needed (owner approval for all)                                                                                                                                                                                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requirements | NFR-007 "Scalability" is units per team; NFR-021 is one match's tick budget on the reference laptop | NFRs for concurrent players and matches per server, matchmaking wait, input latency, reconnect, server tick budget per match, bandwidth per player, availability; security NFRs for authentication, rate limits, command validation and stats integrity                                                                 |
| Architecture | 01 has four client/core layers; 02 covers `packages/core` and `apps/client`                         | A networking and server doc (transport port, authority model, session and lobby services, match hosting, persistence API), and rows in 01 (layers), 02 (a server app's folders and import rules), 03 §3/§8/§9, 08 §7/§10, 09 (a transport port beside `StorageAdapter`), 13 §2, 14, 15 (desync reports, server logging) |
| Decisions    | ADR 0005 (no server); ADR 0001 (npm workspaces `apps/*`, `packages/*`)                              | An ADR for the networking model; an ADR for the server runtime and hosting; an ADR for the database. `apps/server` fits the `apps/*` workspace glob (`package.json:7-10`), but its tsconfig, lint, knip, tests and CI are new guardrail config (ADR)                                                                    |
| Dependencies | "No new dependency without approval" (`AGENTS.md`)                                                  | A WebSocket library, a database driver and any auth library each need the owner's approval                                                                                                                                                                                                                              |

A rough bound from existing numbers, not a measurement: NFR-021 allows 8 ms per tick at 30 ticks
per second, which is up to about a quarter of one CPU core per full 10v10 match at the unit cap.
So the owner's example of 50 solo 10v10 matches would need up to about a dozen cores **if solo
matches run on the server**. A Duel (two Legends, no AI, no hordes) is far cheaper. Whether solo
matches are server-hosted is therefore the biggest sizing question (Q13).

### 3.2 Premature now

Building any of these before the owner picks the networking model (Q2) wastes work: choosing a
database or ORM; hosting, containers, load balancing or sharding; a rating algorithm; rollback or
client prediction; fixed-point maths; 10v10 all-human netcode; production authentication. The
backlog row (`backlog-post-mvp.md:68`) and ADR 0005's port already leave room for them.

### 3.3 What Sprint 2 must not foreclose

1. **All state in `GameState`, all changes through `Command`s** (N-2, N-6, N-7). Write
   `PlayerController` and the `intent` handler in core, not more client-side translation.
2. **Determinism across machines** (N-3): fix AK-3 and AM-10 and lint `Math.hypot` with the rest
   of ADR 0012's list. Keep comparators total and iteration in store order.
3. **No per-process shared mutable state in core** (N-4): content frozen deeply, no module-level
   caches. One process may host many `Simulation`s.
4. **More than one human** (N-1e): new code in `match/` and `ai/` keys players by a seat or player
   id, never a single `humanLegendId` or `playerTeam`. Core has neither yet
   (`packages/core/src` has no `match/`), so this costs nothing today.
5. **`createMatch(setup)` as the only composition root** (N-5, AC-2), with the command source
   injected, so a network source replaces `DeviceIntentSource` without touching `Match`.
6. **Bounded memory per match** (NFR-023), because a server keeps many matches alive.

## 4. DEC-11 abilities

As the owner wrote them in `INBOX.md:28-30`:

- "Hamstring ability approved for Warrior class. Fan of Sorrows also approved. Eclipse alternate
  ultimate approved for MVP"
- "Shield wall, Sunder, and Colossus Roar approved for Sentinel class. Avalanche approved as
  alternate ultimate for MVP"
- "Sanctuary and Aether Lance approved for Magus class (Enemy Sentinel's Sunder should shatter
  Sanctuary). Last Rites alternate ultimate approved for MVP."

| Class    | Game-doc abilities (ref 06)           | Approved additions                 | Abilities vs 3 slots | Ultimates (game doc + approved)  | Prior status in `more-abilities.md`                                       |
| -------- | ------------------------------------- | ---------------------------------- | -------------------- | -------------------------------- | ------------------------------------------------------------------------- |
| Warrior  | Veil, Blade Runner                    | Hamstring, Fan of Sorrows          | 4 for 3              | Fury + Eclipse                   | Hamstring MVP; Fan of Sorrows post-MVP; Eclipse MVP-if-time               |
| Sentinel | Rip & Tear (undescribed, OQ-32), Slam | Shield Wall, Sunder, Colossus Roar | 5 for 3              | Berserk, Meteor Fall + Avalanche | Shield Wall MVP; Sunder and Colossus Roar post-MVP; Avalanche MVP-if-time |
| Magus    | Imbue, Shockwave                      | Sanctuary, Aether Lance            | 4 for 3              | Death Ray, Nova + Last Rites     | Sanctuary MVP; Aether Lance post-MVP; Last Rites MVP-if-time              |

| Id   | Impact                                                                                                                                                                                                                                                                                                                                                                                                               | Docs and code                                                                                                                       | Approval   | Risk |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---- |
| AB-1 | **Count conflict (Q3).** The rule is "3 abilities + 1 ultimate". 05 §12's `Loadout` already holds three `AbilityChoice`s validated by `ClassOwnsAbilityRule`, and `ultimate` is "a choice where a class has two", so a per-class **pool** larger than the slots needs no new architecture. It does change FR-058's acceptance ("lists exactly three `abilityIds` and one `ultimateId`") and the MVP tables           | FR-058, FR-059; ref 06 (table, "Counting"), ref 08 (Ultimate row), ref 11 (:79); 05 §17 table; plan 4.3; `LegendDefinition` content | owner      | M    |
| AB-2 | **Which game-doc ultimates stay.** The answers add alternates but do not say whether Meteor Fall and Nova remain MVP (option (a) had made them post-MVP)                                                                                                                                                                                                                                                             | ref 06; plan 4.3                                                                                                                    | owner      | L    |
| AB-3 | **`feared` replaces `taunted` for Colossus Roar** (`more-abilities.md:108`, changed in `8d0d308`). `feared` has no row in `more-abilities.md` §7 or 05 §8's id list, which still name only `taunted`. `taunted` stays for Mirror of Ash (post-MVP). `control-immune` lists `taunted` but not `feared`. The Counterplay cell cites `mechanics-ideas.md` for "bot-only", but that file mentions neither fear nor taunt | `more-abilities.md` §3, §7; 05 §8; 11 §4 (controllers must obey `feared`)                                                           | owner (05) | L    |
| AB-4 | **"Sunder should shatter Sanctuary"** is an interaction rule. 05 §4 already routes interactions through `ComboRule` listeners on `ability-cast` in `abilities/combos/` (`defaultComboRules.ts`), but lists combos as MVP-if-time (05 §17). Sunder's line ends an **enemy** Sanctuary `EffectZone` it crosses. Allied Sunder is unaffected, per "Enemy Sentinel's"                                                    | 05 §4, §17; plan 4.3 "Interactions"                                                                                                 | owner      | L    |
| AB-5 | **Effect kinds promoted to MVP.** Shield Wall needs `summon` (an obstacle), which is MVP-if-time in 05 §17; Avalanche needs a continuous dash; Aether Lance needs `reveal`, which is post-MVP in 05 §17                                                                                                                                                                                                              | 05 §3, §17                                                                                                                          | owner      | M    |
| AB-6 | **Numbers.** `balancing.md` "Aether costs and cooldowns" prices only the recommended thirds. Every newly approved ability needs costs, cooldowns and magnitudes from the owner or marked `TUNE` placeholders (`AGENTS.md`: no product numbers by agents)                                                                                                                                                             | `suggestions/balancing.md`                                                                                                          | owner      | M    |
| AB-7 | **Fear and taunt are bot-only** per the table, so in a Duel (two humans) Colossus Roar is a slow and a damage reduction only. Q14 asks whether fear applies to human Legends                                                                                                                                                                                                                                         | `more-abilities.md` §3                                                                                                              | owner      | L    |

**Plan.** Phase 4 sprint 4.3 grows from 9 abilities and 3 ultimates to up to 13 and 8, in S4 with
the freeze on Nov 20. **Affected:** the Legend and ability implementers (Phase 4 owners are `_`,
audit AD-17) and the AI owner (controllers obey `feared`).

## 5. The other owner answers

### 5.1 DEC-12 volatile crystals (approved with a caveat)

| Id   | Impact                                                                                                                                                                                                                                                                                                   | Docs and code                                                                          | Approval   |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------- |
| CR-1 | The 300 s and 240 s timers stand as `TUNE` starting values                                                                                                                                                                                                                                               | ref 04 (Outer camps; timeline); FR-033; 07 §6 table                                    | owner (07) |
| CR-2 | Crystals become breakable once the centre boss spawns. `BreakabilityRule` (07 §3) has `never` for crystals; it needs a new member keyed to an event or phase (`boss-summoned` or the `mid-game` phase, Q15) plus one evaluator `case`, as 07 §3 prescribes                                               | 07 §3, §6; FR-033 ("unbreakable crystal"); glossary "Camp"; `balancing.md` crystal row | owner      |
| CR-3 | On death: a shockwave that destroys the camp, massive area damage, and a temporary `insanity` debuff. That is a `structure-destroyed` listener in the owning system (07 §8) with content for radius and damage; destroying the camp also ends its spawner                                                | 07 §8; 05 §8                                                                           | owner      |
| CR-4 | `insanity` is a `StatusEffectDefinition` with no modifiers or flags, only a display name, description and icon. 05 §15's `PlayerSnapshot.statusIds` already carries statuses, but no HUD element in 13 §3 renders them, so a status strip is a new HUD row; the icon is an asset with a licence (14 §11) | 05 §8, §15; 13 §3; asset manifest                                                      | owner      |

Corner camps are MVP-if-time and first in the cut order (DEC-07). All of this matters only if they
survive the cut.

### 5.2 DEC-13 match length: 30 minutes

`plannedMatchSeconds` becomes 1800 in `packages/core/src/config/defaultGameConfig.ts:28` (the TUNE
note "DEC-13 pending" goes). Every derived value:

| Value                                              | Where it lives                                                                                                                                                     | At 1200 s      | At 1800 s                      | Scaling                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ------------------------------ | --------------------------- |
| Quarter mark (mini-bosses)                         | 12 §3 `atFraction: 0.25`                                                                                                                                           | 300 s          | 450 s                          | Mechanical (fraction)       |
| Mid-game (gem, GreaterBoss)                        | 12 §3 `atFraction: 0.5`                                                                                                                                            | 600 s          | 900 s                          | Mechanical                  |
| End-game marker                                    | 12 §2-§3 `atFraction: 0.75` (Recommendation, no source)                                                                                                            | 900 s          | 1350 s                         | Mechanical                  |
| Score cap `maxMatchSeconds`                        | 12 §6 `ScoreCapCondition` (TUNE 2700); `balancing.md`                                                                                                              | 2700 s (2.25×) | 4050 s if scaled; or keep 2700 | **Owner** (Q16)             |
| Boss expected levels and stats                     | `balancing.md` "Mini-boss and Greater Boss" (levels 4 and 7 at 300 and 600 s)                                                                                      | 4 / 7          | depends on the XP curve        | **Owner** (balance)         |
| Match-length metrics                               | `balancing.md` "Metrics per match" (median 18-25 min, P95 < 35 min)                                                                                                | —              | rescale                        | **Owner**                   |
| Countdown, horde cadence, crystal and guard timers | 03 §10; 07 §6; DEC-12                                                                                                                                              | absolute       | unchanged                      | None (not fractions)        |
| Prose quoting the old length                       | 03 §10 Source column; 12 §3 table; `balancing.md:165,170,219`; ref 13 DISC-34 row; plan 3.5 ("20-minute timeline"); 14 §7 replay estimate; `more-abilities.md:119` | —              | —                              | Mechanical, owner for 03/12 |
| Soak length                                        | NFR-023; ES-05 table; plan 6 ("30-minute soak", "levels at 10 and 20 min")                                                                                         | 30 min         | should cover one full match    | Owner (plan)                |

`diagnostics/__fixtures__/wanderSeed7.replay.ts:33` keeps 1200: a replay records the config it ran
with, and nothing reads `plannedMatchSeconds` yet, so no hash moves.

### 5.3 DEC-15 camp weights and placement

The answer keeps the weight classes by position in the corridor, splits sides at the vertical centre
line, and places camps **at random per side**, so the two sides differ, with **equal counts per
weight class** on each side. Today every camp is placed for the west half and mirrored
(`MapBuilder.placeCamps`, `MapBuilder.ts:113-145`, through `addMirrored`), and symmetry is checked on
every `generate` (`validateMapDefinition.ts:84-86` → `findAsymmetries` in `map/mapSymmetry.ts`).

| Id   | What changes                                                                                                                                                                                                                                                                                                                                     | Approval |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| CW-1 | ADR 0009 ("symmetric about the centre"; Consequences: "Tests: mirror symmetry") needs an amendment or a superseding ADR: camps are exempt from mirroring and bound by weighted parity instead                                                                                                                                                    | owner    |
| CW-2 | 06 §2 ("always mirrored … no symmetry setting"), §3 step 5 and the "Symmetry is not a step" paragraph, §7 "Mirror invariant" and "Determinism" (a different seed now moves camps too), and the §10 "Camp weights" row (DEC-15 is answered)                                                                                                       | owner    |
| CW-3 | FR-014 ("two symmetric territories") and FR-032; ref 05-map (:63-70, :86 "the Dark side mirrors it"); `balancing.md:72`; ref 13 DISC-42 row                                                                                                                                                                                                      | owner    |
| CW-4 | Code: `placeCampSlots` (`campPlacement.ts`) draws positions from the map `Rng` per side and per corridor. The class comes from the slot's rank in its corridor (nearest lane light, middle medium, deepest heavy), so both sides get the same class counts. Placement must keep the existing clearances from lanes and features                  | —        |
| CW-5 | `findAsymmetries` skips `kind: 'camp'`, and a new check in `validateMapDefinition` requires equal counts per `definitionId` on each side of the centre line, with a test that deliberately breaks it                                                                                                                                             | —        |
| CW-6 | `MapGenerator.test.ts`: "changes only the scattered obstacles when the seed changes" (:63), the DISC-42 depth test (:226, replaced by the rank rule), the symmetry test (:431, now camp-exempt) and the golden hash (:28, :509, re-pinned once, deliberately). Camps consume the `Rng` before `scatterObstacles`, so obstacle positions move too | —        |

**Order.** A8-1 first (the `MapRandom` → `SeededRandom` swap, after AM-1) changes the random stream
on its own; DEC-15 second, so each golden-hash re-pin has one cause. AM-3 and AM-19 touch the same
function. **Risk M:** the rule balances counts only, so one side's camps may sit nearer its lanes or
Stronghold than the other's (Q17). The Duel arena has no camps.

### 5.4 Session D: `useAppDispatch` and the `character-select` row

The owner delegated both: "Accept recommended option if it is cleaner long-term. For D, set to
whichever is cleaner in the long-term." This review finds:

- **SD-1.** Option (a) (no `useAppDispatch`; the UI emits intents) is the cleaner long-term choice
  **together with** AS-4's `ui/` lint (audit AS-B2). Edits: 13 §5 (:191), `apps/client/AGENTS.md:49`,
  and record a DEC. The 2026-10-03 prompts doc is a record and is not rewritten (ADR 0011).
- **SD-2.** The 13 §2 `character-select` row (:107) should say it records the class choice and
  starts the countdown, and the `menu` row keeps building `MatchSetup` (code, ref 14 §5). This is
  also the shape a Duel needs, where the team and opponent come from matchmaking (DU-11).

Both edit an architecture doc or `AGENTS.md`, so the owner sees the text before merge (AD-4).

### 5.5 PROTO-01

- **PR-1.** "Escorts to be deleted this sprint in favour of real hoards." This sets the timing
  that DEC-33 left at "when his Phase 3 minions replace it". Every piece carries
  `PROTOTYPE(PROTO-01)` (18 markers in 16 files; `git grep -n 'PROTOTYPE(PROTO-01)'`). Under A23-1's
  rule, the items that touch only prototype code close with the deletion: A23-5, A23-8, A23-9 and
  A23-12. Those about the `AiSystem` and `Controller` contract (A23-2, A23-6, A23-10, A23-15) carry
  over to the designed replacement. Open: does deletion wait for real hordes (Phase 2.7
  `SpawnSystem` plus Phase 3.1 hordes, planned for S2 and S3), or happen first? (Q18)
- **PR-2.** The owner confirms `AiSystem` is the bot AI for bots, camps, bosses and mobs (11 §1).
  The question was where its file lives, and that stays open: core `AGENTS.md` forbids `systems/` →
  `ai/`, 02 §2 allows it, so today it sits in `ai/` (A23-18, `DefaultSystemPipeline.ts:17`). One
  ruling is needed, and A23-2 (the `Controller` contract) before Phase 3 builds on it.
- **PR-3.** The marker-convention proposal (add `PROTOTYPE(<id>) TEMPORARY` to `AGENTS.md`, A23-17)
  is unanswered.

## 6. Orphaned agent requests (INBOX "Requests for the agent")

Those sessions are gone (INBOX header); upcoming sessions decide, and the owner still approves any
architecture or `AGENTS.md` text.

| INBOX line | Request                                                                                   | Audit ids                                     | Proposed home                                                    |
| ---------- | ----------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| :88        | `PlayerController` + `intent` handler in core                                             | N-7                                           | W4 (kernel and player control); prerequisite for the Duel        |
| :93        | Focus-loss release in `useMatch`; `DeviceIntentSource` behind `IntentSource`              | AC-20, AC-21                                  | W5 (`createMatch` factory); the port is also the network seam    |
| :100       | Session A's stand-in swap to `GameConfig`/`SeededRandom`                                  | A8-1, AM-1                                    | W7 (map), before DEC-15                                          |
| :109       | Session C checklist: all done except (3)                                                  | A13-1                                         | W4; then move the item to Done                                   |
| :145       | Route `dev-remove-entity` through `DeathSystem`; may `diagnostics/` import `components/`? | A13-1, AK-2                                   | W4 (option (a), re-record the fixture); AK-2 in the doc batch W2 |
| :153       | `Simulation` takes one options object                                                     | AD-20 (done)                                  | Move to Done                                                     |
| :158       | Pipeline and invariants as classes; seed and severity on violations                       | AK-8, AK-24                                   | W2 ruling, then W4                                               |
| :163       | PR #14 review items (1)-(10)                                                              | AE-B4, AE-B1, AE-B3, AK-1, AD-18, AE-18, AE-9 | W2 (one doc and approval batch, AD-3/AD-B3)                      |
| :200       | Log sinks' folder; first-frame tick count                                                 | AC-27, A24-5                                  | W2 (doc), W5 (wire sinks)                                        |
| :206       | Status notes for 08 §11 and 09 §11                                                        | AC-3                                          | W2                                                               |
| :243       | Mount the pause overlay                                                                   | A24-2                                         | W5 (match screen with AS-1)                                      |
| :246       | Settings and bindings inside the match                                                    | A24-1                                         | W5                                                               |

## 7. Dependency-ordered work items

Owner approval comes first wherever a design doc changes.

1. **W1: Owner decisions and plan re-cut** (Q1-Q3, Q13): networking model (with the sibling
   research), what leaves S3 and S4 to fit a Duel, the ability pools. Everything below depends on it.
2. **W2: ADR and doc batch (owner).** The "no server" ADR and catalogue edits (N-1); the ADR 0009
   amendment (CW-1); DEC-13 (§5.2); SD-1, SD-2; the queued status notes and doc conflicts (§6 rows
   :145, :158, :163, :200, :206; AD-3, AD-4). Only N-1 waits for W1.
3. **W3: Determinism and state hygiene** (N-2, N-3, N-4, N-8, N-9): AK-6, AK-3, AM-10, AK-5, AE-4,
   AK-12, AK-4, AK-7, and an ADR 0012 lint amendment for `hypot`. No product dependency: S2 week 1.
4. **W4: Player control and kernel cleanup** (N-6, N-7): `PlayerController` and the `intent`
   handler in core; a non-dev setup spawn path (A23-20); A13-1; AK-8/AK-24 per W2. After W3.
5. **W5: `createMatch(setup)` and the match lifetime** (N-5): AS-1, AC-1, AC-2, A24-1, A24-2, the
   `IntentSource` port (AC-20). After the AS-7 C2/AC-25 ruling on who owns the lifetime.
6. **W6: PROTO-01 removal** (PR-1): the 18 marked pieces. After Q18; after W4 if the spawn path moves.
7. **W7: Map** (CW-4…CW-6): A8-1 after AM-1, then DEC-15, then AM-3. After W2's ADR 0009 amendment.
8. **W8: Combat with kill credit** (DU-6): sprint 2.2 (`DamagePipeline`, `entity-died` with a
   killer, AK-10) plus a basic attack. Any Duel needs it.
9. **W9: Arena geometry** (DU-3…DU-5): core layout and client dressing, coordinated with A22-1.
   After Q6 and Q7.
10. **W10: Mode seam and Duel rules** (DU-1, DU-2, DU-6…DU-8, §2.5): mode id, Duel timeline, phases,
    `KillCountCondition`, round reset, per-player ability state. After W8, W9 and sprint 4.2.
11. **W11: Networking and server skeleton** (N-1, §3): server app, transport port, lobby and queue,
    Duel hosting or relay per W1. After W2-W5 and W10.
12. **W12: Duel screens** (DU-9…DU-12). After W5 and W11's queue API.
13. **W13: Profiles and stats online** (§2.7): identity, `HttpStorageAdapter`, stats integrity per
    Q12. After W11.
14. **W14: DEC-11 content** (AB-1…AB-7, Phase 4) and **DEC-12** (CR-1…CR-4, sprint 3.4, if corner
    camps survive the cut). After W1 and W2.

## 8. Open questions for the owner

1. **Q1.** Both new requirements are due at the end of S3 (Nov 13), but abilities are S4 and combat
   S2. What moves or is cut? Is a Duel with basic attacks only acceptable for S3?
2. **Q2.** Which networking model: the server runs the match (authoritative), or the server relays
   inputs and clients simulate (lockstep)? It decides server cost and cheating exposure (under
   lockstep every client holds the full state, so Veil and Eclipse invisibility can leak).
3. **Q3.** DEC-11: are the approved abilities a loadout **pool** (pick 3 of 4 or 5, and 1 of 2 or 3
   ultimates), or does the "3 + 1" rule change? Does Sentinel keep Rip & Tear?
4. **Q4.** Do Meteor Fall and Nova stay MVP ultimates next to Avalanche and Last Rites?
5. **Q5.** What does a feared unit do, and does `control-immune` cover it?
6. **Q6.** How big is the Duel arena in metres? The interior is drawn at 1800 × 2200 units today.
7. **Q7.** In a Duel, does the outer world exist, or only the interior? Inert structures, or none?
8. **Q8.** Match point: an announcement at 9 kills, or "win by two"? What happens on a double kill or
   a death with no killer?
9. **Q9.** Is the Duel ultimate a time cooldown, or the charge meter with no loss on death?
10. **Q10.** Do non-ultimate cooldowns also reset on death in the 10v10 mode?
11. **Q11.** Player identity: accounts with login, or anonymous server ids for now? Any personal data?
12. **Q12.** Do offline (vs bots) matches count toward rating or only toward history? May the server
    re-simulate submitted replays to verify results?
13. **Q13.** Do solo 10v10 matches against bots run on the server or only in the browser? (Sizing.)
14. **Q14.** Does fear apply to human Legends (for example in a Duel)?
15. **Q15.** Crystals turn volatile on `boss-summoned` or at the `mid-game` mark? If the GreaterBoss
    (MVP-if-time) is cut, do crystals ever turn volatile? What should `insanity` be called and show?
16. **Q16.** Score cap at 30 minutes: scale it to 4050 s, or keep 2700 s?
17. **Q17.** Does the random, parity-checked placement also apply to corner camps? Is parity per side
    only, or per corridor too?
18. **Q18.** PROTO-01: delete the escort before real hordes exist (no minions for a while), or with
    them? Which sprint is "this sprint"? And `AiSystem`'s folder (PR-2) and the marker convention
    (PR-3).
19. **Q19.** What is the S3 acceptance test for "hundreds or thousands of concurrent players"?

## 9. Who needs to know

- **Legend and entity implementers** (the session C entity and system work is Claudio Delgado's, per
  `git log` of `packages/core/src/entities`; Phase 4 owners are unassigned, AD-17): DEC-11 pools
  (AB-1…AB-7), `feared`, the Sunder-Sanctuary combo, the Duel cooldown rules and per-player ability
  state (§2.5), W3 and W4.
- **Minions, mobs and AI** (Samarjit Bhogal, DEC-33): PROTO-01 deletion timing and `AiSystem`
  placement (PR-1…PR-3); controllers obeying `feared`; DEC-12 crystals; no spawns in a Duel (§2.3).
- **Architecture owner** (sholtzman): every "owner" row; the ADRs in W2 and W11; the plan re-cut (W1).
- **Map** (Aryan Walanj reviews map PRs, DEC-04): DEC-15 and the ADR 0009 amendment (§5.3), A8-1
  order, the arena split and scale (DU-3, DU-4), A22-1's split line.
- **Client lane** (the owners of sessions D, F, G and H): `createMatch` (W5), the `IntentSource`
  network seam, queue phases and Duel screens (DU-9…DU-12), SD-1/SD-2, A24-1 and A24-2.
- **Repository admin** (SamarjitBhogal, `main`): CI and branch protection for a new server app
  (AD-1).

## What this review could not verify

- Nothing was run except `npm run docs:check`; every finding comes from reading files at `8d0d308`.
- Audit items are cited as written on `origin/chore/sprint-1-audit`, not re-checked one by one.
- §3.1's CPU bound is arithmetic on NFR-021's budget, not a measurement.
- Roles are named only where the repo records them (DEC-04, DEC-33, `git log`); the owners of
  sessions D, F, G, H and of Phase 4 are not recorded.
- Cross-machine bit-exactness of IEEE arithmetic plus `deterministicMath` is taken from 10 §10 and
  ADR 0012, and left to the sibling networking research.

## Related

- [Owner decisions log](../reference/game-design/13-owner-decisions-log.md) ·
  [Delivery plan](../plan/README.md) · [MVP requirements](../requirements/06-mvp-requirements.md)
- [ADR 0005](../decisions/0005-indexeddb-persistence.md) ·
  [ADR 0009](../decisions/0009-config-driven-map-generation.md) ·
  [12 Match director](../architecture/12-game-story-and-match-director.md) ·
  [13 Game interface](../architecture/13-game-interface.md) ·
  [06 Map](../architecture/06-map-and-minimap.md) ·
  [More abilities](../reference/suggestions/more-abilities.md)
