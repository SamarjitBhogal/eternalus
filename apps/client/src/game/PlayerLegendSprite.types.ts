import type { Logger, Simulation } from '@eternalus/core';

import type { Renderer } from './engine/render/Renderer';
import type { LegendSpriteSheet } from './legendSpriteSheets.types';

/**
 * What a `PlayerLegendSprite` is built from. It is a narrow part of `MatchDeps`: the simulation
 * gives it events and the tick, and the renderer tells it whether the atlas is loaded.
 */
export type PlayerLegendSpriteDeps = {
  /** The player's sprite sheet; left out, the Legend is a disc and nothing is subscribed. */
  readonly playerSheet?: LegendSpriteSheet | undefined;
  readonly tickRate: number;
  readonly simulation: Pick<Simulation, 'on' | 'tick'>;
  readonly renderer: Pick<Renderer, 'hasSprite'>;
  readonly logger: Logger;
};
