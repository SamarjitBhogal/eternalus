import type { RangedAttack } from '../content/units/units.types';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';

/**
 * Who a hit is credited to. Structurally a `DamageSource` (`state/`), which `components/` may not
 * import (02 §2); a projectile's hit is a weapon's or an ability's.
 */
export type ProjectileSource = {
  readonly attackerId: string;
  readonly kind: 'weapon' | 'ability';
  /** The weapon or ability definition id. */
  readonly definitionId: string;
};

/**
 * What a shot does where it lands, by impact kind: plain data, which the `ProjectileImpact` of
 * the same kind (`combat/ProjectileImpact.types.ts`) carries out. A new kind is one entry here
 * and one impact in the pipeline's `impacts`; the flight (`ProjectileSystem`) does not change.
 */
type ProjectileImpactDataByKind = {
  /** A weapon's ranged attack: the damage and fall-off it lands with. */
  readonly weapon: { readonly attack: RangedAttack };
};

/** The kinds of impact a shot can carry. */
export type ProjectileImpactKind = keyof ProjectileImpactDataByKind;

/** A shot's impact: its `kind` and that kind's data (all kinds when `K` is omitted). */
export type ProjectileImpactData<K extends ProjectileImpactKind = ProjectileImpactKind> = {
  readonly [P in K]: { readonly kind: P } & ProjectileImpactDataByKind[P];
}[K];

/** What a projectile carries to the hit. */
export type ProjectilePayloadData = {
  /** The entity that fired it; the shot never hits it. */
  readonly ownerId: string;
  /** The owner's team at the moment of firing. */
  readonly team: Team;
  /** The owner's level at the moment of firing; 1 for an owner with no `Progression`. */
  readonly ownerLevel: number;
  /** Who the hit is credited to. */
  readonly source: ProjectileSource;
  /**
   * The entity it aims at, the only one whose walk-on polygons it can hit: the locked target, or
   * the body whose walk-on polygons the aim point was on (DEC-322 (1)); `null` for a shot aimed at
   * no body. Solid polygons stop it whatever it aims at (`AreaHitQuery.shotPolygonsOf`).
   */
  readonly targetId: string | null;
  /** What it does where it lands. */
  readonly impact: ProjectileImpactData;
  /** Where it was fired from; fall-off is measured from here. */
  readonly origin: Vec2;
};
