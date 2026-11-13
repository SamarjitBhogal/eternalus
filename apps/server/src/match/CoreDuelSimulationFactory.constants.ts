import type { RosterSlot } from '@eternalus/core';

/**
 * The Duel's roster (ADR 0016 point 1, DEC-36): one human Rover per team, no bots. Both play the
 * same class until the owner rules on class choice.
 */
export const DUEL_ROSTER: readonly RosterSlot[] = [
  { pilot: 'human', team: 'light', definitionId: 'warrior', role: 'rover' },
  { pilot: 'human', team: 'dark', definitionId: 'warrior', role: 'rover' },
];
