import type { Vec2 } from '../utils/geometry.types';
import { CONTACT_EPSILON, MAX_SLIDE_CONTACTS } from './CollisionResolver.constants';
import type { StaticCollisionIndex } from './StaticCollisionIndex';
import { sweepCircle } from './sweepCircle';
import type { SweepContact } from './sweepCircle.types';
import { isPointInPolygon } from '../utils/geometry';
import { isCircleInsidePolygon } from './circlePolygon';

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
    for (const entry of candidates) {
      let contact = sweepCircle(start, delta, radius, entry.polygon);
      const at = (time: number) => ({ x: start.x + delta.x * time, y: start.y + delta.y * time });
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
}
