import {
  BIOME_PALETTES,
  BIOME_REGIONS,
  BIOME_PROFILES,
  BIOME_KINDS,
  BIOME_MATERIALS,
  BIOME_GROUND_SETTINGS as S,
} from '../content/maps/biomeScenery';
import { BIOME_GROUND_ART as A } from '../content/maps/biomeGroundArt';
import type { BiomeKind, MapDecoration, MapDefinition } from '../content/maps/maps.types';
import { SCENERY_SETTINGS } from '../content/maps/map1Scenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';
import type { BiomeDetail } from './MapBiomeBuilder.types';
import { distance, distanceToPath } from '../utils/geometry';

/** Builds layered alpine and volcanic ground, with all existing gameplay geometry preserved. */
export class MapBiomeBuilder extends MapDecorationBuilder {
  private readonly details = {
    ice: (detail: BiomeDetail) => {
      this.ice(detail);
    },
    fracture: (detail: BiomeDetail) => {
      this.fracture(detail);
    },
  };
  /** Returns mountain-reaching soils, terraces, cracks, drifts and low vegetation. */
  public build(map: MapDefinition): readonly MapDecoration[] {
    this.layer = 'ground';
    for (const kind of BIOME_KINDS) {
      this.transition(kind);
      this.isMirrored = true;
      this.terraces(map, kind);
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
  private terraces(map: MapDefinition, kind: BiomeKind): void {
    const region = BIOME_REGIONS[kind],
      profile = BIOME_PROFILES[kind];
    for (let row = 0; row < S.rows; row++) {
      for (let column = 0; column < S.columns; column++) {
        const baseX = region.x - S.startX + column * S.columnStep;
        const baseY = profile.rowOrigin + row * profile.rowStep;
        const n = this.variation(baseX + map.seed, baseY);
        if (n % profile.terraceModulo !== 0) continue;
        const x = baseX + (n % S.jitterX) - S.jitterOffsetX;
        const y = baseY + ((n >>> A.variation.yShift) % S.jitterY) - S.jitterOffsetY;
        if (((x - region.x) / region.rx) ** 2 + ((y - region.y) / region.ry) ** 2 > S.detailInset)
          continue;
        const id = `${kind}-terrace-${String(row)}-${String(column)}`;
        this.terrace(id, x, y, n, kind);
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
        this.details[profile.groundStyle]({ id, x, y, n, kind });
      }
    }
  }
  private terrace(id: string, x: number, y: number, n: number, kind: BiomeKind): void {
    const p = BIOME_PALETTES[kind];
    this.blob(
      `${id}-soil`,
      x,
      y,
      S.soilRadius + (n % S.soilVariation),
      S.soilHeight + ((n >>> A.variation.heightShift) % S.soilHeightVariation),
      p.soil,
    );
    this.blob(
      `${id}-slope`,
      x - S.slopeOffset,
      y - S.slopeOffset,
      S.slopeRadius + (n % S.slopeVariation),
      S.slopeHeight + ((n >>> A.variation.heightShift) % S.slopeHeightVariation),
      p.surface,
    );
    this.ribbon(
      `${id}-rim`,
      A.rim.map(([dx, dy]) => ({ x: x + dx, y: y + dy })),
      S.rimWidth,
      p.light,
    );
  }
  private transition(kind: BiomeKind): void {
    const region = BIOME_REGIONS[kind],
      p = BIOME_PALETTES[kind];
    for (let edge: number = S.transitionLayers; edge >= 0; edge--)
      this.blob(
        `${kind}-biome-transition-${String(edge)}`,
        region.x,
        region.y,
        region.rx + edge * S.transitionX,
        region.ry + edge * S.transitionY,
        edge === 0 ? p.ground : p.fringe,
      );
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
  private ice({ id, x, y, kind }: BiomeDetail): void {
    const p = BIOME_PALETTES[kind],
      a = A.ice;
    this.ribbon(
      `${id}-ice-seam`,
      a.seam.map(([dx, dy]) => ({ x: x + dx, y: y + dy })),
      a.width,
      p.ice,
    );
    this.blob(`${id}-drift`, x + a.drift.x, y + a.drift.y, a.drift.rx, a.drift.ry, p.light);
  }
  private fracture({ id, x, y, n, kind }: BiomeDetail): void {
    const p = BIOME_PALETTES[kind],
      a = A.fracture;
    this.ribbon(
      `${id}-fracture`,
      a.seam.map(([dx, dy]) => ({ x: x + dx, y: y + dy })),
      a.width,
      p.dark,
    );
    this.shrub(id, x + a.shrub.x, y + a.shrub.y, kind);
    if (n % a.emberModulo === 0)
      this.ribbon(
        `${id}-ember-seam`,
        a.ember.map(([dx, dy]) => ({ x: x + dx, y: y + dy })),
        a.emberWidth,
        p.accent,
      );
    this.blob(`${id}-ash`, x + a.ash.x, y + a.ash.y, a.ash.rx, a.ash.ry, p.light);
  }
  private shrub(id: string, x: number, y: number, kind: BiomeKind): void {
    const p = BIOME_PALETTES[kind],
      a = A.shrub;
    this.ribbon(
      `${id}-dead-shrub`,
      a.stem.map(([dx, dy]) => ({ x: x + dx, y: y + dy })),
      a.width,
      p.twig,
    );
    for (const side of [-1, 1])
      this.ribbon(
        `${id}-dead-twig-${String(side)}`,
        a.twig.map(([dx, dy]) => ({ x: x + side * dx, y: y + dy })),
        a.twigWidth,
        p.twig,
      );
  }
}
