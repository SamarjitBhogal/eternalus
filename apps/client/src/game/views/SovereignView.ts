import type { SovereignArtwork } from '../SovereignArtwork';
import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityDrawState } from './EntityView.types';

// Presentation size in world units, independent of the simulation collider.
const PORTRAIT_WIDTH = 7;
const PORTRAIT_HEIGHT = PORTRAIT_WIDTH * 1.12 * 0.88;

/** Projects the CSS King and reserves the space above it for its health bar. */
export class SovereignView extends DefaultEntityView {
  /** Receives the portrait surface and the match's roof visibility rule. */
  public constructor(
    private readonly artwork: Pick<SovereignArtwork, 'draw'>,
    private readonly isVisible: (point: WorldPoint) => boolean,
  ) {
    super();
  }

  /** Draws a living visible King at its interpolated match position. */
  public override draw(
    { entity, position }: EntityDrawState,
    renderer: Renderer,
  ): number | undefined {
    if ((entity.health?.current ?? 0) <= 0 || !this.isVisible(position)) return undefined;
    const feet = renderer.toScreen(position);
    const right = renderer.toScreen({ x: position.x + PORTRAIT_WIDTH, y: position.y });
    this.artwork.draw(entity.id, entity.team === 'dark', feet, right.x - feet.x);
    return PORTRAIT_HEIGHT;
  }
}
