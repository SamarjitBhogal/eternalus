import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Erudition: a Magus passive (the game doc's "Studious", named by DEC-330). It puts the permanent
 * `erudition` status on the Magus when it spawns; the status holds every effect. The Catalyst and
 * the Oracle have it (DEC-330, their `passiveId`).
 */
export const ERUDITION = {
  id: 'erudition',
  displayName: 'Erudition',
  description:
    'Your abilities last 20% longer and are 10% more potent. Your ultimate fills 25% faster.', // DEC-330
  classId: 'magus',
  slot: 'passive',
  cooldownSeconds: 0, // never cast
  aetherCost: 0, // never cast
  targeting: { kind: 'self' },
  effects: [{ kind: 'buff', statusId: 'erudition' }],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;
