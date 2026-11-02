import type { EntityDefinitionBase } from '../EntityDefinition.types';
import type { MapFeatureKind, MinimapGlyph } from '../maps/maps.types';

/** The zone kinds: areas that can be held but not hit. */
export type ZoneKind = 'capture-point';

/** An area on the map with an owner and no collider. */
export type ZoneDefinition = EntityDefinitionBase & {
  /** Which entity class builds it. */
  readonly kind: ZoneKind;
  /** Radius of the area in world units; a unit whose centre is this close is inside. */
  readonly radius: number;
  /** How the zone shows on the minimap. */
  readonly minimapGlyph: MinimapGlyph;
};

/**
 * Which zone definition a map feature places when the match starts (architecture 07 §7, recipe
 * R7), keyed by the feature's kind. A feature kind without an entry places no zone.
 */
export type ZonePlacements = Readonly<Partial<Record<MapFeatureKind, string>>>;
