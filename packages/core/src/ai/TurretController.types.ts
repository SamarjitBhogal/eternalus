import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { ProjectileDefinition } from '../content/projectiles/projectiles.types';
import type {
  TurretAmmoDefinition,
  TurretProfileDefinition,
} from '../content/structures/turrets.types';
import type { EntityId } from '../state/EntityStore.types';

/** What `TurretController` reads besides the state, injected by `Simulation` (11 §2). */
export type TurretControllerContent = {
  /** Turret profiles by id; a turret's brain names one. */
  readonly profiles: Pick<ContentCatalogue<TurretProfileDefinition>, 'has' | 'get'>;
  /** Every ammo a profile names, loaded. */
  readonly ammo: Pick<ContentCatalogue<TurretAmmoDefinition>, 'get'>;
  /** The loaded projectiles: a bolt's speed per tick, for the lead. */
  readonly projectiles: Pick<ContentCatalogue<ProjectileDefinition>, 'get'>;
};

/**
 * A turret's memory in its brain (architecture 11 §4.5), plain data, so `StateHasher` hashes it
 * with the brain: its target, the ammo it has loaded, the first tick of its next shot, and where it
 * aimed its last shot (`null` before the first).
 */
export type TurretMemory = {
  readonly targetId: EntityId | null;
  readonly ammoId: string | null;
  readonly nextShotTick: number;
  readonly aimX: number | null;
  readonly aimY: number | null;
};
