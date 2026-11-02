import type { MapDefinition, MapFeature, MapLayout } from '../content/maps/maps.types';
import { distance } from '../utils/geometry';

/** Reads the generated concentric wall edges, so presentation cannot silently use another layout. */
export function strongholdRing(
  map: MapDefinition,
  stronghold: MapFeature,
): Pick<MapLayout['wallRing'], 'radius' | 'thickness'> {
  const distances = map.features
    .filter((feature) => feature.kind === 'wall-segment' && feature.team === stronghold.team)
    .flatMap((feature) =>
      (feature.footprint ?? []).map((point) => distance(stronghold.position, point)),
    );
  if (distances.length === 0) throw new Error(`Missing generated wall ring for ${stronghold.id}`);
  const inner = Math.min(...distances);
  const outer = Math.max(...distances);
  return { radius: (inner + outer) / 2, thickness: outer - inner };
}
