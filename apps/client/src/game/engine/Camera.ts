import type { WorldPoint, WorldRect } from './render/Renderer.types';

/**
 * Decides which part of the world is on screen. It looks at a centre point and shows a fixed
 * width and height of the world, and never shows anything outside the world's edges.
 */
export class Camera {
  private center: WorldPoint;
  private readonly visibleWidth: number;
  private readonly visibleHeight: number;

  /**
   * Creates a camera looking at `center`, showing `visibleWidth` world units across and
   * `visibleHeight` world units top to bottom.
   */
  public constructor(center: WorldPoint, visibleWidth: number, visibleHeight: number) {
    this.center = center;
    this.visibleWidth = visibleWidth;
    this.visibleHeight = visibleHeight;
  }

  /** Moves the camera to look at a new point, for example where the mini map was clicked. */
  public lookAt(center: WorldPoint): void {
    this.center = center;
  }

  /** The part of a world of the given size to show, kept inside the world's edges. */
  public visibleArea(worldWidth: number, worldHeight: number): WorldRect {
    return {
      x: Camera.clampStart(this.center.x, this.visibleWidth, worldWidth),
      y: Camera.clampStart(this.center.y, this.visibleHeight, worldHeight),
      width: this.visibleWidth,
      height: this.visibleHeight,
    };
  }

  /** Engine objects must be destroyable. The camera holds nothing, so this does nothing. */
  public destroy(): void {
    // Nothing to release yet.
  }

  /**
   * Where a view of `size` around `center` should start so it stays inside `worldSize`.
   * If the view is bigger than the world, it is centred on the world instead.
   */
  private static clampStart(center: number, size: number, worldSize: number): number {
    if (size >= worldSize) {
      return (worldSize - size) / 2;
    }
    return Math.min(Math.max(center - size / 2, 0), worldSize - size);
  }
}
