import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Veil: the Vanguard turns invisible. Casting it puts the `invisible` status on the caster, which
 * holds every effect (untargetable, hidden, ended by a hit; DEC-266, DEC-327). Cost and
 * cooldown: balancing.md:182.
 */
export const VEIL = {
  id: 'veil',
  displayName: 'Veil',
  description: 'Become invisible for 5 seconds. Attacking or taking damage ends it.',
  classId: 'warrior',
  slot: 'ability',
  cooldownSeconds: 20, // TUNE: balancing.md:182
  aetherCost: 40, // TUNE: balancing.md:182
  targeting: { kind: 'self' },
  effects: [{ kind: 'buff', statusId: 'invisible' }],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;
