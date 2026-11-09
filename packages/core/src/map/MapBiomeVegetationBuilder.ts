import { BIOME_PALETTES } from '../content/maps/biomeScenery';
import type { MapDecoration } from '../content/maps/maps.types';
import type { Vec2 } from '../utils/geometry.types';
import { MapDecorationBuilder } from './MapDecorationBuilder';

/** Replaces existing trees' appearance while retaining their exact trunk footprints and IDs. */
export class MapBiomeVegetationBuilder extends MapDecorationBuilder {
  /** Dresses an existing forest sample as an alpine fir or a charred, bare tree. */
  public build(
    id: string,
    point: Vec2,
    size: number,
    n: number,
    kind: 'snow' | 'lava',
  ): readonly MapDecoration[] {
    const p = BIOME_PALETTES[kind];
    const { x, y } = point;
    this.isMirrored = true;
    this.beginObject(id, 'tree');
    this.ellipse(`${id}-biome-shadow`, x + 4, y + 6, size, size * 0.4, 'rgba(18,29,32,0.25)');
    this.blockRect(`${id}-trunk`, x - 1, y, 3, n % 3 === 0 ? 9 : 10, p.vegetation);
    if (kind === 'snow') {
      for (let tier = 0; tier < 3; tier++) {
        const top = y - size * 1.5 + tier * size * 0.5;
        const width = size * (0.4 + tier * 0.16);
        this.polygon(
          `${id}-fir-${String(tier)}`,
          [
            { x, y: top },
            { x: x + width, y: top + size * 0.85 },
            { x: x - width, y: top + size * 0.85 },
          ],
          p.vegetation,
        );
        this.polygon(
          `${id}-snow-bough-${String(tier)}`,
          [
            { x, y: top },
            { x: x + width * 0.8, y: top + size * 0.66 },
            { x: x + width * 0.15, y: top + size * 0.55 },
            { x: x - width * 0.28, y: top + size * 0.69 },
            { x: x - width * 0.78, y: top + size * 0.64 },
          ],
          tier % 2 === 0 ? p.light : p.surface,
        );
      }
      this.ellipse(`${id}-snow-foot`, x, y + 9, 5, 2, p.surface);
    } else {
      this.ribbon(
        `${id}-charred-crown`,
        [
          { x, y: y + 2 },
          { x: x + 1, y: y - size * 0.65 },
          { x: x - 2, y: y - size * 1.3 },
        ],
        2.5,
        p.vegetation,
        'detail',
      );
      for (const side of [-1, 1]) {
        this.ribbon(
          `${id}-charred-branch-${String(side)}`,
          [
            { x, y: y - size * 0.35 },
            { x: x + side * size * 0.5, y: y - size * 0.7 },
            { x: x + side * size * 0.7, y: y - size },
          ],
          1.8,
          p.vegetation,
          'detail',
        );
        this.ribbon(
          `${id}-charred-twig-${String(side)}`,
          [
            { x: x + side * size * 0.5, y: y - size * 0.7 },
            { x: x + side * size * 0.8, y: y - size * 0.67 },
          ],
          1,
          p.twig,
          'detail',
        );
      }
      this.ellipse(`${id}-ash-foot`, x, y + 8, 6, 2, p.soil);
    }
    return this.pieces;
  }
}
