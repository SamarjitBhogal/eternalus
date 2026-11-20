import { MINION_INK as INK } from './MinionView.constants';
import type { MinionPalette, MinionPart } from './MinionView.types';
import { MinionPartBuilder } from './MinionPartBuilder';
/** Paints faction-specific helmets, crests and faces (DEC-238). */
export class MinionHeadBuilder extends MinionPartBuilder {
  /** Builds the faction head in local figure coordinates. */
  public build(p: MinionPalette): readonly MinionPart[] {
    this.poly(
      [
        [-0.38, -1.35],
        [0, -1.61],
        [0.38, -1.35],
        [0.33, -0.82],
        [0, -0.69],
        [-0.33, -0.82],
      ],
      INK,
    );
    this.poly(
      [
        [-0.28, -1.29],
        [0, -1.48],
        [0.28, -1.29],
        [0.25, -0.88],
        [0, -0.79],
        [-0.25, -0.88],
      ],
      p.armor,
    );
    this.poly(
      [
        [0, -1.47],
        [0.27, -1.27],
        [0.23, -1.13],
        [0, -1.23],
        [-0.26, -1.14],
        [-0.26, -1.28],
      ],
      p.highlight,
    );
    this.rect(-0.25, -1.12, 0.5, 0.12, INK);
    for (const side of [-1, 1]) this.rect(side * 0.13 - 0.065, -1.095, 0.13, 0.045, p.eyes);
    this.face(p);
    return this.parts;
  }

  private face(p: MinionPalette): void {
    if (p.hasHorns) {
      for (const side of [-1, 1]) {
        this.poly(
          [
            [side * 0.23, -1.34],
            [side * 0.59, -1.6],
            [side * 0.46, -1.16],
          ],
          p.cloth,
        );
        this.poly(
          [
            [side * 0.29, -1.13],
            [side * 0.62, -1.05],
            [side * 0.31, -0.88],
          ],
          p.skin,
        );
      }
      this.poly(
        [
          [-0.2, -0.98],
          [0.2, -0.98],
          [0.16, -0.81],
          [0, -0.74],
          [-0.16, -0.81],
        ],
        p.skin,
      );
      this.rect(-0.15, -0.88, 0.3, 0.045, INK);
    } else {
      this.rect(-0.035, -1.45, 0.07, 0.6, p.trim);
      this.poly(
        [
          [-0.09, -1.48],
          [0.02, -1.86],
          [0.22, -1.68],
          [0.1, -1.42],
        ],
        p.trim,
      );
    }
  }
}
