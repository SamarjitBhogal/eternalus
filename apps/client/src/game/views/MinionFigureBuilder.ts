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
    this.poly(
      [
        [-w, -0.7],
        [w, -0.7],
        [w + 0.16, 0.57],
        [0.08, 0.4],
        [-0.2, 0.67],
        [-w - 0.15, 0.5],
      ],
      INK,
    );
    this.poly(
      [
        [-w + 0.08, -0.62],
        [w - 0.08, -0.62],
        [w, 0.43],
        [0.05, 0.26],
        [-0.2, 0.5],
        [-w, 0.4],
      ],
      p.cloth,
    );
    this.limbs(w, s, p);
    this.chest(w, p);
    this.parts.push(...new MinionHeadBuilder().build(p));
    this.weapons[weight](p);
    return this.parts;
  }

  private limbs(w: number, s: number, p: MinionPalette): void {
    for (const side of [-1, 1]) {
      const x = side * w * 0.55;
      this.rect(x - 0.18, 0.1, 0.36, 0.66, INK);
      this.rect(x - 0.12, 0.14, 0.24, 0.4, p.armor);
      this.rect(x - 0.15, 0.6, 0.33, 0.13, p.highlight);
      this.poly(
        [
          [side * w * 0.7, -0.89],
          [side * s, -0.91],
          [side * (s + 0.1), -0.47],
          [side * w, -0.25],
        ],
        INK,
      );
      this.poly(
        [
          [side * w * 0.72, -0.8],
          [side * (s - 0.07), -0.82],
          [side * s, -0.51],
          [side * w, -0.4],
        ],
        p.armor,
      );
      this.rect(side * (s - 0.12) - 0.07, -0.65, 0.14, 0.07, p.trim);
    }
  }

  private chest(w: number, p: MinionPalette): void {
    this.poly(
      [
        [-w, -0.78],
        [0, -0.94],
        [w, -0.78],
        [w * 0.77, 0.13],
        [-w * 0.77, 0.13],
      ],
      INK,
    );
    this.poly(
      [
        [-w + 0.08, -0.68],
        [0, -0.83],
        [w - 0.08, -0.68],
        [w * 0.65, 0.03],
        [-w * 0.65, 0.03],
      ],
      p.armor,
    );
    this.poly(
      [
        [-w + 0.12, -0.65],
        [0, -0.79],
        [w - 0.12, -0.65],
        [0, -0.37],
      ],
      p.highlight,
    );
    this.poly(
      [
        [0, -0.67],
        [0.12, -0.47],
        [0, -0.22],
        [-0.12, -0.47],
      ],
      p.trim,
    );
    this.rect(-w * 0.8, 0.02, w * 1.6, 0.13, p.cloth);
    this.rect(-0.11, 0, 0.22, 0.18, p.highlight);
  }

  private daggers(p: MinionPalette): void {
    for (const side of [-1, 1]) {
      this.poly(
        [
          [side * 0.49, -0.37],
          [side * 0.75, -0.23],
          [side * 1.01, 0.42],
          [side * 0.65, 0.05],
        ],
        INK,
      );
      this.poly(
        [
          [side * 0.58, -0.23],
          [side * 0.71, -0.17],
          [side * 0.91, 0.25],
          [side * 0.66, 0],
        ],
        p.highlight,
      );
      this.rect(side * 0.61 - 0.1, -0.37, 0.2, 0.18, p.skin);
    }
    this.poly(
      [
        [-0.31, -1.33],
        [0, -1.66],
        [0.31, -1.33],
        [0.22, -1.22],
        [0, -1.45],
        [-0.22, -1.22],
      ],
      p.cloth,
    );
    this.poly(
      [
        [0.26, -0.84],
        [0.47, -0.75],
        [0.72, 0.2],
        [0.48, 0.06],
      ],
      p.cloth,
    );
  }

  private swordAndShield(p: MinionPalette): void {
    this.poly(
      [
        [0.75, -0.16],
        [0.91, -1.67],
        [1.05, -1.95],
        [1.17, -1.64],
        [0.99, -0.11],
      ],
      INK,
    );
    this.poly(
      [
        [0.87, -0.26],
        [1.01, -1.65],
        [1.06, -1.78],
        [1.08, -1.62],
        [0.99, -0.22],
      ],
      p.highlight,
    );
    this.rect(0.69, -0.28, 0.47, 0.11, p.trim);
    this.rect(0.87, -0.14, 0.13, 0.36, p.cloth);
    this.poly(
      [
        [-1.2, -0.76],
        [-0.49, -0.83],
        [-0.42, 0.09],
        [-0.78, 0.55],
        [-1.17, 0.15],
      ],
      INK,
    );
    this.poly(
      [
        [-1.1, -0.67],
        [-0.57, -0.72],
        [-0.52, 0.05],
        [-0.78, 0.4],
        [-1.07, 0.1],
      ],
      p.trim,
    );
    this.poly(
      [
        [-1.01, -0.57],
        [-0.65, -0.61],
        [-0.62, 0.01],
        [-0.78, 0.23],
        [-0.96, 0.02],
      ],
      p.cloth,
    );
    this.rect(-0.84, -0.5, 0.1, 0.6, p.highlight);
    this.rect(-1, -0.3, 0.42, 0.09, p.highlight);
  }

  private maul(p: MinionPalette): void {
    for (const side of [-1, 1]) {
      this.poly(
        [
          [side * 0.79, -0.88],
          [side * 1.08, -1.2],
          [side * 1.25, -0.66],
        ],
        p.highlight,
      );
      this.rect(side * 0.93 - 0.16, -0.3, 0.32, 0.32, INK);
      this.rect(side * 0.93 - 0.1, -0.25, 0.2, 0.22, p.armor);
    }
    this.rect(1.04, -1.05, 0.16, 1.8, INK);
    this.rect(1.08, -1.02, 0.07, 1.7, p.cloth);
    this.poly(
      [
        [0.72, -1.57],
        [1.5, -1.57],
        [1.6, -1.3],
        [1.5, -0.92],
        [0.72, -0.92],
        [0.62, -1.3],
      ],
      INK,
    );
    this.rect(0.77, -1.47, 0.68, 0.44, p.armor);
    this.rect(0.79, -1.47, 0.63, 0.1, p.highlight);
    this.rect(1.02, -1.47, 0.13, 0.44, p.trim);
  }
}
