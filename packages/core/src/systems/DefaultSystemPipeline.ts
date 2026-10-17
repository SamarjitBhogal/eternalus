import { HORDE_STEERING } from '../content/ai/hordeSteering';
import { LANE_ASSESSMENT_WEIGHTS } from '../content/ai/laneAssessmentWeights';
import { RANKS_FORMATION } from '../content/mobs/formations/ranks';
import { SPAWN_WAVES } from '../content/structures/spawnWaves';
import type { InvariantRunner } from '../diagnostics/InvariantRunner';
import type { EntityFactory } from '../entities/EntityFactory';
import { LaneFollowMovementStrategy } from '../entities/strategies/LaneFollowMovementStrategy';
import type { GameState } from '../state/GameState';
import { DeathSystem } from './DeathSystem';
import { HordeSystem } from './HordeSystem';
import { InvariantSystem } from './InvariantSystem';
import { MovementSystem } from './MovementSystem';
import { PathingSystem } from './PathingSystem';
import { SpawnSystem } from './SpawnSystem';
import { SystemPipeline } from './SystemPipeline';

/**
 * The tick's systems in their fixed order (architecture 10 §9, 18 §3.2): horde progress,
 * movement, steering, spawning, death, then invariants last. This is the one place a system is
 * added, at its position in the tick (architecture 02 §9).
 */
export class DefaultSystemPipeline extends SystemPipeline {
  /**
   * Creates the pipeline.
   *
   * @param invariants - The runner the last system checks with.
   * @param world - The match and the factory the horde systems (architecture 18) need; without
   *   it the pipeline only moves, removes the dead and checks invariants.
   */
  public constructor(
    invariants: InvariantRunner,
    world?: { readonly state: GameState; readonly factory: EntityFactory },
  ) {
    if (world === undefined) {
      super([new MovementSystem(), new DeathSystem(), new InvariantSystem(invariants)]);
      return;
    }
    super([
      new HordeSystem(world.state, HORDE_STEERING.marchSpeedFactor),
      new MovementSystem(),
      new PathingSystem(new LaneFollowMovementStrategy(HORDE_STEERING), {
        [RANKS_FORMATION.id]: RANKS_FORMATION,
      }),
      new SpawnSystem(
        world.state,
        world.factory,
        SPAWN_WAVES,
        HORDE_STEERING,
        LANE_ASSESSMENT_WEIGHTS,
        RANKS_FORMATION.id,
      ),
      new DeathSystem(),
      new InvariantSystem(invariants),
    ]);
  }
}
