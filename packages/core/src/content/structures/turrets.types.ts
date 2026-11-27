import type { AuthoredEffectSpec } from '../abilities/AbilityDefinition.types';
import type { RangedAttack } from '../units/units.types';

/** The fields of a turret ammo that are the same as authored and as loaded. */
type TurretAmmoBase = {
  /** Kebab-case content id; never renamed once used. */
  readonly id: string;
  readonly displayName: string;
  /**
   * The target kinds this ammo is chosen against (architecture 11 §4.5 `preferredAgainst`), or
   * `'any'`: every target. A profile's last ammo is `'any'`, so every target gets an ammo.
   */
  readonly preferredAgainst: readonly string[] | 'any';
};

/**
 * One turret ammo as authored (architecture 07 §5): its shot and the targets it is chosen against.
 * Changing an ammo, or adding one, is a content entry.
 */
export type AuthoredTurretAmmo = TurretAmmoBase & {
  /**
   * The shot (architecture 07 §5 `AmmoDefinition`): its damage, its reach (at least the range of
   * every turret that carries it), the time between two shots (`interval`), the projectile it
   * fires, and the steps that run on the body a bolt strikes (`onHit`, as a weapon attack's). Times
   * in seconds.
   */
  readonly attack: RangedAttack<AuthoredEffectSpec>;
};

/**
 * A turret ammo as loaded (`loadTurrets`): every time in ticks. A turret's `TurretState` holds the
 * ammo it carries, and its `Combat` fires the loaded one's `attack`.
 */
export type TurretAmmoDefinition = TurretAmmoBase & {
  readonly attack: RangedAttack;
};
