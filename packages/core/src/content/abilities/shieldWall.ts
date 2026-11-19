import { STARTER_TUNING } from './starterTuning';
import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Shield Wall: in the Sentinel's kit, implemented through shared effect strategies. Cost and cooldown: balancing.md:186.
 */
export const SHIELD_WALL = {
  id: 'shield-wall',
  displayName: 'Shield Wall',
  description:
    'Raise a temporary stone rampart that blocks movement and projectiles for both teams.',
  classId: 'sentinel',
  slot: 'ability',
  cooldownSeconds: 18, // TUNE: balancing.md:186
  aetherCost: 40, // TUNE: balancing.md:186
  targeting: { kind: 'directional' },
  effects: [
    { kind: 'barrier', width: 4, thickness: STARTER_TUNING.wallThickness, durationSeconds: 6 },
  ],
  restrictions: [{ kind: 'room-for-wall', width: 4, thickness: STARTER_TUNING.wallThickness }],
  scaling: {},
} as const satisfies AuthoredAbility;
