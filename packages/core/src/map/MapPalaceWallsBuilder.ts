import type {
  MapDecoration,
  MapDefinition,
  MapFeature,
  MapLayout,
} from '../content/maps/maps.types';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { MAP_PALETTE as P } from '../content/maps/map1Scenery';
import { cos, sin } from '../utils/deterministicMath';
import { distanceToSegment } from '../utils/geometry';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import { placePalace } from './buildingPlacement';

/** A segmented oval palace boundary with gaps aligned to its generated gate passages. */
export class MapPalaceWallsBuilder extends MapDecorationBuilder {
  /** Keeps every lane entrance open while every other wall segment remains physical. */
  public build(
    feature: MapFeature,
    map: MapDefinition,
    ring: Pick<MapLayout['wallRing'], 'radius' | 'thickness'>,
  ): readonly MapDecoration[] {
    this.buildingId = feature.id;
    const gates = map.features.filter((f) => f.kind === 'gate' && f.team === feature.team);
    for (const [boundary, rx, ry, thickness] of [
      ['outer', G.stronghold.radiusX, G.stronghold.radiusY, G.stronghold.wallThickness],
      ['palace', G.palace.floorRadiusX, G.palace.floorRadiusY, G.wallThickness],
    ] as const) {
      const point = (angle: number, inset: number) => ({
        x: feature.position.x + cos(angle) * (rx - inset),
        y: feature.position.y + sin(angle) * (ry - inset),
      });
      for (let i = 0; i < G.wallSides; i++) {
        const a = (i * Math.PI * 2) / G.wallSides;
        const b = ((i + 1) * Math.PI * 2) / G.wallSides;
        const shape = [point(a, 0), point(b, 0), point(b, thickness), point(a, thickness)];
        const projected = placePalace(
          [{ id: 'probe', shape, color: P.interiorWall, layer: 'detail' }],
          feature,
          ring,
        )[0];
        if (projected === undefined) continue;
        const middle = projected.shape.reduce(
          (sum, p) => ({ x: sum.x + p.x / 4, y: sum.y + p.y / 4 }),
          { x: 0, y: 0 },
        );
        if (
          gates.some(
            (gate) =>
              distanceToSegment(middle, feature.position, gate.position) < G.palaceDoorHalfWidth,
          )
        )
          continue;
        this.blockPolygon(
          `${feature.id}-${boundary}-boundary-${String(i)}`,
          shape,
          P.interiorWall,
          'wall',
        );
      }
    }
    return placePalace(this.pieces, feature, ring);
  }
}
