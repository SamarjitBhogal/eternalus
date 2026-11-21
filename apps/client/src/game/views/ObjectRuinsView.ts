import type { MapObjectKind } from '@eternalus/core';
import type { Renderer } from '../engine/render/Renderer';
import type { WorldRect } from '../engine/render/Renderer.types';
import { OBJECT_RUINS } from './ObjectRuinsView.constants';
import type { RuinPolygon } from './ObjectRuinsView.types';

/** Cached, type-specific remains, drawn through the renderer without changing gameplay state. */
export class ObjectRuinsView {
  public readonly bounds: WorldRect;
  private readonly polygons: readonly RuinPolygon[];

  /** Sizes remains from the original footprint; a fallen trunk extends beside its stump. */
  public constructor(kind: MapObjectKind, original: WorldRect) {
    const art = OBJECT_RUINS[kind];
    const width = Math.max(original.width, original.height * (art.widthToHeight ?? 0));
    this.bounds = {
      ...original,
      x: original.x + original.width / 2 - width * (art.anchorX ?? 0.5),
      width,
    };
    this.polygons = art.pieces.map(({ color, points }) => ({
      color,
      shape: points.map(([x, y]) => ({
        x: this.bounds.x + x * width,
        y: original.y + y * original.height,
      })),
    }));
  }

  /** Paints persistent wreckage; flames are visual artwork, never a damaging fire zone. */
  public draw(renderer: Renderer): void {
    for (const { shape, color } of this.polygons) renderer.fillPolygon(shape, color);
  }
}
