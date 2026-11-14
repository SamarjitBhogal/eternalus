import type { Renderer } from '../engine/render/Renderer';
import type { EntityDrawState, EntityView } from './EntityView.types';

/** A readable aether bolt with a short tapered light trail, drawn in world coordinates. */
export class StaffBoltView implements EntityView {
  /** Layers glow under a crisp core rather than using an expensive canvas shadow filter. */
  public draw({ entity, position }: EntityDrawState, renderer: Renderer): void {
    const shot = entity.projectile;
    if (shot === undefined) return;
    const dx = shot.destination.x - shot.origin.x,
      dy = shot.destination.y - shot.origin.y;
    const length = Math.hypot(dx, dy) || 1;
    renderer.strokePath(
      [{ x: position.x - (dx / length) * 1.5, y: position.y - (dy / length) * 1.5 }, position],
      entity.team === 'dark' ? '#ae72ff99' : '#78e8ff99',
      5,
    );
    renderer.drawWorldGlyph({ shape: 'dot', size: 0.7 }, position, '#e8dbff66');
    renderer.drawWorldGlyph({ shape: 'diamond', size: 0.3 }, position, '#fff5c4');
  }
  /** Small projectiles do not clutter the minimap. */
  public drawMinimap(): void {
    // Intentionally omitted: transient bolts are not strategic minimap markers.
  }
}
