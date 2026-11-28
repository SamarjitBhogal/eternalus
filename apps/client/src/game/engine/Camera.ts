import { BASE_ZOOM, MAX_ZOOM, MIN_ZOOM } from './Camera.constants';
import type { Viewport } from './Camera.types';
import type { WorldPoint, WorldRect } from './render/Renderer.types';

/**
 * Decides which part of the world is on screen. It looks at a centre point and shows a height of
 * the world set by its base size and zoom, and a width that keeps the screen's aspect (`fitTo`),
 * so a 4:3 screen shows a narrower world instead of a squashed one; it never shows anything
 * outside the world's edges. It can follow a target smoothly (the player's Legend), and converts
 * between world and screen positions for the same view the renderer draws (architecture 08 §5).
 */
export class Camera {
  private center: WorldPoint;
  private readonly baseHeight: number;
  private zoomLevel = BASE_ZOOM;
  private aspect: number;

  /**
   * Creates a camera looking at `center`, showing `visibleHeight` world units top to bottom and,
   * until `fitTo` shapes it like a screen, `visibleWidth` world units across.
   */
  public constructor(center: WorldPoint, visibleWidth: number, visibleHeight: number) {
    this.center = center;
    this.baseHeight = visibleHeight;
    this.aspect = visibleWidth / visibleHeight;
  }

  /**
   * Shapes the view like a screen `width` × `height` (any unit): the visible height stays, the
   * width follows the screen's aspect. Until it is called, the view keeps its base shape. A zero or
   * non-finite size is ignored.
   */
  public fitTo(width: number, height: number): void {
    const aspect = width / height;
    if (Number.isFinite(aspect) && aspect > 0) {
      this.aspect = aspect;
    }
  }

  /** The current zoom: 1 shows the base size, 2 shows half as much world. */
  public get zoom(): number {
    return this.zoomLevel;
  }

  /** How much of the world is visible left to right, in world units. */
  public get visibleWidth(): number {
    return (this.baseHeight * this.aspect) / this.zoomLevel;
  }

  /** How much of the world is visible top to bottom, in world units. */
  public get visibleHeight(): number {
    return this.baseHeight / this.zoomLevel;
  }

  /** Moves the camera to look at a new point, for example where the mini map was clicked. */
  public lookAt(center: WorldPoint): void {
    this.center = center;
  }

  /**
   * Moves part of the way toward `target`, for a smooth follow. Call once per frame.
   *
   * @param smoothing - Share of the remaining distance to cover, in (0, 1]; 1 jumps straight there.
   */
  public track(target: WorldPoint, smoothing: number): void {
    const share = Math.min(Math.max(smoothing, 0), 1);
    this.center = {
      x: this.center.x + (target.x - this.center.x) * share,
      y: this.center.y + (target.y - this.center.y) * share,
    };
  }

  /** Sets the zoom, kept between `MIN_ZOOM` and `MAX_ZOOM`. */
  public zoomTo(zoom: number): void {
    this.zoomLevel = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
  }

  /** Whether `point` is on screen (with `margin` world units of slack), for culling. */
  public contains(point: WorldPoint, worldWidth: number, worldHeight: number, margin = 0): boolean {
    const view = this.visibleArea(worldWidth, worldHeight);
    return (
      point.x >= view.x - margin &&
      point.x <= view.x + view.width + margin &&
      point.y >= view.y - margin &&
      point.y <= view.y + view.height + margin
    );
  }

  /** The screen position (device pixels) of a world position, for the view on screen. */
  public worldToScreen(point: WorldPoint, viewport: Viewport): WorldPoint {
    const view = this.visibleArea(viewport.worldWidth, viewport.worldHeight);
    return {
      x: ((point.x - view.x) * viewport.screenWidth) / view.width,
      y: ((point.y - view.y) * viewport.screenHeight) / view.height,
    };
  }

  // ponytail: no production caller since 54716be; delete it with its round-trip test at the
  // phase-exit /ponytail-debt pass.
  /** The world position under a screen position (device pixels), for clicks. */
  public screenToWorld(point: WorldPoint, viewport: Viewport): WorldPoint {
    const view = this.visibleArea(viewport.worldWidth, viewport.worldHeight);
    return {
      x: view.x + (point.x * view.width) / viewport.screenWidth,
      y: view.y + (point.y * view.height) / viewport.screenHeight,
    };
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
