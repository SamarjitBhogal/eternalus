/** How a unit moves, in world units (metres) and ticks. All values must be positive. */
export type MovementProfile = {
  /** Top speed in world units per tick. */
  readonly maxSpeed: number;
  /** Speed gained per tick while accelerating. */
  readonly acceleration: number;
  /** How hard the unit is to push (knockback, Sentinel sprint-through). */
  readonly mass: number;
};

/** What every unit definition (Legend or mob) has. Shared, immutable and keyed by `id`. */
export type UnitDefinition = {
  /** Kebab-case content id; never renamed once used. */
  readonly id: string;
  /** Which concrete entity class builds it (the `EntityRegistry` key). */
  readonly kind: string;
  /** The name players see. Renaming a unit changes only this. */
  readonly displayName: string;
  /** Full base health. */
  readonly baseHealth: number;
  /** Collider circle radius in world units. */
  readonly footprintRadius: number;
  /** Sight radius in world units. */
  readonly visionRadius: number;
  readonly movement: MovementProfile;
};
