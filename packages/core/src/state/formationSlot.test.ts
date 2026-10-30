import { describe, expect, it } from 'vitest';

import { RANKS_FORMATION } from '../content/mobs/formations/ranks';
import { followerIndex, formationSlot } from './formationSlot';

const FORMATION = { id: 'test', ranksWidth: 2, slotSpacing: 2 };

describe('formationSlot', () => {
  it('puts the leader on the anchor', () => {
    expect(
      formationSlot({ x: 5, y: 1 }, { x: 1, y: 0 }, -1, RANKS_FORMATION, { x: 0, y: 0 }),
    ).toEqual({ x: 5, y: 1 });
  });

  it('puts followers in ranks behind the leader, centred across the lane', () => {
    const slot = (follower: number) =>
      formationSlot({ x: 0, y: 0 }, { x: 1, y: 0 }, follower, FORMATION, { x: 0, y: 0 });

    expect(slot(0)).toEqual({ x: -2, y: -1 });
    expect(slot(1)).toEqual({ x: -2, y: 1 });
    expect(slot(2)).toEqual({ x: -4, y: -1 });
  });

  it('turns the block with the lane', () => {
    expect(formationSlot({ x: 0, y: 0 }, { x: 0, y: 1 }, 0, FORMATION, { x: 0, y: 0 })).toEqual({
      x: 1,
      y: -2,
    });
  });
});

describe('followerIndex', () => {
  it('counts the members ahead in memberIds with the leader left out, and gives the leader −1', () => {
    const members = ['a', 'b', 'c', 'd'];
    expect(followerIndex(members, 'b', 'b')).toBe(-1);
    expect(followerIndex(members, 'b', 'a')).toBe(0);
    expect(followerIndex(members, 'b', 'c')).toBe(1);
    expect(followerIndex(members, 'b', 'd')).toBe(2);
  });
});
