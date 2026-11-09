import { BIOME_PALETTES, BIOME_REGIONS } from '../content/maps/biomeScenery';
import type { MapDecoration, MapDefinition } from '../content/maps/maps.types';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import { distance, distanceToPath } from '../utils/geometry';

/** Builds layered alpine and volcanic ground, with all existing gameplay geometry preserved. */
export class MapBiomeBuilder extends MapDecorationBuilder {
  /** Returns mountain-reaching soils, terraces, cracks, drifts and low vegetation. */
  public build(map: MapDefinition): readonly MapDecoration[] {
    this.layer = 'ground';
    for (const kind of ['snow', 'lava'] as const) {
      const region = BIOME_REGIONS[kind];
      const p = BIOME_PALETTES[kind];
      for (let edge = 9; edge >= 0; edge--) {
        this.blob(
          `${kind}-biome-transition-${String(edge)}`,
          region.x,
          region.y,
          region.rx + edge * 7,
          region.ry + edge * 4,
          edge === 0 ? p.ground : p.fringe,
        );
      }
      this.ellipse(
        `${kind}-atmosphere-region`,
        region.x,
        region.y,
        region.rx,
        region.ry,
        'rgba(0,0,0,0)',
      );
      const marker = this.pieces.at(-1);
      if (marker !== undefined)
        this.pieces[this.pieces.length - 1] = { ...marker, ambientBiome: kind };
      this.isMirrored = true;
      for (let row = 0; row < 5; row++) {
        for (let column = 0; column < 7; column++) {
          const baseX = region.x - 285 + column * 43;
          const baseY = kind === 'snow' ? 35 + row * 46 : 870 - row * 43;
          const n = this.variation(baseX + map.seed, baseY);
          if (kind === 'snow' && n % 3 !== 0) continue;
          const x = baseX + (n % 19) - 9;
          const y = baseY + ((n >>> 8) % 17) - 8;
          if (((x - region.x) / region.rx) ** 2 + ((y - region.y) / region.ry) ** 2 > 0.86)
            continue;
          const id = `${kind}-terrace-${String(row)}-${String(column)}`;
          this.blob(`${id}-soil`, x, y, 27 + (n % 19), 12 + ((n >>> 5) % 10), p.soil);
          this.blob(`${id}-slope`, x - 3, y - 3, 23 + (n % 16), 8 + ((n >>> 5) % 8), p.surface);
          this.ribbon(
            `${id}-rim`,
            [
              { x: x - 19, y },
              { x: x - 6, y: y - 5 },
              { x: x + 18, y: y - 2 },
            ],
            1.2,
            p.light,
          );
          if (map.lanes.some((lane) => distanceToPath({ x, y }, lane.path) < 22)) continue;
          if (map.features.some((feature) => distance({ x, y }, feature.position) < 47)) continue;
          if (kind === 'snow') {
            this.ribbon(
              `${id}-ice-seam`,
              [
                { x: x - 10, y: y - 5 },
                { x: x - 2, y: y - 1 },
                { x: x + 5, y: y - 4 },
                { x: x + 13, y: y + 1 },
              ],
              0.9,
              p.ice,
            );
            this.blob(`${id}-drift`, x + 9, y - 6, 17, 4, p.light);
          } else {
            this.ribbon(
              `${id}-fracture`,
              [
                { x: x - 20, y: y - 5 },
                { x: x - 4, y: y + 3 },
                { x: x + 3, y: y - 1 },
                { x: x + 17, y: y + 6 },
              ],
              2.3,
              p.dark,
            );
            this.shrub(id, x + 4, y - 4);
            if (n % 3 === 0)
              this.ribbon(
                `${id}-ember-seam`,
                [
                  { x: x - 9, y },
                  { x: x - 4, y: y + 3 },
                  { x: x + 3, y: y - 1 },
                ],
                0.65,
                p.accent,
              );
            this.blob(`${id}-ash`, x - 9, y + 6, 5, 2, p.light);
          }
        }
      }
      this.isMirrored = undefined;
    }
    return this.pieces.map((piece) => ({
      ...piece,
      shape: piece.shape.map((point) => ({
        x: Math.max(0, Math.min(map.width, point.x)),
        y: Math.max(0, Math.min(map.height, point.y)),
      })),
    }));
  }

  private shrub(id: string, x: number, y: number): void {
    const p = BIOME_PALETTES.lava;
    this.ribbon(
      `${id}-dead-shrub`,
      [
        { x: x - 1, y: y + 5 },
        { x, y },
        { x: x - 2, y: y - 7 },
      ],
      1,
      p.twig,
    );
    for (const side of [-1, 1])
      this.ribbon(
        `${id}-dead-twig-${String(side)}`,
        [
          { x, y: y + 1 },
          { x: x + side * 5, y: y - 3 },
          { x: x + side * 6, y: y - 6 },
        ],
        0.7,
        p.twig,
      );
  }
}
