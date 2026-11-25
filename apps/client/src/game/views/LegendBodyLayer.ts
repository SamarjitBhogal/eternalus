import type { Renderer } from '../engine/render/Renderer';
import { LEGEND_BODY_COLOR } from './entityViews.constants';
import type { LegendBody } from './LegendBodyLayer.types';
import type { WorldLayer } from './SceneView.types';

/**
 * Draws the bodies of fallen Legends (DEC-295), under the living entities: one greyed-out disc
 * each, the Legend's size, with no outline, chevron or ring, so many bodies stay cheap (the owner
 * allowed "reduced pixels"). Bodies are scenery, so the mini map shows none.
 */
export class LegendBodyLayer implements WorldLayer {
  /** @param bodies - The bodies to draw, read every frame (`LegendBodies.bodies`). */
  public constructor(private readonly bodies: () => readonly LegendBody[]) {}

  /** Draws every body for the main view. */
  public draw(renderer: Renderer): void {
    for (const { x, y, radius } of this.bodies()) {
      renderer.drawWorldGlyph({ shape: 'dot', size: radius * 2 }, { x, y }, LEGEND_BODY_COLOR);
    }
  }

  /** Bodies draw nothing on the mini map. */
  public drawMinimap(): void {
    // Scenery: the mini map marks only living units (DEC-187).
  }
}
