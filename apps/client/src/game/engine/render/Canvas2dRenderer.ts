import {
  FULL_TURN,
  GLYPH_OUTLINE_WIDTH,
  OUTLINED_GLYPHS,
  SURFACE_PIXELS_PER_UNIT,
} from './Canvas2dRenderer.constants';
import type {
  CachedLayer,
  CachedSurface,
  DrawContext,
  GlyphHalfSize,
  GlyphTracer,
} from './Canvas2dRenderer.types';
import type { Renderer } from './Renderer';
import type { GlyphShape, GlyphSpec, ScreenRect, WorldPoint, WorldRect } from './Renderer.types';

/**
 * The Canvas 2D implementation of the `Renderer` port and the only class that touches
 * `CanvasRenderingContext2D`. Callers pass positions in world units; the renderer converts
 * them to screen pixels. Left-right and up-down can be scaled separately, so a view can show
 * more of the world's height without showing more of its width.
 */
export class Canvas2dRenderer implements Renderer {
  private context: DrawContext;
  private readonly layerCache = new WeakMap<object, CachedLayer>();
  private screenWidth = 0;
  private screenHeight = 0;
  private scaleX = 1;
  private scaleY = 1;
  private offsetX = 0;
  private offsetY = 0;
  private pixelRatio = 1;
  private readonly polygonBounds = new WeakMap<readonly WorldPoint[], ScreenRect>();
  private readonly surfaceCache = new WeakMap<readonly (readonly WorldPoint[])[], CachedSurface>();
  /** How each glyph shape is traced. A new shape is one entry here, never a branch in code. */
  private readonly glyphTracers: Readonly<Record<GlyphShape, GlyphTracer>>;

  /** Creates a renderer that draws through the given context. */
  public constructor(context: DrawContext) {
    this.context = context;
    const ellipse: GlyphTracer = (center, halfWidth, halfHeight) => {
      this.context.ellipse(center.x, center.y, halfWidth, halfHeight, 0, 0, FULL_TURN);
    };
    this.glyphTracers = {
      dot: ellipse,
      ring: ellipse,
      square: (center, halfWidth, halfHeight) => {
        this.context.rect(
          center.x - halfWidth,
          center.y - halfHeight,
          halfWidth * 2,
          halfHeight * 2,
        );
      },
      diamond: (center, halfWidth, halfHeight) => {
        this.context.moveTo(center.x, center.y - halfHeight);
        this.context.lineTo(center.x + halfWidth, center.y);
        this.context.lineTo(center.x, center.y + halfHeight);
        this.context.lineTo(center.x - halfWidth, center.y);
        this.context.closePath();
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
    if (this.isOutside(points)) return;
    if (!this.tracePath(points)) {
      return;
    }
    this.context.closePath();
    this.context.fillStyle = color;
    this.context.fill();
  }

  /** Batches same-colour detail into one fill without changing its world coordinates. */
  public fillPolygons(shapes: readonly (readonly WorldPoint[])[], color: string): void {
    if (typeof OffscreenCanvas !== 'undefined' && shapes.length > 0) {
      const surface = this.surfaceCache.get(shapes) ?? this.rasterize(shapes, color);
      if (surface !== undefined) {
        this.surfaceCache.set(shapes, surface);
        const origin = this.toScreen(surface.bounds);
        this.context.drawImage(
          surface.image,
          origin.x,
          origin.y,
          surface.bounds.width * this.scaleX,
          surface.bounds.height * this.scaleY,
        );
        return;
      }
    }
    this.context.beginPath();
    let hasShape = false;
    for (const points of shapes) {
      if (points.length === 0 || this.isOutside(points)) continue;
      points.forEach((point, index) => {
        const screen = this.toScreen(point);
        if (index === 0) this.context.moveTo(screen.x, screen.y);
        else this.context.lineTo(screen.x, screen.y);
      });
      this.context.closePath();
      hasShape = true;
    }
    if (hasShape) {
      this.context.fillStyle = color;
      this.context.fill();
    }
  }

  /** Caches static scenery while allowing live entities and camera outlines to draw normally. */
  public drawCachedLayer(key: object, revision: number, draw: () => void): void {
    if (
      typeof OffscreenCanvas === 'undefined' ||
      this.screenWidth === 0 ||
      this.screenHeight === 0
    ) {
      draw();
      return;
    }
    let layer = this.layerCache.get(key);
    if (
      layer?.revision !== revision ||
      layer.width !== this.screenWidth ||
      layer.height !== this.screenHeight
    ) {
      const image = new OffscreenCanvas(this.screenWidth, this.screenHeight);
      const context = image.getContext('2d');
      if (context === null) {
        draw();
        return;
      }
      const destination = this.context;
      this.context = context;
      try {
        draw();
      } finally {
        this.context = destination;
      }
      layer = { image, revision, width: this.screenWidth, height: this.screenHeight };
      this.layerCache.set(key, layer);
    }
    this.context.drawImage(layer.image, 0, 0);
  }

  private rasterize(
    shapes: readonly (readonly WorldPoint[])[],
    color: string,
  ): CachedSurface | undefined {
    const points = shapes.flat();
    if (points.length === 0) return undefined;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const width = Math.max(...xs) - x;
    const height = Math.max(...ys) - y;
    const density = SURFACE_PIXELS_PER_UNIT;
    const image = new OffscreenCanvas(
      Math.max(1, Math.ceil(width * density)),
      Math.max(1, Math.ceil(height * density)),
    );
    const context = image.getContext('2d');
    if (context === null) return undefined;
    context.fillStyle = color;
    context.beginPath();
    for (const shape of shapes) {
      shape.forEach((p, i) => {
        if (i === 0) context.moveTo((p.x - x) * density, (p.y - y) * density);
        else context.lineTo((p.x - x) * density, (p.y - y) * density);
      });
      context.closePath();
    }
    context.fill();
    return { image, bounds: { x, y, width, height } };
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

  private isOutside(points: readonly WorldPoint[]): boolean {
    if (points.length === 0 || this.screenWidth === 0 || this.screenHeight === 0) return false;
    let bounds = this.polygonBounds.get(points);
    if (bounds === undefined) {
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      bounds = { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
      this.polygonBounds.set(points, bounds);
    }
    const a = this.toScreen(bounds);
    const b = this.toScreen({ x: bounds.x + bounds.width, y: bounds.y + bounds.height });
    return b.x < 0 || b.y < 0 || a.x > this.screenWidth || a.y > this.screenHeight;
  }
}
