import { BIOME_PALETTES, BIOME_PROFILES, BIOME_MATERIALS } from '../content/maps/biomeScenery';
import { BIOME_TREE_ART as A } from '../content/maps/biomeVegetationArt';
import type { BiomeKind, MapDecoration } from '../content/maps/maps.types';
import type { Vec2 } from '../utils/geometry.types';
import { MapDecorationBuilder } from './MapDecorationBuilder';

/** Replaces existing trees' appearance while retaining their exact trunk footprints and IDs. */
export class MapBiomeVegetationBuilder extends MapDecorationBuilder {
  private readonly trees = {
    fir: (id: string, point: Vec2, size: number, kind: BiomeKind) => {
      this.fir(id, point, size, kind);
    },
    charred: (id: string, point: Vec2, size: number, kind: BiomeKind) => {
      this.charred(id, point, size, kind);
    },
  };
  /** Dresses an existing forest sample as an alpine fir or a charred, bare tree. */
  public build(
    id: string,
    point: Vec2,
    size: number,
    n: number,
    kind: BiomeKind,
  ): readonly MapDecoration[] {
    const p = BIOME_PALETTES[kind],
      { x, y } = point;
    this.isMirrored = true;
    this.beginObject(id, 'tree');
    this.ellipse(
      `${id}-biome-shadow`,
      x + A.shadow.x,
      y + A.shadow.y,
      size,
      size * A.shadow.height,
      BIOME_MATERIALS.treeShadow,
    );
    this.blockRect(
      `${id}-trunk`,
      x + A.trunk.x,
      y,
      A.trunk.width,
      n % A.trunk.shortModulo === 0 ? A.trunk.short : A.trunk.tall,
      p.vegetation,
    );
    this.trees[BIOME_PROFILES[kind].treeStyle](id, point, size, kind);
    return this.pieces;
  }
  private fir(id: string, { x, y }: Vec2, size: number, kind: BiomeKind): void {
    const p = BIOME_PALETTES[kind],
      a = A.fir;
    for (let tier = 0; tier < a.tiers; tier++) {
      const top = y + size * a.top + tier * size * a.step;
      const width = size * (a.width + tier * a.widthStep);
      this.polygon(
        `${id}-fir-${String(tier)}`,
        [
          { x, y: top },
          { x: x + width, y: top + size * a.height },
          { x: x - width, y: top + size * a.height },
        ],
        p.vegetation,
      );
      this.polygon(
        `${id}-snow-bough-${String(tier)}`,
        a.snow.map(([dx, dy]) => ({ x: x + width * dx, y: top + size * dy })),
        tier % 2 === 0 ? p.light : p.surface,
      );
    }
    this.ellipse(`${id}-snow-foot`, x, y + a.foot.y, a.foot.rx, a.foot.ry, p.surface);
  }
  private charred(id: string, { x, y }: Vec2, size: number, kind: BiomeKind): void {
    const p = BIOME_PALETTES[kind],
      a = A.charred;
    this.ribbon(
      `${id}-charred-crown`,
      [
        { x, y: y + a.crown.baseY },
        { x: x + a.crown.middleX, y: y + size * a.crown.middleY },
        { x: x + a.crown.tipX, y: y + size * a.crown.tipY },
      ],
      a.crownWidth,
      p.vegetation,
      'detail',
    );
    for (const side of [-1, 1]) {
      this.ribbon(
        `${id}-charred-branch-${String(side)}`,
        a.branch.map(([dx, dy]) => ({ x: x + side * size * dx, y: y + size * dy })),
        a.branchWidth,
        p.vegetation,
        'detail',
      );
      this.ribbon(
        `${id}-charred-twig-${String(side)}`,
        a.twig.map(([dx, dy]) => ({ x: x + side * size * dx, y: y + size * dy })),
        a.twigWidth,
        p.twig,
        'detail',
      );
    }
    this.ellipse(`${id}-ash-foot`, x, y + a.foot.y, a.foot.rx, a.foot.ry, p.soil);
  }
}
