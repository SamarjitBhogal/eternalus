import type { AuthoredWeaponDefinition } from './weapons.types';

/**
 * Obsidian Bow: a bow, ranged magical (reference 07 "Named weapons", 05 §10 weapon table). Any
 * class may use it.
 *
 * TUNE: damage, interval and firing reach accepted in DEC-310; fall-off in DEC-306. Each hit adds
 * one stack of `sundered` (DEC-374 (W6)).
 */
export const OBSIDIAN_BOW = {
  id: 'obsidian-bow',
  displayName: 'Obsidian Bow', // TUNE: placeholder, the name is pending (OQ-07)
  weaponClass: 'bow',
  attacks: [
    {
      strategy: 'ranged-projectile',
      damage: 45, // TUNE: the Warrior's basic attack from balancing.md (45 / 0.7 s) as the class-basic convention; no bow damage is documented; DEC-310
      reach: 50, // TUNE: owner 2026-10-19 "Bows fall off after 50 m" (bots close to it and deal about full damage, 98.8 %: fall-off runs from the shooter's centre); DEC-310
      interval: 0.7, // TUNE: balancing.md Warrior (0.7 s); DEC-310
      projectile: {
        projectileId: 'arrow',
        falloff: { fullTo: 50, floorAt: 80, floor: 0.4 }, // TUNE: fall-off starts at 50 m (owner 2026-10-19); floorAt and floor are guesses; accepted in DEC-306
      },
      // TUNE: DEC-374 (W6): one sundered stack on each hit
      onHit: [{ kind: 'debuff', statusId: 'sundered', shape: { kind: 'hit' } }],
    },
  ],
  allowedClasses: 'any',
  uniqueTo: null,
} as const satisfies AuthoredWeaponDefinition;
