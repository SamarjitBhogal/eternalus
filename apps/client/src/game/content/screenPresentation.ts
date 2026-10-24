// Screen-level presentation and the display switches (O5, OA1, OA2): each switch is a content
// value published on `DisplayCatalogue`, with the Figma original as the default (I-80, I-81).
import type {
  AssetId,
  BackgroundSet,
  ClassSelectLayout,
  ContrastMode,
  EffectsRenderer,
} from '../../bridge/catalogue.types';
import type { CataloguePresentation } from './CataloguePresentation.types';
import {
  CLASS_PRESENTATION,
  LOCKED_CLASS_PRESENTATION,
  SPEC_PRESENTATION,
} from './classPresentation';
import { HUD_PRESENTATION } from './hudPresentation';

/**
 * One set per team, coloured by token names only. The selection sets draw the Figma backdrop
 * (62:130, the same for both teams; the screens draw the vignettes themselves).
 */
const BACKGROUND_SETS: readonly BackgroundSet[] = [
  {
    id: 'menu-neutral',
    team: 'neutral',
    layers: [
      { kind: 'gradient', angleDeg: 160, stops: ['--surface-0', '--team-neutral-accent'] },
      { kind: 'particles', count: 24, colourToken: '--team-neutral-primary' },
    ],
  },
  {
    id: 'selection-light',
    team: 'light',
    layers: [{ kind: 'image', assetId: 'selection-backdrop' }],
  },
  {
    id: 'selection-dark',
    team: 'dark',
    layers: [{ kind: 'image', assetId: 'selection-backdrop' }],
  },
];

/** The profile screen's themed name (docs/reference/suggestions/naming.md, a working name). */
const PROFILE_DISPLAY_NAME = 'Chronicle';
/** O5: the class step's layout; `'alternate'` draws 62:70. */
const CLASS_SELECT_LAYOUT: ClassSelectLayout = 'primary';
/** The skull banner behind "Legend Selection" (62:144). */
const SELECTION_BANNER_ASSET_ID: AssetId = 'selection-banner';
/** The Figma-state chrome of Select Class (62:222). */
const SELECT_CLASS_CHROME_ASSET_ID: AssetId = 'select-class-chrome';
/** The Figma-state chrome of LOCK IN (58:277). */
const LOCK_IN_CHROME_ASSET_ID: AssetId = 'lock-in-chrome';
/** OA1: the R1 plates draw the Figma effects; `'css'` draws the live CSS path (I-80). */
const EFFECTS_RENDERER: EffectsRenderer = 'figma-raster';
/** OA2: the Figma colours; `'minimums'` swaps only the below-minimum tokens (I-81). */
const CONTRAST_MODE: ContrastMode = 'figma';

/** Everything the client adds to core display content. */
export const CATALOGUE_PRESENTATION: CataloguePresentation = {
  classes: CLASS_PRESENTATION,
  lockedClasses: LOCKED_CLASS_PRESENTATION,
  specs: SPEC_PRESENTATION,
  backgroundSets: BACKGROUND_SETS,
  profileDisplayName: PROFILE_DISPLAY_NAME,
  classSelectLayout: CLASS_SELECT_LAYOUT,
  selectionBannerAssetId: SELECTION_BANNER_ASSET_ID,
  selectClassChromeAssetId: SELECT_CLASS_CHROME_ASSET_ID,
  lockInChromeAssetId: LOCK_IN_CHROME_ASSET_ID,
  effectsRenderer: EFFECTS_RENDERER,
  contrastMode: CONTRAST_MODE,
  hud: HUD_PRESENTATION,
};
