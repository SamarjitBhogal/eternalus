import type { EntityModule } from './EntityRegistry.types';
import { LegendEntityModule } from './legends/LegendEntityModule';
import { MobEntityModule } from './mobs/MobEntityModule';
import { ObstacleEntityModule } from './ObstacleEntityModule';
import { ProjectileEntityModule } from './ProjectileEntityModule';

/** Every shipped entity module. A new family adds one line here; a new kind edits its own module. */
export const DEFAULT_ENTITY_MODULES: readonly EntityModule[] = [
  new LegendEntityModule(),
  new MobEntityModule(),
  new ObstacleEntityModule(),
  new ProjectileEntityModule(),
];
