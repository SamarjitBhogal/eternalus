import type { Renderer } from '../engine/render/Renderer';
import { AIM_SHAPE_PAINTERS } from './aimShapePainters';
import type { AimFrame, AimShapeOf, AimTarget, ShapePainters } from './AimOverlayView.types';
import type { WorldLayer } from './SceneView.types';

/**
 * The range overlay of an ability selected for aiming (DEC-209 (3)): the area of each of its
 * effect steps, drawn in the world around the player's Legend. A caster-centred ability shows a
 * circle on the caster whatever the pointer does; a dash shows its path from the caster toward the
 * pointer, as far as the dash will really go (a wall stops it), and the circles of the steps that
 * run at its end. `Match` builds what it shows (`AimTargeting`): the view only reads that target
 * and draws nothing without one (always the case in quick-cast mode). Each shape kind is one
 * painter (`AIM_SHAPE_PAINTERS`).
 */
export class AimOverlayView implements WorldLayer {
  private target: AimTarget | null = null;

  /** @param painters How each shape kind is drawn. */
  public constructor(private readonly painters: ShapePainters = AIM_SHAPE_PAINTERS) {}

  /** Sets what the next `draw` shows: the selected ability's `target`, or nothing for `null`. */
  public show(target: AimTarget | null): void {
    this.target = target;
  }

  /**
   * Draws the selected ability's areas, each distinct one once, in cast order. A dash's own row has
   * no area: it sets how long the paths after it are and where the circles after it sit.
   */
  public draw(renderer: Renderer): void {
    if (this.target === null) return;
    const { origin, direction, steps } = this.target;
    let frame: AimFrame = { origin, direction, circleCentre: origin, pathLength: null };
    const drawn = new Set<string>();
    for (const { shape, reach } of steps) {
      if (reach !== null) {
        frame = {
          ...frame,
          pathLength: reach,
          circleCentre: { x: origin.x + direction.x * reach, y: origin.y + direction.y * reach },
        };
      }
      if (shape === null) continue;
      const key = `${JSON.stringify(shape)}@${String(frame.circleCentre.x)},${String(frame.circleCentre.y)}`;
      if (!drawn.has(key)) {
        drawn.add(key);
        AimOverlayView.paint(this.painters, shape.kind, shape, frame, renderer);
      }
    }
  }

  /** The overlay is not on the minimap. */
  public drawMinimap(): void {
    // Nothing to draw: an aim is only meaningful in the main view.
  }

  /** Draws `shape` with the painter of its `kind`, typed by that kind. */
  private static paint<K extends keyof AimShapeOf>(
    painters: ShapePainters,
    kind: K,
    shape: AimShapeOf[K],
    frame: AimFrame,
    renderer: Renderer,
  ): void {
    painters[kind](shape, frame, renderer);
  }
}
