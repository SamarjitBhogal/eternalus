import type { EntityRegistry } from './EntityRegistry';
import type { EntityModule } from './EntityRegistry.types';
import { Obstacle } from './Obstacle';

/** Registers the one `Obstacle` class that builds every tree, rock and bridge piece. */
export class ObstacleEntityModule implements EntityModule {
  /** Registers `obstacle`. */
  public register(registry: EntityRegistry): void {
    registry.register('obstacle', Obstacle);
  }
}
