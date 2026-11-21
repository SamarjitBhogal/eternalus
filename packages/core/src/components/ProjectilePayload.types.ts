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

/** What a projectile carries to the hit. */
export type ProjectilePayloadData = {
  /** The entity that fired it; the shot never hits it. */
  readonly ownerId: string;
  /** The owner's team at the moment of firing. */
  readonly team: Team;
  /** Who the hit is credited to. */
  readonly source: ProjectileSource;
  /** The attack that fired it (content, shared): damage and fall-off. */
  readonly attack: RangedAttack;
  /** Where it was fired from; fall-off is measured from here. */
  readonly origin: Vec2;
};
