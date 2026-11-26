import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Hamstring: in the Vanguard's kit, not built yet (`effects: []`). Cost and cooldown: balancing.md:182.
 */
export const HAMSTRING = {
  id: 'hamstring',
  displayName: 'Hamstring',
  description: 'Throw a short blade. The first enemy hit takes damage, bleeds and is slowed.',
  classId: 'warrior',
  slot: 'ability',
  cooldownSeconds: 9, // TUNE: balancing.md:182
  aetherCost: 25, // TUNE: balancing.md:182
  targeting: null,
  effects: [],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;
