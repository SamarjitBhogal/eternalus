import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { GameConfig } from '../config/GameConfig.types';
import type { Entity } from '../entities/Entity';
import { SeededRandom } from '../utils/SeededRandom';
import { EntityStore } from './EntityStore';
import { GameEvents } from './GameEvents';
import type { MatchPhase } from './GameState.types';
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
  /** Always `countdown` until the MatchDirector (phase 4) drives the timeline. */
  public readonly phase: MatchPhase = 'countdown';
  private currentTick = 0;

  /**
   * @param config - A config that passed `validateGameConfig()`.
   * @param seed - The match seed (a whole number from 0 to 2^32 - 1).
   */
  public constructor(
    public readonly config: GameConfig,
    seed: number,
  ) {
    this.rng = new SeededRandom(seed);
    this.events = new GameEvents(() => this.currentTick);
  }

  /** Number of ticks completed. */
  public get tick(): number {
    return this.currentTick;
  }

  /** Counts one completed tick. Called once per `Simulation.step()`. */
  public advanceTick(): void {
    this.currentTick += 1;
  }

  /** The current state as a structured-clone-safe snapshot. */
  public snapshot(): Snapshot {
    const entities: EntitySnapshot[] = [];
    this.entities.forEach((entity) => {
      entities.push(GameState.snapshotOf(entity));
    });
    return { tick: this.currentTick, phase: this.phase, entities };
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
