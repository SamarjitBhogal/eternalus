import type { MapDefinition, MapFeature, MapLayout } from '../content/maps/maps.types';

/** Reads a generated Stronghold's wall boundary; fails instead of guessing its dimensions. */
export function strongholdRing(
  map: MapDefinition,
  stronghold: MapFeature,
): Pick<MapLayout['wallRing'], 'radius' | 'thickness'> {
  const hasWall = map.features.some(
    (feature) =>
      feature.kind === 'wall-segment' &&
      feature.team === stronghold.team &&
      (feature.footprint?.length ?? 0) > 0,
  );
  if (!hasWall) throw new Error(`Missing generated wall ring for ${stronghold.id}`);
  if (stronghold.wallBoundary === undefined)
    throw new Error(`Missing generated wall boundary for ${stronghold.id}`);
  return { radius: stronghold.wallBoundary.radius, thickness: stronghold.wallBoundary.thickness };
}
