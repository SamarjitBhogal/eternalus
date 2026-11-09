import { Aether } from '../components/Aether';
import { Capturable } from '../components/Capturable';
import { Health } from '../components/Health';
import { Progression } from '../components/Progression';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { ZoneArea } from '../components/ZoneArea';
import type { GameConfig } from '../config/GameConfig.types';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import type { Entity } from '../entities/Entity';
import type { PlayableTeam } from '../teams/teams.types';
import { RingBuffer } from '../utils/RingBuffer';
import { SeededRandom } from '../utils/SeededRandom';
import { AiState } from './AiState';
import { AllyDamageStore } from './AllyDamageStore';
import { EntityStore } from './EntityStore';
import type { EntityId, RemovalRecord } from './EntityStore.types';
import { GameEvents } from './GameEvents';
import type { DamageSource, GameEventMap } from './GameEvents.types';
import { RECENT_COMMAND_CAPACITY } from './GameState.constants';
import type { GameStateIndexes, RecordedCommand, TeamState } from './GameState.types';
import { MatchRecord } from './MatchRecord';
import type { ScheduledMark } from './MatchState.types';
import type { HordeRequest } from './HordeRequest.types';
import { GuardStore } from './GuardStore';
import { HordeStore } from './HordeStore';
import { LaneStructures } from './LaneStructures';
import type { MatchWorld } from './MatchWorld';
import type { PathQuery } from './PathQuery.types';
import type { EntitySnapshot, HordeSnapshot, Snapshot } from './Snapshot.types';
import type { SpaceQuery } from './SpaceQuery.types';

import type { WorldObjectStore } from './WorldObjectStore';
import { MapObjectBody } from '../components/MapObjectBody';
import { isPlayableTeam, opponentOf } from '../teams/playableTeams';

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
  /** Every structure's guard posts (architecture 18 §7). */
  public readonly guards = new GuardStore();
  /** Each team's ally damage per lane since its last heavy wave (DEC-89, architecture 18 §3.3). */
  public readonly allyDamage = new AllyDamageStore();
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
  /**
   * Where the match is in its timeline and the only writers of it (architecture 12 §4, DEC-172,
   * DEC-177); a match starts in `countdown`.
   */
  public readonly match: MatchRecord;
  private structureIndex = LaneStructures.EMPTY;
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
    this.match = new MatchRecord(
      config.match.playerTeam,
      schedule,
      this.events,
      () => this.currentTick,
    );
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
    this.events.on('damage-applied', (hit) => {
      this.countAllyDamage(hit);
    });
  }

  /**
   * Adds a hit on a playable team's Legend or mob to `allyDamage`, on the lane nearest the victim
   * (DEC-89, architecture 18 §3.3). Only a hit from the victim's enemy team counts: not one with no
   * attacker, or from a neutral (forest camp), removed or same-team attacker; nor any hit in a
   * match without a map.
   */
  private countAllyDamage({ targetId, amount, source }: GameEventMap['damage-applied']): void {
    const victim = this.entities.get(targetId);
    const team = this.entities.teamOf(targetId);
    const position = victim?.findComponent(Transform)?.position;
    if (
      (victim?.family !== 'legend' && victim?.family !== 'mob') ||
      !isPlayableTeam(team) ||
      source.attackerId === null ||
      this.entities.teamOf(source.attackerId) !== opponentOf(team) ||
      position === undefined
    ) {
      return;
    }
    const lane = this.world?.routes.nearestLane(position);
    if (lane !== undefined) {
      this.allyDamage.add(team, lane.id, amount);
    }
  }

  /** The lane structures as they stood at match start (architecture 18 §6.2); empty until indexed. */
  public get laneStructures(): LaneStructures {
    return this.structureIndex;
  }

  /** Indexes the lane structures now in the store; call once, after the map's structures spawn. */
  public indexStructures(): void {
    this.structureIndex = LaneStructures.build(this.entities, this.world?.routes ?? null);
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

  /**
   * The current state as a structured-clone-safe snapshot.
   *
   * @param curves - The level curves a `Progression` levels along (the catalogue
   *   `ProgressionSystem` uses), to report the XP inside each level.
   */
  public snapshot(curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'get'>): Snapshot {
    const entities: EntitySnapshot[] = [];
    const { checkpoints } = this.config.match.capturePoints;
    this.entities.forEach((entity) => {
      entities.push(GameState.snapshotOf(entity, checkpoints, curves));
    });
    const { phase, phaseEnteredTick, timelineCursor, schedule, humanLegendId } = this.match;
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

  private static snapshotOf(
    entity: Entity,
    checkpoints: number,
    curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'get'>,
  ): EntitySnapshot {
    const transform = entity.findComponent(Transform);
    const health = entity.findComponent(Health);
    const progression = entity.findComponent(Progression);
    const aether = entity.findComponent(Aether);
    const capture = entity.findComponent(Capturable);
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
      progression:
        progression === undefined
          ? null
          : {
              level: progression.level,
              ...progression.levelProgress(curves.get(progression.curveId)),
            },
      aether: aether === undefined ? null : { current: aether.current, max: aether.max },
      area: entity.findComponent(ZoneArea)?.polygons ?? null,
      capture:
        capture === undefined
          ? null
          : {
              owner: capture.owner,
              progress: capture.progress,
              checkpoint: capture.checkpoint,
              checkpoints,
              lockedBy: capture.lockedBy,
              presence: capture.presence,
            },
    };
  }
}
