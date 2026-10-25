import type { FramePoint } from './selectionGeometry.types';

/** The two Legend card looks of 58:271: `picked` = the enlarged card (55:267), `idle` (55:268). */
export type LegendCardLook = 'idle' | 'picked';

/** How far a card's title and Legend name sit right of the left card's text geometry, in px. */
export type CardTextOffsets = { readonly title: number; readonly name: number };

/** Where one slot of the Legend row puts its crisp card and its refraction copy, per look. */
export type LegendSlot = {
  readonly card: Readonly<Record<LegendCardLook, FramePoint>>;
  readonly refraction: Readonly<Record<LegendCardLook, FramePoint>>;
  /** The crisp card's text offsets per look (the Figma's own where it has one, else none). */
  readonly text: Readonly<Record<LegendCardLook, CardTextOffsets>>;
};
