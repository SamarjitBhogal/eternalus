import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { LANE_ASSESSMENT_WEIGHTS } from '../content/ai/laneAssessmentWeights';
import { RANKS_FORMATION } from '../content/mobs/formations/ranks';
import { OPENING_WAVE, SPAWN_WAVES } from '../content/structures/spawnWaves';
import type { InvariantRunner } from '../diagnostics/InvariantRunner';
import type { EntityFactory } from '../entities/EntityFactory';
import type { SpaceIndex } from '../physics/SpaceIndex';
import { createDefaultStrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import type { DefinitionSource } from '../entities/EntityFactory.types';
import type { GameState } from '../state/GameState';
import { DeathSystem } from './DeathSystem';
import { HordeSystem } from './HordeSystem';
import { InvariantSystem } from './InvariantSystem';
import { MovementSystem } from './MovementSystem';
import { PathingSystem } from './PathingSystem';
import { SpaceSystem } from './SpaceSystem';
import { SpawnSystem } from './SpawnSystem';
import type { System } from './System.types';
import { SystemPipeline } from './SystemPipeline';

/**
 * The tick's systems in their fixed order (architecture 10 §9, 11 §1, 18 §3.2): the AI, horde
 * progress, movement, the neighbour index, steering, spawning, death, then invariants last. This
 * is the one place a system is added, at its position in the tick (architecture 02 §9).
 */
export class DefaultSystemPipeline extends SystemPipeline {
  /**
   * Creates the pipeline.
   *
   * @param invariants - The runner the last system checks with.
   * @param world - The match, the factory and the definitions the horde systems (architecture
   *   18) need; without it the pipeline only moves, removes the dead and checks invariants.
   */
  public constructor(
    invariants: InvariantRunner,
    world?: {
      readonly state: GameState;
      readonly factory: EntityFactory;
      readonly definitions: DefinitionSource;
      /** The index `state.space` exposes; `null` for a match without a map. */
      readonly space: SpaceIndex | null;
      /** Runs first: the AI, which `systems/` may not import, so `Simulation` composes it. */
      readonly decide: readonly System[];
    },
  ) {
    if (world === undefined) {
      super([new MovementSystem(), new DeathSystem(), new InvariantSystem(invariants)]);
      return;
    }
    super([
      ...world.decide,
      new HordeSystem(world.state, HORDE_STEERING.marchSpeedFactor),
      new MovementSystem(),
      ...(world.space === null ? [] : [new SpaceSystem(world.space)]),
      new PathingSystem(createDefaultStrategyRegistry().movement, {
        [RANKS_FORMATION.id]: RANKS_FORMATION,
      }),
      new SpawnSystem(world.state, world.factory, {
        definitions: world.definitions,
        openingWave: OPENING_WAVE,
        waves: SPAWN_WAVES,
        steering: HORDE_STEERING,
        weights: LANE_ASSESSMENT_WEIGHTS,
        formationId: RANKS_FORMATION.id,
      }),
      new DeathSystem(),
      new InvariantSystem(invariants),
    ]);
  }
}
