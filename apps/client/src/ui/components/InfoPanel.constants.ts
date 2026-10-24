import type { RenditionKey } from '../../bridge/catalogue.types';
import type { InfoPanelLayout } from './InfoPanel.types';

/** The detail rows a panel draws: the Figma has three slots (72:757, 62:94, 56:47). */
export const INFO_PANEL_ROW_COUNT = 3;

/**
 * The rendition of a detail icon per layout (I-45, §5.14): each is that use's exact box (the
 * primary staff at 45°, the alternate staff at −90°), so CSS never rotates or fits an icon.
 */
export const INFO_PANEL_ICON_RENDITIONS: Readonly<Record<InfoPanelLayout, RenditionKey>> = {
  class: 'detail-class',
  'class-alternate': 'detail-class-alt',
  legend: 'detail-legend',
};

/**
 * Fit-to-width panel titles (OD-21e): the title (72:750, 62:81, 56:34) is drawn at the Figma
 * 96 px while it fits its panel region; a longer one is scaled down to fit, never below 64 px.
 * `maxWidth` is the region's right edge minus the panel origin (§11.2 regions: class
 * (43, 128)–(529, 744) from x 45, alternate (63, 128)–(573, 738) from x 65, Legend
 * (53, 128)–(553, 738) from x 53).
 */
export const INFO_PANEL_TITLE_FIT: {
  readonly designSize: number;
  readonly minSize: number;
  readonly maxWidth: Readonly<Record<InfoPanelLayout, number>>;
} = {
  designSize: 96,
  minSize: 64,
  maxWidth: { class: 484, 'class-alternate': 508, legend: 500 },
};
