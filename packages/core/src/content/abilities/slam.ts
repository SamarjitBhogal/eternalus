import type { AuthoredAbility } from './AbilityDefinition.types';

/** Everything within reach of the Sentinel's fists. TUNE: balancing.md:185, metres. */
const AREA = { kind: 'circle', radius: 4 } as const;

/**
 * Slam: a shockwave around the Sentinel that damages, knocks back and knocks up, and hits
 * structures and obstacles twice as hard. TUNE: every number is balancing.md:185 (the structure
 * multiplier also balancing.md:123); the knockup time is the `knockup` status's.
 */
export const SLAM = {
  id: 'slam',
  displayName: 'Slam',
  description:
    'Slam your arms down on the ground creating a shockwave, inducing knockback and knockup, and ' +
    'destroying the ground/structures near you.', // game doc Abilities table
  classId: 'sentinel',
  slot: 'ability',
  cooldownSeconds: 16, // TUNE: balancing.md:185
  aetherCost: 50, // TUNE: balancing.md:185
  targeting: { kind: 'self' },
  effects: [
    {
      kind: 'damage',
      amount: 150, // TUNE: balancing.md:185
      damageType: 'physical',
      shape: AREA,
      structureMultiplier: 2, // TUNE: balancing.md:185 and :123
    },
    { kind: 'knockback', distance: 3, knockup: true, shape: AREA }, // TUNE: balancing.md:185, metres
  ],
  restrictions: [],
  scaling: { amount: { perLevel: 0.04 } }, // TUNE: balancing.md:208, +4% ability potency per level
} as const satisfies AuthoredAbility;
