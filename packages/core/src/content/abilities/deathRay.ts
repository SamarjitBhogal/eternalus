import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Death Ray (working title): the Magus's ultimate, implemented through shared effect strategies. The meter gates an ultimate, so cost and cooldown are 0.
 */
export const DEATH_RAY = {
  id: 'death-ray',
  displayName: 'Death Ray',
  description: 'A very long beam of light, channelled for 4 seconds.',
  classId: 'magus',
  slot: 'ultimate',
  cooldownSeconds: 0, // TUNE: balancing.md:192 ("meter", 0 aether); DEC-202
  aetherCost: 0, // TUNE: balancing.md:192 ("meter", 0 aether); DEC-202
  targeting: { kind: 'directional' },
  effects: [
    {
      kind: 'beam',
      range: 30,
      width: 1.5,
      durationSeconds: 4,
      extensionSeconds: 4,
      pulseSeconds: 0.5,
      damage: 150,
    },
  ],
  restrictions: [],
  scaling: { damage: { perLevel: 0.04 } }, // TUNE: balancing.md, +4% ability potency per level
} as const satisfies AuthoredAbility;
