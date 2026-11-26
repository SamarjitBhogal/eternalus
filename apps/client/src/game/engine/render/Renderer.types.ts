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
 * One frame of a sprite atlas: the atlas's manifest id and the cell index, row by row from the
 * top-left cell (0). Views name frames; the renderer holds the bitmaps.
 */
export type SpriteRef = { readonly atlasId: string; readonly frame: number };

/**
 * A decoded atlas cut into a uniform grid of `columns` x `rows` cells. The match factory injects
 * the atlases into the renderer's constructor (08 §6); the resource controller owns the bitmap.
 */
export type SpriteAtlas = {
  readonly image: ImageBitmap;
  readonly columns: number;
  readonly rows: number;
};

/** The grid part of an atlas: what `atlasWithFrame` checks a frame against. */
export type AtlasGrid = Pick<SpriteAtlas, 'columns' | 'rows'>;
