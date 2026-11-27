import type { Rect, Vec2 } from '../utils/geometry.types';
import { MAX_SLIDE_CONTACTS } from './CollisionResolver.constants';
import type { StaticCollisionIndex } from './StaticCollisionIndex';
import type { IndexedPolygon } from './StaticCollisionIndex.types';
import { sweepCircle } from './sweepCircle';
import type { SweepContact } from './sweepCircle.types';
import { isPointInPolygon } from '../utils/geometry';
import { circlePenetration, isCircleInsidePolygon } from '../utils/circlePolygon';
import { CONTACT_EPSILON } from '../utils/circlePolygon.constants';
import type { CirclePenetration } from '../utils/circlePolygon.types';

/**
 * Resolves continuous circle motion against static polygons, sliding along walls and corners, and
 * keeps every circle inside the world's bounds. The one collision rule of a match: `Simulation`
 * builds one and gives it to `CollisionSystem`, which walks units with `move`, and to the state as
 * its `CollisionQuery` port, which cuts a dash with `reach` and finds a knock-back into a wall with
 * `hitsWall` (architecture 10 §7, ADR 0026 decision 4).
 *
 * @remarks ponytail: a mover that starts overlapping a polygon is never stopped by that polygon
 * when its move ends no deeper (`startsInside`), so a move longer than the polygon is thick can
 * cross it. `CollisionSystem` keeps every unit out of walls, so a walk or a dash never starts
 * inside one (critic r2 F2: not reached in 5400 ticks of 8 bots); `CollisionQuery.reach` states
 * that precondition, and `pushOut` moves a body out of the walls it overlaps in place: one that
 * grew (`BodySizeSystem`) and one a new wall was placed over (`EntitySummoner`). `pushOut` takes
 * at most `MAX_SLIDE_CONTACTS` passes and does not search for free ground, so a unit under a new
 * wall can stay partly inside it, also where there is room close by; a dash that starts there
 * can cross a thin placed wall. A body does not grow while the push leaves it in a wall
 * (`hasRoom`). Upgrade path: sweep the exit leg of such a move (`INBOX.md` HC-S14, with the
 * overlap check for placed walls).
 */
export class CollisionResolver {
  /**
   * @param index - The match's static polygons (`staticCollisionIndexOf`), shared by every mover.
   * @param bounds - The world: a circle's centre stays its radius inside it on each axis.
   */
  public constructor(
    private readonly index: StaticCollisionIndex,
    private readonly bounds: Rect,
  ) {}

  /**
   * Where a circle of `radius` that moves `displacement` from `start` ends: short of the first
   * wall, sliding along it, and inside the bounds. Mutates nothing.
   */
  public move(start: Vec2, displacement: Vec2, radius: number): Vec2 {
    const end = this.slide(start, displacement, radius);
    const { x, y, width, height } = this.bounds;
    return {
      x: CollisionResolver.clamp(end.x, x, width, radius),
      y: CollisionResolver.clamp(end.y, y, height, radius),
    };
  }

  /**
   * How far, up to `distance` metres, a circle of `radius` moves from `from` along `direction` (a
   * unit vector) in a straight line before it first touches a wall or the edge of the bounds, kept
   * as far short of a wall as `move` keeps a unit: `move`'s first sweep, without the slide. The
   * whole `distance` when nothing is in the way. Read-only, like `move`.
   */
  public reach(from: Vec2, direction: Vec2, distance: number, radius: number): number {
    const open = this.toBounds(from, direction, distance, radius);
    const displacement = { x: direction.x * open, y: direction.y * open };
    const contact = this.firstContact(from, displacement, radius);
    return open * (contact === null ? 1 : CollisionResolver.shortOf(contact, displacement));
  }

  /**
   * Whether a wall stops a circle of `radius` that moves `distance` metres from `from` along
   * `direction` (a unit vector) in a straight line: the circle touches a wall more than
   * `CONTACT_EPSILON` before the end of the move. The edge of the bounds is not a wall, and a
   * move the edge stops first touches no wall. `reach`'s sweep, without the slide. Read-only.
   */
  public hitsWall(from: Vec2, direction: Vec2, distance: number, radius: number): boolean {
    const open = this.toBounds(from, direction, distance, radius);
    const contact = this.firstContact(
      from,
      { x: direction.x * open, y: direction.y * open },
      radius,
    );
    return contact !== null && open * contact.time < distance - CONTACT_EPSILON;
  }

  /**
   * Where a circle of `radius` at `at` stands once pushed out of the walls it overlaps: each pass
   * moves it the shortest way out of the deepest one, `CONTACT_EPSILON` clear, up to
   * `MAX_SLIDE_CONTACTS` passes (a corner), then inside the bounds. Each pass is a swept move
   * (`slide`): it stops short of a wall the circle does not overlap and slides along it, it
   * takes the circle no deeper into another wall it overlaps, and it stays inside the bounds
   * (it slides along their edge). So a push never moves a circle into a wall. The
   * passes do not search for free ground: they can end with the circle partly inside a wall it
   * already overlapped (a gap narrower than the circle, or more walls than passes), and
   * `hasRoom` tells. One exception: the last step, the clamp to the bounds, is not swept. It
   * moves only a circle that starts outside the bounds and overlaps no wall (a body that grew
   * at the map's edge), and it can move that one into a wall. `at` itself when it overlaps
   * none. A circle inside a passage of a wall does not overlap that wall. Mutates nothing.
   */
  public pushOut(at: Vec2, radius: number): Vec2 {
    let position = { x: at.x, y: at.y };
    for (let pass = 0; pass < MAX_SLIDE_CONTACTS; pass++) {
      const overlap = this.deepestOverlap(position, radius);
      if (overlap === null) break;
      const step = overlap.depth + CONTACT_EPSILON;
      position = this.slide(
        position,
        { x: overlap.normal.x * step, y: overlap.normal.y * step },
        radius,
        true,
      );
    }
    const { x, y, width, height } = this.bounds;
    return {
      x: CollisionResolver.clamp(position.x, x, width, radius),
      y: CollisionResolver.clamp(position.y, y, height, radius),
    };
  }

  /**
   * Whether a circle of `radius` at `at` overlaps no wall (a circle inside a passage of a wall
   * does not overlap that wall). Mutates nothing.
   */
  public hasRoom(at: Vec2, radius: number): boolean {
    return this.overlaps(at, radius).length === 0;
  }

  /**
   * `move` without the clamp: the sweep and the slide. With `isBounded`, each leg also stays
   * inside the bounds: the part of it past an edge is dropped, so the circle slides along the
   * edge.
   */
  private slide(start: Vec2, displacement: Vec2, radius: number, isBounded = false): Vec2 {
    let position = { ...start };
    let delta = { ...displacement };
    for (let iteration = 0; iteration < MAX_SLIDE_CONTACTS; iteration++) {
      if (isBounded) delta = this.keptInside(position, delta, radius);
      const contact = this.firstContact(position, delta, radius);
      if (contact === null) return { x: position.x + delta.x, y: position.y + delta.y };
      const travel = CollisionResolver.shortOf(contact, delta);
      position = { x: position.x + delta.x * travel, y: position.y + delta.y * travel };
      const remainder = { x: delta.x * (1 - contact.time), y: delta.y * (1 - contact.time) };
      const intoWall = Math.min(0, remainder.x * contact.normal.x + remainder.y * contact.normal.y);
      delta = {
        x: remainder.x - contact.normal.x * intoWall,
        y: remainder.y - contact.normal.y * intoWall,
      };
      if (Math.hypot(delta.x, delta.y) <= CONTACT_EPSILON) return position;
    }
    return position;
  }

  /**
   * How far, up to `distance`, a circle of `radius` moves from `from` along `direction` before it
   * meets the edge of the bounds.
   */
  private toBounds(from: Vec2, direction: Vec2, distance: number, radius: number): number {
    const { x, y, width, height } = this.bounds;
    return Math.min(
      distance,
      CollisionResolver.toEdge(from.x, direction.x, x, width, radius),
      CollisionResolver.toEdge(from.y, direction.y, y, height, radius),
    );
  }

  /** `delta` without the part that takes a circle of `radius` at `from` past the bounds. */
  private keptInside(from: Vec2, delta: Vec2, radius: number): Vec2 {
    const { x, y, width, height } = this.bounds;
    return {
      x: CollisionResolver.clamp(from.x + delta.x, x, width, radius) - from.x,
      y: CollisionResolver.clamp(from.y + delta.y, y, height, radius) - from.y,
    };
  }

  /**
   * `at` on one axis kept where a circle of `radius` stays inside the bounds' span from `low`,
   * `size` long: [`low` + `radius`, `low` + `size` - `radius`].
   */
  private static clamp(at: number, low: number, size: number, radius: number): number {
    return Math.max(low + radius, Math.min(low + size - radius, at));
  }

  /**
   * How far a circle of `radius` at `at` on one axis moves at `step` per metre before it leaves the
   * span `clamp` keeps it in; infinite when it does not move along the axis.
   */
  private static toEdge(
    at: number,
    step: number,
    low: number,
    size: number,
    radius: number,
  ): number {
    if (step === 0) return Number.POSITIVE_INFINITY;
    const edge = step > 0 ? low + size - radius : low + radius;
    return Math.max(0, (edge - at) / step);
  }

  /** The share of `delta` that stops `CONTACT_EPSILON` short of `contact`, never below 0. */
  private static shortOf(contact: SweepContact, delta: Vec2): number {
    const length = Math.hypot(delta.x, delta.y);
    return Math.max(0, contact.time - CONTACT_EPSILON / Math.max(length, CONTACT_EPSILON));
  }

  /** The deepest overlap of a circle at `at` that has a way out (a normal), or `null`. */
  private deepestOverlap(at: Vec2, radius: number): CirclePenetration | null {
    let deepest: CirclePenetration | null = null;
    for (const overlap of this.overlaps(at, radius)) {
      const hasWayOut = overlap.normal.x !== 0 || overlap.normal.y !== 0;
      if (hasWayOut && overlap.depth > (deepest?.depth ?? 0)) deepest = overlap;
    }
    return deepest;
  }

  /** Each overlap of a circle at `at` with a wall outside its passages. */
  private overlaps(at: Vec2, radius: number): CirclePenetration[] {
    const box = { x: at.x - radius, y: at.y - radius, width: radius * 2, height: radius * 2 };
    return [...this.index.query(box)]
      .filter(
        ({ passages }) =>
          passages?.some((passage) => isCircleInsidePolygon(at, radius, passage)) !== true,
      )
      .map(({ polygon }) => circlePenetration(at, radius, polygon))
      .filter(({ depth }) => depth > CONTACT_EPSILON);
  }

  private firstContact(start: Vec2, delta: Vec2, radius: number): SweepContact | null {
    const candidates = this.index.query({
      x: Math.min(start.x, start.x + delta.x) - radius,
      y: Math.min(start.y, start.y + delta.y) - radius,
      width: Math.abs(delta.x) + radius * 2,
      height: Math.abs(delta.y) + radius * 2,
    });
    let first: SweepContact | null = null;
    const at = (time: number) => ({ x: start.x + delta.x * time, y: start.y + delta.y * time });
    for (const entry of candidates) {
      const stuck = CollisionResolver.startsInside(start, at(1), radius, entry);
      if (stuck !== undefined) {
        if (stuck !== null && (first === null || first.time > 0)) first = stuck;
        continue;
      }
      let contact = sweepCircle(start, delta, radius, entry.polygon);
      if (
        contact !== null &&
        entry.passages?.some((passage) => {
          const point = at(contact?.time ?? 0);
          return isCircleInsidePolygon(point, radius, passage);
        }) === true
      )
        contact = null;
      for (const passage of entry.passages ?? []) {
        const edge = sweepCircle(start, delta, radius, passage);
        if (
          edge !== null &&
          isPointInPolygon(at(edge.time), entry.polygon) &&
          (contact === null || edge.time < contact.time)
        )
          contact = edge;
      }
      if (contact !== null && (first === null || contact.time < first.time)) first = contact;
    }
    return first;
  }

  /**
   * For a mover that starts overlapping `entry` outside its passages (it spawned or was placed
   * there): `null` when the move does not take it deeper, so it can always walk out; otherwise a
   * contact at once whose normal leads out, so the slide keeps only the part of the move that does
   * not go deeper. `undefined` when the start does not overlap, for the ordinary sweep. A move
   * that ends no deeper skips the sweep (see the class's `ponytail` remark).
   */
  private static startsInside(
    start: Vec2,
    end: Vec2,
    radius: number,
    entry: IndexedPolygon,
  ): SweepContact | null | undefined {
    if (entry.passages?.some((passage) => isCircleInsidePolygon(start, radius, passage)) === true)
      return undefined;
    const before = circlePenetration(start, radius, entry.polygon);
    if (before.depth <= CONTACT_EPSILON) return undefined;
    const after = circlePenetration(end, radius, entry.polygon);
    return after.depth <= before.depth + CONTACT_EPSILON
      ? null
      : { time: 0, normal: before.normal };
  }
}
