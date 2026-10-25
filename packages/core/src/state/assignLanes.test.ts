import { describe, expect, it } from 'vitest';

import { assignLanes } from './assignLanes';

describe('assignLanes', () => {
  it('fills the lanes evenly, the fewest Legends first and the lowest index on a tie', () => {
    expect(assignLanes(9, ['l0', 'l1', 'l2'])).toEqual([
      'l0',
      'l1',
      'l2',
      'l0',
      'l1',
      'l2',
      'l0',
      'l1',
      'l2',
    ]);
  });

  it('counts the Legends already on a lane, such as a human laner', () => {
    expect(assignLanes(2, ['l0', 'l1', 'l2'], { l0: 1 })).toEqual(['l1', 'l2']);
  });

  it('gives nobody a lane on a map without lanes', () => {
    expect(assignLanes(0, [])).toEqual([]);
  });
});
