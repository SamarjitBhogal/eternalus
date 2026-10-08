import type { EntityRegistry } from './EntityRegistry';
import type { EntityModule } from './EntityRegistry.types';
import { Projectile } from './Projectile';

/** Registers the `Projectile` class. */
export class ProjectileEntityModule implements EntityModule {
  /** Registers `projectile`. */
  public register(registry: EntityRegistry): void {
    registry.register('projectile', Projectile);
  }
}
