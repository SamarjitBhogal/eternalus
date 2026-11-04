import type { MapLayout, MapTerrain } from '../content/maps/maps.types';
import { mirrorPolygon } from './symmetry';

/** Joins an open front shield to the world edge through the mountains behind each base. */
export const strongholdCliffs = (
  layout: MapLayout,
  width: number,
  height: number,
): readonly MapTerrain[] => {
  const arc = layout.wallRing.frontArc;
  if (arc === undefined) return [];
  const reach = (layout.wallRing.radius + layout.wallRing.thickness / 2) * arc.verticalScale;
  const north = Math.max(0, height / 2 - reach);
  const south = Math.min(height, height / 2 + reach);
  return [
    {
      id: 'north',
      shape: [
        { x: 0, y: 0 },
        { x: layout.strongholdInset, y: 0 },
        { x: layout.strongholdInset, y: north },
        { x: 0, y: north },
      ],
    },
    {
      id: 'south',
      shape: [
        { x: 0, y: south },
        { x: layout.strongholdInset, y: south },
        { x: layout.strongholdInset, y: height },
        { x: 0, y: height },
      ],
    },
  ].flatMap(({ id, shape }): MapTerrain[] => [
    { id: `west-stronghold-cliff-${id}`, kind: 'out-of-bounds', shape },
    {
      id: `east-stronghold-cliff-${id}`,
      kind: 'out-of-bounds',
      shape: mirrorPolygon(shape, width),
    },
  ]);
};
