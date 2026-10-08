import type { MapDecoration } from '../content/maps/maps.types';
import { MapDecorationBuilder } from './MapDecorationBuilder';
/** Builds overlapping, individually shaped mountain masses around the battlefield. */
export class MapMountainBuilder extends MapDecorationBuilder {
  /** Returns varied peaks, foothills and rocky slopes without changing collision. */
  public build(): readonly MapDecoration[] {
    for (let x = 0; x <= 1640;) {
      const n = this.variation(x, 17);
      const width = 42 + (n % 44);
      this.mountain(`mountain-north-${String(x)}`, x, 32, width, 25 + ((n >>> 4) % 34), n);
      const south = this.variation(x, 881);
      this.mountain(
        `mountain-south-${String(x)}`,
        x + 11,
        888,
        width * 0.9,
        22 + ((south >>> 3) % 30),
        south,
      );
      x += width * 1.15;
    }
    for (let y = 0; y <= 940;) {
      const n = this.variation(19, y);
      this.mountain(`mountain-west-${String(y)}`, 8, y, 22 + (n % 8), 35 + ((n >>> 5) % 35), n);
      this.mountain(
        `mountain-east-${String(y)}`,
        1595,
        y + 7,
        20 + (n % 10),
        33 + ((n >>> 9) % 38),
        n >>> 2,
      );
      y += 48 + (n % 27);
    }
    for (let y = 38; y < 310; y += 48) {
      for (let x = 38; x < 235 - y * 0.35; x += 55) {
        const n = this.variation(x, y);
        for (const [corner, px, py] of [
          ['nw', x, y],
          ['ne', 1600 - x, y + 9],
          ['sw', x + 7, 900 - y],
          ['se', 1600 - x - 8, 900 - y - 11],
        ] as const) {
          const variation = n + corner.charCodeAt(1) * 31;
          this.mountain(
            `mountain-corner-${corner}-${String(x)}-${String(y)}`,
            px,
            py,
            35 + (variation % 43),
            38 + ((variation >>> 3) % 55),
            variation,
          );
        }
      }
    }
    for (const [i, x, y, size] of [
      [0, 245, 180, 48],
      [1, 1360, 180, 52],
      [2, 280, 730, 42],
      [3, 1340, 720, 48],
      [4, 530, 555, 26],
      [5, 1075, 560, 31],
    ] as const)
      this.mountain(`hill-${String(i)}`, x, y, size, size * 0.7, i * 47);
    return this.pieces.map((piece) => ({
      ...piece,
      shape: piece.shape.map((p) => ({
        x: Math.max(0, Math.min(1600, p.x)),
        y: Math.max(0, Math.min(900, p.y)),
      })),
    }));
  }
  private variation(x: number, y: number): number {
    return (
      (Math.imul(Math.floor(x) + 17, 73856093) ^ Math.imul(Math.floor(y) + 29, 19349663)) >>> 0
    );
  }
  private mountain(id: string, x: number, y: number, rx: number, ry: number, n: number): void {
    const point = (dx: number, dy: number) => ({ x: x + dx * rx, y: y + dy * ry });
    const peak = point(-0.35 + (n % 7) * 0.08, -0.85);
    const shoulder = point(0.38, -0.25 - (n % 3) * 0.1);
    this.blob(`${id}-foot`, x, y + ry * 0.2, rx * 1.12, ry * 0.77, 'rgba(35,45,36,0.35)');
    this.polygon(
      `${id}-mass`,
      [
        point(-1, 0.55),
        point(-0.87, -0.08),
        point(-0.55, -0.4),
        peak,
        shoulder,
        point(0.81, -0.05),
        point(1, 0.55),
        point(0.35, 0.75),
        point(-0.45, 0.7),
      ],
      n % 3 === 0 ? '#545e55' : '#48554d',
    );
    this.polygon(
      `${id}-sun-face`,
      [point(-1, 0.55), point(-0.55, -0.4), peak, point(-0.1, 0.1), point(-0.32, 0.66)],
      '#859081',
    );
    this.polygon(
      `${id}-middle-face`,
      [peak, shoulder, point(0.36, 0.48), point(-0.1, 0.1)],
      '#677568',
    );
    this.polygon(
      `${id}-shadow-face`,
      [shoulder, point(0.81, -0.05), point(1, 0.55), point(0.35, 0.75), point(0.36, 0.48)],
      '#37473e',
    );
    this.polygon(
      `${id}-broken-ridge`,
      [peak, point(-0.1, 0.1), point(-0.32, 0.66), point(-0.19, 0.25), point(-0.26, -0.14)],
      '#a0a591',
    );
    if (ry > 45)
      this.polygon(
        `${id}-snow`,
        [peak, point(-0.36, -0.43), point(-0.16, -0.51), point(0.05, -0.38), point(0.17, -0.5)],
        '#c3c9ba',
      );
    this.polygon(
      `${id}-scree`,
      [point(-0.64, 0.35), point(-0.32, 0.1), point(-0.42, 0.52), point(-0.76, 0.63)],
      '#747f6d',
    );
  }
}
