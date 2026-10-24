/**
 * Geometry of the Legend row (58:271), shared by the crisp cards and the live halo: where each
 * slot puts a card and its refraction copy, and the inline style that places a card root and its
 * art. Slot positions are the Figma's; each art rendition's draw box is its manifest entry's,
 * read with its URL (`useAssetBox`).
 */
import type { CSSProperties } from 'react';

import type { RasterBox } from '../../bridge/catalogue.types';
import { cssVars } from '../components/cssVars';
import type {
  CardTextOffsets,
  FramePoint,
  LegendCardLook,
  LegendSlot,
} from './legendSelectLayout.types';

/** The row's centre and its mean slot pitch (321.33 left, 322.33 right; SUB P3) for 1, 2 or 4+. */
const ROW_CENTRE_X = 960;
const SLOT_PITCH = 321.83;

/** Card half widths (275.34 / 2, 336 / 2) and tops (55:268 y 250, 55:267 y 194). */
const CARD_HALF_WIDTH: Readonly<Record<LegendCardLook, number>> = { idle: 137.67, picked: 168 };
const CARD_TOP: Readonly<Record<LegendCardLook, number>> = { idle: 250, picked: 194 };

/** A refraction copy's offset from its crisp card: 61:17 − 55:268 and 61:4 − 55:267. */
const REFRACTION_OFFSET: Readonly<Record<LegendCardLook, FramePoint>> = {
  idle: { x: -21, y: -29 },
  picked: { x: -26, y: -29 },
};

/** Text on the left card's geometry: 55:259 / 55:260 centred 137.29 / 137.4 into the card. */
const NO_TEXT_OFFSETS: CardTextOffsets = { title: 0, name: 0 };

/** `point` moved by `by`. */
export const offset = (point: FramePoint, by: FramePoint): FramePoint => ({
  x: point.x + by.x,
  y: point.y + by.y,
});

/** A slot centred on `centreX`, every card and copy at the left card's geometry (CD-17). */
function slotAt(centreX: number): LegendSlot {
  const card = (look: LegendCardLook): FramePoint => ({
    x: centreX - CARD_HALF_WIDTH[look],
    y: CARD_TOP[look],
  });
  return {
    card: { idle: card('idle'), picked: card('picked') },
    refraction: {
      idle: offset(card('idle'), REFRACTION_OFFSET.idle),
      picked: offset(card('picked'), REFRACTION_OFFSET.picked),
    },
    text: { idle: NO_TEXT_OFFSETS, picked: NO_TEXT_OFFSETS },
  };
}

/** The Figma right slot's card on its own geometry (55:269 at y 250.62, its copy 61:11). */
const FIGMA_RIGHT = slotAt(1282.33);

/**
 * The Figma's own three slots (55:268 / 55:267 / 55:269 centres). The right card sits 0.62 px
 * lower, its copy at 61:11, and its texts off the left card's (55:261 centre 137.08 into the card,
 * 55:262 137.9): a half-pixel name offset is a 1 px shift in Chrome's snapped text.
 */
const FIGMA_ROW: readonly LegendSlot[] = [
  slotAt(638.67),
  slotAt(960),
  {
    card: { ...FIGMA_RIGHT.card, idle: { x: 1144.66, y: 250.62 } },
    refraction: { ...FIGMA_RIGHT.refraction, idle: { x: 1123, y: 222 } },
    text: { ...FIGMA_RIGHT.text, idle: { title: -0.21, name: 0.5 } },
  },
];

/**
 * Where slot `index` of a row of `count` Legends puts its card and refraction copy: the Figma's
 * slots for three (enlarged in place, neighbours fixed; SUB P1), otherwise slots on the mean pitch
 * centred on the artboard (1–2 Legends, CD-14).
 */
export function legendSlot(count: number, index: number): LegendSlot {
  const figmaSlot = count === FIGMA_ROW.length ? FIGMA_ROW[index] : undefined;
  return figmaSlot ?? slotAt(ROW_CENTRE_X + (index - (count - 1) / 2) * SLOT_PITCH);
}

const px = (value: number): string => `${String(value)}px`;
/** Remainders to 4 decimals, finer than any Figma value they come from. */
const remainder = (value: number): string => px(Number((value - Math.floor(value)).toFixed(4)));

/**
 * The inline style of a card or copy root at `origin` (I-45): the root at the integer floor,
 * `--card-fx`/`--card-fy` = the fractional remainder its text leaves are moved by, the text's own
 * `--title-dx`/`--name-dx`, and, with an `artBox`, `--art-left/-top/-width/-height` = that raster's
 * integer box relative to the root.
 */
export function legendCardStyle(
  origin: FramePoint,
  artBox: RasterBox | undefined,
  text: CardTextOffsets = NO_TEXT_OFFSETS,
): CSSProperties {
  const left = Math.floor(origin.x);
  const top = Math.floor(origin.y);
  const art =
    artBox === undefined
      ? {}
      : {
          '--art-left': px(artBox.left - left),
          '--art-top': px(artBox.top - top),
          '--art-width': px(artBox.width),
          '--art-height': px(artBox.height),
        };
  return {
    left,
    top,
    ...cssVars({
      '--card-fx': remainder(origin.x),
      '--card-fy': remainder(origin.y),
      '--title-dx': px(text.title),
      '--name-dx': px(text.name),
      ...art,
    }),
  };
}

/** The remainder of `origin` past its integer floor, for `ArchCard`'s own `origin` (I-45). */
export function originRemainder(origin: FramePoint): FramePoint {
  return { x: origin.x - Math.floor(origin.x), y: origin.y - Math.floor(origin.y) };
}
