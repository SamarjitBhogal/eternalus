import { boundsOf, doRectsOverlap } from '../utils/geometry';
import type { Rect } from '../utils/geometry.types';
import { STATIC_BUCKET_SIZE } from './StaticCollisionIndex.constants';
import type { IndexedPolygon, StaticCollisionShape } from './StaticCollisionIndex.types';

/**
 * Static polygon broad phase. Queries reuse a result set and preserve insertion order. A shape
 * can be added and removed during the match (a destroyed object, a placed wall, `RuntimeWalls`):
 * `remove` takes out every shape `add` put in under the same id.
 */
export class StaticCollisionIndex {
  private readonly buckets = new Map<string, IndexedPolygon[]>();
  private readonly result = new Set<IndexedPolygon>();
  /** Every indexed shape by its owner's id, so `remove` finds them all. */
  private readonly byId = new Map<string, IndexedPolygon[]>();

  /** Indexes exact world-space polygons once, rather than scanning every scenery piece per unit. */
  public constructor(shapes: readonly StaticCollisionShape[]) {
    for (const shape of shapes) this.add(shape);
  }

  /** Makes `shape` block from now on; a polygon with fewer than 3 corners is skipped. */
  public add(shape: StaticCollisionShape): void {
    if (shape.polygon.length < 3) return;
    const entry = { ...shape, bounds: boundsOf(shape.polygon) };
    this.cells(entry.bounds, (key) => {
      const bucket = this.buckets.get(key) ?? [];
      bucket.push(entry);
      this.buckets.set(key, bucket);
    });
    this.byId.set(shape.id, [...(this.byId.get(shape.id) ?? []), entry]);
  }

  /**
   * Stops an object's polygons blocking immediately: every shape added under `id` leaves the index.
   * The immutable definition stays intact; an unknown id changes nothing.
   */
  public remove(id: string): void {
    for (const entry of this.byId.get(id) ?? []) {
      this.cells(entry.bounds, (key) => {
        const bucket = this.buckets.get(key) ?? [];
        bucket.splice(bucket.indexOf(entry), 1);
        if (bucket.length === 0) this.buckets.delete(key);
      });
    }
    this.byId.delete(id);
  }

  /** Candidate polygons touching a swept circle's bounds. The next query reuses this result. */
  public query(bounds: Rect): ReadonlySet<IndexedPolygon> {
    this.result.clear();
    this.cells(bounds, (key) => {
      for (const entry of this.buckets.get(key) ?? []) {
        if (doRectsOverlap(entry.bounds, bounds)) this.result.add(entry);
      }
    });
    return this.result;
  }

  private cells(bounds: Rect, visit: (key: string) => void): void {
    for (
      let row = Math.floor(bounds.y / STATIC_BUCKET_SIZE);
      row <= Math.floor((bounds.y + bounds.height) / STATIC_BUCKET_SIZE);
      row++
    ) {
      for (
        let col = Math.floor(bounds.x / STATIC_BUCKET_SIZE);
        col <= Math.floor((bounds.x + bounds.width) / STATIC_BUCKET_SIZE);
        col++
      )
        visit(`${String(col)}:${String(row)}`);
    }
  }
}
