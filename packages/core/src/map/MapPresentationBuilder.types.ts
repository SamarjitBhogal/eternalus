import type {
  MapDecoration,
  MapDefinition,
  MapFeature,
  MapFeatureKind,
} from '../content/maps/maps.types';
/** Per-kind placement strategies; adding a building does not change the assembly loop. */
export type InteriorPlacements = Partial<
  Readonly<
    Record<
      MapFeatureKind,
      (
        pieces: readonly MapDecoration[],
        map: MapDefinition,
        feature: MapFeature,
      ) => readonly MapDecoration[]
    >
  >
>;
