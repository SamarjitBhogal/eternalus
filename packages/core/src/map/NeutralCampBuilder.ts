import { NEUTRAL_CAMP_GEOMETRY } from '../content/maps/neutralCampArt';
import type { MapDecoration, MapFeature } from '../content/maps/maps.types';
import { CAMP_MATERIALS as M } from '../content/maps/campScenery';
import { placeLocalArt } from './placeLocalArt';
import { MapDecorationBuilder } from './MapDecorationBuilder';

/** Forest camps are abandoned woodland circles, distinct from the lane and corner shrines. */
export class NeutralCampBuilder extends MapDecorationBuilder {
  /** Builds rooted standing stones, an old dolmen, offerings and a moss-covered clearing. */
  public build(feature: MapFeature, mirrorWidth?: number): readonly MapDecoration[] {
    const id = feature.id;
    this.blob(`${id}-camp-clearing`, ...NEUTRAL_CAMP_GEOMETRY.campClearingBounds, M.dust, 'ground');
    this.blob(`${id}-forest-moss`, ...NEUTRAL_CAMP_GEOMETRY.forestMossBounds, M.moss, 'ground');
    this.beginObject(id, 'camp');
    this.stones(id);
    this.dolmen(id);
    this.offerings(id);
    return placeLocalArt(
      this.pieces.map((piece) => ({ ...piece, replacesFeature: id })),
      feature.position,
      1,
      mirrorWidth !== undefined,
      mirrorWidth,
    );
  }

  private stones(id: string): void {
    for (const [index, x, y, height] of NEUTRAL_CAMP_GEOMETRY.standingStones) {
      const prefix = `${id}-standing-stone-${String(index)}`;
      this.ellipse(`${prefix}-shadow`, ...NEUTRAL_CAMP_GEOMETRY.shadowBounds(x, y), M.shadow);
      this.blockEllipse(`${prefix}-foot`, ...NEUTRAL_CAMP_GEOMETRY.footBounds(x, y), M.face);
      this.polygon(`${prefix}-face`, NEUTRAL_CAMP_GEOMETRY.face(x, y, height), M.stone);
      this.polygon(`${prefix}-facet`, NEUTRAL_CAMP_GEOMETRY.facet(x, y, height), M.face);
      this.rect(`${prefix}-rune`, ...NEUTRAL_CAMP_GEOMETRY.runeBounds(x, y, height), M.rune);
      this.blob(`${prefix}-lichen`, ...NEUTRAL_CAMP_GEOMETRY.lichenBounds(x, y), M.moss);
    }
  }

  private dolmen(id: string): void {
    for (const side of [-1, 1]) {
      this.blockRect(
        `${id}-dolmen-leg-${String(side)}`,
        ...NEUTRAL_CAMP_GEOMETRY.dolmenLegBounds(side),
        M.face,
      );
    }
    this.polygon(`${id}-dolmen-cap`, NEUTRAL_CAMP_GEOMETRY.dolmenCap, M.stone);
    this.ribbon(
      `${id}-dolmen-crack`,
      NEUTRAL_CAMP_GEOMETRY.dolmenCrack,
      NEUTRAL_CAMP_GEOMETRY.dolmenCrackWidth,
      M.crack,
      'detail',
    );
  }

  private offerings(id: string): void {
    this.ellipse(`${id}-offering-bowl`, ...NEUTRAL_CAMP_GEOMETRY.offeringBowlBounds, M.face);
    this.ellipse(`${id}-offering-water`, ...NEUTRAL_CAMP_GEOMETRY.offeringWaterBounds, M.water);
    for (const side of [-1, 1]) {
      this.ribbon(
        `${id}-root-${String(side)}`,
        NEUTRAL_CAMP_GEOMETRY.root(side),
        NEUTRAL_CAMP_GEOMETRY.rootWidth,
        M.wood,
        'detail',
      );
      this.rect(
        `${id}-lantern-post-${String(side)}`,
        ...NEUTRAL_CAMP_GEOMETRY.lanternPostBounds(side),
        M.wood,
      );
      this.ellipse(
        `${id}-lantern-glow-${String(side)}`,
        ...NEUTRAL_CAMP_GEOMETRY.lanternGlowBounds(side),
        M.lanternGlow,
      );
      this.rect(
        `${id}-lantern-cage-${String(side)}`,
        ...NEUTRAL_CAMP_GEOMETRY.lanternCageBounds(side),
        M.iron,
      );
      this.rect(
        `${id}-lantern-light-${String(side)}`,
        ...NEUTRAL_CAMP_GEOMETRY.lanternLightBounds(side),
        M.lanternLight,
      );
    }
    for (let i = 0; i < NEUTRAL_CAMP_GEOMETRY.mushroomCount; i++) {
      const { x, y } = NEUTRAL_CAMP_GEOMETRY.mushroomPosition(i);
      this.rect(
        `${id}-mushroom-stem-${String(i)}`,
        ...NEUTRAL_CAMP_GEOMETRY.mushroomStemBounds(x, y),
        M.edge,
      );
      this.ellipse(
        `${id}-mushroom-cap-${String(i)}`,
        ...NEUTRAL_CAMP_GEOMETRY.mushroomCapBounds(x, y),
        M.bronze,
      );
    }
  }
}
