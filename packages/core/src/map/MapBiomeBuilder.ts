import {
  BIOME_PALETTES,
  BIOME_REGIONS,
  BIOME_PROFILES,
  BIOME_KINDS,
  BIOME_MATERIALS,
  BIOME_GROUND_SETTINGS as S,
} from '../content/maps/biomeScenery';
import type { BiomeKind, MapDecoration, MapDefinition } from '../content/maps/maps.types';
import { SCENERY_SETTINGS } from '../content/maps/map1Scenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import { distance, distanceToPath } from '../utils/geometry';

/** Builds layered alpine and volcanic ground, with all existing gameplay geometry preserved. */
export class MapBiomeBuilder extends MapDecorationBuilder {
  /** Returns mountain-reaching soils, terraces, cracks, drifts and low vegetation. */
  public build(map: MapDefinition): readonly MapDecoration[] {
    this.layer = 'ground';
    for (const kind of BIOME_KINDS) {
      const region = BIOME_REGIONS[kind];
      const profile = BIOME_PROFILES[kind];
      const p = BIOME_PALETTES[kind];
      this.transition(kind);
      this.isMirrored = true;
      for (let row = 0; row < S.rows; row++) {
        for (let column = 0; column < S.columns; column++) {
          const baseX = region.x - S.startX + column * S.columnStep;
          const baseY = profile.rowOrigin + row * profile.rowStep;
          const n = this.variation(baseX + map.seed, baseY);
          if (n % profile.terraceModulo !== 0) continue;
          const x = baseX + (n % S.jitterX) - S.jitterOffsetX;
          const y = baseY + ((n >>> 8) % S.jitterY) - S.jitterOffsetY;
          if (((x - region.x) / region.rx) ** 2 + ((y - region.y) / region.ry) ** 2 > S.detailInset)
            continue;
          const id = `${kind}-terrace-${String(row)}-${String(column)}`;
          this.blob(
            `${id}-soil`,
            x,
            y,
            S.soilRadius + (n % S.soilVariation),
            S.soilHeight + ((n >>> 5) % S.soilHeightVariation),
            p.soil,
          );
          this.blob(
            `${id}-slope`,
            x - S.slopeOffset,
            y - S.slopeOffset,
            S.slopeRadius + (n % S.slopeVariation),
            S.slopeHeight + ((n >>> 5) % S.slopeHeightVariation),
            p.surface,
          );
          this.ribbon(
            `${id}-rim`,
            [
              { x: x - 19, y },
              { x: x - 6, y: y - 5 },
              { x: x + 18, y: y - 2 },
            ],
            S.rimWidth,
            p.light,
          );
          if (
            map.lanes.some(
              (lane) => distanceToPath({ x, y }, lane.path) < SCENERY_SETTINGS.laneClearance,
            )
          )
            continue;
          if (
            map.features.some(
              (feature) => distance({ x, y }, feature.position) < SCENERY_SETTINGS.featureClearance,
            )
          )
            continue;
          this.detail(id, x, y, n, kind);
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

  private transition(kind: BiomeKind): void {
    const region = BIOME_REGIONS[kind];
    const p = BIOME_PALETTES[kind];
    for (let edge: number = S.transitionLayers; edge >= 0; edge--) {
      this.blob(
        `${kind}-biome-transition-${String(edge)}`,
        region.x,
        region.y,
        region.rx + edge * S.transitionX,
        region.ry + edge * S.transitionY,
        edge === 0 ? p.ground : p.fringe,
      );
    }
    this.ellipse(
      `${kind}-atmosphere-region`,
      region.x,
      region.y,
      region.rx,
      region.ry,
      BIOME_MATERIALS.transparent,
    );
    const marker = this.pieces.at(-1);
    if (marker !== undefined)
      this.pieces[this.pieces.length - 1] = { ...marker, ambientBiome: kind };
  }

  private detail(id: string, x: number, y: number, n: number, kind: BiomeKind): void {
    const profile = BIOME_PROFILES[kind];
    const p = BIOME_PALETTES[kind];
    if (profile.groundStyle === 'ice') {
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
