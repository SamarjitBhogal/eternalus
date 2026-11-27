import { loadWeapons } from '../content/weapons/loadWeapons';
import { RAPTOR_TALONS } from '../content/weapons/raptorTalons';
import { WEAPONS } from '../content/weapons/weaponCatalogue';

/**
 * The shipped weapons, except that the Raptor Talons have no `onHit`. Bleed from the talons
 * (DEC-387 W5) is not what a test that uses this checks (a sweep, blind, ...), and the bleed would
 * kill the dummy it hits. `tickRate` is the match's tick rate.
 */
export const weaponsWithoutTalonBleed = (tickRate: number) =>
  loadWeapons(
    tickRate,
    WEAPONS.all().map((weapon) =>
      weapon.id === RAPTOR_TALONS.id
        ? { ...weapon, attacks: weapon.attacks.map((attack) => ({ ...attack, onHit: [] })) }
        : weapon,
    ),
  );
