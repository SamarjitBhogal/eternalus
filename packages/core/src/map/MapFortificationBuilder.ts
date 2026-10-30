import type { MapDecoration, MapFeature } from '../content/maps/maps.types';
import { MAP_PALETTE as P, SKETCH_HEIGHT } from '../content/maps/map1Scenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';

/** Dresses existing square anchors with masonry, towers, battlements and faction banners. */
export class MapFortificationBuilder extends MapDecorationBuilder {
  /** Returns architecture for an existing landmark without moving its anchor. */
  public build(feature: MapFeature): readonly MapDecoration[] {
    const isCapturePoint = feature.kind === 'capture-point';
    const north = isCapturePoint && feature.position.y < SKETCH_HEIGHT / 2;
    const south = isCapturePoint && !north;
    const size = isCapturePoint ? 88 : feature.kind === 'stronghold' ? 58 : 32;
    const stone = north ? P.snowLight : south ? P.basalt : P.stone;
    const roof = north ? P.snowShadow : south ? P.volcanicRoof : P.stoneDark;
    const accent = feature.team === 'light' ? P.light : feature.team === 'dark' ? P.dark : P.gold;
    const { x, y } = feature.position;
    const left = x - size / 2;
    const top = y - size / 2;
    const wall = size / 10;
    const tower = size / 5;
    const id = feature.id;
    this.beginObject(id, 'fort');
    this.rect(`${id}-fort-shadow`, left + 5, top + 6, size, size, P.shadow);
    this.rect(`${id}-fort-court`, left, top, size, size, south ? P.ash : P.road);
    this.blockRect(`${id}-fort-wall-top`, left, top, size, wall, stone);
    this.blockRect(`${id}-fort-wall-left`, left, top, wall, size, stone);
    this.blockRect(`${id}-fort-wall-right`, left + size - wall, top, wall, size, stone);
    this.blockRect(`${id}-fort-wall-bottom-left`, left, top + size - wall, size / 3, wall, stone);
    this.blockRect(
      `${id}-fort-wall-bottom-right`,
      x + size / 6,
      top + size - wall,
      size / 3,
      wall,
      stone,
    );
    for (const dx of [0, size - tower]) {
      for (const dy of [0, size - tower]) {
        const suffix = String(dx) + '-' + String(dy);
        this.blockRect(`${id}-fort-tower-${suffix}`, left + dx, top + dy, tower, tower, stone);
        this.rect(
          `${id}-fort-tower-roof-${suffix}`,
          left + dx + 3,
          top + dy + 3,
          tower - 6,
          tower - 6,
          roof,
        );
      }
    }
    for (let i = 0; i < 7; i++) {
      this.rect(
        `${id}-fort-crenel-${String(i)}`,
        left + (i * size) / 7,
        top - 2,
        size / 14,
        5,
        stone,
      );
    }
    this.blockRect(`${id}-fort-keep`, x - size / 6, y - size / 5, size / 3, size / 2.5, stone);
    this.rect(`${id}-fort-keep-roof`, x - size / 7, y - size / 6, size / 3.5, size / 3, roof);
    this.rect(`${id}-fort-banner`, x - 3, y - 3, 6, 6, accent);
    this.rect(`${id}-fort-gate`, x - size / 12, y + size / 3, size / 6, size / 6, P.shadow);
    if (south) this.rect(`${id}-fort-forge`, x - 5, y + 13, 10, 5, P.lavaLight);
    return this.pieces;
  }
}
