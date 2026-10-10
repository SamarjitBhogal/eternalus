import type { MapDecoration } from '../content/maps/maps.types';
import { MAP_PALETTE as P } from '../content/maps/map1Scenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';

/** Gives the central cathedral monumental Gothic massing and a stone forecourt. */
export class CathedralExteriorBuilder extends MapDecorationBuilder {
  /** Builds the cathedral around its unchanged capture-point anchor. */
  public build(): readonly MapDecoration[] {
    this.blob('cathedral-forecourt', 800, 485, 115, 110, '#92917b', 'ground');
    this.rect('cathedral-shadow', 763, 351, 87, 223, 'rgba(20,29,26,0.5)');
    this.rect('cathedral-nave', 755, 342, 90, 211, P.stone);
    this.rect('cathedral-transept', 703, 420, 194, 65, P.stone);
    this.blob('cathedral-apse', 800, 344, 44, 26, P.stone);
    this.blob('cathedral-apse-roof', 800, 344, 37, 20, '#536e76');
    this.rect('cathedral-nave-roof', 763, 349, 74, 193, '#536e76');
    this.rect('cathedral-cross-roof', 711, 427, 178, 49, '#66818a');
    this.rect('cathedral-ridge', 798, 349, 4, 192, P.gold);
    for (let i = 0; i < 8; i++) {
      for (const x of [746, 844]) {
        this.rect(
          `cathedral-buttress-${String(x)}-${String(i)}`,
          x,
          355 + i * 23,
          10,
          12,
          '#c0bba6',
        );
        this.rect(
          `cathedral-window-${String(x)}-${String(i)}`,
          x === 746 ? 756 : 839,
          357 + i * 23,
          5,
          8,
          P.gold,
        );
      }
      this.rect(`cathedral-roof-rib-${String(i)}`, 764, 357 + i * 23, 72, 2, '#72848a');
    }
    for (const x of [727, 847]) {
      this.rect(`cathedral-tower-shadow-${String(x)}`, x + 5, 529, 31, 44, P.shadow);
      this.rect(`cathedral-tower-${String(x)}`, x, 522, 28, 43, '#b8b39e');
      this.polygon(
        `cathedral-spire-${String(x)}`,
        [
          { x: x + 14, y: 488 },
          { x: x + 31, y: 538 },
          { x: x - 3, y: 538 },
        ],
        '#435d66',
      );
      this.polygon(
        `cathedral-spire-light-${String(x)}`,
        [
          { x: x + 14, y: 488 },
          { x: x + 14, y: 534 },
          { x: x - 3, y: 538 },
        ],
        '#779096',
      );
      this.rect(`cathedral-spire-finial-${String(x)}`, x + 13, 484, 2, 8, P.gold);
    }
    this.blob('cathedral-crossing-tower', 800, 449, 24, 24, '#b8b39e');
    this.blob('cathedral-crossing-roof', 800, 446, 19, 21, '#435d66');
    this.rect('cathedral-door', 785, 541, 30, 12, P.shadow);
    this.rect('cathedral-door-light', 793, 544, 14, 8, P.gold);
    this.rect('cathedral-north-door', 788, 320, 24, 12, P.shadow);
    this.rect('cathedral-north-door-light', 794, 322, 12, 8, P.gold);
    for (let i = 0; i < 5; i++)
      this.rect(
        `cathedral-north-step-${String(i)}`,
        782 - i * 2,
        315 - i * 4,
        36 + i * 4,
        3,
        '#c2baa1',
      );
    for (let i = 0; i < 5; i++)
      this.rect(
        `cathedral-entry-step-${String(i)}`,
        779 - i * 2,
        554 + i * 4,
        42 + i * 4,
        3,
        '#c2baa1',
      );
    return this.pieces;
  }
}
