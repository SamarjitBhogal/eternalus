/**
 * Geometry of the class row (62:146 in 62:125), shared by the crisp cards and the live halo:
 * where each slot puts a card and its glow copy, and the inline style that places a card root
 * at its integer floor (I-45). Slot positions are the Figma's; each plate's draw box is its
 * manifest entry's, read with its URL (`useAssetBox`).
 */
import type { CSSProperties } from 'react';

import type { RasterBox } from '../../bridge/catalogue.types';
import { cssVars } from '../components/cssVars';
import type { ClassCardLook, ClassCardTextOffsets, ClassSlot } from './classSelectLayout.types';
import { artBoxVars, offset, originRemainder, px } from './selectionGeometry';
import type { FramePoint } from './selectionGeometry.types';

/** Card centres on a 301 px pitch about x 1099 (647.5 / 948.5 / 1249.5 / 1550.5 for four). */
const ROW_CENTRE_X = 1099;
const SLOT_PITCH = 301;

/** Half widths (255 / 2; 62:152 sits 0.184 px right of its slot centre) and tops. */
const CARD_LEFT_OF_CENTRE: Readonly<Record<ClassCardLook, number>> = {
  idle: 127.5,
  picked: 143.485,
};
const CARD_TOP: Readonly<Record<ClassCardLook, number>> = { idle: 272, picked: 238 };

/** A glow copy's offset from its card: 62:196 − 62:162, 62:186 − 62:152 (62:200). */
const COPY_OFFSET: Readonly<Record<ClassCardLook, FramePoint>> = {
  idle: { x: -8, y: -16 },
  picked: { x: -9.015, y: -18 },
};

/** Where each look's art sits in its card: 62:164 − 62:162, 62:154 − 62:152. */
const CLASS_ART_INSET: Readonly<Record<ClassCardLook, FramePoint>> = {
  idle: { x: 4.18, y: 5.008 },
  picked: { x: 5.225, y: 5.644 },
};

const CENTRED: ClassCardTextOffsets = { name: 0, role: 0, allies: 0 };

const ALIGNED: FramePoint = { x: 0, y: 0 };

/**
 * 62:125's text centres off their card's centre, per slot of the four-card row (dc centres
 * 646.5 / 646 / 646, 947.5, 1249.12 / 1249.68 / 1249.12, 1550 / 1550.5 / 1550).
 */
const FIGMA_TEXT: readonly Readonly<Record<ClassCardLook, ClassCardTextOffsets>>[] = [
  { idle: { name: -1, role: -1.5, allies: -1.5 }, picked: CENTRED },
  { idle: { name: -1, role: 0, allies: 0 }, picked: CENTRED },
  { idle: CENTRED, picked: { name: -0.564, role: 0, allies: -0.564 } },
  { idle: { name: -0.5, role: 0, allies: -0.5 }, picked: CENTRED },
];

/**
 * 62:125's inner overlay nodes off their art nodes, per slot of the four-card row (62:177 0.859 px
 * right of 62:164, 62:176 aligned with 62:159, 62:178 0.616 px right of 62:154, 62:179 1.077 px
 * right of 62:149; OD-1); aligned in every look and row the Figma does not draw.
 */
const FIGMA_OVERLAY: readonly Readonly<Record<ClassCardLook, FramePoint>>[] = [
  { idle: { x: 0.859, y: 0.047 }, picked: ALIGNED },
  { idle: ALIGNED, picked: ALIGNED },
  { idle: ALIGNED, picked: { x: 0.616, y: 0.052 } },
  { idle: { x: 1.077, y: 0.047 }, picked: ALIGNED },
];

/**
 * `point` rounded to 4 decimals, finer than any Figma value: sums of Figma decimals land a hair
 * off (1106.015 − 9.015 = 1096.9999…), and a root's integer floor must not drop a pixel.
 */
const snapped = (point: FramePoint): FramePoint => ({
  x: Math.round(point.x * 1e4) / 1e4,
  y: Math.round(point.y * 1e4) / 1e4,
});

/**
 * Where slot `index` of a row of `count` classes puts its card and glow copy per look: centred
 * on the 301 px pitch (exact for the Figma's four; the picked card enlarged in place, its
 * neighbours fixed), with the Figma's own text and overlay offsets in the four-card row.
 */
export function classSlot(count: number, index: number): ClassSlot {
  const centreX = ROW_CENTRE_X + (index - (count - 1) / 2) * SLOT_PITCH;
  const card = (look: ClassCardLook): FramePoint => ({
    x: centreX - CARD_LEFT_OF_CENTRE[look],
    y: CARD_TOP[look],
  });
  return {
    card: { idle: snapped(card('idle')), picked: snapped(card('picked')) },
    copy: {
      idle: snapped(offset(card('idle'), COPY_OFFSET.idle)),
      picked: snapped(offset(card('picked'), COPY_OFFSET.picked)),
    },
    text: (count === FIGMA_TEXT.length ? FIGMA_TEXT[index] : undefined) ?? {
      idle: CENTRED,
      picked: CENTRED,
    },
    overlay: (count === FIGMA_OVERLAY.length ? FIGMA_OVERLAY[index] : undefined) ?? {
      idle: ALIGNED,
      picked: ALIGNED,
    },
  };
}

/** The art origin of a card at `cardOrigin` in `look`. */
export function classArtOrigin(cardOrigin: FramePoint, look: ClassCardLook): FramePoint {
  return snapped(offset(cardOrigin, CLASS_ART_INSET[look]));
}

/**
 * The inline style of a card or copy root at `origin` (I-45): the root at the integer floor,
 * `--card-fx`/`--card-fy` = the fractional remainder its text leaves carry, and the text
 * offsets `--name-dx`, `--role-dx`, `--allies-dx`.
 */
export function classCardStyle(
  origin: FramePoint,
  text: ClassCardTextOffsets = CENTRED,
): CSSProperties {
  const fraction = originRemainder(origin);
  return {
    left: Math.floor(origin.x),
    top: Math.floor(origin.y),
    ...cssVars({
      '--card-fx': px(fraction.x),
      '--card-fy': px(fraction.y),
      '--name-dx': px(text.name),
      '--role-dx': px(text.role),
      '--allies-dx': px(text.allies),
    }),
  };
}

/**
 * Plate mode's inline variables for a card at `origin` (I-45, OD-1): `--art-*` = the plate's
 * integer box relative to the root, and each 1 px stroke's offset in that box (the art node at
 * `artOrigin`, the overlay node at `overlayOrigin`) less the remainder ArchCard adds back.
 */
export function plateVars(
  origin: FramePoint,
  box: RasterBox,
  artOrigin: FramePoint,
  overlayOrigin: FramePoint,
): CSSProperties {
  const fraction = originRemainder(origin);
  const strokeX = (x: number): string => px(x - box.left - fraction.x);
  const strokeY = (y: number): string => px(y - box.top - fraction.y);
  return cssVars({
    ...artBoxVars(box, Math.floor(origin.x), Math.floor(origin.y)),
    '--art-stroke-x': strokeX(artOrigin.x),
    '--art-stroke-y': strokeY(artOrigin.y),
    '--overlay-stroke-x': strokeX(overlayOrigin.x),
    '--overlay-stroke-y': strokeY(overlayOrigin.y),
  });
}

/**
 * Cover mode's inline variables (OD-1's two strokes without a plate): `--overlay-dx`/`--overlay-dy`
 * = the overlay node's offset from the art node, by which the overlay's 1 px stroke (the
 * `inner-outline` layer) sits off the art's own stroke.
 */
export function overlayVars(overlay: FramePoint): CSSProperties {
  return cssVars({ '--overlay-dx': px(overlay.x), '--overlay-dy': px(overlay.y) });
}
