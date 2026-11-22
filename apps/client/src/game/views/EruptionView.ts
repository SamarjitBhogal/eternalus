import type { Renderer } from '../engine/render/Renderer';
import { ERUPTION_LOOK } from './EruptionView.constants';
import type { EruptionBurst } from './EruptionView.types';
import type { WorldLayer } from './SceneView.types';

/**
 * Draws the Cathedral gem's eruption (Aryan 2026-11-22) while it lasts: a white flash that shrinks
 * away and two rings growing out from where the gem stood. It only reads `burst` (the cut-scene's),
 * so it holds no state. No mini map marker.
 */
export class EruptionView implements WorldLayer {
  /** @param burst - The burst to draw now, or `null` for none. */
  public constructor(private readonly burst: () => EruptionBurst | null) {}

  /** Draws the flash, then the rings on top. */
  public draw(renderer: Renderer): void {
    const burst = this.burst();
    if (burst === null) return;
    const { at, progress } = burst;
    const { flash, rings } = ERUPTION_LOOK;
    if (progress < flash.share) {
      const size = flash.size * (1 - progress / flash.share);
      renderer.drawWorldGlyph({ shape: 'dot', size }, at, flash.color);
    }
    for (const ring of rings) {
      const grown = (progress - ring.delay) / (1 - ring.delay);
      if (grown > 0) {
        renderer.drawWorldGlyph({ shape: 'ring', size: ring.size * grown }, at, ring.color);
      }
    }
  }

  /** Draws nothing: the burst is only for the main view. */
  public drawMinimap(): void {
    // Intentionally empty: the mini map shows no effects.
  }
}
