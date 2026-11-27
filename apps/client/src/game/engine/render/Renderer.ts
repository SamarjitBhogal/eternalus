import type {
  GlyphSpec,
  ScreenRect,
  SpriteRef,
  TextStyle,
  WorldPoint,
  WorldRect,
} from './Renderer.types';

/**
 * The display port (architecture 09 §4): everything views may ask of the screen. Views call
 * these methods with world positions and never see a canvas. `Canvas2dRenderer` is the only
 * implementation that touches `CanvasRenderingContext2D`; tests pass recording fakes.
 */
export interface Renderer {
  /**
   * Draws one atlas frame `width` world units wide, with the feet of its cell on `feet` (the
   * atlas's `groundOffset`); the height follows the shape of the atlas cell. Draws nothing when
   * `hasSprite(sprite)` is false.
   */
  drawSprite(sprite: SpriteRef, feet: WorldPoint, width: number): void;
  /** Whether `drawSprite` can draw `sprite`: the renderer holds its atlas, and the atlas has the frame. */
  hasSprite(sprite: SpriteRef): boolean;
  /**
   * How far the top of `sprite` stands above its feet when it is drawn `width` world units wide,
   * in world units (the atlas data: the cell's shape and its `groundOffset`); `null` when
   * `hasSprite(sprite)` is false.
   */
  spriteTop(sprite: SpriteRef, width: number): number | null;
  /** Sets the drawing area in device pixels and how many device pixels make one CSS pixel. */
  resize(screenWidth: number, screenHeight: number, pixelRatio?: number): void;
  /**
   * Shows one part of the world across the whole screen (or across `screenArea` when given),
   * like a zoomed-in camera: the one way to set what the world positions below map to.
   */
  showWorldArea(view: WorldRect, screenArea?: ScreenRect): void;
  /** Fills the whole screen with one colour. */
  clear(color: string): void;
  /** Fills a rectangle given in screen pixels. */
  fillScreenRect(area: ScreenRect, color: string): void;
  /** Outlines a rectangle given in screen pixels. `width` is the line width in pixels. */
  strokeScreenRect(area: ScreenRect, color: string, width: number): void;
  /** Runs `draw` with every drawing limited to the ellipse that fills `area` (screen pixels). */
  clipToEllipse(area: ScreenRect, draw: () => void): void;
  /** Fills a closed shape given in world units. Does nothing for an empty shape. */
  fillPolygon(points: readonly WorldPoint[], color: string): void;
  /** Draws a line through points given in world units. `width` is in screen pixels. */
  strokePath(points: readonly WorldPoint[], color: string, width: number): void;
  /** Draws a marker centred on a world position, sized in world units (scales with zoom). */
  drawWorldGlyph(glyph: GlyphSpec, center: WorldPoint, color: string): void;
  /** Draws a marker centred on a world position, sized in CSS pixels (minimap markers). */
  drawGlyph(glyph: GlyphSpec, center: WorldPoint, color: string): void;
  /** Draws one line of text centred on a world position: outline first, then the fill. */
  drawText(text: string, center: WorldPoint, style: TextStyle): void;
  /** Converts a world position to a screen position in device pixels. */
  toScreen(point: WorldPoint): WorldPoint;
  /** Releases the renderer. Owners must call this. */
  destroy(): void;
}
