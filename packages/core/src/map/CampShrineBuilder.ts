import type { MapDecoration } from '../content/maps/maps.types';
import { CAMP_MATERIALS as M } from '../content/maps/campScenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import { isPointInPolygon } from '../utils/geometry';

/** Builds the reference shrine's weathered stonework in local sketch coordinates. */
export class CampShrineBuilder extends MapDecorationBuilder {
  /** Broad stairs, a carved pedestal and a broken pointed arch, facing the viewer. */
  public build(id: string): readonly MapDecoration[] {
    this.beginObject(id, 'camp');
    this.ellipse(`${id}-shadow`, 2, 17, 35, 13, M.shadow);
    for (let step = 0; step < 4; step++) this.stair(id, step);
    for (const side of [-1, 1]) this.pillar(id, side);
    this.arch(id);
    this.blockEllipse(`${id}-altar-foot`, 0, 1, 12, 4, M.face);
    this.rect(`${id}-altar-face`, -10, -5, 20, 6, M.face);
    this.ellipse(`${id}-altar-rim`, 0, -5, 12, 4, M.bronze);
    this.ellipse(`${id}-altar-top`, 0, -6, 10, 3, M.stone);
    for (const x of [-7, 0, 7]) {
      this.polygon(
        `${id}-altar-carving-${String(x)}`,
        [
          { x, y: -3 },
          { x: x + 2, y: 0 },
          { x, y: 2 },
          { x: x - 2, y: 0 },
        ],
        M.bronzeLight,
      );
    }
    for (let i = 0; i < 14; i++) {
      const x = (i % 2 === 0 ? -1 : 1) * (23 + (i % 5) * 2);
      const y = 3 + (i % 7) * 2.4;
      this.polygon(
        `${id}-fallen-stone-${String(i)}`,
        [
          { x, y },
          { x: x + 4, y: y - 1 },
          { x: x + 6, y: y + 2 },
          { x: x + 1, y: y + 3 },
        ],
        i % 3 === 0 ? M.light : M.face,
      );
    }
    this.weathering(id);
    return this.pieces;
  }

  private weathering(id: string): void {
    const stones = this.pieces.filter((piece) => piece.color === M.stone || piece.color === M.face);
    stones.forEach((stone, index) => {
      const xs = stone.shape.map((point) => point.x);
      const ys = stone.shape.map((point) => point.y);
      const left = Math.min(...xs);
      const top = Math.min(...ys);
      for (let fleck = 0; fleck < 3; fleck++) {
        const n = this.variation(index, fleck);
        const x = left + (Math.max(...xs) - left) * (0.15 + (n % 70) / 100);
        const y = top + (Math.max(...ys) - top) * (0.15 + ((n >>> 8) % 70) / 100);
        const shape = [
          { x, y },
          { x: x + 1.6, y: y - 0.4 },
          { x: x + 1, y: y + 0.5 },
        ];
        if (!shape.every((point) => isPointInPolygon(point, stone.shape))) continue;
        this.polygon(
          `${id}-weathering-${String(index)}-${String(fleck)}`,
          shape,
          fleck % 2 === 0 ? M.grainLight : M.grainDark,
        );
      }
    });
  }

  private stair(id: string, step: number): void {
    const y = 18 - step * 5;
    const w = 32 - step * 4;
    const prefix = `${id}-stair-${String(step)}`;
    this.polygon(
      `${prefix}-face`,
      [
        { x: -w, y },
        { x: w, y },
        { x: w - 1, y: y + 4 },
        { x: -w + 1, y: y + 4 },
      ],
      M.face,
    );
    this.polygon(
      `${prefix}-tread`,
      [
        { x: -w + 4, y: y - 6 },
        { x: w - 4, y: y - 6 },
        { x: w, y },
        { x: -w, y },
      ],
      M.stone,
    );
    this.rect(`${prefix}-lip`, -w + 1, y, w * 2 - 2, 0.65, M.light);
    for (let block = 0; block < 6; block++) {
      const x = -w + 4 + (block * (w * 2 - 8)) / 6;
      this.polygon(
        `${prefix}-joint-${String(block)}`,
        [
          { x, y: y - 5 },
          { x: x + 0.5, y: y - 5 },
          { x: x + 1.5, y },
          { x: x + 0.8, y },
        ],
        M.crack,
      );
      this.rect(`${prefix}-lichen-${String(block)}`, x + 1, y - 4, 1.6, 0.7, M.moss);
    }
  }

  private pillar(id: string, side: number): void {
    const x = side * 21;
    const prefix = `${id}-pillar-${String(side)}`;
    this.blockRect(`${prefix}-foot`, x - 5, -4, 10, 9, M.face);
    this.rect(`${prefix}-foot-top`, x - 6, -7, 12, 4, M.light);
    this.polygon(
      `${prefix}-shaft`,
      [
        { x: x - 3.7, y: -38 },
        { x: x + 3.7, y: -38 },
        { x: x + 4.5, y: -7 },
        { x: x - 4.5, y: -7 },
      ],
      M.stone,
    );
    this.rect(`${prefix}-side`, x + 2, -37, 2.5, 30, M.face);
    this.rect(`${prefix}-recess`, x - 2, -34, 3.2, 23, M.crack);
    this.rect(`${prefix}-flute`, x - 2.4, -34, 0.65, 23, M.bronzeLight);
    this.rect(`${prefix}-capital`, x - 5, -39, 10, 3, M.light);
    this.rect(`${prefix}-crown`, x - 3, -42, 6, 3, M.stone);
    for (let course = 0; course < 5; course++) {
      const y = -35 + course * 5.6;
      this.rect(`${prefix}-joint-${String(course)}`, x - 3.5, y, 7, 0.6, M.face);
      this.polygon(
        `${prefix}-relief-${String(course)}`,
        [
          { x, y: y + 1 },
          { x: x + 1.3, y: y + 2.5 },
          { x, y: y + 4 },
          { x: x - 1.3, y: y + 2.5 },
        ],
        M.bronze,
      );
    }
    this.polygon(
      `${prefix}-buttress`,
      [
        { x: x + side * 3, y: -21 },
        { x: x + side * 10, y: -4 },
        { x: x + side * 10, y: 7 },
        { x: x + side * 3, y: 5 },
      ],
      M.face,
    );
    this.polygon(
      `${prefix}-buttress-light`,
      [
        { x: x + side * 3, y: -21 },
        { x: x + side * 5, y: -18 },
        { x: x + side * 11, y: 4 },
        { x: x + side * 9, y: 2 },
      ],
      M.light,
    );
    this.blob(`${prefix}-moss`, x + side * 4, -3, 3, 2, M.moss);
  }

  private arch(id: string): void {
    for (const side of [-1, 1]) {
      const outer = [
        { x: side * 23, y: -20 },
        { x: side * 22, y: -32 },
        { x: side * 15, y: -43 },
        { x: side * 6, y: -48 },
        { x: 0, y: -53 },
      ];
      const inner = [
        { x: side * 17, y: -20 },
        { x: side * 16, y: -31 },
        { x: side * 11, y: -39 },
        { x: side * 4, y: -44 },
        { x: 0, y: -47 },
      ];
      for (let i = 0; i < outer.length - 1; i++) {
        const a = outer[i];
        const b = outer[i + 1];
        const c = inner[i + 1];
        const d = inner[i];
        if (a === undefined || b === undefined || c === undefined || d === undefined) continue;
        const prefix = `${id}-arch-${String(side)}-${String(i)}`;
        this.polygon(`${prefix}-block`, [a, b, c, d], i % 2 === 0 ? M.stone : M.face);
        this.ribbon(`${prefix}-edge`, [a, b], 0.8, M.light, 'detail');
        this.ribbon(`${prefix}-trim`, [d, c], 0.7, M.bronzeLight, 'detail');
        this.ribbon(`${prefix}-joint`, [a, d], 0.55, M.crack, 'detail');
      }
    }
    this.polygon(
      `${id}-keystone`,
      [
        { x: -3, y: -54 },
        { x: 0, y: -58 },
        { x: 3, y: -54 },
        { x: 2, y: -47 },
        { x: -2, y: -47 },
      ],
      M.bronze,
    );
    this.rect(`${id}-keystone-inlay`, -0.6, -54, 1.2, 6, M.edge);
    this.polygon(
      `${id}-arch-broken-chip`,
      [
        { x: -17, y: -40 },
        { x: -12, y: -43 },
        { x: -13, y: -39 },
      ],
      M.crack,
    );
  }
}
