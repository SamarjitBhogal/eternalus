import { FULL_TURN, GLYPH_OUTLINE_WIDTH, OUTLINED_GLYPHS } from './Canvas2dRenderer.constants';
import type { DrawContext, GlyphHalfSize, GlyphTracer } from './Canvas2dRenderer.types';
import type { Renderer } from './Renderer';
import type { GlyphShape, GlyphSpec, ScreenRect, WorldPoint, WorldRect } from './Renderer.types';

/**
 * The Canvas 2D implementation of the `Renderer` port and the only class that touches
 * `CanvasRenderingContext2D`. Callers pass positions in world units; the renderer converts
 * them to screen pixels. Left-right and up-down can be scaled separately, so a view can show
 * more of the world's height without showing more of its width.
 */
export class Canvas2dRenderer implements Renderer {
  private readonly context: DrawContext;
  private screenWidth = 0;
  private screenHeight = 0;
  private scaleX = 1;
  private scaleY = 1;
  private offsetX = 0;
  private offsetY = 0;
  private pixelRatio = 1;
  /** How each glyph shape is traced. A new shape is one entry here, never a branch in code. */
  private readonly glyphTracers: Readonly<Record<GlyphShape, GlyphTracer>>;

  /** Creates a renderer that draws through the given context. */
  public constructor(context: DrawContext) {
    this.context = context;
    const ellipse: GlyphTracer = (center, halfWidth, halfHeight) => {
      context.ellipse(center.x, center.y, halfWidth, halfHeight, 0, 0, FULL_TURN);
    };
    this.glyphTracers = {
      dot: ellipse,
      ring: ellipse,
      square: (center, halfWidth, halfHeight) => {
        context.rect(center.x - halfWidth, center.y - halfHeight, halfWidth * 2, halfHeight * 2);
      },
      diamond: (center, halfWidth, halfHeight) => {
        context.moveTo(center.x, center.y - halfHeight);
        context.lineTo(center.x + halfWidth, center.y);
        context.lineTo(center.x, center.y + halfHeight);
        context.lineTo(center.x - halfWidth, center.y);
        context.closePath();
      },
    };
  }

  /** Creates a renderer for a canvas, or returns `null` if 2D drawing is unavailable. */
  public static fromCanvas(canvas: HTMLCanvasElement): Canvas2dRenderer | null {
    const context = canvas.getContext('2d');
    return context === null ? null : new Canvas2dRenderer(context);
  }

  /** Sets the drawing area in device pixels and how many device pixels make one CSS pixel. */
  public resize(screenWidth: number, screenHeight: number, pixelRatio = 1): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.pixelRatio = pixelRatio;
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

  /** Draws a marker centred on a world position, sized in world units (scales with zoom). */
  public drawWorldGlyph(glyph: GlyphSpec, center: WorldPoint, color: string): void {
    const half = glyph.size / 2;
    this.paintGlyph(
      glyph,
      center,
      { width: half * this.scaleX, height: half * this.scaleY },
      color,
    );
  }

  /** Draws a marker centred on a world position, sized in CSS pixels (minimap markers). */
  public drawGlyph(glyph: GlyphSpec, center: WorldPoint, color: string): void {
    const half = (glyph.size / 2) * this.pixelRatio;
    this.paintGlyph(glyph, center, { width: half, height: half }, color);
  }

  /** Converts a world position to a screen position in device pixels. */
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

  /** Traces the glyph's shape at the centre's screen position, then fills or outlines it. */
  private paintGlyph(
    glyph: GlyphSpec,
    center: WorldPoint,
    half: GlyphHalfSize,
    color: string,
  ): void {
    this.context.beginPath();
    this.glyphTracers[glyph.shape](this.toScreen(center), half.width, half.height);
    if (OUTLINED_GLYPHS.has(glyph.shape)) {
      this.context.strokeStyle = color;
      this.context.lineWidth = GLYPH_OUTLINE_WIDTH * this.pixelRatio;
      this.context.stroke();
    } else {
      this.context.fillStyle = color;
      this.context.fill();
    }
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
