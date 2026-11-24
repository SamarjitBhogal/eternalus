import { TOWER_SANCTUM_GEOMETRY } from '../content/maps/towerSanctumArt';
import type { MapDecoration } from '../content/maps/maps.types';
import { CAMP_CRYSTALS, CAMP_MATERIALS as M } from '../content/maps/campScenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';

/** Code-drawn, top-down crystal sanctums inspired by the supplied faction tower references. */
export class TowerSanctumBuilder extends MapDecorationBuilder {
  /** Adds cosmetic masonry only; the existing fort remains the collision authority. */
  public build(id: string, isDark: boolean): readonly MapDecoration[] {
    this.beginObject(id, 'fort');
    const stone = isDark ? M.iron : M.light;
    const trim = isDark ? M.bronze : M.bronzeLight;
    const crystal = CAMP_CRYSTALS[isDark ? 'dark' : 'light'];
    this.rect(`${id}-sanctum-shadow`, ...TOWER_SANCTUM_GEOMETRY.sanctumShadowBounds, M.shadow);
    this.rect(`${id}-sanctum-plinth`, ...TOWER_SANCTUM_GEOMETRY.sanctumPlinthBounds, M.face);
    this.rect(`${id}-sanctum-outer-inlay`, ...TOWER_SANCTUM_GEOMETRY.sanctumOuterInlayBounds, trim);
    this.rect(`${id}-sanctum-floor`, ...TOWER_SANCTUM_GEOMETRY.sanctumFloorBounds, stone);
    this.rect(`${id}-sanctum-inner-inlay`, ...TOWER_SANCTUM_GEOMETRY.sanctumInnerInlayBounds, trim);
    this.rect(`${id}-sanctum-recess`, ...TOWER_SANCTUM_GEOMETRY.sanctumRecessBounds, M.face);
    for (let step = 0; step < TOWER_SANCTUM_GEOMETRY.stairCount; step++) {
      const width = TOWER_SANCTUM_GEOMETRY.stairWidth(step);
      this.rect(
        `${id}-sanctum-stair-${String(step)}`,
        ...TOWER_SANCTUM_GEOMETRY.sanctumStairBounds(width, step),
        stone,
      );
      this.rect(
        `${id}-sanctum-stair-edge-${String(step)}`,
        ...TOWER_SANCTUM_GEOMETRY.sanctumStairEdgeBounds(width, step),
        trim,
      );
    }
    for (const side of [-1, 1]) {
      this.pillar(id, side, stone, trim);
      for (let feather = 0; feather < TOWER_SANCTUM_GEOMETRY.featherCount; feather++) {
        const { x, y } = TOWER_SANCTUM_GEOMETRY.featherPosition(side, feather);
        this.polygon(
          `${id}-sanctum-wing-${String(side)}-${String(feather)}`,
          TOWER_SANCTUM_GEOMETRY.sanctumWing(side, x, y),
          feather % 2 === 0 ? trim : stone,
        );
      }
    }
    this.ellipse(`${id}-sanctum-orbit`, ...TOWER_SANCTUM_GEOMETRY.sanctumOrbitBounds, trim);
    this.ellipse(
      `${id}-sanctum-orbit-inset`,
      ...TOWER_SANCTUM_GEOMETRY.sanctumOrbitInsetBounds,
      M.iron,
    );
    this.ellipse(
      `${id}-sanctum-aether`,
      ...TOWER_SANCTUM_GEOMETRY.sanctumAetherBounds,
      crystal.glow,
    );
    for (const side of [-1, 1]) {
      this.polygon(
        `${id}-sanctum-floating-shard-${String(side)}`,
        TOWER_SANCTUM_GEOMETRY.sanctumFloatingShard(side),
        crystal.crystal,
      );
    }
    return this.pieces;
  }

  private pillar(id: string, side: number, stone: string, trim: string): void {
    const x = side * TOWER_SANCTUM_GEOMETRY.pillarSideOffset;
    const prefix = `${id}-sanctum-pillar-${String(side)}`;
    this.rect(`${prefix}-shadow`, ...TOWER_SANCTUM_GEOMETRY.shadowBounds(x), M.crack);
    this.rect(`${prefix}-shaft`, ...TOWER_SANCTUM_GEOMETRY.shaftBounds(x), stone);
    this.rect(`${prefix}-flute`, ...TOWER_SANCTUM_GEOMETRY.fluteBounds(x), trim);
    for (const y of TOWER_SANCTUM_GEOMETRY.pillarCapitalHeights)
      this.rect(
        `${prefix}-capital-${String(y)}`,
        ...TOWER_SANCTUM_GEOMETRY.capitalBounds(x, y),
        trim,
      );
    for (let course = 0; course < TOWER_SANCTUM_GEOMETRY.pillarCourseCount; course++)
      this.rect(
        `${prefix}-course-${String(course)}`,
        ...TOWER_SANCTUM_GEOMETRY.courseBounds(x, course),
        M.face,
      );
  }
}
