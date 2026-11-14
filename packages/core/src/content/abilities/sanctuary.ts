import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Sanctuary: in the Magus's kit, not built yet (`effects: []`). Cost and cooldown: balancing.md:191.
 */
export const SANCTUARY = {
  id: 'sanctuary',
  displayName: 'Sanctuary',
  description: 'Consecrate a circle for a short time. Allies inside it heal.',
  classId: 'magus',
  slot: 'ability',
  cooldownSeconds: 22, // TUNE: balancing.md:191
  aetherCost: 60, // TUNE: balancing.md:191
  targeting: null,
  effects: [],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;
