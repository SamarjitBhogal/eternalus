import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { MAP_PALETTE as P } from '../content/maps/map1Scenery';
import type { MapDecoration } from '../content/maps/maps.types';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { cos, sin } from '../utils/deterministicMath';
import { MapDecorationBuilder } from './MapDecorationBuilder';

/**
 * Furnishes the cross-shaped Cathedral's interior in sketch coordinates: floors, doors, the capture
 * floor, walls, pews, chapels and the altar. Its own builder beside `CathedralExteriorBuilder`
 * (DEC-346, tidy-ups); `MapBuildingInteriorBuilder` picks it for the `cathedral` feature.
 */
export class CathedralInteriorBuilder extends MapDecorationBuilder {
  /** Builds the Cathedral's interior pieces, owned by `buildingId`. */
  public build(buildingId: string): readonly MapDecoration[] {
    this.buildingId = buildingId;
    this.visibility = 'interior';
    this.cathedral();
    this.cathedralDetails();
    return this.pieces;
  }

  private cathedral(): void {
    this.isFootprint = true;
    const { nave, transept, apse } = G.cathedral;
    this.rect(
      'cathedral-interior-nave-floor',
      nave.x,
      nave.y,
      nave.width,
      nave.height,
      P.cathedralFloor,
    );
    this.rect(
      'cathedral-interior-cross-floor',
      transept.x,
      transept.y,
      transept.width,
      transept.height,
      P.cathedralFloor,
    );
    this.ellipse(
      'cathedral-interior-apse-floor',
      apse.x,
      apse.y,
      apse.radiusX,
      apse.radiusY,
      P.apseFloor,
    );
    this.rect(
      'cathedral-interior-north-door',
      G.northDoor.x,
      G.northDoor.y,
      G.northDoor.width,
      G.northDoor.height,
      P.doorInlay,
    );
    this.rect(
      'cathedral-interior-south-door',
      G.southDoor.x,
      G.southDoor.y,
      G.southDoor.width,
      G.southDoor.height,
      P.doorInlay,
    );
    this.isFootprint = undefined;
    for (const [side, door] of [
      ['west', G.westDoor],
      ['east', G.eastDoor],
    ] as const) {
      this.isFootprint = true;
      this.rect(
        `cathedral-interior-${side}-door`,
        door.x,
        door.y,
        door.width,
        door.height,
        P.doorInlay,
      );
    }
    this.isFootprint = undefined;
    this.ellipse('cathedral-interior-capture-border', G.cathedral.x, 450, 35, 35, P.doorInlay);
    this.ellipse('cathedral-interior-capture-floor', G.cathedral.x, 450, 31, 31, P.captureFloor);
    this.ellipse('cathedral-interior-capture-inlay', G.cathedral.x, 450, 11, 11, P.ivoryStone);
    this.gemPlinth();
    this.blockRect('cathedral-interior-altar', 785, 340, 30, 14, P.ivoryStone);
    for (const x of [712, 856]) {
      this.rect(`cathedral-interior-chapel-${String(x)}`, x, 428, 32, 49, P.chapelFloor);
      this.blockRect(`cathedral-interior-shrine-${String(x)}`, x + 7, 434, 18, 9, P.shrineGold);
    }
    for (const y of [370, 390, 505, 525]) {
      for (const x of [769, 811])
        this.blockRect(`cathedral-interior-pew-${String(x)}-${String(y)}`, x, y, 20, 5, P.pewWood);
    }
    for (const y of [362, 398, 500, 535])
      for (const x of [761, 839])
        this.blockEllipse(
          `cathedral-interior-column-${String(x)}-${String(y)}`,
          x,
          y,
          3,
          3,
          P.ivoryStone,
        );
  }

  /**
   * The gem blocks movement (DEC-346): an unbreakable plinth (a `cathedral` object, which has no
   * health) the size of the gem's own body, so collision and the lane paths go round it. Drawn in
   * the inlay's stone, under the gem.
   *
   * shortcut: sketch units equal world units only at the default world size; a world of another
   * size stretches the plinth with the Cathedral. Upgrade if world sizes ever vary.
   */
  private gemPlinth(): void {
    const radius = STRUCTURE_DEFINITIONS.get('cathedral').footprintRadius;
    this.beginObject('cathedral-interior-gem-plinth', 'cathedral');
    this.blockEllipse(
      'cathedral-interior-gem-plinth',
      G.cathedral.x,
      G.cathedral.y,
      radius,
      radius,
      P.ivoryStone,
    );
    this.endObject();
  }

  private cathedralDetails(): void {
    this.apseWall('west', Math.PI, Math.PI * 1.41);
    this.apseWall('east', Math.PI * 1.59, Math.PI * 2);
    const stone = P.interiorWall;
    for (const [id, x, y, w, h] of [
      ['nave-west-upper', 755, 342, 3, 78],
      ['nave-east-upper', 842, 342, 3, 78],
      ['nave-west-lower', 755, 485, 3, 68],
      ['nave-east-lower', 842, 485, 3, 68],
      ['west-arm-north', 703, 420, 52, 3],
      ['west-arm-south', 703, 482, 52, 3],
      ['east-arm-north', 845, 420, 52, 3],
      ['east-arm-south', 845, 482, 52, 3],
      ['west-arm-end', 703, 420, 3, 17.5],
      ['west-arm-end-lower', 703, 467.5, 3, 17.5],
      ['east-arm-end', 894, 420, 3, 17.5],
      ['east-arm-end-lower', 894, 467.5, 3, 17.5],
      ['south-west', 755, 550, 30, 3],
      ['south-east', 815, 550, 30, 3],
    ] as const)
      this.blockRect(`cathedral-interior-wall-${id}`, x, y, w, h, stone, 'wall');
    for (const y of [352, 381, 510, 537])
      for (const x of [755, 842]) {
        this.rect(
          `cathedral-interior-window-${String(x)}-${String(y)}`,
          x,
          y,
          3,
          8,
          x < 800 ? P.westGlass : P.eastGlass,
        );
      }
    for (const y of [364, 397, 506, 532])
      for (const x of [766, 833]) {
        this.blockEllipse(
          `cathedral-interior-candle-base-${String(x)}-${String(y)}`,
          x,
          y,
          2,
          2,
          P.candleMetal,
        );
        this.ellipse(
          `cathedral-interior-candle-${String(x)}-${String(y)}`,
          x,
          y,
          1,
          1,
          P.candleLight,
        );
      }
    this.chapelDetails(stone);
  }

  private chapelDetails(stone: string): void {
    // Lane 1 runs through both chapels: a 20-wide door in line with the arm-end gap, benches in the
    // south part, so the lane keeps two clear nav cells (DEC-121 (d)).
    for (const x of [712, 856]) {
      this.blockRect(
        `cathedral-interior-chapel-partition-${String(x)}`,
        x + (x < 800 ? 31 : 0),
        428,
        1,
        17,
        stone,
        'wall',
      );
      this.blockRect(
        `cathedral-interior-chapel-partition-lower-${String(x)}`,
        x + (x < 800 ? 31 : 0),
        465,
        1,
        12,
        stone,
        'wall',
      );
      this.rect(
        `cathedral-interior-chapel-door-${String(x)}`,
        x + (x < 800 ? 31 : 0),
        445,
        1,
        20,
        P.chapelFloor,
      );
      this.rect(
        `cathedral-interior-chapel-carpet-${String(x)}`,
        x + 7,
        447,
        18,
        25,
        P.chapelCarpet,
      );
      for (let i = 0; i < 3; i++)
        this.blockRect(
          `cathedral-interior-chapel-bench-${String(x)}-${String(i)}`,
          x + 5,
          469 + i * 4,
          22,
          3,
          P.pewWood,
        );
    }
    this.beginObject('cathedral-interior-lectern', 'furniture');
    this.blockRect('cathedral-interior-lectern', 813, 357, 7, 7, P.furnitureWood);
    this.rect('cathedral-interior-open-book', 814, 357, 5, 3, P.bookPaper);
    this.endObject();
    this.beginObject('cathedral-interior-altar', 'furniture');
    this.rect('cathedral-interior-altar-inlay', 790, 343, 20, 3, P.carpetBorder);
    this.endObject();
    this.blockRect('cathedral-interior-sacristy-cabinet', 824, 349, 10, 9, P.furnitureWood);
  }

  private apseWall(id: string, start: number, end: number): void {
    const curve = (rx: number, ry: number) =>
      Array.from({ length: 25 }, (_, i) => {
        const angle = start + ((end - start) * i) / 24;
        return { x: G.cathedral.apse.x + cos(angle) * rx, y: G.cathedral.apse.y + sin(angle) * ry };
      });
    this.blockPolygon(
      `cathedral-interior-wall-apse-${id}`,
      [
        ...curve(G.cathedral.apse.radiusX, G.cathedral.apse.radiusY),
        ...curve(
          G.cathedral.apse.radiusX - G.wallThickness,
          G.cathedral.apse.radiusY - G.wallThickness,
        ).reverse(),
      ],
      P.interiorWall,
      'wall',
    );
  }
}
