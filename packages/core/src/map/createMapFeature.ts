import type { MapFeature, MapFeatureDefinition } from '../content/maps/maps.types';
import { regularPolygon } from '../utils/geometry';
import type { Polygon } from '../utils/geometry.types';
import type { FeatureSpec } from './MapBuilder.types';
import { MapGenerationError } from './MapGenerationError';

/**
 * Turns a placement into a `MapFeature`: looks up its definition, gives it a round footprint
 * when the definition has a size, and copies every value it takes from content, so freezing
 * the generated map never freezes the content tables.
 */
export const createMapFeature = (
  spec: FeatureSpec,
  definitions: Readonly<Record<string, MapFeatureDefinition>>,
  footprintSides: number,
): MapFeature => {
  const definition = definitions[spec.definitionId];
  if (definition === undefined) {
    throw new MapGenerationError(
      `Feature '${spec.id}' uses unknown definition '${spec.definitionId}'`,
    );
  }
  const footprint: Polygon | undefined =
    spec.footprint?.map((point) => ({ x: point.x, y: point.y })) ??
    (definition.footprintRadius > 0
      ? regularPolygon(spec.position, definition.footprintRadius, footprintSides)
      : undefined);
  return {
    id: spec.id,
    kind: definition.kind,
    team: spec.team,
    definitionId: spec.definitionId,
    position: { x: spec.position.x, y: spec.position.y },
    minimapGlyph: { ...definition.minimapGlyph },
    ...(spec.laneId === undefined ? {} : { laneId: spec.laneId }),
    ...(footprint === undefined ? {} : { footprint }),
  };
};
