import { describe, expect, it } from 'vitest';

import { LANE_MINIONS } from './laneMinions';
import { MOB_DEFINITIONS } from './mobCatalogue';

describe('LANE_MINIONS', () => {
  it('lists the three lane minions with the display names of their mob definitions', () => {
    expect(LANE_MINIONS.map(({ id }) => id)).toEqual([
      'light-minion',
      'medium-minion',
      'heavy-minion',
    ]);
    for (const { id, displayName } of LANE_MINIONS) {
      expect(displayName).toBe(MOB_DEFINITIONS.get(id).displayName);
    }
  });
});
