import type { Renderer } from '../engine/render/Renderer';
import type { WorldPoint } from '../engine/render/Renderer.types';
import { colorWithAlpha } from './colorWithAlpha';
import type { EntityDrawState } from './EntityView.types';
import { SWING_WEDGE } from './entityViews.constants';

/**
 * Draws the wedge of a Legend's last melee sweep (DEC-304): a polygon from the Legend's drawn
 * position out to the swing's radius over its arc, centred on the swing's direction. Its opacity
 * fades linearly from `SWING_WEDGE.startOpacity` at the swing's tick to nothing after
 * `SWING_WEDGE.fadeTicks`; it draws nothing for an entity that never swung or whose wedge has
 * faded. Draw it before the body, so the body stays on top.
 */
export const drawSwingWedge = (
  { entity, position, tick }: EntityDrawState,
  renderer: Renderer,
): void => {
  const { swing } = entity;
  if (swing === null) return;
  const { fadeTicks, arcSegments, color, startOpacity } = SWING_WEDGE;
  const age = tick - swing.atTick;
  if (age < 0 || age >= fadeTicks) return;
  const half = (swing.arcDegrees * Math.PI) / 360;
  const centre = Math.atan2(swing.direction.y, swing.direction.x);
  const arc = Array.from({ length: arcSegments + 1 }, (_, index): WorldPoint => {
    const angle = centre - half + (2 * half * index) / arcSegments;
    return {
      x: position.x + Math.cos(angle) * swing.radius,
      y: position.y + Math.sin(angle) * swing.radius,
    };
  });
  renderer.fillPolygon(
    [position, ...arc],
    colorWithAlpha(color, startOpacity * (1 - age / fadeTicks)),
  );
};
