import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Berserk: the Sentinel's ultimate, not built yet (`effects: []`). The meter gates an ultimate, so cost and cooldown are 0.
 */
export const BERSERK = {
  id: 'berserk',
  displayName: 'Berserk',
  description: 'Suddenly grow in size, power, speed and durability for 12 seconds.',
  classId: 'sentinel',
  slot: 'ultimate',
  cooldownSeconds: 0, // TUNE: balancing.md:187 ("meter", 0 aether); DEC-202
  aetherCost: 0, // TUNE: balancing.md:187 ("meter", 0 aether); DEC-202
  targeting: null,
  effects: [],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;
