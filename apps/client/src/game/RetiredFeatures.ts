import type { RetiredFeaturesSource } from './RetiredFeatures.types';

/**
 * Which structures have fallen, read from the snapshots: a structure binds to its map feature by
 * `EntitySnapshot.mapFeatureId`, and core removes its entity when it dies. A feature is retired
 * once it has been seen standing and is gone. It serves structures whose feature is not their
 * destroyed map object (gates, the Stronghold). A lane tower's own fort object (court, keep,
 * banner art) falls with it and is hidden by `isDestroyed` (DEC-217 (12)). This is the one place
 * that rule lives: `Match` observes every snapshot, `MatchBridge` reads it for a tile's 0 health,
 * and `MapView.isGone` reads it for gates and the Stronghold.
 */
export class RetiredFeatures {
  private readonly seen = new Set<string>();
  private readonly standing = new Set<string>();

  /** Reads which structures stand in `snapshot`; call it for every snapshot. */
  public observe(snapshot: RetiredFeaturesSource): void {
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
