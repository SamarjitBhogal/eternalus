import type { MapDefinition } from '@eternalus/core';
import type { Renderer } from '../engine/Renderer';
import type { WorldLayer } from './SceneView.types';

/** Paints authored scenery through the renderer in both the battlefield and minimap. */
export class SceneryView implements WorldLayer {
  /** Selects a visual layer; scenery never changes gameplay state. */
  public constructor(
    private readonly map: MapDefinition,
    private readonly layer: 'ground' | 'detail',
  ) {}

  /** Draws immutable polygon decorations in their authored order. */
  public draw(renderer: Renderer): void {
    for (const piece of this.map.scenery ?? []) {
      if (piece.layer === this.layer) renderer.fillPolygon(piece.shape, piece.color);
    }
  }
}
