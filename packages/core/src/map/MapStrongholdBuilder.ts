import type { MapDecoration, MapFeature } from '../content/maps/maps.types';
import { LANDMARK_SETTINGS as S } from '../content/maps/map1Landforms';
import { MAP_PALETTE as P } from '../content/maps/map1Scenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';

/** Encloses each original home-base anchor in a sprawling fortified compound. */
export class MapStrongholdBuilder extends MapDecorationBuilder {
  /**
   * Extends the stronghold inward while keeping its original central keep. The compound is on
   * the ground layer so the generated wall ring, gates and turrets stay visible on top of it.
   */
  public build(feature: MapFeature): readonly MapDecoration[] {
    const isWest = feature.team === 'light';
    const x = isWest ? 32 : 1348;
    const y = feature.position.y - S.strongholdHeight / 2;
    const accent = isWest ? P.light : P.dark;
    const id = feature.id;
    this.rect(
      `${id}-stronghold-shadow`,
      x + 5,
      y + 6,
      S.strongholdWidth,
      S.strongholdHeight,
      P.shadow,
    );
    this.rect(`${id}-stronghold-court`, x, y, S.strongholdWidth, S.strongholdHeight, '#807e68');
    for (const dy of [0, S.strongholdHeight - 10])
      this.rect(`${id}-outer-wall-${String(dy)}`, x, y + dy, S.strongholdWidth, 10, P.stone);
    for (const dx of [0, S.strongholdWidth - 10]) {
      this.rect(`${id}-outer-wall-${String(dx)}-upper`, x + dx, y, 10, 103, P.stone);
      this.rect(`${id}-outer-wall-${String(dx)}-lower`, x + dx, y + 147, 10, 103, P.stone);
      for (const dy of [0, 83, 147, 220]) {
        this.rect(
          `${id}-watchtower-${String(dx)}-${String(dy)}`,
          x + dx - 5,
          y + dy,
          22,
          30,
          P.stone,
        );
        this.rect(
          `${id}-watchtower-roof-${String(dx)}-${String(dy)}`,
          x + dx - 2,
          y + dy + 3,
          16,
          22,
          P.stoneDark,
        );
        this.rect(
          `${id}-watchtower-banner-${String(dx)}-${String(dy)}`,
          x + dx + 3,
          y + dy + 8,
          6,
          9,
          accent,
        );
      }
    }
    for (let i = 0; i < 22; i++) {
      for (const dy of [-3, S.strongholdHeight - 7])
        this.rect(
          `${id}-battlement-${String(i)}-${String(dy)}`,
          x + i * 10,
          y + dy,
          6,
          13,
          '#c2bca4',
        );
    }
    for (const [i, dx, dy, width, height] of [
      [0, 45, 24, 70, 38],
      [1, 132, 24, 60, 38],
      [2, 45, 183, 70, 38],
      [3, 132, 183, 60, 38],
      [4, 95, 75, 65, 34],
      [5, 95, 145, 65, 30],
    ] as const) {
      this.rect(
        `${id}-barracks-${String(i)}-shadow`,
        x + dx + 3,
        y + dy + 4,
        width,
        height,
        P.shadow,
      );
      this.rect(`${id}-barracks-${String(i)}`, x + dx, y + dy, width, height, P.stone);
      this.rect(
        `${id}-barracks-${String(i)}-roof`,
        x + dx + 3,
        y + dy + 3,
        width - 6,
        height - 6,
        isWest ? '#536d70' : '#705563',
      );
      this.rect(
        `${id}-barracks-${String(i)}-ridge`,
        x + dx + 3,
        y + dy + height / 2,
        width - 6,
        2,
        '#b7ab88',
      );
    }
    this.rect(
      `${id}-processional-road`,
      x + 10,
      feature.position.y - 13,
      S.strongholdWidth - 20,
      26,
      P.road,
    );
    this.rect(
      `${id}-gate-bridge`,
      isWest ? x + S.strongholdWidth - 5 : x - 25,
      feature.position.y - 18,
      30,
      36,
      P.stone,
    );
    this.blob(`${id}-fountain-basin`, x + 175, feature.position.y, 14, 11, P.stoneDark);
    this.blob(`${id}-fountain-water`, x + 175, feature.position.y, 10, 7, '#628e87');
    return this.pieces.map((piece) => ({ ...piece, layer: 'ground' }));
  }
}
