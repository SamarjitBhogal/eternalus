import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Rip & Tear: in the Sentinel's kit, not built yet (`effects: []`). Cost and cooldown: balancing.md:184.
 */
export const RIP_AND_TEAR = {
  id: 'rip-and-tear',
  displayName: 'Rip & Tear',
  description:
    'Low-health enemies should back up. A fan in front of you hits every enemy; those under 30% health are knocked back, those at 10% or less die, and every survivor around you is feared.',
  classId: 'sentinel',
  slot: 'ability',
  cooldownSeconds: 10, // TUNE: balancing.md:184
  aetherCost: 30, // TUNE: balancing.md:184
  targeting: null,
  effects: [],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;
