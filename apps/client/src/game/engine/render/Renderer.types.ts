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
  /**
   * Where the feet stand in each cell: their height above the cell's bottom edge, as a share of
   * the cell's height, from 0 to 1 (the sheet's manifest entry; 14 §11).
   */
  readonly groundOffset: number;
};

/** The grid part of an atlas: what `atlasWithFrame` checks a frame against. */
export type AtlasGrid = Pick<SpriteAtlas, 'columns' | 'rows'>;

/**
 * What the renderer measures a sprite with (`spriteMeasures.ts`): the grid, the feet and the image's
 * pixel size, which gives the shape of a cell.
 */
export type AtlasShape = AtlasGrid &
  Pick<SpriteAtlas, 'groundOffset'> & {
    readonly image: Pick<SpriteAtlas['image'], 'width' | 'height'>;
  };
