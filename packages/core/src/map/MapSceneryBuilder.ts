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
import { FORTIFIED_KINDS, WALL_RING_KINDS } from './MapSceneryBuilder.constants';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import { MapFortificationBuilder } from './MapFortificationBuilder';
import { MapCampBuilder } from './MapCampBuilder';
import { CAMP_ART, isCampArtKind } from './campArtByKind';
import { laneCampThemes } from './campThemes';
import { MapBiomeBuilder } from './MapBiomeBuilder';
import { MapBiomeVegetationBuilder } from './MapBiomeVegetationBuilder';
import { sceneryBiomeAt } from './sceneryBiome';
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
    this.pieces.push(...new MapBiomeBuilder().build(this.map));
    this.pieces.push(
      ...new MapLandscapeBuilder(this.map, (point) => this.isClear(point), this.lakes).build(),
    );
    this.isMirrored = true;
    this.forest();
    this.isMirrored = undefined;
    const wall = MapSceneryBuilder.wallFootprints(this.map.features);
    this.pieces.push(...new MapMountainBuilder(wall).build(this.map));
    this.pieces.push(...new MapVillageBuilder(this.map).build());
    const themes = laneCampThemes(this.map);
    this.map.features.forEach((feature) => {
      const mirrorWidth = feature.position.x > this.map.width / 2 ? this.map.width : undefined;
      const theme = themes.get(feature.id);
      if (FORTIFIED_KINDS.has(feature.kind)) {
        this.pieces.push(...new MapFortificationBuilder().build(feature));
        if (theme !== undefined)
          this.pieces.push(
            ...new MapCampBuilder().build(feature, theme, mirrorWidth).map((piece) => ({
              ...piece,
              object: { id: feature.id, kind: 'fort' as const, isFootprint: false },
            })),
          );
      } else if (isCampArtKind(feature.kind)) {
        this.pieces.push(...this.clearOfForts(CAMP_ART[feature.kind](feature, mirrorWidth)));
      }
    });
    const cathedral = this.map.features.find((f) => f.kind === 'cathedral');
    if (cathedral !== undefined)
      this.pieces.push(...new CathedralExteriorBuilder().build(cathedral.id));
  }

  /**
   * A camp's art without the pieces that stand in a lane tower fort or its clearance
   * (`laneFortKeepOuts`, DEC-315, DEC-318 (BTD4)). The generator moves each camp clear of them
   * (`clearCampOfForts`), so a camp keeps every piece. Only a camp it could not move (a corridor
   * crowded with forts) loses the pieces there; its ground stays.
   */
  private clearOfForts(pieces: readonly MapDecoration[]): readonly MapDecoration[] {
    // ponytail: drops piece by piece, so in a camp that cannot move a stone can lose its blocking
    // foot and keep its face. Only the 5-lane, 2 + 3 tower layout has such a camp. Upgrade path:
    // tag each part (stone, dolmen) in the camp builders and drop a part as one unit.
    return pieces.filter(
      (piece) =>
        piece.layer === 'ground' || !isInLaneFortKeepOut(boundsOf(piece.shape), this.keepOuts),
    );
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
          this.boulder(id, point, size);
          continue;
        }
        const biome = sceneryBiomeAt(point);
        if (biome !== undefined) {
          this.pieces.push(...new MapBiomeVegetationBuilder().build(id, point, size, n, biome));
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

  private boulder(id: string, point: Vec2, size: number): void {
    this.blob(`${id}-boulder-shadow`, point.x + 3, point.y + 4, size, size * 0.65, P.shadow);
    this.blob(`${id}-boulder`, point.x, point.y, size, size * 0.65, P.stoneDark);
    this.blockLastShape();
    this.blob(`${id}-boulder-light`, point.x - 2, point.y - 2, size * 0.6, size * 0.35, P.stone);
  }
}
