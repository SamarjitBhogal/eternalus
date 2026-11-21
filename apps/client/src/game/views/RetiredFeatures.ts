import type { EntitySnapshot } from '@eternalus/core';

/**
 * Which structures have fallen, read from the snapshots: a structure binds to its map feature by
 * `EntitySnapshot.mapFeatureId`, and core removes its entity when it dies. A feature is retired
 * once it has been seen standing and is gone. It is not the map object's `isDestroyed`, which a
 * fallen structure's fort never gets (its walls stay as ruins, DEC-217 (12)).
 */
export class RetiredFeatures {
  private readonly seen = new Set<string>();
  private readonly standing = new Set<string>();

  /** Reads which structures stand in `snapshot`; call it for every snapshot shown. */
  public observe(snapshot: {
    readonly entities: readonly Pick<EntitySnapshot, 'mapFeatureId'>[];
  }): void {
    this.standing.clear();
    for (const entity of snapshot.entities) {
      if (entity.mapFeatureId !== undefined) {
        this.seen.add(entity.mapFeatureId);
        this.standing.add(entity.mapFeatureId);
      }
    }
  }

  /** True when the structure built from feature `id` stood and has fallen. */
  public readonly isRetired = (id: string): boolean => this.seen.has(id) && !this.standing.has(id);
}
