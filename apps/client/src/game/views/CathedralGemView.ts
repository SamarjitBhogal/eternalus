import type { GemSnapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import { GEM_COLORS, GEM_GLOW, GEM_HEIGHT_PER_WIDTH } from './CathedralGemView.constants';
import type { EntityDrawState, EntityView } from './EntityView.types';

/**
 * The Cathedral gem (DEC-291, DEC-292): a diamond as wide as its hit circle, in the colour of the
 * team holding the Cathedral, with a purple glow while it is lit (brighter and wider with more
 * hits) and a purple pulse ring just after a hit. Everything comes from the gem's own snapshot.
 * No mini map marker: the map layer marks the Cathedral.
 */
export class CathedralGemView implements EntityView {
  /** Draws the glow, the pulse, then the gem on top. */
  public draw({ entity, position }: EntityDrawState, renderer: Renderer): void {
    const radius = entity.transform?.radius ?? 0;
    if (entity.gem !== null) {
      CathedralGemView.drawGlow(entity.gem, radius, position, renderer);
    }
    const halfHeight = radius * GEM_HEIGHT_PER_WIDTH;
    renderer.fillPolygon(
      [
        { x: position.x, y: position.y - halfHeight },
        { x: position.x + radius, y: position.y },
        { x: position.x, y: position.y + halfHeight },
        { x: position.x - radius, y: position.y },
      ],
      GEM_COLORS[entity.gem?.holder ?? 'neutral'],
    );
  }

  /** Draws nothing: the map layer already marks the Cathedral on the mini map. */
  public drawMinimap(): void {
    // Intentionally empty: `MapView.drawMinimap` marks the Cathedral feature.
  }

  private static drawGlow(
    { glowTicksLeft, glowHits, ticksSinceHit }: GemSnapshot,
    radius: number,
    at: WorldPoint,
    renderer: Renderer,
  ): void {
    if (glowTicksLeft > 0) {
      const hits = Math.min(Math.max(glowHits, 1), GEM_GLOW.maxHits);
      const color = GEM_GLOW.colors[Math.min(hits, GEM_GLOW.colors.length) - 1];
      const size = radius * (GEM_GLOW.size + GEM_GLOW.sizePerHit * (hits - 1));
      if (color !== undefined) renderer.drawWorldGlyph({ shape: 'dot', size }, at, color);
    }
    if (ticksSinceHit !== null && ticksSinceHit < GEM_GLOW.pulseTicks) {
      const grown = ticksSinceHit / GEM_GLOW.pulseTicks;
      const size = radius * (2 + (GEM_GLOW.pulseSize - 2) * grown);
      renderer.drawWorldGlyph({ shape: 'ring', size }, at, GEM_GLOW.pulseColor);
    }
  }
}
