import type { InfoPanelLayout } from './InfoPanel.types';

/**
 * Fit-to-width panel titles (OD-21e): the title (72:750, 62:81, 56:34) is drawn at the Figma
 * 96 px while it fits its panel region; a longer one is scaled down to fit, never below 64 px.
 * `maxWidth` is the region's right edge minus the panel origin (CD-36 panel regions: class
 * (43, 128)–(529, 744) from x 45, alternate (63, 128)–(573, 738) from x 65, Legend
 * (53, 128)–(553, 738) from x 53; View Details' left column, 145:96's right edge 676 from x 116).
 */
export const INFO_PANEL_TITLE_FIT: {
  readonly designSize: number;
  readonly minSize: number;
  readonly maxWidth: Readonly<Record<InfoPanelLayout, number>>;
} = {
  designSize: 96,
  minSize: 64,
  maxWidth: {
    class: 484,
    'class-alternate': 508,
    legend: 500,
    'class-details': 560,
    'legend-details': 560,
  },
};
