/** The zone kinds: areas that can be held but not hit. */
export type ZoneKind = 'capture-point';

/** An area on the map with an owner and no collider. Capture rules arrive in Phase 3. */
export type ZoneDefinition = {
  /** Kebab-case content id; never renamed once used. */
  readonly id: string;
  readonly kind: ZoneKind;
  /** The name players see. */
  readonly displayName: string;
  /** Radius of the area in world units. */
  readonly radius: number;
};
