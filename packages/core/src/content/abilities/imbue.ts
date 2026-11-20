import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Imbue: in the Magus's kit, not built yet (`effects: []`). Cost and cooldown: balancing.md:189.
 */
export const IMBUE = {
  id: 'imbue',
  displayName: 'Imbue',
  description:
    'Your weapons do more damage and attack faster for 8 seconds. Damage variety: a full buff for you alone. Support variety: a smaller buff, with a lesser one for nearby allies.',
  classId: 'magus',
  slot: 'ability',
  cooldownSeconds: 20, // TUNE: balancing.md:189
  aetherCost: 45, // TUNE: balancing.md:189
  targeting: null,
  effects: [],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;
