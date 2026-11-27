import type { Renderer } from '../engine/render/Renderer';
import { ERUPTION_LOOK } from './EruptionView.constants';
import type { EruptionBurst } from './EruptionView.types';
import type { WorldLayer } from './SceneView.types';

/**
 * Draws the Cathedral gem's eruption (Aryan 2026-11-22) while it lasts: a white flash that shrinks
 * away and two rings growing out from where the gem stood. It only reads `burst` (the cut-scene's),
 * so it holds no state. The minimap shows a ring growing at the gem, so a player far from the
 * Cathedral, who keeps their own view, still sees it (DEC-371 E1).
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

  /** Draws the burst's ring on the minimap while it lasts. */
  public drawMinimap(renderer: Renderer): void {
    const burst = this.burst();
    if (burst === null) return;
    const { size, color } = ERUPTION_LOOK.minimap;
    renderer.drawGlyph({ shape: 'ring', size: size * (1 + burst.progress) }, burst.at, color);
  }
}
