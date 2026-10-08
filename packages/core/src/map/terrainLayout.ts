import type { MapLayout, MapPreset, MapTerrain } from '../content/maps/maps.types';
import type { Polygon } from '../utils/geometry.types';
import { carveRift, defaultRiftProfile, defaultWestBounds } from './riftTerrain';
import { mirrorPolygon } from './symmetry';

/** What the terrain step reads: the preset (if any), the layout, the world and the crossings. */
export type TerrainInput = {
  readonly preset: MapPreset | undefined;
  readonly layout: MapLayout;
  readonly width: number;
  readonly height: number;
  /** Heights where lanes cross the symmetry axis; each gets a bridge gap in the rift. */
  readonly crossings: readonly number[];
};

/**
 * The map's ground shapes: the rift along the symmetry axis (one bridge gap per lane) and the
 * out-of-bounds corners, west polygons mirrored east. A preset's shapes are fractions of the
 * world size and are scaled here, so they never share objects with the content tables.
 */
export const layOutTerrain = (input: TerrainInput): readonly MapTerrain[] => {
  const { preset, layout, width, height } = input;
  const profile = (preset?.riftProfile ?? defaultRiftProfile(layout.rift.halfWidth)).map(
    (knot) => ({ y: knot.y * height, halfWidth: knot.halfWidth }),
  );
  const rift = carveRift(profile, input.crossings, {
    width,
    height,
    bridgeWidth: layout.rift.bridgeWidth,
  }).map((shape, index): MapTerrain => ({ id: `rift-${String(index)}`, kind: 'rift', shape }));
  const westBounds: readonly Polygon[] =
    preset?.westOutOfBounds.map((shape) =>
      shape.map((point) => ({ x: point.x * width, y: point.y * height })),
    ) ?? defaultWestBounds(layout.defaultCornerSize, height);
  const bounds = westBounds.flatMap((shape, index): MapTerrain[] => [
    { id: `west-bounds-${String(index)}`, kind: 'out-of-bounds', shape },
    {
      id: `east-bounds-${String(index)}`,
      kind: 'out-of-bounds',
      shape: mirrorPolygon(shape, width),
    },
  ]);
  return [...rift, ...bounds];
};
