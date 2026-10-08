import type { LegendDefinition } from './legends.types';

/**
 * Magus: magical; floats or walks; applies buffs or debuffs and can revive allies.
 *
 * TUNE: health and movement are placeholders (the game doc gives no Magus numbers). The radius
 * is DEC-06.
 */
export const MAGUS = {
  id: 'magus',
  kind: 'magus',
  displayName: 'Magus',
  roleBlurb: 'Magical; applies buffs or debuffs and can revive allies.',
  baseHealth: 800, // TUNE
  weaponBias: 'staff',
  damageFocus: 'magic',
  pickUp: 'levitate',
  passiveOptions: ['studious', 'necromancy'],
  defaultAction: 'revive',
  referenceHeight: 3, // ~10 ft (Hades)
  footprintRadius: 0.75, // DEC-06
  visionRadius: 25, // TUNE
  movement: {
    maxSpeed: 0.15, // TUNE: 4.5 m/s at 30 ticks/s
    acceleration: 0.025, // TUNE: top speed after 6 ticks
    mass: 2, // TUNE
  },
} as const satisfies LegendDefinition;
