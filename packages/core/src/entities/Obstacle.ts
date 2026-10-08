import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import type { ObstacleDefinition } from '../content/obstacles/obstacles.types';
import { Entity } from './Entity';
import type { EntityFamily } from './Entity.types';
import { SpawnContextReader } from './SpawnContextReader';

/**
 * A tree, rock or bridge piece. One concrete class builds every obstacle; what it is comes from
 * the definition's `obstacleType`. Installs `Transform` and a static `Collider`, plus `Health`
 * only when the obstacle can break. Obstacles belong to no team.
 *
 * @see docs/architecture/07-structures-obstacles-and-destructibles.md (Obstacles)
 */
export class Obstacle extends Entity {
  /** Always `'obstacle'`. */
  public readonly kind = 'obstacle';

  /** Always `'obstacle'`. */
  public readonly family: EntityFamily = 'obstacle';

  /**
   * Installs the obstacle components from a positioned spawn context (no team).
   *
   * @throws Error when the context is not a positioned context for this obstacle's definition.
   */
  protected attachComponents(context: unknown): void {
    const { definition, position } = new SpawnContextReader(this).positioned<ObstacleDefinition>(
      context,
    );

    this.add(new Transform(position, definition.footprintRadius));
    this.add(
      new Collider({ kind: 'circle', radius: definition.footprintRadius }, 'obstacle', true),
    );

    if (definition.health !== null) {
      this.add(new Health(definition.health));
    }
  }
}
