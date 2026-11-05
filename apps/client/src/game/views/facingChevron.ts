import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import type { EntityDrawState } from './EntityView.types';
import { FACING_CHEVRON } from './entityViews.constants';

/**
 * Draws a unit's facing chevron (DEC-192) in the main view: one gold line from the tip in front
 * of the unit back along both arms, joined by an arc around the unit's centre. Sized in unit
 * radii (`FACING_CHEVRON`); draws nothing for an entity without a transform.
 */
export const drawFacingChevron = (
  { entity, position, facing }: EntityDrawState,
  renderer: Renderer,
): void => {
  const radius = entity.transform?.radius;
  if (radius === undefined) return;
  const { base, tip, halfWidth, arcSegments, color, lineWidth } = FACING_CHEVRON;
  // `forward` along the facing, `side` across it (the facing turned a quarter), in unit radii.
  const at = (forward: number, side: number): WorldPoint => ({
    x: position.x + (facing.x * forward - facing.y * side) * radius,
    y: position.y + (facing.y * forward + facing.x * side) * radius,
  });
  const arcRadius = Math.hypot(base, halfWidth);
  const arc = Array.from({ length: arcSegments + 1 }, (_, index) => {
    const side = halfWidth - (2 * halfWidth * index) / arcSegments;
    const onArc = arcRadius / Math.hypot(base, side);
    return at(base * onArc, side * onArc);
  });
  renderer.strokePath([at(tip, 0), ...arc, at(tip, 0)], color, lineWidth);
};
