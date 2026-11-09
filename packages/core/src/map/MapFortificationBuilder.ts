import type { MapDecoration, MapFeature } from '../content/maps/maps.types';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { MAP_PALETTE as P, SKETCH_HEIGHT } from '../content/maps/map1Scenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import type { Rect } from '../utils/geometry.types';

/**
 * Dresses existing square anchors with masonry, towers, battlements and faction banners. A lane
 * tower's fort has 11 wall pieces, its 7 walls and its 4 corner towers (DEC-227 (Q-C)); each is
 * its own `wall` object, part of the tower's body (`partOf`), so each can fall or stand on its own
 * once the tower is gone (DEC-217 (12)). A capture point's fort stays one object.
 */
export class MapFortificationBuilder extends MapDecorationBuilder {
  private fortId = '';
  private hasOwnWalls = false;

  /** Returns architecture for an existing landmark without moving its anchor. */
  public build(feature: MapFeature): readonly MapDecoration[] {
    const isCapturePoint = feature.kind === 'capture-point';
    const north = isCapturePoint && feature.position.y < SKETCH_HEIGHT / 2;
    const south = isCapturePoint && !north;
    const size = isCapturePoint
      ? G.fort.capturePointSize
      : feature.kind === 'stronghold'
        ? 58
        : G.fort.laneTowerSize;
    const stone = north ? P.snowLight : south ? P.basalt : P.stone;
    const roof = north ? P.snowShadow : south ? P.volcanicRoof : P.stoneDark;
    const accent = feature.team === 'light' ? P.light : feature.team === 'dark' ? P.dark : P.gold;
    const { x, y } = feature.position;
    const left = x - size / 2;
    const top = y - size / 2;
    const wall = size / G.fort.wallDivisor;
    const tower = size / 5;
    const id = feature.id;
    this.fortId = id;
    this.hasOwnWalls = !isCapturePoint;
    this.beginObject(id, 'fort');
    this.rect(`${id}-fort-shadow`, left + 5, top + 6, size, size, P.shadow);
    this.rect(`${id}-fort-court`, left, top, size, size, south ? P.ash : P.road);
    this.wall(`${id}-fort-wall-top`, { x: left, y: top, width: size, height: wall }, stone);
    // Lane gates west and east, as wide as the south gate, so the lane runs through (DEC-121 (d)).
    for (const [side, wallX] of [
      ['left', left],
      ['right', left + size - wall],
    ] as const) {
      const height = size / 3;
      this.wall(`${id}-fort-wall-${side}`, { x: wallX, y: top, width: wall, height }, stone);
      this.wall(
        `${id}-fort-wall-${side}-lower`,
        { x: wallX, y: y + size / 6, width: wall, height },
        stone,
      );
    }
    const bottom = { y: top + size - wall, width: size / 3, height: wall };
    this.wall(`${id}-fort-wall-bottom-left`, { x: left, ...bottom }, stone);
    this.wall(`${id}-fort-wall-bottom-right`, { x: x + size / 6, ...bottom }, stone);
    for (const dx of [0, size - tower]) {
      for (const dy of [0, size - tower]) {
        const suffix = String(dx) + '-' + String(dy);
        this.wall(
          `${id}-fort-tower-${suffix}`,
          { x: left + dx, y: top + dy, width: tower, height: tower },
          stone,
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

  /**
   * One fort wall piece: on a lane tower's fort its own `wall` object, part of the tower
   * (`partOf`); otherwise a block of the fort's one object. A corner tower passes `roof`, so its
   * roof belongs to the same object and is hidden when that piece falls.
   */
  private wall(id: string, { x, y, width, height }: Rect, color: string, roof?: string): void {
    if (this.hasOwnWalls) this.beginObject(id, 'wall', this.fortId);
    this.blockRect(id, x, y, width, height, color);
    if (roof !== undefined) this.rect(`${id}-roof`, x + 3, y + 3, width - 6, height - 6, roof);
    if (this.hasOwnWalls) this.beginObject(this.fortId, 'fort');
  }
}
