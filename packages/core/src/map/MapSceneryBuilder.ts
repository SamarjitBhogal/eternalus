import type { MapDecoration, MapDefinition } from '../content/maps/maps.types';
import {
  CAMP_POSITIONS,
  MAP_PALETTE as P,
  SCENERY_SETTINGS as S,
} from '../content/maps/map1Scenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import { MapFortificationBuilder } from './MapFortificationBuilder';
import { MapLandscapeBuilder } from './MapLandscapeBuilder';
import { MapMountainBuilder } from './MapMountainBuilder';
import { MapStrongholdBuilder } from './MapStrongholdBuilder';
import { MapStrongholdGatesBuilder } from './MapStrongholdGatesBuilder';
import { MapVillageBuilder } from './MapVillageBuilder';
import { CathedralExteriorBuilder } from './CathedralExteriorBuilder';
import { LAKES, LAVA_RIVERS } from '../content/maps/map1Landforms';
import type { Polygon, Vec2 } from '../utils/geometry.types';

/** Builds repeatable visual scenery without randomness, collision or simulation state. */
export class MapSceneryBuilder extends MapDecorationBuilder {
  /** Uses original sketch coordinates so scaling never changes the layout's proportions. */
  public constructor(private readonly map: MapDefinition) {
    super();
  }

  /** Returns the landscape, forests, settlement, camps and dressed feature footprints. */
  public build(): readonly MapDecoration[] {
    this.pieces.push(...new MapLandscapeBuilder(this.map, (point) => this.isClear(point)).build());
    this.forest();
    this.pieces.push(...new MapMountainBuilder().build());
    this.pieces.push(...new MapVillageBuilder(this.map).build());
    CAMP_POSITIONS.forEach((point, index) => {
      this.camp(point, `camp-${String(index)}`);
    });
    this.map.features.forEach((feature) => {
      if (feature.kind === 'capital') {
        this.pieces.push(...new MapStrongholdBuilder().build(feature));
        this.pieces.push(
          ...new MapStrongholdGatesBuilder().build(
            feature.owner === 'light' ? 142 : 1458,
            feature.id,
            this.map.lanes,
          ),
        );
      }
      if (feature.kind !== 'cathedral' && feature.kind !== 'capital')
        this.pieces.push(...new MapFortificationBuilder().build(feature));
    });
    this.pieces.push(...new CathedralExteriorBuilder().build());

    return this.pieces;
  }

  private variation(x: number, y: number): number {
    return (Math.imul(x + 17, 73856093) ^ Math.imul(y + 29, 19349663)) >>> 0;
  }

  private isClear(point: Vec2): boolean {
    if (
      LAVA_RIVERS.some((path) =>
        path.some((end, index) => {
          const start = path[index - 1];
          return start !== undefined && this.distanceToSegment(point, start, end) < 46;
        }),
      )
    )
      return false;
    if (((point.x - 800) / 270) ** 2 + ((point.y - 450) / 210) ** 2 < 1) return false;
    if (point.x < 280 || point.x > 1320) return false;
    if (
      LAKES.some(
        (lake) =>
          ((point.x - lake.x) / (lake.rx + 15)) ** 2 + ((point.y - lake.y) / (lake.ry + 15)) ** 2 <
          1,
      )
    )
      return false;
    if (
      this.map.features.some(
        (feature) =>
          Math.hypot(point.x - feature.position.x, point.y - feature.position.y) <
          S.featureClearance,
      )
    )
      return false;
    if (
      CAMP_POSITIONS.some(
        (camp) => Math.hypot(point.x - camp.x, point.y - camp.y) < S.campClearance,
      )
    )
      return false;
    if (this.map.terrain.some((terrain) => this.contains(terrain.shape, point))) return false;
    return !this.map.lanes.some((lane) =>
      lane.path.some((end, index) => {
        const start = lane.path[index - 1];
        if (start === undefined) return false;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const t = Math.max(
          0,
          Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)),
        );
        return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy) < S.laneClearance;
      }),
    );
  }

  private contains(shape: Polygon, point: Vec2): boolean {
    let inside = false;
    shape.forEach((a, index) => {
      const b = shape[(index + shape.length - 1) % shape.length];
      if (
        b !== undefined &&
        a.y > point.y !== b.y > point.y &&
        point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      )
        inside = !inside;
    });
    return inside;
  }

  private distanceToSegment(point: Vec2, start: Vec2, end: Vec2): number {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const t = Math.max(
      0,
      Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)),
    );
    return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy);
  }

  private forest(): void {
    for (let y: number = S.margin; y < this.map.height - S.margin; y += S.gridStep) {
      for (let x: number = S.margin; x < this.map.width - S.margin; x += S.gridStep) {
        const n = this.variation(x, y);
        const point = { x: x + (n % 17) - 8, y: y + ((n >>> 4) % 17) - 8 };
        if (!this.isClear(point) || n % 5 === 0) continue;
        const id = `tree-${String(x)}-${String(y)}`;
        const size = 8 + (n % 10);
        if (n % 7 === 0) {
          this.blob(`${id}-boulder-shadow`, point.x + 3, point.y + 4, size, size * 0.65, P.shadow);
          this.blob(`${id}-boulder`, point.x, point.y, size, size * 0.65, P.stoneDark);
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
          this.rect(`${id}-trunk`, point.x - 1, point.y, 3, 10, P.bark);
          this.blob(
            `${id}-canopy`,
            point.x,
            point.y - 5,
            size,
            size * 0.85,
            n % 4 === 0 ? '#797847' : P.pine,
          );
          this.blob(
            `${id}-canopy-light`,
            point.x - 3,
            point.y - 8,
            size * 0.65,
            size * 0.6,
            n % 4 === 0 ? '#a09a62' : P.pineLight,
          );
          continue;
        }
        this.rect(`${id}-shadow`, point.x - 3, point.y + 3, size + 4, 5, P.shadow);
        this.rect(`${id}-trunk`, point.x - 1, point.y, 3, 9, P.bark);
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
    this.rect(`${id}-clearing`, point.x - 23, point.y - 18, 46, 36, P.road, 'ground');
    for (const side of [-1, 1]) {
      const x = point.x + side * 15;
      this.polygon(
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
    this.rect(`${id}-fire-stone`, point.x - 4, point.y - 4, 8, 8, P.stoneDark);
    this.rect(`${id}-fire`, point.x - 2, point.y - 2, 4, 4, P.lavaLight);
    this.rect(`${id}-supplies`, point.x - 7, point.y + 12, 7, 5, P.bark);
  }
}
