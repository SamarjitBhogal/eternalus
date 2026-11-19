import { STARTER_TUNING } from './starterTuning';
import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Hamstring: in the Vanguard's kit, implemented through shared effect strategies. Cost and cooldown: balancing.md:182.
 */
export const HAMSTRING = {
  id: 'hamstring',
  displayName: 'Hamstring',
  description: 'Throw a short blade. The first enemy hit takes damage, bleeds and is slowed.',
  classId: 'warrior',
  slot: 'ability',
  cooldownSeconds: 9, // TUNE: balancing.md:182
  aetherCost: 25, // TUNE: balancing.md:182
  targeting: { kind: 'directional' },
  effects: [
    {
      kind: 'blade',
      range: 12,
      speed: STARTER_TUNING.bladeSpeed,
      damage: 80,
      statusIds: ['bleed', 'hamstrung'],
    },
  ],
  restrictions: [],
  scaling: { damage: { perLevel: 0.04 } }, // TUNE: balancing.md, +4% ability potency per level
} as const satisfies AuthoredAbility;
