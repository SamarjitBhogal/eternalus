import type { MapDecoration, MapLane } from '../content/maps/maps.types';
import { MAP_PALETTE as P, ROAD_STYLE as S } from '../content/maps/map1Scenery';
import type { Vec2 } from '../utils/geometry.types';
import { MapDecorationBuilder } from './MapDecorationBuilder';

/** Continuous world-sized dirt roads whose joins follow the actual lane polyline. */
export class MapRoadBuilder extends MapDecorationBuilder {
  /** Adds soft shoulders, a worn centre and sparse small stones without changing navigation. */
  public build(lanes: readonly MapLane[]): readonly MapDecoration[] {
    for (const lane of lanes) {
      for (const [name, width, color] of [
        ['verge', S.vergeWidth, P.laneVerge],
        ['shoulder', S.shoulderWidth, P.roadShoulder],
        ['surface', S.surfaceWidth, P.road],
        ['wear', S.wearWidth, P.roadWear],
      ] as const)
        this.surface(`lane-road-${lane.id}-${name}`, lane.path, width, color);
      lane.path.slice(1).forEach((to, segment) => {
        const from = lane.path[segment] ?? to;
        const length = Math.hypot(to.x - from.x, to.y - from.y);
        const count = Math.floor(length / S.stoneSpacing);
        for (let i = 0; i < count; i++) {
          const t = (i + 0.5) / count;
          const offset = S.surfaceWidth * 0.28;
          const x = from.x + (to.x - from.x) * t - ((to.y - from.y) / length) * offset;
          const y = from.y + (to.y - from.y) * t + ((to.x - from.x) / length) * offset;
          this.polygon(
            `lane-road-${lane.id}-stone-${String(segment)}-${String(i)}`,
            [
              { x: x - S.stoneSize, y },
              { x, y: y - S.stoneSize * 0.6 },
              { x: x + S.stoneSize, y },
              { x, y: y + S.stoneSize * 0.6 },
            ],
            P.roadPebble,
            'ground',
          );
        }
      });
    }
    return this.pieces.map((piece) => ({ ...piece, isLaneSurface: true }));
  }

  private surface(id: string, path: readonly Vec2[], width: number, color: string): void {
    if (path.length < 2) return;
    const normal = (a: Vec2, b: Vec2): Vec2 => {
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
    };
    const edge = (side: number) =>
      path.map((point, i) => {
        const before = normal(path[Math.max(0, i - 1)] ?? point, path[i === 0 ? 1 : i] ?? point);
        const after = normal(
          path[i === path.length - 1 ? i - 1 : i] ?? point,
          path[Math.min(path.length - 1, i + 1)] ?? point,
        );
        const sum = { x: before.x + after.x, y: before.y + after.y };
        const length = Math.hypot(sum.x, sum.y) || 1;
        const nx = sum.x / length;
        const ny = sum.y / length;
        const reach =
          (Math.min(S.miterLimit, 1 / Math.max(1 / S.miterLimit, nx * after.x + ny * after.y)) *
            width) /
          2;
        return { x: point.x + side * nx * reach, y: point.y + side * ny * reach };
      });
    this.polygon(id, [...edge(1), ...edge(-1).reverse()], color, 'ground');
  }
}
