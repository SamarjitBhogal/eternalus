import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Imbue: in the Magus's kit, implemented through shared effect strategies. Cost and cooldown: balancing.md:189.
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
  targeting: { kind: 'self' },
  effects: [{ kind: 'buff', statusId: 'imbued' }],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;
