---
title: Game story and match director
description: How a match unfolds over time - the MatchDirector state machine over MatchPhase, the MatchTimeline data that drives it, scoring, victory, boss rewards and the Eternal ascension, announcer and lore hooks, and the MatchResult handed to match history; read this before touching packages/core/src/match/ or anything that reacts to a match phase.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-30
tags: [architecture, match, timeline, phases, scoring, story, lore]
paths:
  [
    'packages/core/src/match/**',
    'packages/core/src/config/matchPhases.ts',
    'packages/core/src/config/MatchTimelineEntry.types.ts',
    'packages/core/src/config/timelineMarkTick.ts',
    'packages/core/src/state/MatchState.types.ts',
    'packages/core/src/systems/MatchDirectorSystem.ts',
  ]
related:
  [
    'docs/architecture/03-game-model.md',
    'docs/architecture/07-structures-obstacles-and-destructibles.md',
    'docs/architecture/11-game-ai.md',
    'docs/architecture/13-game-interface.md',
    'docs/reference/game-design/04-objectives-capture-points-and-bosses.md',
  ]
---

# Game story and match director

**Purpose.** Read this when you change how a match progresses: the countdown, when towers and
camps start spawning, the quarter-mark mini-bosses, the mid-game gem and the Eternal, scoring,
the win condition, what the announcer says, where lore text lives and what is handed to match
history when a team's win objective is lost. The match rules live in `packages/core/src/match/` (L2) as a
**State pattern over `MatchPhase` driven by `MatchTimeline` data**, so a new timed event is one
timeline entry plus one handler class. Every block is a **sketch** and every number quoted from the
sources is `TUNE`; §13 says what is built.

## 1. Where it sits

- Folder `packages/core/src/match/`; may import `state/`, `config/`, `components/`, `utils/`, `teams/`, content
  types and the `Logger` port, `makeLogRecord` and `DebugConfig` of `diagnostics/`, so `diagnostics/` never imports `match/` ([02-code-structure.md](02-code-structure.md) §2). Files: `MatchDirector.ts`,
  `phases/<Name>Phase.ts` + `defaultMatchPhases.ts`, `MatchTimeline.ts`,
  `TimelineActionRegistry.types.ts` + `actions/<Kind>Action.ts` + `defaultTimelineActions.ts`,
  `defaultMatchDirector.ts` (the director with the default phases, actions and conditions),
  `Scoring.ts`, `VictoryCondition.types.ts` + `conditions/<Name>Condition.ts` +
  `defaultVictoryConditions.ts`, `rewards/BossRewardHandler.ts`. `MatchResult` and `Verdict`
  (`state/MatchResult.types.ts`) live in `state/` and `VictoryConditionId`
  (`config/VictoryConditionId.types.ts`) in `config/`, for the same reason as `MatchPhase`: `state/`
  may not import `match/`, and `content/` keys verdict lines by it. `MatchPhase` (`matchPhases.ts`), the
  `MatchTimelineEntry` types and `timelineMarkTick.ts` live in `config/` because the timeline is part
  of `GameConfig` and names phases ([03-game-model.md](03-game-model.md) §10).
- `Simulation`'s constructor builds the director (core's composition root). The
  `MatchDirectorSystem` (`systems/`) is a thin adapter that calls `director.update(state)` once per
  tick; the director does nothing once the result is set (the system stays a plain adapter). It runs after `DeathSystem` and before
  `InvariantSystem` and `SnapshotSystem`, so an objective lost this tick ends the match this
  tick and the snapshot already carries the new phase.
- Rule 12 applies: the director never calls a system. It changes `state.match` and emits typed
  `GameEvents` (`phase-changed`, `spawn-requested`, `match-ended`, ...); the owning systems and the
  client's `MatchBridge` listen. Everything it remembers lives in `state.match` (plain data), so
  it is hashed by `StateHasher`, snapshotted and replayed like everything else.

## 2. `MatchPhase` and the State pattern

```ts
// Sketch: packages/core/src/config/matchPhases.ts
export type MatchPhase =
  'countdown' | 'early-game' | 'quarter-mark' | 'mid-game' | 'end-game' | 'victory' | 'defeat';

// DirectorContext = { state: GameState; enterPhase(phase: MatchPhase): void }; enterPhase is how a phase or action moves the match on
export interface MatchPhaseState {
  readonly phase: MatchPhase;
  enter(ctx: DirectorContext): void; // emits requests and announcements; never spawns directly
  update(ctx: DirectorContext): void; // rare per-tick bookkeeping (atmosphere spread, end-game)
  exit(ctx: DirectorContext): void;
}
```

One class per phase under `phases/` (`CountdownPhase` … `DefeatPhase`), registered in
`defaultMatchPhases.ts`, the only file that names them. The registry type is a record keyed by
every `MatchPhase`, so a missing phase class does not compile. The director never `switch`es on the
phase: adding a phase is a class, a registry line and a timeline entry (OCP). Transitions are
strictly forward; `victory` and `defeat` are terminal.

| Phase                | Enters when                                                                                                                                             | What happens and who owns it                                                                                                                                                                                                                                                                                                                                                                                                                                         | Status                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `countdown`          | tick 0                                                                                                                                                  | `SpawnSystem` spawns the `initialHordes` (3) light hordes of `hordeSizes.light` (16) per team from the Stronghold `Spawner`, one per lane (48 units, requirements doc). No tower spawns (FR-003): the first tower wave comes after the countdown (`07` §6). `CountdownPhase` sets `MatchState.isIdleHeld`: every unit is idle and can only turn (no walking, attacks, casts); spawns go on, camps spawn (DEC-81, DEC-84, DEC-88). The director spawns nothing.       | **MVP**                             |
| `early-game`         | `countdownSeconds` elapsed (`TUNE` 10 s, requirements doc)                                                                                              | Towers spawn a horde every `hordeSpawnIntervalSeconds` (`TUNE` 60 s) and forest camps activate after their cooldown: both are `Spawner` data consumed by `SpawnSystem`, not director logic.                                                                                                                                                                                                                                                                          | **MVP**                             |
| `quarter-mark`       | fraction 0.25 of `plannedMatchSeconds` (game doc "quarter mark")                                                                                        | The `spawn-mini-bosses` action emits one `spawn-requested` per outer-lane `CapturePoint` with the mini-boss table (boss plus support mobs); `CaptureSystem` sets `Capturable.lockedBy` while the boss lives (`07` §7).                                                                                                                                                                                                                                               | **MVP** (mini-boss is MVP, DISC-63) |
| `mid-game`           | fraction 0.5 (game doc "mid-game")                                                                                                                      | The `summon-greater-boss` action asks the `Cathedral` spawner for the `greater-boss`; `SpawnSystem` fulfils it and emits `boss-summoned`. `state.match.atmosphere` becomes `eternal` (views spread the change outward from the Cathedral by ticks elapsed). `StatusEffectSystem` applies `empowered` to camp units on `phase-changed`; corner camps' side waves start (`SpawnWave.afterPhase: 'mid-game'`, **Recommendation:** a new optional field on `07`'s type). | **MVP-if-time** (with the boss)     |
| `end-game`           | fraction 0.75, or the first `structure-breakability-changed` that makes a Stronghold wall breakable, whichever is first (**Recommendation:** no source) | Announcer and music only in the MVP; the extension point for late-game rules (score cap, reinforcement waves).                                                                                                                                                                                                                                                                                                                                                       | **MVP** (as a marker)               |
| `victory` / `defeat` | a `VictoryCondition` returns a verdict (§6)                                                                                                             | Terminal. `state.match.result` is built, `match-ended { result }` is emitted, the director goes inert. `victory` when `result.winner === state.match.playerTeam`, otherwise `defeat`; a draw (`winner: null`) enters `defeat` and the results screen says so (**Recommendation:** a `draw` phase is one class and one literal if wanted).                                                                                                                            | **MVP**                             |

The reference doc's shorthand `countdown → open → quarter → midgame → … → results` maps onto
these names; `results` is the client `SessionController` phase (`13` §2), not a `MatchPhase`. Sim
mode changes nothing: `playerTeam` is the spectated team, so a bot-versus-bot match still ends in
`victory` or `defeat` with `result.hadHuman === false`.

## 3. `MatchTimeline` as data

```ts
// Sketch: packages/core/src/config/MatchTimelineEntry.types.ts
export type TimelineMark = { readonly atTick: number } | { readonly atFraction: number }; // fraction of plannedMatchSeconds

export type TimelineAction =
  | { readonly kind: 'enter-phase'; readonly phase: MatchPhase }
  | {
      readonly kind: 'spawn-mini-bosses';
      readonly lanes: 'outer' | 'all';
      readonly tableId: SpawnTableId;
    }
  | { readonly kind: 'summon-greater-boss'; readonly bossId: BossId }
  | { readonly kind: 'announce'; readonly announcementId: AnnouncementId };

export type MatchTimelineEntry = {
  readonly id: string; // 'quarter-mark-bosses': stable, appears in MatchResult.timeline
  readonly at: TimelineMark;
  readonly action: TimelineAction;
};
```

| Entry (default config, `TUNE`) | `at`                     | Action                                                     | Source                                      |
| ------------------------------ | ------------------------ | ---------------------------------------------------------- | ------------------------------------------- |
| `countdown-over`               | `atTick: countdownTicks` | `enter-phase early-game`                                   | requirements doc; DEC-81, DEC-84            |
| `quarter-mark`                 | `atFraction: 0.25`       | `enter-phase quarter-mark`, then `spawn-mini-bosses outer` | game doc ("quarter mark of the game")       |
| `mid-game`                     | `atFraction: 0.5`        | `enter-phase mid-game`, then `summon-greater-boss`         | game doc (gem explodes mid-game)            |
| `end-game`                     | `atFraction: 0.75`       | `enter-phase end-game`                                     | **Recommendation:** no source               |
| `plannedMatchSeconds`          | `defaultGameConfig.ts`   | the denominator of every fraction                          | DEC-13, DEC-81 (planning length, not a cap) |

`GameConfig` gains `plannedMatchSeconds` (the reference doc calls it `matchLengthTicks`; seconds
in config, ticks at runtime, per `03` §10). `MatchTimeline.resolve(config)` turns every mark into
a tick once at construction and sorts entries by tick, then by config order. Both it and
`validateGameConfig` use one formula for that tick (`config/timelineMarkTick.ts`), so the order
validation checks is the order the match runs. `validateGameConfig`
rejects fractions outside `[0, 1]`, unsorted entries, `enter-phase` entries out of phase order, a timeline with no `enter-phase` entry or
whose first one is not at `round(countdownSeconds × tickRate)`, an `enter-phase` into `victory` or `defeat`, a
countdown longer than the planned match, and a `tableId` or `bossId` missing from the catalogue.
The `at: 'quarter' | 'mid'` shorthand in `03` §10 is sugar for the two fractions
(**Recommendation:** keep only the fraction form in code). `TimelineActionRegistry` maps
`action.kind` to one `TimelineActionHandler` class (`actions/SpawnMiniBossesAction.ts`, ...)
registered in `defaultTimelineActions.ts` (a mapped type over every action kind, so a missing
handler does not compile): the reference doc's "one timeline entry plus one
handler class", so a new timed event never touches the director. The developer-menu command
`dev-set-phase` (**MVP-if-time**, `suggestions/mechanics-ideas.md` §9) fast-forwards by running
every skipped entry in order, so the world after a jump equals the world after waiting.

## 4. `MatchDirector`

```ts
// Sketch: packages/core/src/match/MatchDirector.ts
export class MatchDirector {
  // MatchDirectorOptions: phases (defaultMatchPhases.ts), timeline (entries sorted by tick),
  // actions, order (MATCH_PHASES), debug, logger, conditions (defaultVictoryConditions.ts)
  // and scoring. One object, so a new part does not change every caller.
  public constructor(private readonly options: MatchDirectorOptions) {}

  /** Once, before tick 0: enters the first phase with no 'phase-changed', so its rules cover tick 0. */
  public start(state: GameState): void {
    this.options.phases[state.match.phase].enter(this.contextFor(state));
  }

  /** Once per tick, from MatchDirectorSystem. The order of the steps is fixed here. */
  public update(state: GameState): void {
    const ctx = this.contextFor(state); // { state, enterPhase }; enterPhase calls transition
    this.fireDueEntries(ctx); // entries with tick <= ctx.tick, from state.match.timelineCursor
    this.options.phases[ctx.state.match.phase].update(ctx);
    this.options.scoring.fold(ctx); // buffered events → counters; hold points per tick
    const verdict = this.firstVerdict(ctx);
    if (verdict !== null) this.end(verdict, ctx);
  }

  private transition(to: MatchPhase, ctx: DirectorContext): void {
    const from = ctx.state.match.phase;
    assertForward(from, to); // a backwards transition is a bug: throws in tests, logs in the browser
    this.options.phases[from].exit(ctx);
    ctx.state.setPhase(to); // the only writer of the phase: emits 'phase-changed' { from, to }, stamps phaseEnteredTick
    this.options.phases[to].enter(ctx);
  }
}
```

```ts
// Sketch: packages/core/src/state/MatchState.types.ts — the director's memory, all plain data
export type MatchState = {
  readonly phase: MatchPhase; // written only by GameState.setPhase
  readonly phaseEnteredTick: number;
  timelineCursor: number; // index of the next unfired entry
  readonly schedule: readonly { readonly entryId: string; readonly tick: number }[]; // every entry's resolved tick, in firing order; taken from config, so not hashed
  isIdleHeld: boolean; // the countdown freeze: while true every unit is idle and can only turn (DEC-88)
  readonly playerTeam: PlayableTeam; // chosen at match creation, also in sim mode
  humanLegendId: EntityId | null; // null = sim mode (11-game-ai.md §7); spectatedLegendId beside it
  atmosphere:
    'calm' | { readonly kind: 'eternal'; readonly originId: EntityId; readonly sinceTick: number };
  scoring: ScoringState;
  result: MatchResult | null;
};
```

A phase entered at tick T takes effect from step T+1, so the countdown holds steps 0 to T. A
backward phase move is a bug: it throws in tests, and in the browser it is logged and skipped.

SOLID: the director has one reason to change (the order of the per-tick steps, SRP); phases,
actions and conditions are injected abstractions (DIP) replaceable by fakes in tests (LSP); the
registries are the single places of change (OCP). After `match-ended` the simulation keeps
stepping and no unit is held (DEC-92: `Match` stops the loop a few seconds later), but the director
does nothing, so replay tails hash the same on every run.

## 5. Scoring

`Scoring` turns `GameEvents` into the counters the requirements doc calls "character scores"
and into team points. Counters per Legend (`LegendStats`) mirror the `LegendScoreDtoV1` fields in
`suggestions/mechanics-ideas.md` §8: `kills`, `deaths`, `assists`, `minionKills`, `damageDealt`,
`damageTaken`, `healing`, `structureDamage`, `structuresDestroyed`, `checkpointsWon`, `revives`,
`ultimatesCast`, `finalLevel`, `score`, plus `neutralKills` (DEC-79). Per team (`TeamStats`):
`score`, `structuresDestroyed`, `capturesHeldTicks`, `bossKills`. A team's `score` is the sum of
its Legends' scores plus its team-only points.

| Event                                                   | Counter change                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity-died` (victim Legend / Mob)                     | Legend killer `kills++` (Legend victim), or `minionKills++` / `neutralKills++` (Host / neutral mob), victim `deaths++`; only a Legend earns a kill (a projectile's hit counts for its owner), and a non-Legend last hit gives none; for a Legend victim only, every other Legend with damage on it within `assistWindowTicks` (`ASSIST_WINDOW_SECONDS`, DEC-79) `assists++`, whoever landed the last hit          |
| `damage-applied`                                        | source Legend `damageDealt`, target Legend `damageTaken`, structure targets `structureDamage` (shield damage included, DEC-123); for assists, `ScoringState` keeps the last tick each enemy Legend hit each Legend victim, one entry per attacker and victim, so its size follows the roster, not the hit rate; a victim's entries go at its death, so a hit from an earlier life never earns an assist (DEC-132) |
| `structure-destroyed`                                   | team `structuresDestroyed++`; Legends above `shareThreshold` of its damage `structuresDestroyed++`                                                                                                                                                                                                                                                                                                                |
| `checkpoint-cleared`, `capture-point-owner-changed`     | present Legends `checkpointsWon++`; the owning team starts or stops accruing `capturesHeldTicks` each tick                                                                                                                                                                                                                                                                                                        |
| `entity-revived`, `ability-cast` (ultimate), `level-up` | `revives++`, `ultimatesCast++`, `finalLevel`                                                                                                                                                                                                                                                                                                                                                                      |

Points are content, not code: `content/match/scoring.ts` holds `SCORING_WEIGHTS` (`TUNE`, the
owner's values, DEC-79): a Legend kill, an assist, a death (no points: the owner's request of
2026-10-27, game-loop plan §4.4) and a mob kill by weight class, keyed by `MobKind` so a new class fails to compile until it has a value. Bosses and the
sovereign give no personal points. A hit on or a kill of a unit on the attacker's own team, itself
included, counts for nothing, as for XP (DEC-130; O5, `05` §18). The assist window sits beside the weights. Points for
structures, captures and holds (FR-007, DEC-84 (2)) join `SCORING_WEIGHTS` with the work that
scores them, at the owner's values (DEC-131). Listeners only append to a per-tick buffer; `fold(ctx)` applies it
inside the director's pass ("listeners defer state changes to their own system's pass", `03` §4),
and `ScoringState` sits in `state.match` so it is hashed. Achievements (**MVP-if-time**) are pure
predicates over these counters evaluated at match end (`evaluateAchievements`,
`mechanics-ideas.md` §7): nothing is counted only for achievements.

## 6. Victory conditions and match end

```ts
// Sketch: packages/core/src/match/VictoryCondition.types.ts (`Verdict` lives in
// state/MatchResult.types.ts, `VictoryConditionId` in config/VictoryConditionId.types.ts)
export type Verdict = {
  readonly winner: PlayableTeam | null;
  readonly condition: VictoryConditionId;
}; // null winner = draw
export type VictoryConditionId = 'objective-lost' | 'forfeit' | 'aborted';
export interface VictoryCondition {
  readonly id: VictoryConditionId;
  check(ctx: DirectorContext): Verdict | null;
}
```

| Condition                | Rule                                                                                                                                                                                     | Status  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `ObjectiveLostCondition` | listens to `entity-died`; when the victim carries `WinObjective` and its team has no other live objective, the other team wins; both teams on one tick → draw (ADR 0021, DEC-71, DEC-77) | **MVP** |
| `ForfeitCondition`       | the `forfeit` command from the pause or results UI → `aborted`, no winner                                                                                                                | **MVP** |

Conditions are checked in registry order (`defaultVictoryConditions.ts`) and the first verdict
wins. `end()` builds the `MatchResult` (§10), stores it in `state.match.result`, transitions to
`victory` or `defeat`, and emits `match-ended { result }`. Entities are not retired at match end;
`RemovalCause 'match-ended'` (`03` §2) is used by `Simulation.dispose()`.

## 7. Boss rewards and the Eternal ascension

Rewards are `BossDefinition.rewards` data (`04-entity-architecture.md` §5) applied by
`rewards/BossRewardHandler.ts`, which listens to `entity-died` for `family: 'boss'` and emits
reward events; the owning systems do the work (rule 12).

| Boss death                   | Reward (game doc)                                 | Event emitted → listener                                                                                                                                                                                                                                 | Status          |
| ---------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `mini-boss` (lane zone)      | large team XP; permanent team buff; zone unlocked | `xp-granted { team, amount }` → `ProgressionSystem`; `team-buff-granted { team, statusId }` → `StatusEffectSystem` (kept in `TeamState.buffs`, applied to present and future units); `CaptureSystem` clears `lockedBy` on its own `entity-died` listener | **MVP**         |
| `mini-boss` (corner camp)    | team XP; a heavy wave down the worst lane         | `xp-granted`; `spawn-requested` from the Stronghold with a lane id (`MapLane.id`) chosen by `LaneAssessment` (content-weighted)                                                                                                                          | **MVP-if-time** |
| `greater-boss` (the Eternal) | whole team XP; the final-hit Legend ascends       | `xp-granted`; `form-applied { entityId, formId }`                                                                                                                                                                                                        | **MVP-if-time** |

The ascension is a **definition swap**, not a class (`mechanics-ideas.md` §1): `Loadout.formId`
points at a `FormDefinition` (`content/forms/<class>Eternal.ts`: stat multipliers, control
resistance, replacement ability ids, sprite, `endsOn: ['death']`); `AbilitySystem` and the
`DamagePipeline` read the active form through the `ContentCatalogue`, `SnapshotSystem` exposes
`formId` so views and the `AbilityBar` swap sprite and glyphs, and `DeathSystem` ends it on death
with no revive back (game doc). The killer is `entity-died.killer: DamageSource` resolved to the
owning Legend (projectiles and turrets carry their owner); a final hit by a minion or a turret
grants no form (**Recommendation:** the doc says "the player who lands the final hit"). The
mini-boss "consumable item" was removed (DISC-43) and is not modelled. Form change at
buildings later reuses `FormDefinition` plus one interaction class (D12, post-MVP).

## 8. Announcer and narrative hooks

`MatchBridge` (`apps/client/src/game/MatchBridge.ts`, **Recommendation:** the class that owns all
game → UI publishing so `Match` stays short) subscribes to `phase-changed`, `boss-summoned`,
`structure-destroyed`, `entity-died` (Legends), `capture-point-owner-changed`, `form-applied`,
`level-up` (the player) and `match-ended`, and publishes `announce { id, params, tick }` on the
`TypedEventBus`; `matchSlice.announcements` queues them and the `Announcer` HUD (`13` §3) shows
each for a TTL. Lines are content: `content/narrative/announcerLines.ts` maps each
`AnnouncementId` to templates per perspective (`ally`, `enemy`, `neutral`) with `{lane}`,
`{name}`, `{team}` placeholders filled from definition `displayName`s, plus a `priority`; the
client picks the perspective relative to `playerTeam`. Lore-flavoured wording lives in the
template, never in code: "the Wellspring stirs" (the proposed name for the Stronghold's summoner,
`suggestions/naming.md`).

| `AnnouncementId`                               | Trigger                                        | Status          |
| ---------------------------------------------- | ---------------------------------------------- | --------------- |
| `countdown`, `march`                           | `phase-changed` to `countdown`, `early-game`   | **MVP**         |
| `mini-bosses-rise`                             | `phase-changed` to `quarter-mark`              | **MVP**         |
| `gem-shatters`, `eternal-rises`                | `phase-changed` to `mid-game`; `boss-summoned` | **MVP-if-time** |
| `structure-fell`, `legend-fell`, `point-taken` | the three combat events                        | **MVP**         |
| `ascended`                                     | `form-applied`                                 | **MVP-if-time** |
| `victory`, `defeat`, `stalemate`               | `match-ended`                                  | **MVP**         |

Single place of change: an `AnnouncementId`, its template, and one line in `MatchBridge`'s
listener table. Live achievements (`mechanics-ideas.md` §7) reuse the same channel.

## 9. Lore integration

Lore text is display data, so by rule 11 it lives in core content:
`packages/core/src/content/narrative/` with `factions.ts` (Light, Dark, and "Medium" as the in-fiction
name of neutral until the open question is decided, `10-art-and-lore.md`), `loadingBlurbs.ts`,
`bossIntros.ts` (keyed by boss definition id) and `verdictLines.ts`; the `ContentCatalogue`
exposes them by id. How it surfaces: the loading screen shows `loadingBlurbs[seed % length]`
(deterministic per match, no `Math.random`; **MVP**); `MainMenuScreen` and `LoadoutScreen` show
the player team's faction blurb in its `TeamPalette` colours (**MVP**); `boss-summoned` puts
`bossIntros[definitionId]` on the `Announcer` with `priority: 'major'` (**MVP-if-time**);
`ResultsScreen` closes with `verdictLines[condition]` (**MVP**); the atmosphere change rides in the
snapshot and `TerrainView` tints outward from the Cathedral (**MVP-if-time**).

## 10. `MatchResult` and match history

```ts
// Sketch: packages/core/src/state/MatchResult.types.ts — deterministic, no wall clock, no client ids
export type MatchResult = {
  readonly winner: PlayableTeam | null;
  readonly condition: VictoryConditionId;
  readonly playerTeam: PlayableTeam;
  readonly hadHuman: boolean; // false for a pure sim match (mechanics-ideas.md §6)
  readonly durationTicks: number;
  readonly seed: number;
  readonly configHash: number; // FNV-1a of GameConfig, so a replay can refuse a mismatched config
  readonly legends: readonly LegendStats[]; // 20 rows: entityId, team, classId, controller, counters, score
  readonly teams: Readonly<Record<PlayableTeam, TeamStats>>;
  readonly timeline: readonly {
    readonly tick: number;
    readonly event: TimelineEventId;
    readonly actorId: EntityId | null;
  }[];
  readonly achievements: readonly AchievementId[];
  readonly finalHash: number; // StateHasher hash on the ending tick, before the terminal phase (§6 order); not a replay checkpoint
};
```

`TimelineEventId` (`first-blood`, `first-structure-destroyed`, `mini-boss-killed`,
`greater-boss-summoned`, `greater-boss-killed`, `wall-breached`, `eternal-ascended`,
`objective-lost`, `match-ended`) lets the profile screen summarise a match without loading the replay. The client's
`MatchHistoryRepository` maps the result to `MatchHistoryRecordDtoV1` (`14` §7), adding `id`,
`profileId`, `playedAt`, the versions, `isSimulation` and `replayId`; `SessionController` stores
it with the replay and the achievements in one unit of work.

## 11. Post-MVP story hooks

- **Tutorial**: a `MatchTimeline` whose entries use new actions (`show-dialogue`, `lock-input`,
  `wait-for-action`) handled by new classes in `actions/`; the `Announcer` becomes the dialogue
  surface and `<KeyGlyph action="…"/>` keeps prompts in sync with bindings; the director is untouched.
- **Campaign**: `content/story/campaign.ts`, an ordered list of `MatchSetup`s (config, timeline,
  content overrides, faction); `SessionController` gains a `campaign` sub-flow and
  `ProfileDtoV2.campaign` is one migration entry. **Attract mode** (**MVP-if-time**) is a sim-mode
  match behind the main menu (`mechanics-ideas.md` §6).

## 12. Tests (`packages/core/src/match/*.test.ts`, `match/scenarios/`)

- `MatchDirector.test.ts`: table-driven transitions under a **fake timeline**: phase doubles that
  record `enter`/`exit`, a hand-written `ResolvedTimeline` (`tick 10 → early-game`, `tick 20 →
quarter-mark`), a stub `GameState` stepped to tick 25; assert the `phase-changed` sequence, the
  cursor, that no entry fires twice, that a backwards `enter-phase` throws, and that
  `dev-set-phase` replays the skipped entries in order.
- `MatchTimeline.test.ts`: fractions resolve against `plannedMatchSeconds`; ties keep config order;
  every invalid config from §3 is rejected by name. `Scoring.test.ts`: one test per row of the
  §5 table plus the assist window and the hold accrual.
- `conditions/ObjectiveLostCondition.test.ts`: objective lost → the other team wins; both on one
  tick → draw. `MatchDirector.test.ts`: `victory`/`defeat` by `playerTeam`; a draw enters `defeat`;
  sim mode ends with `hadHuman: false`; inert after the end; no move out of a terminal phase.
  Forfeit → `aborted` stays a planned test.
  `BossRewardHandler.test.ts`: a Legend's final hit emits `form-applied`, a minion's does not; team
  XP and the team buff are emitted once.
- `scenarios/fullMatch.test.ts`: a **full bot-versus-bot replay** through
  `runSimMatch({ seed, config, content, profiles, maxTicks, assertLevel: 'heavy' })`
  ([15-diagnostics-and-runtime-testing.md](15-diagnostics-and-runtime-testing.md) §8): the match
  reaches `victory` or `defeat` before `maxTicks` (`TUNE` 81,000 = `maxMatchSeconds`) with zero
  invariant violations, two runs give deep-equal `MatchResult`s, and the committed golden replay
  `__fixtures__/full-match-seed-7.replay.json` reproduces its checkpoint hashes.

Invariants this doc contributes to `defaultInvariants.ts`: `PhaseMonotonicInvariant`,
`LockedZoneOwnerInvariant` (a zone with a living mini-boss never changes owner),
`BossIsNeutralInvariant`, `RewardTargetsAliveInvariant` (every reward event names a living Legend
or a team) and `SinglePlayerBrainInvariant` (at most one `player` controller).

## 13. Implementation status

The match director kernel (GL-1) is built: `MatchDirector`, `MatchTimeline`, the seven phase
classes (only `CountdownPhase` has rules: the freeze), `defaultMatchPhases.ts`, the `enter-phase`
action and `defaultTimelineActions.ts`, `MatchDirectorSystem`, `PhaseMonotonicInvariant`,
`GameState.match` and `Snapshot.match`.

Victory and the result (GL-2, core) are built: the `VictoryCondition` contract
(`match/VictoryCondition.types.ts`), `ObjectiveLostCondition` with the `WinObjective` component,
`defaultVictoryConditions.ts`, and the director's verdict step and `end()`, which stores the
`MatchResult`, enters `victory` or `defeat` and emits `match-ended`. The director is inert once
`state.match.result` is set, and no move leaves a terminal phase (the director rejects it,
`phase-monotonic` flags it). `MatchResult` and `Verdict` live in `state/MatchResult.types.ts` and
`VictoryConditionId` in `config/VictoryConditionId.types.ts`. `MatchConfig.playerTeam` is built.
`MatchState` has `phase`, `phaseEnteredTick`, `timelineCursor`, `schedule`, `isIdleHeld`,
`playerTeam`, `humanLegendId`, `scoring` and `result`. `MatchResult` has `winner`, `condition`,
`playerTeam`, `hadHuman`, `durationTicks`, `seed`, `configHash`, `legends`, `teams` and
`finalHash`; `timeline` and `achievements` come with the work that fills them.
`match/defaultMatchDirector.ts` builds the director `Simulation` uses. Once `state.match.result` is set,
`applyCommand` refuses every command with `command-rejected` reason `match-ended` (FR-002); the
systems keep stepping.

The human's seat is built: `MatchConfig.seat` (`{ definitionId, at }`, `null` in sim mode; its team
is `playerTeam`). When the match is built, `Simulation` spawns the seat's Legend through the
`dev-spawn` handler, without a command (the config rebuilds it in a replay), and sets
`state.match.humanLegendId`; `Snapshot.match.humanLegendId` carries it (not hashed). A failed spawn
logs ERROR `core.match` and leaves it `null`. Until the map option gives core the map, `at` is the
client's spawn point.

Scoring (GL-4) is built: `match/Scoring.ts`, `state/ScoringState.types.ts` (`LegendStats`,
`TeamStats`, `ScoringState`), `content/match/scoring.ts` (`SCORING_WEIGHTS`,
`ASSIST_WINDOW_SECONDS`) and `MobKind` in `content/mobs/mobs.types.ts`. `Simulation` passes the
content values into `createDefaultMatchDirector` and builds the director, and with it `Scoring`,
before the seat spawns, so the seat's Legend has a row from the fold of tick 0. The director folds after the phase update
and before the victory check, and `end()` copies the rows and team totals into `MatchResult`.
`ScoringState` joins the state hash once it differs from the empty state (DEC-113 (8)), so the
golden replay is unchanged. A row is registered from `entity-spawned`. The assist store keeps one
entry per Legend and victim pair (at most the square of the Legend count) and drops a victim's entries at its
death. A Legend's kill is credited by its row, so a hit that names a Legend still counts after
that Legend left the store; no projectile deals damage yet. `LegendStats` has `kills`, `deaths`,
`assists`, `minionKills`, `neutralKills`, `structureDamage` and `score`, and `TeamStats` has
`score`; the other §5 counters, `structure-destroyed` and the capture events join with the work
that fills them, and points for structures, captures and holds wait for the owner's values
(FR-007).

The verdict lines (§9, GL-5) are built: `content/narrative/verdictLines.ts` holds the
`objective-lost` lines (the owner's placeholders, DEC-83), with `{name}` for the fallen side's
sovereign, whose display name per team is in `content/sovereigns/sovereignDisplayNames.ts`
(DEC-74); `loadDisplayContent()` returns both, and the client's results screen shows the line.
`forfeit` and `aborted` have no lines yet (no condition produces them).

Not built yet: `atmosphere` in `MatchState`; the rest of `content/narrative/` (§9); an entity that carries `WinObjective` (the
sovereign); `MatchResult.timeline` and `achievements` (with their producers); the other §5
counters and `TeamStats` fields; a condition for `forfeit` or `aborted` (the ids exist); the
timeline actions other than `enter-phase`; `dev-set-phase`; the announcer; the other invariants of §12.

## Related

- [03-game-model.md](03-game-model.md): `GameState`, `GameEvents`, `GameConfig.match.timeline`, replays.
- [04-entity-architecture.md](04-entity-architecture.md) and [07-structures-obstacles-and-destructibles.md](07-structures-obstacles-and-destructibles.md): `BossDefinition`, spawners, capture points, the Cathedral.
- [11-game-ai.md](11-game-ai.md): `BossController`, sim mode, `humanLegendId`.
- [13-game-interface.md](13-game-interface.md): `Announcer`, `ResultsScreen`, `SessionController`.
- [14-persistence-and-resources.md](14-persistence-and-resources.md) and [15-diagnostics-and-runtime-testing.md](15-diagnostics-and-runtime-testing.md): `MatchHistoryRepository`, `runSimMatch`, golden replays.
- [../reference/game-design/04-objectives-capture-points-and-bosses.md](../reference/game-design/04-objectives-capture-points-and-bosses.md): the source for phases, bosses and scoring.
- [../reference/game-design/10-art-and-lore.md](../reference/game-design/10-art-and-lore.md): lore, factions, naming placeholders.
- [../reference/suggestions/mechanics-ideas.md](../reference/suggestions/mechanics-ideas.md): the Eternal form, sim mode, match history DTO, developer menu.
- Research: [persistence A3](../research/persistence-input-diagnostics-research.md#a3-patterns-repository-unit-of-work-facade-dtos-migrations-replays) (replays as seed + commands), [game architecture §2](../research/game-architecture-and-performance-research.md#2-oop-entity-hierarchies-vs-ecs-vs-hybrid) (Observer with deferred changes).
