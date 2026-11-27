import { MAP_LANDSCAPE_GEOMETRY } from '../content/maps/landscapeArt';
import { BIOME_MATERIALS } from '../content/maps/biomeScenery';
import type { MapDefinition, MapDecoration } from '../content/maps/maps.types';
import { MAP_PALETTE as P, SCENERY_SETTINGS as S } from '../content/maps/map1Scenery';
import { LAKES, LAVA_RIVERS, SNOW_PATCHES } from '../content/maps/map1Landforms';
import type { SceneryLake } from './sceneryPlacement.types';
import type { Vec2 } from '../utils/geometry.types';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import { sceneryBiomeAt } from './sceneryBiome';
import { MapRoadBuilder } from './MapRoadBuilder';
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
    this.isMirrored = true;
    this.lakes();
    this.ground();
    this.isMirrored = undefined;
    this.pieces.push(...new MapRoadBuilder().build(this.map.lanes));
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
          ...MAP_LANDSCAPE_GEOMETRY.snowPocketBounds(patch, edge),
          edge === 0 ? P.snow : P.snowFade,
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
    const { lava } = MAP_LANDSCAPE_GEOMETRY;
    this.endObject();
    LAVA_RIVERS.forEach((path, i) => {
      for (let edge = 6; edge > 0; edge--)
        this.ribbon(
          `lava-weathering-${String(i)}-${String(edge)}`,
          path,
          lava.weatheringBase + edge * lava.weatheringStep,
          P.lavaWeathering,
        );
      this.ribbon(`lava-bank-${String(i)}`, path, lava.bankWidth, P.basalt);
      this.beginObject(`lava-river-${String(i)}`, 'terrain');
      this.ribbon(`lava-river-${String(i)}`, path, lava.riverWidth, P.lavaRiver);
      this.blockLastShape();
      this.ribbon(`lava-flow-${String(i)}`, path, lava.flowWidth, P.lava);
      this.ribbon(`lava-core-${String(i)}`, path, lava.coreWidth, P.lavaLight);
      const core = this.pieces.at(-1);
      if (core !== undefined)
        this.pieces[this.pieces.length - 1] = { ...core, sceneryAnimation: 'lava-flow' };
      this.ribbon(
        `lava-hot-thread-${String(i)}`,
        path,
        lava.hotThreadWidth,
        BIOME_MATERIALS.lavaThread,
      );
      for (const side of [-1, 1])
        this.ribbon(
          `lava-viscous-flow-${String(i)}-${String(side)}`,
          path.map((point) => ({
            x: point.x + side * lava.viscousOffset.x,
            y: point.y + side * lava.viscousOffset.y,
          })),
          lava.viscousWidth,
          side < 0 ? BIOME_MATERIALS.lavaFlowDark : BIOME_MATERIALS.lavaFlowLight,
        );
      for (let index = 1; index < path.length; index++) {
        const before = path[index - 1],
          after = path[index];
        if (before === undefined || after === undefined) continue;
        const x = (before.x + after.x) / 2,
          y = (before.y + after.y) / 2;
        const n = this.variation(x, y);
        this.blob(
          `lava-crust-${String(i)}-${String(index)}`,
          ...MAP_LANDSCAPE_GEOMETRY.lavaCrustBounds(x, n, y),
          P.basalt,
        );
      }
    });
  }

  private lakes(): void {
    this.endObject();
    this.lakePositions.forEach((lake, i) => {
      this.beginObject(`lake-${String(i)}`, 'terrain');
      this.blob(
        `lake-shore-${String(i)}`,
        ...MAP_LANDSCAPE_GEOMETRY.lakeShoreBounds(lake),
        P.lakeShore,
        'ground',
      );
      this.blob(
        `lake-shallows-${String(i)}`,
        ...MAP_LANDSCAPE_GEOMETRY.lakeShallowsBounds(lake),
        P.lakeShallows,
        'ground',
      );
      this.blockLastShape();
      this.blob(
        `lake-deep-${String(i)}`,
        ...MAP_LANDSCAPE_GEOMETRY.lakeDeepBounds(lake),
        P.lakeDeep,
        'ground',
      );
      for (let j = 0; j < 5; j++)
        this.ribbon(
          `lake-ripple-${String(i)}-${String(j)}`,
          MAP_LANDSCAPE_GEOMETRY.lakeRipple(lake, j),
          1,
          P.lakeRipple,
        );
    });
  }

  private ground(): void {
    this.endObject();
    for (let y: number = S.margin; y < this.map.height - S.margin; y += S.gridStep) {
      for (let x: number = S.margin; x < this.map.width - S.margin; x += S.gridStep) {
        const n = this.variation(x, y);
        if (this.isClear({ x, y }) && sceneryBiomeAt({ x, y }) === undefined && n % 3 === 0)
          this.blob(
            `ground-fleck-${String(x)}-${String(y)}`,
            ...MAP_LANDSCAPE_GEOMETRY.groundFleckBounds(x, y, n),
            P.groundFleck,
            'ground',
          );
      }
    }
  }

  private bridges(): void {
    const { bridge } = MAP_LANDSCAPE_GEOMETRY;
    // Bridges 2 and 3 carry lane 2 west-east over a north-south stream, so they are turned a
    // quarter: deck across the stream, rails along the lane (DEC-121 (d)).
    for (const [i, x, y, isTurned] of MAP_LANDSCAPE_GEOMETRY.bridges) {
      const at = (dx: number, dy: number, w: number, h: number) =>
        isTurned ? ([x + dy, y + dx, h, w] as const) : ([x + dx, y + dy, w, h] as const);
      this.rect(`lava-bridge-${String(i)}-shadow`, ...at(...bridge.shadow), P.shadow);
      this.rect(`lava-bridge-${String(i)}-deck`, ...at(...bridge.deck), P.stone);
      this.markPassage();
      for (let plank = 0; plank < 8; plank++)
        this.rect(
          `lava-bridge-${String(i)}-joint-${String(plank)}`,
          ...at(...bridge.joint(plank)),
          P.stoneDark,
        );
      this.blockRect(`lava-bridge-${String(i)}-west-rail`, ...at(...bridge.westRail), P.bridgeRail);
      this.blockRect(`lava-bridge-${String(i)}-east-rail`, ...at(...bridge.eastRail), P.bridgeRail);
    }
  }
}
