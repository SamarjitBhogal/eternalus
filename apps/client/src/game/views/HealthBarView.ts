import type { Renderer } from '../engine/render/Renderer';
import type { EntityDrawState } from './EntityView.types';
import {
  HEALTH_BAR_FILL_COLORS,
  HEALTH_BAR_GAP,
  HEALTH_BAR_HEIGHT,
  HEALTH_BAR_TRACK_COLOR,
  HEALTH_BAR_WIDTH_SCALE,
} from './HealthBarView.constants';
import type { HealthBarSide } from './HealthBarView.types';
import { rectangle } from './rectangle';

/**
 * Draws a unit's world health bar (DEC-195): a track centred over the unit's footprint, then the
 * health left (`health.current / health.max`) filled from the left in its side's colour. Which
 * units draw one is not this view's call: `EntityLayer` asks its injected rule.
 */
export class HealthBarView {
  /** Draws the bar of `state`'s entity for `side`; an entity without health or a place has none. */
  public draw(
    { entity, position }: EntityDrawState,
    side: HealthBarSide,
    renderer: Renderer,
  ): void {
    const { health, transform } = entity;
    if (health === null || transform === null) {
      return;
    }
    const width = transform.radius * 2 * HEALTH_BAR_WIDTH_SCALE;
    const x = position.x - width / 2;
    const y = position.y - transform.radius - HEALTH_BAR_GAP - HEALTH_BAR_HEIGHT;
    const left = (health.current / health.max) * width;
    renderer.fillPolygon(rectangle(x, y, width, HEALTH_BAR_HEIGHT), HEALTH_BAR_TRACK_COLOR);
    renderer.fillPolygon(rectangle(x, y, left, HEALTH_BAR_HEIGHT), HEALTH_BAR_FILL_COLORS[side]);
  }
}
