import type { Logger, Simulation } from '@eternalus/core';

import type { Renderer } from './engine/render/Renderer';
import type { LegendSpriteSheet } from './legendSpriteSheets.types';

/**
 * What `LegendSprites` is built from. It is a narrow part of `MatchDeps`: the simulation gives it
 * events and the tick, and the renderer tells it which atlases are loaded and how tall a sprite
 * stands above its feet.
 */
export type LegendSpritesDeps = {
  /**
   * The sprite sheets of the match's Legends, by sub-class id (`matchLegendSheets`). Left out (an
   * online Duel), every Legend is a disc and nothing is subscribed.
   */
  readonly legendSheets?: ReadonlyMap<string, LegendSpriteSheet> | undefined;
  readonly tickRate: number;
  readonly simulation: Pick<Simulation, 'on' | 'tick'>;
  readonly renderer: Pick<Renderer, 'hasSprite' | 'spriteTop'>;
  readonly logger: Logger;
};
