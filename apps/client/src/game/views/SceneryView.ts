import type { MapDecoration, MapDecorationLayer } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldLayer } from './SceneView.types';
import type { WorldRect } from '../engine/render/Renderer.types';

/** Paints one layer of presentation-only map scenery, in the main view and the mini map. */
export class SceneryView implements WorldLayer {
  private readonly pieces: readonly MapDecoration[];

  /** Keeps only the pieces on `layer`; scenery never changes gameplay state. */
  public constructor(
    scenery: readonly MapDecoration[],
    layer: MapDecorationLayer,
    private readonly hiddenRoofs: ReadonlySet<string> = new Set(),
    _detailArea?: () => WorldRect,
    private readonly isDestroyed: (id: string) => boolean = () => false,
  ) {
    this.pieces = scenery.filter((piece) => piece.layer === layer);
  }

  /** Draws the polygons in their authored order. */
  public draw(renderer: Renderer): void {
    this.paint(renderer);
  }

  private paint(renderer: Renderer): void {
    for (const piece of this.pieces) {
      if (
        (piece.object !== undefined && this.isDestroyed(piece.object.id)) ||
        (piece.buildingId !== undefined && this.isDestroyed(piece.buildingId))
      )
        continue;
      const isOpen = piece.buildingId !== undefined && this.hiddenRoofs.has(piece.buildingId);
      if (piece.visibility === undefined || (piece.visibility === 'interior' ? isOpen : !isOpen)) {
        renderer.fillPolygon(piece.shape, piece.color);
      }
    }
  }

  /** The mini map shows the same scenery, scaled down. */
  public drawMinimap(renderer: Renderer): void {
    this.paint(renderer);
  }
}
