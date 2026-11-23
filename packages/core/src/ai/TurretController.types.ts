import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { ProjectileDefinition } from '../content/projectiles/projectiles.types';
import type { TurretProfileDefinition } from '../content/ai/turret.types';
import type { EntityId } from '../state/EntityStore.types';
import type { LineOfFireQuery } from '../state/LineOfFire.types';

/** What `TurretController` reads besides the state, injected by `Simulation` (11 §2). */
export type TurretControllerContent = {
  /** Turret profiles by id; a turret's brain names one. */
  readonly profiles: Pick<ContentCatalogue<TurretProfileDefinition>, 'has' | 'get'>;
  /** The loaded projectiles: a bolt's speed per tick, for the lead. */
  readonly projectiles: Pick<ContentCatalogue<ProjectileDefinition>, 'get'>;
  /**
   * Whether the turret's shot would reach a candidate now: it takes a target only with a clear
   * line, and drops a held one whose line closes (the bots' rule, DEC-317 addendum). `Simulation`
   * injects the match's one `LineOfFire`. Required, so a turret never shoots into a wall by
   * omission.
   */
  readonly lineOfFire: LineOfFireQuery;
};

/**
 * A turret's memory in its brain (architecture 11 §4.5), plain data, so `StateHasher` hashes it
 * with the brain: its target only. The loaded ammo is its `TurretState`'s, the aim its `Combat`'s,
 * and its `Combat` cooldown is the one shot clock.
 */
export type TurretMemory = {
  readonly targetId: EntityId | null;
};
