import { describe, expect, it } from 'vitest';

import { PathShape } from './PathShape';

/** 1 m across: a body is on the path when its circle comes within 0.5 m of the line. */
const PATH = { kind: 'path', width: 1 } as const;
const SWEEP = { from: { x: 0, y: 0 }, to: { x: 8, y: 0 } };

describe('PathShape', () => {
  it('counts a body whose circle overlaps the swept capsule, and nothing past its ends', () => {
    const path = new PathShape();

    expect(path.overlaps(PATH, SWEEP, { x: 4, y: 1 }, 0.5)).toBe(true);
    expect(path.overlaps(PATH, SWEEP, { x: 4, y: 1.1 }, 0.5)).toBe(false);
    expect(path.overlaps(PATH, SWEEP, { x: 8.9, y: 0 }, 0.5)).toBe(true);
    expect(path.overlaps(PATH, SWEEP, { x: 9.1, y: 0 }, 0.5)).toBe(false);
  });

  it('widens with its width', () => {
    const path = new PathShape();

    expect(path.overlaps({ kind: 'path', width: 3 }, SWEEP, { x: 4, y: 1.9 }, 0.5)).toBe(true);
    expect(path.overlaps(PATH, SWEEP, { x: 4, y: 1.9 }, 0.5)).toBe(false);
  });

  it('pushes away from the nearest point of its line', () => {
    const path = new PathShape();

    expect(path.centreFor(PATH, SWEEP, { x: 3, y: 2 })).toEqual({ x: 3, y: 0 });
    expect(path.centreFor(PATH, SWEEP, { x: 10, y: -1 })).toEqual({ x: 8, y: 0 });
  });
});
