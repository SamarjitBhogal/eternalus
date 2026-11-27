import type { AbilityEffectSpec, AuthoredEffectSpec } from '../abilities/AbilityDefinition.types';
import type { EntityDefinitionBase } from '../EntityDefinition.types';
import type { MovementProfile } from '../units/units.types';

/**
 * A fast mover fired by a weapon or ability. Speeds are per second in content files and per tick
 * once loaded (`loadProjectiles`); `range` and `slowFrom` stay in metres, `endDuration` and the
 * times of `litOnHit` are in seconds in content files and ticks once loaded. `Step` is the type of
 * its `litOnHit` steps: `AuthoredEffectSpec` as authored (`AuthoredProjectile`),
 * `AbilityEffectSpec` once loaded (the default).
 */
type ProjectileDefinitionWith<Step> = EntityDefinitionBase & {
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
  /**
   * Whether it is an arc shot (DEC-341 (4), DEC-342): it comes from above, so no wall, body or map
   * edge stops it in the air. It flies to its aim point (`min(range, distance to the aim)`) and
   * lands there, then lodges for `endDuration`. Absent: a straight shot, which a body or a wall
   * ends on contact.
   */
  readonly isArc?: boolean;
  /**
   * Effect steps run on the body this shot lands on when the shot is lit: before it landed, it
   * flew over a shape flagged `canLightShots` (a lava river, a camp fire,
   * `CollisionQuery.lightsShot`; HC-Q89, DEC-345). Absent: the shot cannot catch fire.
   */
  readonly litOnHit?: readonly Step[];
};

/** A projectile as loaded: times in ticks, the shape every system reads. */
export type ProjectileDefinition = ProjectileDefinitionWith<AbilityEffectSpec>;

/** A projectile as authored in `content/projectiles/<id>.ts`: times in seconds. */
export type AuthoredProjectile = ProjectileDefinitionWith<AuthoredEffectSpec>;
