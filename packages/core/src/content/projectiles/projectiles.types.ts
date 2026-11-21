import type { EntityDefinitionBase } from '../EntityDefinition.types';
import type { MovementProfile } from '../units/units.types';

/**
 * A fast mover fired by a weapon or ability. Speeds are per second in content files and per tick
 * once loaded (`loadProjectiles`); `range` and `slowFrom` stay in metres, `endDuration` is in
 * seconds in content files and ticks once loaded.
 */
export type ProjectileDefinition = EntityDefinitionBase & {
  /** Which entity class builds it. */
  readonly kind: 'projectile';
  /** Collider circle radius in world units. */
  readonly footprintRadius: number;
  readonly movementProfile: MovementProfile;
  /**
   * The most metres it flies from where it was fired (metres, also once loaded). There it stops
   * and ends; a body or a wall in the way ends it sooner (DEC-306).
   */
  readonly range: number;
  /**
   * Metres from the origin where the shot starts to slow so that it stops exactly at `range`
   * (an arrow falling). Equal to `range`: full speed to the end (a bolt). At most `range`.
   */
  readonly slowFrom: number;
  /**
   * Seconds an ended shot stays (a bolt's mist fading, an arrow lying on the ground), hitting
   * nothing, before it is removed; ticks once loaded (`loadProjectiles`).
   */
  readonly endDuration: number;
};
