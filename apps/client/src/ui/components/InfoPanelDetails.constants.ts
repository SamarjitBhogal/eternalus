import type { RenditionKey } from '../../bridge/catalogue.types';
import type { InfoPanelLayout } from './InfoPanel.types';

/** The detail rows a panel draws: the Figma has three slots (72:757, 62:94, 56:47). */
export const INFO_PANEL_ROW_COUNT = 3;

/**
 * The rendition of a detail icon per layout (I-45): each is that use's exact box (the
 * primary staff at 45°, the alternate staff at −90°), so CSS never rotates or fits an icon.
 */
export const INFO_PANEL_ICON_RENDITIONS: Readonly<Record<InfoPanelLayout, RenditionKey>> = {
  class: 'detail-class',
  'class-alternate': 'detail-class-alt',
  legend: 'detail-legend',
};
