import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { placePalace } from './buildingPlacement';
import type { MapDecoration, MapFeature, MapLayout } from '../content/maps/maps.types';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { MAP_PALETTE as P } from '../content/maps/map1Scenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';
/** Encloses a monumental palace with a round fortified wall. */
export class MapStrongholdBuilder extends MapDecorationBuilder {
  /** Keeps the original home anchor inside a palace extending inward from the border. */
  public build(
    feature: MapFeature,
    ring: MapLayout['wallRing'] = DEFAULT_MAP_LAYOUT.wallRing,
  ): readonly MapDecoration[] {
    this.buildingId = feature.id;
    this.layer = 'ground';
    const isWest = feature.team === 'light';
    const x = feature.position.x;
    const y = feature.position.y;
    const rx = G.stronghold.radiusX;
    const ry = G.stronghold.radiusY;
    const id = feature.id;
    const roof = isWest ? P.palaceLightRoof : P.palaceDarkRoof;
    const accent = isWest ? P.light : P.dark;
    this.ellipse(`${id}-stronghold-shadow`, x + 6, y + 7, rx, ry, P.shadow);
    this.ellipse(`${id}-stronghold-wall`, x, y, rx, ry, P.palaceWall);
    this.ellipse(`${id}-stronghold-court`, x, y, rx - 8, ry - 8, P.palaceCourt);
    this.visibility = 'roof';
    this.ellipse(`${id}-palace-foundation`, x, y, rx - 13, ry - 14, P.stone);
    this.ellipse(`${id}-palace-roof`, x, y - 4, rx - 20, ry - 24, roof);
    this.ellipse(
      `${id}-palace-roof-light`,
      x - 12,
      y - 18,
      rx - 42,
      ry - 42,
      isWest ? P.palaceLightRoofHighlight : P.palaceDarkRoofHighlight,
    );
    this.rect(`${id}-great-hall`, x - 24.5, y - 92, 49, 176, P.palaceHallStone);
    this.rect(`${id}-great-hall-roof`, x - 24, y - 88, 48, 166, roof);
    this.rect(`${id}-great-hall-ridge`, x - 0.2, y - 88, 0.4, 166, P.gold);
    this.rect(`${id}-original-keep`, feature.position.x - 17, y - 22, 34, 44, P.stone);
    this.rect(`${id}-original-keep-roof`, feature.position.x - 16.5, y - 21.5, 33, 43, roof);
    this.rect(`${id}-original-banner`, feature.position.x - 0.4, y - 20, 0.8, 1.4, accent);
    return placePalace(this.pieces, feature, ring);
  }
}
