/** A position or direction in world units. */
export type Vec2 = {
  readonly x: number;
  readonly y: number;
};

/** An axis-aligned rectangle in world units. `x`/`y` is the top-left corner. */
export type Rect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** A closed shape made of points in order. The last point connects back to the first. */
export type Polygon = readonly Vec2[];
