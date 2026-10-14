import type { MapDecoration, MapDefinition } from '../content/maps/maps.types';
import { SeededRandom } from '../utils/SeededRandom';
import { RANDOM_SCENERY_SETTINGS as S } from '../content/maps/map1Scenery';
import { MAP_PALETTE as P } from '../content/maps/map1Scenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';
/** Arranges village clusters around winding streets and the cathedral precinct. */
export class MapVillageBuilder extends MapDecorationBuilder {
  /** Receives the original landmarks so housing leaves their footprints clear. */
  public constructor(private readonly map: MapDefinition) {
    super();
  }
  /** Creates an irregular settlement rather than a rectangular housing grid. */
  public build(): readonly MapDecoration[] {
    const rng = new SeededRandom(this.map.seed).fork('scenery-houses');
    this.blob('city-market-ground', 800, 606, 76, 32, P.road, 'ground');
    for (const side of [-1]) {
      const path = [
        { x: 800, y: 605 },
        { x: 800 + side * 105, y: 594 },
        { x: 800 + side * 139, y: 530 },
        { x: 800 + side * 155, y: 452 },
        { x: 800 + side * 128, y: 371 },
        { x: 800 + side * 85, y: 301 },
        { x: 800, y: 290 },
      ];
      this.ribbon(`village-street-${String(side)}-verge`, path, 24, 'rgba(148,136,105,0.32)');
      this.ribbon(`village-street-${String(side)}`, path, 12, P.road);
      for (let i = 0; i < 18; i++) {
        const t = i / 17;
        const y = 302 + t * 306;
        const bend = 87 + 62 * (1 - (2 * t - 1) ** 2);
        const outward = i % 3 === 0 ? 39 : 19;
        this.house(
          `village-${String(side)}-${String(i)}`,
          800 + side * (bend + outward) + (rng.nextFloat() * 2 - 1) * S.houseWander,
          y + rng.nextFloat() * S.houseWander,
          14 + (i % 8),
          18 + (i % 11),
          i,
        );
      }
      for (let i = 0; i < 8; i++)
        this.house(
          `village-outskirts-${String(side)}-${String(i)}`,
          800 + side * (200 + (i % 3) * 22) + (rng.nextFloat() * 2 - 1) * S.houseWander,
          350 + i * 32 + rng.nextFloat() * S.houseWander,
          12 + (i % 5),
          16 + (i % 7),
          i + 1,
        );
    }
    for (let i = 0; i < 8; i++) {
      this.rect(`market-stall-${String(i)}`, 730 + i * 19, 606 + (i % 3) * 5, 12, 8, P.bark);
      this.rect(
        `market-awning-${String(i)}`,
        728 + i * 19,
        602 + (i % 3) * 5,
        16,
        6,
        i % 2 === 0 ? P.gold : P.light,
      );
    }
    this.blob('village-well-base', 804, 612, 10, 8, P.stone);
    this.blob('village-well-water', 804, 611, 6, 4, '#416e73');
    return this.pieces;
  }
  private house(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    variation: number,
  ): void {
    if (
      this.map.features.some(
        (feature) => Math.hypot(feature.position.x - x, feature.position.y - y) < 38,
      )
    )
      return;
    this.rect(`${id}-yard`, x - 5, y - 4, width + 10, height + 9, 'rgba(141,135,98,0.3)', 'ground');
    this.rect(`${id}-shadow`, x + 4, y + 5, width, height, 'rgba(27,36,29,0.5)');
    this.rect(`${id}-wall`, x, y, width, height, P.stone);
    this.polygon(
      `${id}-roof`,
      [
        { x: x - 2, y: y + 2 },
        { x: x + width / 2, y: y - 4 },
        { x: x + width + 2, y: y + 2 },
        { x: x + width + 2, y: y + height - 3 },
        { x: x + width / 2, y: y + height + 2 },
        { x: x - 2, y: y + height - 3 },
      ],
      variation % 3 === 0 ? '#786f58' : P.roof,
    );
    this.rect(
      `${id}-roof-light`,
      x + 1,
      y + 3,
      width / 2 - 1,
      height - 5,
      variation % 3 === 0 ? '#999173' : P.roofLight,
    );
    this.rect(`${id}-ridge`, x + width / 2, y - 3, 2, height + 4, '#3f453b');
    this.rect(`${id}-chimney`, x + width - 6, y + 2, 4, 6, P.stoneDark);
    this.rect(`${id}-door`, x + width / 2 - 2, y + height - 2, 4, 4, P.shadow);
  }
}
