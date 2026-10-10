import type { MapDecoration } from '../content/maps/maps.types';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import { MapPalaceRoomsBuilder } from './MapPalaceRoomsBuilder';
/** Furnishes interiors directly inside the buildings' original world footprints. */
export class MapBuildingInteriorBuilder extends MapDecorationBuilder {
  /** Builds the cross-shaped cathedral and both oval palace interiors in sketch coordinates. */
  public build(): readonly MapDecoration[] {
    this.cathedral();
    this.cathedralDetails();
    const cathedral = this.pieces.length;
    this.palace(142, 'light');
    const light = this.pieces.length;
    this.palace(1458, 'dark');
    return this.pieces.map((piece, i) => ({
      ...piece,
      buildingId: i < cathedral ? 'grand-cathedral' : i < light ? 'light-capital' : 'dark-capital',
      visibility: 'interior',
    }));
  }
  private cathedral(): void {
    this.rect('cathedral-interior-nave-floor', 755, 342, 90, 211, '#938e7c');
    this.rect('cathedral-interior-cross-floor', 703, 420, 194, 65, '#938e7c');
    this.ellipse('cathedral-interior-apse-floor', 800, 344, 44, 26, '#aaa18a');
    this.rect('cathedral-interior-north-door', 788, 320, 24, 12, '#c3a96b');
    this.rect('cathedral-interior-south-door', 785, 541, 30, 12, '#c3a96b');
    this.ellipse('cathedral-interior-capture-border', 800, 450, 35, 35, '#c3a96b');
    this.ellipse('cathedral-interior-capture-floor', 800, 450, 31, 31, '#b6ad92');
    this.ellipse('cathedral-interior-capture-inlay', 800, 450, 11, 11, '#d2c5a1');
    this.rect('cathedral-interior-altar', 785, 340, 30, 14, '#d2c5a1');
    for (const x of [712, 856]) {
      this.rect(`cathedral-interior-chapel-${String(x)}`, x, 428, 32, 49, '#7a8783');
      this.rect(`cathedral-interior-shrine-${String(x)}`, x + 7, 434, 18, 9, '#bea675');
    }
    for (const y of [370, 390, 505, 525]) {
      for (const x of [769, 811])
        this.rect(`cathedral-interior-pew-${String(x)}-${String(y)}`, x, y, 20, 5, '#574538');
    }
    for (const y of [362, 398, 500, 535])
      for (const x of [761, 839])
        this.ellipse(`cathedral-interior-column-${String(x)}-${String(y)}`, x, y, 3, 3, '#d2c5a1');
  }
  private palace(x: number, team: string): void {
    const start = this.pieces.length;
    const id = `${team}-palace-interior`;
    const accent = team === 'light' ? '#668b93' : '#8d607d';
    this.ellipse(`${id}-floor`, x, 450, 90, 101, '#a6a08b');
    this.ellipse(`${id}-floor-inlay`, x, 450, 79, 89, '#b9b098');
    this.rect(`${id}-carpet-border`, x - 9, 394, 18, 155, '#c3a362');
    this.rect(`${id}-carpet`, x - 7, 397, 14, 152, accent);
    this.rect(`${id}-dais`, x - 32, 374, 64, 27, '#d2c5a1');
    this.rect(`${id}-throne-back`, x - 10, 369, 20, 23, '#d0ac58');
    this.rect(`${id}-throne-cushion`, x - 7, 373, 14, 15, accent);
    this.rect(`${id}-throne-seat`, x - 11, 387, 22, 8, '#d0ac58');
    this.pieces.push(...new MapPalaceRoomsBuilder().build(x, team, accent));
    for (const y of [409, 450, 490])
      for (const dx of [-24, 24]) {
        this.ellipse(`${id}-column-${String(dx)}-${String(y)}`, x + dx, y, 4, 4, '#e5d9b7');
        this.rect(`${id}-banner-${String(dx)}-${String(y)}`, x + dx - 3, y - 13, 6, 8, accent);
      }
    // Orient the ceremonial aisle toward the opposing team, preserving the oval footprint.
    const direction = team === 'light' ? 1 : -1;
    for (let i = start; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      if (piece === undefined) continue;
      this.pieces[i] = {
        ...piece,
        shape: piece.shape.map((p) => ({
          x: x + direction * (p.y - 450) * (90 / 101),
          y: 450 - direction * (p.x - x) * (101 / 90),
        })),
      };
    }
  }

  private cathedralDetails(): void {
    this.apseWall('west', Math.PI, Math.PI * 1.41);
    this.apseWall('east', Math.PI * 1.59, Math.PI * 2);
    const stone = '#c5bda5';
    for (const [id, x, y, w, h] of [
      ['nave-west-upper', 755, 342, 3, 78],
      ['nave-east-upper', 842, 342, 3, 78],
      ['nave-west-lower', 755, 485, 3, 68],
      ['nave-east-lower', 842, 485, 3, 68],
      ['west-arm-north', 703, 420, 52, 3],
      ['west-arm-south', 703, 482, 52, 3],
      ['east-arm-north', 845, 420, 52, 3],
      ['east-arm-south', 845, 482, 52, 3],
      ['west-arm-end', 703, 420, 3, 65],
      ['east-arm-end', 894, 420, 3, 65],
      ['south-west', 755, 550, 30, 3],
      ['south-east', 815, 550, 30, 3],
    ] as const)
      this.rect(`cathedral-interior-wall-${id}`, x, y, w, h, stone);
    for (const y of [352, 381, 510, 537])
      for (const x of [755, 842]) {
        this.rect(
          `cathedral-interior-window-${String(x)}-${String(y)}`,
          x,
          y,
          3,
          8,
          x < 800 ? '#76abb6' : '#b38b9f',
        );
      }
    for (const y of [364, 397, 506, 532])
      for (const x of [766, 833]) {
        this.ellipse(
          `cathedral-interior-candle-base-${String(x)}-${String(y)}`,
          x,
          y,
          2,
          2,
          '#b49558',
        );
        this.ellipse(`cathedral-interior-candle-${String(x)}-${String(y)}`, x, y, 1, 1, '#f1d99a');
      }
    for (const x of [712, 856]) {
      this.rect(
        `cathedral-interior-chapel-partition-${String(x)}`,
        x + (x < 800 ? 31 : 0),
        428,
        1,
        49,
        stone,
      );
      this.rect(
        `cathedral-interior-chapel-door-${String(x)}`,
        x + (x < 800 ? 31 : 0),
        451,
        1,
        9,
        '#7a8783',
      );
      this.rect(`cathedral-interior-chapel-carpet-${String(x)}`, x + 7, 447, 18, 25, '#6c707b');
      for (let i = 0; i < 3; i++)
        this.rect(
          `cathedral-interior-chapel-bench-${String(x)}-${String(i)}`,
          x + 5,
          450 + i * 8,
          22,
          3,
          '#574538',
        );
    }
    this.rect('cathedral-interior-lectern', 813, 357, 7, 7, '#725840');
    this.rect('cathedral-interior-open-book', 814, 357, 5, 3, '#e0d6bd');
    this.rect('cathedral-interior-altar-inlay', 790, 343, 20, 3, '#c3a362');
    this.rect('cathedral-interior-sacristy-cabinet', 824, 349, 10, 9, '#725840');
  }

  private apseWall(id: string, start: number, end: number): void {
    const curve = (rx: number, ry: number) =>
      Array.from({ length: 25 }, (_, i) => {
        const angle = start + ((end - start) * i) / 24;
        return { x: 800 + Math.cos(angle) * rx, y: 344 + Math.sin(angle) * ry };
      });
    this.polygon(
      `cathedral-interior-wall-apse-${id}`,
      [...curve(44, 26), ...curve(41, 23).reverse()],
      '#c5bda5',
    );
  }
}
