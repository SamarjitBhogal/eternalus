/**
 * The shape of a `Collider`: a circle centred on the entity's `Transform` position. Units and
 * projectiles use circles; convex polygons (structures, obstacles) are added with the structures
 * in Phase 2.
 */
export type ColliderShape = {
  readonly kind: 'circle';
  /** Radius in world units; must be positive. */
  readonly radius: number;
};

/** Which group a collider belongs to; collision rules are decided per pair of layers. */
export type CollisionLayer = 'unit' | 'structure' | 'obstacle' | 'projectile';
