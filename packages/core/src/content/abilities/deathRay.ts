import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Death Ray (working title): the Magus's ultimate, not built yet (`effects: []`). The meter gates an ultimate, so cost and cooldown are 0.
 */
export const DEATH_RAY = {
  id: 'death-ray',
  displayName: 'Death Ray',
  description: 'A very long beam of light, channelled for 4 seconds.',
  classId: 'magus',
  slot: 'ultimate',
  cooldownSeconds: 0, // TUNE: balancing.md:192 ("meter", 0 aether); DEC-202
  aetherCost: 0, // TUNE: balancing.md:192 ("meter", 0 aether); DEC-202
  targeting: null,
  effects: [],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;
