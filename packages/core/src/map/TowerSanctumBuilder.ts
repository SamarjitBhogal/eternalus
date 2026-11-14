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
    this.rect(`${id}-sanctum-shadow`, -30, -30, 64, 58, M.shadow);
    this.rect(`${id}-sanctum-plinth`, -32, -35, 64, 59, M.face);
    this.rect(`${id}-sanctum-outer-inlay`, -30, -33, 60, 55, trim);
    this.rect(`${id}-sanctum-floor`, -28, -31, 56, 51, stone);
    this.rect(`${id}-sanctum-inner-inlay`, -23, -26, 46, 41, trim);
    this.rect(`${id}-sanctum-recess`, -21, -24, 42, 37, M.face);
    for (let step = 0; step < 4; step++) {
      const width = 21 + step * 3;
      this.rect(`${id}-sanctum-stair-${String(step)}`, -width / 2, 16 + step * 3, width, 3, stone);
      this.rect(
        `${id}-sanctum-stair-edge-${String(step)}`,
        -width / 2,
        16 + step * 3,
        width,
        0.6,
        trim,
      );
    }
    for (const side of [-1, 1]) {
      this.pillar(id, side, stone, trim);
      for (let feather = 0; feather < 5; feather++) {
        const x = side * (8 + feather * 3.3);
        const y = -9 - feather * 2.2;
        this.polygon(
          `${id}-sanctum-wing-${String(side)}-${String(feather)}`,
          [
            { x: side * 5, y: -5 },
            { x, y: y - 8 },
            { x: x + side * 2.4, y: y - 3 },
            { x: side * 9, y: -1 },
          ],
          feather % 2 === 0 ? trim : stone,
        );
      }
    }
    this.ellipse(`${id}-sanctum-orbit`, 0, -8, 14, 12, trim);
    this.ellipse(`${id}-sanctum-orbit-inset`, 0, -8, 12.5, 10.5, M.iron);
    this.ellipse(`${id}-sanctum-aether`, 0, -8, 10, 8, crystal.glow);
    for (const side of [-1, 1]) {
      this.polygon(
        `${id}-sanctum-floating-shard-${String(side)}`,
        [
          { x: side * 17, y: -14 },
          { x: side * 20, y: -9 },
          { x: side * 17, y: -4 },
          { x: side * 15, y: -9 },
        ],
        crystal.crystal,
      );
    }
    return this.pieces;
  }

  private pillar(id: string, side: number, stone: string, trim: string): void {
    const x = side * 26;
    const prefix = `${id}-sanctum-pillar-${String(side)}`;
    this.rect(`${prefix}-shadow`, x - 4, -29, 10, 38, M.crack);
    this.rect(`${prefix}-shaft`, x - 4, -32, 8, 36, stone);
    this.rect(`${prefix}-flute`, x - 1, -28, 2, 28, trim);
    for (const y of [-34, 2]) this.rect(`${prefix}-capital-${String(y)}`, x - 6, y, 12, 4, trim);
    for (let course = 0; course < 5; course++)
      this.rect(`${prefix}-course-${String(course)}`, x - 4, -25 + course * 6, 8, 0.6, M.face);
  }
}
