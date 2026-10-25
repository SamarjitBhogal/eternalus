import type { FramePoint } from './selectionGeometry.types';

/** The two class card looks of 62:125: `picked` = the enlarged card (62:152, ×1.12682), `idle` (62:162). */
export type ClassCardLook = 'idle' | 'picked';

/** How far a card's name, role and ally lines sit right of the card's centre, in px. */
export type ClassCardTextOffsets = {
  readonly name: number;
  readonly role: number;
  readonly allies: number;
};

/** Where one slot of the class row puts its crisp card and its glow copy, per look. */
export type ClassSlot = {
  readonly card: Readonly<Record<ClassCardLook, FramePoint>>;
  readonly copy: Readonly<Record<ClassCardLook, FramePoint>>;
  readonly text: Readonly<Record<ClassCardLook, ClassCardTextOffsets>>;
  /** The inner GLASS overlay node's offset from the card's art node, in px (OD-1). */
  readonly overlay: Readonly<Record<ClassCardLook, FramePoint>>;
};
