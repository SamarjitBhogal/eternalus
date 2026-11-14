import type { EffectsRenderer } from '../bridge/catalogue.types';
import type { DisplayOverrides } from './content/CataloguePresentation.types';
import { NO_DISPLAY_OVERRIDES } from './content/coreCatalogue';

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
  /** `NO_DISPLAY_OVERRIDES` unless `isDeveloper`; then `fx=css` → `'css'`, `fx=raster` → `'figma-raster'`, any other `fx` → `null`. */
  readonly displayOverrides: DisplayOverrides;
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
    displayOverrides: { effectsRenderer: fx === null ? null : (FX_RENDERERS.get(fx) ?? null) },
  };
}
