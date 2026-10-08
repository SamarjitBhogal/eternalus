import type { EntityRegistry } from '../EntityRegistry';
import type { EntityModule } from '../EntityRegistry.types';
import { LightMob } from './LightMob';

/** Registers the mob classes. The mob work (SCRUM-59) adds its kinds here. */
export class MobEntityModule implements EntityModule {
  /** Registers `light-mob`. */
  public register(registry: EntityRegistry): void {
    registry.register('light-mob', LightMob);
  }
}
