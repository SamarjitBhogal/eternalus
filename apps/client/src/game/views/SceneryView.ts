import type { MapDefinition } from '@eternalus/core';
import type { Renderer } from '../engine/Renderer';
import type { WorldLayer } from './SceneView.types';

/** Paints authored scenery through the renderer in both the battlefield and minimap. */
export class SceneryView implements WorldLayer {
  /** Selects a visual layer; scenery never changes gameplay state. */
  public constructor(
    private readonly map: MapDefinition,
    private readonly layer: 'ground' | 'detail',
    private readonly hiddenRoofs: ReadonlySet<string> = new Set(),
  ) {}

  /** Draws immutable polygon decorations in their authored order. */
  public draw(renderer: Renderer): void {
    for (const piece of this.map.scenery ?? []) {
      const isOpen = piece.buildingId !== undefined && this.hiddenRoofs.has(piece.buildingId);
      if (
        piece.layer === this.layer &&
        (piece.visibility === undefined || (piece.visibility === 'interior' ? isOpen : !isOpen))
      )
        renderer.fillPolygon(piece.shape, piece.color);
    }
  }
}
