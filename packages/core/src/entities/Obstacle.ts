import { Collider } from '../components/Collider';
import { Footprint } from '../components/Footprint';
import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import type { ObstacleDefinition } from '../content/obstacles/obstacles.types';
import { placePolygon } from '../utils/geometry';
import { Entity } from './Entity';
import type { EntityFamily } from './Entity.types';
import { SpawnContextReader } from './SpawnContextReader';

/**
 * A tree, rock, bridge piece or placed barrier. One concrete class builds every obstacle; what it
 * is comes from the definition's `obstacleType`. Installs `Transform` (turned to the spawn's
 * facing, when it gives one) and a static `Collider`, plus `Health` only when the obstacle can
 * break, and a solid `Footprint` (its outline) when the definition has a `footprint`: the
 * definition's outline turned to the facing and moved to the position. Obstacles belong to no team.
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
  protected installComponents(context: unknown): void {
    const { definition, position, facing } = new SpawnContextReader(
      this,
    ).positioned<ObstacleDefinition>(context);

    const transform = new Transform(position, definition.footprintRadius);
    if (facing !== undefined) transform.face(facing);
    this.addComponent(transform);
    if (definition.footprint !== undefined) {
      this.addComponent(
        new Footprint([placePolygon(definition.footprint, position, transform.facing)]),
      );
    }
    this.addComponent(
      new Collider({ kind: 'circle', radius: definition.footprintRadius }, 'obstacle', true),
    );

    if (definition.health !== null) {
      this.addComponent(new Health(definition.health));
    }
  }
}
