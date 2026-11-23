import { ContentCatalogue } from '../ContentCatalogue';
import { ARROW } from './arrow';
import { MAGUS_BOLT } from './magusBolt';
import type { ProjectileDefinition } from './projectiles.types';
import { TOWER_ORB } from './towerOrb';
import { TURRET_BOLT } from './turretBolt';
import { TURRET_HEAVY_BOLT } from './turretHeavyBolt';

/** Every projectile as authored; a new one is a file and a line here, `loadProjectiles` loads them. */
export const PROJECTILES = new ContentCatalogue<ProjectileDefinition>([
  MAGUS_BOLT,
  ARROW,
  TURRET_BOLT,
  TURRET_HEAVY_BOLT,
  TOWER_ORB,
]);
