import { describe, expect, it } from 'vitest';

import type { RosterEntry } from '../../bridge/events';
import { botRosterSlots } from './botRosterSlots';

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

describe('botRosterSlots', () => {
  it('turns every bot into a slot in roster order and leaves the player out', () => {
    const slots = botRosterSlots({
      allies: [entry('light', 0, 'magus', true), entry('light', 1, 'warrior')],
      enemies: [entry('dark', 0, 'magus'), entry('dark', 1, 'sentinel')],
    });

    expect(slots).toEqual([
      { team: 'light', definitionId: 'warrior', role: 'laner', difficulty: 'normal' },
      { team: 'dark', definitionId: 'magus', role: 'rover', difficulty: 'rover' },
      { team: 'dark', definitionId: 'sentinel', role: 'laner', difficulty: 'normal' },
    ]);
  });
});
