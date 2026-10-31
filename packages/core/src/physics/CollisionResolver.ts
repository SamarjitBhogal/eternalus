import type { Vec2 } from '../utils/geometry.types';
import { MAX_SLIDE_CONTACTS } from './CollisionResolver.constants';
import type { StaticCollisionIndex } from './StaticCollisionIndex';
import type { IndexedPolygon } from './StaticCollisionIndex.types';
import { sweepCircle } from './sweepCircle';
import type { SweepContact } from './sweepCircle.types';
import { isPointInPolygon } from '../utils/geometry';
import { circlePenetration, isCircleInsidePolygon } from '../utils/circlePolygon';
import { CONTACT_EPSILON } from '../utils/circlePolygon.constants';

/** Resolves continuous circle motion against static polygons, sliding along walls and corners. */
export class CollisionResolver {
  /** The static index is shared by every moving unit in a match. */
  public constructor(private readonly index: StaticCollisionIndex) {}

  /** Returns a safe endpoint without mutating the index, start or requested displacement. */
  public move(start: Vec2, displacement: Vec2, radius: number): Vec2 {
    let position = { ...start };
    let delta = { ...displacement };
    for (let iteration = 0; iteration < MAX_SLIDE_CONTACTS; iteration++) {
      const contact = this.firstContact(position, delta, radius);
      if (contact === null) return { x: position.x + delta.x, y: position.y + delta.y };
      const length = Math.hypot(delta.x, delta.y);
      const travel = Math.max(
        0,
        contact.time - CONTACT_EPSILON / Math.max(length, CONTACT_EPSILON),
      );
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
   * not go deeper. `undefined` when the start does not overlap, for the ordinary sweep.
   *
   * @remarks ponytail: a move that ends no deeper skips the sweep, so one longer than the wall is
   * thick can cross it. Walking never moves that far in a tick; dashes (10 §7) need the exit leg
   * swept as well.
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
