import type { MapDecoration, MapFeature, MapFeatureKind } from '../content/maps/maps.types';
import type { MapObjectKind } from '../content/maps/mapObjects.types';
import { SHIELD_STYLE as S } from '../content/maps/map1Scenery';
import type { Vec2 } from '../utils/geometry.types';
import { MapDecorationBuilder } from './MapDecorationBuilder';

/** Dresses the generated physical shield arc; its segments remain separately destructible. */
export class MapShieldBuilder extends MapDecorationBuilder {
  private readonly painters: Partial<
    Record<
      MapFeatureKind,
      { readonly kind: MapObjectKind; readonly draw: (feature: MapFeature) => void }
    >
  > = {
    'wall-segment': {
      kind: 'wall',
      draw: (feature) => {
        this.panel(feature);
      },
    },
    gate: {
      kind: 'gate',
      draw: (feature) => {
        this.gate(feature);
      },
    },
    turret: {
      kind: 'turret',
      draw: (feature) => {
        this.pylon(feature);
      },
    },
  };

  /** Uses actual world polygons for the translucent panels, luminous seams, runes and emitters. */
  public build(features: readonly MapFeature[]): readonly MapDecoration[] {
    this.layer = 'ground';
    for (const feature of features) {
      const painter = this.painters[feature.kind];
      if (painter === undefined) continue;
      const first = this.pieces.length;
      this.beginObject(feature.id, painter.kind);
      painter.draw(feature);
      for (let i = first; i < this.pieces.length; i++) {
        const piece = this.pieces[i];
        if (piece !== undefined) this.pieces[i] = { ...piece, replacesFeature: feature.id };
      }
    }
    return this.pieces;
  }

  private panel(feature: MapFeature): void {
    this.band(feature, 'halo', -0.8, 1.8, S.glow);
    this.band(feature, 'glass', 0, 1, S.glass);
    this.band(feature, 'inner-rim', 0, 0.09, S.edge);
    this.band(feature, 'outer-rim', 0.91, 1, S.edge);
    this.band(feature, 'energy-thread', 0.47, 0.53, S.core);
    const shape = feature.footprint ?? [];
    const count = shape.length / 2;
    for (let i = 1; i < count - 1; i += 2) {
      const a = shape[i];
      const b = shape[shape.length - 1 - i];
      if (a === undefined || b === undefined) continue;
      this.polygon(
        `${feature.id}-seam-${String(i)}`,
        [
          { x: a.x - S.runeLine / 2, y: a.y },
          { x: a.x + S.runeLine / 2, y: a.y },
          { x: b.x + S.runeLine / 2, y: b.y },
          { x: b.x - S.runeLine / 2, y: b.y },
        ],
        S.lattice,
      );
    }
    this.rune(feature);
  }

  private gate(feature: MapFeature): void {
    this.band(feature, 'passage-glow', -0.3, 1.3, S.gate);
    this.band(feature, 'threshold', 0.47, 0.53, S.lattice);
  }

  private band(feature: MapFeature, id: string, from: number, to: number, color: string): void {
    const shape = feature.footprint ?? [];
    const count = shape.length / 2;
    if (count < 2) return;
    const edge = (t: number): Vec2[] =>
      shape.slice(0, count).map((a, i) => {
        const b = shape[shape.length - 1 - i] ?? a;
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      });
    this.polygon(`${feature.id}-${id}`, [...edge(from), ...edge(to).reverse()], color);
  }

  private rune(feature: MapFeature): void {
    const { x, y } = feature.position;
    const size = S.runeSize;
    this.polygon(
      `${feature.id}-rune`,
      [
        { x, y: y - size },
        { x: x + size, y },
        { x, y: y + size },
        { x: x - size, y },
      ],
      S.edge,
    );
    this.polygon(
      `${feature.id}-rune-cutout`,
      [
        { x, y: y - size / 2 },
        { x: x + size / 2, y },
        { x, y: y + size / 2 },
        { x: x - size / 2, y },
      ],
      S.metalDark,
    );
    this.rect(
      `${feature.id}-rune-stroke`,
      x - S.runeLine / 2,
      y - size * 1.4,
      S.runeLine,
      size * 2.8,
      S.core,
    );
  }

  private pylon(feature: MapFeature): void {
    const { x, y } = feature.position;
    this.ellipse(
      `${feature.id}-emitter-halo`,
      x,
      y,
      S.pylonRadius * 1.8,
      S.pylonRadius * 1.8,
      S.glow,
    );
    this.ellipse(`${feature.id}-emitter-base`, x, y, S.pylonRadius, S.pylonRadius, S.metalDark);
    this.ellipse(
      `${feature.id}-emitter-rim`,
      x,
      y,
      S.pylonRadius * 0.8,
      S.pylonRadius * 0.8,
      S.metal,
    );
    this.ellipse(`${feature.id}-emitter-core`, x, y, S.pylonCoreRadius, S.pylonCoreRadius, S.core);
  }
}
