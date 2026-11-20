import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Shield Wall: in the Sentinel's kit, not built yet (`effects: []`). Cost and cooldown: balancing.md:186.
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
  targeting: null,
  effects: [],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;
