import { ContentCatalogue } from '../content/ContentCatalogue';
import type { DisplayCatalogues, DisplayContent } from '../content/loadDisplayContent';
import { loadDisplayContent } from '../content/loadDisplayContent';
import type { ComposableAbility } from './AbilityRegistry.types';
import { createDefaultAbilityRegistry } from './defaultAbilityRegistry';

/**
 * The display content the client loads (`@eternalus/core` exports this as `loadDisplayContent`):
 * `content/loadDisplayContent` with each ability's overlay rows described by the shipped effect
 * strategies (`AbilityRegistry.describe`), so no loader knows an effect or shape kind. The
 * registry holds no abilities: only its strategies' descriptions are used, and a describe reads no
 * time, so the authored steps need no tick rate.
 *
 * @param catalogues - The catalogues (and the bot roster) to load; each one left out is the
 *   shipped one.
 * @throws ContentValidationError as `loadDisplayContent` does.
 */
export const loadShippedDisplayContent = (catalogues: DisplayCatalogues = {}): DisplayContent => {
  const strategies = createDefaultAbilityRegistry(new ContentCatalogue<ComposableAbility>([]));
  return loadDisplayContent((effects) => strategies.describe(effects), catalogues);
};
