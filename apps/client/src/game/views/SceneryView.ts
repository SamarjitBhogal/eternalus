import type { MapDecoration, MapDecorationLayer } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldLayer } from './SceneView.types';
import type { WorldRect } from '../engine/render/Renderer.types';
import { MapSurfaceDetailView } from './MapSurfaceDetailView';

/** Paints one layer of presentation-only map scenery, in the main view and the mini map. */
export class SceneryView implements WorldLayer {
  private readonly pieces: readonly MapDecoration[];
  private readonly surface = new MapSurfaceDetailView();

  /** Keeps only the pieces on `layer`; scenery never changes gameplay state. */
  public constructor(
    scenery: readonly MapDecoration[],
    layer: MapDecorationLayer,
    private readonly hiddenRoofs: ReadonlySet<string> = new Set(),
    private readonly detailArea?: () => WorldRect,
  ) {
    this.pieces = scenery.filter((piece) => piece.layer === layer);
  }

  /** Draws the polygons in their authored order. */
  public draw(renderer: Renderer): void {
    this.paint(renderer, true);
  }

  private paint(renderer: Renderer, hasDetails: boolean): void {
    const area = hasDetails ? this.detailArea?.() : undefined;
    for (const piece of this.pieces) {
      const isOpen = piece.buildingId !== undefined && this.hiddenRoofs.has(piece.buildingId);
      if (piece.visibility === undefined || (piece.visibility === 'interior' ? isOpen : !isOpen)) {
        renderer.fillPolygon(piece.shape, piece.color);
        if (hasDetails) this.surface.draw(renderer, piece, area);
      }
    }
  }

  /** The mini map shows the same scenery, scaled down. */
  public drawMinimap(renderer: Renderer): void {
    this.paint(renderer, false);
  }
}
