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
  baseHealth: 800, // TUNE:
  weaponBias: 'staff',
  damageFocus: 'magic',
  pickUp: 'levitate',
  passiveOptions: ['studious', 'necromancy'],
  defaultAction: 'revive',
  referenceHeight: 3, // TUNE: ~10 ft (Hades)
  footprintRadius: 0.75, // DEC-06
  visionRadius: 25, // TUNE:
  movement: {
    maxSpeed: 4.5, // TUNE: m/s
    acceleration: 22.5, // TUNE: m/s², top speed after 0.2 s (6 ticks)
    mass: 2, // TUNE:
  },
} as const satisfies LegendDefinition;
