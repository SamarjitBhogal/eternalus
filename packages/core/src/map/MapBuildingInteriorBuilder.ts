import { MAP_PALETTE as P } from '../content/maps/map1Scenery';
import type { MapFeature } from '../content/maps/maps.types';
import type { PlayableTeam } from '../teams/teams.types';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { cos, sin } from '../utils/deterministicMath';
import type { MapDecoration } from '../content/maps/maps.types';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import { MapPalaceRoomsBuilder } from './MapPalaceRoomsBuilder';
/** Furnishes interiors directly inside the buildings' original world footprints. */
export class MapBuildingInteriorBuilder extends MapDecorationBuilder {
  private readonly interiorBuilders: Partial<
    Record<MapFeature['kind'], (feature: MapFeature) => void>
  > = {
    cathedral: () => {
      this.cathedral();
      this.cathedralDetails();
    },
    stronghold: (feature) => {
      if (feature.team !== 'neutral') this.palace(G.palace.x, feature.team);
    },
  };
  /** Builds the cross-shaped cathedral and both oval palace interiors in sketch coordinates. */
  public build(feature: MapFeature): readonly MapDecoration[] {
    this.buildingId = feature.id;
    this.visibility = 'interior';
    this.interiorBuilders[feature.kind]?.(feature);
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
    this.ellipse('cathedral-interior-capture-border', G.cathedral.x, 450, 35, 35, P.doorInlay);
    this.ellipse('cathedral-interior-capture-floor', G.cathedral.x, 450, 31, 31, P.captureFloor);
    this.ellipse('cathedral-interior-capture-inlay', G.cathedral.x, 450, 11, 11, P.ivoryStone);
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
  private palace(x: number, team: PlayableTeam): void {
    const start = this.pieces.length;
    const id = `${team}-palace-interior`;
    const accent = team === 'light' ? P.lightTextile : P.darkTextile;
    this.isFootprint = true;
    this.ellipse(
      `${id}-floor`,
      x,
      G.palace.y,
      G.palace.floorRadiusX,
      G.palace.floorRadiusY,
      P.palaceFloor,
    );
    this.isFootprint = undefined;
    this.ellipse(`${id}-floor-inlay`, x, 450, 79, 89, P.palaceInlay);
    this.rect(`${id}-carpet-border`, x - 9, 394, 18, 155, P.carpetBorder);
    this.rect(`${id}-carpet`, x - 7, 397, 14, 152, accent);
    this.rect(`${id}-dais`, x - 32, 374, 64, 27, P.ivoryStone);
    this.beginObject(`${id}-throne`, 'furniture');
    this.blockRect(
      `${id}-throne-back`,
      x + G.palace.throne.x - 10,
      G.palace.throne.y - 16,
      20,
      23,
      P.throneGold,
    );
    this.rect(
      `${id}-throne-cushion`,
      x + G.palace.throne.x - 7,
      G.palace.throne.y - 12,
      14,
      15,
      accent,
    );
    this.blockRect(
      `${id}-throne-seat`,
      x + G.palace.throne.x - 11,
      G.palace.throne.y + 2,
      22,
      8,
      P.throneGold,
    );
    this.endObject();
    this.pieces.push(
      ...new MapPalaceRoomsBuilder().build(x, team, accent, this.buildingId ?? team),
    );
    for (const y of [409, 450, 490])
      for (const dx of [-24, 24]) {
        this.blockEllipse(
          `${id}-column-${String(dx)}-${String(y)}`,
          x + dx,
          y,
          4,
          4,
          P.columnStone,
        );
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
          x: x + direction * (p.y - G.palace.y) * (G.palace.floorRadiusX / G.palace.floorRadiusY),
          y: G.palace.y - direction * (p.x - x) * (G.palace.floorRadiusY / G.palace.floorRadiusX),
        })),
      };
    }
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
      ['west-arm-end', 703, 420, 3, 65],
      ['east-arm-end', 894, 420, 3, 65],
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
    for (const x of [712, 856]) {
      this.blockRect(
        `cathedral-interior-chapel-partition-${String(x)}`,
        x + (x < 800 ? 31 : 0),
        428,
        1,
        23,
        stone,
        'wall',
      );
      this.blockRect(
        `cathedral-interior-chapel-partition-lower-${String(x)}`,
        x + (x < 800 ? 31 : 0),
        460,
        1,
        17,
        stone,
        'wall',
      );
      this.rect(
        `cathedral-interior-chapel-door-${String(x)}`,
        x + (x < 800 ? 31 : 0),
        451,
        1,
        9,
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
          450 + i * 8,
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
