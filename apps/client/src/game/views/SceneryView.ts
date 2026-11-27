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
    private readonly isFallen: (id: string) => boolean = () => false,
  ) {
    this.pieces = scenery.filter((piece) => piece.layer === layer);
  }

  /** Draws the polygons in their authored order. */
  public draw(renderer: Renderer): void {
    this.paint(renderer);
  }

  private paint(renderer: Renderer): void {
    for (const piece of this.pieces) {
      if (this.isHidden(piece)) continue;
      const isOpen = piece.buildingId !== undefined && this.hiddenRoofs.has(piece.buildingId);
      if (piece.visibility === undefined || (piece.visibility === 'interior' ? isOpen : !isOpen)) {
        renderer.fillPolygon(piece.shape, piece.color);
      }
    }
  }

  /**
   * Whether a piece's art is gone because what it shows fell. A piece of a map object follows that
   * object's own state, so a structure's body that outlives its building stays drawn (the
   * Stronghold's outer walls and throne when the palace falls, DEC-386 (1)). A piece with no
   * object follows its building.
   */
  private isHidden(piece: MapDecoration): boolean {
    if (piece.object !== undefined) return this.isFallen(piece.object.id);
    return piece.buildingId !== undefined && this.isFallen(piece.buildingId);
  }

  /** The mini map shows the same scenery, scaled down. */
  public drawMinimap(renderer: Renderer): void {
    this.paint(renderer);
  }
}
