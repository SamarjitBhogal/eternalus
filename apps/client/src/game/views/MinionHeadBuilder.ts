import { MINION_HEAD_GEOMETRY } from './MinionHeadBuilder.constants';
import { MINION_INK as INK } from './MinionView.constants';
import type { MinionPalette, MinionPart } from './MinionView.types';
import { MinionPartBuilder } from './MinionPartBuilder';
/** Paints faction-specific helmets, crests and faces (DEC-238). */
export class MinionHeadBuilder extends MinionPartBuilder {
  /** Builds the faction head in local figure coordinates. */
  public build(p: MinionPalette): readonly MinionPart[] {
    this.poly(MINION_HEAD_GEOMETRY.helmetOutline, INK);
    this.poly(MINION_HEAD_GEOMETRY.helmetPlate, p.armor);
    this.poly(MINION_HEAD_GEOMETRY.browCrest, p.highlight);
    this.rect(...MINION_HEAD_GEOMETRY.eyeSlitBounds, INK);
    for (const side of [-1, 1]) this.rect(...MINION_HEAD_GEOMETRY.eyeBounds(side), p.eyes);
    this.face(p);
    return this.parts;
  }

  private face(p: MinionPalette): void {
    if (p.hasHorns) {
      for (const side of [-1, 1]) {
        this.poly(MINION_HEAD_GEOMETRY.horn(side), p.cloth);
        this.poly(MINION_HEAD_GEOMETRY.ear(side), p.skin);
      }
      this.poly(MINION_HEAD_GEOMETRY.face, p.skin);
      this.rect(...MINION_HEAD_GEOMETRY.faceMouthBounds, INK);
    } else {
      this.rect(...MINION_HEAD_GEOMETRY.helmetStripeBounds, p.trim);
      this.poly(MINION_HEAD_GEOMETRY.helmetPlume, p.trim);
    }
  }
}
