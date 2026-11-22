import type { TurretAmmoDefinition } from '../content/structures/turrets.types';

/**
 * The ammo a turret loads against a target of `kind` (architecture 07 §5, 11 §4.5): the first of
 * `ammo`, in the profile's order, whose `preferredAgainst` lists `kind` or is `'any'`; `undefined`
 * when none fits (`loadTurrets` makes a profile's last ammo `'any'`, so a shipped profile always
 * has one). Pure.
 */
export const chooseTurretAmmo = <Ammo extends Pick<TurretAmmoDefinition, 'preferredAgainst'>>(
  kind: string,
  ammo: readonly Ammo[],
): Ammo | undefined =>
  ammo.find(
    ({ preferredAgainst }) => preferredAgainst === 'any' || preferredAgainst.includes(kind),
  );
