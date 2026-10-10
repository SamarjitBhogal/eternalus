import type { MapDecoration, MapLane } from '../content/maps/maps.types';
import type { Vec2 } from '../utils/geometry.types';
import { MapDecorationBuilder } from './MapDecorationBuilder';

/** Opens lane-aligned stone passages through each palace and its perimeter wall. */
export class MapStrongholdGatesBuilder extends MapDecorationBuilder {
  /** Derives all three entrances from the existing lane geometry. */
  public build(x: number, id: string, lanes: readonly MapLane[]): readonly MapDecoration[] {
    for (const lane of lanes) {
      const lanePath = x < 800 ? lane.path : [...lane.path].reverse();
      const path = [{ x, y: 450 }, ...lanePath];
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1];
        const b = path[i];
        if (a === undefined || b === undefined || this.radius(a, x) > 1 || this.radius(b, x) <= 1)
          continue;
        const outer = this.crossing(a, b, x, 110, 125);
        const innerStart = path.findLastIndex(
          (p) => ((p.x - x) / 86) ** 2 + ((p.y - 450) / 97) ** 2 <= 1,
        );
        const inner = this.crossing(path[innerStart] ?? a, path[innerStart + 1] ?? b, x, 86, 97);
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        const dx = (b.x - a.x) / length;
        const dy = (b.y - a.y) / length;
        this.polygon(
          `${id}-${lane.id}-gate-bridge`,
          [
            { x: inner.x - dy * 10, y: inner.y + dx * 10 },
            { x: outer.x + dx * 12 - dy * 10, y: outer.y + dy * 12 + dx * 10 },
            { x: outer.x + dx * 12 + dy * 10, y: outer.y + dy * 12 - dx * 10 },
            { x: inner.x + dy * 10, y: inner.y - dx * 10 },
          ],
          '#b9b098',
        );
        for (const side of [-1, 1])
          this.ellipse(
            `${id}-${lane.id}-gate-bridge-post-${String(side)}`,
            outer.x - dy * 14 * side,
            outer.y + dx * 14 * side,
            4,
            4,
            '#d3c5a4',
          );
      }
    }
    return this.pieces;
  }

  private radius(p: Vec2, x: number): number {
    return ((p.x - x) / 110) ** 2 + ((p.y - 450) / 125) ** 2;
  }

  private crossing(a: Vec2, b: Vec2, x: number, rx: number, ry: number): Vec2 {
    let low = 0;
    let high = 1;
    for (let i = 0; i < 40; i++) {
      const t = (low + high) / 2;
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      if (((p.x - x) / rx) ** 2 + ((p.y - 450) / ry) ** 2 <= 1) low = t;
      else high = t;
    }
    return { x: a.x + (b.x - a.x) * high, y: a.y + (b.y - a.y) * high };
  }
}
