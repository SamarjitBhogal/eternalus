import { atlasWithFrame } from './atlasWithFrame';
import { FULL_TURN, GLYPH_OUTLINE_WIDTH, OUTLINED_GLYPHS } from './Canvas2dRenderer.constants';
import type {
  DrawContext,
  DrawSurface,
  GlyphHalfSize,
  GlyphTracer,
} from './Canvas2dRenderer.types';
import type { Renderer } from './Renderer';
import type {
  GlyphShape,
  GlyphSpec,
  ScreenRect,
  SpriteAtlas,
  SpriteRef,
  TextStyle,
  WorldPoint,
  WorldRect,
} from './Renderer.types';
import { spriteHeight, spriteTopOf } from './spriteMeasures';

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

  /**
   * Creates a renderer that draws through the given context, with the sprite atlases of its match
   * by manifest id (08 §6: constructor injection; the renderer never fetches).
   */
  public constructor(
    context: DrawContext,
    private atlases: Readonly<Record<string, SpriteAtlas>> = {},
  ) {
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

  /**
   * Creates a renderer for a canvas with the given sprite atlases, or returns `null` if 2D drawing
   * is unavailable.
   */
  public static fromCanvas(
    canvas: DrawSurface,
    atlases: Readonly<Record<string, SpriteAtlas>> = {},
  ): Canvas2dRenderer | null {
    const context = canvas.getContext('2d');
    return context === null ? null : new Canvas2dRenderer(context, atlases);
  }

  /** Whether `drawSprite` can draw `sprite`: an injected atlas holds the frame. */
  public hasSprite(sprite: SpriteRef): boolean {
    return atlasWithFrame(this.atlases, sprite) !== undefined;
  }

  /**
   * Draws one atlas frame `width` world units wide and as tall as the cell's shape gives, with the
   * feet of the cell (the atlas's `groundOffset`) on `feet`. One `drawImage` scales the source cell
   * with smoothing off (nearest neighbour), so pixel art stays sharp at every zoom; the context's
   * smoothing setting is restored afterwards. The screen box is rounded to whole pixels (08 §4).
   * Draws nothing when `hasSprite(sprite)` is false.
   */
  public drawSprite(sprite: SpriteRef, feet: WorldPoint, width: number): void {
    const atlas = atlasWithFrame(this.atlases, sprite);
    if (atlas === undefined) {
      return;
    }
    const cellWidth = atlas.image.width / atlas.columns;
    const cellHeight = atlas.image.height / atlas.rows;
    const drawWidth = Math.round(width * this.scaleX);
    const drawHeight = Math.round(spriteHeight(atlas, width) * this.scaleY);
    const at = this.toScreen(feet);
    const isSmoothing = this.context.imageSmoothingEnabled;
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(
      atlas.image,
      (sprite.frame % atlas.columns) * cellWidth,
      Math.floor(sprite.frame / atlas.columns) * cellHeight,
      cellWidth,
      cellHeight,
      Math.round(at.x - drawWidth / 2),
      Math.round(at.y - spriteTopOf(atlas, width) * this.scaleY),
      drawWidth,
      drawHeight,
    );
    this.context.imageSmoothingEnabled = isSmoothing;
  }

  /** How far the top of `sprite` stands above its feet at `width`; `null` without the sprite. */
  public spriteTop(sprite: SpriteRef, width: number): number | null {
    const atlas = atlasWithFrame(this.atlases, sprite);
    return atlas === undefined ? null : spriteTopOf(atlas, width);
  }

  /** Sets the drawing area in device pixels and how many device pixels make one CSS pixel. */
  public resize(screenWidth: number, screenHeight: number, pixelRatio = 1): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.pixelRatio = pixelRatio;
  }

  /**
   * Shows one part of the world across the whole screen, or across `screenArea` when given,
   * like a zoomed-in camera. If the area is not the same shape as the screen (or `screenArea`),
   * the world is stretched or squashed to fill it.
   */
  public showWorldArea(
    view: WorldRect,
    screenArea: ScreenRect = { x: 0, y: 0, width: this.screenWidth, height: this.screenHeight },
  ): void {
    this.scaleX = screenArea.width / view.width;
    this.scaleY = screenArea.height / view.height;
    this.offsetX = screenArea.x - view.x * this.scaleX;
    this.offsetY = screenArea.y - view.y * this.scaleY;
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

  /**
   * Runs `draw` with every drawing limited to the ellipse that fills `area` (screen pixels). The
   * context is restored afterwards, also when `draw` throws.
   */
  public clipToEllipse(area: ScreenRect, draw: () => void): void {
    const radiusX = area.width / 2;
    const radiusY = area.height / 2;
    this.context.save();
    this.context.beginPath();
    this.context.ellipse(area.x + radiusX, area.y + radiusY, radiusX, radiusY, 0, 0, FULL_TURN);
    this.context.clip();
    try {
      draw();
    } finally {
      this.context.restore();
    }
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

  /**
   * Draws one line of text centred on a world position: outline first, then the fill. Its height
   * is in world units (it scales with the zoom); the outline width is in CSS pixels.
   */
  public drawText(text: string, center: WorldPoint, style: TextStyle): void {
    const at = this.toScreen(center);
    const { context } = this;
    context.font = `${String(style.weight)} ${String(style.size * this.scaleY)}px ${style.font}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineJoin = 'round';
    context.strokeStyle = style.outline.color;
    context.lineWidth = style.outline.width * this.pixelRatio;
    context.strokeText(text, at.x, at.y);
    context.fillStyle = style.color;
    context.fillText(text, at.x, at.y);
  }

  /** Converts a world position to a screen position in device pixels. */
  public toScreen(point: WorldPoint): WorldPoint {
    return {
      x: this.offsetX + point.x * this.scaleX,
      y: this.offsetY + point.y * this.scaleY,
    };
  }

  /**
   * Releases the renderer: it drops its atlas references (the resource controller owns and closes
   * the bitmaps), so a destroyed renderer draws no sprite.
   */
  public destroy(): void {
    this.atlases = {};
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
