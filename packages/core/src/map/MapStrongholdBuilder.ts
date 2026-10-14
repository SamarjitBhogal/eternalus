import { cos, sin } from '../utils/deterministicMath';
import type { MapDecoration, MapFeature } from '../content/maps/maps.types';
import { LANDMARK_SETTINGS as S } from '../content/maps/map1Landforms';
import { MAP_PALETTE as P } from '../content/maps/map1Scenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';
/** Encloses a monumental palace with a round fortified wall. */
export class MapStrongholdBuilder extends MapDecorationBuilder {
  /** Keeps the original home anchor inside a palace extending inward from the border. */
  public build(feature: MapFeature): readonly MapDecoration[] {
    const isWest = feature.team === 'light';
    const x = feature.position.x;
    const y = feature.position.y;
    const rx = S.strongholdWidth / 2;
    const ry = S.strongholdHeight / 2;
    const id = feature.id;
    const roof = isWest ? '#536d70' : '#705563';
    const accent = isWest ? P.light : P.dark;
    this.ellipse(`${id}-stronghold-shadow`, x + 6, y + 7, rx, ry, P.shadow);
    this.ellipse(`${id}-stronghold-wall`, x, y, rx, ry, '#c2bca4');
    this.ellipse(`${id}-stronghold-court`, x, y, rx - 8, ry - 8, '#807e68');
    this.ellipse(`${id}-palace-foundation`, x, y, rx - 13, ry - 14, P.stone);
    this.ellipse(`${id}-palace-roof`, x, y - 4, rx - 20, ry - 24, roof);
    this.ellipse(
      `${id}-palace-roof-light`,
      x - 12,
      y - 18,
      rx - 42,
      ry - 42,
      isWest ? '#708b8c' : '#947481',
    );
    this.rect(`${id}-great-hall`, x - 24.5, y - 92, 49, 176, '#b3ad96');
    this.rect(`${id}-great-hall-roof`, x - 24, y - 88, 48, 166, roof);
    this.rect(`${id}-great-hall-ridge`, x - 0.2, y - 88, 0.4, 166, P.gold);
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const tx = x + cos(angle) * (rx - 9);
      const ty = y + sin(angle) * (ry - 9);
      this.ellipse(`${id}-wall-tower-${String(i)}`, tx, ty, 10, 12, P.stone);
      this.ellipse(`${id}-wall-tower-roof-${String(i)}`, tx, ty - 2, 7, 8, roof);
      this.rect(`${id}-tower-banner-${String(i)}`, tx - 2, ty - 1, 4, 7, accent);
    }
    this.rect(`${id}-original-keep`, feature.position.x - 17, y - 22, 34, 44, P.stone);
    this.rect(`${id}-original-keep-roof`, feature.position.x - 16.5, y - 21.5, 33, 43, roof);
    this.rect(`${id}-original-banner`, feature.position.x - 0.4, y - 20, 0.8, 1.4, accent);
    return this.pieces;
  }
}
