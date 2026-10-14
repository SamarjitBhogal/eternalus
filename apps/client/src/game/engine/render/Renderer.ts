import type { GlyphSpec, ScreenRect, WorldPoint, WorldRect } from './Renderer.types';

/**
 * The display port (architecture 09 §4): everything views may ask of the screen. Views call
 * these methods with world positions and never see a canvas. `Canvas2dRenderer` is the only
 * implementation that touches `CanvasRenderingContext2D`; tests pass recording fakes.
 */
export interface Renderer {
  /** Sets the drawing area in device pixels and how many device pixels make one CSS pixel. */
  resize(screenWidth: number, screenHeight: number, pixelRatio?: number): void;
  /** Scales and centres a world of the given size so all of it is visible on screen. */
  fitWorld(worldWidth: number, worldHeight: number): void;
  /** Scales and centres a world of the given size inside one area of the screen. */
  fitWorldInArea(worldWidth: number, worldHeight: number, area: ScreenRect): void;
  /** Shows one part of the world across the whole screen, like a zoomed-in camera. */
  showWorldArea(view: WorldRect): void;
  /** Fills the whole screen with one colour. */
  clear(color: string): void;
  /** Fills a rectangle given in screen pixels. */
  fillScreenRect(area: ScreenRect, color: string): void;
  /** Outlines a rectangle given in screen pixels. `width` is the line width in pixels. */
  strokeScreenRect(area: ScreenRect, color: string, width: number): void;
  /** Fills a closed shape given in world units. Does nothing for an empty shape. */
  fillPolygon(points: readonly WorldPoint[], color: string): void;
  /** Fills a collection of polygons in one colour, allowing adapters to batch the draw. */
  fillPolygons(shapes: readonly (readonly WorldPoint[])[], color: string): void;
  /** Reuses a presentation layer until its revision or drawing-area size changes. */
  drawCachedLayer(key: object, revision: number, draw: () => void): void;
  /** Draws a line through points given in world units. `width` is in screen pixels. */
  strokePath(points: readonly WorldPoint[], color: string, width: number): void;
  /** Draws a marker centred on a world position, sized in world units (scales with zoom). */
  drawWorldGlyph(glyph: GlyphSpec, center: WorldPoint, color: string): void;
  /** Draws a marker centred on a world position, sized in CSS pixels (minimap markers). */
  drawGlyph(glyph: GlyphSpec, center: WorldPoint, color: string): void;
  /** Converts a world position to a screen position in device pixels. */
  toScreen(point: WorldPoint): WorldPoint;
  /** Releases the renderer. Owners must call this. */
  destroy(): void;
}
