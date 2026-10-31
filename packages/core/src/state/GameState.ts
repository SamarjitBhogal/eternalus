import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { GameConfig } from '../config/GameConfig.types';
import type { Entity } from '../entities/Entity';
import type { PlayableTeam } from '../teams/teams.types';
import { RingBuffer } from '../utils/RingBuffer';
import { SeededRandom } from '../utils/SeededRandom';
import { AiState } from './AiState';
import { EntityStore } from './EntityStore';
import type { EntityId, RemovalRecord } from './EntityStore.types';
import { GameEvents } from './GameEvents';
import type { DamageSource, GameEventMap } from './GameEvents.types';
import { RECENT_COMMAND_CAPACITY } from './GameState.constants';
import type { GameStateIndexes, MatchPhase, RecordedCommand, TeamState } from './GameState.types';
import type { HordeRequest } from './HordeRequest.types';
import { HordeStore } from './HordeStore';
import type { MatchWorld } from './MatchWorld';
import type { PathQuery } from './PathQuery.types';
import type { EntitySnapshot, HordeSnapshot, Snapshot } from './Snapshot.types';
import type { SpaceQuery } from './SpaceQuery.types';

/**
 * The aggregate root of one match: config, the seeded RNG, the world, the entities, the hordes, the
 * team counters, the event channel and the tick. Changed only inside `Simulation.step()`.
 */
export class GameState {
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
  /** Always `countdown` until the MatchDirector (phase 4) drives the timeline. */
  public readonly phase: MatchPhase = 'countdown';
  private currentTick = 0;
  private readonly recent = new RingBuffer<RecordedCommand>(RECENT_COMMAND_CAPACITY);
  private readonly announcedRemovals: RemovalRecord[] = [];

  private readonly xpAwards: GameEventMap['xp-gained'][] = [];
  private readonly killers = new Map<EntityId, DamageSource>();

  /**
   * @param config - A config that passed `validateGameConfig()`.
   * @param seed - The match seed (a whole number from 0 to 2^32 - 1).
   * @param world - The match's map at runtime; without one, nothing spawns on lanes.
   * @param indexes - The neighbour index `SpaceSystem` refills each tick and A\* for Legends;
   *   each `null` without a map.
   */
  public constructor(
    public readonly config: GameConfig,
    /** The match seed, kept for diagnostic reports (seed + tick reproduce the moment). */
    public readonly seed: number,
    /** The map, its lane routes and its grid, or `null` (most unit tests). */
    public readonly world: MatchWorld | null = null,
    indexes: GameStateIndexes = {},
  ) {
    this.space = indexes.space ?? null;
    this.paths = indexes.paths ?? null;
    this.rng = new SeededRandom(seed);
    this.events = new GameEvents(() => this.currentTick);
    this.events.on('entity-removed', (removal) => {
      this.announcedRemovals.push({ entityId: removal.entityId, cause: removal.cause });
    });
    this.events.on('entity-died', ({ entityId, killer }) => {
      this.killers.set(entityId, killer);
    });
    this.events.on('xp-gained', (award) => {
      this.xpAwards.push(award);
    });
  }

  /** Number of ticks completed. */
  public get tick(): number {
    return this.currentTick;
  }

  /** Counts one completed tick and starts the next tick's bookkeeping. Called once per `Simulation.step()`. */
  public advanceTick(): void {
    this.currentTick += 1;
    this.entities.beginTick();
    this.announcedRemovals.length = 0;
    this.killers.clear();
    this.xpAwards.length = 0;
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
    const hordes: HordeSnapshot[] = [];
    this.hordes.forEach((horde) => {
      hordes.push({ ...horde });
    });
    const { light, dark } = this.teamCounters;
    return {
      tick: this.currentTick,
      phase: this.phase,
      entities,
      hordes,
      teams: {
        light: { ...light, towersLostByLane: { ...light.towersLostByLane } },
        dark: { ...dark, towersLostByLane: { ...dark.towersLostByLane } },
      },
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
      team: entity.findComponent(TeamMembership)?.team ?? null,
      transform:
        transform === undefined
          ? null
          : { x: transform.position.x, y: transform.position.y, radius: transform.radius },
      health: health === undefined ? null : { current: health.current, max: health.max },
    };
  }
}
