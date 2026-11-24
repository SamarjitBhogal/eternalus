import { MINION_FIGURE_GEOMETRY } from './MinionFigureBuilder.constants';
import { MinionPartBuilder } from './MinionPartBuilder';
import { MinionHeadBuilder } from './MinionHeadBuilder';
import { MINION_INK as INK, MINION_PROPORTIONS } from './MinionView.constants';
import type { MinionPalette, MinionPart, MinionWeight } from './MinionView.types';

/** Assembles cached fantasy figures; each weapon silhouette has its own painter strategy. */
export class MinionFigureBuilder extends MinionPartBuilder {
  private readonly weapons: Readonly<Record<MinionWeight, (palette: MinionPalette) => void>> = {
    light: (palette) => {
      this.daggers(palette);
    },
    medium: (palette) => {
      this.swordAndShield(palette);
    },
    heavy: (palette) => {
      this.maul(palette);
    },
  };

  /** Returns a figure in units of its snapshot radius, independent of position and camera. */
  public build(weight: MinionWeight, p: MinionPalette): readonly MinionPart[] {
    const { width: w, shoulder: s } = MINION_PROPORTIONS[weight];
    this.poly(MINION_FIGURE_GEOMETRY.bodyOutline(w), INK);
    this.poly(MINION_FIGURE_GEOMETRY.bodyPlate(w), p.cloth);
    this.limbs(w, s, p);
    this.chest(w, p);
    this.parts.push(...new MinionHeadBuilder().build(p));
    this.weapons[weight](p);
    return this.parts;
  }

  private limbs(w: number, s: number, p: MinionPalette): void {
    for (const side of [-1, 1]) {
      const x = side * w * MINION_FIGURE_GEOMETRY.legOffsetRatio;
      this.rect(...MINION_FIGURE_GEOMETRY.shinOutlineBounds(x), INK);
      this.rect(...MINION_FIGURE_GEOMETRY.shinPlateBounds(x), p.armor);
      this.rect(...MINION_FIGURE_GEOMETRY.footBounds(x), p.highlight);
      this.poly(MINION_FIGURE_GEOMETRY.shoulderOutline(side, w, s), INK);
      this.poly(MINION_FIGURE_GEOMETRY.shoulderPlate(side, w, s), p.armor);
      this.rect(...MINION_FIGURE_GEOMETRY.shoulderTrimBounds(side, s), p.trim);
    }
  }

  private chest(w: number, p: MinionPalette): void {
    this.poly(MINION_FIGURE_GEOMETRY.breastplateOutline(w), INK);
    this.poly(MINION_FIGURE_GEOMETRY.breastplateInset(w), p.armor);
    this.poly(MINION_FIGURE_GEOMETRY.chestTrim(w), p.highlight);
    this.poly(MINION_FIGURE_GEOMETRY.chestGem, p.trim);
    this.rect(...MINION_FIGURE_GEOMETRY.beltBounds(w), p.cloth);
    this.rect(...MINION_FIGURE_GEOMETRY.buckleBounds, p.highlight);
  }

  private daggers(p: MinionPalette): void {
    for (const side of [-1, 1]) {
      this.poly(MINION_FIGURE_GEOMETRY.armOutline(side), INK);
      this.poly(MINION_FIGURE_GEOMETRY.armPlate(side), p.highlight);
      this.rect(...MINION_FIGURE_GEOMETRY.daggerHandBounds(side), p.skin);
    }
    this.poly(MINION_FIGURE_GEOMETRY.helmetCrest, p.cloth);
    this.poly(MINION_FIGURE_GEOMETRY.swordArm, p.cloth);
  }

  private swordAndShield(p: MinionPalette): void {
    this.poly(MINION_FIGURE_GEOMETRY.swordBlade, INK);
    this.poly(MINION_FIGURE_GEOMETRY.swordEdge, p.highlight);
    this.rect(...MINION_FIGURE_GEOMETRY.swordGuardBounds, p.trim);
    this.rect(...MINION_FIGURE_GEOMETRY.swordGripBounds, p.cloth);
    this.poly(MINION_FIGURE_GEOMETRY.shieldOutline, INK);
    this.poly(MINION_FIGURE_GEOMETRY.shieldPlate, p.trim);
    this.poly(MINION_FIGURE_GEOMETRY.shieldInset, p.cloth);
    this.rect(...MINION_FIGURE_GEOMETRY.shieldVerticalInlayBounds, p.highlight);
    this.rect(...MINION_FIGURE_GEOMETRY.shieldCrossInlayBounds, p.highlight);
  }

  private maul(p: MinionPalette): void {
    for (const side of [-1, 1]) {
      this.poly(MINION_FIGURE_GEOMETRY.daggerTip(side), p.highlight);
      this.rect(...MINION_FIGURE_GEOMETRY.fistOutlineBounds(side), INK);
      this.rect(...MINION_FIGURE_GEOMETRY.fistPlateBounds(side), p.armor);
    }
    this.rect(...MINION_FIGURE_GEOMETRY.maulHandleOutlineBounds, INK);
    this.rect(...MINION_FIGURE_GEOMETRY.maulHandleBounds, p.cloth);
    this.poly(MINION_FIGURE_GEOMETRY.maulHead, INK);
    this.rect(...MINION_FIGURE_GEOMETRY.maulFaceBounds, p.armor);
    this.rect(...MINION_FIGURE_GEOMETRY.maulHighlightBounds, p.highlight);
    this.rect(...MINION_FIGURE_GEOMETRY.maulBandBounds, p.trim);
  }
}
