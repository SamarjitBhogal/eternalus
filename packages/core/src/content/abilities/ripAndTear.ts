import { STARTER_TUNING } from './starterTuning';
import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Rip & Tear: in the Sentinel's kit, implemented through shared effect strategies. Cost and cooldown: balancing.md:184.
 */
export const RIP_AND_TEAR = {
  id: 'rip-and-tear',
  displayName: 'Rip & Tear',
  description:
    'Strike a cone in front of you, dealing damage and bleed. Enemies under 30% health take double damage and are dragged toward you.',
  classId: 'sentinel',
  slot: 'ability',
  cooldownSeconds: 10, // TUNE: balancing.md:184
  aetherCost: 30, // TUNE: balancing.md:184
  targeting: { kind: 'directional' },
  effects: [
    {
      kind: 'rend',
      shape: { kind: 'cone', radius: 3, angleDegrees: STARTER_TUNING.rendAngleDegrees },
      damage: 90,
      threshold: 0.3,
      multiplier: 2,
      pull: 1.5,
      statusId: 'bleed',
    },
  ],
  restrictions: [],
  scaling: { damage: { perLevel: 0.04 } }, // TUNE: balancing.md, +4% ability potency per level
} as const satisfies AuthoredAbility;
