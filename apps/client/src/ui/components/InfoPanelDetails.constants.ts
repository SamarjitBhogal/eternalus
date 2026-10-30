import type { RenditionKey } from '../../bridge/catalogue.types';
import type { InfoPanelLayout } from './InfoPanel.types';

/**
 * The detail rows each layout draws: the Figma's three slots on the class layouts (72:757, 62:94);
 * four on the Legend's, the Ultimate on top, then abilities 1 to 3 (DEC-65); View Details shows the
 * same rows (DEC-103).
 */
export const INFO_PANEL_ROW_COUNT: Readonly<Record<InfoPanelLayout, number>> = {
  class: 3,
  'class-alternate': 3,
  legend: 4,
  'class-details': 3,
  'legend-details': 4,
};

/**
 * The rendition of a detail icon per layout (I-45): each is that use's exact box (the
 * primary staff at 45°, the alternate staff at −90°), so CSS never rotates or fits an icon. View
 * Details reuses its panel's renditions, not 145:2's larger icons (a new size would be a new
 * rendition; the owner's "close is good enough", DEC-103).
 */
export const INFO_PANEL_ICON_RENDITIONS: Readonly<Record<InfoPanelLayout, RenditionKey>> = {
  class: 'detail-class',
  'class-alternate': 'detail-class-alt',
  legend: 'detail-legend',
  'class-details': 'detail-class',
  'legend-details': 'detail-legend',
};
