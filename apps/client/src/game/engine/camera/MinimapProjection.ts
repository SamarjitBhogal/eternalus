import type { Renderer } from '../render/Renderer';
import type { ScreenRect, WorldPoint, WorldRect } from '../render/Renderer.types';

/**
 * One frame's minimap projection (06 §8): the square of world around `centre`, `radius` world
 * units to each side, north up, drawn across `screenArea` (device pixels). It sets the renderer
 * for the minimap's drawing and turns a click back into a world point, so the picture and the
 * click use the same numbers. Clicks arrive in device pixels, as for `MatchCamera.worldAt`.
 */
export class MinimapProjection {
  /** Creates the projection of the world around `centre` onto `screenArea`. */
  public constructor(
    public readonly centre: WorldPoint,
    private readonly radius: number,
    private readonly screenArea: ScreenRect,
  ) {}

  /** Makes the renderer draw the world around the centre across the screen area. */
  public apply(renderer: Renderer): void {
    renderer.showWorldArea(this.worldArea(), this.screenArea);
  }

  /** The world point drawn under a screen point (device pixels): the inverse of `apply`. */
  public worldAt(screenX: number, screenY: number): WorldPoint {
    const view = this.worldArea();
    const { x, y, width, height } = this.screenArea;
    return {
      x: view.x + ((screenX - x) * view.width) / width,
      y: view.y + ((screenY - y) * view.height) / height,
    };
  }

  /** The square of world units, side `2 · radius`, around the centre. */
  private worldArea(): WorldRect {
    const side = this.radius * 2;
    return {
      x: this.centre.x - this.radius,
      y: this.centre.y - this.radius,
      width: side,
      height: side,
    };
  }
}
