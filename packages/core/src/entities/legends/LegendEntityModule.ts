import type { EntityRegistry } from '../EntityRegistry';
import type { EntityModule } from '../EntityRegistry.types';
import { Magus } from './Magus';
import { Sentinel } from './Sentinel';
import { Warrior } from './Warrior';

/** Registers the playable Legend classes (the characters). */
export class LegendEntityModule implements EntityModule {
  /** Registers `warrior`, `sentinel` and `magus`. */
  public register(registry: EntityRegistry): void {
    registry.register('warrior', Warrior);
    registry.register('sentinel', Sentinel);
    registry.register('magus', Magus);
  }
}
