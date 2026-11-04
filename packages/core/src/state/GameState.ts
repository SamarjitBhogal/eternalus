import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { GameConfig } from '../config/GameConfig.types';
import type { MatchPhase } from '../config/matchPhases';
import type { Entity } from '../entities/Entity';
import { deepFreeze } from '../utils/deepFreeze';
import type { PlayableTeam } from '../teams/teams.types';
import { RingBuffer } from '../utils/RingBuffer';
import { SeededRandom } from '../utils/SeededRandom';
import { AiState } from './AiState';
import { EntityStore } from './EntityStore';
import type { EntityId, RemovalRecord } from './EntityStore.types';
import { GameEvents } from './GameEvents';
import type { DamageSource, GameEventMap } from './GameEvents.types';
import { RECENT_COMMAND_CAPACITY } from './GameState.constants';
import type { GameStateIndexes, RecordedCommand, TeamState } from './GameState.types';
import type { MatchState, ScheduledMark } from './MatchState.types';
import type { HordeRequest } from './HordeRequest.types';
import { HordeStore } from './HordeStore';
import type { MatchWorld } from './MatchWorld';
import type { PathQuery } from './PathQuery.types';
import type { EntitySnapshot, HordeSnapshot, Snapshot } from './Snapshot.types';
import type { SpaceQuery } from './SpaceQuery.types';

import type { WorldObjectStore } from './WorldObjectStore';
import { MapObjectBody } from '../components/MapObjectBody';

/**
 * The aggregate root of one match: config, the seeded RNG, the world, the entities, the hordes, the
 * team counters, the event channel and the tick. Changed only inside `Simulation.step()`.
 */
export class GameState {
  /** Present only for simulations created with an authored map. */
  public worldObjects: WorldObjectStore | undefined;

  /** Living real BuffTower entities protecting this team's King; decorative proxies never count. */
  public livingBuffTowerCount(team: PlayableTeam): number {
    let count = 0;
    this.entities.forEach((entity) => {
      if (
        entity.family === 'structure' &&
        entity.kind === 'buff-tower' &&
        entity.findComponent(TeamMembership)?.team === team &&
        entity.findComponent(Health)?.isDead === false
      )
        count++;
    });
    return count;
  }
  /** The only source of randomness in the match. */
  public readonly rng: SeededRandom;
  public readonly entities = new EntityStore();
  /** The brains of every controlled entity and the deferred decisions (architecture 11 §2). */
  public readonly ai = new AiState();
  /** The lane hordes (architecture 18 §4). */
  public readonly hordes = new HordeStore();
  /** Hordes asked for this tick (developer menu), fulfilled by `SpawnSystem` in order. */
  public readonly hordeRequests: HordeRequest[] = [];
  private readonly teamCounters: Record<
    PlayableTeam,
    { unitsRequested: number; unitsSuppressed: number; towersLostByLane: Record<string, number> }
  > = {
    light: { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} },
    dark: { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} },
  };
  /**
   * Each playable team's match counters; changed only through `recordSpawnRequest` and
   * `recordTowerLost`.
   */
  public readonly teams: Readonly<Record<PlayableTeam, TeamState>> = this.teamCounters;
  /** Every unit's position at the last rebuild, for neighbour queries (architecture 11 §3). */
  public readonly space: SpaceQuery | null;

  /** A\* for Legends over the map's grid (architecture 10 §9); `null` without a map. */
  public readonly paths: PathQuery | null;
  public readonly events: GameEvents;
  private readonly matchState: { -readonly [K in keyof MatchState]: MatchState[K] };
  private currentTick = 0;
  private readonly recent = new RingBuffer<RecordedCommand>(RECENT_COMMAND_CAPACITY);
  private readonly announcedRemovals: RemovalRecord[] = [];

  private readonly xpAwards: GameEventMap['xp-gained'][] = [];
  private readonly phaseChanges: GameEventMap['phase-changed'][] = [];
  private readonly killers = new Map<EntityId, DamageSource>();

  /**
   * @param config - A config that passed `validateGameConfig()`.
   * @param seed - The match seed (a whole number from 0 to 2^32 - 1).
   * @param world - The match's map at runtime; without one, nothing spawns on lanes.
   * @param indexes - The neighbour index `SpaceSystem` refills each tick and A\* for Legends;
   *   each `null` without a map.
   * @param schedule - The resolved timeline (`MatchTimeline`) as plain marks; empty when no
   *   director runs.
   */
  public constructor(
    public readonly config: GameConfig,
    /** The match seed, kept for diagnostic reports (seed + tick reproduce the moment). */
    public readonly seed: number,
    /** The map, its lane routes and its grid, or `null` (most unit tests). */
    public readonly world: MatchWorld | null = null,
    indexes: GameStateIndexes = {},
    schedule: readonly ScheduledMark[] = [],
  ) {
    this.space = indexes.space ?? null;
    this.paths = indexes.paths ?? null;
    this.rng = new SeededRandom(seed);
    this.events = new GameEvents(() => this.currentTick);
    this.matchState = {
      phase: 'countdown',
      phaseEnteredTick: 0,
      timelineCursor: 0,
      schedule: deepFreeze([...schedule]),
      isIdleHeld: false,
      playerTeam: config.match.playerTeam,
      humanLegendId: null,
      result: null,
    };
    this.events.on('entity-removed', (removal) => {
      this.announcedRemovals.push({ entityId: removal.entityId, cause: removal.cause });
    });
    this.events.on('entity-died', ({ entityId, killer }) => {
      this.killers.set(entityId, killer);
    });
    this.events.on('xp-gained', (award) => {
      this.xpAwards.push(award);
    });
    this.events.on('phase-changed', (change) => {
      this.phaseChanges.push(change);
    });
  }

  /** Number of ticks completed. */
  public get tick(): number {
    return this.currentTick;
  }

  /** Where the match is in its timeline (architecture 12 §4); a match starts in `countdown`. */
  public get match(): MatchState {
    return this.matchState;
  }

  /**
   * Moves the match to `next`: stamps `phaseEnteredTick` and emits `phase-changed`. Called by the
   * `MatchDirector` only, which checks the move is forward; `phase-monotonic` checks it again.
   */
  public setPhase(next: MatchPhase): void {
    const from = this.matchState.phase;
    this.matchState.phase = next;
    this.matchState.phaseEnteredTick = this.currentTick;
    this.events.emit('phase-changed', { from, to: next });
  }

  /** Counts one completed tick and starts the next tick's bookkeeping. Called once per `Simulation.step()`. */
  public advanceTick(): void {
    this.currentTick += 1;
    this.entities.beginTick();
    this.announcedRemovals.length = 0;
    this.killers.clear();
    this.xpAwards.length = 0;
    this.phaseChanges.length = 0;
  }

  /**
   * Who dealt the lethal hit to `entityId` this tick (from its `entity-died` event), or
   * `undefined` when it did not die through the damage pipeline this tick.
   */
  public killerOf(entityId: EntityId): DamageSource | undefined {
    return this.killers.get(entityId);
  }

  /** Every `entity-removed` event of the current tick, in order (whatever the ring buffer keeps). */
  public removalsAnnouncedThisTick(): readonly RemovalRecord[] {
    return [...this.announcedRemovals];
  }

  /** Every `xp-gained` event of the current tick, in order (whatever the ring buffer keeps). */
  public xpAwardsThisTick(): readonly GameEventMap['xp-gained'][] {
    return [...this.xpAwards];
  }

  /** Every `phase-changed` event of the current tick, in order (whatever the ring buffer keeps). */
  public phaseChangesThisTick(): readonly GameEventMap['phase-changed'][] {
    return [...this.phaseChanges];
  }

  /** Records a command applied this tick, for diagnostic reports. Called by `Simulation.step()`. */
  public recordCommand(command: RecordedCommand['command']): void {
    this.recent.push({ tick: this.currentTick, command });
  }

  /**
   * Counts a horde request against `team`'s spawn counters (architecture 18 §3.4): `requested`
   * members were asked for and `spawned` of them fit under the unit cap.
   *
   * @throws RangeError when `spawned` is not a whole number from 0 to `requested`.
   */
  public recordSpawnRequest(team: PlayableTeam, requested: number, spawned: number): void {
    if (!Number.isInteger(spawned) || spawned < 0 || spawned > requested) {
      throw new RangeError(
        `Spawned ${String(spawned)} of ${String(requested)} requested members on ${team}.`,
      );
    }
    const counters = this.teamCounters[team];
    counters.unitsRequested += requested;
    counters.unitsSuppressed += requested - spawned;
  }

  /** Counts one lane tower `team` lost on `lane` (architecture 18 MS-16). */
  public recordTowerLost(team: PlayableTeam, lane: string): void {
    const byLane = this.teamCounters[team].towersLostByLane;
    byLane[lane] = (byLane[lane] ?? 0) + 1;
  }

  /** The most recently applied commands, oldest first. */
  public recentCommands(): readonly RecordedCommand[] {
    return this.recent.toArray();
  }

  /** The current state as a structured-clone-safe snapshot. */
  public snapshot(): Snapshot {
    const entities: EntitySnapshot[] = [];
    this.entities.forEach((entity) => {
      entities.push(GameState.snapshotOf(entity));
    });
    const { phase, phaseEnteredTick, timelineCursor, schedule, humanLegendId } = this.matchState;
    const hordes: HordeSnapshot[] = [];
    this.hordes.forEach((horde) => {
      hordes.push({ ...horde });
    });
    const { light, dark } = this.teamCounters;
    return {
      tick: this.currentTick,
      match: {
        phase,
        phaseEnteredTick,
        upcoming: schedule.slice(timelineCursor),
        humanLegendId,
      },
      entities,
      hordes,
      teams: {
        light: { ...light, towersLostByLane: { ...light.towersLostByLane } },
        dark: { ...dark, towersLostByLane: { ...dark.towersLostByLane } },
      },
      ...(this.worldObjects === undefined ? {} : { mapObjects: this.worldObjects.snapshot() }),
    };
  }

  private static snapshotOf(entity: Entity): EntitySnapshot {
    const transform = entity.findComponent(Transform);
    const health = entity.findComponent(Health);
    return {
      id: entity.id,
      kind: entity.kind,
      family: entity.family,
      definitionId: entity.definitionId,
      ...(entity.findComponent(MapObjectBody) === undefined
        ? {}
        : { mapObjectId: entity.getComponent(MapObjectBody).object.id }),
      team: entity.findComponent(TeamMembership)?.team ?? null,
      transform:
        transform === undefined
          ? null
          : { x: transform.position.x, y: transform.position.y, radius: transform.radius },
      health: health === undefined ? null : { current: health.current, max: health.max },
    };
  }
}
