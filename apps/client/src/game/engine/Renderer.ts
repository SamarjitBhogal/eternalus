import type { DrawContext, ScreenRect, WorldPoint, WorldRect } from './Renderer.types';

/**
 * The only class that draws on the canvas. Callers pass positions in world units; the
 * renderer converts them to screen pixels. Left-right and up-down can be scaled separately,
 * so a view can show more of the world's height without showing more of its width.
 */
export class Renderer {
  private readonly context: DrawContext;
  private screenWidth = 0;
  private screenHeight = 0;
  private scaleX = 1;
  private scaleY = 1;
  private offsetX = 0;
  private offsetY = 0;

  /** Creates a renderer that draws through the given context. */
  public constructor(context: DrawContext) {
    this.context = context;
  }

  /** Creates a renderer for a canvas, or returns `null` if 2D drawing is unavailable. */
  public static fromCanvas(canvas: HTMLCanvasElement): Renderer | null {
    const context = canvas.getContext('2d');
    return context === null ? null : new Renderer(context);
  }

  /** Sets the size of the drawing area in screen pixels. */
  public resize(screenWidth: number, screenHeight: number): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  /** Scales and centres a world of the given size so all of it is visible on screen. */
  public fitWorld(worldWidth: number, worldHeight: number): void {
    this.fitWorldInArea(worldWidth, worldHeight, {
      x: 0,
      y: 0,
      width: this.screenWidth,
      height: this.screenHeight,
    });
  }

  /** Scales and centres a world of the given size inside one area of the screen. */
  public fitWorldInArea(worldWidth: number, worldHeight: number, area: ScreenRect): void {
    const scale = Math.min(area.width / worldWidth, area.height / worldHeight);
    this.scaleX = scale;
    this.scaleY = scale;
    this.offsetX = area.x + (area.width - worldWidth * scale) / 2;
    this.offsetY = area.y + (area.height - worldHeight * scale) / 2;
  }

  /**
   * Shows one part of the world across the whole screen, like a zoomed-in camera. If the area
   * is not the same shape as the screen, the world is stretched or squashed to fill it.
   */
  public showWorldArea(view: WorldRect): void {
    this.scaleX = this.screenWidth / view.width;
    this.scaleY = this.screenHeight / view.height;
    this.offsetX = -view.x * this.scaleX;
    this.offsetY = -view.y * this.scaleY;
  }

  /** Fills the whole screen with one colour. */
  public clear(color: string): void {
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.screenWidth, this.screenHeight);
  }

  /** Fills a rectangle given in screen pixels. */
  public fillScreenRect(area: ScreenRect, color: string): void {
    this.context.fillStyle = color;
    this.context.fillRect(area.x, area.y, area.width, area.height);
  }

  /** Outlines a rectangle given in screen pixels. `width` is the line width in pixels. */
  public strokeScreenRect(area: ScreenRect, color: string, width: number): void {
    this.context.strokeStyle = color;
    this.context.lineWidth = width;
    this.context.strokeRect(area.x, area.y, area.width, area.height);
  }

  /** Fills a closed shape given in world units. Does nothing for an empty shape. */
  public fillPolygon(points: readonly WorldPoint[], color: string): void {
    if (!this.tracePath(points)) {
      return;
    }
    this.context.closePath();
    this.context.fillStyle = color;
    this.context.fill();
  }

  /** Draws a line through points given in world units. `width` is in screen pixels. */
  public strokePath(points: readonly WorldPoint[], color: string, width: number): void {
    if (!this.tracePath(points)) {
      return;
    }
    this.context.strokeStyle = color;
    this.context.lineWidth = width;
    this.context.lineJoin = 'round';
    this.context.stroke();
  }

  /**
   * Fills a square centred on a world position. `size` is in world units. If the view is
   * stretched, the square is stretched with it.
   */
  public fillSquare(center: WorldPoint, size: number, color: string): void {
    const topLeft = this.toScreen({ x: center.x - size / 2, y: center.y - size / 2 });
    this.context.fillStyle = color;
    this.context.fillRect(topLeft.x, topLeft.y, size * this.scaleX, size * this.scaleY);
  }

  /** Converts a world position to a screen position. */
  public toScreen(point: WorldPoint): WorldPoint {
    return {
      x: this.offsetX + point.x * this.scaleX,
      y: this.offsetY + point.y * this.scaleY,
    };
  }

  /** Releases the renderer. It holds no resources yet, but owners must still call this. */
  public destroy(): void {
    this.screenWidth = 0;
    this.screenHeight = 0;
  }

  /** Starts a path through the points. Returns `false` if there were no points. */
  private tracePath(points: readonly WorldPoint[]): boolean {
    if (points.length === 0) {
      return false;
    }
    this.context.beginPath();
    points.forEach((point, index) => {
      const screen = this.toScreen(point);
      if (index === 0) {
        this.context.moveTo(screen.x, screen.y);
      } else {
        this.context.lineTo(screen.x, screen.y);
      }
    });
    return true;
  }
}
