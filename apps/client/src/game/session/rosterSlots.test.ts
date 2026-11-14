import { describe, expect, it } from 'vitest';

import type { RosterEntry } from '../../bridge/events';
import { rosterSlots } from './rosterSlots';

/** A roster entry of `team`: the Rover at index 0, lane bots after it. */
const entry = (
  team: RosterEntry['team'],
  index: number,
  classId: RosterEntry['classId'],
  isPlayer = false,
): RosterEntry => ({
  legendId: `${team}-${String(index + 1)}`,
  displayName: `${classId} ${String(index + 1)}`,
  classId,
  specId: null,
  isBot: !isPlayer,
  isPlayer,
  isRover: index === 0,
  team,
});

const DIFFICULTIES = { laner: 'normal', rover: 'rover' } as const;

describe('rosterSlots', () => {
  it('turns every entry into a slot in roster order: the player the human Rover, the rest bots', () => {
    const slots = rosterSlots(
      {
        allies: [entry('light', 0, 'magus', true), entry('light', 1, 'warrior')],
        enemies: [entry('dark', 0, 'magus'), entry('dark', 1, 'sentinel')],
      },
      DIFFICULTIES,
    );

    expect(slots).toEqual([
      { pilot: 'human', team: 'light', definitionId: 'magus', role: 'rover' },
      { pilot: 'bot', team: 'light', definitionId: 'warrior', role: 'laner', difficulty: 'normal' },
      { pilot: 'bot', team: 'dark', definitionId: 'magus', role: 'rover', difficulty: 'rover' },
      { pilot: 'bot', team: 'dark', definitionId: 'sentinel', role: 'laner', difficulty: 'normal' },
    ]);
  });

  it('takes the bots’ difficulties from its argument', () => {
    const slots = rosterSlots(
      { allies: [entry('light', 0, 'magus'), entry('light', 1, 'warrior')], enemies: [] },
      { laner: 'hard', rover: 'easy' },
    );

    expect(slots.map((slot) => (slot.pilot === 'bot' ? slot.difficulty : null))).toEqual([
      'easy',
      'hard',
    ]);
  });

  it('carries a Legend’s spec id to its slot so the kit is the Legend’s, and none without one', () => {
    const slots = rosterSlots(
      {
        allies: [
          { ...entry('light', 0, 'magus', true), specId: 'oracle' },
          entry('light', 1, 'warrior'),
        ],
        enemies: [{ ...entry('dark', 0, 'magus'), specId: 'catalyst' }],
      },
      DIFFICULTIES,
    );

    expect(slots.map((slot) => slot.specId)).toEqual(['oracle', undefined, 'catalyst']);
    expect('specId' in (slots[1] ?? {})).toBe(false);
  });
});
