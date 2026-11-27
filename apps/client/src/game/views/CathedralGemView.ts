import type { GemSnapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import {
  GEM_COLORS,
  GEM_FACETS,
  GEM_GLOW,
  GEM_HEIGHT_PER_WIDTH,
  GEM_IDLE,
} from './CathedralGemView.constants';
import type { EntityDrawState, EntityView } from './EntityView.types';

/**
 * The Cathedral gem (DEC-291, DEC-292): a diamond as wide as its hit circle, in the colour of the
 * team holding the Cathedral, with a purple glow while it is lit (brighter and wider with more
 * hits) and a purple pulse ring just after a hit. Everything comes from the gem's own snapshot.
 * No mini map marker: the map layer marks the Cathedral.
 */
export class CathedralGemView implements EntityView {
  /** Draws the glow, the pulse, then the gem on top. */
  public draw({ entity, position, tick = 0 }: EntityDrawState, renderer: Renderer): undefined {
    const radius = entity.transform?.radius ?? 0;
    if (radius <= 0) return undefined;
    const holder = entity.gem?.holder ?? 'neutral';
    const { bright, shadow, aura } = GEM_FACETS[holder];
    const shimmer = Math.sin((tick / GEM_IDLE.shimmerTicks) * 2 * Math.PI);
    renderer.drawWorldGlyph(
      { shape: 'dot', size: radius * (3.2 + shimmer * 0.25) },
      position,
      aura,
    );
    if (entity.gem !== null) {
      CathedralGemView.drawGlow(entity.gem, radius, position, renderer);
    }
    CathedralGemView.drawOrbit(position, radius, tick, bright, renderer);
    const halfHeight = radius * GEM_HEIGHT_PER_WIDTH;
    const crown = { x: position.x, y: position.y - halfHeight };
    const base = { x: position.x, y: position.y + halfHeight };
    const west = { x: position.x - radius, y: position.y };
    const east = { x: position.x + radius, y: position.y };
    const core = { x: position.x + shimmer * radius * 0.18, y: position.y - halfHeight * 0.12 };
    renderer.fillPolygon([crown, east, base, west], GEM_COLORS[holder]);
    renderer.fillPolygon([crown, west, core], bright);
    renderer.fillPolygon([east, base, core], shadow);
    renderer.fillPolygon([crown, core, east], aura);
    renderer.strokePath([crown, core, base], GEM_IDLE.core, 1);
    renderer.drawWorldGlyph(
      { shape: 'diamond', size: radius * (0.3 + shimmer * 0.07) },
      core,
      GEM_IDLE.core,
    );
    return undefined;
  }

  private static drawOrbit(
    at: WorldPoint,
    radius: number,
    tick: number,
    color: string,
    renderer: Renderer,
  ): void {
    const phase = tick / GEM_IDLE.orbitTicks;
    for (let index = 0; index < GEM_IDLE.orbiters; index += 1) {
      const angle = (phase + index / GEM_IDLE.orbiters) * 2 * Math.PI;
      const y = Math.sin(angle);
      renderer.drawWorldGlyph(
        { shape: 'diamond', size: radius * (0.15 + (y + 1) * 0.06) },
        { x: at.x + Math.cos(angle) * radius * 1.35, y: at.y + y * radius * 0.58 },
        color,
      );
    }
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
      const hits = Math.min(Math.max(glowHits, 1), GEM_GLOW.colors.length);
      const color = GEM_GLOW.colors[hits - 1];
      const size = radius * (GEM_GLOW.size + GEM_GLOW.sizePerHit * (hits - 1));
      if (color !== undefined) renderer.drawWorldGlyph({ shape: 'dot', size }, at, color);
    }
    if (ticksSinceHit !== null && ticksSinceHit < GEM_GLOW.pulseTicks) {
      const grown = ticksSinceHit / GEM_GLOW.pulseTicks;
      const { pulseStartSize, pulseSize } = GEM_GLOW;
      const size = radius * (pulseStartSize + (pulseSize - pulseStartSize) * grown);
      renderer.drawWorldGlyph({ shape: 'ring', size }, at, GEM_GLOW.pulseColor);
    }
  }
}
