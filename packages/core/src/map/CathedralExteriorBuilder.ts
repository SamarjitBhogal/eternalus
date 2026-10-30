import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import type { MapDecoration } from '../content/maps/maps.types';
import { MAP_PALETTE as P } from '../content/maps/map1Scenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';

/** Gives the central cathedral monumental Gothic massing and a stone forecourt. */
export class CathedralExteriorBuilder extends MapDecorationBuilder {
  /** Builds the cathedral around its unchanged capture-point anchor. */
  public build(buildingId: string): readonly MapDecoration[] {
    this.buildingId = buildingId;
    this.blob('cathedral-forecourt', 800, 485, 115, 110, P.cathedralForecourt, 'ground');
    this.rect('cathedral-shadow', 763, 351, 87, 223, P.cathedralShadow);
    this.visibility = 'roof';
    const { nave, transept, apse } = G.cathedral;
    this.rect('cathedral-nave', nave.x, nave.y, nave.width, nave.height, P.stone);
    this.rect(
      'cathedral-transept',
      transept.x,
      transept.y,
      transept.width,
      transept.height,
      P.stone,
    );
    this.blob('cathedral-apse', apse.x, apse.y, apse.radiusX, apse.radiusY, P.stone);
    this.blob('cathedral-apse-roof', 800, 344, 37, 20, P.cathedralRoof);
    this.rect('cathedral-nave-roof', 763, 349, 74, 193, P.cathedralRoof);
    this.rect('cathedral-cross-roof', 711, 427, 178, 49, P.cathedralCrossRoof);
    this.rect('cathedral-ridge', 798, 349, 4, 192, P.gold);
    for (let i = 0; i < 8; i++) {
      for (const x of [746, 844]) {
        this.visibility = undefined;
        this.rect(
          `cathedral-buttress-${String(x)}-${String(i)}`,
          x,
          355 + i * 23,
          10,
          12,
          P.buttressStone,
        );
        this.visibility = 'roof';
        this.rect(
          `cathedral-window-${String(x)}-${String(i)}`,
          x === 746 ? 756 : 839,
          357 + i * 23,
          5,
          8,
          P.gold,
        );
      }
      this.rect(`cathedral-roof-rib-${String(i)}`, 764, 357 + i * 23, 72, 2, P.cathedralRib);
    }
    for (const x of [727, 847]) {
      this.rect(`cathedral-tower-shadow-${String(x)}`, x + 5, 529, 31, 44, P.shadow);
      this.rect(`cathedral-tower-${String(x)}`, x, 522, 28, 43, P.cathedralTower);
      this.polygon(
        `cathedral-spire-${String(x)}`,
        [
          { x: x + 14, y: 488 },
          { x: x + 31, y: 538 },
          { x: x - 3, y: 538 },
        ],
        P.cathedralSpire,
      );
      this.polygon(
        `cathedral-spire-light-${String(x)}`,
        [
          { x: x + 14, y: 488 },
          { x: x + 14, y: 534 },
          { x: x - 3, y: 538 },
        ],
        P.spireLight,
      );
      this.rect(`cathedral-spire-finial-${String(x)}`, x + 13, 484, 2, 8, P.gold);
    }
    this.blob('cathedral-crossing-tower', 800, 449, 24, 24, P.cathedralTower);
    this.blob('cathedral-crossing-roof', 800, 446, 19, 21, P.cathedralSpire);
    this.rect(
      'cathedral-door',
      G.southDoor.x,
      G.southDoor.y,
      G.southDoor.width,
      G.southDoor.height,
      P.shadow,
    );
    this.rect('cathedral-door-light', 793, 544, 14, 8, P.gold);
    this.rect(
      'cathedral-north-door',
      G.northDoor.x,
      G.northDoor.y,
      G.northDoor.width,
      G.northDoor.height,
      P.shadow,
    );
    this.rect('cathedral-north-door-light', 794, 322, 12, 8, P.gold);
    this.visibility = undefined;
    for (let i = 0; i < 5; i++)
      this.rect(
        `cathedral-north-step-${String(i)}`,
        782 - i * 2,
        315 - i * 4,
        36 + i * 4,
        3,
        P.entryStep,
      );
    for (let i = 0; i < 5; i++)
      this.rect(
        `cathedral-entry-step-${String(i)}`,
        779 - i * 2,
        554 + i * 4,
        42 + i * 4,
        3,
        P.entryStep,
      );
    return this.pieces;
  }
}
