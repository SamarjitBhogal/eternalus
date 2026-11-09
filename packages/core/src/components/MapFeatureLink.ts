/**
 * The map feature an entity was built from (`MapFeature.id`): a structure or a capture zone that
 * `Simulation` builds from the map (architecture 07 §1, §7). The snapshot carries it as
 * `EntitySnapshot.mapFeatureId`, so the client binds a HUD tile or capture point to its entity by
 * identity, never by position (DEC-221 (3), DEC-231). An entity built from no feature has none.
 *
 * @remarks Set once at spawn and never changed. It comes from the map, which a replay carries, so
 * `StateHasher` has nothing to add for it and recorded checkpoint hashes stay valid.
 */
export class MapFeatureLink {
  /** @param featureId - The `MapFeature.id` of the feature the entity was built from. */
  public constructor(public readonly featureId: string) {}
}
