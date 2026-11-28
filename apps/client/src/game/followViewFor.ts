import { FOLLOW_VIEW_HEIGHT, FOLLOW_VIEW_WIDTH } from './Match.constants';
import { LEGEND_VISUAL_DIAMETER } from './views/entityViews.constants';

/**
 * The following camera's base view for a player whose sprite is `playerSpriteWidth` metres wide.
 * DEC-238 approved the `FOLLOW_VIEW_WIDTH` x `FOLLOW_VIEW_HEIGHT` view with a
 * `LEGEND_VISUAL_DIAMETER` Legend; the view zooms out by the player's sprite width over that size,
 * so the player's Legend looks the same size on screen for every class (DEC-424, card PR170
 * (15)). Without a player sprite width (an online Duel, no player), the approved view.
 */
export function followViewFor(playerSpriteWidth?: number): {
  readonly width: number;
  readonly height: number;
} {
  const zoomOut = (playerSpriteWidth ?? LEGEND_VISUAL_DIAMETER) / LEGEND_VISUAL_DIAMETER;
  return { width: FOLLOW_VIEW_WIDTH * zoomOut, height: FOLLOW_VIEW_HEIGHT * zoomOut };
}
