import type { MapDecoration, MapDefinition } from '../content/maps/maps.types';
import {
  MAP_PALETTE as P,
  SCENERY_SETTINGS as S,
  SKETCH_HEIGHT,
  SKETCH_WIDTH,
} from '../content/maps/map1Scenery';
import { strongholdRing } from './strongholdRing';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { CAMP_KINDS, FORTIFIED_KINDS } from './MapSceneryBuilder.constants';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import { MapFortificationBuilder } from './MapFortificationBuilder';
import { MapLandscapeBuilder } from './MapLandscapeBuilder';
import { MapMountainBuilder } from './MapMountainBuilder';
import { MapStrongholdBuilder } from './MapStrongholdBuilder';
import { MapStrongholdGatesBuilder } from './MapStrongholdGatesBuilder';
import { MapVillageBuilder } from './MapVillageBuilder';
import { CathedralExteriorBuilder } from './CathedralExteriorBuilder';
import { LAVA_RIVERS } from '../content/maps/map1Landforms';
import { distance, distanceToPath, isPointInPolygon } from '../utils/geometry';
import { SeededRandom } from '../utils/SeededRandom';
import { mirrorMovableScenery, placeSceneryLakes } from './sceneryPlacement';
import type { Vec2 } from '../utils/geometry.types';

/**
 * Builds repeatable visual scenery for a generated map, with seeded placement and without collision or
 * simulation state. The scenery is authored in sketch space (`SKETCH_WIDTH` x `SKETCH_HEIGHT`),
 * so the map is mapped into the sketch, dressed, and the result stretched back to world units.
 */
export class MapSceneryBuilder extends MapDecorationBuilder {
  /** The generated map, in sketch coordinates. */
  private readonly map: MapDefinition;
  private readonly world: MapDefinition;
  private readonly scaleX: number;
  private readonly scaleY: number;
  private readonly lakes: ReturnType<typeof placeSceneryLakes>;

  /** Creates a builder for one generated map. */
  public constructor(world: MapDefinition) {
    super();
    this.world = world;
    this.scaleX = world.width / SKETCH_WIDTH;
    this.scaleY = world.height / SKETCH_HEIGHT;
    const toSketch = (point: Vec2): Vec2 => ({
      x: point.x / this.scaleX,
      y: point.y / this.scaleY,
    });
    this.map = {
      ...world,
      width: SKETCH_WIDTH,
      height: SKETCH_HEIGHT,
      lanes: world.lanes.map((lane) => ({ ...lane, path: lane.path.map(toSketch) })),
      terrain: world.terrain.map((piece) => ({ ...piece, shape: piece.shape.map(toSketch) })),
      features: world.features.map((feature) => ({
        ...feature,
        position: toSketch(feature.position),
      })),
    };
    this.lakes = placeSceneryLakes(this.map);
  }

  /** Returns the landscape, forests, settlement, camps and dressed features, in world units. */
  public build(): readonly MapDecoration[] {
    this.dress();
    const scenery = mirrorMovableScenery(this.pieces, this.map.width).map((piece) => ({
      ...piece,
      shape: piece.shape.map((point) => ({ x: point.x * this.scaleX, y: point.y * this.scaleY })),
    }));
    const ring = this.world.features
      .filter((f) => f.kind === 'gate' || f.kind === 'wall-segment' || f.kind === 'turret')
      .map((feature) => {
        const footprint = feature.footprint ?? [feature.position];
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
      const xs = piece.shape.map((p) => p.x);
      const ys = piece.shape.map((p) => p.y);
      const left = Math.min(...xs);
      const right = Math.max(...xs);
      const top = Math.min(...ys);
      const bottom = Math.max(...ys);
      const overlaps = ring.some(
        (bounds) =>
          left <= bounds.x + bounds.width &&
          right >= bounds.x &&
          top <= bounds.y + bounds.height &&
          bottom >= bounds.y,
      );
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
    this.pieces.push(...new MapMountainBuilder().build(this.map.seed));
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

  private camp(point: Vec2, id: string): void {
    this.endObject();
    this.rect(`${id}-clearing`, point.x - 23, point.y - 18, 46, 36, P.road, 'ground');
    for (const side of [-1, 1]) {
      const x = point.x + side * 15;
      this.beginObject(`${id}-tent-${String(side)}`, 'camp');
      this.blockPolygon(
        `${id}-tent-${String(side)}`,
        [
          { x, y: point.y - 12 },
          { x: x + 9, y: point.y + 6 },
          { x: x - 9, y: point.y + 6 },
        ],
        P.gold,
      );
      this.polygon(
        `${id}-tent-shade-${String(side)}`,
        [
          { x, y: point.y - 12 },
          { x, y: point.y + 6 },
          { x: x - 9, y: point.y + 6 },
        ],
        P.bark,
      );
    }
    this.endObject();
    this.beginObject(`${id}-fire`, 'furniture');
    this.blockRect(`${id}-fire-stone`, point.x - 4, point.y - 4, 8, 8, P.stoneDark);
    this.rect(`${id}-fire`, point.x - 2, point.y - 2, 4, 4, P.lavaLight);
    this.endObject();
    this.blockRect(`${id}-supplies`, point.x - 7, point.y + 12, 7, 5, P.bark);
  }
}
