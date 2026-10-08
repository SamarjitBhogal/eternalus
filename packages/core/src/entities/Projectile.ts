import { Collider } from '../components/Collider';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { ProjectileDefinition } from '../content/projectiles/projectiles.types';
import { Entity } from './Entity';
import type { EntityFamily } from './Entity.types';
import { SpawnContextReader } from './SpawnContextReader';

/**
 * A fast mover fired by a weapon or ability. Installs `Transform`, `Movement`, a `Collider` on
 * the projectile layer and `TeamMembership` (whose side fired it). Pooling and swept collision
 * arrive with combat in Phase 2.
 */
export class Projectile extends Entity {
  /** Always `'projectile'`. */
  public readonly kind = 'projectile';

  /** Always `'projectile'`. */
  public readonly family: EntityFamily = 'projectile';

  /**
   * Installs the projectile components from a placed spawn context.
   *
   * @throws Error when the context is not a placed context for this projectile's definition.
   */
  protected attachComponents(context: unknown): void {
    const { definition, position, team } = new SpawnContextReader(
      this,
    ).placed<ProjectileDefinition>(context);

    this.add(new Transform(position, definition.footprintRadius));
    this.add(new Movement(definition.movement));
    this.add(new Collider({ kind: 'circle', radius: definition.footprintRadius }, 'projectile'));
    this.add(new TeamMembership(team));
  }
}
