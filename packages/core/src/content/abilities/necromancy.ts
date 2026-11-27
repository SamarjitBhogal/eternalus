import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Necromancy: a Magus passive. It puts the permanent `necromancy` status on the Magus when it
 * spawns; the status holds every effect. The Heretic has it (DEC-330, its `passiveId`). The game
 * doc's other parts (undead abilities amplified, revived allies empowered) wait for undead
 * abilities and Revive.
 */
export const NECROMANCY = {
  id: 'necromancy',
  displayName: 'Necromancy',
  description:
    'The lower your health, the stronger you become: up to 30% more damage and 15% less damage taken.', // DEC-330
  classId: 'magus',
  slot: 'passive',
  cooldownSeconds: 0, // never cast
  aetherCost: 0, // never cast
  targeting: { kind: 'self' },
  effects: [{ kind: 'buff', statusId: 'necromancy' }],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;
