import type { Renderer } from '../engine/render/Renderer';
import type { EntityDrawState, EntityView } from './EntityView.types';
import { ABILITY_ART as A } from './AbilityFieldView.constants';

/** A readable blade and fading triangular trail independent of its point-sized collision body. */
export class BladeView implements EntityView {
  /** Uses the real projectile position and direction from snapshots. */
  public draw({ entity, position, facing }: EntityDrawState, renderer: Renderer): void {
    const tail = {
      x: position.x - facing.x * A.bladeTrail,
      y: position.y - facing.y * A.bladeTrail,
    };
    const side = { x: (-facing.y * A.bladeSize) / 2, y: (facing.x * A.bladeSize) / 2 };
    renderer.fillPolygon(
      [
        position,
        { x: tail.x + side.x, y: tail.y + side.y },
        { x: tail.x - side.x, y: tail.y - side.y },
      ],
      A.beamFill,
    );
    renderer.drawWorldGlyph(
      { shape: 'diamond', size: A.bladeSize },
      position,
      entity.team === 'dark' ? A.dark : A.light,
    );
  }
  /** Projectiles are transient, not minimap units. */
  public drawMinimap(): void {
    return;
  }
}
