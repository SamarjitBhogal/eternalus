import { ContentValidationError } from '../content/ContentValidationError';
import type { ProjectileDefinition } from '../content/projectiles/projectiles.types';
import type { TurretAmmoDefinition } from '../content/structures/turrets.types';
import type { WeaponDefinition } from '../content/weapons/weapons.types';
import type { AbilityRegistry } from './AbilityRegistry';

/**
 * Checks, at boot, the `onHit` steps of every weapon attack and every turret ammo's attack, and the
 * `litOnHit` steps of every projectile (DEC-345), against the ability layer (architecture 05 §10
 * `WeaponAttack.onHit`, 07 §5): each step passes the registry's step check (a strategy for every
 * kind, each step's and each shape's own `validate`, so a `debuff` names a known status), as
 * `checkStatusLinks` checks a status's `onHit`. `loadWeapons`, `loadTurrets` and
 * `loadProjectiles` cannot: content does not see the registry. `Simulation` runs it where it loads
 * them.
 *
 * @throws ContentValidationError listing every problem of every attack and projectile.
 */
export const checkAttackLinks = (
  registry: Pick<AbilityRegistry, 'checkSteps'>,
  weapons: readonly WeaponDefinition[],
  ammo: readonly TurretAmmoDefinition[],
  projectiles: readonly ProjectileDefinition[],
): void => {
  const problems = [
    ...weapons.flatMap(({ id, attacks }) =>
      attacks.flatMap(({ onHit }, index) =>
        registry.checkSteps(`Weapon "${id}" attack ${String(index + 1)} onHit`, onHit ?? []),
      ),
    ),
    ...ammo.flatMap(({ id, attack }) =>
      registry.checkSteps(`Turret ammo "${id}" onHit`, attack.onHit ?? []),
    ),
    ...projectiles.flatMap(({ id, litOnHit }) =>
      registry.checkSteps(`Projectile "${id}" litOnHit`, litOnHit ?? []),
    ),
  ];
  if (problems.length > 0) {
    throw new ContentValidationError(problems.join('\n'));
  }
};
