import type { Rect, Vec2 } from '../utils/geometry.types';
import { MAX_SLIDE_CONTACTS } from './CollisionResolver.constants';
import type { StaticCollisionIndex } from './StaticCollisionIndex';
import type { IndexedPolygon } from './StaticCollisionIndex.types';
import { sweepCircle } from './sweepCircle';
import type { SweepContact } from './sweepCircle.types';
import { doesShapeStopShot, isPointInPolygon } from '../utils/geometry';
import { circlePenetration, isCircleInsidePolygon } from '../utils/circlePolygon';
import { CONTACT_EPSILON } from '../utils/circlePolygon.constants';

/**
 * Resolves continuous circle motion against static polygons, sliding along walls and corners, and
 * keeps every circle inside the world's bounds. The one collision rule of a match: `Simulation`
 * builds one and gives it to `CollisionSystem`, which walks units with `move`, and to the state as
 * its `CollisionQuery` port, which cuts a dash with `reach` (architecture 10 §7, ADR 0026
 * decision 4).
 *
 * @remarks ponytail: a mover that starts overlapping a polygon is never stopped by that polygon
 * when its move ends no deeper (`startsInside`), so a move longer than the polygon is thick can
 * cross it. `CollisionSystem` keeps every unit out of walls, so a walk or a dash never starts
 * inside one (critic r2 F2: not reached in 5400 ticks of 8 bots); `CollisionQuery.reach` states
 * that precondition. Upgrade path: sweep the exit leg once something places units inside walls.
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
   * whole `distance` when nothing is in the way. Every blocking shape stops it. Read-only, like
   * `move`.
   */
  public reach(from: Vec2, direction: Vec2, distance: number, radius: number): number {
    return this.sweep(from, direction, distance, radius);
  }

  /**
   * `reach` for a shot launched at `launch`: a shape that does not stop a shot is skipped
   * (`doesShapeStopShot`). That is a shape flagged `canShotsCross` (DEC-345; it stops a mover), and
   * a shape whose blocking area holds `launch` (inside the polygon or on its edge, inside none of
   * its passages): the shot can only leave that shape (the launch-shape rule, DEC-334). The edge
   * counts, so a turret on the joint of two wall pieces can leave both. A unit's centre is never in
   * a blocking area, so the launch-shape rule never frees a shot from a unit. Read-only.
   */
  public shotReach(
    from: Vec2,
    direction: Vec2,
    distance: number,
    radius: number,
    launch: Vec2,
  ): number {
    return this.sweep(from, direction, distance, radius, launch);
  }

  /** `reach`, or `shotReach` when `launch` is given. */
  private sweep(
    from: Vec2,
    direction: Vec2,
    distance: number,
    radius: number,
    launch?: Vec2,
  ): number {
    const { x, y, width, height } = this.bounds;
    const reach = Math.min(
      distance,
      CollisionResolver.toEdge(from.x, direction.x, x, width, radius),
      CollisionResolver.toEdge(from.y, direction.y, y, height, radius),
    );
    const displacement = { x: direction.x * reach, y: direction.y * reach };
    const contact = this.firstContact(from, displacement, radius, launch);
    return reach * (contact === null ? 1 : CollisionResolver.shortOf(contact, displacement));
  }

  /**
   * `CollisionQuery.lightsShot`: whether the move touches a shape flagged `canLightShots` outside
   * its passages, or starts in one (HC-Q89, DEC-345). Read-only.
   */
  public lightsShot(from: Vec2, delta: Vec2, radius: number): boolean {
    for (const entry of this.candidatesOf(from, delta, radius)) {
      if (entry.canLightShots === true && CollisionResolver.touches(from, delta, radius, entry)) {
        return true;
      }
    }
    return false;
  }

  /** The static shapes whose box meets the box a circle of `radius` sweeps along `delta`. */
  private candidatesOf(start: Vec2, delta: Vec2, radius: number): ReadonlySet<IndexedPolygon> {
    return this.index.query({
      x: Math.min(start.x, start.x + delta.x) - radius,
      y: Math.min(start.y, start.y + delta.y) - radius,
      width: Math.abs(delta.x) + radius * 2,
      height: Math.abs(delta.y) + radius * 2,
    });
  }

  /**
   * Whether the circle starts in the shape's polygon outside its passages, or touches it there on
   * the move: the same start test and contact as `firstContact` (`startsInside`, `contactWith`).
   */
  private static touches(start: Vec2, delta: Vec2, radius: number, entry: IndexedPolygon): boolean {
    const end = { x: start.x + delta.x, y: start.y + delta.y };
    return (
      CollisionResolver.startsInside(start, end, radius, entry) !== undefined ||
      CollisionResolver.contactWith(start, delta, radius, entry) !== null
    );
  }

  /** `move` without the bounds: the sweep and the slide. */
  private slide(start: Vec2, displacement: Vec2, radius: number): Vec2 {
    let position = { ...start };
    let delta = { ...displacement };
    for (let iteration = 0; iteration < MAX_SLIDE_CONTACTS; iteration++) {
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

  /**
   * The first contact of a circle of `radius` that moves `delta` from `start`, or `null`. With a
   * `launch` point (a shot), a shape that does not stop the shot is skipped (`doesShapeStopShot`:
   * shots can cross it, DEC-345, or its blocking area holds `launch`, DEC-334; see `shotReach`).
   */
  private firstContact(
    start: Vec2,
    delta: Vec2,
    radius: number,
    launch?: Vec2,
  ): SweepContact | null {
    const candidates = this.candidatesOf(start, delta, radius);
    let first: SweepContact | null = null;
    const at = (time: number) => ({ x: start.x + delta.x * time, y: start.y + delta.y * time });
    for (const entry of candidates) {
      if (launch !== undefined && !doesShapeStopShot(entry.polygon, entry, launch)) continue;
      const stuck = CollisionResolver.startsInside(start, at(1), radius, entry);
      if (stuck !== undefined) {
        if (stuck !== null && (first === null || first.time > 0)) first = stuck;
        continue;
      }
      const contact = CollisionResolver.contactWith(start, delta, radius, entry);
      if (contact !== null && (first === null || contact.time < first.time)) first = contact;
    }
    return first;
  }

  /**
   * The first contact of a circle that moves `delta` from `start` with the shape's polygon outside
   * its passages, or `null`: a contact on a passage (a bridge deck) does not count, and the edge of
   * a passage inside the polygon (the deck's side) does.
   */
  private static contactWith(
    start: Vec2,
    delta: Vec2,
    radius: number,
    entry: IndexedPolygon,
  ): SweepContact | null {
    const at = (time: number) => ({ x: start.x + delta.x * time, y: start.y + delta.y * time });
    let contact = sweepCircle(start, delta, radius, entry.polygon);
    if (contact !== null) {
      const point = at(contact.time);
      if (entry.passages?.some((passage) => isCircleInsidePolygon(point, radius, passage)) === true)
        contact = null;
    }
    for (const passage of entry.passages ?? []) {
      const edge = sweepCircle(start, delta, radius, passage);
      if (
        edge !== null &&
        isPointInPolygon(at(edge.time), entry.polygon) &&
        (contact === null || edge.time < contact.time)
      )
        contact = edge;
    }
    return contact;
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
