import type { MapDecoration, MapDefinition, MapFeature } from '../content/maps/maps.types';
import {
  MAP_PALETTE as P,
  SCENERY_SETTINGS as S,
  SKETCH_HEIGHT,
  SKETCH_WIDTH,
} from '../content/maps/map1Scenery';
import { boundsOf, doRectsOverlap } from '../utils/geometry';
import { strongholdRing } from './strongholdRing';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { CAMP_KINDS, FORTIFIED_KINDS, WALL_RING_KINDS } from './MapSceneryBuilder.constants';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import { MapFortificationBuilder } from './MapFortificationBuilder';
import { MapLandscapeBuilder } from './MapLandscapeBuilder';
import { MapMountainBuilder } from './MapMountainBuilder';
import { MapStrongholdBuilder } from './MapStrongholdBuilder';
import { MapStrongholdGatesBuilder } from './MapStrongholdGatesBuilder';
import { MapVillageBuilder } from './MapVillageBuilder';
import { CathedralExteriorBuilder } from './CathedralExteriorBuilder';
import { MapShieldBuilder } from './MapShieldBuilder';
import { LAVA_RIVERS } from '../content/maps/map1Landforms';
import { distance, distanceToPath, isPointInPolygon } from '../utils/geometry';
import { SeededRandom } from '../utils/SeededRandom';
import { mirrorMovableScenery, placeSceneryLakes } from './sceneryPlacement';
import { isInLaneFortKeepOut, laneFortKeepOuts } from './fortInWorld';
import type { Polygon, Rect, Vec2 } from '../utils/geometry.types';

/**
 * Builds repeatable visual scenery for a generated map, with seeded placement and without collision or
 * simulation state. The scenery is authored in sketch space (`SKETCH_WIDTH` x `SKETCH_HEIGHT`),
 * so the map is mapped into the sketch, dressed, and the result stretched back to world units.
 */
export class MapSceneryBuilder extends MapDecorationBuilder {
  /** The generated map, in sketch coordinates: lanes, terrain, feature positions and footprints. */
  private readonly map: MapDefinition;
  private readonly world: MapDefinition;
  private readonly scaleX: number;
  private readonly scaleY: number;
  private readonly lakes: ReturnType<typeof placeSceneryLakes>;
  /** The ground round each lane tower fort that no camp piece may take (DEC-315), in sketch units. */
  private readonly keepOuts: readonly Rect[];

  /** Creates a builder for one generated map. */
  public constructor(world: MapDefinition) {
    super();
    this.world = world;
    this.scaleX = world.width / SKETCH_WIDTH;
    this.scaleY = world.height / SKETCH_HEIGHT;
    const toSketch = (point: Vec2): Vec2 => this.toSketch(point);
    this.map = {
      ...world,
      width: SKETCH_WIDTH,
      height: SKETCH_HEIGHT,
      lanes: world.lanes.map((lane) => ({ ...lane, path: lane.path.map(toSketch) })),
      terrain: world.terrain.map((piece) => ({ ...piece, shape: piece.shape.map(toSketch) })),
      features: world.features.map((feature) => ({
        ...feature,
        position: toSketch(feature.position),
        ...(feature.footprint === undefined ? {} : { footprint: feature.footprint.map(toSketch) }),
      })),
    };
    this.lakes = placeSceneryLakes(this.map);
    this.keepOuts = laneFortKeepOuts(this.map.features);
  }

  /** Returns the landscape, forests, settlement, camps and dressed features, in world units. */
  public build(): readonly MapDecoration[] {
    this.dress();
    const scenery = mirrorMovableScenery(this.pieces, this.map.width).map((piece) => ({
      ...piece,
      shape: piece.shape.map((point) => ({ x: point.x * this.scaleX, y: point.y * this.scaleY })),
    }));
    const ring = MapSceneryBuilder.wallFootprints(this.world.features).map((footprint) => {
      const xs = footprint.map((p) => p.x);
      const ys = footprint.map((p) => p.y);
      return {
        x: Math.min(...xs) - 5,
        y: Math.min(...ys) - 5,
        width: Math.max(...xs) - Math.min(...xs) + 10,
        height: Math.max(...ys) - Math.min(...ys) + 10,
      };
    });
    const underRing = scenery.map((piece) => {
      const pieceBounds = boundsOf(piece.shape);
      const overlaps = ring.some((bounds) => doRectsOverlap(pieceBounds, bounds));
      return overlaps ? { ...piece, layer: 'ground' as const } : piece;
    });
    return [
      ...underRing,
      ...this.world.features
        .filter((f) => f.kind === 'stronghold')
        .flatMap((feature) => [
          ...new MapStrongholdBuilder().build(feature, strongholdRing(this.world, feature)),
          ...new MapStrongholdGatesBuilder().build(feature, this.world.features),
        ]),
      ...new MapShieldBuilder().build(this.world.features),
    ];
  }

  /** Adds every decoration, in sketch coordinates and draw order. */
  private dress(): void {
    this.pieces.push(
      ...new MapLandscapeBuilder(this.map, (point) => this.isClear(point), this.lakes).build(),
    );
    this.isMirrored = true;
    this.forest();
    this.isMirrored = undefined;
    const wall = MapSceneryBuilder.wallFootprints(this.map.features);
    this.pieces.push(...new MapMountainBuilder(wall).build(this.map.seed));
    this.pieces.push(...new MapVillageBuilder(this.map).build());
    this.map.features.forEach((feature) => {
      if (CAMP_KINDS.has(feature.kind)) this.camp(feature.position, `${feature.id}-camp`);
      if (FORTIFIED_KINDS.has(feature.kind))
        this.pieces.push(...new MapFortificationBuilder().build(feature));
    });
    const cathedral = this.map.features.find((f) => f.kind === 'cathedral');
    if (cathedral !== undefined)
      this.pieces.push(...new CathedralExteriorBuilder().build(cathedral.id));
  }

  /** A world point in sketch units. */
  private toSketch({ x, y }: Vec2): Vec2 {
    return { x: x / this.scaleX, y: y / this.scaleY };
  }

  /** The wall's footprints (gates, wall segments, turrets), in the units of `features` (HC-Q95). */
  private static wallFootprints(features: readonly MapFeature[]): readonly Polygon[] {
    return features
      .filter(({ kind }) => WALL_RING_KINDS.has(kind))
      .map(({ footprint, position }) => footprint ?? [position]);
  }

  private isClear(point: Vec2): boolean {
    if (LAVA_RIVERS.some((path) => distanceToPath(point, path) < 46)) return false;
    if (
      ((point.x - G.cathedral.x) / G.cathedral.precinct.radiusX) ** 2 +
        ((point.y - G.cathedral.y) / G.cathedral.precinct.radiusY) ** 2 <
      1
    )
      return false;
    if (point.x < 280 || point.x > 1320) return false;
    if (
      this.lakes.some(
        (lake) =>
          ((point.x - lake.x) / (lake.rx + 15)) ** 2 + ((point.y - lake.y) / (lake.ry + 15)) ** 2 <
          1,
      )
    )
      return false;
    if (this.map.features.some((f) => distance(point, f.position) < S.featureClearance))
      return false;
    if (this.map.terrain.some((terrain) => isPointInPolygon(point, terrain.shape))) return false;
    return !this.map.lanes.some((lane) => distanceToPath(point, lane.path) < S.laneClearance);
  }

  private forest(): void {
    const rng = new SeededRandom(this.map.seed).fork('scenery-forest');
    for (let y: number = S.margin; y < this.map.height - S.margin; y += S.gridStep) {
      for (let x: number = S.margin; x < this.map.width / 2 - S.margin; x += S.gridStep) {
        const n = rng.nextInt(0, 0xffffffff);
        const point = { x: x + (n % 17) - 8, y: y + ((n >>> 4) % 17) - 8 };
        if (!this.isClear(point) || n % 5 === 0) continue;
        this.endObject();
        const id = `tree-${String(x)}-${String(y)}`;
        const size = 8 + (n % 10);
        this.beginObject(id, n % 7 === 0 ? 'rock' : 'tree');
        if (n % 7 === 0) {
          this.blob(`${id}-boulder-shadow`, point.x + 3, point.y + 4, size, size * 0.65, P.shadow);
          this.blob(`${id}-boulder`, point.x, point.y, size, size * 0.65, P.stoneDark);
          this.blockLastShape();
          this.blob(
            `${id}-boulder-light`,
            point.x - 2,
            point.y - 2,
            size * 0.6,
            size * 0.35,
            P.stone,
          );
          continue;
        }
        if (n % 3 !== 0) {
          this.blob(`${id}-canopy-shadow`, point.x + 4, point.y + 6, size, size * 0.8, P.shadow);
          this.blockRect(`${id}-trunk`, point.x - 1, point.y, 3, 10, P.bark);
          this.blob(
            `${id}-canopy`,
            point.x,
            point.y - 5,
            size,
            size * 0.85,
            n % 4 === 0 ? P.oliveCanopy : P.pine,
          );
          this.blob(
            `${id}-canopy-light`,
            point.x - 3,
            point.y - 8,
            size * 0.65,
            size * 0.6,
            n % 4 === 0 ? P.oliveCanopyLight : P.pineLight,
          );
          continue;
        }
        this.rect(`${id}-shadow`, point.x - 3, point.y + 3, size + 4, 5, P.shadow);
        this.blockRect(`${id}-trunk`, point.x - 1, point.y, 3, 9, P.bark);
        this.polygon(
          id,
          [
            { x: point.x, y: point.y - size },
            { x: point.x + size / 2, y: point.y + 5 },
            { x: point.x - size / 2, y: point.y + 5 },
          ],
          P.pine,
        );
        this.polygon(
          `${id}-light`,
          [
            { x: point.x, y: point.y - size },
            { x: point.x + size / 3, y: point.y + 1 },
            { x: point.x, y: point.y - 2 },
          ],
          P.pineLight,
        );
      }
    }
  }

  /**
   * A camp's clearing, tents, fire and supplies. The generator moves a camp clear of the lane tower
   * forts and their clearance (`clearCampOfForts`, DEC-315), so a camp keeps every piece. Only a
   * camp it could not move (a crowded corridor) loses a blocking piece that would stand in a fort
   * or its clearance (`laneFortKeepOuts`), so no camp object overlaps a fort.
   */
  private camp(point: Vec2, id: string): void {
    const { clearing, tent, fire, supplies } = G.camp;
    // A square of half side `half` round the camp's point.
    const square = (half: number): Rect => ({
      x: point.x - half,
      y: point.y - half,
      width: 2 * half,
      height: 2 * half,
    });
    this.endObject();
    const { halfWidth, halfHeight } = clearing;
    const [left, top] = [point.x - halfWidth, point.y - halfHeight];
    this.rect(`${id}-clearing`, left, top, 2 * halfWidth, 2 * halfHeight, P.road, 'ground');
    const isClear = (box: Rect): boolean => !isInLaneFortKeepOut(box, this.keepOuts);
    const [peak, base] = [point.y + tent.top, point.y + tent.bottom];
    for (const side of [-1, 1]) {
      const x = point.x + side * tent.offsetX;
      const box = {
        x: x - tent.halfWidth,
        y: peak,
        width: 2 * tent.halfWidth,
        height: tent.bottom - tent.top,
      };
      if (!isClear(box)) continue;
      this.beginObject(`${id}-tent-${String(side)}`, 'camp');
      this.blockPolygon(
        `${id}-tent-${String(side)}`,
        [
          { x, y: peak },
          { x: x + tent.halfWidth, y: base },
          { x: x - tent.halfWidth, y: base },
        ],
        P.gold,
      );
      this.polygon(
        `${id}-tent-shade-${String(side)}`,
        [
          { x, y: peak },
          { x, y: base },
          { x: x - tent.halfWidth, y: base },
        ],
        P.bark,
      );
    }
    this.endObject();
    const stone = square(fire.stoneHalfSide);
    if (isClear(stone)) {
      const flame = square(fire.flameHalfSide);
      this.beginObject(`${id}-fire`, 'furniture');
      this.blockRect(`${id}-fire-stone`, stone.x, stone.y, stone.width, stone.height, P.stoneDark);
      this.rect(`${id}-fire`, flame.x, flame.y, flame.width, flame.height, P.lavaLight);
      this.endObject();
    }
    const pile = { ...supplies, x: point.x + supplies.x, y: point.y + supplies.y };
    if (isClear(pile)) {
      this.blockRect(`${id}-supplies`, pile.x, pile.y, pile.width, pile.height, P.bark);
    }
  }
}
