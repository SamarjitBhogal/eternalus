import type { EntitySnapshot } from '@eternalus/core';

/** What `RetiredFeatures.observe` reads: any snapshot-shaped value, only the entities' feature ids. */
export type RetiredFeaturesSource = {
  readonly entities: readonly Pick<EntitySnapshot, 'mapFeatureId'>[];
};
