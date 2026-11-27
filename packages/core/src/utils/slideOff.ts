import { CONTACT_EPSILON } from './circlePolygon.constants';
import type { Vec2 } from './geometry.types';
import type { MutableVec2 } from './vec2.types';

/** Whether (`x`, `y`) runs into none of `walls` by more than `slack`. */
const isClear = (x: number, y: number, walls: readonly Vec2[], slack: number): boolean => {
  for (const wall of walls) if (x * wall.x + y * wall.y < -slack) return false;
  return true;
};

/**
 * `out` = the vector closest to `v` that runs into none of `walls` (unit normals, each pointing out
 * of its wall), as a frictionless contact does: `v` itself, else its slide along the one wall that
 * leaves it clear of the others, else zero (head-on, or pressed into a corner). Returns `out`;
 * `out` may be `v`. The one slide rule of the walls: `CollisionResolver` slides a move with it,
 * `Momentum` a velocity (architecture 10 §7, `INBOX.md` HC-B33).
 */
export const slideOffInto = (out: MutableVec2, v: Vec2, walls: readonly Vec2[]): MutableVec2 => {
  const { x, y } = v;
  out.x = x;
  out.y = y;
  if (isClear(x, y, walls, 0)) return out;
  out.x = 0;
  out.y = 0;
  let reach = 0;
  for (const wall of walls) {
    const into = -(x * wall.x + y * wall.y);
    if (into <= 0) continue;
    const slidX = x + wall.x * into;
    const slidY = y + wall.y * into;
    const length = slidX * slidX + slidY * slidY;
    // The slide runs along this wall, so roundoff can put it a hair into this wall or one in line.
    if (length > reach && isClear(slidX, slidY, walls, CONTACT_EPSILON)) {
      out.x = slidX;
      out.y = slidY;
      reach = length;
    }
  }
  return out;
};
