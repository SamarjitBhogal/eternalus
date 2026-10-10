import type { MapDecoration, MapDecorationLayer } from '../content/maps/maps.types';
import type { Polygon, Vec2 } from '../utils/geometry.types';

/** Shared polygon assembly for authored map scenery and interior architecture. */
export abstract class MapDecorationBuilder {
  protected readonly pieces: MapDecoration[] = [];

  /** A repeatable pseudo-random number for a position, so scenery varies without an RNG. */
  protected variation(x: number, y: number): number {
    return (
      (Math.imul(Math.floor(x) + 17, 73856093) ^ Math.imul(Math.floor(y) + 29, 19349663)) >>> 0
    );
  }

  protected blob(
    id: string,
    x: number,
    y: number,
    rx: number,
    ry: number,
    color: string,
    layer: MapDecorationLayer = 'detail',
  ): void {
    const ring = [
      [1, 0],
      [0.92, 0.38],
      [0.71, 0.71],
      [0.38, 0.92],
      [0, 1],
      [-0.38, 0.92],
      [-0.71, 0.71],
      [-0.92, 0.38],
      [-1, 0],
      [-0.92, -0.38],
      [-0.71, -0.71],
      [-0.38, -0.92],
      [0, -1],
      [0.38, -0.92],
      [0.71, -0.71],
      [0.92, -0.38],
    ] as const;
    this.polygon(
      id,
      ring.map(([dx, dy], index) => {
        const ripple = 0.9 + ((index * 7 + Math.floor(x)) % 5) * 0.025;
        return { x: x + dx * rx * ripple, y: y + dy * ry * ripple };
      }),
      color,
      layer,
    );
  }

  protected ribbon(
    id: string,
    path: readonly Vec2[],
    width: number,
    color: string,
    layer: MapDecorationLayer = 'ground',
  ): void {
    const left: Vec2[] = [];
    const right: Vec2[] = [];
    const curve = this.curve(path);
    curve.forEach((point, index) => {
      const before = curve[Math.max(0, index - 1)] ?? point;
      const after = curve[Math.min(curve.length - 1, index + 1)] ?? point;
      const length = Math.hypot(after.x - before.x, after.y - before.y) || 1;
      const dx = ((-(after.y - before.y) / length) * width) / 2;
      const dy = (((after.x - before.x) / length) * width) / 2;
      left.push({ x: point.x + dx, y: point.y + dy });
      right.push({ x: point.x - dx, y: point.y - dy });
    });
    this.polygon(id, [...left, ...right.reverse()], color, layer);
  }

  private curve(path: readonly Vec2[]): readonly Vec2[] {
    const points: Vec2[] = [];
    path.forEach((point, index) => {
      const before = path[index - 1];
      const after = path[index + 1];
      if (before === undefined || after === undefined) {
        points.push(point);
        return;
      }
      const start = { x: (before.x + point.x) / 2, y: (before.y + point.y) / 2 };
      const end = { x: (after.x + point.x) / 2, y: (after.y + point.y) / 2 };
      for (let step = 0; step <= 6; step++) {
        const t = step / 6;
        points.push({
          x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * point.x + t ** 2 * end.x,
          y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * point.y + t ** 2 * end.y,
        });
      }
    });
    return points;
  }

  protected polygon(
    id: string,
    shape: Polygon,
    color: string,
    layer: MapDecorationLayer = 'detail',
  ): void {
    this.pieces.push({ id, shape, color, layer });
  }

  protected rect(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    layer: MapDecorationLayer = 'detail',
  ): void {
    this.polygon(
      id,
      [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
      ],
      color,
      layer,
    );
  }
}
