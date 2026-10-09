import type { EntityDefinitionBase } from '../EntityDefinition.types';

/** The zone kinds: areas that can be held but not hit. */
export type ZoneKind = 'capture-point';

/** An area on the map with an owner and no collider. Capture rules arrive in Phase 3. */
export type ZoneDefinition = EntityDefinitionBase & {
  /** Which entity class builds it. */
  readonly kind: ZoneKind;
  /** Radius of the area in world units. */
  readonly radius: number;
};
