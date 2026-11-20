import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Sanctuary: in the Magus's kit, implemented through shared effect strategies. Cost and cooldown: balancing.md:191.
 */
export const SANCTUARY = {
  id: 'sanctuary',
  displayName: 'Sanctuary',
  description: 'Consecrate a circle for a short time. Allies inside it heal.',
  classId: 'magus',
  slot: 'ability',
  cooldownSeconds: 22, // TUNE: balancing.md:191
  aetherCost: 60, // TUNE: balancing.md:191
  targeting: { kind: 'self' },
  effects: [{ kind: 'healing-field', radius: 4, durationSeconds: 5, fractionPerSecond: 0.04 }],
  restrictions: [],
  scaling: { fractionPerSecond: { perLevel: 0.04 } }, // TUNE: balancing.md, +4% ability potency per level
} as const satisfies AuthoredAbility;
