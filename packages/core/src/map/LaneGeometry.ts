import { distance, lerpPoint } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';

/**
 * Measures a lane path made of straight segments: its length, the point a fraction of the way
 * along it, and its height at a given x on a half that only moves east.
 */
export class LaneGeometry {
  private readonly path: readonly Vec2[];
  private readonly cumulative: readonly number[];

  /** Wraps a path of at least one point. */
  public constructor(path: readonly Vec2[]) {
    this.path = path;
    const cumulative: number[] = [0];
    path.forEach((point, index) => {
      const next = path[index + 1];
      if (next !== undefined) {
        cumulative.push((cumulative[index] ?? 0) + distance(point, next));
      }
    });
    this.cumulative = cumulative;
  }

  /** Total length of the path in world units. */
  public get length(): number {
    return this.cumulative[this.cumulative.length - 1] ?? 0;
  }

  /** The point a fraction `t` (0 = start, 1 = end) of the way along the path by length. */
  public pointAt(t: number): Vec2 {
    const target = Math.min(Math.max(t, 0), 1) * this.length;
    const segment = this.cumulative.findIndex(
      (start, index) => target <= (this.cumulative[index + 1] ?? start),
    );
    const from = this.path[Math.max(segment, 0)] ?? { x: 0, y: 0 };
    const to = this.path[Math.max(segment, 0) + 1] ?? from;
    const start = this.cumulative[Math.max(segment, 0)] ?? 0;
    const segmentLength = (this.cumulative[Math.max(segment, 0) + 1] ?? start) - start;
    return segmentLength === 0 ? from : lerpPoint(from, to, (target - start) / segmentLength);
  }

  /**
   * The path's y at `x`, for paths whose x never decreases (a lane's Light half). Positions
   * before the start or past the end take the nearest end's y.
   */
  public yAtX(x: number): number {
    const first = this.path[0] ?? { x: 0, y: 0 };
    const last = this.path[this.path.length - 1] ?? first;
    if (x <= first.x) {
      return first.y;
    }
    if (x >= last.x) {
      return last.y;
    }
    const index = this.path.findIndex((point, i) => x <= (this.path[i + 1]?.x ?? point.x));
    const from = this.path[index] ?? first;
    const to = this.path[index + 1] ?? from;
    return to.x === from.x ? from.y : lerpPoint(from, to, (x - from.x) / (to.x - from.x)).y;
  }
}
