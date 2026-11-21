import type { EffectsRenderer, UiEnhancementId } from '../bridge/catalogue.types';
import type { DisplayOverrides } from './content/CataloguePresentation.types';
import { NO_DISPLAY_OVERRIDES } from './content/coreCatalogue';
import { UI_ENHANCEMENT_IDS } from './content/screenPresentation';

/** The `fx` values a developer may pass, by the effects renderer each selects (DEC-54). */
const FX_RENDERERS: ReadonlyMap<string, EffectsRenderer> = new Map([
  ['css', 'css'],
  ['raster', 'figma-raster'],
]);

/**
 * What the developer query flag turns on for this page, decided once (13 §4; 13 §10: query form
 * until `settings.developer.menuEnabled` exists).
 */
export type DeveloperFlags = {
  /** `?dev=1`: the explorer chrome (`GameCanvas` `isExplorerShown`) and the display overrides are on. */
  readonly isDeveloper: boolean;
  /**
   * `NO_DISPLAY_OVERRIDES` unless `isDeveloper`; then `fx=css` → `'css'`, `fx=raster` →
   * `'figma-raster'`, any other `fx` → `null`; `ui=<id>,<id>` → the built ids it lists, once each
   * (`ui=` alone: none, every Figma original), no `ui` → `null` (ui-enhancements-plan §2 rule 1).
   */
  readonly displayOverrides: DisplayOverrides;
};

/** The built UI enhancements `ui` lists, in built order; unknown ids are dropped. */
const listedUiEnhancements = (ui: string | null): readonly UiEnhancementId[] | null => {
  if (ui === null) return null;
  const listed = new Set(ui.split(','));
  return UI_ENHANCEMENT_IDS.filter((id) => listed.has(id));
};

/**
 * Reads `search` (`location.search`) once; `main.tsx` is the only caller. The move to the
 * developer setting changes this function and its one call only.
 */
export function readDeveloperFlags(search: string): DeveloperFlags {
  const query = new URLSearchParams(search);
  if (query.get('dev') !== '1') {
    return { isDeveloper: false, displayOverrides: NO_DISPLAY_OVERRIDES };
  }
  const fx = query.get('fx');
  return {
    isDeveloper: true,
    displayOverrides: {
      effectsRenderer: fx === null ? null : (FX_RENDERERS.get(fx) ?? null),
      uiEnhancements: listedUiEnhancements(query.get('ui')),
    },
  };
}
