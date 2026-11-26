import type { EntityId, Snapshot } from '@eternalus/core';

import { createLegendView } from './createLegendView';
import { LegendAnimation } from './LegendAnimation';
import type { MatchDeps } from './Match.types';
import type { EntityView } from './views/EntityView.types';

/**
 * The sprite of the player's Legend in one match (DEC-298 (6): only the player's Legend gets a
 * sprite). It owns the Legend's `LegendAnimation`, the tick the current frame shows and the
 * Legend view from `createLegendView`. `Match` gives it each tick's snapshots and each frame's
 * tick, and destroys it with the match.
 */
export class PlayerLegendSprite {
  /**
   * The Legend family's view for the view registry: a `LegendSpriteView` when the renderer holds
   * the atlas of `playerSheet`; else `undefined`, and the registry keeps its ordinary Legend view.
   */
  public readonly view: EntityView | undefined;

  private readonly animation: LegendAnimation;

  /** The tick the current frame shows (the snapshot's tick plus the frame's `alpha`). */
  private frameTick = 0;

  /**
   * Builds the animation of the player's Legend (`playerId`) from `playerSheet`, and the view
   * that draws its frames. With no sheet or no player, nothing is subscribed and `view` is
   * `undefined`.
   */
  public constructor(
    deps: Pick<MatchDeps, 'playerSheet' | 'tickRate' | 'simulation' | 'renderer' | 'logger'>,
    playerId: EntityId | null,
  ) {
    const { playerSheet, tickRate, simulation, renderer, logger } = deps;
    this.animation = new LegendAnimation(
      playerId,
      playerSheet?.atlasId ?? null,
      tickRate,
      simulation,
    );
    this.view = createLegendView({
      sheet: playerSheet,
      renderer,
      logger,
      frameOf: (entity) => this.animation.frame(entity, this.frameTick),
    });
  }

  /** Follows the player's Legend from one tick's snapshot to the next (walk row, facing). */
  public observe(previous: Snapshot | null, current: Snapshot): void {
    this.animation.observe(previous, current);
  }

  /** Sets the tick the next frame draws: the snapshot's tick plus the frame's `alpha`. */
  public setFrameTick(frameTick: number): void {
    this.frameTick = frameTick;
  }

  /** Releases the animation's event subscription with the match. */
  public destroy(): void {
    this.animation.destroy();
  }
}
