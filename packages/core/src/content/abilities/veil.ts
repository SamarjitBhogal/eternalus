import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Veil: in the Vanguard's kit, not built yet (`effects: []`, so it cannot be cast). Cost and cooldown: balancing.md:180.
 */
export const VEIL = {
  id: 'veil',
  displayName: 'Veil',
  description: 'Become invisible for 5 seconds. Attacking or taking damage ends it.',
  classId: 'warrior',
  slot: 'ability',
  cooldownSeconds: 20, // TUNE: balancing.md:180
  aetherCost: 40, // TUNE: balancing.md:180
  targeting: null,
  effects: [],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;
