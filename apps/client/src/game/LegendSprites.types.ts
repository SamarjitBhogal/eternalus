import type { LegendClassId, Logger, Simulation } from '@eternalus/core';

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
  /**
   * Each Legend class's sprite width by class id (core content `spriteWidth`, DEC-424). A Legend
   * whose class has none is drawn as the disc.
   */
  readonly legendSpriteWidths?: Readonly<Record<LegendClassId, number>> | undefined;
  readonly tickRate: number;
  readonly simulation: Pick<Simulation, 'on' | 'tick'>;
  readonly renderer: Pick<Renderer, 'hasSprite' | 'spriteTop'>;
  readonly logger: Logger;
};
