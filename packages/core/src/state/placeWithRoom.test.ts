import { describe, expect, it } from 'vitest';

import type { Vec2 } from '../utils/geometry.types';
import type { CollisionQuery } from './CollisionQuery.types';
import { placeWithRoom } from './placeWithRoom';

const START: Vec2 = { x: 2, y: 3 };
const PUSHED: Vec2 = { x: 2.5, y: 3 };
const RADIUS = 0.7;

/** Walls that push every circle to `PUSHED` and answer `hasRoom` with `isRoomy`; records each ask. */
const collisionsWith = (isRoomy: boolean): { query: CollisionQuery; roomAsks: Vec2[] } => {
  const roomAsks: Vec2[] = [];
  const query: CollisionQuery = {
    reach: (_from, _direction, distance) => distance,
    hitsWall: () => false,
    pushOut: () => PUSHED,
    hasRoom: (at) => {
      roomAsks.push(at);
      return isRoomy;
    },
  };
  return { query, roomAsks };
};

describe('placeWithRoom', () => {
  it('gives the pushed-out point when the body has room there', () => {
    const { query, roomAsks } = collisionsWith(true);

    expect(placeWithRoom(query, START, RADIUS)).toEqual(PUSHED);
    expect(roomAsks).toEqual([PUSHED]);
  });

  it('gives null when the push leaves the body in a wall', () => {
    const { query, roomAsks } = collisionsWith(false);

    expect(placeWithRoom(query, START, RADIUS)).toBeNull();
    expect(roomAsks).toEqual([PUSHED]);
  });
});
