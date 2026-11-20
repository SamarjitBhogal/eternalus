import type { AuthoredAbility } from './AbilityDefinition.types';

/** The shockwave's reach around the Magus. TUNE: balancing.md:190, metres. */
const AREA = { kind: 'circle', radius: 5 } as const;

/**
 * Shockwave: a ring of light around the Magus that damages, blasts enemies back and concusses
 * them. TUNE: every number is balancing.md:190.
 */
export const SHOCKWAVE = {
  id: 'shockwave',
  displayName: 'Shockwave',
  description:
    'Sends out a shockwave of light that blasts enemies back and applies the "concussion" debuff.', // game doc Abilities table
  classId: 'magus',
  slot: 'ability',
  cooldownSeconds: 14, // TUNE: balancing.md:190
  aetherCost: 50, // TUNE: balancing.md:190
  targeting: { kind: 'self' },
  effects: [
    {
      kind: 'damage',
      amount: 120, // TUNE: balancing.md:190
      damageType: 'magical',
      shape: AREA,
      structureMultiplier: 1, // TUNE: DEC-209 (1), balancing.md:123 ("Magus damage abilities 1.0")
    },
    { kind: 'knockback', distance: 2.5, shape: AREA }, // TUNE: balancing.md:190, metres
    { kind: 'debuff', statusId: 'concussion', durationSeconds: 3, shape: AREA }, // TUNE: balancing.md:190
  ],
  restrictions: [],
  scaling: { amount: { perLevel: 0.04 } }, // TUNE: balancing.md:208, +4% ability potency per level
} as const satisfies AuthoredAbility;
