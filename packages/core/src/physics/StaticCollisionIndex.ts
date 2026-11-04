import type { Polygon, Rect } from '../utils/geometry.types';
import { STATIC_BUCKET_SIZE } from './StaticCollisionIndex.constants';
import type { IndexedPolygon, StaticCollisionShape } from './StaticCollisionIndex.types';

/** Static polygon broad phase. Queries reuse a result set and preserve insertion order. */
export class StaticCollisionIndex {
  private readonly buckets = new Map<string, IndexedPolygon[]>();
  private readonly result = new Set<IndexedPolygon>();
  private readonly removed = new Set<string>();

  /** Indexes exact world-space polygons once, rather than scanning every scenery piece per unit. */
  public constructor(shapes: readonly StaticCollisionShape[]) {
    for (const shape of shapes) {
      if (shape.polygon.length < 3) continue;
      const entry = { ...shape, bounds: StaticCollisionIndex.bounds(shape.polygon) };
      this.cells(entry.bounds, (key) => {
        const bucket = this.buckets.get(key) ?? [];
        bucket.push(entry);
        this.buckets.set(key, bucket);
      });
    }
  }

  /** Stops an object's polygons blocking immediately; the immutable definition stays intact. */
  public remove(id: string): void {
    this.removed.add(id);
  }

  /** Candidate polygons touching a swept circle's bounds. The next query reuses this result. */
  public query(bounds: Rect): ReadonlySet<IndexedPolygon> {
    this.result.clear();
    this.cells(bounds, (key) => {
      for (const entry of this.buckets.get(key) ?? []) {
        if (
          !this.removed.has(entry.id) &&
          entry.bounds.x <= bounds.x + bounds.width &&
          entry.bounds.x + entry.bounds.width >= bounds.x &&
          entry.bounds.y <= bounds.y + bounds.height &&
          entry.bounds.y + entry.bounds.height >= bounds.y
        )
          this.result.add(entry);
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

  private static bounds(polygon: Polygon): Rect {
    const xs = polygon.map((p) => p.x);
    const ys = polygon.map((p) => p.y);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }
}
