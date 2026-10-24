/**
 * Geometry of the Legend row (58:271), shared by the crisp cards and the live halo: where each
 * slot puts a card and its refraction copy, and where each Legend art rendition is drawn. Slot
 * positions are the Figma's; raster boxes are the WP-ASSETS placement table's (§5.13, the only
 * source of raster positions), keyed `<assetId>@<rendition>`.
 */
import type { CSSProperties } from 'react';

import type { AssetId, RenditionKey } from '../../bridge/catalogue.types';
import { cssVars } from '../components/cssVars';
import type {
  CardTextOffsets,
  FramePoint,
  LegendCardLook,
  LegendSlot,
  RasterBox,
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

/**
 * Each Legend art rendition's draw box in frame px, from the WP-ASSETS placement table: each file
 * bakes its art's fractional origin at its Figma slot (I-45), so it is drawn only there.
 */
const LEGEND_ART_BOXES: Readonly<Record<string, RasterBox>> = {
  // 58:360 slot 0 idle; 55:255 copy at slot 0; 61:20; 61:8 copy at slot 0.
  'catalyst-card-art@card-idle': { left: 505, top: 255, width: 266, height: 568 },
  'catalyst-card-art@card-picked': { left: 482, top: 210, width: 314, height: 660 },
  'catalyst-card-art@refraction-idle': { left: 485, top: 226, width: 305, height: 620 },
  'catalyst-card-art@refraction-picked': { left: 457, top: 181, width: 355, height: 699 },
  // 58:360 copy at slot 1; 55:255 (Figma state); 61:20 copy at slot 1; 61:8 (Figma state).
  'oracle-card-art@card-idle': { left: 826, top: 255, width: 266, height: 568 },
  'oracle-card-art@card-picked': { left: 803, top: 210, width: 315, height: 660 },
  'oracle-refraction-art@refraction-idle': { left: 806, top: 226, width: 305, height: 620 },
  'oracle-refraction-art@refraction-picked': { left: 778, top: 181, width: 355, height: 699 },
  // 58:365 slot 2 idle; 55:255 clone at slot 2; 61:14; 61:8 clone at slot 2.
  'necromancer-card-art@card-idle': { left: 1149, top: 256, width: 265, height: 567 },
  'necromancer-card-art@card-picked': { left: 1125, top: 210, width: 315, height: 660 },
  'necromancer-card-art@refraction-idle': { left: 1127, top: 227, width: 306, height: 619 },
  'necromancer-card-art@refraction-picked': { left: 1101, top: 181, width: 355, height: 699 },
};

/**
 * How far a rendition's integer box may sit from the art origin of the card drawing it: its floor,
 * or the Figma's own slip (61:14 sits 0.2 px off its copy's geometry, CD-17).
 */
const ART_BOX_TOLERANCE = 2;

/**
 * Where an art's rendition is drawn: its placement-table box, only when that box belongs to the
 * card drawing it (`artOrigin`, the look's art top-left in frame px). `undefined` when the table
 * has no box, or the box was baked for another slot (a reordered or re-laid-out row), so the
 * caller draws the art live instead of a raster detached from its card.
 */
export function legendArtBox(
  assetId: AssetId | null,
  rendition: RenditionKey,
  artOrigin: FramePoint,
): RasterBox | undefined {
  const box = assetId === null ? undefined : LEGEND_ART_BOXES[`${assetId}@${rendition}`];
  const isHere =
    box !== undefined &&
    Math.abs(box.left - artOrigin.x) < ART_BOX_TOLERANCE &&
    Math.abs(box.top - artOrigin.y) < ART_BOX_TOLERANCE;
  return isHere ? box : undefined;
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
