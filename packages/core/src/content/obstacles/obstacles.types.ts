/**
 * A world object that blocks movement: a tree, a rock or a piece of bridge.
 * `kind` is always `obstacle` (the entity class); what it is lives in `obstacleType`
 * (`07-structures-obstacles-and-destructibles.md` section 9). Felling arrives with MVP-if-time.
 */
export type ObstacleDefinition = {
  /** Kebab-case content id; never renamed once used. */
  readonly id: string;
  readonly kind: 'obstacle';
  /** What the obstacle is in the world. */
  readonly obstacleType: 'tree' | 'rock' | 'bridge-segment';
  /** The name players see. */
  readonly displayName: string;
  /** Collider circle radius in world units (convex polygon footprints arrive in Phase 2). */
  readonly footprintRadius: number;
  /** Health when it can be broken; `null` when it never breaks. */
  readonly health: number | null;
  readonly isBurnable: boolean;
  /** How heavy it is to pick up (`Carry` capacity checks). */
  readonly weight: number;
};
