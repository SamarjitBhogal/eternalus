import { describe, expect, it } from 'vitest';
import { cos, sin } from './deterministicMath';
import { slideOffInto } from './slideOff';

const EAST_WALL = { x: -1, y: 0 };
const NORTH_WALL = { x: 0, y: -1 };
/** A wall that meets the east wall at 135°: the free side is south-west of both. */
const NORTH_WEST_WALL = { x: -Math.SQRT1_2, y: -Math.SQRT1_2 };

describe('slideOffInto', () => {
  it('keeps a vector that runs into no wall, and writes it into `out`', () => {
    const out = { x: 9, y: 9 };

    expect(slideOffInto(out, { x: -1, y: 2 }, [EAST_WALL])).toBe(out);
    expect(out).toEqual({ x: -1, y: 2 });
    expect(slideOffInto(out, { x: 3, y: 4 }, [])).toEqual({ x: 3, y: 4 });
  });

  it('takes the part that runs into a wall: all of it head-on, the slide along it at a glance', () => {
    expect(slideOffInto({ x: 0, y: 0 }, { x: 2, y: 0 }, [EAST_WALL])).toEqual({ x: 0, y: 0 });
    expect(slideOffInto({ x: 0, y: 0 }, { x: 2, y: 3 }, [EAST_WALL])).toEqual({ x: 0, y: 3 });
  });

  it('may write into the vector it reads', () => {
    const v = { x: 2, y: 3 };

    slideOffInto(v, v, [EAST_WALL]);

    expect(v).toEqual({ x: 0, y: 3 });
  });

  it('stops a vector pressed into a square corner', () => {
    expect(slideOffInto({ x: 0, y: 0 }, { x: 1, y: 2 }, [EAST_WALL, NORTH_WALL])).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('stops a vector pressed into a corner wider than 90°, though one wall in turn would not', () => {
    // 20° off the east wall's normal: into both walls. Sliding off the east wall, then off the
    // other, leaves a part that points out of the corner along the second wall.
    const into = { x: cos(Math.PI / 9), y: sin(Math.PI / 9) };

    expect(slideOffInto({ x: 9, y: 9 }, into, [EAST_WALL, NORTH_WEST_WALL])).toEqual({
      x: 0,
      y: 0,
    });
    expect(slideOffInto({ x: 9, y: 9 }, into, [NORTH_WEST_WALL, EAST_WALL])).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('slides along the one wall that leaves it clear of the other in a wide corner', () => {
    // Mostly north along the east wall: the north-west wall turns it out along that wall.
    const out = slideOffInto({ x: 0, y: 0 }, { x: 0.1, y: 1 }, [EAST_WALL, NORTH_WEST_WALL]);

    expect(out.x).toBeCloseTo(-0.45, 12);
    expect(out.y).toBeCloseTo(0.45, 12);
  });
});
