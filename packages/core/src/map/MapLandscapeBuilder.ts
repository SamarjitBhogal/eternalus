import type { MapDefinition, MapDecoration } from '../content/maps/maps.types';
import { MAP_PALETTE as P, SCENERY_SETTINGS as S } from '../content/maps/map1Scenery';
import { LAKES, LAVA_RIVERS, SNOW_PATCHES } from '../content/maps/map1Landforms';
import type { SceneryLake } from './sceneryPlacement.types';
import type { Vec2 } from '../utils/geometry.types';
import { MapDecorationBuilder } from './MapDecorationBuilder';
/** Layers local snow, flowing lava, water and weathered ground beneath landmarks. */
export class MapLandscapeBuilder extends MapDecorationBuilder {
  /** Receives the layout and its scenery-clearance predicate. */
  public constructor(
    private readonly map: MapDefinition,
    private readonly isClear: (point: Vec2) => boolean,
    private readonly lakePositions: readonly SceneryLake[] = LAKES,
  ) {
    super();
  }
  /** Creates organic ground polygons and bridges without changing lane logic. */
  public build(): readonly MapDecoration[] {
    this.snow();
    this.lava();
    this.lakes();
    this.ground();
    this.laneRoads();
    this.bridges();
    return this.pieces.map((piece) => ({
      ...piece,
      shape: piece.shape.map((point) => ({
        x: Math.max(0, Math.min(this.map.width, point.x)),
        y: Math.max(0, Math.min(this.map.height, point.y)),
      })),
    }));
  }

  private snow(): void {
    SNOW_PATCHES.forEach((patch, i) => {
      for (let edge = 5; edge >= 0; edge--)
        this.blob(
          `snow-pocket-${String(i)}-${String(edge)}`,
          patch.x,
          patch.y,
          patch.rx + edge * 5,
          patch.ry + edge * 2,
          edge === 0 ? P.snow : 'rgba(207,219,206,0.12)',
          'ground',
        );
      this.blob(
        `snow-pocket-${String(i)}-light`,
        patch.x - 9,
        patch.y - 5,
        patch.rx * 0.65,
        patch.ry * 0.6,
        P.snowLight,
        'ground',
      );
    });
  }

  private lava(): void {
    LAVA_RIVERS.forEach((path, i) => {
      for (let edge = 6; edge > 0; edge--)
        this.ribbon(
          `lava-weathering-${String(i)}-${String(edge)}`,
          path,
          28 + edge * 9,
          'rgba(68,57,47,0.10)',
        );
      this.ribbon(`lava-bank-${String(i)}`, path, 34, P.basalt);
      this.ribbon(`lava-river-${String(i)}`, path, 23, '#ad4930');
      this.ribbon(`lava-flow-${String(i)}`, path, 14, P.lava);
      this.ribbon(`lava-core-${String(i)}`, path, 5, P.lavaLight);
    });
  }

  private lakes(): void {
    this.lakePositions.forEach((lake, i) => {
      this.blob(
        `lake-shore-${String(i)}`,
        lake.x,
        lake.y,
        lake.rx + 9,
        lake.ry + 6,
        '#85866a',
        'ground',
      );
      this.blob(
        `lake-shallows-${String(i)}`,
        lake.x,
        lake.y,
        lake.rx,
        lake.ry,
        '#628e87',
        'ground',
      );
      this.blob(
        `lake-deep-${String(i)}`,
        lake.x + 4,
        lake.y + 3,
        lake.rx * 0.79,
        lake.ry * 0.75,
        '#416e73',
        'ground',
      );
      for (let j = 0; j < 5; j++)
        this.ribbon(
          `lake-ripple-${String(i)}-${String(j)}`,
          [
            { x: lake.x - 20 + j * 7, y: lake.y - 15 + j * 7 },
            { x: lake.x + 15 + j * 4, y: lake.y - 17 + j * 7 },
          ],
          1,
          '#88aaa0',
        );
    });
  }

  private ground(): void {
    for (let y: number = S.margin; y < this.map.height - S.margin; y += S.gridStep) {
      for (let x: number = S.margin; x < this.map.width - S.margin; x += S.gridStep) {
        const n = this.variation(x, y);
        if (this.isClear({ x, y }) && n % 3 === 0)
          this.blob(
            `ground-fleck-${String(x)}-${String(y)}`,
            x,
            y,
            9 + (n % 12),
            4 + (n % 6),
            'rgba(139,151,104,0.18)',
            'ground',
          );
      }
    }
  }

  private bridges(): void {
    for (const [i, x, y] of [
      [0, 800, 741],
      [1, 815, 860],
      [2, 656, 788],
      [3, 950, 790],
    ] as const) {
      this.rect(`lava-bridge-${String(i)}-shadow`, x - 19, y - 22, 42, 49, P.shadow);
      this.rect(`lava-bridge-${String(i)}-deck`, x - 16, y - 24, 32, 48, P.stone);
      for (let plank = 0; plank < 8; plank++)
        this.rect(
          `lava-bridge-${String(i)}-joint-${String(plank)}`,
          x - 13,
          y - 21 + plank * 6,
          26,
          1,
          P.stoneDark,
        );
      this.rect(`lava-bridge-${String(i)}-west-rail`, x - 17, y - 25, 4, 50, '#cac0a5');
      this.rect(`lava-bridge-${String(i)}-east-rail`, x + 13, y - 25, 4, 50, '#cac0a5');
    }
  }

  private laneRoads(): void {
    for (const lane of this.map.lanes) {
      for (let edge = 3; edge > 0; edge--)
        this.ribbon(
          `lane-road-${lane.id}-verge-${String(edge)}`,
          lane.path,
          3 + edge,
          'rgba(82,76,54,0.12)',
          'ground',
        );
      this.ribbon(`lane-road-${lane.id}-track`, lane.path, 3, P.road, 'ground');
    }
  }
}
