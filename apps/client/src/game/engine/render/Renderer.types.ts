/** A point in world units, as used by `@eternalus/core`. */
export type WorldPoint = { readonly x: number; readonly y: number };

/** A rectangle in screen pixels. `x`/`y` is the top-left corner. */
export type ScreenRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** A rectangle in world units. `x`/`y` is the top-left corner. */
export type WorldRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** The marker shapes the renderer can draw. `ring` is outlined; the others are filled. */
export type GlyphShape = 'dot' | 'square' | 'diamond' | 'ring';

/** A marker: its shape and its size (width and height). */
export type GlyphSpec = { readonly shape: GlyphShape; readonly size: number };

/**
 * How a line of world text looks: its font family and weight, its height in world units (it scales
 * with the zoom), its fill colour and an outline in CSS pixels that keeps it readable on any ground.
 */
export type TextStyle = {
  readonly font: string;
  readonly weight: number;
  readonly size: number;
  readonly color: string;
  readonly outline: { readonly color: string; readonly width: number };
};
/** Immutable atlas frame reference; bitmap ownership stays outside views. */
export type SpriteRef = { readonly atlasId: string; readonly frame: number };
/** A decoded uniform atlas injected into the renderer by the match factory. */
export type SpriteAtlas = {
  readonly image: ImageBitmap;
  readonly columns: number;
  readonly rows: number;
};
