/**
 * The HUD ring the minimap is drawn inside, in design pixels of `frame` (I-68). `Match` passes the
 * one value `bridge/minimapRing.ts` holds, so the canvas map and the DOM ring (`MinimapPanel`)
 * always agree; views import nothing from `bridge/`. At a screen size the ring scales by
 * `min(width / frame.width, height / frame.height)` and keeps its distance from the top-right
 * corner.
 */
export type MiniMapRing = {
  /** The frame the ring is designed in (Figma 62:231: 1920 × 1080). */
  readonly frame: { readonly width: number; readonly height: number };
  /** The ring's ellipse box, measured from the frame's top-right corner. */
  readonly box: {
    readonly right: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  /** The ring's inside stroke width; the map is drawn inside it. */
  readonly strokeWidth: number;
};
