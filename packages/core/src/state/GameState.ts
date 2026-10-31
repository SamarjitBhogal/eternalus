import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { GameConfig } from '../config/GameConfig.types';
import type { MatchPhase } from '../config/matchPhases';
import type { Entity } from '../entities/Entity';
import { deepFreeze } from '../utils/deepFreeze';
import { RingBuffer } from '../utils/RingBuffer';
import { SeededRandom } from '../utils/SeededRandom';
import { createEmptyScoringState } from './emptyScoringState';
import { EntityStore } from './EntityStore';
import type { EntityId, RemovalRecord } from './EntityStore.types';
import { GameEvents } from './GameEvents';
import type { DamageSource, GameEventMap } from './GameEvents.types';
import { RECENT_COMMAND_CAPACITY } from './GameState.constants';
import type { RecordedCommand } from './GameState.types';
import type { MatchState, ScheduledMark } from './MatchState.types';
import type { EntitySnapshot, Snapshot } from './Snapshot.types';

/**
 * The aggregate root of one match: config, the seeded RNG, the entities, the event channel and
 * the tick. Changed only inside `Simulation.step()`.
 */
export class GameState {
  /** The only source of randomness in the match. */
  public readonly rng: SeededRandom;
  public readonly entities = new EntityStore();
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
   * @param schedule - The resolved timeline (`MatchTimeline`) as plain marks; empty when no
   *   director runs.
   */
  public constructor(
    public readonly config: GameConfig,
    /** The match seed, kept for diagnostic reports (seed + tick reproduce the moment). */
    public readonly seed: number,
    schedule: readonly ScheduledMark[] = [],
  ) {
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
      scoring: createEmptyScoringState(),
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
    return {
      tick: this.currentTick,
      match: {
        phase,
        phaseEnteredTick,
        upcoming: schedule.slice(timelineCursor),
        humanLegendId,
      },
      entities,
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
