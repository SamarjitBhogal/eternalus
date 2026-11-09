import type { MapDecoration, MapFeature } from '../content/maps/maps.types';
import { CAMP_MATERIALS as M } from '../content/maps/campScenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';

/** Forest camps are abandoned woodland circles, distinct from the lane and corner shrines. */
export class NeutralCampBuilder extends MapDecorationBuilder {
  /** Builds rooted standing stones, an old dolmen, offerings and a moss-covered clearing. */
  public build(feature: MapFeature, mirrorWidth?: number): readonly MapDecoration[] {
    const id = feature.id;
    this.blob(`${id}-camp-clearing`, 0, 0, 27, 20, M.dust, 'ground');
    this.blob(`${id}-forest-moss`, -2, 0, 24, 17, M.moss, 'ground');
    this.beginObject(id, 'camp');
    for (const [index, x, y, height] of [
      [0, -19, -3, 18],
      [1, 17, -5, 22],
      [2, -9, 12, 9],
      [3, 15, 11, 8],
    ]) {
      if (index === undefined || x === undefined || y === undefined || height === undefined)
        continue;
      const prefix = `${id}-standing-stone-${String(index)}`;
      this.ellipse(`${prefix}-shadow`, x + 2, y + 2, 6, 3, M.shadow);
      this.blockEllipse(`${prefix}-foot`, x, y, 4, 2.5, M.face);
      this.polygon(
        `${prefix}-face`,
        [
          { x: x - 3, y },
          { x: x - 4, y: y - height + 4 },
          { x, y: y - height },
          { x: x + 4, y: y - height + 3 },
          { x: x + 5, y },
        ],
        M.stone,
      );
      this.polygon(
        `${prefix}-facet`,
        [
          { x, y: y - height },
          { x: x + 4, y: y - height + 3 },
          { x: x + 5, y },
          { x: x + 1, y },
        ],
        M.face,
      );
      this.rect(`${prefix}-rune`, x - 0.5, y - height + 6, 1, 5, '#9da77a');
      this.blob(`${prefix}-lichen`, x - 2, y - 2, 3, 2, M.moss);
    }
    for (const side of [-1, 1]) {
      this.blockRect(`${id}-dolmen-leg-${String(side)}`, side * 7 - 2, -10, 4, 5, M.face);
    }
    this.polygon(
      `${id}-dolmen-cap`,
      [
        { x: -12, y: -16 },
        { x: 8, y: -18 },
        { x: 13, y: -13 },
        { x: 10, y: -10 },
        { x: -11, y: -10 },
      ],
      M.stone,
    );
    this.ribbon(
      `${id}-dolmen-crack`,
      [
        { x: -3, y: -16 },
        { x: -1, y: -13 },
        { x: -4, y: -10 },
      ],
      0.7,
      M.crack,
      'detail',
    );
    this.ellipse(`${id}-offering-bowl`, 0, 2, 6, 3, M.face);
    this.ellipse(`${id}-offering-water`, 0, 1, 4, 1.5, '#718b79');
    for (const side of [-1, 1]) {
      this.ribbon(
        `${id}-root-${String(side)}`,
        [
          { x: side * 24, y: -9 },
          { x: side * 16, y: 0 },
          { x: side * 12, y: 7 },
          { x: side * 4, y: 12 },
        ],
        1.5,
        M.wood,
        'detail',
      );
      this.rect(`${id}-lantern-post-${String(side)}`, side * 23, -11, 0.8, 13, M.wood);
      this.ellipse(
        `${id}-lantern-glow-${String(side)}`,
        side * 23,
        -11,
        4,
        5,
        'rgba(190,207,139,0.10)',
      );
      this.rect(`${id}-lantern-cage-${String(side)}`, side * 23 - 1.5, -13, 3, 4, M.iron);
      this.rect(`${id}-lantern-light-${String(side)}`, side * 23 - 0.6, -12, 1.2, 2, '#c5d39b');
    }
    for (let i = 0; i < 9; i++) {
      const x = -20 + i * 5;
      const y = 15 + (i % 3);
      this.rect(`${id}-mushroom-stem-${String(i)}`, x, y, 0.6, 2, M.edge);
      this.ellipse(`${id}-mushroom-cap-${String(i)}`, x + 0.3, y, 1.3, 0.8, M.bronze);
    }
    return this.pieces.map((piece) => ({
      ...piece,
      replacesFeature: id,
      shape: piece.shape.map((point) => ({
        x:
          mirrorWidth === undefined
            ? feature.position.x + point.x
            : mirrorWidth - (mirrorWidth - feature.position.x + point.x),
        y: feature.position.y + point.y,
      })),
    }));
  }
}
