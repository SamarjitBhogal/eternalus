import { describe, expect, it } from 'vitest';

import type { Vec2 } from '../utils/geometry.types';
import type { CollisionQuery } from './CollisionQuery.types';
import { placeWithRoom } from './placeWithRoom';

const START: Vec2 = { x: 2, y: 3 };
const PUSHED: Vec2 = { x: 2.5, y: 3 };
const RADIUS = 0.7;

type Ask = readonly ['pushOut' | 'hasRoom', Vec2, number];

/** Walls that push every circle to `PUSHED` and answer `hasRoom` with `isRoomy`; records each ask. */
const collisionsWith = (isRoomy: boolean): { query: CollisionQuery; asks: Ask[] } => {
  const asks: Ask[] = [];
  const query: CollisionQuery = {
    reach: (_from, _direction, distance) => distance,
    hitsWall: () => false,
    pushOut: (at, radius) => {
      asks.push(['pushOut', at, radius]);
      return PUSHED;
    },
    hasRoom: (at, radius) => {
      asks.push(['hasRoom', at, radius]);
      return isRoomy;
    },
  };
  return { query, asks };
};

/** The body is pushed out from where it stands, then asked for room where the push ends. */
const EXPECTED_ASKS: readonly Ask[] = [
  ['pushOut', START, RADIUS],
  ['hasRoom', PUSHED, RADIUS],
];

describe('placeWithRoom', () => {
  it('gives the pushed-out point when the body has room there', () => {
    const { query, asks } = collisionsWith(true);

    expect(placeWithRoom(query, START, RADIUS)).toEqual(PUSHED);
    expect(asks).toEqual(EXPECTED_ASKS);
  });

  it('gives null when the push leaves the body in a wall', () => {
    const { query, asks } = collisionsWith(false);

    expect(placeWithRoom(query, START, RADIUS)).toBeNull();
    expect(asks).toEqual(EXPECTED_ASKS);
  });
});
