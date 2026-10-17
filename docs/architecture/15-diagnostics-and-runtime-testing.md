---
title: Diagnostics and runtime testing
description: Testing while the game is running - the Invariant interface and the InvariantRunner (light every tick, heavy every N), the built-in invariant catalogue with precise definitions, the Logger port and client sinks, how a violation reaches the overlay and the developer menu, performance instrumentation, replay-hash regression tests, soak and seeded property-style tests, and the rule that every invariant has a test that triggers it; read this before adding a runtime check, a log call or a test harness.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-17
tags: [architecture, diagnostics, invariants, logging, performance, replays, soak-tests, testing]
paths: ['packages/core/src/diagnostics/**']
related:
  [
    'docs/architecture/03-game-model.md',
    'docs/architecture/08-game-engine.md',
    'docs/architecture/13-game-interface.md',
    'docs/architecture/14-persistence-and-resources.md',
    'docs/requirements/05-engineering-standards.md',
    'docs/research/persistence-input-diagnostics-research.md',
  ]
---

# Diagnostics and runtime testing

**Purpose.** Read this when you add a runtime check, a log line, a performance measure or a test
harness. The requirements doc: "testing is extremely important; not just when developing, but
while the game is running", with a list of anomalies to log (an entity passing through an
unbreakable object or an unbroken wall, a despawn without a remover, a death without a killer).
AP-12 makes that a principle: the running game monitors itself through an `InvariantRunner`,
structured logging through the `Logger` port with recent commands and events attached, a state
hash and replay recording. This doc fixes the interfaces, the invariant catalogue, the sinks, the
instrumentation and the test harnesses that make "if a test doesn't connect, it doesn't exist"
true. Every block is a **sketch**; the facts come from
[research C](../research/persistence-input-diagnostics-research.md#c-runtime-diagnostics-and-invariant-monitoring).

## 1. Where it sits

`packages/core/src/diagnostics/` (L2) may import `state/` and `utils/`, plus the types of
`commands/` and `config/` that the replay format carries ([02](02-code-structure.md) §2, DEC-20).
It contains `Invariant.ts`, `InvariantRunner.ts`, `invariants/<Fact>Invariant.ts`,
`defaultInvariants.ts` (the registry), `Logger.types.ts` (port) with `Logger.constants.ts`,
`makeLogRecord.ts`, `MemoryLogger.ts` (test double) and `NullLogger.ts`, `Profiler.ts` (port) with
`NullProfiler.ts`, `DiagnosticEvent.types.ts`, `replay.ts` with `Replay.types.ts`,
`randomCommands.ts`, `runSimMatch.ts` and the soak and property harnesses. The
`InvariantSystem` lives in `systems/` and runs after `MatchDirectorSystem`, before
`SnapshotSystem` ([03](03-game-model.md) §1). Client-side pieces sit behind ports: sinks in
`apps/client/src/data/logging/` ([09](09-hardware-abstraction.md) §8), `PerfMonitor` in
`game/engine/time/` ([08](08-game-engine.md) §9), `PerfOverlay` and `DeveloperMenu` in `ui/hud/`
([13](13-game-interface.md) §3, §4). Assertions are not error handling (Regehr, research C1): a
quota error is an error and is handled in `data/`; an entity inside a wall is a bug and is
reported here.

## 2. `Invariant`, `InvariantRunner`, `InvariantSystem`

```ts
// Sketch: packages/core/src/diagnostics/Invariant.ts
export type InvariantId = string; // kebab-case, e.g. 'no-removal-without-cause'
export type InvariantSeverity = 'warn' | 'error' | 'fatal'; // fatal = the state can no longer be trusted (tests always throw; the browser logs and continues)
export type InvariantCadence = 'tick' | 'periodic'; // tick = light: O(n) on metadata; periodic = heavy: whole-structure checks every heavyEvery ticks
export type Violation = {
  readonly invariantId: InvariantId;
  readonly message: string;
  readonly entityId: EntityId | null;
  readonly details: Readonly<Record<string, number | string | boolean>>; // plain, hashable, cloneable
};
export interface Invariant {
  readonly id: InvariantId;
  readonly severity: InvariantSeverity;
  readonly cadence: InvariantCadence;
  check(state: GameState): readonly Violation[]; // pure: reads state (including recentEvents), never mutates, never throws
}

// Sketch: packages/core/src/diagnostics/InvariantRunner.ts
export type AssertLevel = 'off' | 'light' | 'heavy';
export type DebugConfig = {
  readonly assertLevel: AssertLevel;
  readonly heavyEvery: number;
  readonly throwOnViolation: boolean;
}; // 03 §6 SimulationOptions.debug
export class InvariantRunner {
  public constructor(
    private readonly invariants: readonly Invariant[],
    private config: DebugConfig,
    private readonly logger: Logger,
  ) {}
  public setLevel(level: AssertLevel, heavyEvery?: number): void; // dev-set-assert-level
  public run(state: GameState): readonly Violation[] {
    if (this.config.assertLevel === 'off') return [];
    const heavy = this.config.assertLevel === 'heavy' && state.tick % this.config.heavyEvery === 0;
    const due = this.invariants.filter((i) => i.cadence === 'tick' || heavy);
    const violations = due.flatMap((i) => i.check(state));
    for (const v of violations) this.report(v, state); // 'invariant-violated' event + LogRecord with context (§5)
    if (this.config.throwOnViolation && violations.length > 0)
      throw new InvariantViolationError(violations, state.tick);
    return violations;
  }
}
```

`InvariantSystem.update(ctx)` is one line: `this.runner.run(ctx.state)`. `Simulation`'s
constructor builds the runner from `createDefaultInvariants()` and `options.debug`; the level is
changed at runtime by the `dev-set-assert-level` command, which is replayable, so a replay checks
what the recording checked. Light invariants read metadata in constant or linear time; heavy ones
walk whole structures (Regehr's `checkRep`, research C1).

| Environment             | `assertLevel`                                                                                              | `heavyEvery` (`TUNE`)   | `throwOnViolation` |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------ |
| Release build           | `light` (`Recommendation:` the requirements ask for constant monitoring; `off` exists for `npm run bench`) | —                       | false              |
| Development (`?dev=1`)  | `heavy`                                                                                                    | 30 (once a second)      | false              |
| Unit and scenario tests | `heavy`                                                                                                    | 1                       | true               |
| Soak and replay tests   | `heavy`                                                                                                    | 30 (soak), 1 (fixtures) | true               |

## 3. Built-in invariant catalogue

One class per file under `invariants/`, registered in `defaultInvariants.ts` (the single place of
change, [02](02-code-structure.md) §9). Names follow `<Fact>Invariant`; the class names below are
canonical (`07` §11, `05` §16 and `12` §12 use them).

| Class (`id`)                                                                           | Cadence        | Severity     | Definition (what must hold after every tick)                                                                                                                                                                                                                                                                                                                                                                 | Source                      |
| -------------------------------------------------------------------------------------- | -------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| `NoEntityInsideUnbreakableColliderInvariant` (`no-entity-inside-unbreakable-collider`) | periodic       | error        | for every entity with a solid circle `Collider`, no `StaticColliderIndex` entry with `isUnbreakable` overlaps it by more than the skin (SAT, [10](10-physics.md) §7); candidates from `SpatialHash`, so O(units × nearby statics)                                                                                                                                                                            | requirements, 10 §7         |
| `NoPassThroughUnbreakableInvariant` (`no-pass-through-unbreakable`)                    | tick           | error        | `state.events.recentEvents()` holds no `collision-anomaly` for this tick: the post-resolution re-cast of every swept segment crossed no unbreakable collider, closed gate or map bound                                                                                                                                                                                                                       | requirements, 10 §7, 07 §11 |
| `NoRemovalWithoutCauseInvariant` (`no-removal-without-cause`)                          | tick           | fatal        | `entities.removedThisTick` (ids and causes recorded by `EntityStore.remove`, cleared by `advanceTick()`) equals the set of this tick's `entity-removed` events, each with a `RemovalCause` from the union (`died` with its `DamageSource`, `expired` with the lifetime rule, `consumed`, `despawned`, `map-change`, `dev-removed`, `match-ended`; DISC-59); the store's count delta equals spawned − removed | requirements, 03 §2         |
| `NoDeathWithoutKillerInvariant` (`no-death-without-killer`)                            | tick           | error        | every `entity-died` carries a `DamageSource` of kind `entity`, `structure`, `status` (with its applier), `environment`, `self` or `script`, resolvable in the store or in this tick's removals; a missing or unknown source is the violation, not a non-entity one (DISC-46)                                                                                                                                 | requirements, 05 §9         |
| `HealthWithinBoundsInvariant` (`health-within-bounds`)                                 | tick           | error        | `0 ≤ Health.current ≤ Health.base`; every shield bar `0 ≤ current ≤ max`; the effective total never exceeds `base + Σ bar.max`; bar count ≤ living allied `BuffTower`s is the periodic `ShieldBarsMatchLivingTowersInvariant` (07 §11)                                                                                                                                                                       | 04 §3, 07 §2                |
| `TeamUnitCapInvariant` (`team-unit-cap`)                                               | tick           | error        | living `Unit`s per playable team ≤ `config.limits.maxUnitsPerTeam` (144, `TUNE`); living `Legend`s per team ≤ `config.limits.maxLegendsPerTeam` (10, `TUNE`); `spawn-suppressed` counted, never exceeded                                                                                                                                                                                                     | requirements                |
| `FiniteTransformsInvariant` (`finite-transforms`)                                      | tick           | fatal        | `Number.isFinite` for every `Transform.position`, `facing` and `Movement.velocity` component; `\|velocity\| ≤ maxSpeed + impulse bound`                                                                                                                                                                                                                                                                      | 10 §11                      |
| `HordeMembershipConsistentInvariant` (`horde-membership-consistent`)                   | periodic       | error        | every id in a `Horde` is a living `Mob` whose `hordeId` points back; every mob with a `hordeId` is in exactly one horde; the leader is the lowest surviving id in string order; no empty horde exists (it must have dissolved with `horde-dissolved`)                                                                                                                                                        | 18 §4                       |
| `GuardWithinLeashInvariant` (`guard-within-leash`)                                     | periodic       | error        | every tower guard is within its structure's `GuardPlan.leashRadius` plus a `TUNE` tolerance (the distance it can cover between two decisions) of that structure                                                                                                                                                                                                                                              | 18 §7                       |
| `CaptureProgressBoundsInvariant` (`capture-progress-bounds`)                           | tick           | error        | `0 ≤ Capturable.progress ≤ 1`, `checkpoint ∈ {1, 2, 3}`, `ownerTeam` a `Team`; a locked zone (living mini-boss) never changes owner (`LockedZoneOwnerInvariant`, 12 §12)                                                                                                                                                                                                                                     | 04 §3, 07 §7                |
| `CooldownAndAetherBoundsInvariant` (`cooldown-aether-bounds`)                          | tick           | error        | for every `AbilityRuntime`: `0 ≤ cooldownRemainingTicks ≤ cooldownTicks`; `0 ≤ aether ≤ maxAether`; ultimate charge `∈ [0, 1]` (formerly 05 §16's `AetherWithinBounds`, folded in)                                                                                                                                                                                                                           | 05 §6                       |
| `SnapshotHashMatchesStateInvariant` (`snapshot-hash-matches-state`)                    | periodic       | fatal        | `StateHasher.hashSnapshot(snapshot)` over the canonical subset (tick, ids, positions, health, team, phase) equals `StateHasher.hash(state)` over the same subset: `SnapshotSystem` dropped or staled nothing; runs after the snapshot of the previous tick, so it lags by one                                                                                                                                | 03 §5, §9                   |
| `TickAdvancedOnceInvariant` (`tick-advanced-once`)                                     | tick           | fatal        | the newest `tick-completed` in `recentEvents` carries `tick - 1` (the runner executes before `SnapshotSystem` and the emit) and the `CommandQueue` holds nothing stamped ≤ `tick` (drained)                                                                                                                                                                                                                  | research C1                 |
| `UniqueEntityIdsInvariant`, `DanglingReferencesInvariant`                              | tick, periodic | fatal, error | ids unique in the store; `Combat.targetId`, `Carry.carriedId`, `Spawner.guardIds`, brain targets and `Horde` members reference living entities or `null`                                                                                                                                                                                                                                                     | research C1                 |
| Contributed by other docs                                                              | as listed      | as listed    | `PhaseMonotonicInvariant`, `BossIsNeutralInvariant`, `RewardTargetsAliveInvariant`, `SinglePlayerBrainInvariant` (12 §12); `NoCastWhileNotReadyInvariant`, `StatusStacksWithinMaxInvariant`, `UltimateNeverFillsPassivelyInvariant`, `LoadoutValidOnSpawnInvariant`, `LevelMatchesXpInvariant` (05 §16); `BreakabilityMatchesRuleInvariant`, `GateFootprintMatchesStateInvariant` (07 §11)                   | 05, 07, 12                  |

Every invariant is **MVP**: it is the requirements doc's runtime monitoring. Everything a check
needs is already in `GameState` (`entities.removedThisTick`, the `recentCommands` and
`recentEvents` ring buffers, the `CommandQueue`), so invariants keep no scratch of their own,
stay side-effect free, and the state hash is identical with the runner on or off.
`removedThisTick` is a `Recommendation:` addition to `EntityStore` ([03](03-game-model.md) §2).

## 4. `Logger` port and client sinks

```ts
// packages/core/src/diagnostics/: Logger.constants.ts, Logger.types.ts, DiagnosticEvent.types.ts,
// makeLogRecord.ts, MemoryLogger.ts, NullLogger.ts (public API, 02 §6)
export const SEVERITY = { TRACE: 1, DEBUG: 5, INFO: 9, WARN: 13, ERROR: 17, FATAL: 21 } as const; // OpenTelemetry ranges: TRACE 1–4 … FATAL 21–24
export type LogRecord = {
  readonly severityNumber: number;
  readonly severityText: keyof typeof SEVERITY;
  readonly body: string;
  readonly scope: string; // instrumentation scope: 'core.collision', 'core.invariants', 'client.persistence'
  readonly eventName?: DiagnosticEventName; // set when the record reports a DiagnosticEvent
  readonly tick: number | null; // core sets the tick (its only notion of time); client records set null
  readonly timestampMs?: number; // stamped by the client's SinkLogger from the engine Clock (09 §6); never by core
  readonly attributes: Readonly<Record<string, string | number | boolean | null>>; // seed, entityId, system, invariantId, ...
  readonly context?: {
    readonly recentCommands: readonly TimedCommand[];
    readonly recentEvents: readonly TimedEvent[];
  }; // from GameState's ring buffers
};
export interface Logger {
  log(record: LogRecord): void;
}
// The structured diagnostics core reports (FR-102); the single place of change for them.
export type DiagnosticEventMap = {
  readonly 'command-rejected': { readonly commandType: string; readonly reason: string };
  readonly 'invariant-violated': {
    readonly invariantId: InvariantId;
    readonly entityId: EntityId | null;
    readonly seed: number;
    readonly tick: number;
  };
};
export type DiagnosticEvent = {
  [K in keyof DiagnosticEventMap]: { readonly name: K; readonly attributes: DiagnosticEventMap[K] };
}[keyof DiagnosticEventMap];
export function makeLogRecord(
  level: keyof typeof SEVERITY,
  scope: string,
  body: string,
  details?: { readonly tick?: number } & (
    | { readonly attributes?: LogRecord['attributes'] } // a free record
    | { readonly event: DiagnosticEvent } // eventName and attributes come from the event
  ),
): LogRecord; // the one constructor of records; an options object keeps it at four parameters (DEC-18)
export class MemoryLogger implements Logger {
  public readonly records: LogRecord[] = [];
} // the test double
export class NullLogger implements Logger {} // discards; benchmarks and tests that ignore logs

// Sketch: apps/client/src/data/logging/LogSink.ts and siblings
export interface LogSink {
  write(record: LogRecord): void;
}
export class SinkLogger implements Logger {
  public constructor(
    now: () => number,
    sinks: readonly { sink: LogSink; minSeverity: number; scopes?: readonly string[] }[],
  ) {}
} // fan-out; `now` comes from the engine Clock via main.tsx (data/ may not import engine/)
export class ConsoleSink implements LogSink {} // the ONLY file that calls console (named eslint-disable with a reason)
export class RingBufferSink implements LogSink {
  public constructor(capacity: number) {}
  public tail(n: number): readonly LogRecord[];
} // bug reports and the overlay
export class OverlaySink implements LogSink {
  public constructor(publish: (record: LogRecord) => void) {}
} // Match wires publish to bus.emit('diagnostic')
```

Core never imports a sink and never calls `console` (rule 1, `AGENTS.md`); `Match` builds
`new SinkLogger([...])` and passes it in `SimulationOptions.logger`. Severity is an integer, so a
level filter is one comparison; scope filters let the overlay show `core.invariants` only. The
short sink names are the ones in [01](01-layered-oop-model.md) §3,
[09](09-hardware-abstraction.md) §1 and §8, the plan and the research.

## 5. From a violation to the screen

`InvariantRunner.report(v, state)` does two things in a fixed order: it emits
`invariant-violated { invariantId, tick, details }` on `GameEvents` ([03](03-game-model.md) §4),
and it logs one `LogRecord` at `ERROR` (`FATAL` for fatal invariants) with `scope:
'core.invariants'`, the `invariant-violated` `DiagnosticEvent` (attributes `invariantId`,
`entityId`, `seed`, `tick`) and `context` filled from `state.recentCommands` and
`state.events.recentEvents()` (the last 32 commands and 128 events copied out
of ring buffers that hold 512, `TUNE`, plan Phase 1). That record is the bug report: seed + tick

- recent commands reproduce the moment, and `Simulation.exportReplay()` reproduces the whole match.

In the browser the record reaches `RingBufferSink` (kept for "copy repro") and `OverlaySink`,
which publishes `diagnostic` on the bridge; `diagnosticsSlice.violations` collects them and
`PerfOverlay` shows the last N with a "copy repro" button whose payload equals the `LogRecord`
(plan Phase 5, sprint 5.5). `DeveloperMenu` shows the count per invariant, the current level and
a "dump replay" action; `MatchBridge` may also raise a one-line `announce` for `fatal` (dev only,
`Recommendation:`). In tests `throwOnViolation` turns the same record into an
`InvariantViolationError` whose message prints the violations and the seed.

## 6. Performance instrumentation

```ts
// Sketch: packages/core/src/diagnostics/Profiler.ts (port) — core measures, the client times
export interface Profiler {
  begin(label: string): void;
  end(label: string): void;
} // labels: 'tick', 'system:MovementSystem', 'flow-rebuild', 'render', 'minimap'
export class NullProfiler implements Profiler {} // production and tests
```

`SystemPipeline` wraps each system's `update` in `begin/end('system:<Name>')` when a profiler
other than `NullProfiler` is injected (plan Phase 6, sprint 6.1); `Match` wraps `tick` and
`render`. The client adapter is `PerfMonitor` (`game/engine/time/`, [08](08-game-engine.md) §9),
which satisfies the port structurally (L1 may not import core; `Match.test.ts` asserts the
assignability) and implements it with `performance.mark`/`performance.measure(name, { start,
end, detail: { devtools } })`, so measures appear on a custom track in Chrome's Performance
panel; a fixed-bucket histogram per label (< 8, < 16, < 33, < 50, ≥ 50 ms); a
`PerformanceObserver` on `{ type: 'long-animation-frame', buffered: true }` (feature-detected via
`PerformanceObserver.supportedEntryTypes`; the buffer holds 200 entries, so observe rather than
poll) keeping the last frame's `blockingDuration` and script attribution; and, only when
`crossOriginIsolated`, `performance.measureUserAgentSpecificMemory()` sampled at a random
interval to spot leaks over a session ([research C2](../research/persistence-input-diagnostics-research.md#c2-structured-logging-timing-memory-and-a-developer-overlay)).
`Match` publishes a `perf-sample` every 30 ticks; `PerfOverlay` renders it against the budget
table of [08](08-game-engine.md) §9 (tick ≤ 8 ms p95, render ≤ 8 ms p95, no frame > 50 ms). The
headless bench (`npm run bench`, plan Phase 1) injects a `Profiler` backed by `process.hrtime`.

## 7. Replay-hash regression tests

A replay is seed + `GameConfig` + versions + the externally enqueued commands + checkpoint
hashes ([03](03-game-model.md) §9; [research C3](../research/persistence-input-diagnostics-research.md#c3-testing-a-running-game-properties-replays-golden-hashes-soak-tests)).
Recording captures every command that enters through `Simulation.enqueueCommand` and a
`StateHasher` checkpoint every `checkpointEvery` ticks (`TUNE` 100 in fixtures); bots are
regenerated from the seed. `StateHasher` is FNV-1a 32-bit (offset basis `0x811c9dc5`, prime
`0x01000193`, `Math.imul`) over its own canonical serialisation: tick, phase, RNG state, then every
entity in store order with its component fields ([03](03-game-model.md) §9).

```ts
// packages/core/src/diagnostics/Replay.types.ts and replay.ts (DEC-20)
export interface ReplayTarget {
  readonly tick: number;
  enqueueCommand(command: Command): void;
  step(): void;
  hash(): number;
  snapshot(): Snapshot;
} // the slice of Simulation a replay drives
export type ReplayTargetFactory = (config: GameConfig, seed: number) => ReplayTarget; // e.g. (config, seed) => new Simulation(config, seed, logger, systems)
export type ReplayOutcome = {
  readonly ok: boolean;
  readonly firstDivergence: { tick: number; expected: number; actual: number } | null;
  readonly finalHash: number;
  readonly violations: readonly Violation[]; // with the InvariantRunner
};
export function recordReplay(
  plan: { config; seed; ticks; checkpointEvery; commandsFor(tick, snapshot): readonly Command[] },
  createTarget: ReplayTargetFactory,
): Replay;
export function runReplay(replay: Replay, createTarget: ReplayTargetFactory): ReplayOutcome; // stops at the first divergence; refuses mismatched versions

// next to the fixture, in the test that owns it
it('still reproduces the committed wander-seed-7 fixture', () => {
  const outcome = runReplay(WANDER_SEED_7, createTarget);
  expect(outcome.firstDivergence).toBeNull();
  expect(outcome.finalHash).toBe(WANDER_SEED_7.checkpoints.at(-1)?.hash);
});
```

`runReplay` builds a fresh target through the factory it is given, so `diagnostics/` never
imports `Simulation` and the test chooses the systems the match runs.

**Fixture format.** A golden replay is a TypeScript module next to the test that replays it:
`__fixtures__/<camelCaseName>.replay.ts`, exporting one `SCREAMING_SNAKE` constant typed `Replay`
(the first is `diagnostics/__fixtures__/wanderSeed7.replay.ts`, `WANDER_SEED_7`). Core has no
Node types, so a test imports its fixtures instead of reading files from disk. The module holds
plain data only (numbers, strings, arrays, objects), the same data a developer-menu dump writes
as `<name>.replay.json` ([13](13-game-interface.md) §4), so a dump becomes a fixture by wrapping
it in that constant.

- `config` is the full config the match ran with, written out, never a call to
  `createDefaultGameConfig()`, so changing a default cannot silently change a fixture.
- `commands` are in enqueue order; each `tick` is the number of completed steps when the command
  was enqueued, so it applies in that step.
- `checkpoints` ascend: the first at tick 0, before any step, then every `checkpointEvery` ticks,
  the last at the final tick.
- The fixture records inputs, not the pipeline: the test that owns it states which systems its
  replay target runs.

Golden replays are committed fixtures next to the test that owns them: `full-match-seed-7`
([12](12-game-story-and-match-director.md) §12), `every-mvp-ability`
([05](05-abilities-weapons-and-loadouts.md) §16), `three-hundred-dummies` (plan Phase 1), and one
per bug fixed from a replay (`AGENTS.md`: every bug fix comes with a test that failed before it).
A mismatch is a bug or an intended rules change; only the second regenerates the fixture, through
an explicit `npm run replay:regen <fixture>` (`Recommendation:`) whose diff is reviewed (only the
checkpoint hashes may change), never through `vitest -u`. The developer menu's "save as fixture"
writes this format ([13](13-game-interface.md) §4).

## 8. Soak tests

Core has no DOM dependency, so a Vitest test can step a bot-only match for tens of thousands of
ticks in Node. The shared entry point is the headless runner from
[mechanics-ideas §6](../reference/suggestions/mechanics-ideas.md#6-sim-mode-as-a-first-class-testing-feature):

```ts
// Sketch: packages/core/src/diagnostics/runSimMatch.ts
export type SimMatchOptions = {
  readonly seed: number;
  readonly config: GameConfig;
  readonly content: ContentCatalogue;
  readonly profiles: Readonly<Record<PlayableTeam, AiProfileId>>;
  readonly maxTicks: number; // safety cap; the match normally ends by victory
  readonly assertLevel: AssertLevel;
  readonly heavyEvery?: number;
  readonly checkpointEvery?: number;
  readonly profiler?: Profiler;
};
export type SoakCounters = {
  readonly entities: number;
  readonly listeners: number;
  readonly ringBufferBytes: number;
  readonly poolSizes: Readonly<Record<string, number>>;
  readonly spawnSuppressed: number;
  readonly spawnAttempted: number;
};
export type MatchReport = {
  readonly result: MatchResult | null;
  readonly ticks: number;
  readonly violations: readonly Violation[];
  readonly checkpoints: readonly { tick: number; hash: number }[];
  readonly counters: readonly { tick: number; counters: SoakCounters }[];
  readonly timing: { p50Ms: number; p95Ms: number } | null;
};
export function runSimMatch(options: SimMatchOptions): MatchReport;

// packages/core/src/diagnostics/soak/simMatch.soak.test.ts — run by `npm run test:soak`, never by `npm run test`
it(
  '144 units per team, 18,000 ticks, heavy invariants, bounded counters',
  { timeout: 600_000 },
  () => {
    const report = runSimMatch({
      seed: 7,
      config: createDefaultGameConfig(),
      content,
      profiles: { light: 'normal', dark: 'normal' },
      maxTicks: 18_000,
      assertLevel: 'heavy',
      heavyEvery: 30,
    });
    expect(report.violations).toEqual([]);
    expect(Math.max(...report.counters.map((c) => c.counters.entities))).toBeLessThanOrEqual(
      2 * 144 + 20 + STRUCTURE_COUNT,
    );
    expect(isFlat(report.counters.map((c) => c.counters.listeners))).toBe(true); // no monotonic growth: listeners, ring buffers, pools
    expect(
      report.counters.at(-1)!.counters.spawnSuppressed /
        report.counters.at(-1)!.counters.spawnAttempted,
    ).toBeLessThan(0.05);
  },
);
```

Rules: soak files are `*.soak.test.ts`, carry an explicit `timeout` (Vitest's default is 5 s;
`0` disables it, research C3) and run from `npm run test:soak` (`Recommendation:` a second Vitest
config, `vitest.soak.config.ts`) nightly and on `phase/**` branches (plan Phase 6, sprint 6.4);
per-PR CI stays `npm run check`. A failing soak prints the seed, the tick and the last commands
in the job summary and writes the replay to a temp fixture path. `BalanceHarness` (plan Phase 6,
sprint 6.2) is a loop over `runSimMatch` with content overrides; it is not a second runner.

## 9. Seeded property-style tests

Without a property-testing library (a new dependency needs approval), the property loop is a
plain `for` over seeds: build a match from the seed, drive it with a seeded random command
generator for M ticks, run heavy invariants every tick, and report the failing seed, which is a
reproducible bug report even without shrinking (research C3).

```ts
// packages/core/src/diagnostics/randomCommands.ts and a property test
export function randomCommand(rng: Rng, snapshot: Snapshot, spawnKinds: readonly string[]): Command; // plausible commands: mostly aimed at living entities, some at missing ids so rejections are exercised; dev-spawn of the given kinds
it.each(range(1, 25))('seed %i: 1,500 ticks of random commands keep every invariant', (seed) => {
  const sim = new Simulation({
    config,
    content,
    seed,
    logger,
    debug: { assertLevel: 'heavy', heavyEvery: 1, throwOnViolation: true },
  });
  const rng = new SeededRandom(seed).fork('commands');
  for (let t = 0; t < 1_500; t++) {
    for (let i = 0; i < 3; i++) sim.enqueueCommand(randomCommand(rng, sim.snapshot(), kinds));
    sim.step();
  }
});
```

The physics doc runs the same shape over scattered circles ([10](10-physics.md) §11); the
determinism recipe (run twice, compare hashes every 30 ticks) is ES-04.

## 10. "If a test doesn't connect, it doesn't exist"

- Every invariant class has a sibling `<Fact>Invariant.test.ts` with at least two cases: a
  minimal `GameState` where the fact holds (0 violations) and one deliberately corrupted (a unit
  placed inside a wall footprint, an entity deleted from the store without an event, a `Health`
  forced past its base) that yields exactly one violation with the right `id` and `entityId`.
  `defaultInvariants.test.ts` asserts every registered id has such a file and that the registry
  has no duplicate ids.
- Every `GameEvents` type an invariant reads has an emitter test; a runner test proves cadence
  (a periodic invariant runs on tick 30, not 29), `off` runs nothing and `throwOnViolation`
  throws with the seed in the message.
- Sinks pass the `LogSink` contract (every severity accepted, filters applied, odd payloads never
  throw, [09](09-hardware-abstraction.md) §9); `ConsoleSink.test.ts` spies on `console`.
- Replay fixtures run in `npm run test` on every PR; the soak suite and the 100-seed batch run
  on `phase/**` branches and nightly; the bench runs in CI without time assertions.
- Coverage excludes nothing under `diagnostics/` except `index.ts`; the ratchet only rises (ES-03).

## 11. What the developer menu exposes

| Diagnostic                                     | Control in `DeveloperMenu` / `PerfOverlay`                           | Mechanism                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Invariant level and heavy cadence              | `off` / `light` / `heavy`, `heavyEvery`                              | `dev-set-assert-level` (replayable)                                   |
| Violations                                     | count per invariant, last N with tick, entity, details, "copy repro" | `invariant-violated` → `OverlaySink` → `diagnosticsSlice`             |
| Log tail                                       | last N records, scope and severity filters                           | `RingBufferSink.tail(n)` published on demand                          |
| Hash now, dump replay, save as fixture         | buttons                                                              | `Simulation.hash()`, `exportReplay()` (JSON download; fixture format) |
| Tick and frame histograms, long frames, memory | `PerfOverlay` panels with the budget lines                           | `PerfMonitor` → `perf-sample`                                         |
| Per-system time                                | a table, top three highlighted                                       | `Profiler` labels `system:<Name>`                                     |
| Time scale, pause, step one tick               | client toggles                                                       | `GameLoop.setTimeScale`; never in the replay                          |
| Stress scenario                                | spawn N mobs at an origin, add Legends                               | `dev-spawn-mobs`, `dev-spawn-legend` (replayable, capped)             |

## 12. Recipe: a new invariant

1. `packages/core/src/diagnostics/invariants/<Fact>Invariant.ts`: a class implementing
   `Invariant` with a kebab-case `id`, a `severity`, a `cadence` and a pure `check(state)`.
2. `<Fact>Invariant.test.ts` beside it: the holds case and the deliberately broken case.
3. One line in `defaultInvariants.ts`.
4. If it reads a new event, the event exists in `GameEventMap` and its emitter has a test.

Nothing else changes: the runner, the sinks, the overlay and the menu are generic over `id`.
A new sink is a class passing the `LogSink` contract plus one line in `Match`; a new measure is
one `Profiler` label.

## 13. Implementation status

The simulation kernel (sprint 1.1, PR #13) delivers the `Logger` port and doubles,
`DiagnosticEvent.types.ts`, the replay harness and its fixture format (§7), and `randomCommand`
(§9). Not built yet: `Invariant`, `InvariantRunner`, `invariants/`, `InvariantSystem`,
`DebugConfig` and `LogRecord.context` with `GameState.recentCommands` (session C, sprint 1.2); the
`Profiler` port; `runSimMatch` and the soak harness. `Replay` has no `versions` and
`ReplayOutcome` no `ok` or `violations` until the content catalogue and the runner exist.

## Related

- [03-game-model.md](03-game-model.md): `GameState` ring buffers, `GameEvents`, `StateHasher`, `Replay`, `SimulationOptions.debug`.
- [08-game-engine.md](08-game-engine.md) and [09-hardware-abstraction.md](09-hardware-abstraction.md): `PerfMonitor`, the budget table, sinks and contract suites.
- [10-physics.md](10-physics.md), [07-structures-obstacles-and-destructibles.md](07-structures-obstacles-and-destructibles.md), [05-abilities-weapons-and-loadouts.md](05-abilities-weapons-and-loadouts.md), [12-game-story-and-match-director.md](12-game-story-and-match-director.md): the invariants those docs contribute.
- [11-game-ai.md](11-game-ai.md): sim mode, the substrate of every headless test.
- [13-game-interface.md](13-game-interface.md) and [14-persistence-and-resources.md](14-persistence-and-resources.md): `PerfOverlay`, `DeveloperMenu`, `diagnosticsSlice`, replays in `ReplayRepository`.
- [../reference/suggestions/mechanics-ideas.md](../reference/suggestions/mechanics-ideas.md): `runSimMatch`, the developer menu list.
- [../requirements/05-engineering-standards.md](../requirements/05-engineering-standards.md): ES-02, ES-04, ES-05, ES-06; [../requirements/01-architecture-principles.md](../requirements/01-architecture-principles.md): AP-12.
- [../plan/phase-1-simulation-kernel-and-world.md](../plan/phase-1-simulation-kernel-and-world.md) and [phase-6-hardening-balance-and-release.md](../plan/phase-6-hardening-balance-and-release.md): the sprints that build and harden this.
- Research: [persistence C1–C3](../research/persistence-input-diagnostics-research.md#c-runtime-diagnostics-and-invariant-monitoring).
